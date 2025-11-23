---
title: 'Example: Changing Field Type'
description: Breaking schema change requiring on-chain data migration
---

This example shows how to handle a **breaking change** (changing a field's type) with proper migration.

**Scenario:** Upgrade `balance` from `u64` to `u128` to support larger token amounts.

:::danger[Breaking Change]
Changing field types requires **on-chain data migration**. All existing accounts must be migrated or they become unreadable.
:::

---

## Initial Schema (v1.0.0)

**File:** `token_vault_v1.lumos`

```rust
#[solana]
#[account]
#[version("1.0.0")]
struct TokenVault {
    authority: PublicKey,
    token_mint: PublicKey,
    balance: u64,  // Limited to 18.4 quintillion
}
```

**Problem with `u64`:**
- Max value: `18,446,744,073,709,551,615` (18.4 quintillion)
- For tokens with 9 decimals (like SOL), this is ~18.4 billion tokens
- Some use cases need larger amounts (e.g., high-supply meme coins)

---

## Updated Schema (v2.0.0)

**File:** `token_vault_v2.lumos`

```rust
#[solana]
#[account]
#[version("2.0.0")]
struct TokenVault {
    authority: PublicKey,
    token_mint: PublicKey,
    balance: u128,  // Supports up to 340 undecillion
}
```

**Why `u128`?**
- Max value: `340,282,366,920,938,463,463,374,607,431,768,211,455`
- More than enough for any realistic token supply
- Future-proof for decades

---

## Verify Breaking Change

```bash
lumos diff token_vault_v1.lumos token_vault_v2.lumos

# Output:
# ⚠️  BREAKING CHANGES DETECTED:
#   - TokenVault.balance: type changed u64 → u128 (size: 8 bytes → 16 bytes)
#
# Recommendation: Increment MAJOR version (1.0.0 → 2.0.0)
# Migration Required: YES
# Estimated Migration Cost: Realloc from 72 bytes → 80 bytes (+8 bytes)
```

---

## Migration Strategy: Full Rewrite

Since we're changing an existing field, we need to:
1. Read old `u64` value
2. Extend it to `u128`
3. Write back to account (with `realloc` if needed)

### Migration Instruction (Anchor)

```rust
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod token_vault {
    use super::*;

    // Migration instruction (admin-only or user-callable)
    pub fn migrate_vault_to_v2(ctx: Context<MigrateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;

        // Vault already has space for u128 (account size unchanged in this case)
        // If size changed, use realloc (see below)

        // Read current balance as u64 from raw bytes
        let old_balance_bytes = ctx.accounts.vault.to_account_info().data.borrow()[64..72]
            .try_into()
            .unwrap();
        let old_balance = u64::from_le_bytes(old_balance_bytes);

        // Extend to u128 (no data loss since u64 fits in u128)
        vault.balance = old_balance as u128;

        msg!("Migrated vault balance: {} (u64) → {} (u128)",
             old_balance,
             vault.balance);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MigrateVault<'info> {
    #[account(
        mut,
        has_one = authority,  // Only vault authority can migrate
    )]
    pub vault: Account<'info, TokenVault>,

    pub authority: Signer<'info>,
}

#[account]
pub struct TokenVault {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub balance: u128,
}
```

---

## Account Size Considerations

### If Size Changes (Requires Realloc)

```rust
#[derive(Accounts)]
pub struct MigrateVaultWithRealloc<'info> {
    #[account(
        mut,
        realloc = 8 + 32 + 32 + 16,  // discriminator + authority + mint + u128
        realloc::payer = authority,
        realloc::zero = false,  // Preserve existing data
    )]
    pub vault: Account<'info, TokenVault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn migrate_vault_v2_with_realloc(ctx: Context<MigrateVaultWithRealloc>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // Read old u64 value before realloc overwrites
    let account_data = ctx.accounts.vault.to_account_info().data.borrow();
    let old_balance = u64::from_le_bytes(
        account_data[64..72].try_into().unwrap()
    );
    drop(account_data);  // Release borrow

    // After realloc, write new u128 value
    vault.balance = old_balance as u128;

    // Charge rent for additional 8 bytes
    let rent = Rent::get()?;
    let new_rent = rent.minimum_balance(vault.to_account_info().data_len());
    let current_lamports = vault.to_account_info().lamports();

    if new_rent > current_lamports {
        let additional_rent = new_rent - current_lamports;
        msg!("Additional rent required: {} lamports", additional_rent);
    }

    Ok(())
}
```

---

## TypeScript SDK Updates

### Old SDK (v1.0.0)

```typescript
interface TokenVault {
  authority: PublicKey;
  tokenMint: PublicKey;
  balance: number;  // JavaScript number (safe up to 2^53-1)
}

const vaultSchema = borsh.struct([
  borsh.publicKey('authority'),
  borsh.publicKey('tokenMint'),
  borsh.u64('balance'),
]);
```

### New SDK (v2.0.0)

```typescript
interface TokenVault {
  authority: PublicKey;
  tokenMint: PublicKey;
  balance: bigint;  // ⚠️ BREAKING: Changed from number to bigint
}

const vaultSchema = borsh.struct([
  borsh.publicKey('authority'),
  borsh.publicKey('tokenMint'),
  borsh.u128('balance'),
]);
```

:::caution[TypeScript Breaking Change]
Changing from `number` to `bigint` is a **breaking change** in your TypeScript SDK. Existing client code must update all balance references.
:::

**Client Code Updates Required:**
```typescript
// OLD (v1):
if (vault.balance > 1000) { ... }

// NEW (v2):
if (vault.balance > 1000n) { ... }  // Note the 'n' suffix

// Formatting
console.log(`Balance: ${vault.balance / BigInt(1e9)n} tokens`);
```

---

## Migration Script (TypeScript)

Migrate all vaults programmatically:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

async function migrateAllVaults(
  program: Program,
  vaultPubkeys: PublicKey[]
) {
  console.log(`Migrating ${vaultPubkeys.length} vaults...`);

  for (const vaultPubkey of vaultPubkeys) {
    try {
      // Check if already migrated
      const vault = await program.account.tokenVault.fetch(vaultPubkey);

      // If balance fits in u64, might be old version
      // (This heuristic isn't perfect, better to track version on-chain)

      const tx = await program.methods
        .migrateVaultToV2()
        .accounts({
          vault: vaultPubkey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      console.log(`✅ Migrated ${vaultPubkey.toBase58()}: ${tx}`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${vaultPubkey.toBase58()}:`, err);
    }
  }
}
```

---

## Testing

### Unit Test: Migration Logic

```rust
#[test]
fn test_u64_to_u128_migration() {
    let old_balance: u64 = 1_000_000_000;  // 1 billion
    let new_balance: u128 = old_balance as u128;

    assert_eq!(new_balance, 1_000_000_000_u128);

    // Verify no data loss
    assert_eq!(old_balance, new_balance as u64);
}

#[test]
fn test_large_u128_values() {
    let large_balance: u128 = u64::MAX as u128 + 1_000_000;

    // This would overflow u64
    assert!(large_balance > u64::MAX as u128);

    // But fits comfortably in u128
    assert!(large_balance < u128::MAX);
}
```

### Integration Test: Full Migration

```rust
#[tokio::test]
async fn test_vault_migration_on_localnet() {
    let mut context = /* setup ProgramTest */;

    // 1. Create vault with v1 schema
    let vault = create_vault_v1(&mut context, 500_000).await.unwrap();

    // 2. Deploy v2 program
    upgrade_program(&mut context, "v2_program").await.unwrap();

    // 3. Migrate vault
    migrate_vault(&mut context, &vault).await.unwrap();

    // 4. Verify balance preserved
    let migrated_vault = get_vault(&mut context, &vault).await.unwrap();
    assert_eq!(migrated_vault.balance, 500_000_u128);
}
```

---

## Deployment Plan

### Phase 1: Deploy v2 Program (Week 1)

```bash
# Build v2 program
anchor build

# Deploy to devnet first
anchor deploy --provider.cluster devnet

# Test migration on devnet clones
# (Clone mainnet vaults to devnet, test migration)
```

---

### Phase 2: Notify Users (Week 2-3)

**Communication Channels:**
- 📧 Email: All authority holders
- 🐦 Twitter: Public announcement
- 📖 Docs: Migration guide published
- 💬 Discord: Support channel

**Message Template:**
```
⚠️ TokenVault Upgrade Required

We're upgrading TokenVault to support larger balances (u64 → u128).

Action Required:
1. Visit https://example.com/migrate
2. Click "Migrate Vault" for each vault
3. Confirm transaction (rent cost: ~0.0001 SOL)

Timeline:
- Now - Feb 28: Migration available
- Mar 1: Old vaults become read-only
- Mar 31: Old vaults deprecated

Need help? Join our Discord: https://discord.gg/...
```

---

### Phase 3: Migration Window (Week 4-8)

```typescript
// Provide web UI for migration
async function migrateSingleVault(vaultPubkey: PublicKey) {
  setStatus('Migrating...');

  try {
    const tx = await program.methods
      .migrateVaultToV2()
      .accounts({ vault: vaultPubkey, authority: wallet.publicKey })
      .rpc();

    setStatus(`✅ Migrated! TX: ${tx}`);
  } catch (err) {
    setStatus(`❌ Migration failed: ${err.message}`);
  }
}
```

---

### Phase 4: Verify & Monitor

```typescript
// Track migration progress
const allVaults = await program.account.tokenVault.all();
const migratedCount = allVaults.filter(v =>
  v.account.balance > BigInt(u64Max)  // Heuristic
).length;

console.log(`Migration Progress: ${migratedCount}/${allVaults.length}`);
```

---

## Rollback Plan

**If migration causes critical issues:**

1. **Immediate:** Pause all migrations
   ```rust
   pub fn pause_migrations(ctx: Context<AdminPause>) -> Result<()> {
       ctx.accounts.config.migrations_paused = true;
       Ok(())
   }
   ```

2. **Redeploy v1 program** (within 1 hour)
   ```bash
   solana program deploy vault_v1.so --program-id <PROGRAM_ID>
   ```

3. **Reverse migrated vaults** (if needed)
   ```rust
   pub fn rollback_vault_to_v1(ctx: Context<RollbackVault>) -> Result<()> {
       let vault = &mut ctx.accounts.vault;

       // Check if balance fits in u64
       require!(vault.balance <= u64::MAX as u128, ErrorCode::RollbackDataLoss);

       // Truncate to u64 (write only lower 8 bytes)
       // ... rollback logic ...

       Ok(())
   }
   ```

:::danger[Rollback Risk]
If any vault has `balance > u64::MAX`, rollback will cause **data loss**. Only rollback if no vaults exceed u64 max.
:::

---

## Production Checklist

- [ ] **Version incremented** (1.0.0 → 2.0.0)
- [ ] **Migration instruction tested** on localnet
- [ ] **Migration instruction tested** on devnet clones
- [ ] **TypeScript SDK updated** (number → bigint)
- [ ] **Breaking change documented** in CHANGELOG
- [ ] **User notification sent** (email, Twitter, Discord)
- [ ] **Migration timeline communicated** (4-8 weeks recommended)
- [ ] **Web UI built** for easy migration
- [ ] **Monitoring dashboard** ready
- [ ] **Rollback plan documented** and tested
- [ ] **Admin pause implemented** (emergency stop)
- [ ] **Rent costs calculated** (if realloc needed)

---

## Key Takeaways

🔴 **This is a MAJOR version bump** (breaking change)
🔴 **Requires on-chain migration** (all existing accounts)
🔴 **TypeScript SDK is also breaking** (number → bigint)
✅ **No data loss** (u64 → u128 is safe expansion)
✅ **Comprehensive testing** prevents disasters
✅ **Clear communication** ensures smooth transition

---

## Next Steps

- 📖 [Schema Versioning Guide](/guides/versioning) - Understanding breaking changes
- 📖 [Schema Migrations Guide](/guides/schema-migrations) - Migration strategies
- 📖 [Adding Optional Field](/examples/versioning/adding-optional-field) - Non-breaking alternative

---

**Breaking changes require careful planning and execution. Test extensively before mainnet deployment.** ⚠️
