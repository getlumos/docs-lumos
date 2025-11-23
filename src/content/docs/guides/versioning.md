---
title: Schema Versioning & Evolution
description: Complete guide to versioning LUMOS schemas and managing breaking changes
---

Schema versioning is critical for production Solana programs. This guide shows you how to evolve your data structures safely over time without breaking existing on-chain accounts.

**Key Benefits:**
- ✅ **Prevent Data Loss** - Avoid breaking existing on-chain accounts
- ✅ **Track Changes** - Know exactly what changed between versions
- ✅ **Backwards Compatibility** - Support old data with new code
- ✅ **Safe Deployments** - Catch breaking changes before production

---

## Why Schema Versioning Matters

On-chain Solana accounts are **permanent**. Once you deploy a program and users create accounts, that data structure is set in stone. Changing it carelessly can:

- ❌ **Corrupt user data** - Deserialization fails silently
- ❌ **Lock funds** - Accounts become inaccessible
- ❌ **Break integrations** - TypeScript SDKs can't read data
- ❌ **Require complex migrations** - Costly on-chain rewrites

**LUMOS provides versioning tools to prevent these disasters.**

---

## Semantic Versioning for Schemas

LUMOS follows [Semantic Versioning (SemVer)](https://semver.org/) adapted for data schemas:

```
MAJOR.MINOR.PATCH
  ↓     ↓     ↓
  1  .  2  .  3
```

### Version Components

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| **MAJOR** | Breaking change that requires data migration | Changing field type `u64` → `u128` |
| **MINOR** | Backward-compatible addition | Adding `Option<String>` field |
| **PATCH** | Documentation/comment changes only | Updating field description |

### Version Tracking with `#[version]`

Add version tracking to any struct or enum:

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

**LUMOS will:**
1. Embed version in generated code comments
2. Validate version format (must be `MAJOR.MINOR.PATCH`)
3. Track version changes in `lumos diff` output
4. Generate changelog entries automatically

---

## Breaking vs Non-Breaking Changes

Understanding what constitutes a breaking change is **critical** for safe schema evolution.

### 🔴 Breaking Changes (Increment MAJOR)

These changes **require on-chain data migration**:

| Change Type | Example | Why Breaking |
|-------------|---------|--------------|
| **Change field type** | `u64` → `u128` | Different byte size |
| **Remove field** | Delete `email: String` | Missing data in deserialization |
| **Reorder fields** | Swap field 1 and 2 | Borsh is order-dependent |
| **Rename field** | `wallet` → `owner` | Breaks TypeScript SDK |
| **Change array to scalar** | `[u32]` → `u32` | Different Borsh encoding |
| **Make required field optional** | `u64` → `Option<u64>` | Adds 1-byte discriminant |
| **Make optional field required** | `Option<u64>` → `u64` | Old data has `None` |
| **Change enum discriminants** | Reorder variants | Discriminants change |

**Example - Breaking Change:**
```rust
// v1.0.0
#[version("1.0.0")]
struct Account {
    balance: u64,  // 8 bytes
}

// v2.0.0 - BREAKING!
#[version("2.0.0")]
struct Account {
    balance: u128,  // 16 bytes (incompatible)
}
```

---

### 🟢 Non-Breaking Changes (Increment MINOR)

These changes are **backward-compatible** (old data still deserializes):

| Change Type | Example | Why Safe |
|-------------|---------|----------|
| **Add optional field at end** | Add `nickname: Option<String>` | Old data = `None` |
| **Add enum variant** | Add `Status::Pending` | Old data doesn't use it |
| **Deprecate field** | Mark `old_email` deprecated | Field still exists |
| **Add documentation** | Add `/// Balance in lamports` | No code change |
| **Add validation comments** | Add warnings | No serialization change |

**Example - Non-Breaking Change:**
```rust
// v1.0.0
#[version("1.0.0")]
struct Account {
    balance: u64,
}

// v1.1.0 - Safe addition
#[version("1.1.0")]
struct Account {
    balance: u64,
    nickname: Option<String>,  // Old accounts: None
}
```

:::tip[Rule of Thumb]
If existing on-chain accounts can deserialize with the new schema **without modification**, it's non-breaking.
:::

---

### 🟡 Patch Changes (Increment PATCH)

These changes have **zero impact** on serialization:

- Update documentation comments
- Fix typos in comments
- Add examples to doc comments
- Clarify field descriptions

```rust
// v1.0.0
#[version("1.0.0")]
struct Account {
    balance: u64,
}

// v1.0.1 - Documentation only
#[version("1.0.1")]
struct Account {
    /// Account balance in lamports (1 SOL = 1_000_000_000 lamports)
    balance: u64,
}
```

---

## Deprecation Strategies

When you need to phase out a field, use deprecation to give users time to migrate.

### Using `#[deprecated]`

```rust
#[solana]
#[account]
#[version("1.1.0")]
struct UserProfile {
    wallet: PublicKey,

    #[deprecated("Use 'email_address' instead. Will be removed in v2.0.0")]
    email: Option<String>,

    email_address: Option<String>,
}
```

**LUMOS will:**
- ✅ Emit warnings during `lumos validate`
- ✅ Add deprecation notices to generated code
- ✅ Include in `lumos diff` output
- ✅ Generate migration suggestions

**Output when validating:**
```
warning: UserProfile.email is deprecated
  → Use 'email_address' instead. Will be removed in v2.0.0
```

---

### Dual-Field Migration Pattern

**Safest way to migrate a field:**

#### Phase 1: v1.1.0 (Add new field, deprecate old)
```rust
#[version("1.1.0")]
struct Account {
    #[deprecated("Use 'owner_wallet' instead")]
    wallet: PublicKey,

    owner_wallet: Option<PublicKey>,  // New field
}
```

**Action:** Start writing to both fields, read from `owner_wallet` if present, else fall back to `wallet`.

---

#### Phase 2: v1.2.0 (Migrate existing accounts)
```rust
// Migration instruction (Anchor example)
pub fn migrate_to_owner_wallet(ctx: Context<Migrate>) -> Result<()> {
    let account = &mut ctx.accounts.account;

    if account.owner_wallet.is_none() {
        account.owner_wallet = Some(account.wallet);
    }

    Ok(())
}
```

**Action:** Provide migration instruction, notify users.

---

#### Phase 3: v2.0.0 (Remove old field)
```rust
#[version("2.0.0")]
struct Account {
    owner_wallet: PublicKey,  // No longer Option
}
```

**Action:** Remove deprecated field (breaking change).

:::caution[Migration Timeline]
**Recommended:** Wait at least **3-6 months** between adding deprecation (v1.1.0) and removing field (v2.0.0).
:::

---

## Version Management Best Practices

### 1. Maintain a CHANGELOG

Track all schema changes in `CHANGELOG.md`:

```markdown
# Changelog - PlayerAccount Schema

## [2.0.0] - 2025-02-15
### BREAKING CHANGES
- Changed `balance` from `u64` to `u128` to support larger amounts
- Migration required: Run `migrate_balance_u128` instruction

### Migration Guide
Old accounts must call the migration instruction before use.

## [1.2.0] - 2025-01-10
### Added
- New field `achievements: [String]` (backward-compatible)
- Defaults to empty array for old accounts

## [1.1.0] - 2024-12-01
### Added
- New optional field `nickname: Option<String>`
### Deprecated
- Field `display_name` deprecated in favor of `nickname`
```

---

### 2. Use `lumos diff` to Track Changes

```bash
# Compare two schema versions
lumos diff schema_v1.lumos schema_v2.lumos

# Output:
# Breaking Changes:
# - PlayerAccount.balance: type changed u64 → u128
#
# Non-Breaking Changes:
# - PlayerAccount.achievements: added (type: [String])
#
# Recommendation: Increment MAJOR version (breaking change detected)
```

---

### 3. Test Backward Compatibility

**Create compatibility tests for every version:**

```rust
#[test]
fn test_v1_account_deserializes_with_v2_schema() {
    // Serialize with v1.0.0 schema
    let v1_account = PlayerAccountV1 {
        wallet: Pubkey::new_unique(),
        level: 10,
        experience: 500,
    };
    let bytes = borsh::to_vec(&v1_account).unwrap();

    // Deserialize with v2.0.0 schema (has new optional field)
    let v2_account = borsh::from_slice::<PlayerAccountV2>(&bytes).unwrap();

    assert_eq!(v2_account.wallet, v1_account.wallet);
    assert_eq!(v2_account.level, v1_account.level);
    assert_eq!(v2_account.experience, v1_account.experience);
    assert!(v2_account.nickname.is_none());  // New field defaults to None
}
```

---

### 4. Document Migration Paths

**For breaking changes, always provide:**
1. **What changed** - Clear description
2. **Why it changed** - Business justification
3. **Migration instruction** - Anchor instruction code
4. **Timeline** - When old version stops working
5. **Rollback plan** - What if migration fails

**Example migration doc:**
```markdown
## Migration: PlayerAccount v1 → v2

### What Changed
- `balance: u64` → `balance: u128`

### Why
Support for token amounts > 18.4 quintillion (u64 max)

### Migration Instruction
pub fn migrate_balance_u128(ctx: Context<MigrateBalance>) -> Result<()>

### Timeline
- 2025-02-15: v2 deployed
- 2025-03-01: Migration instruction available
- 2025-06-01: v1 accounts deprecated (read-only)
- 2025-09-01: v1 support removed

### Rollback
If migration fails, redeploy v1 program from commit abc123
```

---

## Production Versioning Checklist

Before deploying a schema change:

- [ ] **Version incremented correctly** (major/minor/patch)
- [ ] **CHANGELOG.md updated** with all changes
- [ ] **Backward compatibility tested** (if non-breaking)
- [ ] **Migration instruction written** (if breaking)
- [ ] **TypeScript SDK regenerated** with new schema
- [ ] **Docs updated** with new fields/behavior
- [ ] **Deprecation warnings added** for phased changes
- [ ] **`lumos diff` reviewed** for unexpected changes
- [ ] **Mainnet deployment plan** with rollback strategy
- [ ] **User notification sent** (if breaking change)

---

## Common Versioning Pitfalls

### ❌ Pitfall 1: Forgetting Field Order

**Problem:**
```rust
// v1.0.0
struct Account {
    wallet: PublicKey,  // Position 0
    balance: u64,       // Position 1
}

// v1.1.0 - WRONG! (breaking)
struct Account {
    balance: u64,        // Position 0 (moved!)
    wallet: PublicKey,   // Position 1 (moved!)
    nickname: Option<String>,  // Position 2
}
```

**Fix:** Always add new fields at the end.

---

### ❌ Pitfall 2: Assuming `Option` is Free

**Problem:**
```rust
// v1.0.0
struct Account {
    email: String,
}

// v2.0.0 - WRONG! (breaking)
struct Account {
    email: Option<String>,  // Adds 1-byte discriminant
}
```

**Fix:** This is a **breaking change** (byte layout changes). Use dual-field pattern.

---

### ❌ Pitfall 3: Reordering Enum Variants

**Problem:**
```rust
// v1.0.0
enum Status {
    Active,     // Discriminant 0
    Paused,     // Discriminant 1
}

// v2.0.0 - WRONG! (breaking)
enum Status {
    Paused,     // Discriminant 0 (was 1!)
    Active,     // Discriminant 1 (was 0!)
    Terminated, // Discriminant 2
}
```

**Fix:** Never reorder enum variants. Always append new variants at the end.

---

## Advanced: Version Discriminator Pattern

For complex migrations, embed version in the account data:

```rust
#[solana]
#[account]
struct PlayerAccount {
    schema_version: u8,  // Always first field
    wallet: PublicKey,
    balance: u64,
}

// Migration logic in program
pub fn process_instruction(account: &PlayerAccount) -> Result<()> {
    match account.schema_version {
        1 => handle_v1(account),
        2 => handle_v2(account),
        _ => return Err(ErrorCode::UnsupportedSchemaVersion.into()),
    }
}
```

**Pros:**
- Support multiple schema versions simultaneously
- Gradual migration (users upgrade at their own pace)

**Cons:**
- Adds complexity to program logic
- Takes 1 byte per account

---

## Version Validation with LUMOS

LUMOS validates version format automatically:

```bash
# Invalid version format
lumos validate schema.lumos

# Error: Invalid version "1.2" (expected MAJOR.MINOR.PATCH)
#   --> schema.lumos:3
#   |
# 3 | #[version("1.2")]
#   |           ^^^^^ must be in format "X.Y.Z"
```

**Valid formats:**
- ✅ `1.0.0`
- ✅ `2.10.5`
- ✅ `0.1.0` (pre-release)

**Invalid formats:**
- ❌ `1.0` (missing patch)
- ❌ `v1.0.0` (no prefix)
- ❌ `1.0.0-beta` (no suffixes)

---

## Next Steps

- 📖 [Schema Migrations Guide](/guides/schema-migrations) - Detailed migration strategies
- 📖 [Deprecation Patterns](/examples/versioning/deprecating-field) - Hands-on example
- 📖 [CLI Reference](/api/cli-commands) - CLI commands reference
- 📖 [Generated Code](/api/generated-code) - Version comments in output

---

**Remember:** Good versioning practices prevent costly mistakes. Always err on the side of caution with breaking changes.
