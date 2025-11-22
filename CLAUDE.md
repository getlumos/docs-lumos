# CLAUDE.md - LUMOS Documentation

> **Ecosystem Context:** See [getlumos/lumos/CLAUDE.md](https://github.com/getlumos/lumos/blob/main/CLAUDE.md) for LUMOS ecosystem overview, cross-repo standards, and shared guidelines.

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
npm install
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

## Key Pages to Maintain

- `guide/installation.md` - Update on version changes
- `reference/types.md` - Keep type mapping table current
- `examples/*` - Add real-world patterns
- `CHANGELOG.md` - Update every release

---

**Last Updated:** 2025-11-22
**Status:** Live at https://lumos-lang.org
