---
title: Introduction
description: Learn what LUMOS is and why it's the best tool for Solana development
---

## What is LUMOS?

LUMOS is a **type-safe schema language** designed specifically for Solana development. It bridges the gap between Rust (on-chain programs) and TypeScript (frontend applications) by providing a single source of truth for your data structures.

**In one sentence:** Write your data structures once in LUMOS, and automatically generate perfectly synchronized Rust and TypeScript code with guaranteed Borsh serialization compatibility.

---

## The Problem

Building full-stack Solana applications is challenging because you need to maintain **identical type definitions in two different languages**:

### Without LUMOS

```rust
// programs/src/state.rs (Rust)
#[derive(BorshSerialize, BorshDeserialize)]
pub struct GameState {
    pub player: Pubkey,
    pub score: u64,
    pub level: u16,
}
```

```typescript
// app/src/types.ts (TypeScript)
interface GameState {
  player: PublicKey;
  score: number;
  level: number;
}

// And you need to write Borsh schema manually...
const GameStateBorshSchema = borsh.struct([
  borsh.publicKey('player'),
  borsh.u64('score'),
  borsh.u16('level'),
]);
```

**Problems:**
- 🔴 Manual synchronization required (error-prone)
- 🔴 Type mismatches cause runtime failures
- 🔴 Refactoring breaks in multiple places
- 🔴 No single source of truth
- 🔴 Borsh schema written manually (field order must match exactly)

---

## The Solution

### With LUMOS

```lumos
#[solana]
struct GameState {
    player: PublicKey,
    score: u64,
    level: u16,
}
```

Run `lumos generate schema.lumos` and get:

- ✅ **Perfect Rust code** with correct derives
- ✅ **Perfect TypeScript code** with interfaces + Borsh schemas
- ✅ **Types always in sync** (impossible to drift)
- ✅ **Borsh schema auto-generated** (field order guaranteed)
- ✅ **Refactor once** (changes propagate everywhere)

---

## How It Works

LUMOS uses a **compiler-based approach** similar to Protocol Buffers or GraphQL Code Generator:

```
┌─────────────────────────────────────────────┐
│  1. Write Schema (.lumos file)             │
│     ↓                                        │
│  2. Parser → AST (Abstract Syntax Tree)    │
│     ↓                                        │
│  3. Transform → IR (Intermediate Rep)      │
│     ↓                                        │
│  4. Generate → Rust + TypeScript           │
└─────────────────────────────────────────────┘
```

**Key Innovation:** Language-agnostic IR (Intermediate Representation) makes it easy to add support for new languages in the future (Python, C++, Go, etc.)

---

## Key Features

### 🎯 Single Source of Truth

Define data structures once. Generate code for multiple languages.

### 🔐 100% Type Safety

Complete bidirectional type mapping ensures Rust and TypeScript types are always compatible. Runtime deserialization errors are impossible.

### ⚓ Anchor Framework Integration

First-class support for Anchor programs. LUMOS understands `#[account]` attributes and generates code without derive conflicts.

### 📦 Borsh Serialization

Automatic Borsh schema generation for both languages. Field order, type sizes, and serialization format guaranteed to match.

### 🧠 Context-Aware Generation

Intelligent analysis determines optimal imports, derives, and patterns:
- Anchor accounts → `anchor_lang::prelude::*`
- Pure Borsh → `borsh::{BorshSerialize, BorshDeserialize}`
- Mixed modules → Smart import resolution

### 🧩 Extensible Architecture

IR-based design makes adding new target languages straightforward.

### ✅ Production Ready

- 64/64 tests passing (100% success rate)
- E2E tests with actual Rust compilation
- Battle-tested on real-world examples
- Published on crates.io

---

## Who Should Use LUMOS?

**LUMOS is perfect for:**

✅ **Solana developers** building full-stack applications
✅ **Teams** maintaining Rust + TypeScript codebases
✅ **Projects** using Anchor framework
✅ **Anyone** tired of manual type synchronization
✅ **Developers** who value type safety and code generation

**Not a fit for:**

❌ Simple projects with only Rust or only TypeScript (no cross-language need)
❌ Projects not using Borsh serialization
❌ Non-Solana blockchain projects (though it could be adapted)

---

## Comparison with Alternatives

### Manual Synchronization

**Status Quo:** Write types in both languages manually.

- ❌ Error-prone
- ❌ Time-consuming
- ❌ Hard to maintain
- ✅ Full control

### Copy-Paste

**Common approach:** Copy Rust struct to TypeScript and convert.

- ❌ Gets out of sync quickly
- ❌ Borsh schema still manual
- ❌ Refactoring nightmare
- ✅ Fast initially

### LUMOS

**Best approach:** Write once, generate everywhere.

- ✅ Always in sync
- ✅ Borsh auto-generated
- ✅ Refactor with confidence
- ✅ Production-ready code
- ⚠️ Learning curve (minimal)

---

## Real-World Impact

### Before LUMOS

```
Developer adds field to Rust struct
→ Forgets to update TypeScript
→ Deploys contract
→ Frontend breaks in production
→ 2 hours debugging
→ Rollback or hotfix
```

### After LUMOS

```
Developer adds field to .lumos schema
→ Runs lumos generate
→ TypeScript compiler errors immediately
→ Fix frontend before deploy
→ 5 minutes total
→ Ship with confidence
```

---

## Architecture Highlights

### Parser

Built on **syn** (Rust's official parsing library), ensuring robust and correct parsing.

### IR (Intermediate Representation)

Language-agnostic representation enables:
- Easy addition of new target languages
- Consistent transformations
- Better testing

### Generators

Specialized code generators for:
- **Rust:** Context-aware imports, derive selection, Anchor integration
- **TypeScript:** Interface generation, Borsh schemas, type mapping

---

## What's Next?

Ready to get started?

1. **[Install LUMOS →](/getting-started/installation/)** - Get the CLI in 2 minutes
2. **[Quick Start →](/getting-started/quick-start/)** - Create your first schema
3. **[Examples →](/examples/gaming/)** - See real-world use cases

Or dive deeper:

- **[Type Mapping →](/guides/type-mapping/)** - Learn all supported types
- **[Anchor Integration →](/guides/anchor-integration/)** - Anchor-specific features
- **[Enum Support →](/guides/enum-support/)** - Use Rust-style enums

---

## Community & Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/getlumos/lumos/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/getlumos/lumos/discussions)
- 📦 **Packages:** [crates.io](https://crates.io/crates/lumos-core)
- ⭐ **Star:** [GitHub Repo](https://github.com/getlumos/lumos)

---

**Built with ❤️ for the Solana community by RECTOR**
