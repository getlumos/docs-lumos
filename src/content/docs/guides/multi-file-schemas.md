---
title: Multi-File Schemas
description: Organize large LUMOS projects with imports, modules, and cross-file type references.
---

# Multi-File Schemas

As your LUMOS project grows, you'll want to organize schemas across multiple files for better maintainability. LUMOS supports two complementary systems:

1. **JavaScript-style imports** - Simple, explicit type importing
2. **Rust-style modules** - Hierarchical module organization

## Quick Start

### JavaScript-Style Imports

```rust
// types.lumos - Define shared types
type UserId = PublicKey;
type Lamports = u64;

#[solana]
enum AccountStatus {
    Active,
    Frozen,
    Closed,
}
```

```rust
// accounts.lumos - Import and use types
import { UserId, Lamports, AccountStatus } from "./types.lumos";

#[solana]
#[account]
struct UserAccount {
    owner: UserId,          // Resolves to PublicKey
    balance: Lamports,      // Resolves to u64
    status: AccountStatus,  // Imported enum
}
```

### Generate Multi-File Schema

```bash
# LUMOS automatically resolves imports
lumos generate accounts.lumos

# Output includes all types from all imported files
```

---

## JavaScript-Style Imports

The import system uses familiar JavaScript/TypeScript syntax:

```rust
import { Type1, Type2, Type3 } from "./relative/path.lumos";
```

### Import Syntax

```rust
// Single import
import { UserId } from "./types.lumos";

// Multiple imports (comma-separated)
import { UserId, Lamports, AccountStatus } from "./types.lumos";

// Multi-line imports
import {
    UserId,
    WalletAddress,
    AccountId,
    UnixTimestamp,
    Lamports,
    TokenAmount,
} from "./types.lumos";
```

### What Can Be Imported?

| Item Type | Example | Importable? |
|-----------|---------|-------------|
| Type Aliases | `type UserId = PublicKey` | ✅ Yes |
| Structs | `struct User { ... }` | ✅ Yes |
| Enums | `enum Status { ... }` | ✅ Yes |

### Relative Paths

Imports use relative paths from the current file:

```
project/
├── schema/
│   ├── types.lumos       # Shared types
│   ├── accounts.lumos    # import from "./types.lumos"
│   └── instructions/
│       └── token.lumos   # import from "../types.lumos"
```

```rust
// schema/accounts.lumos
import { UserId } from "./types.lumos";

// schema/instructions/token.lumos
import { UserId } from "../types.lumos";
```

---

## Type Aliases

Type aliases create semantic names for primitive types, making schemas self-documenting:

### Defining Type Aliases

```rust
// types.lumos

// Identity types
type UserId = PublicKey;
type WalletAddress = PublicKey;
type AccountId = PublicKey;

// Temporal types
type UnixTimestamp = i64;
type Slot = u64;
type Epoch = u64;

// Financial types
type Lamports = u64;
type TokenAmount = u64;
type BasisPoints = u16;  // 1 = 0.01%, 10000 = 100%

// Collection types
type UserList = [PublicKey];
type AmountList = [u64];

// Optional types
type OptionalOwner = Option<PublicKey>;
type NullableTimestamp = Option<i64>;
```

### Using Type Aliases

```rust
// accounts.lumos
import { UserId, Lamports, UnixTimestamp, AccountStatus } from "./types.lumos";

#[solana]
#[account]
struct StakeAccount {
    owner: UserId,              // Self-documenting: this is a user ID
    staked_amount: Lamports,    // Clear: this is a lamport amount
    staked_at: UnixTimestamp,   // Obvious: this is a timestamp
    status: AccountStatus,      // Imported enum
}
```

### Generated Code

Type aliases are preserved in generated code:

**Rust Output:**
```rust
use solana_program::pubkey::Pubkey;

pub type UserId = Pubkey;
pub type Lamports = u64;
pub type UnixTimestamp = i64;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct StakeAccount {
    pub owner: UserId,
    pub staked_amount: Lamports,
    pub staked_at: UnixTimestamp,
    pub status: AccountStatus,
}
```

**TypeScript Output:**
```typescript
import { PublicKey } from '@solana/web3.js';

export type UserId = PublicKey;
export type Lamports = number;
export type UnixTimestamp = number;

export interface StakeAccount {
    owner: UserId;
    stakedAmount: Lamports;
    stakedAt: UnixTimestamp;
    status: AccountStatus;
}
```

---

## Rust-Style Modules

For larger projects, use Rust-style modules with `mod` and `use` statements:

### Module Declaration

```rust
// main.lumos
mod types;      // Loads ./types.lumos or ./types/mod.lumos
mod accounts;
mod instructions;

#[solana]
#[account]
struct AppState {
    initialized: bool,
    admin: PublicKey,
}
```

### Module Resolution

LUMOS looks for modules in two locations:

1. **Sibling file**: `./module_name.lumos`
2. **Directory module**: `./module_name/mod.lumos`

```
project/
├── main.lumos              # mod types; mod models;
├── types.lumos             # Found as sibling file
└── models/
    ├── mod.lumos           # Found as directory module
    ├── user.lumos
    └── account.lumos
```

### Nested Modules

Create hierarchical organization:

```rust
// main.lumos
mod models;

// models/mod.lumos (or models.lumos)
mod user;
mod account;

type Timestamp = i64;

// models/user.lumos
#[solana]
#[account]
struct User {
    wallet: PublicKey,
    username: String,
}

// models/account.lumos
#[solana]
#[account]
struct Account {
    owner: PublicKey,
    balance: u64,
}
```

### Use Statements

Import types from other modules with `use`:

```rust
// main.lumos
mod types;

use crate::types::UserId;
use crate::types::AccountStatus;

#[solana]
#[account]
struct Config {
    admin: UserId,
    status: AccountStatus,
}
```

**Path Keywords:**
- `crate::` - Start from the root module
- `super::` - Go up one level
- `self::` - Current module

```rust
// models/user.lumos
use crate::types::UserId;           // From root
use super::Timestamp;                // From parent (models)
use self::helpers::validate;         // From current module
```

### Visibility

Control type visibility with `pub`:

```rust
// internal.lumos
// Private - only accessible within this module
struct InternalState {
    secret: [u8],
}

// public.lumos
// Public - accessible from other modules
pub struct PublicConfig {
    name: String,
    enabled: bool,
}
```

---

## Complete Example: DeFi Project

Here's a real-world multi-file project structure:

```
defi-protocol/
├── main.lumos              # Entry point
├── types.lumos             # Shared type aliases
├── accounts/
│   ├── mod.lumos           # Account module
│   ├── user.lumos          # User accounts
│   ├── pool.lumos          # Liquidity pool accounts
│   └── vault.lumos         # Vault accounts
└── instructions/
    ├── mod.lumos           # Instruction module
    ├── stake.lumos         # Staking instructions
    └── swap.lumos          # Swap instructions
```

### types.lumos

```rust
// Shared type aliases for the entire project

// Identity
type UserId = PublicKey;
type PoolId = PublicKey;
type VaultId = PublicKey;

// Financial
type Lamports = u64;
type TokenAmount = u64;
type ShareAmount = u64;
type BasisPoints = u16;

// Temporal
type UnixTimestamp = i64;

// Optional
type OptionalOwner = Option<PublicKey>;

// Enums
#[solana]
enum AccountStatus {
    Uninitialized,
    Active,
    Frozen,
    Closed,
}

#[solana]
enum PoolType {
    ConstantProduct,
    StableSwap,
    Concentrated,
}
```

### accounts/user.lumos

```rust
import {
    UserId,
    Lamports,
    TokenAmount,
    UnixTimestamp,
    AccountStatus,
} from "../types.lumos";

#[solana]
#[account]
struct UserAccount {
    // Identity
    user_id: UserId,

    // Balances
    sol_balance: Lamports,
    token_balance: TokenAmount,

    // Staking
    staked_amount: TokenAmount,
    rewards_earned: TokenAmount,

    // Metadata
    created_at: UnixTimestamp,
    last_activity: UnixTimestamp,
    status: AccountStatus,
}

#[solana]
#[account]
struct UserPosition {
    owner: UserId,
    pool_id: PublicKey,
    liquidity_shares: TokenAmount,
    entry_price: u64,
    opened_at: UnixTimestamp,
}
```

### accounts/pool.lumos

```rust
import {
    PoolId,
    UserId,
    TokenAmount,
    BasisPoints,
    UnixTimestamp,
    AccountStatus,
    PoolType,
} from "../types.lumos";

#[solana]
#[account]
struct LiquidityPool {
    // Identity
    pool_id: PoolId,
    authority: UserId,

    // Token configuration
    token_a_mint: PublicKey,
    token_b_mint: PublicKey,
    token_a_reserve: PublicKey,
    token_b_reserve: PublicKey,

    // Pool state
    pool_type: PoolType,
    total_liquidity: TokenAmount,

    // Fees
    swap_fee: BasisPoints,
    protocol_fee: BasisPoints,

    // Metadata
    created_at: UnixTimestamp,
    status: AccountStatus,
}
```

### instructions/stake.lumos

```rust
import {
    UserId,
    TokenAmount,
    UnixTimestamp,
} from "../types.lumos";

#[solana]
enum StakingInstruction {
    // Initialize staking pool
    Initialize {
        authority: UserId,
        reward_rate: u64,
    },

    // Stake tokens
    Stake {
        user: UserId,
        amount: TokenAmount,
        lock_duration: UnixTimestamp,
    },

    // Unstake tokens
    Unstake {
        user: UserId,
        amount: TokenAmount,
    },

    // Claim rewards
    ClaimRewards {
        user: UserId,
    },
}
```

### Generate the Project

```bash
# Generate from entry point - all imports resolved automatically
lumos generate main.lumos --rust --typescript

# Or generate specific files
lumos generate accounts/user.lumos
```

---

## Validation & Error Handling

### Circular Dependency Detection

LUMOS detects and prevents circular imports:

```rust
// a.lumos
import { TypeB } from "./b.lumos";

// b.lumos
import { TypeA } from "./a.lumos";  // ERROR: Circular dependency
```

**Error Message:**
```
error: Circular dependency detected
  --> a.lumos:1:1
   |
   = note: a.lumos -> b.lumos -> a.lumos
```

**Solution:** Extract shared types to a common file:

```rust
// common.lumos
type SharedType = u64;

// a.lumos
import { SharedType } from "./common.lumos";

// b.lumos
import { SharedType } from "./common.lumos";
```

### Missing Import Errors

```rust
import { NonExistent } from "./types.lumos";
```

**Error:**
```
error: Type 'NonExistent' not found in './types.lumos'
  --> accounts.lumos:1:10
   |
 1 | import { NonExistent } from "./types.lumos";
   |          ^^^^^^^^^^^
   |
   = help: Available types: UserId, Lamports, AccountStatus
```

### File Not Found

```rust
import { Type } from "./missing.lumos";
```

**Error:**
```
error: File not found: ./missing.lumos
  --> accounts.lumos:1:25
   |
 1 | import { Type } from "./missing.lumos";
   |                      ^^^^^^^^^^^^^^^^^
```

---

## Best Practices

### 1. Organize by Domain

```
project/
├── types/           # Shared types
├── accounts/        # Account definitions
├── instructions/    # Program instructions
└── events/          # Event definitions
```

### 2. Use Type Aliases Liberally

```rust
// ✅ Good - Self-documenting
struct Transfer {
    from: WalletAddress,
    to: WalletAddress,
    amount: Lamports,
}

// ❌ Avoid - Requires context
struct Transfer {
    from: PublicKey,
    to: PublicKey,
    amount: u64,
}
```

### 3. Keep Files Focused

Each file should have a single responsibility:
- `types.lumos` - Type aliases only
- `user.lumos` - User-related structs
- `pool.lumos` - Pool-related structs

### 4. Avoid Deep Nesting

```
// ✅ Good - 2-3 levels max
project/
├── types.lumos
├── accounts/
│   ├── user.lumos
│   └── pool.lumos
└── instructions.lumos

// ❌ Avoid - Too deep
project/
├── domain/
│   └── models/
│       └── accounts/
│           └── user/
│               └── profile.lumos
```

### 5. Single Source of Truth

Define each type in exactly one place:

```rust
// types.lumos - Define here
type UserId = PublicKey;

// accounts.lumos - Import, don't redefine
import { UserId } from "./types.lumos";
// NOT: type UserId = PublicKey;  // Duplication!
```

---

## CLI Commands

### Generate with Imports

```bash
# Automatically resolves all imports
lumos generate schema.lumos

# Specify output directory
lumos generate schema.lumos --output ./generated

# Generate specific languages
lumos generate schema.lumos --lang rust,typescript,python
```

### Validate Multi-File Schema

```bash
# Validates imports and type references
lumos validate schema.lumos

# Verbose output shows resolved imports
lumos validate schema.lumos --verbose
```

### Watch Mode

```bash
# Watches all imported files for changes
lumos generate schema.lumos --watch
```

---

## Migration from Single File

### Before (Single File)

```rust
// schema.lumos (500+ lines)
type UserId = PublicKey;
type Lamports = u64;

#[solana]
enum Status { ... }

#[solana]
struct User { ... }

#[solana]
struct Pool { ... }

// ... many more types
```

### After (Multi-File)

```rust
// types.lumos
type UserId = PublicKey;
type Lamports = u64;

#[solana]
enum Status { ... }

// accounts/user.lumos
import { UserId, Status } from "../types.lumos";

#[solana]
struct User { ... }

// accounts/pool.lumos
import { Lamports } from "../types.lumos";

#[solana]
struct Pool { ... }
```

### Migration Steps

1. **Identify shared types** - Find types used across multiple structs
2. **Extract to types.lumos** - Move type aliases and common enums
3. **Split by domain** - Group related structs into files
4. **Add imports** - Update each file with necessary imports
5. **Validate** - Run `lumos validate` to catch missing imports
6. **Generate** - Verify output matches original

---

## See Also

- [Type Aliases Reference](/reference/types#type-aliases)
- [Module System Reference](/reference/modules)
- [CLI Commands](/api/cli-commands)
- [Schema Evolution](/guides/versioning)
