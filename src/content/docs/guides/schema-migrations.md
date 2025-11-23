---
title: Schema Migrations & Data Migration
description: Practical strategies for migrating on-chain Solana account data between schema versions
---

When you need to make breaking changes to your schemas, you'll need a migration strategy to update existing on-chain accounts. This guide covers proven patterns for safe data migrations.

**What You'll Learn:**
- ✅ **Migration Strategies** - When to use each approach
- ✅ **Account Versioning** - Track schema versions on-chain
- ✅ **Automated Migrations** - Use LUMOS-generated code
- ✅ **Testing** - Validate migrations before mainnet
- ✅ **Rollback Plans** - Recover from failed migrations

---

## When You Need Migration

You need a migration strategy when making **breaking changes**:

| Change | Migration Required? | Strategy |
|--------|---------------------|----------|
| Add optional field at end | ❌ No | Backward-compatible |
| Change field type | ✅ Yes | Rewrite or dual-schema |
| Remove field | ✅ Yes | Dual-schema (deprecation) |
| Reorder fields | ✅ Yes | Rewrite |
| Change `u64` → `Option<u64>` | ✅ Yes | Rewrite (adds discriminant byte) |
| Add enum variant | ❌ No | Backward-compatible |

:::tip[Avoid Migrations When Possible]
Always prefer backward-compatible changes (adding optional fields) over breaking changes that require migrations.
:::

---

## Migration Strategy Overview

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Rewrite** | Small number of accounts (< 1000) | Simple, complete in one tx | Expensive (rent + compute) |
| **Dual-Schema** | Gradual rollout, many accounts | Users migrate at own pace | Program complexity |
| **Lazy Migration** | Accounts rarely accessed | Low upfront cost | Migration happens on access |
| **Version Discriminator** | Complex multi-version support | Supports many versions | Highest complexity |

---

## Strategy 1: Full Rewrite Migration

**Use When:** < 1000 accounts, simple change, can afford rent cost

### How It Works

1. Deploy new program version with updated schema
2. Provide migration instruction
3. Admin or users call migration instruction
4. Instruction reads old data, writes new data

### Example: Change Field Type

**Before (v1.0.0):**
```rust
#[solana]
#[account]
#[version("1.0.0")]
struct StakingPool {
    authority: PublicKey,
    total_staked: u64,  // Limited to 18.4 quintillion
}
```

**After (v2.0.0):**
```rust
#[solana]
#[account]
#[version("2.0.0")]
struct StakingPool {
    authority: PublicKey,
    total_staked: u128,  // Support much larger amounts
}
```

**Migration Instruction (Anchor):**
```rust
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct MigrateStakingPool<'info> {
    #[account(
        mut,
        realloc = StakingPoolV2::LEN,
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub pool: Account<'info, StakingPoolV2>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn migrate_staking_pool_v2(ctx: Context<MigrateStakingPool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Read old u64 value (still valid before rewrite)
    let old_total_staked = u64::from_le_bytes(
        pool.to_account_info().data.borrow()[40..48]
            .try_into()
            .unwrap()
    );

    // Write new u128 value (extends old value)
    pool.total_staked = old_total_staked as u128;

    msg!("Migrated pool: {} → {}", old_total_staked, pool.total_staked);
    Ok(())
}
```

**Key Points:**
- Use `realloc` if account size changes
- Read old data before overwriting
- Validate migration in same transaction
- Emit logs for debugging

---

## Strategy 2: Dual-Schema Migration

**Use When:** Many accounts (> 1000), gradual rollout needed

### How It Works

1. Add new field alongside old field
2. Write to both fields for a transition period
3. Read from new field if present, else old field
4. After migration period, remove old field

### Example: Rename Field

**Phase 1 - v1.1.0 (Dual Fields):**
```rust
#[solana]
#[account]
#[version("1.1.0")]
struct UserProfile {
    wallet: PublicKey,

    #[deprecated("Use 'email_address' instead")]
    email: Option<String>,

    email_address: Option<String>,  // New field
}
```

**Program Logic - Write to Both:**
```rust
pub fn update_email(ctx: Context<UpdateProfile>, new_email: String) -> Result<()> {
    let profile = &mut ctx.accounts.profile;

    // Write to BOTH fields during transition
    profile.email = Some(new_email.clone());
    profile.email_address = Some(new_email);

    Ok(())
}
```

**Program Logic - Read from New:**
```rust
pub fn get_email(profile: &UserProfile) -> Option<String> {
    // Prefer new field, fall back to old
    profile.email_address.clone()
        .or_else(|| profile.email.clone())
}
```

**Phase 2 - v1.2.0 (Migration Instruction):**
```rust
pub fn migrate_email_field(ctx: Context<MigrateProfile>) -> Result<()> {
    let profile = &mut ctx.accounts.profile;

    if profile.email_address.is_none() && profile.email.is_some() {
        profile.email_address = profile.email.clone();
        msg!("Migrated email for {}", profile.wallet);
    }

    Ok(())
}
```

**Phase 3 - v2.0.0 (Remove Old Field):**
```rust
#[solana]
#[account]
#[version("2.0.0")]
struct UserProfile {
    wallet: PublicKey,
    email_address: Option<String>,  // Only new field remains
}
```

:::caution[Timeline Recommendations]
- **Phase 1 → 2:** 1-2 months (give time for adoption)
- **Phase 2 → 3:** 3-6 months (ensure all accounts migrated)
:::

---

## Strategy 3: Lazy Migration

**Use When:** Accounts rarely accessed, migration cost should be deferred

### How It Works

- Don't migrate upfront
- Detect version on each account access
- Migrate inline when account is used
- Eventually all active accounts migrate

### Example: Version Discriminator

```rust
#[solana]
#[account]
struct PlayerAccount {
    schema_version: u8,  // 1 = v1, 2 = v2
    wallet: PublicKey,
    balance: u64,  // v1: u64, v2: u128
}

pub fn process_player_action(ctx: Context<PlayerAction>) -> Result<()> {
    let player = &mut ctx.accounts.player;

    // Lazy migration on access
    match player.schema_version {
        1 => {
            // Migrate from v1 to v2
            msg!("Migrating player from v1 to v2");
            player.schema_version = 2;
            // Extend balance from u64 to u128 (no data loss)
            // The balance field already contains correct u64 value
        }
        2 => {
            // Already v2, no migration needed
        }
        _ => return Err(ErrorCode::UnsupportedSchemaVersion.into()),
    }

    // Continue with business logic
    player.balance += 100;
    Ok(())
}
```

**Pros:**
- Zero upfront cost
- Migrates only active accounts
- Inactive accounts stay old (saves rent)

**Cons:**
- Every instruction needs version check
- Migration happens during user transactions
- Program logic more complex

---

## Strategy 4: Version Discriminator Pattern

**Use When:** Need to support multiple schema versions simultaneously

### Full Implementation

```rust
// Shared version enum
#[derive(BorshSerialize, BorshDeserialize, Clone, Copy)]
pub enum SchemaVersion {
    V1 = 1,
    V2 = 2,
    V3 = 3,
}

// V1 schema
#[derive(BorshSerialize, BorshDeserialize)]
pub struct PlayerAccountV1 {
    pub wallet: Pubkey,
    pub balance: u64,
}

// V2 schema (added level field)
#[derive(BorshSerialize, BorshDeserialize)]
pub struct PlayerAccountV2 {
    pub wallet: Pubkey,
    pub balance: u64,
    pub level: u16,
}

// V3 schema (balance is now u128)
#[derive(BorshSerialize, BorshDeserialize)]
pub struct PlayerAccountV3 {
    pub wallet: Pubkey,
    pub balance: u128,
    pub level: u16,
}

// Wrapper that handles all versions
pub struct PlayerAccount {
    version: SchemaVersion,
    data: PlayerAccountData,
}

pub enum PlayerAccountData {
    V1(PlayerAccountV1),
    V2(PlayerAccountV2),
    V3(PlayerAccountV3),
}

impl PlayerAccount {
    pub fn load(data: &[u8]) -> Result<Self> {
        let version: SchemaVersion = borsh::from_slice(&data[0..1])?;

        match version {
            SchemaVersion::V1 => {
                let v1 = borsh::from_slice::<PlayerAccountV1>(&data[1..])?;
                Ok(Self { version, data: PlayerAccountData::V1(v1) })
            }
            SchemaVersion::V2 => {
                let v2 = borsh::from_slice::<PlayerAccountV2>(&data[1..])?;
                Ok(Self { version, data: PlayerAccountData::V2(v2) })
            }
            SchemaVersion::V3 => {
                let v3 = borsh::from_slice::<PlayerAccountV3>(&data[1..])?;
                Ok(Self { version, data: PlayerAccountData::V3(v3) })
            }
        }
    }

    pub fn get_balance(&self) -> u128 {
        match &self.data {
            PlayerAccountData::V1(v1) => v1.balance as u128,
            PlayerAccountData::V2(v2) => v2.balance as u128,
            PlayerAccountData::V3(v3) => v3.balance,
        }
    }

    pub fn migrate_to_latest(&mut self) {
        loop {
            match self.version {
                SchemaVersion::V1 => {
                    if let PlayerAccountData::V1(v1) = &self.data {
                        // Migrate V1 → V2 (add level field)
                        let v2 = PlayerAccountV2 {
                            wallet: v1.wallet,
                            balance: v1.balance,
                            level: 1,  // Default level
                        };
                        self.data = PlayerAccountData::V2(v2);
                        self.version = SchemaVersion::V2;
                    }
                }
                SchemaVersion::V2 => {
                    if let PlayerAccountData::V2(v2) = &self.data {
                        // Migrate V2 → V3 (extend balance to u128)
                        let v3 = PlayerAccountV3 {
                            wallet: v2.wallet,
                            balance: v2.balance as u128,
                            level: v2.level,
                        };
                        self.data = PlayerAccountData::V3(v3);
                        self.version = SchemaVersion::V3;
                    }
                }
                SchemaVersion::V3 => break,  // Latest version
            }
        }
    }
}
```

---

## Automatic Migration Code Generation

LUMOS can generate migration code when using `#[version]`:

```bash
# Generate diff between versions
lumos diff player_v1.lumos player_v2.lumos --output-migration migration.rs

# Generated migration.rs:
#
# pub fn migrate_v1_to_v2(account: &mut PlayerAccount) {
#     // Auto-generated migration logic
#     account.level = 1;  // New field with default
# }
```

**Generated migration includes:**
- Field additions with defaults
- Type conversions (e.g., `u64` → `u128`)
- Field removals (warns if data loss)
- Reordering fixes

:::tip[Review Generated Code]
Always review auto-generated migrations before deploying. LUMOS makes best guesses, but you know your data best.
:::

---

## Testing Migrations

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrate_v1_to_v2() {
        let v1_account = PlayerAccountV1 {
            wallet: Pubkey::new_unique(),
            balance: 1000,
        };

        let v1_bytes = borsh::to_vec(&v1_account).unwrap();

        // Simulate migration
        let mut account = PlayerAccount::load(&v1_bytes).unwrap();
        account.migrate_to_latest();

        assert_eq!(account.version, SchemaVersion::V2);
        assert_eq!(account.get_balance(), 1000);
    }

    #[test]
    fn test_no_data_loss() {
        let wallet = Pubkey::new_unique();

        // Create v1
        let v1 = PlayerAccountV1 {
            wallet,
            balance: 999_999_999,
        };

        // Migrate to v2
        let v1_bytes = borsh::to_vec(&v1).unwrap();
        let mut account = PlayerAccount::load(&v1_bytes).unwrap();
        account.migrate_to_latest();

        // Verify no data loss
        if let PlayerAccountData::V2(v2) = &account.data {
            assert_eq!(v2.wallet, wallet);
            assert_eq!(v2.balance, 999_999_999);
        } else {
            panic!("Migration failed");
        }
    }
}
```

---

### Integration Tests (LocalNet)

```rust
#[tokio::test]
async fn test_migration_on_localnet() {
    let mut context = ProgramTest::new(
        "my_program",
        my_program::ID,
        processor!(my_program::entry),
    ).start_with_context().await;

    // 1. Create account with v1 schema
    let player = Keypair::new();
    create_player_account_v1(&mut context, &player).await.unwrap();

    // 2. Deploy v2 program
    upgrade_program(&mut context, "v2_program").await.unwrap();

    // 3. Call migration instruction
    migrate_player_to_v2(&mut context, &player.pubkey()).await.unwrap();

    // 4. Verify v2 account
    let account = get_player_account(&mut context, &player.pubkey()).await.unwrap();
    assert_eq!(account.schema_version, 2);
}
```

---

### Mainnet Dry Run

Before migrating on mainnet:

1. **Clone accounts to devnet:**
   ```bash
   solana account <ACCOUNT_PUBKEY> --output json > account.json
   # Load into devnet test environment
   ```

2. **Test migration on cloned data**
3. **Verify no errors**
4. **Check account balance changes** (rent)

---

## Rollback Strategies

### Immediate Rollback (< 1 hour)

**If migration fails immediately:**

```bash
# 1. Revert program deployment
solana program deploy old_program.so --program-id <PROGRAM_ID>

# 2. (Optional) Run reverse migration if some accounts already migrated
# Requires you to have written reverse migration logic
```

---

### Partial Rollback

**If some accounts migrated, some failed:**

```rust
pub fn rollback_migration(ctx: Context<RollbackMigration>) -> Result<()> {
    let account = &mut ctx.accounts.account;

    // Only rollback if actually migrated
    if account.schema_version == 2 {
        // Reverse the migration
        account.schema_version = 1;
        // Truncate u128 back to u64 (CHECK FOR DATA LOSS!)
        if account.balance > u64::MAX as u128 {
            return Err(ErrorCode::RollbackDataLoss.into());
        }
        msg!("Rolled back account to v1");
    }

    Ok(())
}
```

:::danger[Rollback Data Loss Risk]
Rollback may cause data loss if new schema supports larger data ranges (e.g., `u128` → `u64`). Always check before rolling back.
:::

---

### Emergency Circuit Breaker

Add emergency pause to all instructions:

```rust
#[account]
pub struct ProgramConfig {
    pub migration_paused: bool,
}

pub fn process_instruction(ctx: Context<Process>) -> Result<()> {
    let config = &ctx.accounts.config;

    if config.migration_paused {
        return Err(ErrorCode::MigrationPaused.into());
    }

    // Normal logic
    Ok(())
}

// Emergency pause (admin only)
pub fn pause_migration(ctx: Context<AdminOnly>) -> Result<()> {
    ctx.accounts.config.migration_paused = true;
    msg!("Migration paused by admin");
    Ok(())
}
```

---

## Migration Checklist

Before deploying schema migration to mainnet:

- [ ] **Version incremented** in schema file
- [ ] **Migration instruction written** and tested
- [ ] **Unit tests pass** (v1 → v2 migration)
- [ ] **Integration tests pass** (localnet)
- [ ] **Dry run on cloned mainnet data** (devnet)
- [ ] **Rollback plan documented** with code ready
- [ ] **User notification sent** (email, Discord, Twitter)
- [ ] **Timeline communicated** (when old version stops working)
- [ ] **Admin keys secured** (for emergency pause)
- [ ] **Monitoring setup** (track migration progress)
- [ ] **Rent costs calculated** (if `realloc` needed)
- [ ] **Circuit breaker implemented** (emergency pause)

---

## Monitoring Migration Progress

Track how many accounts have migrated:

```rust
#[account]
pub struct MigrationStats {
    pub total_accounts: u64,
    pub migrated_to_v2: u64,
    pub failed_migrations: u64,
}

pub fn update_migration_stats(ctx: Context<UpdateStats>, success: bool) -> Result<()> {
    let stats = &mut ctx.accounts.stats;

    if success {
        stats.migrated_to_v2 += 1;
    } else {
        stats.failed_migrations += 1;
    }

    msg!("Migration progress: {}/{}",
         stats.migrated_to_v2,
         stats.total_accounts);

    Ok(())
}
```

**Dashboard Query:**
```typescript
const stats = await program.account.migrationStats.fetch(STATS_PUBKEY);
console.log(`Migrated: ${stats.migratedToV2} / ${stats.totalAccounts}`);
console.log(`Failed: ${stats.failedMigrations}`);
console.log(`Progress: ${(stats.migratedToV2 / stats.totalAccounts * 100).toFixed(2)}%`);
```

---

## Real-World Example: Token Metadata Migration

**Metaplex Token Metadata** migrated from v1 to v2 schema. Here's how:

1. **V1 Schema:** 679 bytes
2. **V2 Schema:** 679 bytes (same size, different fields)
3. **Strategy:** Lazy migration (migrate on first access)
4. **Timeline:** 6 months transition period
5. **Result:** 99.8% of active tokens migrated within 3 months

**Key Takeaways:**
- Same-size migrations avoid `realloc` costs
- Lazy migration works well for high-activity accounts
- Long timeline gives ecosystem time to adapt

---

## Next Steps

- 📖 [Schema Versioning Guide](/guides/versioning) - Understanding breaking changes
- 📖 [Adding Optional Field Example](/examples/versioning/adding-optional-field) - Safe migration
- 📖 [Changing Field Type Example](/examples/versioning/changing-field-type) - Breaking migration
- 📖 [CLI Commands](/api/cli-commands) - CLI commands reference

---

**Remember:** Migrations are risky. Test extensively, communicate clearly, and always have a rollback plan.
