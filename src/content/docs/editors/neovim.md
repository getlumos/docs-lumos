---
title: Neovim
description: LUMOS plugin for Neovim with LSP and Tree-sitter support
---

The official LUMOS plugin for Neovim provides syntax highlighting via Tree-sitter and full LSP integration.

## Installation

### Using lazy.nvim (Recommended)

```lua
{
  "getlumos/nvim-lumos",
  dependencies = {
    "nvim-treesitter/nvim-treesitter",
    "neovim/nvim-lspconfig",
  },
  config = function()
    require("lumos").setup()
  end,
}
```

### Using packer.nvim

```lua
use {
  "getlumos/nvim-lumos",
  requires = {
    "nvim-treesitter/nvim-treesitter",
    "neovim/nvim-lspconfig",
  },
  config = function()
    require("lumos").setup()
  end,
}
```

### Manual Installation

```bash
# Clone to your plugins directory
git clone https://github.com/getlumos/nvim-lumos \
  ~/.local/share/nvim/site/pack/plugins/start/nvim-lumos

# Install Tree-sitter grammar
:TSInstall lumos
```

---

## Requirements

- **Neovim 0.9+** (required)
- **nvim-treesitter** - For syntax highlighting
- **nvim-lspconfig** - For LSP features
- **lumos-lsp** - LSP server
  ```bash
  cargo install lumos-lsp
  ```

---

## Features

### Syntax Highlighting

Tree-sitter-based syntax highlighting for:

- Keywords, types, and attributes
- Comments (line and block)
- String literals and numbers
- Enum variants

### LSP Integration

Full Language Server Protocol support:

- Real-time diagnostics
- Auto-completion
- Hover documentation
- Go to definition
- Find references
- Code actions

### Pre-configured Keybindings

| Key | Action |
|-----|--------|
| `gd` | Go to definition |
| `K` | Hover documentation |
| `gr` | Find references |
| `<leader>rn` | Rename symbol |
| `<leader>ca` | Code actions |
| `<leader>f` | Format document |

---

## Configuration

### Basic Setup

```lua
require("lumos").setup({
  -- LSP server path (auto-detected if on PATH)
  lsp_cmd = { "lumos-lsp" },

  -- Enable diagnostics
  diagnostics = true,

  -- Format on save
  format_on_save = true,
})
```

### Advanced Configuration

```lua
require("lumos").setup({
  lsp_cmd = { "lumos-lsp" },

  -- Custom keybindings
  on_attach = function(client, bufnr)
    local opts = { buffer = bufnr }

    vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
    vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
    vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
    vim.keymap.set("n", "gr", vim.lsp.buf.references, opts)
    vim.keymap.set("n", "<leader>f", function()
      vim.lsp.buf.format({ async = true })
    end, opts)
  end,

  -- Custom capabilities (for nvim-cmp integration)
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})
```

### Integration with nvim-cmp

```lua
local cmp = require("cmp")

cmp.setup({
  sources = cmp.config.sources({
    { name = "nvim_lsp" },  -- LUMOS completions
    { name = "buffer" },
    { name = "path" },
  }),
})
```

---

## Troubleshooting

### LSP not starting

1. Verify `lumos-lsp` is installed:
   ```bash
   lumos-lsp --version
   ```

2. Check LSP logs:
   ```vim
   :LspLog
   ```

3. Manually start LSP:
   ```vim
   :LspStart lumos
   ```

### Tree-sitter not highlighting

1. Verify grammar is installed:
   ```vim
   :TSInstallInfo lumos
   ```

2. Reinstall grammar:
   ```vim
   :TSInstall lumos
   ```

### File type not detected

Add to your config:

```lua
vim.filetype.add({
  extension = {
    lumos = "lumos",
  },
})
```

---

## Related Resources

- [GitHub Repository](https://github.com/getlumos/nvim-lumos)
- [Tree-sitter Grammar](https://github.com/getlumos/tree-sitter-lumos)
- [VS Code Extension](/editors/vscode)
- [CLI Reference](/api/cli-commands)
