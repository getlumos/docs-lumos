---
title: 'Example: Adding Optional Field'
description: Safe, non-breaking schema change by adding an optional field at the end
---

This example shows how to safely add a new field to your schema without breaking existing on-chain accounts.

**Scenario:** Add a `nickname` field to `PlayerAccount` without requiring data migration.

---

## Initial Schema (v1.0.0)

**File:** `player_v1.lumos`

```rust
#[solana]
#[account]
#[version("1.0.0")]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
}

// Account size: 8 (discriminator) + 32 + 2 + 8 = 50 bytes
```

**Generated TypeScript:**
```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface PlayerAccount {
  wallet: PublicKey;
  level: number;
  experience: number;
}

export const PlayerAccountBorshSchema = borsh.struct([
  borsh.publicKey('wallet'),
  borsh.u16('level'),
  borsh.u64('experience'),
]);
```

---

## Updated Schema (v1.1.0)

**File:** `player_v1.1.lumos`

```rust
#[solana]
#[account]
#[version("1.1.0")]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
    nickname: Option<String>,  // ✅ New optional field at end
}
```

**Why This is Safe:**
- ✅ **Old accounts deserialize correctly** - Missing field defaults to `None`
- ✅ **No byte layout change** for existing fields
- ✅ **Backward compatible** - v1.0.0 programs can read v1.1.0 data (just ignore nickname)
- ✅ **No migration required** - Existing accounts work immediately

---

## Verify Safety with `lumos diff`

```bash
lumos diff player_v1.lumos player_v1.1.lumos

# Output:
# Non-Breaking Changes:
#   + PlayerAccount.nickname: Option<String> (new field)
#
# Recommendation: Increment MINOR version (1.0.0 → 1.1.0)
# Migration Required: No
```

---

## Generated Code Changes

**New Rust:**
```rust
#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
    pub nickname: Option<String>,  // New field
}

// New size: 8 + 32 + 2 + 8 + (1 + 4 + N) bytes
// - 1 byte: Option discriminant (0 = None, 1 = Some)
// - 4 bytes: String length prefix
// - N bytes: String data (variable)
```

**New TypeScript:**
```typescript
export interface PlayerAccount {
  wallet: PublicKey;
  level: number;
  experience: number;
  nickname: string | undefined;  // New field
}

export const PlayerAccountBorshSchema = borsh.struct([
  borsh.publicKey('wallet'),
  borsh.u16('level'),
  borsh.u64('experience'),
  borsh.option(borsh.string(), 'nickname'),  // New field
]);
```

---

## Deserialization Behavior

### Old Account (v1.0.0) Read by New Program (v1.1.0)

```rust
// Account data (50 bytes): [wallet][level][experience]
// No nickname field present

let account = PlayerAccount::try_from_slice(&data)?;
// ✅ Succeeds!

assert_eq!(account.nickname, None);  // Defaults to None
```

**How Borsh Handles This:**
- `Option<T>` is encoded as: `1 byte discriminant + T data (if Some)`
- If bytes don't exist, Borsh deserializes as `None`
- No error, clean default behavior

---

## Program Logic Updates

### Creating New Accounts (v1.1.0)

```rust
pub fn create_player(
    ctx: Context<CreatePlayer>,
    nickname: Option<String>
) -> Result<()> {
    let player = &mut ctx.accounts.player;

    player.wallet = ctx.accounts.signer.key();
    player.level = 1;
    player.experience = 0;
    player.nickname = nickname;  // ✅ Can be None or Some

    Ok(())
}
```

### Reading Existing Accounts

```rust
pub fn get_display_name(player: &PlayerAccount) -> String {
    player.nickname.clone().unwrap_or_else(|| {
        // Fallback for old accounts without nickname
        format!("Player {}", &player.wallet.to_string()[..8])
    })
}
```

### Updating Nickname

```rust
pub fn set_nickname(
    ctx: Context<SetNickname>,
    nickname: String
) -> Result<()> {
    let player = &mut ctx.accounts.player;

    // Works for both old and new accounts
    player.nickname = Some(nickname);

    Ok(())
}
```

---

## TypeScript SDK Updates

### Fetching Accounts

```typescript
// Old accounts (v1.0.0)
const player = await program.account.playerAccount.fetch(playerPubkey);
console.log(player.nickname);  // undefined (old account)

// New accounts (v1.1.0)
const newPlayer = await program.account.playerAccount.fetch(newPlayerPubkey);
console.log(newPlayer.nickname);  // "CryptoKnight" (new account)
```

### Display Logic

```typescript
function getDisplayName(player: PlayerAccount): string {
  return player.nickname ?? `Player ${player.wallet.toBase58().slice(0, 8)}`;
}
```

---

## Account Reallocation (If Needed)

If you want to add data to existing accounts (e.g., set nickname for old accounts):

```rust
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetNicknameWithRealloc<'info> {
    #[account(
        mut,
        realloc = 8 + 32 + 2 + 8 + 1 + 4 + 20,  // Max nickname: 20 chars
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub player: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn set_nickname_with_realloc(
    ctx: Context<SetNicknameWithRealloc>,
    nickname: String,
) -> Result<()> {
    require!(nickname.len() <= 20, ErrorCode::NicknameTooLong);

    let player = &mut ctx.accounts.player;
    player.nickname = Some(nickname);

    Ok(())
}
```

**Rent Cost for Realloc:**
```typescript
// Calculate rent for 20-character nickname
const additionalBytes = 1 + 4 + 20;  // Option + length + data
const rentPerByte = await connection.getMinimumBalanceForRentExemption(1) -
                    await connection.getMinimumBalanceForRentExemption(0);
const totalRent = rentPerByte * additionalBytes;
console.log(`Rent cost: ${totalRent / LAMPORTS_PER_SOL} SOL`);
```

---

## Testing

### Backward Compatibility Test

```rust
#[test]
fn test_old_account_deserializes_with_new_schema() {
    use borsh::{BorshSerialize, BorshDeserialize};
    use solana_program::pubkey::Pubkey;

    // Simulate v1.0.0 account (no nickname)
    #[derive(BorshSerialize, BorshDeserialize)]
    struct PlayerAccountV1 {
        wallet: Pubkey,
        level: u16,
        experience: u64,
    }

    let v1_account = PlayerAccountV1 {
        wallet: Pubkey::new_unique(),
        level: 10,
        experience: 500,
    };

    let bytes = borsh::to_vec(&v1_account).unwrap();

    // Deserialize with v1.1.0 schema
    let v1_1_account = PlayerAccount::try_from_slice(&bytes).unwrap();

    assert_eq!(v1_1_account.wallet, v1_account.wallet);
    assert_eq!(v1_1_account.level, 10);
    assert_eq!(v1_1_account.experience, 500);
    assert_eq!(v1_1_account.nickname, None);  // ✅ Defaults to None
}
```

---

## Deployment Checklist

- [x] **Version incremented** (1.0.0 → 1.1.0)
- [x] **Optional field added at end** (not in middle)
- [x] **`lumos diff` shows non-breaking** change
- [x] **Backward compatibility tested**
- [x] **Program logic handles `None` case**
- [x] **TypeScript SDK regenerated**
- [x] **Docs updated** with new field
- [ ] **Deploy to devnet** for final testing
- [ ] **Deploy to mainnet**

---

## Key Takeaways

✅ **Always append optional fields** - Never insert in middle
✅ **Use `Option<T>` for new fields** - Allows backward compatibility
✅ **Test old accounts deserialize** - Write compatibility tests
✅ **Handle `None` gracefully** - Provide sensible defaults
✅ **This is a MINOR version bump** - Not breaking

---

## Next Steps

- 📖 [Schema Versioning Guide](/guides/versioning) - Full versioning rules
- 📖 [Changing Field Type Example](/examples/versioning/changing-field-type) - Breaking change
- 📖 [Deprecating Field Example](/examples/versioning/deprecating-field) - Phased migration

---

**This pattern is production-ready and safe for mainnet deployments.** 🚀
