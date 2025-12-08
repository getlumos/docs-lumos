---
title: CLI Commands
description: Complete reference for all LUMOS CLI commands
---

The LUMOS CLI (`lumos`) provides commands for code generation, validation, and schema evolution.

## Installation

```bash
cargo install lumos-cli
```

**Verify installation:**
```bash
lumos --version
# Output: lumos-cli 0.1.0
```

---

## `lumos generate`

Generate Rust and TypeScript code from a `.lumos` schema file.

### Usage

```bash
lumos generate <SCHEMA_FILE> [OPTIONS]
```

### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory for generated files | Current directory |
| `--lang` | `-l` | Target languages (comma-separated) | `rust,typescript` |
| `--target` | `-t` | Target framework (`auto`, `native`, `anchor`) | `auto` |
| `--watch` | `-w` | Watch for changes and regenerate | `false` |
| `--dry-run` | `-n` | Preview changes without writing files | `false` |
| `--backup` | `-b` | Create backup before overwriting | `false` |
| `--show-diff` | `-d` | Show diff and ask for confirmation | `false` |
| `--help` | `-h` | Print help information | - |

**Supported languages:** `rust` (rs), `typescript` (ts), `python` (py), `go`, `ruby` (rb)

**Target frameworks:**
- `auto` - Detect based on `#[account]` attribute (default)
- `native` - Force pure Borsh, no Anchor dependencies
- `anchor` - Use Anchor framework (requires `#[account]`)

### Examples

**Basic generation:**
```bash
lumos generate schema.lumos
```

Generates:
- `./generated.rs` - Rust structs and enums
- `./generated.ts` - TypeScript interfaces + Borsh schemas

**Custom output directory:**
```bash
lumos generate schema.lumos -o ./src/generated
```

**Multi-language generation:**
```bash
# Generate Rust, TypeScript, and Python
lumos generate schema.lumos --lang rust,typescript,python

# Generate all supported languages
lumos generate schema.lumos --lang rust,typescript,python,go,ruby
```

**Force native Solana mode:**
```bash
lumos generate schema.lumos --target native
```

**Watch mode for development:**
```bash
lumos generate schema.lumos --watch
# Watches for changes and regenerates automatically
```

**Safe file operations:**
```bash
# Preview changes without writing
lumos generate schema.lumos --dry-run

# Create backup before overwriting
lumos generate schema.lumos --backup

# Show diff and confirm before writing
lumos generate schema.lumos --show-diff
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - files generated |
| 1 | Parse error - invalid `.lumos` syntax |
| 2 | Transform error - unsupported types or attributes |
| 3 | I/O error - cannot write files |

### Common Errors

**File not found:**
```
Error: Schema file not found: schema.lumos
```
**Fix:** Check file path is correct.

**Parse error:**
```
Error: Failed to parse schema
  --> schema.lumos:5:12
  |
5 |     level u16,
  |          ^ expected ':'
```
**Fix:** Add `:` after field name (`level: u16`).

**Invalid type:**
```
Error: Unsupported type 'f64' at line 10
```
**Fix:** Use supported types only. See [Type System](/api/types).

---

## `lumos validate`

Check if a `.lumos` schema file has valid syntax.

### Usage

```bash
lumos validate <SCHEMA_FILE>
```

### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

### Examples

**Valid schema:**
```bash
lumos validate schema.lumos
# Output: ✓ Schema is valid
# Exit code: 0
```

**Invalid schema:**
```bash
lumos validate bad_schema.lumos
# Output:
# Error: Failed to parse schema
#   --> bad_schema.lumos:3:5
#   |
# 3 |     invalid syntax here
#   |     ^^^^^^^ unexpected token
# Exit code: 1
```

### Use Cases

1. **Pre-commit hook** - Validate before committing
2. **CI/CD pipeline** - Ensure schemas are valid
3. **Editor integration** - Real-time syntax checking

### Example: Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Find all .lumos files
LUMOS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\\.lumos$')

if [ -n "$LUMOS_FILES" ]; then
  for file in $LUMOS_FILES; do
    lumos validate "$file"
    if [ $? -ne 0 ]; then
      echo "❌ Validation failed for $file"
      exit 1
    fi
  done
  echo "✅ All schemas valid"
fi
```

---

## `lumos init`

Initialize a new LUMOS project with example schema and configuration.

### Usage

```bash
lumos init [PROJECT_NAME]
```

### Arguments

- `[PROJECT_NAME]` - Optional directory name (defaults to current directory)

### Examples

**Create new project:**
```bash
lumos init my-solana-app
cd my-solana-app
```

**Initialize current directory:**
```bash
mkdir my-project && cd my-project
lumos init
```

### Generated Files

```
my-solana-app/
├── schema.lumos       # Example schema
├── lumos.toml         # Configuration file
└── README.md          # Getting started guide
```

**`schema.lumos` (example):**
```rust
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
    experience: u64,
}
```

**`lumos.toml` (configuration):**
```toml
[generation]
rust_output = "generated.rs"
typescript_output = "generated.ts"
format = true

[imports]
rust_prelude = true
```

---

## `lumos check`

Verify that generated code is up-to-date with schema.

### Usage

```bash
lumos check <SCHEMA_FILE>
```

### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

### Examples

**Schema and generated files match:**
```bash
lumos check schema.lumos
# Output: ✓ Generated files are up-to-date
# Exit code: 0
```

**Schema changed, need regeneration:**
```bash
lumos check schema.lumos
# Output: ⚠️  Generated files are outdated
#         Run: lumos generate schema.lumos
# Exit code: 1
```

**Generated files missing:**
```bash
lumos check schema.lumos
# Output: ⚠️  Generated files not found
#         Run: lumos generate schema.lumos
# Exit code: 1
```

### Use Cases

1. **CI/CD Pipeline** - Ensure developers ran `generate` before committing
2. **Build Scripts** - Automatically regenerate if needed
3. **Pre-build Hook** - Verify code is current

### Example: package.json Script

```json
{
  "scripts": {
    "prebuild": "lumos check schema.lumos || lumos generate schema.lumos",
    "build": "anchor build"
  }
}
```

### Example: GitHub Actions

```yaml
name: Check LUMOS Schemas

on: [push, pull_request]

jobs:
  check-schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install LUMOS CLI
        run: cargo install lumos-cli

      - name: Check schemas are up-to-date
        run: |
          for schema in $(find . -name "*.lumos"); do
            lumos check "$schema"
          done
```

---

## Schema Evolution Commands

These commands help you manage schema changes and migrations between versions.

### `lumos diff`

Compare two schema files and show differences.

#### Usage

```bash
lumos diff <SCHEMA1> <SCHEMA2> [OPTIONS]
```

#### Arguments

- `<SCHEMA1>` - Path to the first (older) schema file
- `<SCHEMA2>` - Path to the second (newer) schema file

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `json`) | `text` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Compare two versions:**
```bash
lumos diff schema-v1.lumos schema-v2.lumos
```

**Output (text):**
```
Schema Differences
==================

+ Added struct: PlayerStats
  - level: u16
  - experience: u64

~ Modified struct: PlayerAccount
  + Added field: stats (PlayerStats)
  - Removed field: score (u32)

- Removed enum: OldStatus
```

**JSON output for scripting:**
```bash
lumos diff schema-v1.lumos schema-v2.lumos --format json
```

```json
{
  "added": [
    { "type": "struct", "name": "PlayerStats" }
  ],
  "modified": [
    {
      "type": "struct",
      "name": "PlayerAccount",
      "changes": {
        "added_fields": ["stats"],
        "removed_fields": ["score"]
      }
    }
  ],
  "removed": [
    { "type": "enum", "name": "OldStatus" }
  ]
}
```

---

### `lumos check-compat`

Check backward compatibility between two schema versions.

#### Usage

```bash
lumos check-compat <FROM_SCHEMA> <TO_SCHEMA> [OPTIONS]
```

#### Arguments

- `<FROM_SCHEMA>` - Path to the old schema file (v1)
- `<TO_SCHEMA>` - Path to the new schema file (v2)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `json`) | `text` |
| `--verbose` | `-v` | Show detailed explanations | `false` |
| `--strict` | `-s` | Treat warnings as errors | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Check compatibility:**
```bash
lumos check-compat schema-v1.lumos schema-v2.lumos
```

**Output (compatible):**
```
✓ Schema is backward compatible

Changes detected:
  - Added optional field: PlayerAccount.nickname (Option<String>)
  - Added struct: AchievementData

These changes are safe for existing on-chain accounts.
```

**Output (breaking changes):**
```
✗ Schema has breaking changes

Breaking changes detected:
  ✗ Changed field type: PlayerAccount.score (u32 → u64)
    Reason: Different byte size (4 → 8 bytes)
    Impact: Existing accounts cannot be deserialized

  ✗ Removed field: PlayerAccount.legacy_data
    Reason: Field removal changes Borsh layout
    Impact: Data corruption on deserialization

Run 'lumos migrate' to generate migration code.
```

**Verbose mode for CI/CD:**
```bash
lumos check-compat old.lumos new.lumos --verbose --strict
```

#### Use Cases

1. **Pre-merge check** - Validate schema changes in PR
2. **Release validation** - Ensure new version won't break production
3. **CI/CD pipeline** - Automated compatibility testing

#### Example: GitHub Actions

```yaml
- name: Check Schema Compatibility
  run: |
    lumos check-compat main-schema.lumos pr-schema.lumos --strict
```

---

### `lumos migrate`

Generate migration code from one schema version to another.

#### Usage

```bash
lumos migrate <FROM_SCHEMA> <TO_SCHEMA> [OPTIONS]
```

#### Arguments

- `<FROM_SCHEMA>` - Path to the old schema file (v1)
- `<TO_SCHEMA>` - Path to the new schema file (v2)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | stdout |
| `--language` | `-l` | Target language (`rust`, `typescript`, `both`) | `both` |
| `--dry-run` | `-n` | Show changes without generating code | `false` |
| `--force` | `-f` | Force generation for unsafe migrations | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Preview migration (dry run):**
```bash
lumos migrate schema-v1.lumos schema-v2.lumos --dry-run
```

**Output:**
```
Migration: schema-v1.lumos → schema-v2.lumos

Required migrations:
  1. PlayerAccount.score: u32 → u64
     - Requires account reallocation (+4 bytes)
     - Safe: value range expansion

  2. PlayerAccount.stats: (new field)
     - Requires account reallocation (+10 bytes)
     - Default value needed

Generated files (dry run):
  - migration.rs (Rust migration instruction)
  - migration.ts (TypeScript client helper)
```

**Generate Rust migration:**
```bash
lumos migrate schema-v1.lumos schema-v2.lumos -l rust -o migration.rs
```

**Generated `migration.rs`:**
```rust
use anchor_lang::prelude::*;

/// Migration from v1 to v2
pub fn migrate_player_account(
    old_data: &[u8],
    new_account: &mut PlayerAccountV2,
) -> Result<()> {
    // Read old format
    let old = PlayerAccountV1::try_from_slice(old_data)?;

    // Transform to new format
    new_account.wallet = old.wallet;
    new_account.score = old.score as u64;  // Safe upcast
    new_account.stats = PlayerStats::default();  // New field

    Ok(())
}
```

**Generate TypeScript migration:**
```bash
lumos migrate schema-v1.lumos schema-v2.lumos -l typescript -o migration.ts
```

**Force unsafe migration:**
```bash
lumos migrate schema-v1.lumos schema-v2.lumos --force
```

:::caution[Unsafe Migrations]
Use `--force` only when you understand the risks. Unsafe migrations may cause data loss if not handled correctly.
:::

---

## Account Analysis Commands

### `lumos check-size`

Analyze account sizes and check against Solana limits.

#### Usage

```bash
lumos check-size <SCHEMA_FILE> [OPTIONS]
```

#### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `json`) | `text` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Check account sizes:**
```bash
lumos check-size schema.lumos
```

**Output:**
```
Account Size Analysis
=====================

PlayerAccount
  wallet: PublicKey      32 bytes
  level: u16              2 bytes
  experience: u64         8 bytes
  username: String       36 bytes (4 + 32 max)
  ─────────────────────────────────
  Total:                 78 bytes
  Status: ✓ Within Solana limit (10,240 bytes)

GameState (enum)
  Discriminant:           1 byte
  Active:                 0 bytes (unit variant)
  Paused:                 0 bytes (unit variant)
  Finished { winner }:   32 bytes (PublicKey)
  ─────────────────────────────────
  Max size:              33 bytes
```

**JSON output for tooling:**
```bash
lumos check-size schema.lumos --format json
```

```json
{
  "accounts": [
    {
      "name": "PlayerAccount",
      "size": 78,
      "fields": [
        { "name": "wallet", "type": "PublicKey", "size": 32 },
        { "name": "level", "type": "u16", "size": 2 },
        { "name": "experience", "type": "u64", "size": 8 },
        { "name": "username", "type": "String", "size": 36 }
      ],
      "within_limit": true
    }
  ]
}
```

#### Use Cases

1. **Pre-deployment check** - Verify accounts fit within Solana's 10KB limit
2. **Cost estimation** - Calculate rent costs based on size
3. **Optimization** - Identify fields consuming most space

---

## Security Commands

### `lumos security analyze`

Analyze schema for common Solana vulnerabilities.

#### Usage

```bash
lumos security analyze <SCHEMA_FILE> [OPTIONS]
```

#### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `json`) | `text` |
| `--strict` | `-s` | Enable strict mode (more aggressive warnings) | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Basic security analysis:**
```bash
lumos security analyze schema.lumos
```

**Output:**
```
Security Analysis
=================

⚠️  WARNING: PlayerAccount
   Missing signer field - consider adding owner/authority
   Recommendation: Add `authority: PublicKey` for access control

⚠️  WARNING: TransferInstruction
   Large integer field `amount: u128` - potential overflow risk
   Recommendation: Validate bounds in program logic

✓ GameState: No issues found

Summary: 2 warnings, 0 errors
```

**Strict mode for production:**
```bash
lumos security analyze schema.lumos --strict
```

**JSON output for CI/CD:**
```bash
lumos security analyze schema.lumos --format json
```

```json
{
  "warnings": [
    {
      "type": "MissingSignerField",
      "account": "PlayerAccount",
      "message": "Missing signer field",
      "recommendation": "Add authority: PublicKey for access control"
    }
  ],
  "errors": [],
  "summary": { "warnings": 2, "errors": 0 }
}
```

#### Detected Vulnerabilities

| Issue | Description | Severity |
|-------|-------------|----------|
| Missing signer | No authority/owner field | Medium |
| Integer overflow | Large integers without bounds | Medium |
| Unchecked owner | Account lacks ownership validation | High |
| PDA seed issues | Insecure PDA derivation patterns | High |
| Reentrancy risk | State changes before external calls | High |

---

### `lumos audit generate`

Generate security audit checklist from schema.

#### Usage

```bash
lumos audit generate <SCHEMA_FILE> [OPTIONS]
```

#### Arguments

- `<SCHEMA_FILE>` - Path to the `.lumos` schema file (required)

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `SECURITY_AUDIT.md` |
| `--format` | `-f` | Output format (`markdown` or `json`) | `markdown` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate audit checklist:**
```bash
lumos audit generate schema.lumos
# Creates: SECURITY_AUDIT.md
```

**Custom output file:**
```bash
lumos audit generate schema.lumos -o docs/audit-checklist.md
```

**Generated `SECURITY_AUDIT.md`:**
```markdown
# Security Audit Checklist

Generated from: schema.lumos
Date: 2025-12-08

## Account: PlayerAccount

### Access Control
- [ ] Verify owner validation in all instructions
- [ ] Check signer requirements for mutations
- [ ] Validate authority field matches expected signer

### Data Validation
- [ ] Validate `level` bounds (u16: 0-65535)
- [ ] Validate `experience` doesn't overflow
- [ ] Sanitize `username` string input

### State Management
- [ ] Check for reentrancy vulnerabilities
- [ ] Verify account initialization logic
- [ ] Validate account closure cleanup

## Enum: GameState
- [ ] Verify all variant transitions are valid
- [ ] Check discriminant handling
```

---

## Fuzz Testing Commands

### `lumos fuzz generate`

Generate fuzz testing targets for types.

#### Usage

```bash
lumos fuzz generate <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory for fuzz targets | `fuzz/` |
| `--type-name` | `-t` | Specific type to generate target for | All types |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate fuzz targets for all types:**
```bash
lumos fuzz generate schema.lumos
```

**Output:**
```
Generated fuzz targets:
  fuzz/fuzz_targets/player_account.rs
  fuzz/fuzz_targets/game_state.rs
  fuzz/Cargo.toml
```

**Generate for specific type:**
```bash
lumos fuzz generate schema.lumos --type-name PlayerAccount
```

---

### `lumos fuzz run`

Run fuzzing for a specific type.

#### Usage

```bash
lumos fuzz run <SCHEMA_FILE> --type-name <TYPE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--type-name` | `-t` | Type to fuzz (required) | - |
| `--jobs` | `-j` | Number of parallel jobs | `1` |
| `--max-time` | `-m` | Maximum run time in seconds | Unlimited |
| `--help` | `-h` | Print help information | - |

#### Examples

**Run fuzzing:**
```bash
lumos fuzz run schema.lumos --type-name PlayerAccount
```

**Parallel fuzzing with timeout:**
```bash
lumos fuzz run schema.lumos -t PlayerAccount -j 4 --max-time 3600
```

---

### `lumos fuzz corpus`

Generate corpus files for fuzzing.

#### Usage

```bash
lumos fuzz corpus <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory for corpus | `fuzz/corpus/` |
| `--type-name` | `-t` | Specific type to generate corpus for | All types |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate corpus for all types:**
```bash
lumos fuzz corpus schema.lumos
```

**Output:**
```
Generated corpus files:
  fuzz/corpus/player_account/
    seed_1.bin
    seed_2.bin
    seed_3.bin
  fuzz/corpus/game_state/
    seed_1.bin
```

---

## Anchor Framework Commands

Commands for Anchor framework integration.

### `lumos anchor generate`

Generate complete Anchor program from LUMOS schema.

#### Usage

```bash
lumos anchor generate <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory | Current directory |
| `--name` | `-n` | Program name | Derived from schema |
| `--version` | `-V` | Program version | `0.1.0` |
| `--address` | `-a` | Program address (optional) | - |
| `--typescript` | | Generate TypeScript client | `false` |
| `--dry-run` | | Preview without writing files | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate Anchor program:**
```bash
lumos anchor generate schema.lumos
```

**Output:**
```
Generated Anchor program:
  programs/my_program/
    src/lib.rs           # Program with #[derive(Accounts)]
    src/state.rs         # Account structs with space constants
    Cargo.toml
  target/idl/
    my_program.json      # Anchor IDL
```

**Full project with TypeScript client:**
```bash
lumos anchor generate schema.lumos \
  --name my_defi_app \
  --version 1.0.0 \
  --address "MyProgram111111111111111111111111111111111" \
  --typescript
```

**Preview generation:**
```bash
lumos anchor generate schema.lumos --dry-run
```

#### Generated Code Features

- `#[derive(Accounts)]` contexts for each instruction
- Account `LEN` constants for space calculation
- Anchor IDL JSON for client generation
- Optional TypeScript client with typed methods

---

### `lumos anchor idl`

Generate Anchor IDL from LUMOS schema.

#### Usage

```bash
lumos anchor idl <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `target/idl/<program>.json` |
| `--name` | `-n` | Program name | Derived from schema |
| `--version` | `-V` | Program version | `0.1.0` |
| `--address` | `-a` | Program address (optional) | - |
| `--pretty` | `-p` | Pretty print JSON | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate IDL:**
```bash
lumos anchor idl schema.lumos
```

**Pretty printed with custom name:**
```bash
lumos anchor idl schema.lumos --name my_program --pretty
```

**Generated IDL structure:**
```json
{
  "version": "0.1.0",
  "name": "my_program",
  "instructions": [...],
  "accounts": [...],
  "types": [...],
  "errors": [...]
}
```

---

### `lumos anchor space`

Calculate Anchor account space constants.

#### Usage

```bash
lumos anchor space <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `rust`) | `text` |
| `--account` | `-a` | Specific account type | All accounts |
| `--help` | `-h` | Print help information | - |

#### Examples

**Calculate space for all accounts:**
```bash
lumos anchor space schema.lumos
```

**Output (text):**
```
Account Space Constants
=======================

PlayerAccount:
  DISCRIMINATOR:  8 bytes
  wallet:        32 bytes
  level:          2 bytes
  experience:     8 bytes
  username:      36 bytes (4 + 32)
  ─────────────────────────
  TOTAL (LEN):   86 bytes
```

**Rust constants output:**
```bash
lumos anchor space schema.lumos --format rust
```

```rust
impl PlayerAccount {
    pub const LEN: usize = 8  // discriminator
        + 32  // wallet: Pubkey
        + 2   // level: u16
        + 8   // experience: u64
        + 36; // username: String (4 + 32)
}
```

**Specific account:**
```bash
lumos anchor space schema.lumos --account PlayerAccount
```

---

## Metaplex Commands

Commands for Metaplex Token Metadata integration.

### `lumos metaplex validate`

Validate schema against Metaplex Token Metadata standards.

#### Usage

```bash
lumos metaplex validate <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`text` or `json`) | `text` |
| `--verbose` | `-v` | Show all validations | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Validate NFT metadata schema:**
```bash
lumos metaplex validate nft-schema.lumos
```

**Output:**
```
Metaplex Validation
===================

✓ NftMetadata.name: Valid (length ≤ 32)
✓ NftMetadata.symbol: Valid (length ≤ 10)
✓ NftMetadata.uri: Valid (length ≤ 200)
⚠️ NftMetadata.seller_fee_basis_points: Warning
   Value should be 0-10000 (0% - 100%)

Creators validation:
✓ Max 5 creators: Valid (3 defined)
✓ Shares sum to 100: Valid (100%)

Summary: 0 errors, 1 warning
```

#### Metaplex Constraints

| Field | Constraint |
|-------|------------|
| `name` | Max 32 characters |
| `symbol` | Max 10 characters |
| `uri` | Max 200 characters |
| `seller_fee_basis_points` | 0-10000 (0% - 100%) |
| `creators` | Max 5, shares must sum to 100 |

---

### `lumos metaplex generate`

Generate Metaplex-compatible code from schema.

#### Usage

```bash
lumos metaplex generate <SCHEMA_FILE> [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory | Current directory |
| `--typescript` | | Generate TypeScript code | `false` |
| `--rust` | | Generate Rust code | `true` |
| `--dry-run` | | Preview without writing files | `false` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Generate Metaplex types:**
```bash
lumos metaplex generate nft-schema.lumos
```

**Generate both Rust and TypeScript:**
```bash
lumos metaplex generate nft-schema.lumos --typescript
```

---

### `lumos metaplex types`

Show standard Metaplex type definitions.

#### Usage

```bash
lumos metaplex types [OPTIONS]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (`lumos` or `json`) | `lumos` |
| `--help` | `-h` | Print help information | - |

#### Examples

**Show LUMOS format:**
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
struct Metadata {
    name: String,
    symbol: String,
    uri: String,
    seller_fee_basis_points: u16,
    creators: Option<[Creator]>,
    collection: Option<Collection>,
}
```

**JSON format for tooling:**
```bash
lumos metaplex types --format json
```

---

## Global Options

Available for all commands:

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Print help information |
| `--version` | `-V` | Print version information |
| `--verbose` | `-v` | Enable verbose output |
| `--quiet` | `-q` | Suppress non-error output |

### Examples

**Verbose mode:**
```bash
lumos generate schema.lumos -v
# Output:
# [DEBUG] Parsing schema file...
# [DEBUG] Transforming AST to IR...
# [DEBUG] Generating Rust code...
# [DEBUG] Generating TypeScript code...
# ✓ Generated 2 files
```

**Quiet mode:**
```bash
lumos generate schema.lumos -q
# No output on success, only errors
```

---

## Environment Variables

Configure LUMOS CLI behavior via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `LUMOS_OUTPUT_DIR` | Default output directory | Current directory |
| `LUMOS_FORMAT` | Enable/disable formatting | `true` |
| `LUMOS_COLOR` | Enable/disable colored output | Auto-detect |

### Examples

```bash
# Disable colored output
export LUMOS_COLOR=never
lumos generate schema.lumos

# Change default output directory
export LUMOS_OUTPUT_DIR=./generated
lumos generate schema.lumos
```

---

## Exit Status Summary

| Code | Meaning | Commands |
|------|---------|----------|
| 0 | Success | All |
| 1 | Parse/validation error | `generate`, `validate`, `check` |
| 2 | Transform error | `generate` |
| 3 | I/O error | `generate`, `init` |
| 4 | Outdated files | `check` |

---

## Tips & Best Practices

:::tip[Automate Generation]
Add `lumos generate` to your build scripts:
```json
{
  "scripts": {
    "codegen": "lumos generate schema.lumos",
    "prebuild": "npm run codegen"
  }
}
```
:::

:::tip[Validate in CI]
Always validate schemas in CI/CD:
```bash
lumos validate schema.lumos || exit 1
```
:::

:::tip[Watch Mode]
Auto-regenerate when schema changes:
```bash
lumos generate schema.lumos --watch
```
Configure debounce with `LUMOS_WATCH_DEBOUNCE` env var (default: 100ms).
:::

:::caution[Don't Edit Generated Files]
Generated files are overwritten on every `generate`. Make schema changes in `.lumos` files only.
:::

---

## See Also

- [Type System](/api/types) - Supported types and mappings
- [Attributes](/api/attributes) - Available schema attributes
- [Generated Code](/api/generated-code) - Understanding output
- [Schema Versioning](/guides/versioning) - Version your schemas safely
- [Schema Migrations](/guides/schema-migrations) - Migration strategies and patterns
