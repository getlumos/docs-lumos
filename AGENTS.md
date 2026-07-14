<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# LUMOS Documentation

> Official documentation site for the LUMOS schema language, built with Astro Starlight.

**Ecosystem context:** See [getlumos/lumos/AGENTS.md](https://github.com/getlumos/lumos/blob/main/AGENTS.md) for the LUMOS ecosystem overview, cross-repo standards, and shared guidelines.

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

## Common Commands

```bash
npm install
npm run dev              # Dev server (localhost:4321)
npm run build            # Build for production (generates OG images first)
npm run build:og         # Regenerate OG images only
npm run preview          # Preview build
```

## Deployment

**Platform:** Vercel — project `rectors-projects/docs-lumos`
**Domain:** docs.lumos-lang.org (Let's Encrypt, auto-renewed by Vercel)
**Auto-deploy:** push to `master` → Vercel builds and promotes to production
**Config:** `vercel.json` (framework=astro, build=`npm run build`, output=`dist`)

`npm run build` runs OG image generation then `astro build` → `dist/`

## Key Pages to Maintain

- `src/content/docs/getting-started/` - Update on version changes
- `src/content/docs/api/types.md` - Keep type mapping table current
- `src/content/docs/frameworks/` - Framework integration guides
- `src/content/docs/guides/` - Add real-world patterns

## OG Image Generation

Dynamic OG images are generated at build time using `satori` + `@resvg/resvg-js`:

```bash
npm run build:og         # Generate all 42 OG images
```

Images saved to `public/og/{slug}.png` (1200x630px).

## Cross-Posting (Dev.to)

**Organization:** [@getlumos](https://dev.to/getlumos) (ID: 12078)

**Workflow:**
1. Articles saved to `devto-posts/` directory
2. Use canonical_url pointing to docs.lumos-lang.org
3. Publish via API or manually

**Tags:** `solana`, `rust`, `typescript`, `webdev`, `blockchain`

## Analytics

- **Google Analytics 4:** G-1NZRT4TYL6
- **Google Search Console:** Verified (sitemap submitted)