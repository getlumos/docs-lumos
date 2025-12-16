---
title: Anchor Framework
description: Generate complete Anchor programs from LUMOS schemas
---

LUMOS provides deep integration with the [Anchor framework](https://www.anchor-lang.com/), allowing you to generate complete Solana programs with account contexts, IDL, and TypeScript clients.

## LUMOS + Anchor: Better Together

:::tip[Key Point]
**LUMOS complements Anchor, it doesn't replace it.** LUMOS generates Anchor-compatible code from a schema, giving you a single source of truth for your data structures.
:::

Think of it this way:
- **Anchor** = The framework that runs your Solana program
- **LUMOS** = The tool that generates Anchor code from a schema

**Why use both?**

| Without LUMOS | With LUMOS |
|---------------|------------|
| Manually write Rust structs | Define once in `.lumos` schema |
| Manually write TypeScript types | Auto-generate TypeScript |
| Hope Rust ↔ TS stay in sync | Guaranteed sync (same source) |
| Calculate account space by hand | Auto-calculated `LEN` constants |
| Write IDL manually or extract | Auto-generate IDL from schema |

**LUMOS generates standard Anchor code** - your program still uses `anchor_lang`, `#[account]`, `#[program]`, and everything else you know. The difference is you define your types once and generate the rest.

---

## When to Use LUMOS vs Anchor Alone

| Scenario | Recommendation |
|----------|----------------|
| Starting a new Anchor project | ✅ Use LUMOS - define schema first, generate code |
| Existing Anchor project, want type sync | ✅ Use LUMOS - adopt gradually for new types |
| Simple program, few account types | ⚠️ Either works - Anchor alone is fine |
| Complex program, many shared types | ✅ Use LUMOS - prevents drift between Rust/TS |
| Need custom IDL modifications | ⚠️ Start with LUMOS, customize after |
| Team with mixed Rust/TS developers | ✅ Use LUMOS - schema is readable by all |

**Bottom line:** If you're writing TypeScript clients that interact with your Anchor program, LUMOS saves you from maintaining duplicate type definitions.

---

## Overview

When your schema uses `#[account]` attributes, LUMOS automatically generates Anchor-compatible code:

```rust
// schema.lumos
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
}
```

This generates:
- Rust structs with `#[account]` derive
- Account `LEN` constants for space calculation
- Anchor IDL JSON
- Optional TypeScript client

---

## Quick Start

### 1. Define Schema

```rust
// game.lumos
#[solana]
#[account]
struct GameConfig {
    authority: PublicKey,
    max_players: u32,
    entry_fee: u64,
    prize_pool: u64,
}

#[solana]
#[account]
struct Player {
    wallet: PublicKey,
    game: PublicKey,
    score: u64,
    joined_at: i64,
}

#[solana]
enum GameInstruction {
    Initialize { max_players: u32, entry_fee: u64 },
    JoinGame,
    UpdateScore { score: u64 },
    ClaimPrize,
}
```

### 2. Generate Anchor Program

```bash
lumos anchor generate game.lumos \
  --name game_program \
  --typescript
```

### 3. Generated Structure

```
game_program/
├── programs/game_program/
│   ├── src/
│   │   ├── lib.rs           # Program entry point
│   │   └── state.rs         # Account structs
│   └── Cargo.toml
├── target/idl/
│   └── game_program.json    # Anchor IDL
└── client/
    └── game_program.ts      # TypeScript client
```

---

## CLI Commands

### `lumos anchor generate`

Generate a complete Anchor program:

```bash
lumos anchor generate <SCHEMA> [OPTIONS]

Options:
  -o, --output <DIR>      Output directory
  -n, --name <NAME>       Program name
  -V, --version <VER>     Program version (default: 0.1.0)
  -a, --address <ADDR>    Program address
      --typescript        Generate TypeScript client
      --dry-run           Preview without writing
```

**Examples:**

```bash
# Basic generation
lumos anchor generate game.lumos

# Full options
lumos anchor generate game.lumos \
  --name my_game \
  --version 1.0.0 \
  --address "Game111111111111111111111111111111111111111" \
  --typescript

# Preview generation
lumos anchor generate game.lumos --dry-run
```

### `lumos anchor idl`

Generate only the Anchor IDL:

```bash
lumos anchor idl <SCHEMA> [OPTIONS]

Options:
  -o, --output <FILE>     Output file path
  -n, --name <NAME>       Program name
  -p, --pretty            Pretty print JSON
```

**Example:**

```bash
lumos anchor idl game.lumos --pretty -o target/idl/game.json
```

### `lumos anchor space`

Calculate account space constants:

```bash
lumos anchor space <SCHEMA> [OPTIONS]

Options:
  -f, --format <FMT>      Output format (text or rust)
  -a, --account <NAME>    Specific account type
```

**Example:**

```bash
lumos anchor space game.lumos --format rust
```

---

## Generated Code

### Account Structs

```rust
// state.rs
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GameConfig {
    pub authority: Pubkey,
    pub max_players: u32,
    pub entry_fee: u64,
    pub prize_pool: u64,
}

impl GameConfig {
    pub const LEN: usize = 8  // discriminator
        + 32  // authority
        + 4   // max_players
        + 8   // entry_fee
        + 8;  // prize_pool
}
```

### Program Entry

```rust
// lib.rs
use anchor_lang::prelude::*;

mod state;
use state::*;

declare_id!("Game111111111111111111111111111111111111111");

#[program]
pub mod game_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        max_players: u32,
        entry_fee: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.max_players = max_players;
        config.entry_fee = entry_fee;
        config.prize_pool = 0;
        Ok(())
    }

    // ... other instructions
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameConfig::LEN
    )]
    pub config: Account<'info, GameConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### IDL Output

```json
{
  "version": "1.0.0",
  "name": "game_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "config", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "maxPlayers", "type": "u32" },
        { "name": "entryFee", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "GameConfig",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "maxPlayers", "type": "u32" },
          { "name": "entryFee", "type": "u64" },
          { "name": "prizePool", "type": "u64" }
        ]
      }
    }
  ]
}
```

### TypeScript Client

```typescript
// game_program.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GameProgram } from "./types/game_program";

export class GameProgramClient {
  program: Program<GameProgram>;

  constructor(
    connection: anchor.web3.Connection,
    wallet: anchor.Wallet
  ) {
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    this.program = new Program(IDL, PROGRAM_ID, provider);
  }

  async initialize(
    maxPlayers: number,
    entryFee: anchor.BN
  ): Promise<string> {
    const config = anchor.web3.Keypair.generate();

    return await this.program.methods
      .initialize(maxPlayers, entryFee)
      .accounts({
        config: config.publicKey,
        authority: this.program.provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([config])
      .rpc();
  }

  // ... other methods
}
```

---

## Account Attributes

### `#[account]`

Marks a struct as an Anchor account:

```rust
#[solana]
#[account]
struct MyAccount {
    data: u64,
}
```

### Account Constraints (Schema Annotations)

LUMOS supports Anchor account constraints via schema annotations:

```rust
#[solana]
#[account]
#[init]
struct NewAccount {
    owner: PublicKey,
    data: u64,
}

#[solana]
#[account]
#[mut]
struct MutableAccount {
    balance: u64,
}

#[solana]
#[account]
#[signer]
struct AuthorityAccount {
    authority: PublicKey,
}
```

---

## Space Calculation

LUMOS automatically calculates account space including the 8-byte discriminator:

| Type | Size |
|------|------|
| `bool` | 1 byte |
| `u8` / `i8` | 1 byte |
| `u16` / `i16` | 2 bytes |
| `u32` / `i32` | 4 bytes |
| `u64` / `i64` | 8 bytes |
| `u128` / `i128` | 16 bytes |
| `PublicKey` | 32 bytes |
| `String` | 4 + length |
| `Vec<T>` | 4 + (count × size) |
| `Option<T>` | 1 + size |

**Example:**

```bash
lumos anchor space game.lumos
```

```
Account Space Constants
=======================

GameConfig:
  DISCRIMINATOR:   8 bytes
  authority:      32 bytes
  max_players:     4 bytes
  entry_fee:       8 bytes
  prize_pool:      8 bytes
  ──────────────────────────
  TOTAL (LEN):    60 bytes
```

---

## Integration with Existing Projects

### Add to Existing Anchor Project

```bash
# In your Anchor project root
lumos anchor generate schemas/game.lumos \
  --output programs/game/src/lumos_generated.rs

# Import in lib.rs
mod lumos_generated;
use lumos_generated::*;
```

### Build and Test

```bash
# Build the program
anchor build

# Run tests
anchor test
```

---

## Best Practices

### 1. Schema-First Development

Define your schema first, then generate code:

```rust
// Define complete data model
#[solana]
#[account]
struct User { ... }

#[solana]
#[account]
struct Post { ... }

// Generate, then build
```

### 2. Version Control

Track both schema and generated code:

```gitignore
# Keep generated code in version control
# Don't ignore: programs/*/src/generated.rs
```

### 3. Regenerate on Schema Changes

Add to your build process:

```json
// package.json
{
  "scripts": {
    "codegen": "lumos anchor generate schema.lumos",
    "build": "npm run codegen && anchor build"
  }
}
```

### 4. Use Type Aliases for Clarity

```rust
type UserId = PublicKey;
type Lamports = u64;

#[solana]
#[account]
struct Stake {
    user: UserId,
    amount: Lamports,
}
```

---

## Common Patterns

### PDA (Program Derived Address) Accounts

PDAs are accounts whose address is derived from seeds. Define the account structure in LUMOS, derive the PDA in your Anchor code:

```rust
// schema.lumos
#[solana]
#[account]
struct UserProfile {
    authority: PublicKey,
    username: String,
    reputation: u64,
    created_at: i64,
}
```

```rust
// In your Anchor program
#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + UserProfile::LEN,
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### One-to-Many Relationships

Model relationships using PublicKey references:

```rust
// schema.lumos
#[solana]
#[account]
struct Collection {
    authority: PublicKey,
    name: String,
    item_count: u32,
}

#[solana]
#[account]
struct Item {
    collection: PublicKey,  // Reference to parent
    owner: PublicKey,
    name: String,
    attributes: Vec<u8>,
}
```

### Token Account Integration

When working with SPL tokens alongside LUMOS-generated accounts:

```rust
// schema.lumos
#[solana]
#[account]
struct Vault {
    authority: PublicKey,
    token_mint: PublicKey,      // SPL token mint
    token_account: PublicKey,   // Associated token account
    total_deposited: u64,
    is_locked: bool,
}
```

```rust
// Anchor context
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub authority: Signer<'info>,
}
```

### Enum-Based State Machines

Use LUMOS enums for program state:

```rust
// schema.lumos
#[solana]
enum AuctionState {
    Created,
    Active { start_time: i64 },
    Ended { winner: PublicKey, final_bid: u64 },
    Cancelled,
}

#[solana]
#[account]
struct Auction {
    authority: PublicKey,
    item_mint: PublicKey,
    state: AuctionState,
    min_bid: u64,
    current_bid: u64,
}
```

---

## Troubleshooting

### "Cannot find type" error

Ensure all referenced types are defined in the schema or imported.

```rust
// Bad - UndefinedType not in schema
struct MyAccount {
    data: UndefinedType,  // Error!
}

// Good - all types defined
struct MyData {
    value: u64,
}

struct MyAccount {
    data: MyData,  // Works
}
```

### IDL mismatch

Regenerate IDL after schema changes:

```bash
lumos anchor idl schema.lumos -o target/idl/program.json
```

### Space calculation wrong

Use `lumos anchor space` to verify:

```bash
lumos anchor space schema.lumos --format rust
```

### "Discriminator mismatch" at runtime

This happens when the account struct definition changed but the on-chain account wasn't migrated. Solutions:

1. **Development:** Close and recreate the account
2. **Production:** Implement account migration logic

### Generated code has compile errors

Check your schema for:
- Reserved Rust keywords used as field names (`type`, `move`, `ref`)
- Circular type references
- Missing `#[solana]` attribute

```rust
// Bad - 'type' is reserved
struct Token {
    type: u8,  // Error!
}

// Good - use different name
struct Token {
    token_type: u8,
}
```

### TypeScript types don't match runtime values

Ensure you regenerated TypeScript after schema changes:

```bash
lumos generate schema.lumos --lang ts -o client/types.ts
```

### Anchor test fails with "Account not found"

The account might not be initialized. Check:
1. Account is created before being accessed
2. PDA seeds match between init and access
3. Program ID is correct

### "Program failed to complete" without details

Enable Anchor's verbose logging:

```bash
RUST_LOG=solana_runtime::system_instruction_processor=trace anchor test
```

### How to update schema without breaking existing accounts?

Follow these rules for backward compatibility:
- ✅ Add new optional fields at the end
- ✅ Add new enum variants at the end
- ❌ Don't remove or reorder fields
- ❌ Don't change field types

See [Schema Migrations](/guides/schema-migrations) for detailed guidance.

---

## See Also

- [CLI Commands](/api/cli-commands#anchor-framework-commands)
- [Native Solana](/frameworks/native-solana)
- [Generated Code](/api/generated-code)
- [Type System](/api/types)
