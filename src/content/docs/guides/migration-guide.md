---
title: Migration Guide
description: Step-by-step guide for migrating from manual Borsh code to LUMOS
---

This guide helps you transition from hand-written Borsh serialization code to LUMOS-generated schemas.

**Migration time:** 5-30 minutes per struct/enum (depending on complexity)

**Benefits:**
- ✅ **Zero runtime overhead** - Generated code is identical to manual Borsh
- ✅ **Type synchronization** - TypeScript and Rust always match
- ✅ **Reduced maintenance** - Single source of truth
- ✅ **Fewer bugs** - Eliminates serialization mismatches

---

## Quick Assessment

Before migrating, answer these questions:

| Question | If YES → | If NO → |
|----------|----------|---------|
| Do you have **< 10 types** to migrate? | Easy migration (30-60 min) | Plan phased approach |
| Are types **pure structs/enums**? | Direct 1:1 mapping | May need workarounds |
| Do you have **existing tests**? | High confidence migration | Write tests first |
| Is TypeScript SDK **deployed to users**? | Need compatibility layer | Clean migration |

:::tip[When to Migrate]
**Best time:** During development or when adding new features.
**Avoid:** Right before production deployment (unless thoroughly tested).
:::

---

## Step 1: Audit Your Existing Code

### Find All Borsh Types

**Rust (Anchor program):**
```bash
# Find all structs with Borsh derives
rg '#\[derive.*Borsh' --type rust

# Find Account macros
rg '#\[account\]' --type rust
```

**TypeScript (SDK):**
```bash
# Find Borsh schemas
rg 'borsh\.(struct|rustEnum)' --type ts

# Find buffer serialization
rg '(serialize|deserialize).*borsh' --type ts
```

### Create Migration Inventory

Create `MIGRATION.md` in your project:

```markdown
# Borsh → LUMOS Migration Inventory

## Phase 1: Simple Structs (3 types)
- [ ] `UserProfile` - Simple struct, no deps
- [ ] `GameConfig` - Simple struct, 5 fields
- [ ] `TokenMetadata` - Has Option fields

## Phase 2: Enums (2 types)
- [ ] `GameState` - Unit + struct variants
- [ ] `TransactionType` - Tuple variants

## Phase 3: Complex Types (2 types)
- [ ] `MarketplaceListing` - Has Vec, nested Option
- [ ] `StakingPool` - Large struct, 15+ fields
```

---

## Step 2: Install LUMOS CLI

```bash
cargo install lumos-cli

# Verify installation
lumos --version
# Output: lumos-cli 0.1.0
```

---

## Step 3: Create Your First .lumos Schema

Let's migrate a simple struct step-by-step.

### Before (Manual Borsh)

**Rust (`programs/my-game/src/state.rs`):**
```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
    pub items: Vec<Pubkey>,
}
```

**TypeScript (`sdk/src/types.ts`):**
```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface PlayerAccount {
  wallet: PublicKey;
  level: number;
  experience: number;
  items: PublicKey[];
}

export const PlayerAccountSchema = borsh.struct([
  borsh.publicKey('wallet'),
  borsh.u16('level'),
  borsh.u64('experience'),
  borsh.vec(borsh.publicKey(), 'items'),
]);
```

### After (LUMOS Schema)

**Create `schema/player.lumos`:**
```rust
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
    items: [PublicKey],
}
```

**Generate code:**
```bash
# Generate Rust
lumos generate schema/player.lumos --rust-file programs/my-game/src/generated.rs

# Generate TypeScript
lumos generate schema/player.lumos --typescript-file sdk/src/generated.ts
```

**Update imports:**

**Rust:**
```rust
// OLD: use crate::state::PlayerAccount;
// NEW:
mod generated;
use generated::PlayerAccount;
```

**TypeScript:**
```typescript
// OLD: import { PlayerAccount, PlayerAccountSchema } from './types';
// NEW:
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';
```

---

## Step 4: Binary Compatibility Verification

**Critical:** Ensure LUMOS-generated code produces identical bytes to your manual code.

### Create Test File

**`tests/borsh_compatibility.rs`:**
```rust
use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;

// Manual implementation
mod manual {
    use super::*;
    use anchor_lang::prelude::*;

    #[account]
    pub struct PlayerAccount {
        pub wallet: Pubkey,
        pub level: u16,
        pub experience: u64,
        pub items: Vec<Pubkey>,
    }
}

// LUMOS-generated
mod generated {
    include!("../programs/my-game/src/generated.rs");
}

#[test]
fn test_serialization_compatibility() {
    let wallet = Pubkey::new_unique();
    let items = vec![Pubkey::new_unique(), Pubkey::new_unique()];

    // Serialize with manual code
    let manual_account = manual::PlayerAccount {
        wallet,
        level: 42,
        experience: 1000,
        items: items.clone(),
    };
    let manual_bytes = borsh::to_vec(&manual_account).unwrap();

    // Serialize with LUMOS-generated code
    let lumos_account = generated::PlayerAccount {
        wallet,
        level: 42,
        experience: 1000,
        items: items.clone(),
    };
    let lumos_bytes = borsh::to_vec(&lumos_account).unwrap();

    // MUST be byte-for-byte identical
    assert_eq!(manual_bytes, lumos_bytes, "Serialization mismatch!");
}

#[test]
fn test_deserialization_compatibility() {
    let wallet = Pubkey::new_unique();
    let items = vec![Pubkey::new_unique()];

    // Create bytes with manual code
    let manual_account = manual::PlayerAccount {
        wallet,
        level: 10,
        experience: 500,
        items: items.clone(),
    };
    let bytes = borsh::to_vec(&manual_account).unwrap();

    // Deserialize with LUMOS-generated code
    let lumos_account = borsh::from_slice::<generated::PlayerAccount>(&bytes).unwrap();

    assert_eq!(lumos_account.wallet, wallet);
    assert_eq!(lumos_account.level, 10);
    assert_eq!(lumos_account.experience, 500);
    assert_eq!(lumos_account.items, items);
}
```

**Run tests:**
```bash
cargo test borsh_compatibility
```

**Expected output:**
```
test test_serialization_compatibility ... ok
test test_deserialization_compatibility ... ok
```

:::caution[Binary Compatibility is CRITICAL]
If these tests fail, **DO NOT deploy**. Generated code MUST produce identical bytes to avoid data corruption.
:::

---

## Step 5: TypeScript SDK Migration

### Update Type Imports

**Before:**
```typescript
import { PlayerAccount, PlayerAccountSchema } from './types';

// Serialize
const buffer = borsh.serialize(PlayerAccountSchema, account);

// Deserialize
const account = borsh.deserialize(PlayerAccountSchema, buffer);
```

**After:**
```typescript
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';

// Serialize (note: different schema name)
const buffer = borsh.serialize(PlayerAccountBorshSchema, account);

// Deserialize
const account = borsh.deserialize(PlayerAccountBorshSchema, buffer);
```

### Create TypeScript Compatibility Test

**`sdk/tests/compatibility.test.ts`:**
```typescript
import { PlayerAccount, PlayerAccountBorshSchema } from '../src/generated';
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

describe('LUMOS Borsh Compatibility', () => {
  it('should serialize/deserialize PlayerAccount', () => {
    const account: PlayerAccount = {
      wallet: new PublicKey('11111111111111111111111111111111'),
      level: 42,
      experience: 1000,
      items: [
        new PublicKey('22222222222222222222222222222222'),
        new PublicKey('33333333333333333333333333333333'),
      ],
    };

    // Serialize
    const buffer = borsh.serialize(PlayerAccountBorshSchema, account);

    // Deserialize
    const deserialized = borsh.deserialize(
      PlayerAccountBorshSchema,
      buffer
    ) as PlayerAccount;

    expect(deserialized.wallet.toBase58()).toBe(account.wallet.toBase58());
    expect(deserialized.level).toBe(42);
    expect(deserialized.experience).toBe(1000);
    expect(deserialized.items.length).toBe(2);
  });
});
```

**Run tests:**
```bash
npm test
```

---

## Step 6: Phased Rollout Strategy

### Option A: Big Bang (All at Once)

**Best for:** Small codebases (< 10 types), greenfield projects

**Steps:**
1. Create all `.lumos` schemas
2. Generate all code
3. Run full test suite
4. Deploy together

**Pros:** Clean, no hybrid state
**Cons:** Higher risk, longer testing

---

### Option B: Incremental Migration

**Best for:** Large codebases, production systems

**Steps:**
1. Migrate 1-2 simple types first
2. Test thoroughly in staging
3. Deploy to production
4. Monitor for 48 hours
5. Repeat for remaining types

**Pros:** Lower risk, easier rollback
**Cons:** Temporary hybrid state

---

### Option C: Shadow Deployment

**Best for:** Mission-critical systems

**Steps:**
1. Generate LUMOS code alongside manual code
2. Run both serialization paths
3. Compare outputs (should be identical)
4. Log any mismatches (should be zero)
5. After confidence built (1-2 weeks), switch to LUMOS
6. Remove manual code

**Example:**
```rust
#[cfg(feature = "lumos-migration")]
fn serialize_player(account: &PlayerAccount) -> Vec<u8> {
    let manual_bytes = borsh::to_vec(&account).unwrap();
    let lumos_bytes = borsh::to_vec(&lumos_generated::PlayerAccount::from(account)).unwrap();

    if manual_bytes != lumos_bytes {
        log::error!("LUMOS serialization mismatch detected!");
    }

    manual_bytes // Still use manual for now
}
```

---

## Step 7: Common Migration Patterns

### Pattern 1: Simple Struct

**Manual:**
```rust
#[account]
pub struct Config {
    pub authority: Pubkey,
    pub fee: u64,
}
```

**LUMOS:**
```rust
#[solana]
#[account]
struct Config {
    authority: PublicKey,
    fee: u64,
}
```

**Difficulty:** ⭐ Easy (5 min)

---

### Pattern 2: Struct with Option Fields

**Manual:**
```rust
#[account]
pub struct Profile {
    pub name: String,
    pub email: Option<String>,
    pub avatar: Option<Pubkey>,
}
```

**LUMOS:**
```rust
#[solana]
#[account]
struct Profile {
    name: String,
    email: Option<String>,
    avatar: Option<PublicKey>,
}
```

**Difficulty:** ⭐ Easy (5 min)

---

### Pattern 3: Struct with Vec

**Manual:**
```rust
#[account]
pub struct Inventory {
    pub owner: Pubkey,
    pub items: Vec<Pubkey>,
    pub quantities: Vec<u32>,
}
```

**LUMOS:**
```rust
#[solana]
#[account]
struct Inventory {
    owner: PublicKey,
    items: [PublicKey],
    quantities: [u32],
}
```

**Note:** `[T]` in LUMOS = `Vec<T>` in Rust

**Difficulty:** ⭐ Easy (5 min)

---

### Pattern 4: Enum with Unit Variants

**Manual:**
```rust
#[derive(BorshSerialize, BorshDeserialize)]
pub enum Status {
    Active,
    Paused,
    Terminated,
}
```

**LUMOS:**
```rust
#[solana]
enum Status {
    Active,
    Paused,
    Terminated,
}
```

**Difficulty:** ⭐⭐ Medium (10 min)

---

### Pattern 5: Enum with Struct Variants

**Manual:**
```rust
#[derive(BorshSerialize, BorshDeserialize)]
pub enum Action {
    Initialize {
        authority: Pubkey,
        fee: u64,
    },
    UpdateFee {
        new_fee: u64,
    },
    Close,
}
```

**LUMOS:**
```rust
#[solana]
enum Action {
    Initialize {
        authority: PublicKey,
        fee: u64,
    },
    UpdateFee {
        new_fee: u64,
    },
    Close,
}
```

**Difficulty:** ⭐⭐ Medium (15 min)

---

## Step 8: Troubleshooting Common Issues

### Issue 1: "Type mismatch after migration"

**Symptom:**
```
error: expected `Pubkey`, found `PublicKey`
```

**Cause:** Forgot to update imports

**Fix:**
```rust
// Before
use solana_program::pubkey::Pubkey;

// After
mod generated;
use generated::PlayerAccount; // Already has Pubkey internally
```

---

### Issue 2: "Serialization produces different bytes"

**Symptom:** Binary compatibility test fails

**Cause:** Field order mismatch

**Fix:** Ensure `.lumos` fields are in SAME ORDER as manual struct:

**Manual:**
```rust
pub struct Account {
    pub authority: Pubkey,  // Field 1
    pub balance: u64,        // Field 2
}
```

**LUMOS (must match order):**
```rust
struct Account {
    authority: PublicKey,  // Field 1
    balance: u64,          // Field 2
}
```

---

### Issue 3: "TypeScript types don't match"

**Symptom:**
```
Type 'PlayerAccountBorshSchema' is not assignable to type 'PlayerAccountSchema'
```

**Cause:** Different schema naming convention

**Fix:** Update all references:
```typescript
// Before: PlayerAccountSchema
// After:  PlayerAccountBorshSchema
```

Or create alias:
```typescript
export const PlayerAccountSchema = PlayerAccountBorshSchema;
```

---

### Issue 4: "Cannot use f32/f64 types"

**Symptom:**
```
Error: Unsupported type 'f64'
```

**Cause:** LUMOS doesn't support floating point (Solana best practice)

**Workaround:** Use fixed-point integers:
```rust
// Before
price: f64,

// After (store as lamports, e.g., 1.5 SOL = 1_500_000_000)
price_lamports: u64,
```

---

### Issue 5: "Fixed-size arrays not supported"

**Symptom:**
```
Error: Unsupported type '[u8; 32]'
```

**Cause:** LUMOS doesn't support fixed arrays (except PublicKey)

**Workaround:**
```rust
// Before
data: [u8; 32],

// After - Use Vec for small arrays
data: [u8],

// Or - Use PublicKey wrapper for 32-byte arrays
key: PublicKey,
```

---

## Step 9: Post-Migration Checklist

After migrating each type, verify:

- [ ] **Compilation passes** - `cargo build --release`
- [ ] **All tests pass** - `cargo test`
- [ ] **Binary compatibility verified** - Compatibility tests pass
- [ ] **TypeScript tests pass** - `npm test`
- [ ] **Anchor build succeeds** - `anchor build`
- [ ] **LocalNet deployment works** - Deploy to test validator
- [ ] **Existing accounts deserialize** - Load real account data
- [ ] **New accounts can be created** - Test account initialization
- [ ] **Documentation updated** - README mentions LUMOS
- [ ] **CI/CD updated** - Pipeline runs `lumos generate`

---

## Step 10: Automate Code Generation

### Add to Build Scripts

**`package.json`:**
```json
{
  "scripts": {
    "codegen": "lumos generate schema/types.lumos --output-dir ./generated",
    "prebuild": "npm run codegen",
    "build": "anchor build"
  }
}
```

**`Makefile`:**
```makefile
.PHONY: codegen
codegen:
	lumos generate schema/types.lumos -o programs/my-game/src/generated.rs
	lumos generate schema/types.lumos -o sdk/src/generated.ts

build: codegen
	anchor build

test: codegen
	cargo test
	npm test
```

### CI/CD Integration

**`.github/workflows/test.yml`:**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install LUMOS CLI
        run: cargo install lumos-cli

      - name: Generate code
        run: make codegen

      - name: Check for uncommitted changes
        run: |
          git diff --exit-code || \
            (echo "Generated code is outdated. Run 'make codegen' locally." && exit 1)

      - name: Run tests
        run: make test
```

---

## Rollback Plan

If something goes wrong after migration:

### Immediate Rollback (< 5 minutes)

1. **Revert Git commits:**
   ```bash
   git revert HEAD~1  # Revert LUMOS migration commit
   git push origin main --force
   ```

2. **Redeploy previous version:**
   ```bash
   anchor build
   anchor deploy --program-id <YOUR_PROGRAM_ID>
   ```

### Partial Rollback (Keep Some LUMOS Types)

1. **Identify problematic type**
2. **Restore manual implementation:**
   ```bash
   git checkout HEAD~1 -- programs/my-game/src/state.rs
   ```
3. **Rebuild and redeploy**

---

## Migration Checklist Template

Use this for each type you migrate:

```markdown
## Migrating: PlayerAccount

- [ ] Create `.lumos` schema
- [ ] Generate Rust code
- [ ] Generate TypeScript code
- [ ] Update Rust imports
- [ ] Update TypeScript imports
- [ ] Write binary compatibility test
- [ ] Run Rust tests (`cargo test`)
- [ ] Run TypeScript tests (`npm test`)
- [ ] Deploy to localnet
- [ ] Test account creation
- [ ] Test account deserialization
- [ ] Deploy to devnet (optional)
- [ ] Monitor for 24 hours
- [ ] Deploy to mainnet
- [ ] Remove old manual code
- [ ] Update documentation

**Started:** YYYY-MM-DD
**Completed:** YYYY-MM-DD
**Issues:** None / See #123
```

---

## Success Metrics

Track these to measure migration success:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Code duplication** | -50% LOC | Count lines before/after |
| **Build time** | No change | Compare `cargo build` times |
| **Test coverage** | Maintained | Run `cargo tarpaulin` |
| **Deployment errors** | 0 | Monitor logs for 48h |
| **Serialization bugs** | 0 | Binary compatibility tests |

---

## Real-World Migration Example

**Project:** NFT Marketplace (15 types)

**Timeline:**
- Day 1-2: Audit codebase, create `.lumos` schemas
- Day 3-4: Generate code, write compatibility tests
- Day 5: Deploy to localnet, test thoroughly
- Day 6-7: Deploy to devnet, monitor
- Day 8: Deploy to mainnet
- Day 9-10: Monitor production, remove manual code

**Result:**
- 800 LOC → 200 LOC (LUMOS schemas)
- Zero serialization bugs
- 100% binary compatibility
- TypeScript SDK auto-synced

---

## Getting Help

If you encounter issues during migration:

1. **Check compatibility tests** - Binary mismatch?
2. **Review this guide** - Common patterns covered?
3. **Try the playground** - Test schemas at [/playground](/playground)
4. **Ask on GitHub** - [Open an issue](https://github.com/getlumos/lumos/issues)
5. **Join Discord** - Real-time help from community

---

## Next Steps

After successful migration:

- ✅ Read [Generated Code Examples](/api/generated-code)
- ✅ Explore [Type System Reference](/api/types)
- ✅ Try [Interactive Playground](/playground)
- ✅ Set up [CI/CD automation](#step-10-automate-code-generation)

**Congratulations!** You're now using LUMOS for type-safe, synchronized Solana development. 🎉
