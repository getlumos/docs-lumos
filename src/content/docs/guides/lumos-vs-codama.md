---
title: LUMOS vs Codama
description: Understanding the differences between LUMOS and Codama for Solana development - complementary tools for different stages of your workflow.
---

## TL;DR

**LUMOS and Codama are complementary, not competing.**

- **LUMOS** = Define data schemas → Generate Rust + TypeScript code (pre-deployment)
- **Codama** = Parse existing programs → Generate client SDKs (post-deployment)

They work at different layers of Solana development and can be used together.

---

## Where Each Tool Fits

```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR SOLANA PROGRAM                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │   ┌──────────────────┐                                 │ │
│  │   │  Account Data    │ ◄── LUMOS generates this        │ │
│  │   │  (structs/enums) │     (data structure code)       │ │
│  │   └──────────────────┘                                 │ │
│  │                                                        │ │
│  │   ┌──────────────────┐                                 │ │
│  │   │  Instructions    │     (you write this manually    │ │
│  │   │  (program logic) │      or with Anchor)            │ │
│  │   └──────────────────┘                                 │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Codama parses program
                              │ and generates...
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   JS    │  │  Rust   │  │ Python  │  │  Dart   │        │
│  │ Client  │  │ Client  │  │ Client  │  │ Client  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                              │
│  ◄── Codama generates these (SDK code to interact)          │
└─────────────────────────────────────────────────────────────┘
```

**Key insight:** LUMOS generates code that goes *inside* your program. Codama generates code that *interacts with* your program from outside.

---

## What is Codama?

[Codama](https://github.com/codama-idl/codama) is a code generation framework that creates standardized descriptions of Solana programs. It works around a central concept called the **Codama IDL** (Interface Definition Language).

**Core workflow:**
```
Existing Program → Parse → Codama IDL → Generate Clients
     or
Anchor IDL → Convert → Codama IDL → Generate Clients
```

**What Codama does:**
- Parses existing Solana programs (via Rust macros) or Anchor IDL files
- Creates a unified IDL representation with 60+ node types
- Generates client SDKs in multiple languages (JS, Rust, Python, Dart)
- Produces documentation and tooling for program interfaces
- Enables blockchain explorers and wallets to understand your program

**Primary use case:** "I have a deployed Solana program, now I need to generate client libraries so others can interact with it."

---

## What is LUMOS?

LUMOS is a **schema-first DSL** (Domain Specific Language) for defining data structures with guaranteed type safety across Rust and TypeScript.

**Core workflow:**
```
.lumos Schema → Parse → IR → Generate Rust + TypeScript
```

**What LUMOS does:**
- Defines data structures in a clean, Rust-like syntax
- Generates Rust structs with proper Borsh serialization
- Generates TypeScript interfaces with matching Borsh schemas
- Ensures type safety between on-chain and off-chain code
- Supports Anchor framework integration via `#[account]` attribute

**Primary use case:** "I want a single source of truth for my data types that generates synchronized Rust and TypeScript code."

---

## Key Differences

### 1. Workflow Direction

| Aspect | LUMOS | Codama |
|--------|-------|--------|
| **Direction** | Forward (schema → code) | Reverse (program → clients) |
| **Input** | `.lumos` schema files | Existing programs or Anchor IDL |
| **Stage** | Pre-deployment | Post-deployment |

**LUMOS:** You write schemas first, then generate the code that becomes part of your program.

```
Write .lumos → Generate → Build Program → Deploy
```

**Codama:** You have a program, then generate clients to interact with it.

```
Build Program → Deploy → Parse with Codama → Generate Clients
```

### 2. What They Generate

**LUMOS generates data structure code:**

```rust
// Input: schema.lumos
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
}
```

```rust
// Output: generated.rs (goes INTO your program)
use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
}
```

**Codama generates client SDK code:**

```typescript
// Output: client SDK (CALLS your program from outside)
await program.methods
  .createPlayer()
  .accounts({
    player: playerPda,
    authority: wallet.publicKey,
  })
  .rpc();
```

### 3. Scope & Coverage

| Feature | LUMOS | Codama |
|---------|-------|--------|
| Struct definitions | ✅ | ✅ (via IDL) |
| Enum definitions | ✅ | ✅ (via IDL) |
| Borsh serialization | ✅ | ✅ |
| Instruction builders | ❌ | ✅ |
| Account validation | ❌ | ✅ |
| Error types | ❌ | ✅ |
| Event parsing | ❌ | ✅ |
| CLI generation | ❌ | ✅ |
| Documentation | ❌ | ✅ |

**LUMOS** is focused: data schemas with Borsh serialization.

**Codama** is comprehensive: full program interface including instructions, errors, and events.

### 4. Supported Languages

| Language | LUMOS | Codama |
|----------|-------|--------|
| Rust | ✅ | ✅ |
| TypeScript | ✅ | ✅ (Solana Kit, Umi) |
| Python | ✅ | ✅ |
| Go | ✅ | ❌ |
| Ruby | ✅ | ❌ |
| Dart | ❌ | ✅ |

### 5. Anchor Integration

**LUMOS:** Context-aware generation. Detects `#[account]` and generates appropriate imports:

```rust
// With #[account] → uses anchor_lang::prelude::*
// Without → uses borsh::{BorshSerialize, BorshDeserialize}
```

**Codama:** Accepts Anchor IDL as input, converts to Codama IDL format, then generates clients.

---

## When to Use Each

### Use LUMOS When:

✅ **Defining new data structures** for a Solana program
✅ **Need Rust + TypeScript type synchronization** with Borsh
✅ **Building new programs** and want a single source of truth
✅ **Want compile-time guarantees** that types match across languages
✅ **Need Go or Ruby** code generation

### Use Codama When:

✅ **Building clients** for existing/deployed programs
✅ **Need full SDK generation** with instruction builders
✅ **Want Dart support** or Umi framework integration
✅ **Generating documentation** for your program
✅ **Need CLI tools** for program interaction

### Decision Matrix

| Your Situation | Recommendation |
|----------------|----------------|
| "I'm starting a new Solana program" | Start with **LUMOS** for data schemas |
| "I need to call an existing program" | Use **Codama** to generate clients |
| "I want type-safe Rust + TS structs" | Use **LUMOS** |
| "I need a full client SDK with all instructions" | Use **Codama** |
| "I'm using Anchor and need clean account structs" | Use **LUMOS** |
| "I want to publish an SDK for my program" | Use **Codama** |

---

## Using Both Together

LUMOS and Codama can work together in a complete development workflow:

### Combined Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Define Data Structures (LUMOS)                    │
│                                                             │
│  schema.lumos → lumos generate → generated.rs + generated.ts│
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Build Program (Anchor/Native)                     │
│                                                             │
│  Use generated.rs in your program + write instructions      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Deploy & Generate Clients (Codama)                │
│                                                             │
│  Deploy program → Parse IDL → Generate full client SDKs     │
└─────────────────────────────────────────────────────────────┘
```

### Example Project Structure

```
my-solana-project/
├── schemas/
│   └── accounts.lumos        # LUMOS source of truth
├── programs/my-program/
│   └── src/
│       ├── state/
│       │   └── generated.rs  # Generated by LUMOS
│       └── lib.rs            # Your instruction logic
├── clients/
│   ├── typescript/           # Generated by Codama (full SDK)
│   ├── python/               # Generated by Codama
│   └── rust/                 # Generated by Codama
└── app/
    └── src/
        └── types.ts          # Generated by LUMOS (type definitions)
```

### When This Makes Sense

1. **LUMOS for internal type safety:** Your team uses LUMOS to ensure Rust and TypeScript types stay synchronized during development.

2. **Codama for external distribution:** When you're ready to publish, use Codama to generate comprehensive client SDKs with instruction builders, error handling, and documentation.

---

## Summary Comparison Table

| Aspect | LUMOS | Codama |
|--------|-------|--------|
| **Philosophy** | Schema-first | IDL-centric |
| **Direction** | Schema → Code | Program → Clients |
| **Stage** | Pre-deployment | Post-deployment |
| **Focus** | Data structures | Full program interface |
| **Input** | `.lumos` files | Programs / Anchor IDL |
| **Output** | Rust + TS structs | Client SDKs |
| **Rust** | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ (Solana Kit, Umi) |
| **Python** | ✅ | ✅ |
| **Go** | ✅ | ❌ |
| **Ruby** | ✅ | ❌ |
| **Dart** | ❌ | ✅ |
| **Instructions** | ❌ | ✅ |
| **Error types** | ❌ | ✅ |
| **CLI generation** | ❌ | ✅ |
| **Complexity** | Simple, focused | Comprehensive |

---

## Conclusion

**LUMOS and Codama solve different problems at different stages:**

- **LUMOS** = "I want type-safe data structures for my program"
- **Codama** = "I want client SDKs to interact with a program"

They're complementary tools. Use LUMOS when defining your data schemas during development. Use Codama when generating client libraries for distribution.

**Get started:**
- [LUMOS Installation →](/getting-started/installation/)
- [Codama Repository →](https://github.com/codama-idl/codama)
