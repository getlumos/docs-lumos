# LUMOS Documentation Gap Analysis Report

**Date:** 2025-12-08
**Status:** Issue #84 - Documentation Audit & Gap Analysis

---

## Executive Summary

Comprehensive audit of LUMOS documentation reveals **significant gaps** in CLI command coverage and missing dedicated pages for editor integrations and framework guides. Current coverage is approximately **40%** of CLI features documented.

---

## Feature Inventory

### CLI Commands (19 total commands/subcommands)

| Command | Documented | Priority |
|---------|------------|----------|
| `generate` | Partial (missing --watch, --backup, --show-diff) | HIGH |
| `validate` | Yes | - |
| `init` | Yes | - |
| `check` | Yes | - |
| `check-size` | **NO** | HIGH |
| `diff` | Yes | - |
| `migrate` | Yes | - |
| `check-compat` | Yes | - |
| `security analyze` | **NO** | HIGH |
| `audit generate` | **NO** | HIGH |
| `fuzz generate` | **NO** | MEDIUM |
| `fuzz run` | **NO** | MEDIUM |
| `fuzz corpus` | **NO** | MEDIUM |
| `anchor generate` | **NO** | CRITICAL |
| `anchor idl` | **NO** | CRITICAL |
| `anchor space` | **NO** | CRITICAL |
| `metaplex validate` | **NO** | MEDIUM |
| `metaplex generate` | **NO** | MEDIUM |
| `metaplex types` | **NO** | MEDIUM |

**Documented: 7/19 (37%)**

### LSP Features

| Feature | Documented | Priority |
|---------|------------|----------|
| Diagnostics (real-time errors) | Mentioned in FAQ | HIGH |
| Auto-completion | Mentioned | HIGH |
| Hover documentation | Not documented | MEDIUM |
| Editor installation | Partial | HIGH |

### Editor Integrations

| Editor | Dedicated Page | Priority |
|--------|----------------|----------|
| VSCode | **NO** (mentioned only) | CRITICAL |
| IntelliJ IDEA | Yes | - |
| Neovim | **NO** | HIGH |
| Emacs | **NO** | MEDIUM |
| Sublime Text | **NO** | MEDIUM |

### Framework Guides

| Framework | Page Exists | Priority |
|-----------|-------------|----------|
| Native Solana | Yes | - |
| Seahorse | Yes (stub) | LOW |
| Anchor | **NO** | CRITICAL |
| Metaplex | **NO** | HIGH |

### Multi-Language Generation

| Language | Type Mapping Docs | Generator Guide | Priority |
|----------|-------------------|-----------------|----------|
| Rust | Yes | Yes | - |
| TypeScript | Yes | Yes | - |
| Python | Yes (api/python-types.md) | Partial | MEDIUM |
| Go | Yes (api/go-types.md) | Partial | MEDIUM |
| Ruby | Yes (api/ruby-types.md) | Partial | MEDIUM |

---

## Critical Gaps (Must Fix)

### 1. Anchor Framework Commands (CRITICAL)

The `anchor` subcommands are completely undocumented despite being a core feature:

```bash
lumos anchor generate <schema>  # Generate complete Anchor program
lumos anchor idl <schema>       # Generate Anchor IDL JSON
lumos anchor space <schema>     # Calculate account space constants
```

**Impact:** Users cannot discover Anchor integration capabilities.

### 2. VSCode Editor Page (CRITICAL)

No dedicated documentation page for VSCode extension despite:
- Being the most popular editor
- Extension published on marketplace
- Features: syntax highlighting, IntelliSense, diagnostics, snippets

**Files mentioning but not documenting:**
- `faq.md` - brief mention
- `installation.md` - no VSCode setup
- `changelog/v010.md` - release notes only

### 3. Security Analysis Command (HIGH)

`lumos security analyze` is undocumented:

```bash
lumos security analyze <schema> [--format text|json] [--strict]
```

**Detects:**
- Missing signer checks
- Potential integer overflow
- Unchecked owner validation
- PDA seed security issues

### 4. Account Size Analysis (HIGH)

`lumos check-size` is undocumented:

```bash
lumos check-size <schema> [--format text|json]
```

**Features:**
- Calculate exact Borsh serialization size
- Warn about Solana account limits (10KB)
- Show per-field breakdown

### 5. Audit Checklist Generation (HIGH)

`lumos audit generate` is undocumented:

```bash
lumos audit generate <schema> [--output FILE] [--format markdown|json]
```

**Generates:** Security audit checklist based on schema patterns.

---

## Medium Priority Gaps

### 6. Fuzz Testing Commands

Three fuzz testing commands undocumented:

```bash
lumos fuzz generate <schema>   # Generate fuzz targets
lumos fuzz run <schema> --type-name <type>  # Run fuzzing
lumos fuzz corpus <schema>     # Generate test corpus
```

### 7. Metaplex Integration

Three Metaplex commands undocumented:

```bash
lumos metaplex validate <schema>  # Validate against Metaplex standards
lumos metaplex generate <schema>  # Generate Metaplex-compatible code
lumos metaplex types             # Show standard Metaplex types
```

### 8. Neovim Editor Page

nvim-lumos exists but no documentation:
- Tree-sitter integration
- LSP configuration
- Keybinding setup

### 9. Generate Command Options

Missing documentation for:
- `--watch` - Watch mode for auto-regeneration
- `--backup` - Backup before overwriting
- `--show-diff` - Preview changes before writing
- `--target` - Target framework selection (auto/native/anchor)

---

## Low Priority Gaps

### 10. Emacs & Sublime Text Pages

Both plugins exist but no dedicated docs.

### 11. Seahorse Integration

Stub page exists - needs full content.

---

## Current Documentation Structure (35 files)

```
docs/
├── api/
│   ├── attributes.md         ✓
│   ├── cli-commands.md       ⚠️ (37% coverage)
│   ├── generated-code.md     ✓
│   ├── go-types.md          ✓
│   ├── python-types.md      ✓
│   ├── ruby-types.md        ✓
│   └── types.md             ✓
├── changelog/
│   ├── v010.md              ✓
│   ├── v011.md              ✓
│   └── v020.md              ✓
├── editors/
│   └── intellij.md          ✓
├── examples/versioning/
│   ├── adding-optional-field.md    ✓
│   ├── changing-field-type.md      ✓
│   └── deprecating-field.md        ✓
├── frameworks/
│   ├── native-solana.md     ✓
│   └── seahorse.md          ⚠️ (stub)
├── getting-started/
│   ├── installation.md      ✓
│   ├── introduction.md      ✓
│   └── quick-start.md       ✓
├── guides/
│   ├── borsh-internals.md       ✓
│   ├── client-interaction.md    ✓
│   ├── debugging.md             ✓
│   ├── error-handling.md        ✓
│   ├── future.md                ✓
│   ├── lumos-vs-codama.md       ✓
│   ├── migration-guide.md       ✓
│   ├── multi-file-schemas.md    ✓
│   ├── npm-package.md           ✓
│   ├── schema-migrations.md     ✓
│   ├── versioning.md            ✓
│   └── vision.md                ✓
├── reference/
│   └── example.md               (placeholder)
├── faq.md                   ✓
└── index.mdx                ✓
```

---

## Recommended Actions

### Phase 1: Critical Fixes (Immediate)

1. **Add Anchor Commands to cli-commands.md** (~200 lines)
   - `anchor generate`, `anchor idl`, `anchor space`
   - Full options, examples, use cases

2. **Create editors/vscode.md** (~150 lines)
   - Installation from marketplace
   - Features overview
   - Configuration options
   - Troubleshooting

3. **Add Security & Audit Commands** (~150 lines)
   - `security analyze` documentation
   - `audit generate` documentation
   - Example outputs

4. **Add check-size Command** (~80 lines)
   - Usage, options, examples
   - Size calculation details

### Phase 2: High Priority

5. **Create frameworks/anchor.md** (~300 lines)
   - Complete Anchor workflow
   - IDL generation
   - Account contexts
   - Client generation

6. **Create editors/neovim.md** (~100 lines)

7. **Add Fuzz Testing Commands** (~100 lines)

### Phase 3: Medium Priority

8. **Create frameworks/metaplex.md** (~200 lines)
9. **Create editors/emacs.md** (~80 lines)
10. **Create editors/sublime.md** (~80 lines)
11. **Document generate command options** (~50 lines)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| CLI Command Coverage | 37% | 100% |
| Editor Pages | 1/5 | 5/5 |
| Framework Guides | 1/4 | 4/4 |
| LSP Feature Docs | 0% | 100% |

---

## Next Steps

1. Start with Phase 1 Critical Fixes
2. Add missing CLI commands to `api/cli-commands.md`
3. Create `editors/vscode.md`
4. Create `frameworks/anchor.md`
5. Update sidebar in `astro.config.mjs`

---

*Generated as part of Issue #84 Documentation Audit*
