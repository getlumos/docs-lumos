# CLAUDE.md - LUMOS Documentation

> **Ecosystem Context:** See [getlumos/lumos/CLAUDE.md](https://github.com/getlumos/lumos/blob/main/CLAUDE.md) for LUMOS ecosystem overview, cross-repo standards, and shared guidelines.

---

## Site Structure

```
docs-lumos/
├── astro.config.mjs        # Site configuration
├── src/
│   ├── content/docs/       # Documentation pages (MDX)
│   ├── components/         # Custom components (Head, Footer)
│   └── styles/             # Custom CSS
├── public/
│   └── og/                 # Generated OG images
└── scripts/
    └── generate-og-images.js  # OG image generator
```

---

## Local Development

```bash
npm install
npm run dev              # Dev server (localhost:4321)
npm run build            # Build for production (generates OG images first)
npm run build:og         # Regenerate OG images only
npm run preview          # Preview build
```

---

## Deployment

**Platform:** VPS (Docker)
**SSH Host:** `lumos` (176.222.53.185)
**User:** `lumos`
**Port:** 4000
**Domain:** docs.lumos-lang.org
**Auto-deploy:** GitHub Actions → Docker → VPS

**Build:** `npm run build` → `dist/`

---

## Key Pages to Maintain

- `src/content/docs/getting-started/` - Update on version changes
- `src/content/docs/api/types.md` - Keep type mapping table current
- `src/content/docs/frameworks/` - Framework integration guides
- `src/content/docs/guides/` - Add real-world patterns

---

## OG Image Generation

Dynamic OG images are generated at build time using `satori` + `@resvg/resvg-js`:

```bash
npm run build:og         # Generate all 42 OG images
```

Images are saved to `public/og/{slug}.png` (1200x630px).

---

**Last Updated:** 2025-12-16
**Status:** Live at https://docs.lumos-lang.org
