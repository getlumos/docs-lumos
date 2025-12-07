---
title: Frequently Asked Questions
description: Common questions about LUMOS - installation, usage, Solana integration, and troubleshooting
---

Find answers to the most common questions about LUMOS. Can't find what you're looking for? [Open an issue on GitHub](https://github.com/getlumos/lumos/issues).

---

## General Questions

### What is LUMOS?

LUMOS is a type-safe schema language for Solana development that generates production-ready code for both Rust and TypeScript from a single source of truth. Write your data structures once in `.lumos` syntax, and automatically generate synchronized code for both languages with guaranteed Borsh serialization compatibility.

### Why should I use LUMOS instead of writing code manually?

Manual synchronization of types between Rust and TypeScript is:

- **Error-prone** - Type drift causes runtime serialization failures
- **Time-consuming** - Every change requires updating code in two languages
- **Frustrating** - Refactoring breaks in multiple places
- **Risky** - Borsh field order mismatches cause silent data corruption

LUMOS solves all of these by providing a single source of truth that generates both languages automatically.

### How does LUMOS compare to Codama?

LUMOS and Codama are complementary tools that work at different stages:

- **LUMOS** - Pre-deployment: Define schemas → Generate Rust + TypeScript code that goes *inside* your program
- **Codama** - Post-deployment: Parse existing programs → Generate client SDKs that *interact with* your program

You can use both together. See the [detailed comparison](/guides/lumos-vs-codama/) for more information.

### Is LUMOS production-ready?

Yes! LUMOS v0.1.1 is published to crates.io and npm with:

- 322 passing tests (including E2E compilation tests)
- Zero clippy warnings
- Zero security vulnerabilities
- Full Borsh compatibility
- Production examples at [awesome-lumos](https://github.com/getlumos/awesome-lumos)

Thousands of lines of generated code are already used in real Solana programs.

### What languages does LUMOS support?

LUMOS currently generates code for:

- **Rust** (v0.1.0+) - With Anchor and Borsh integration
- **TypeScript** (v0.1.0+) - With `@coral-xyz/borsh` schemas
- **Python** (v0.1.2+) - With Borsh Python bindings
- **Go** (v0.1.2+) - With Borsh Go implementation
- **Ruby** (v0.1.2+) - With Borsh Ruby support

Use the `--lang` flag to specify the target language:

```bash
lumos generate schema.lumos --lang python
lumos generate schema.lumos --lang go
lumos generate schema.lumos --lang ruby
```

### Is LUMOS free and open source?

Yes! LUMOS is dual-licensed under MIT and Apache 2.0 licenses, giving you maximum flexibility for both commercial and open-source projects. The entire ecosystem is developed in the open at [github.com/getlumos](https://github.com/getlumos).

---

## Installation & Setup

### How do I install LUMOS?

There are two installation methods depending on your environment:

**For JavaScript/TypeScript developers (no Rust required):**
```bash
npm install -g @getlumos/cli
```

**For Rust/Anchor developers:**
```bash
cargo install lumos-cli
```

See the [installation guide](/getting-started/installation/) for detailed instructions.

### Do I need Rust installed to use LUMOS?

No! If you're a JavaScript/TypeScript developer, you can use the npm package `@getlumos/cli` which includes a WASM version of LUMOS. No Rust toolchain required.

However, if you want to install via Cargo or build from source, you'll need Rust 1.70 or higher.

### The `lumos` command is not found after installation. What do I do?

If you installed via Cargo, ensure Cargo's bin directory is in your PATH:

```bash
# Check if .cargo/bin is in PATH
echo $PATH | grep .cargo/bin

# If not, add to your shell profile (~/.bashrc or ~/.zshrc)
export PATH="$HOME/.cargo/bin:$PATH"

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

If you installed via npm globally, ensure npm's global bin directory is in your PATH:

```bash
npm config get prefix
# Add <prefix>/bin to your PATH
```

### Can I use LUMOS with an existing Anchor project?

Absolutely! LUMOS is designed to integrate seamlessly with existing Anchor projects:

1. Create your schema file (e.g., `schema.lumos`)
2. Generate code: `lumos generate schema.lumos`
3. Import generated structs into your Anchor program:

```rust
mod generated;
use generated::*;

#[program]
pub mod my_program {
    use super::*;
    // Use generated types here
}
```

The generated code is pure Rust with Anchor compatibility, so it works with your existing setup.

---

## Usage & Features

### What types does LUMOS support?

LUMOS supports:

**Primitives:** `u8`, `u16`, `u32`, `u64`, `u128`, `i8`, `i16`, `i32`, `i64`, `i128`, `bool`, `String`

**Solana types:** `PublicKey`, `Signature`

**Complex types:** `Vec<T>` (arrays), `Option<T>` (optional fields), fixed-size arrays `[T; N]`

**User-defined:** Structs and enums defined in your schema

See the [Type System reference](/api/types/) for complete type mapping between LUMOS, Rust, and TypeScript.

### How do I define optional fields?

Use `Option<T>` for optional fields:

```rust
struct User {
    name: String,
    email: Option<String>,  // Optional field
    verified: bool,
}
```

This generates:
- **Rust:** `pub email: Option<String>`
- **TypeScript:** `email: string | undefined`

### Can I use enums in LUMOS?

Yes! LUMOS fully supports Rust-style enums with unit, tuple, and struct variants:

```rust
#[solana]
enum GameState {
    Idle,                          // Unit variant
    Playing(u64),                  // Tuple variant
    Finished { winner: PublicKey } // Struct variant
}
```

The generated code includes proper discriminants and type-safe deserialization. See examples in [awesome-lumos](https://github.com/getlumos/awesome-lumos).

### What is the `#[solana]` attribute?

`#[solana]` marks a type as Solana-specific, which:

- Imports Solana types like `PublicKey` → `Pubkey`
- Configures Borsh serialization for Solana compatibility
- Enables Anchor framework integration when combined with `#[account]`

Use it for any type that will be used in a Solana program.

### What is the `#[account]` attribute?

`#[account]` tells LUMOS to generate code for an Anchor account:

```rust
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    level: u16,
}
```

**Rust output:** Uses `anchor_lang::prelude::*` imports and the `#[account]` macro

**Without `#[account]`:** Uses plain Borsh derives (`BorshSerialize`, `BorshDeserialize`)

Use `#[account]` for on-chain account data, omit it for instruction arguments or events.

### How do I deprecate a field?

Use the `#[deprecated]` attribute to mark fields for future removal:

```rust
struct Account {
    balance: u64,
    #[deprecated("Use new_email instead")]
    email: String,
    new_email: Option<String>,
}
```

LUMOS will emit warnings during validation and generation to help with schema migration. See the [Schema Versioning guide](/guides/versioning/).

### Can I generate only Rust or only TypeScript?

Currently, LUMOS generates both Rust and TypeScript by default. To generate code for other languages, use the `--lang` flag:

```bash
lumos generate schema.lumos --lang rust       # Rust only
lumos generate schema.lumos --lang typescript # TypeScript only
lumos generate schema.lumos --lang python     # Python only
lumos generate schema.lumos --lang go         # Go only
lumos generate schema.lumos --lang ruby       # Ruby only
```

Future versions may support more granular control over which outputs to generate.

### Should I commit generated files to git?

**No.** Best practice is to:

1. Add generated files to `.gitignore`:
   ```
   generated.rs
   generated.ts
   ```

2. Regenerate during build:
   ```bash
   # In your CI/CD or build script
   lumos generate schema.lumos
   ```

3. Keep only `.lumos` schema files in version control

This ensures the schema is always the source of truth and prevents merge conflicts.

---

## Integration & Workflow

### How does LUMOS work with Anchor?

LUMOS generates Anchor-compatible Rust code when you use the `#[account]` attribute:

```rust
#[solana]
#[account]
struct PlayerAccount {
    wallet: PublicKey,
    score: u64,
}
```

The generated code uses `anchor_lang::prelude::*` and the `#[account]` macro, so it works exactly like hand-written Anchor code.

For non-account types (instruction arguments, events), omit `#[account]` to get plain Borsh serialization.

### How do I use generated TypeScript code in my app?

After generating code with `lumos generate schema.lumos`:

```typescript
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';
import { Connection, PublicKey } from '@solana/web3.js';

async function getPlayerAccount(
  connection: Connection,
  playerPubkey: PublicKey
): Promise<PlayerAccount> {
  const accountInfo = await connection.getAccountInfo(playerPubkey);

  if (!accountInfo) {
    throw new Error('Account not found');
  }

  // Deserialize using generated Borsh schema
  return PlayerAccountBorshSchema.deserialize(accountInfo.data);
}
```

The generated Borsh schemas handle all serialization/deserialization automatically.

### Can I extend generated types with custom methods?

Yes, but don't modify generated files directly (they'll be overwritten). Instead, extend them:

**Rust:**
```rust
mod generated;
use generated::PlayerAccount;

impl PlayerAccount {
    pub fn level_up(&mut self) {
        self.level += 1;
    }
}
```

**TypeScript:**
```typescript
import { PlayerAccount } from './generated';

class ExtendedPlayerAccount implements PlayerAccount {
    wallet: PublicKey;
    level: number;

    levelUp() {
        this.level += 1;
    }
}
```

This keeps your custom logic separate from generated code.

### How do I handle schema changes over time?

LUMOS provides several tools for schema evolution:

1. **Add optional fields** with `Option<T>` for backward compatibility
2. **Use `#[deprecated]`** to mark fields for removal
3. **Version your schemas** with separate files (`schema_v1.lumos`, `schema_v2.lumos`)

See the [Schema Versioning](/guides/versioning/) and [Schema Migrations](/guides/schema-migrations/) guides for detailed strategies.

---

## Editor Support

### Which editors support LUMOS syntax?

LUMOS provides official plugins for popular editors:

- **VSCode** - [vscode-lumos](https://github.com/getlumos/vscode-lumos) (Marketplace: "LUMOS")
- **IntelliJ IDEA / Rust Rover** - [intellij-lumos](/editors/intellij/)
- **Neovim** - [nvim-lumos](https://github.com/getlumos/nvim-lumos)
- **Emacs** - [lumos-mode](https://github.com/getlumos/lumos-mode)
- **Sublime Text** - [sublime-lumos](https://github.com/getlumos/sublime-lumos)

All editors support syntax highlighting, LSP integration, and code completion.

### Do I need to install editor plugins?

No, editor plugins are optional but highly recommended. They provide:

- Syntax highlighting for `.lumos` files
- Auto-completion and IntelliSense
- Real-time error diagnostics
- Quick fixes and refactoring
- Code formatting

You can use LUMOS from the command line without any editor support.

### How do I set up LSP in my editor?

LUMOS provides a Language Server Protocol (LSP) server (`lumos-lsp`) that works with any LSP-compatible editor.

**Installation:**
```bash
cargo install lumos-lsp
```

**Configuration varies by editor:**
- VSCode: Automatic with the LUMOS extension
- Neovim: Use `nvim-lspconfig` with `lumos-lsp`
- Emacs: Use `lsp-mode` with `lumos-lsp`

See individual editor documentation in the [Editors section](/editors/intellij/) for setup instructions.

---

## Troubleshooting

### Generated Rust code doesn't compile. What's wrong?

Common issues:

1. **Missing dependencies:** Ensure your `Cargo.toml` includes:
   ```toml
   [dependencies]
   anchor-lang = "0.29"  # If using #[account]
   borsh = "0.10"        # For Borsh serialization
   solana-program = "1.17"  # For PublicKey, etc.
   ```

2. **Derive macro conflicts:** Don't manually add `BorshSerialize`/`BorshDeserialize` to `#[account]` structs. Anchor provides these automatically.

3. **Type validation errors:** Run `lumos validate schema.lumos` to check for undefined type references.

### I'm getting Borsh serialization errors at runtime

This usually means field order or types don't match between Rust and TypeScript. Ensure you:

1. **Regenerated code** after schema changes: `lumos generate schema.lumos`
2. **Field order matches** in your schema (LUMOS preserves exact order)
3. **Using the same LUMOS version** on both sides
4. **Not manually modifying** generated Borsh schemas

Run `lumos check schema.lumos` to verify generated code is up-to-date.

### TypeScript shows precision warnings for u64 fields

This is expected! JavaScript's `number` type can only safely represent integers up to 2^53-1. LUMOS automatically adds JSDoc warnings for u64/i64 fields:

```typescript
/**
 * WARNING: u64 represented as JavaScript number.
 * JavaScript numbers can only safely represent integers up to 2^53-1.
 * Large values (> 9007199254740991) will lose precision.
 * Consider using BigInt for values that might exceed this limit,
 * especially for lamports or large token amounts.
 */
balance: number;
```

For large values like lamports, consider using BigInt in your application logic.

### How do I debug schema parsing errors?

Use the `validate` command to check your schema:

```bash
lumos validate schema.lumos
```

Common syntax errors:

- **Missing semicolons** after field definitions
- **Undefined types** (typos in type names)
- **Invalid attributes** (check spelling of `#[solana]`, `#[account]`)
- **Unsupported syntax** (LUMOS has a subset of Rust syntax)

See the [Error Handling guide](/guides/error-handling/) and [Debugging guide](/guides/debugging/) for more help.

### Can I see what code will be generated without writing files?

Yes! Use the `--dry-run` flag (if available in your version), or simply generate to a temporary directory:

```bash
mkdir temp
cd temp
lumos generate ../schema.lumos
cat generated.rs generated.ts
cd ..
rm -rf temp
```

You can also use the [online playground](/playground) to experiment with schemas interactively.

---

## Performance & Best Practices

### How fast is LUMOS code generation?

LUMOS is extremely fast:

- **Small schemas** (5-10 types): < 50ms
- **Medium schemas** (50 types): < 200ms
- **Large schemas** (200+ types): < 1s

The bottleneck is usually Rust compilation, not LUMOS generation. E2E tests that compile generated Rust code take ~60s per test.

### Are there any size limits for schemas?

No hard limits. LUMOS has been tested with schemas containing:

- 200+ type definitions
- Deeply nested structs (10+ levels)
- Large enums (50+ variants)
- Complex type compositions

Performance remains excellent even with very large schemas.

### What are the best practices for organizing schemas?

1. **One schema per module:** Keep related types together in a single `.lumos` file
2. **Logical naming:** Use clear, descriptive names (they appear in both languages)
3. **Group by feature:** Separate account types, instruction args, and events
4. **Version control:** Commit `.lumos` files, ignore generated code
5. **Document with comments:** LUMOS preserves comments in generated code

Example structure:
```
schemas/
├── accounts.lumos    # Account data structures
├── instructions.lumos # Instruction arguments
└── events.lumos      # Event types
```

---

## Contributing & Community

### How can I contribute to LUMOS?

Contributions are welcome! Here's how:

1. **Report bugs** - [Open an issue](https://github.com/getlumos/lumos/issues)
2. **Suggest features** - [Start a discussion](https://github.com/getlumos/lumos/discussions)
3. **Submit PRs** - Fix bugs or add features
4. **Improve docs** - Help make documentation clearer
5. **Share examples** - Add to [awesome-lumos](https://github.com/getlumos/awesome-lumos)

See [CONTRIBUTING.md](https://github.com/getlumos/lumos/blob/main/CONTRIBUTING.md) for guidelines.

### Where can I get help?

- **GitHub Issues** - [getlumos/lumos/issues](https://github.com/getlumos/lumos/issues)
- **GitHub Discussions** - [getlumos/lumos/discussions](https://github.com/getlumos/lumos/discussions)
- **Documentation** - [docs.lumos-lang.org](https://docs.lumos-lang.org)
- **Examples** - [awesome-lumos](https://github.com/getlumos/awesome-lumos)

For bug reports, please include your LUMOS version, schema file, and error messages.

### Is there a roadmap for future features?

Yes! See [ROADMAP.md](https://github.com/getlumos/lumos/blob/main/ROADMAP.md) for planned features including:

- Additional language targets (Python, Go, Ruby - now available!)
- Watch mode for auto-regeneration
- Schema validation improvements
- Language evolution (toward a full programming language)

---

Still have questions? [Ask on GitHub Discussions](https://github.com/getlumos/lumos/discussions) or [open an issue](https://github.com/getlumos/lumos/issues).
