---
title: Attributes
description: Reference for all LUMOS schema attributes
---

# Attributes Reference

Attributes control how LUMOS generates code for structs and enums. They are written with `#[attribute_name]` syntax above type definitions.

##  Overview

| Attribute | Applies To | Purpose |
|-----------|------------|---------|
| `#[solana]` | Structs, Enums | Mark as Solana-specific type |
| `#[account]` | Structs only | Generate Anchor `#[account]` macro |

---

## `#[solana]`

Marks a type as Solana-specific, enabling Solana type support (`PublicKey`, `Signature`) and proper imports.

### Syntax

```lumos
#[solana]
struct TypeName {
    // fields
}

#[solana]
enum EnumName {
    // variants
}
```

### Effects

#### Rust Generation

**With `#[solana]`:**
```rust
// Imports Solana/Anchor types
use anchor_lang::prelude::*;

pub struct TypeName {
    pub field: Pubkey,  // ← PublicKey → Pubkey
}
```

**Without `#[solana]`:**
```rust
// Uses only standard Rust + Borsh
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct TypeName {
    // Cannot use Pubkey without #[solana]
}
```

#### TypeScript Generation

**With `#[solana]`:**
```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface TypeName {
  field: PublicKey;
}

export const TypeNameBorshSchema = borsh.struct([
  borsh.publicKey('field'),
]);
```

---

### Examples

#### Simple Solana Struct

```lumos
#[solana]
struct Account {
    owner: PublicKey,
    balance: u64,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

pub struct Account {
    pub owner: Pubkey,
    pub balance: u64,
}
```

---

#### Solana Enum

```lumos
#[solana]
enum TransactionType {
    Transfer(PublicKey, u64),
    Stake(PublicKey, u64),
    Unstake,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

pub enum TransactionType {
    Transfer(Pubkey, u64),
    Stake(Pubkey, u64),
    Unstake,
}
```

---

#### Non-Solana Type (No Attribute)

```lumos
struct GenericData {
    id: u64,
    value: String,
}
```

**Generated Rust:**
```rust
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct GenericData {
    pub id: u64,
    pub value: String,
}
```

:::tip[When to Use `#[solana]`]
Use `#[solana]` when your type:
- Uses `PublicKey` or `Signature`
- Will be used in Anchor programs
- Needs Solana-specific imports

Omit `#[solana]` for:
- Generic data structures
- Pure Borsh serialization
- Non-blockchain code
:::

---

## `#[account]`

Generates Anchor's `#[account]` macro for on-chain account data.

### Syntax

```lumos
#[solana]
#[account]
struct AccountName {
    // fields
}
```

**Important**: `#[account]` requires `#[solana]` - they must be used together.

---

### Effects

#### With `#[account]`

```lumos
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
}
```

**Key points:**
- Uses Anchor's `#[account]` macro
- Automatically derives `AnchorSerialize`, `AnchorDeserialize`
- NO manual `#[derive(BorshSerialize, BorshDeserialize)]`
- Uses `anchor_lang::prelude::*` imports

---

#### Without `#[account]`

```lumos
#[solana]
struct EventData {
    player: PublicKey,
    score: u64,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

pub struct EventData {
    pub player: Pubkey,
    pub score: u64,
}

impl borsh::BorshSerialize for EventData { /* ... */ }
impl borsh::BorshDeserialize for EventData { /* ... */ }
```

**Key points:**
- NO `#[account]` macro
- Manual Borsh derives added
- Used for event data, instruction arguments, etc.

---

### When to Use `#[account]`

| Use Case | Attribute | Example |
|----------|-----------|---------|
| On-chain account storage | `#[account]` | User profiles, game state |
| Event data | No `#[account]` | Transaction logs, notifications |
| Instruction arguments | No `#[account]` | Function parameters |
| Return values | No `#[account]` | Query results |

---

### Examples

#### Player Account (On-Chain Storage)

```lumos
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
    inventory: [PublicKey],
}
```

**Usage in Anchor:**
```rust
#[program]
pub mod game {
    use super::*;

    pub fn create_player(ctx: Context<CreatePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.wallet = *ctx.accounts.user.key;
        player.level = 1;
        player.experience = 0;
        player.inventory = Vec::new();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePlayer<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<PlayerAccount>()
    )]
    pub player: Account<'info, PlayerAccount>,  // ← Uses generated type
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

---

#### Match Result (Event Data, Not Stored)

```lumos
#[solana]
struct MatchResult {
    winner: PublicKey,
    loser: Option<PublicKey>,
    score: u64,
    timestamp: i64,
}
```

**Usage in Anchor:**
```rust
#[event]
pub struct MatchFinished {
    pub result: MatchResult,  // ← Uses generated type (no #[account])
}

#[program]
pub mod game {
    use super::*;

    pub fn finish_match(ctx: Context<FinishMatch>, result: MatchResult) -> Result<()> {
        emit!(MatchFinished { result });
        Ok(())
    }
}
```

---

## Attribute Combinations

### Valid Combinations

```lumos
// ✅ Both attributes (on-chain account)
#[solana]
#[account]
struct Account { /* ... */ }

// ✅ Only #[solana] (event data, instructions)
#[solana]
struct Event { /* ... */ }

// ✅ No attributes (generic Borsh)
struct Data { /* ... */ }
```

---

### Invalid Combinations

```lumos
// ❌ #[account] without #[solana]
#[account]
struct Account { /* ... */ }
// Error: #[account] requires #[solana]

// ❌ #[account] on enum
#[solana]
#[account]
enum Status { /* ... */ }
// Error: #[account] only applies to structs
```

---

## Context-Aware Generation

LUMOS intelligently detects when to use Anchor imports based on attributes in the entire module.

### Example: Mixed Module

```lumos
// File: schema.lumos

#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
}

#[solana]
struct GameEvent {
    player: PublicKey,
    action: String,
}

#[solana]
enum GameState {
    Active,
    Paused,
    Finished,
}
```

**Generated Rust:**
```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
}

pub struct GameEvent {
    pub player: Pubkey,
    pub action: String,
}

pub enum GameState {
    Active,
    Paused,
    Finished,
}
```

**Key insight:** Since ONE type has `#[account]`, LUMOS uses `anchor_lang::prelude::*` for the entire module.

---

## Import Strategy

LUMOS chooses imports based on attributes:

| Scenario | Imports Used |
|----------|--------------|
| Any type has `#[account]` | `use anchor_lang::prelude::*;` |
| Has `#[solana]` but no `#[account]` | `use anchor_lang::prelude::*;` |
| No Solana attributes | `use borsh::{BorshSerialize, BorshDeserialize};` |

---

## Best Practices

:::tip[Use #[account] for Persistent Data]
If data is stored on-chain in a PDA or account, use `#[account]`:
```lumos
#[solana]
#[account]
struct UserProfile { /* ... */ }
```
:::

:::tip[Omit #[account] for Events]
Events are emitted, not stored:
```lumos
#[solana]
struct TransferEvent { /* ... */ }
```
:::

:::tip[Be Consistent]
Put attributes in this order:
1. `#[solana]` (if needed)
2. `#[account]` (if needed)
3. Type definition

```lumos
#[solana]
#[account]
struct Account { /* ... */ }
```
:::

:::caution[Don't Mix Anchor and Manual Derives]
If you use `#[account]`, don't manually add `#[derive(BorshSerialize)]` - Anchor handles it.

LUMOS generates correct derives automatically.
:::

---

## Troubleshooting

### "Pubkey not found"

**Error:**
```
cannot find type `Pubkey` in this scope
```

**Fix:** Add `#[solana]` attribute:
```lumos
#[solana]  // ← Add this
struct Account {
    owner: PublicKey,
}
```

---

### "#[account] on non-Solana type"

**Error:**
```
#[account] requires #[solana] attribute
```

**Fix:** Add `#[solana]` before `#[account]`:
```lumos
#[solana]   // ← Add this
#[account]
struct Account { /* ... */ }
```

---

### "Manual derives with #[account]"

**Error:**
```
cannot derive `BorshSerialize` when #[account] is present
```

**Fix:** Remove manual derives - Anchor handles serialization:
```lumos
// ❌ Don't do this
#[solana]
#[account]
#[derive(BorshSerialize)]  // ← Remove
struct Account { /* ... */ }

// ✅ Do this
#[solana]
#[account]
struct Account { /* ... */ }
```

---

## See Also

- [Type System](/api/types) - Supported types
- [Generated Code](/api/generated-code) - See output
- [CLI Commands](/api/cli-commands) - Generate code
