---
title: Emacs
description: LUMOS major mode for Emacs with syntax highlighting and LSP support
---

The official LUMOS major mode for Emacs provides syntax highlighting and LSP integration via lsp-mode.

## Installation

### Using MELPA

```elisp
(use-package lumos-mode
  :ensure t
  :hook (lumos-mode . lsp-deferred))
```

### Using straight.el

```elisp
(use-package lumos-mode
  :straight (lumos-mode :type git :host github :repo "getlumos/lumos-mode")
  :hook (lumos-mode . lsp-deferred))
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/getlumos/lumos-mode ~/.emacs.d/lumos-mode

# Add to load-path
(add-to-list 'load-path "~/.emacs.d/lumos-mode")
(require 'lumos-mode)
```

---

## Requirements

- **Emacs 26.1+** (required)
- **lsp-mode** - For LSP features
- **lumos-lsp** - LSP server
  ```bash
  cargo install lumos-lsp
  ```

---

## Features

### Syntax Highlighting

- Keywords: `struct`, `enum`, `type`, `mod`, `use`, `pub`
- Types: Primitives, Solana types, user-defined
- Attributes: `#[solana]`, `#[account]`, `#[deprecated]`
- Comments: Line (`//`) and block (`/* */`)

### Smart Indentation

Automatic indentation with configurable offset (default: 4 spaces).

### LSP Integration

Via lsp-mode:

- Real-time diagnostics
- Auto-completion
- Hover documentation
- Go to definition
- Find references

---

## Configuration

### Basic Setup

```elisp
(use-package lumos-mode
  :ensure t
  :mode "\\.lumos\\'"
  :hook (lumos-mode . lsp-deferred)
  :custom
  (lumos-indent-offset 4))
```

### Custom LSP Server Path

```elisp
(use-package lsp-mode
  :config
  (add-to-list 'lsp-language-id-configuration '(lumos-mode . "lumos"))

  (lsp-register-client
   (make-lsp-client
    :new-connection (lsp-stdio-connection "lumos-lsp")
    :activation-fn (lsp-activate-on "lumos")
    :server-id 'lumos-lsp)))
```

### Keybindings

Default keybindings (with lsp-mode):

| Key | Action |
|-----|--------|
| `M-.` | Go to definition |
| `M-,` | Go back |
| `M-?` | Find references |
| `C-c C-r` | Rename symbol |
| `C-c C-a` | Code action |

---

## Customization

### Variables

```elisp
;; Indentation offset
(setq lumos-indent-offset 2)

;; LSP server command
(setq lumos-lsp-server-command "lumos-lsp")
```

---

## Troubleshooting

### LSP not connecting

1. Verify `lumos-lsp` is installed:
   ```bash
   lumos-lsp --version
   ```

2. Check LSP logs:
   ```
   M-x lsp-workspace-show-log
   ```

### Mode not activating

Ensure file association:

```elisp
(add-to-list 'auto-mode-alist '("\\.lumos\\'" . lumos-mode))
```

---

## Related Resources

- [GitHub Repository](https://github.com/getlumos/lumos-mode)
- [VS Code Extension](/editors/vscode)
- [CLI Reference](/api/cli-commands)
