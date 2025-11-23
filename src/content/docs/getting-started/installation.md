---
title: Installation
description: Install LUMOS CLI and start generating type-safe code for Solana
---

Choose your installation method based on your development environment:

- **JavaScript/TypeScript** → [Install via npm](#install-via-npm-javascripttypescript)
- **Rust/Anchor** → [Install via Cargo](#install-via-cargo-rustanchor)

---

## Install via npm (JavaScript/TypeScript)

**No Rust required!** For JavaScript and TypeScript developers:

```bash
# Install globally
npm install -g @getlumos/cli

# Verify installation
lumos --version
# 0.1.0
```

**Or use directly with npx:**
```bash
npx @getlumos/cli generate schema.lumos
```

**Prerequisites:**
- Node.js 16.0 or higher

**Published Package:**
- 📦 [@getlumos/cli](https://www.npmjs.com/package/@getlumos/cli) - npm package with WASM

**Learn more:** [Using LUMOS with npm →](/guides/npm-package/)

---

## Install via Cargo (Rust/Anchor)

For Rust and Anchor developers:

### Prerequisites

- **Rust 1.70 or higher**
- **Cargo** package manager

Check your Rust version:

```bash
rustc --version
# rustc 1.70.0 or higher
```

If you don't have Rust installed, visit [rustup.rs](https://rustup.rs)

### Install from crates.io (Recommended)

The fastest way to get started with LUMOS:

```bash
# Install the CLI
cargo install lumos-cli

# Verify installation
lumos --version
# lumos-cli 0.1.0
```

**Published Packages:**
- 📦 [lumos-core](https://crates.io/crates/lumos-core) - Core library (parser, generators, IR)
- 🔧 [lumos-cli](https://crates.io/crates/lumos-cli) - Command-line interface

---

## Install from Source

For the latest development version:

```bash
# Clone the repository
git clone https://github.com/getlumos/lumos.git
cd lumos

# Build the CLI
cargo build --release --all-features --workspace

# The binary will be at: target/release/lumos
./target/release/lumos --version
```

---

## Add as Library Dependency

To use LUMOS in your Rust project:

```toml
# Cargo.toml
[dependencies]
lumos-core = "0.1"
```

Then in your Rust code:

```rust
use lumos_core::{parse_schema, generate_rust, generate_typescript};

fn main() {
    let schema = parse_schema("schema.lumos")?;
    let rust_code = generate_rust(&schema)?;
    let ts_code = generate_typescript(&schema)?;
}
```

---

## Verify Installation

Run the following command to ensure LUMOS is installed correctly:

```bash
lumos --help
```

You should see:

```
LUMOS - Type-safe schema language for Solana development

Usage: lumos <COMMAND>

Commands:
  init      Initialize a new LUMOS project
  generate  Generate Rust and TypeScript code from schema
  validate  Validate schema syntax
  check     Check if generated code is up-to-date
  help      Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
```

---

## Next Steps

✅ **Installation Complete!**

Now you're ready to:

1. [**Quick Start →**](/getting-started/quick-start/) - Create your first LUMOS schema
2. [**Examples →**](/examples/gaming/) - Explore real-world schemas
3. [**Type Mapping →**](/guides/type-mapping/) - Learn the type system

---

## Troubleshooting

### Command not found: lumos

If `lumos` command is not found after installation:

1. Ensure Cargo's bin directory is in your PATH:
   ```bash
   echo $PATH | grep .cargo/bin
   ```

2. If not, add to your shell profile:
   ```bash
   # For bash (~/.bashrc)
   export PATH="$HOME/.cargo/bin:$PATH"

   # For zsh (~/.zshrc)
   export PATH="$HOME/.cargo/bin:$PATH"

   # Reload shell
   source ~/.bashrc  # or ~/.zshrc
   ```

### Build errors from source

Make sure you have the latest Rust toolchain:

```bash
rustup update
```

Then retry the build:

```bash
cargo clean
cargo build --release
```

---

## VSCode Extension (Optional)

For enhanced development experience with syntax highlighting:

1. Visit: [vscode-lumos on GitHub](https://github.com/getlumos/vscode-lumos)
2. Search "LUMOS" in VSCode Extensions Marketplace
3. Install the extension

**Features:**
- Syntax highlighting for `.lumos` files
- Code snippets
- Auto-generation on save
- Commands integration
