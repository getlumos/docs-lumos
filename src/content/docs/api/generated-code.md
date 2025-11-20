---
title: Generated Code Examples
description: See exactly what LUMOS generates from your schemas
---

# Generated Code Examples

This page shows complete examples of what LUMOS generates from `.lumos` schemas. Each example includes the input schema and both Rust and TypeScript outputs.

---

## Simple Account Structure

### Input Schema

```rust
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
}
```

### Generated Rust

```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
}
```

**Key points:**
- `#[account]` macro applied (Anchor integration)
- `PublicKey` → `Pubkey` conversion
- All fields are `pub`
- No manual Borsh derives needed (handled by Anchor)

### Generated TypeScript

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

**Key points:**
- Interface for TypeScript type safety
- Borsh schema for serialization/deserialization
- `u16`, `u64` → `number` (JavaScript safe integers)

---

## Event Data (No #[account])

### Input Schema

```rust
#[solana]
struct MatchResult {
    winner: PublicKey,
    loser: Option<PublicKey>,
    score: u64,
    timestamp: i64,
}
```

### Generated Rust

```rust
use anchor_lang::prelude::*;

pub struct MatchResult {
    pub winner: Pubkey,
    pub loser: Option<Pubkey>,
    pub score: u64,
    pub timestamp: i64,
}

impl borsh::ser::BorshSerialize for MatchResult {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        borsh::BorshSerialize::serialize(&self.winner, writer)?;
        borsh::BorshSerialize::serialize(&self.loser, writer)?;
        borsh::BorshSerialize::serialize(&self.score, writer)?;
        borsh::BorshSerialize::serialize(&self.timestamp, writer)?;
        Ok(())
    }
}

impl borsh::de::BorshDeserialize for MatchResult {
    fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        Ok(Self {
            winner: borsh::BorshDeserialize::deserialize_reader(reader)?,
            loser: borsh::BorshDeserialize::deserialize_reader(reader)?,
            score: borsh::BorshDeserialize::deserialize_reader(reader)?,
            timestamp: borsh::BorshDeserialize::deserialize_reader(reader)?,
        })
    }
}
```

**Key differences:**
- NO `#[account]` macro
- Manual Borsh trait implementations
- Used for events, instruction arguments, return values

### Generated TypeScript

```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface MatchResult {
  winner: PublicKey;
  loser: PublicKey | undefined;
  score: number;
  timestamp: number;
}

export const MatchResultBorshSchema = borsh.struct([
  borsh.publicKey('winner'),
  borsh.option(borsh.publicKey(), 'loser'),
  borsh.u64('score'),
  borsh.i64('timestamp'),
]);
```

**Key points:**
- `Option<PublicKey>` → `PublicKey | undefined`
- `borsh.option()` handles nullable fields

---

## Complex Types (Vectors)

### Input Schema

```rust
#[solana]
#[account]
struct Inventory {
    owner: PublicKey,
    items: [PublicKey],
    quantities: [u32],
}
```

### Generated Rust

```rust
use anchor_lang::prelude::*;

#[account]
pub struct Inventory {
    pub owner: Pubkey,
    pub items: Vec<Pubkey>,
    pub quantities: Vec<u32>,
}
```

**Key points:**
- `[T]` → `Vec<T>` in Rust
- Dynamic-length arrays

### Generated TypeScript

```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface Inventory {
  owner: PublicKey;
  items: PublicKey[];
  quantities: number[];
}

export const InventoryBorshSchema = borsh.struct([
  borsh.publicKey('owner'),
  borsh.vec(borsh.publicKey(), 'items'),
  borsh.vec(borsh.u32(), 'quantities'),
]);
```

**Key points:**
- `[T]` → `T[]` in TypeScript
- `borsh.vec()` for dynamic arrays

---

## Enum Types

### Input Schema

```rust
#[solana]
enum GameState {
    Active,
    Paused { reason: String },
    Finished { winner: PublicKey, score: u64 },
}
```

### Generated Rust

```rust
use anchor_lang::prelude::*;

pub enum GameState {
    Active,
    Paused { reason: String },
    Finished { winner: Pubkey, score: u64 },
}

impl borsh::ser::BorshSerialize for GameState {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        match self {
            Self::Active => {
                0u8.serialize(writer)?;
            }
            Self::Paused { reason } => {
                1u8.serialize(writer)?;
                reason.serialize(writer)?;
            }
            Self::Finished { winner, score } => {
                2u8.serialize(writer)?;
                winner.serialize(writer)?;
                score.serialize(writer)?;
            }
        }
        Ok(())
    }
}

impl borsh::de::BorshDeserialize for GameState {
    fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        let variant: u8 = borsh::BorshDeserialize::deserialize_reader(reader)?;
        match variant {
            0 => Ok(Self::Active),
            1 => Ok(Self::Paused {
                reason: borsh::BorshDeserialize::deserialize_reader(reader)?,
            }),
            2 => Ok(Self::Finished {
                winner: borsh::BorshDeserialize::deserialize_reader(reader)?,
                score: borsh::BorshDeserialize::deserialize_reader(reader)?,
            }),
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Invalid GameState variant: {}", variant),
            )),
        }
    }
}
```

**Key points:**
- Sequential discriminants (0, 1, 2...)
- Match-based serialization
- Error handling for invalid variants

### Generated TypeScript

```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export type GameState =
  | { kind: 'Active' }
  | { kind: 'Paused'; reason: string }
  | { kind: 'Finished'; winner: PublicKey; score: number };

export const GameStateBorshSchema = borsh.rustEnum([
  borsh.unit('Active'),
  borsh.struct([borsh.string('reason')], 'Paused'),
  borsh.struct([
    borsh.publicKey('winner'),
    borsh.u64('score'),
  ], 'Finished'),
]);
```

**Key points:**
- Discriminated union type with `kind` field
- TypeScript type narrowing support
- `borsh.rustEnum()` for Rust-style enums

---

## Non-Solana Types (Pure Borsh)

### Input Schema

```rust
struct GenericData {
    id: u64,
    value: String,
    metadata: Option<String>,
}
```

**Note:** No `#[solana]` attribute

### Generated Rust

```rust
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct GenericData {
    pub id: u64,
    pub value: String,
    pub metadata: Option<String>,
}
```

**Key differences:**
- Uses `borsh` crate directly (not `anchor_lang`)
- `#[derive]` macros for serialization
- No Solana-specific types available

### Generated TypeScript

```typescript
import * as borsh from '@coral-xyz/borsh';

export interface GenericData {
  id: number;
  value: string;
  metadata: string | undefined;
}

export const GenericDataBorshSchema = borsh.struct([
  borsh.u64('id'),
  borsh.string('value'),
  borsh.option(borsh.string(), 'metadata'),
]);
```

**Same as Solana types** - Borsh schema is identical whether `#[solana]` is used or not.

---

## Import Strategy

LUMOS intelligently chooses imports based on attributes in your entire module:

### Scenario 1: Any `#[account]` Present

```rust
// ANY struct has #[account] → Use Anchor imports for ENTIRE module
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount { /* ... */ }

pub struct GameEvent { /* ... */ }  // Also uses Anchor imports
```

### Scenario 2: Only `#[solana]` (No `#[account]`)

```rust
// Has #[solana] but no #[account] → Still use Anchor
use anchor_lang::prelude::*;

pub struct MatchResult { /* ... */ }
// Manual Borsh impls added
```

### Scenario 3: No Solana Attributes

```rust
// Pure Borsh types
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct GenericData { /* ... */ }
```

---

## Context-Aware Generation

LUMOS detects the context of your entire schema file to generate optimal code.

### Example: Mixed Module

**Input:**
```rust
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

impl borsh::ser::BorshSerialize for GameEvent { /* ... */ }
impl borsh::de::BorshDeserialize for GameEvent { /* ... */ }

pub enum GameState {
    Active,
    Paused,
}

impl borsh::ser::BorshSerialize for GameState { /* ... */ }
impl borsh::de::BorshDeserialize for GameState { /* ... */ }
```

**Key insight:** Since ONE type has `#[account]`, LUMOS uses `anchor_lang::prelude::*` for the entire module.

---

## Using Generated Code

### In Anchor Programs (Rust)

```rust
use anchor_lang::prelude::*;

// Import your generated types
use crate::generated::*;

#[program]
pub mod my_game {
    use super::*;

    pub fn create_player(ctx: Context<CreatePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.wallet = *ctx.accounts.user.key;
        player.level = 1;
        player.experience = 0;
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
    pub player: Account<'info, PlayerAccount>,  // ← Generated type
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### In TypeScript Clients

```typescript
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';
import { PublicKey } from '@solana/web3.js';

// Serialize account data
const accountData: PlayerAccount = {
  wallet: new PublicKey('...'),
  level: 5,
  experience: 1000,
};

const serialized = borsh.serialize(
  PlayerAccountBorshSchema,
  accountData
);

// Deserialize from on-chain data
const buffer = await connection.getAccountInfo(accountAddress);
const deserialized = borsh.deserialize(
  PlayerAccountBorshSchema,
  buffer.data
) as PlayerAccount;

console.log(`Level: ${deserialized.level}`);
console.log(`XP: ${deserialized.experience}`);
```

---

## Best Practices

:::tip[Keep Schema and Generated Code Synchronized]
Always regenerate code after changing your schema:
```bash
lumos generate schema.lumos
```
:::

:::tip[Don't Edit Generated Files]
Generated files are overwritten on every run. Make changes in `.lumos` files only.
:::

:::tip[Use #[account] for On-Chain Storage]
If data persists in a PDA or account, use `#[account]`:
```rust
#[solana]
#[account]
struct UserProfile { /* ... */ }
```
:::

:::tip[Omit #[account] for Events and Arguments]
Events and instruction parameters don't need `#[account]`:
```rust
#[solana]
struct TransferEvent { /* ... */ }
```
:::

:::caution[TypeScript u64 Precision]
JavaScript `number` loses precision beyond `2^53 - 1`. For large `u64` values:
- Validate ranges on-chain
- Use `BN` or `bigint` in TypeScript
- Display as strings in UI
:::

---

## Formatting

Generated code is automatically formatted if you have the formatters installed:

- **Rust:** `rustfmt` (via `cargo fmt`)
- **TypeScript:** `prettier`

**Disable formatting:**
```bash
lumos generate schema.lumos --no-format
```

---

## See Also

- [CLI Commands](/api/cli-commands) - How to generate code
- [Type System](/api/types) - All supported types
- [Attributes](/api/attributes) - `#[solana]`, `#[account]`
- [Quick Start](/getting-started/quick-start) - End-to-end tutorial
