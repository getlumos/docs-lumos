---
title: Metaplex Token Metadata
description: Generate Metaplex-compatible types and validate NFT schemas
---

LUMOS provides integration with [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata), allowing you to validate NFT schemas against Metaplex constraints and generate compatible code.

## Overview

The Metaplex integration helps you:

- Validate schemas against Metaplex Token Metadata standards
- Generate Metaplex-compatible Rust and TypeScript code
- Access standard Metaplex type definitions

---

## Quick Start

### 1. Define NFT Schema

```rust
// nft.lumos
#[solana]
struct NftMetadata {
    name: String,           // Max 32 chars
    symbol: String,         // Max 10 chars
    uri: String,            // Max 200 chars
    seller_fee_basis_points: u16,  // 0-10000 (0%-100%)
    creators: Option<[Creator]>,
}

#[solana]
struct Creator {
    address: PublicKey,
    verified: bool,
    share: u8,              // Must sum to 100 across all creators
}

#[solana]
struct Collection {
    verified: bool,
    key: PublicKey,
}
```

### 2. Validate Against Metaplex Standards

```bash
lumos metaplex validate nft.lumos
```

**Output:**
```
Metaplex Validation
===================

✓ NftMetadata.name: Valid (max 32 chars)
✓ NftMetadata.symbol: Valid (max 10 chars)
✓ NftMetadata.uri: Valid (max 200 chars)
✓ NftMetadata.seller_fee_basis_points: Valid (0-10000)
✓ Creators: Valid (max 5, shares sum to 100)

Summary: 0 errors, 0 warnings
```

### 3. Generate Code

```bash
lumos metaplex generate nft.lumos --typescript
```

---

## CLI Commands

### `lumos metaplex validate`

Validate schema against Metaplex Token Metadata standards:

```bash
lumos metaplex validate <SCHEMA> [OPTIONS]

Options:
  -f, --format <FMT>     Output format (text or json)
  -v, --verbose          Show all validations
```

**Examples:**

```bash
# Basic validation
lumos metaplex validate nft.lumos

# JSON output for CI
lumos metaplex validate nft.lumos --format json

# Verbose output
lumos metaplex validate nft.lumos --verbose
```

### `lumos metaplex generate`

Generate Metaplex-compatible code:

```bash
lumos metaplex generate <SCHEMA> [OPTIONS]

Options:
  -o, --output <DIR>     Output directory
      --typescript       Generate TypeScript code
      --rust             Generate Rust code (default: true)
      --dry-run          Preview without writing
```

**Examples:**

```bash
# Generate Rust code
lumos metaplex generate nft.lumos

# Generate both Rust and TypeScript
lumos metaplex generate nft.lumos --typescript

# Preview generation
lumos metaplex generate nft.lumos --dry-run
```

### `lumos metaplex types`

Show standard Metaplex type definitions:

```bash
lumos metaplex types [OPTIONS]

Options:
  -f, --format <FMT>     Output format (lumos or json)
```

**Example:**

```bash
lumos metaplex types
```

**Output:**
```rust
// Standard Metaplex Token Metadata types

#[solana]
struct Creator {
    address: PublicKey,
    verified: bool,
    share: u8,
}

#[solana]
struct Collection {
    verified: bool,
    key: PublicKey,
}

#[solana]
struct Uses {
    use_method: UseMethod,
    remaining: u64,
    total: u64,
}

#[solana]
enum UseMethod {
    Burn,
    Multiple,
    Single,
}
```

---

## Metaplex Constraints

### Field Constraints

| Field | Type | Constraint |
|-------|------|------------|
| `name` | `String` | Max 32 characters |
| `symbol` | `String` | Max 10 characters |
| `uri` | `String` | Max 200 characters |
| `seller_fee_basis_points` | `u16` | 0-10000 (0% - 100%) |

### Creator Constraints

| Rule | Constraint |
|------|------------|
| Max creators | 5 |
| Share total | Must sum to 100 |
| Share per creator | 0-100 |

### Validation Example

```bash
lumos metaplex validate nft.lumos --verbose
```

```
Metaplex Validation
===================

Field Validations:
  ✓ NftMetadata.name
    Type: String
    Constraint: Max 32 characters
    Status: Valid

  ✓ NftMetadata.symbol
    Type: String
    Constraint: Max 10 characters
    Status: Valid

  ✓ NftMetadata.uri
    Type: String
    Constraint: Max 200 characters
    Status: Valid

  ✓ NftMetadata.seller_fee_basis_points
    Type: u16
    Constraint: 0-10000 (0% - 100%)
    Status: Valid

Creator Validations:
  ✓ Creator count: 3 (max 5)
  ✓ Share distribution: 40 + 30 + 30 = 100%
  ✓ Individual shares: All in range 0-100

Summary: 0 errors, 0 warnings
```

---

## Generated Code

### Rust Output

```rust
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct NftMetadata {
    /// Max 32 characters
    pub name: String,
    /// Max 10 characters
    pub symbol: String,
    /// Max 200 characters
    pub uri: String,
    /// Royalty in basis points (0-10000)
    pub seller_fee_basis_points: u16,
    pub creators: Option<Vec<Creator>>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    /// Share percentage (0-100), must sum to 100
    pub share: u8,
}

impl NftMetadata {
    pub const NAME_MAX_LEN: usize = 32;
    pub const SYMBOL_MAX_LEN: usize = 10;
    pub const URI_MAX_LEN: usize = 200;
    pub const MAX_CREATORS: usize = 5;
}
```

### TypeScript Output

```typescript
import { PublicKey } from '@solana/web3.js';

export interface NftMetadata {
    /** Max 32 characters */
    name: string;
    /** Max 10 characters */
    symbol: string;
    /** Max 200 characters */
    uri: string;
    /** Royalty in basis points (0-10000, where 10000 = 100%) */
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
}

export interface Creator {
    address: PublicKey;
    verified: boolean;
    /** Share percentage (0-100), must sum to 100 across all creators */
    share: number;
}

export const METADATA_CONSTRAINTS = {
    NAME_MAX_LEN: 32,
    SYMBOL_MAX_LEN: 10,
    URI_MAX_LEN: 200,
    MAX_CREATORS: 5,
    MAX_SELLER_FEE_BASIS_POINTS: 10000,
} as const;
```

---

## Complete NFT Example

### Schema Definition

```rust
// nft-collection.lumos

// Type aliases for clarity
type Royalty = u16;  // Basis points (0-10000)
type SharePercent = u8;  // 0-100

#[solana]
struct Creator {
    address: PublicKey,
    verified: bool,
    share: SharePercent,
}

#[solana]
struct Collection {
    verified: bool,
    key: PublicKey,
}

#[solana]
struct NftMetadata {
    // Basic info
    name: String,
    symbol: String,
    uri: String,

    // Royalties
    seller_fee_basis_points: Royalty,

    // Creators (max 5)
    creators: Option<[Creator]>,

    // Collection
    collection: Option<Collection>,

    // Uses (for limited edition NFTs)
    uses: Option<Uses>,
}

#[solana]
struct Uses {
    use_method: UseMethod,
    remaining: u64,
    total: u64,
}

#[solana]
enum UseMethod {
    Burn,
    Multiple,
    Single,
}
```

### Generate and Validate

```bash
# Validate schema
lumos metaplex validate nft-collection.lumos

# Generate code
lumos metaplex generate nft-collection.lumos \
  --typescript \
  -o ./generated
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate NFT Schema

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install LUMOS CLI
        run: cargo install lumos-cli

      - name: Validate Metaplex Schema
        run: |
          lumos metaplex validate nft.lumos --format json > validation.json
          if [ $(jq '.errors | length' validation.json) -gt 0 ]; then
            echo "Validation failed!"
            cat validation.json
            exit 1
          fi
```

---

## Best Practices

### 1. Validate Before Minting

Always validate schemas before generating mint instructions:

```bash
lumos metaplex validate nft.lumos || exit 1
lumos metaplex generate nft.lumos
```

### 2. Use Type Aliases

Make constraints explicit:

```rust
type Royalty = u16;        // 0-10000 basis points
type SharePercent = u8;    // 0-100%
type MetadataName = String; // Max 32 chars
```

### 3. Document Constraints

Add comments for future maintainers:

```rust
#[solana]
struct NftMetadata {
    /// NFT name (max 32 characters per Metaplex standard)
    name: String,

    /// Trading symbol (max 10 characters)
    symbol: String,
}
```

---

## See Also

- [CLI Commands - Metaplex](/api/cli-commands#metaplex-commands)
- [Anchor Framework](/frameworks/anchor)
- [Type System](/api/types)
- [Metaplex Documentation](https://developers.metaplex.com/)
