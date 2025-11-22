---
title: CLI Commands
description: Complete reference for all LUMOS CLI commands
---

The LUMOS CLI (`lumos`) provides four main commands for working with `.lumos` schema files.

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
