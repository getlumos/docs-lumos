---
title: Visual Studio Code
description: LUMOS extension for VS Code with syntax highlighting, IntelliSense, and diagnostics
---

The official LUMOS extension for Visual Studio Code provides a complete development experience for `.lumos` schema files.

## Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search for "LUMOS"
4. Click **Install**

Or install from the command line:

```bash
code --install-extension getlumos.lumos
```

**Marketplace Link:** [LUMOS - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=getlumos.lumos)

### From VSIX File

For offline installation or specific versions:

```bash
# Download latest .vsix from GitHub releases
curl -LO https://github.com/getlumos/vscode-lumos/releases/latest/download/lumos.vsix

# Install in VS Code
code --install-extension lumos.vsix
```

---

## Features

### Syntax Highlighting

Full syntax highlighting for `.lumos` files:

- **Keywords:** `struct`, `enum`, `type`, `mod`, `use`, `pub`, `import`, `from`
- **Types:** `u8`-`u128`, `i8`-`i128`, `bool`, `String`, `PublicKey`, `Signature`
- **Attributes:** `#[solana]`, `#[account]`, `#[deprecated]`
- **Comments:** Line (`//`) and block (`/* */`)

### IntelliSense

Smart code completion for:

- Type names (primitives, Solana types, user-defined)
- Attribute suggestions
- Field type completion
- Enum variant suggestions

### Real-time Diagnostics

Instant error detection as you type:

```
Error: Undefined type 'InvalidType'
  --> schema.lumos:5:12
  |
5 |     field: InvalidType,
  |            ^^^^^^^^^^^ type not defined
```

### Quick Fixes

Automatic suggestions to fix common issues:

- Missing semicolons
- Undefined type references
- Invalid attribute combinations

### Code Snippets

Built-in snippets for common patterns:

| Prefix | Description |
|--------|-------------|
| `struct` | Solana account struct |
| `enum` | Solana enum definition |
| `acc` | Account struct with common fields |
| `type` | Type alias |
| `deprecated` | Deprecated field attribute |

**Example usage:** Type `struct` and press `Tab`:

```rust
#[solana]
#[account]
struct ${1:Name} {
    ${2:field}: ${3:Type},
}
```

### Format on Save

Auto-format `.lumos` files on save (if enabled in VS Code settings).

### Commands

Access LUMOS commands via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `LUMOS: Generate Code` | Generate Rust/TypeScript from current file |
| `LUMOS: Validate Schema` | Validate current schema |
| `LUMOS: Show Version` | Display installed LUMOS version |

---

## Configuration

### Settings

Configure the extension in VS Code settings (`settings.json`):

```json
{
  // Path to lumos CLI (auto-detected if on PATH)
  "lumos.cliPath": "lumos",

  // Enable real-time diagnostics
  "lumos.diagnostics.enable": true,

  // Enable format on save for .lumos files
  "lumos.format.onSave": true,

  // Default output directory for generation
  "lumos.generate.outputDir": "./generated",

  // Target languages for generation
  "lumos.generate.languages": ["rust", "typescript"],

  // Show inline hints for type sizes
  "lumos.inlayHints.showSizes": false
}
```

### File Associations

The extension automatically associates `.lumos` files. To add additional patterns:

```json
{
  "files.associations": {
    "*.lumos": "lumos",
    "*.schema": "lumos"
  }
}
```

---

## Requirements

### Required

- **VS Code 1.75.0** or higher

### Optional (for full functionality)

- **LUMOS CLI** - For code generation commands
  ```bash
  cargo install lumos-cli
  # or
  npm install -g @getlumos/cli
  ```

- **LSP Server** - For advanced IntelliSense (automatically bundled)

---

## Troubleshooting

### Extension not activating

1. Check file extension is `.lumos`
2. Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")
3. Check Output panel for errors (`View` → `Output` → select "LUMOS")

### Diagnostics not showing

1. Verify `lumos.diagnostics.enable` is `true`
2. Check LUMOS CLI is installed and on PATH:
   ```bash
   lumos --version
   ```
3. Check LSP server is running (see Output panel)

### Code generation fails

1. Ensure LUMOS CLI is installed
2. Check schema has valid syntax first:
   ```bash
   lumos validate schema.lumos
   ```
3. Verify output directory exists and is writable

### IntelliSense not working

1. Wait for LSP server to initialize (check status bar)
2. Try restarting the LSP: `Ctrl+Shift+P` → "LUMOS: Restart Language Server"
3. Check for conflicting extensions

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Generate code from current file |
| `F5` | Validate current schema |
| `Ctrl+Space` | Trigger IntelliSense |

### Custom Keybindings

Add to `keybindings.json`:

```json
[
  {
    "key": "ctrl+alt+g",
    "command": "lumos.generateCode",
    "when": "editorLangId == lumos"
  }
]
```

---

## Multi-root Workspaces

The extension works in multi-root workspaces. Each workspace folder can have its own LUMOS configuration.

---

## Related Resources

- [GitHub Repository](https://github.com/getlumos/vscode-lumos)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=getlumos.lumos)
- [IntelliJ IDEA Plugin](/editors/intellij)
- [Neovim Plugin](/editors/neovim)
- [CLI Reference](/api/cli-commands)

---

## Changelog

See the [extension changelog](https://github.com/getlumos/vscode-lumos/blob/main/CHANGELOG.md) for version history.
