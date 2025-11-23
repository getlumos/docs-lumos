---
title: Using LUMOS with IntelliJ IDEA
description: Setup guide for LUMOS plugin in IntelliJ IDEA, Rust Rover, and CLion
---

Use LUMOS in IntelliJ IDEA, Rust Rover, and CLion with full language support including syntax highlighting, auto-completion, and real-time diagnostics.

## Why Use IntelliJ Plugin?

- ✅ **File Type Recognition** - `.lumos` files automatically recognized
- ✅ **LSP Integration** - Full language server protocol support
- ✅ **Auto-Completion** - Smart suggestions for types and attributes
- ✅ **Real-Time Diagnostics** - Instant error detection
- ✅ **Hover Documentation** - Inline type information
- ✅ **Multi-IDE Support** - Works with IntelliJ IDEA, Rust Rover, and CLion

---

## Prerequisites

### 1. Install LUMOS Language Server

The plugin requires the LUMOS Language Server (`lumos-lsp`) to provide IDE features.

```bash
# Install via Cargo
cargo install lumos-lsp

# Verify installation
lumos-lsp --version
# Output: lumos-lsp 0.1.1
```

:::tip[Automatic Detection]
The plugin automatically detects `lumos-lsp` in:
1. `$CARGO_HOME/bin/lumos-lsp` (default Cargo install location)
2. System PATH

No additional configuration needed!
:::

### 2. Minimum IDE Version

- **IntelliJ IDEA Community** - 2024.1 or higher
- **IntelliJ IDEA Ultimate** - 2024.1 or higher
- **Rust Rover** - 2024.1 or higher
- **CLion** - 2024.1 or higher

Check your IDE version: `Help → About`

---

## Installation

### Option 1: From JetBrains Marketplace (Coming Soon)

```
1. Open: Settings → Plugins (Cmd+, → Plugins)
2. Search: "LUMOS" in Marketplace tab
3. Click: Install
4. Restart IDE
```

### Option 2: Manual Installation

1. **Download the latest release:**
   - Visit: [github.com/getlumos/intellij-lumos/releases](https://github.com/getlumos/intellij-lumos/releases)
   - Download: `intellij-lumos-X.X.X.zip`

2. **Install from disk:**
   ```
   Settings → Plugins → ⚙️ (Settings icon) → Install Plugin from Disk
   Select: intellij-lumos-X.X.X.zip
   Click: OK → Restart IDE
   ```

---

## Quick Start

### 1. Create a `.lumos` file

```rust
// player.lumos
#[solana]
#[account]
struct Player {
    wallet: PublicKey,
    score: u64,
    level: u16,
}
```

### 2. IDE Features Activate Automatically

- ✅ **Syntax highlighting** - Keywords, types, attributes color-coded
- ✅ **Auto-completion** - Type `Pub` → suggests `PublicKey`
- ✅ **Error detection** - Invalid syntax shows red squiggles
- ✅ **Hover info** - Hover over types to see documentation

### 3. Generate Code

Open terminal in IDE:

```bash
lumos generate player.lumos

# Output:
# ✓ Generated player.rs
# ✓ Generated player.ts
```

---

## Features

### Syntax Highlighting

Keywords, types, and attributes are automatically highlighted:

- **Keywords:** `struct`, `enum`, `pub`
- **Attributes:** `#[solana]`, `#[account]`, `#[version]`
- **Types:** `PublicKey`, `u64`, `Vec`, `Option`
- **Comments:** `//` and `/* */`

### Auto-Completion

Press `Ctrl+Space` for intelligent suggestions:

**Solana Types:**
- `PublicKey` - Solana public key (32 bytes)
- `Signature` - Transaction signature

**Primitive Types:**
- `u8`, `u16`, `u32`, `u64`, `u128`
- `i8`, `i16`, `i32`, `i64`, `i128`
- `bool`, `String`

**Complex Types:**
- `Vec<T>` - Dynamic array
- `Option<T>` - Optional value

**Attributes:**
- `#[solana]` - Mark as Solana-specific
- `#[account]` - Anchor account marker
- `#[version(N)]` - Schema version

### Real-Time Diagnostics

Errors appear instantly as you type:

**Example - Undefined type:**
```rust
struct Player {
    item: UnknownType  // ← Red squiggle: "Undefined type 'UnknownType'"
}
```

**Example - Missing attribute:**
```rust
struct Player {  // ← Yellow warning: "Consider adding #[solana] attribute"
    wallet: PublicKey,
}
```

### Hover Documentation

Hover over any type or field to see inline documentation:

```rust
struct Player {
    wallet: PublicKey  // ← Hover shows: "Solana public key (32 bytes)"
    //                     Used for account addresses
}
```

---

## Configuration

### LSP Server Path

The plugin automatically detects `lumos-lsp`. If you need to specify a custom path:

```
1. Open: Settings → Languages & Frameworks → Language Servers
2. Find: LUMOS Language Server
3. Set custom path: /path/to/lumos-lsp
4. Click: OK
```

### Enable/Disable LSP

```
Settings → Languages & Frameworks → Language Servers
→ LUMOS Language Server → Enable/Disable
```

---

## Troubleshooting

### LSP Server Not Starting

**Symptom:** No auto-completion or diagnostics appear

**Diagnosis:**
```bash
# Check if lumos-lsp is installed
which lumos-lsp

# If not found, install it
cargo install lumos-lsp

# Verify version
lumos-lsp --version
```

**Fix:**
1. Ensure `lumos-lsp` is in PATH or `~/.cargo/bin/`
2. Restart IDE: `File → Invalidate Caches → Invalidate and Restart`
3. Check IDE logs: `Help → Show Log in Finder` → Search for "lumos"

### Plugin Not Recognized

**Symptom:** Can't find LUMOS in installed plugins

**Fix:**
1. Verify IDE version is **2024.1 or higher**: `Help → About`
2. Install LSP4IJ dependency:
   ```
   Settings → Plugins → Marketplace → Search "LSP4IJ" → Install
   ```
3. Reinstall LUMOS plugin
4. Restart IDE

### File Type Not Recognized

**Symptom:** `.lumos` files open as plain text

**Fix:**
1. Right-click `.lumos` file
2. Select: **Associate with File Type**
3. Choose: **LUMOS**
4. Restart IDE

### Syntax Highlighting Not Working

**Fix:**
1. Check color scheme: `Settings → Editor → Color Scheme`
2. Verify plugin is enabled: `Settings → Plugins → Installed → LUMOS (✓)`
3. Reload file: `File → Reload All from Disk`

---

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Auto-completion | `Ctrl+Space` | `Cmd+Space` |
| Show documentation | `Ctrl+Q` | `Ctrl+J` |
| Go to definition | `Ctrl+B` | `Cmd+B` |
| Find usages | `Alt+F7` | `Opt+F7` |
| Reformat code | `Ctrl+Alt+L` | `Cmd+Opt+L` |

---

## Example Workflow

### 1. Create Schema

```rust
// token-vault.lumos
#[solana]
#[account]
struct TokenVault {
    authority: PublicKey,
    mint: PublicKey,
    amount: u64,
    created_at: i64,
}

#[solana]
enum VaultStatus {
    Active,
    Frozen,
    Closed,
}
```

### 2. Generate Code

Open terminal in IDE (`Alt+F12` / `Opt+F12`):

```bash
lumos generate token-vault.lumos

# Output:
# ✓ Generated token-vault.rs
# ✓ Generated token-vault.ts
```

### 3. Use Generated Code

**Rust (Anchor program):**
```rust
use crate::TokenVault;

#[program]
pub mod token_vault {
    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.amount = amount;
        Ok(())
    }
}
```

**TypeScript (Client):**
```typescript
import { TokenVault } from './token-vault';

const vault = await program.account.tokenVault.fetch(vaultPubkey);
console.log(`Vault amount: ${vault.amount}`);
```

---

## IDE-Specific Tips

### IntelliJ IDEA

**Project Structure:**
```
my-solana-project/
├── schemas/
│   └── vault.lumos
├── programs/
│   └── src/
│       └── lib.rs
└── client/
    └── src/
        └── index.ts
```

**Run Configuration:**
```
Run → Edit Configurations → + → Shell Script
Name: Generate LUMOS
Script: lumos generate schemas/vault.lumos
Working directory: $PROJECT_DIR$
```

### Rust Rover

**Cargo Integration:**
```toml
# Cargo.toml
[build-dependencies]
# Add script to run lumos generate before build
```

**Build Script:**
```
Tools → External Tools → + → Add
Name: LUMOS Generate
Program: lumos
Arguments: generate $FilePath$
Working directory: $ProjectFileDir$
```

### CLion

Similar to Rust Rover, use External Tools for LUMOS commands.

---

## Next Steps

- [CLI Commands Reference](/api/cli-commands) - Learn all LUMOS commands
- [Type System](/api/types) - Understand LUMOS types
- [Generated Code](/api/generated-code) - Working with generated files
- [GitHub Repository](https://github.com/getlumos/intellij-lumos) - Report issues or contribute

---

## Supported IDEs

| IDE | Version | Status |
|-----|---------|--------|
| IntelliJ IDEA Community | 2024.1+ | ✅ Fully Supported |
| IntelliJ IDEA Ultimate | 2024.1+ | ✅ Fully Supported |
| Rust Rover | 2024.1+ | ✅ Fully Supported |
| CLion | 2024.1+ | ✅ Fully Supported |

---

## Related

- [VS Code Extension](/editors/vscode) - Setup guide for VS Code
- [npm Package Guide](/guides/npm-package) - Using LUMOS in JavaScript/TypeScript projects
- [Installation Guide](/getting-started/installation) - Install LUMOS CLI

---

**Questions or issues?** Open an issue on [GitHub](https://github.com/getlumos/intellij-lumos/issues)
