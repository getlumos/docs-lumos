---
title: "LUMOS vs Codama: Understanding Solana's Schema Generation Tools"
published: true
description: "A comprehensive comparison of LUMOS and Codama for Solana development - when to use each tool and how they complement each other."
tags: solana, rust, typescript, webdev
canonical_url: https://docs.lumos-lang.org/guides/lumos-vs-codama/
cover_image: https://lumos-lang.org/og-image.png
---

Building on Solana? You've probably wondered: **"Should I use LUMOS or Codama?"**

The answer: **Both. They're complementary, not competing.**

Let me explain why.

## TL;DR

- **LUMOS** = Define data schemas → Generate Rust + TypeScript code (pre-deployment)
- **Codama** = Parse existing programs → Generate client SDKs (post-deployment)

They work at different layers and can be used together.

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

[Codama](https://github.com/codama-idl/codama) is a code generation framework that creates standardized descriptions of Solana programs. It works around a central concept called the **Codama IDL**.

**Core workflow:**
```
Existing Program → Parse → Codama IDL → Generate Clients
     or
Anchor IDL → Convert → Codama IDL → Generate Clients
```

**What Codama does:**
- Parses existing Solana programs or Anchor IDL files
- Creates a unified IDL representation with 60+ node types
- Generates client SDKs in multiple languages (JS, Rust, Python, Dart)
- Produces documentation and tooling for program interfaces

**Primary use case:** "I have a deployed Solana program, now I need to generate client libraries."

---

## What is LUMOS?

[LUMOS](https://lumos-lang.org) is a **schema-first DSL** for defining data structures with guaranteed type safety across Rust and TypeScript.

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

**Primary use case:** "I want a single source of truth for my data types."

---

## Key Differences

### 1. Workflow Direction

| Aspect | LUMOS | Codama |
|--------|-------|--------|
| **Direction** | Forward (schema → code) | Reverse (program → clients) |
| **Input** | `.lumos` schema files | Existing programs or Anchor IDL |
| **Stage** | Pre-deployment | Post-deployment |

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

### 3. Feature Comparison

| Feature | LUMOS | Codama |
|---------|-------|--------|
| Struct definitions | ✅ | ✅ |
| Enum definitions | ✅ | ✅ |
| Borsh serialization | ✅ | ✅ |
| Instruction builders | ❌ | ✅ |
| Error types | ❌ | ✅ |
| CLI generation | ❌ | ✅ |
| Go support | ✅ | ❌ |
| Ruby support | ✅ | ❌ |
| Dart support | ❌ | ✅ |

---

## When to Use Each

### Use LUMOS When:

✅ Defining new data structures for a Solana program
✅ Need Rust + TypeScript type synchronization with Borsh
✅ Building new programs and want a single source of truth
✅ Want compile-time guarantees that types match
✅ Need Go or Ruby code generation

### Use Codama When:

✅ Building clients for existing/deployed programs
✅ Need full SDK generation with instruction builders
✅ Want Dart support or Umi framework integration
✅ Generating documentation for your program
✅ Need CLI tools for program interaction

---

## Using Both Together

Here's how a complete workflow looks:

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

---

## Summary

| Aspect | LUMOS | Codama |
|--------|-------|--------|
| **Philosophy** | Schema-first | IDL-centric |
| **Direction** | Schema → Code | Program → Clients |
| **Stage** | Pre-deployment | Post-deployment |
| **Focus** | Data structures | Full program interface |

**They're complementary tools:**
- Use **LUMOS** when defining your data schemas during development
- Use **Codama** when generating client libraries for distribution

---

## Get Started

- **LUMOS:** [lumos-lang.org](https://lumos-lang.org) | [GitHub](https://github.com/getlumos/lumos)
- **Codama:** [GitHub](https://github.com/codama-idl/codama)

```bash
# Install LUMOS CLI
cargo install lumos-cli

# Generate from schema
lumos generate schema.lumos
```

---

*Have questions? Drop them in the comments below!*
