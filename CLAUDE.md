# CLAUDE.md - LUMOS Documentation

**Repository:** https://github.com/getlumos/docs-lumos
**Website:** https://lumos-lang.org
**Purpose:** Official documentation site (VitePress)

---

## Site Structure

```
docs-lumos/
├── .vitepress/config.ts    # Site configuration
├── index.md                # Homepage
├── guide/                  # Getting started
├── reference/              # Language reference
├── examples/               # Code examples
└── api/                    # CLI/library API
```

---

## Local Development

```bash
npm install              # Install dependencies
npm run docs:dev         # Dev server (localhost:5173)
npm run docs:build       # Build for production
npm run docs:preview     # Preview build
```

---

## Deployment

**Platform:** Cloudflare Pages
**Domain:** lumos-lang.org
**Auto-deploy:** Push to `main` → live
**Build:** `npm run docs:build` → `.vitepress/dist/`

---

## Content Organization

| Section | Audience | Purpose |
|---------|----------|---------|
| **guide/** | New users | Zero to first schema in 15 min |
| **reference/** | Active developers | Complete syntax/behavior docs |
| **examples/** | All users | Copy-paste patterns |
| **api/** | Integrators | CLI commands, library API |

---

## Documentation Standards

**Writing:** Clear, concise, code examples for every concept.
**Code Examples:** Complete, runnable, show generated output.
**Structure:** Progressive disclosure (simple → complex), cross-referenced, search-friendly.

---

## Key Pages to Maintain

- `guide/installation.md` - Update on version changes
- `reference/types.md` - Keep type mapping table current
- `examples/*` - Add real-world patterns
- `CHANGELOG.md` - Update every release

---

## AI Assistant Guidelines

**DO:** Sync with lumos-core releases, test all examples, update versions, cross-reference.

**DON'T:** Document unimplemented features, use outdated syntax, skip testing, create orphaned pages.

---

## Related Repositories

- **lumos** - Core library (docs document this)
- **awesome-lumos** - Examples (docs links to these)
- **vscode-lumos** - VSCode extension (docs covers usage)

---

**Last Updated:** 2025-11-20
**Status:** Live at https://lumos-lang.org
