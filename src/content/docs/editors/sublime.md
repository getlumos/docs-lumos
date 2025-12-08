---
title: Sublime Text
description: LUMOS package for Sublime Text with syntax highlighting and LSP support
---

The official LUMOS package for Sublime Text provides syntax highlighting, snippets, and LSP integration.

## Installation

### Package Control (Coming Soon)

Once available on Package Control:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Select "Package Control: Install Package"
3. Search for "LUMOS"
4. Press Enter to install

### Manual Installation

```bash
# Navigate to Packages directory
# macOS
cd ~/Library/Application\ Support/Sublime\ Text/Packages

# Linux
cd ~/.config/sublime-text/Packages

# Windows
cd %APPDATA%\Sublime Text\Packages

# Clone the repository
git clone https://github.com/getlumos/sublime-lumos LUMOS
```

---

## Requirements

- **Sublime Text 4** (or 3 build 3103+)
- **LSP package** (optional, for IntelliSense)
- **lumos-lsp** (optional, for LSP features)
  ```bash
  cargo install lumos-lsp
  ```

---

## Features

### Syntax Highlighting

Complete syntax highlighting for `.lumos` files:

- Keywords and type declarations
- Attributes and decorators
- Comments (line and block)
- String literals and numbers

### Code Snippets

Built-in snippets:

| Trigger | Description |
|---------|-------------|
| `struct` | Account struct template |
| `enum` | Enum definition |
| `acc` | Account with common fields |
| `type` | Type alias |
| `dep` | Deprecated attribute |

### Auto-indentation

Smart indentation for:

- Struct and enum bodies
- Field declarations
- Nested blocks

### Comment Toggling

- `Ctrl+/` - Toggle line comment
- `Ctrl+Shift+/` - Toggle block comment

---

## LSP Setup

### Install LSP Package

1. Install via Package Control: "LSP"
2. Install lumos-lsp:
   ```bash
   cargo install lumos-lsp
   ```

### Configure LSP

Create or edit `LSP.sublime-settings`:

```json
{
  "clients": {
    "lumos": {
      "enabled": true,
      "command": ["lumos-lsp"],
      "selector": "source.lumos",
      "schemas": []
    }
  }
}
```

Or use the provided `LSP-lumos.sublime-settings` from the package.

---

## Configuration

### Package Settings

Edit `LUMOS.sublime-settings`:

```json
{
  // Tab size for .lumos files
  "tab_size": 4,

  // Use spaces instead of tabs
  "translate_tabs_to_spaces": true,

  // Auto-complete brackets
  "auto_match_enabled": true
}
```

### File Associations

Already configured in the package. To add custom patterns:

**Preferences > Settings**:

```json
{
  "file_extensions": {
    "lumos": ["lumos", "schema"]
  }
}
```

---

## Troubleshooting

### Syntax not highlighting

1. Check file extension is `.lumos`
2. Verify package is installed: `Preferences > Package Control > List Packages`
3. Set syntax manually: `View > Syntax > LUMOS`

### LSP not working

1. Verify LSP package is installed
2. Check lumos-lsp is on PATH:
   ```bash
   lumos-lsp --version
   ```
3. Check LSP logs: `View > LSP > Log Panel`

---

## Related Resources

- [GitHub Repository](https://github.com/getlumos/sublime-lumos)
- [VS Code Extension](/editors/vscode)
- [CLI Reference](/api/cli-commands)
