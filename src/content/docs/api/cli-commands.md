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
| `--output-dir` | `-o` | Output directory for generated files | Current directory |
| `--rust-file` | | Custom name for Rust output | `generated.rs` |
| `--typescript-file` | | Custom name for TypeScript output | `generated.ts` |
| `--format` | `-f` | Format output with rustfmt/prettier | `true` |
| `--help` | `-h` | Print help information | - |

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
lumos generate schema.lumos --output-dir ./src/generated
```

**Custom file names:**
```bash
lumos generate schema.lumos \\
  --rust-file types.rs \\
  --typescript-file types.ts
```

**Skip formatting:**
```bash
lumos generate schema.lumos --no-format
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

:::tip[Watch Mode (Coming Soon)]
Currently not available, but planned:
```bash
lumos generate schema.lumos --watch
```
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
