---
title: Quick Start
description: Create your first LUMOS schema in 5 minutes
---

# LUMOS in 5 Minutes ⚡

Welcome to LUMOS! This guide will get you from zero to working schema in **exactly 5 minutes**.

:::tip[Time Commitment]
⏱️ **Total Time: 5 minutes**
- Installation: 1 minute
- First Schema: 1 minute
- Generate Code: 30 seconds
- Review Output: 1 minute
- Use in Project: 1.5 minutes
:::

---

## Minute 1: Installation

First, install the LUMOS CLI:

```bash
cargo install lumos-cli
```

**Verify installation:**
```bash
lumos --version
# Output: lumos-cli 0.1.0
```

**Optional:** Install VSCode extension for syntax highlighting:
```bash
code --install-extension lumos.lumos-vscode
```

---

## Minute 2: Initialize Project & Write Schema

Create a new LUMOS project:

```bash
lumos init my-game
```

This creates:
- `schema.lumos` - Example schema file
- `lumos.toml` - Configuration file
- `README.md` - Quick reference guide

```
my-game/
├── schema.lumos    ← Your schema definition
├── lumos.toml      ← Configuration
└── README.md       ← Getting started guide
```

---

## 2. Write Your First Schema

Open `schema.lumos` and define your data structures:

```lumos
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
    equipped_items: [PublicKey],
}

#[solana]
struct MatchResult {
    player: PublicKey,
    opponent: Option<PublicKey>,
    score: u64,
    timestamp: i64,
}
```

**What's happening here?**

- `#[solana]` - Marks this as a Solana-specific type
- `#[account]` - Indicates this is an Anchor account (uses Anchor macros)
- `PublicKey` - Solana-specific type (maps to `Pubkey` in Rust, `PublicKey` in TS)
- `[PublicKey]` - Vector/array type
- `Option<T>` - Optional value

---

## Minute 3: Generate Code (30 seconds!)

Generate Rust and TypeScript code from your schema:

```bash
cd my-game
lumos generate schema.lumos
```

**Output:**

```
     Reading schema.lumos
     Parsing schema
  Generating Rust code
       Wrote ./generated.rs
  Generating TypeScript code
       Wrote ./generated.ts
    Finished generated 2 type definitions
```

You now have:
- `generated.rs` - Rust structs with Anchor integration
- `generated.ts` - TypeScript interfaces + Borsh schemas

---

## Minute 4: Inspect Generated Code

### Rust Output (`generated.rs`)

```rust
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
    pub equipped_items: Vec<Pubkey>,
}

pub struct MatchResult {
    pub player: Pubkey,
    pub opponent: Option<Pubkey>,
    pub score: u64,
    pub timestamp: i64,
}
```

### TypeScript Output (`generated.ts`)

```typescript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface PlayerAccount {
  wallet: PublicKey;
  level: number;
  experience: number;
  equipped_items: PublicKey[];
}

export const PlayerAccountBorshSchema = borsh.struct([
  borsh.publicKey('wallet'),
  borsh.u16('level'),
  borsh.u64('experience'),
  borsh.vec(borsh.publicKey(), 'equipped_items'),
]);

export interface MatchResult {
  player: PublicKey;
  opponent: PublicKey | undefined;
  score: number;
  timestamp: number;
}

export const MatchResultBorshSchema = borsh.struct([
  borsh.publicKey('player'),
  borsh.option(borsh.publicKey(), 'opponent'),
  borsh.u64('score'),
  borsh.i64('timestamp'),
]);
```

**Notice:**
- ✅ Types are perfectly synchronized
- ✅ Borsh schemas match field order exactly
- ✅ Anchor `#[account]` macro preserved
- ✅ Optional types handled correctly

---

## Minute 5: Use in Your Anchor Program

### In your Anchor program:

```rust
// programs/my-game/src/lib.rs
mod generated;
use generated::*;

#[program]
pub mod my_game {
    use super::*;

    pub fn create_player(ctx: Context<CreatePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.wallet = *ctx.accounts.user.key;
        player.level = 1;
        player.experience = 0;
        player.equipped_items = Vec::new();
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
    pub player: Account<'info, PlayerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### In your TypeScript app:

```typescript
// app/src/client.ts
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';
import { Connection, PublicKey } from '@solana/web3.js';

async function getPlayerAccount(
  connection: Connection,
  playerPubkey: PublicKey
): Promise<PlayerAccount> {
  const accountInfo = await connection.getAccountInfo(playerPubkey);

  if (!accountInfo) {
    throw new Error('Player account not found');
  }

  // Deserialize using generated Borsh schema
  const player = PlayerAccountBorshSchema.deserialize(accountInfo.data);

  console.log(`Level: ${player.level}, XP: ${player.experience}`);
  return player;
}
```

---

## 🎉 You're Done! (5 Minutes Complete)

**Congratulations!** In just 5 minutes you:

✅ Installed LUMOS CLI
✅ Created your first `.lumos` schema
✅ Generated type-safe Rust + TypeScript code
✅ Saw how to use it in Anchor programs
✅ Learned the complete LUMOS workflow

**What you got:**
- Type-safe schemas shared between Rust and TypeScript
- Automatic Borsh serialization
- Zero manual boilerplate
- Anchor-ready code

**Next:** Build something real! Check out [complete examples →](/examples/)

---

## Beyond 5 Minutes: Development Workflow

### Validate Syntax

Check if your schema has syntax errors:

```bash
lumos validate schema.lumos
```

### Check for Updates

Verify generated code is up-to-date:

```bash
lumos check schema.lumos
```

### Watch Mode (Coming Soon)

Auto-regenerate on file changes:

```bash
lumos generate schema.lumos --watch
```

---

## Next Steps

🎉 **Congratulations!** You've created your first LUMOS schema and generated code.

Now you can:

1. **[Type Mapping →](/guides/type-mapping/)** - Learn all supported types
2. **[Anchor Integration →](/guides/anchor-integration/)** - Deep dive into Anchor features
3. **[Examples →](/examples/gaming/)** - Explore complete real-world schemas
4. **[Enum Support →](/guides/enum-support/)** - Use Rust-style enums

---

## Tips & Best Practices

:::tip
**Keep schemas in version control**
Commit `.lumos` files to git, but add generated files to `.gitignore` and regenerate during build.
:::

:::tip
**Use meaningful names**
Choose clear struct and field names - they'll be used in both Rust and TypeScript.
:::

:::tip
**Leverage Anchor attributes**
Use `#[account]` for on-chain accounts, omit for event/instruction data structures.
:::

:::caution
**Don't manually edit generated code**
Generated files will be overwritten. Make changes in the `.lumos` schema instead.
:::

---

## Common Questions

**Q: Can I use LUMOS with existing projects?**
A: Yes! Generate code and import it into your existing Anchor program or TypeScript app.

**Q: Do I need to commit generated files?**
A: No, regenerate them during build. Add `generated.rs` and `generated.ts` to `.gitignore`.

**Q: Can I customize generated code?**
A: Generated code is meant to be used as-is. For custom logic, import and extend the generated types.

**Q: How do I handle breaking changes?**
A: Update your `.lumos` schema, regenerate, and fix compilation errors. Types stay in sync automatically!
