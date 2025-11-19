# LUMOS Documentation

Official documentation website for [LUMOS](https://github.com/getlumos/lumos) - Type-safe schema language for Solana development.

**Live Site:** https://docs.lumos-lang.org

Built with [Astro Starlight](https://starlight.astro.build)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Opens http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Structure

```
docs-lumos/
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── getting-started/    # Installation, Quick Start
│   │       ├── guides/             # Type Mapping, Anchor Integration
│   │       ├── api/                # CLI, Parser, Generators
│   │       └── examples/           # Real-world schemas
│   ├── assets/                     # Logo, images
│   └── styles/
│       └── custom.css              # LUMOS branding (purple/gold)
├── astro.config.mjs                # Starlight configuration
└── package.json
```

---

## 🎨 Branding

LUMOS uses a **purple & gold** color theme:

- **Primary:** `#9333EA` (Purple-600)
- **Accent:** `#FACC15` (Gold-400)
- **Background:** `#0F172A` (Dark slate)

Custom styles in `src/styles/custom.css`.

---

## 🛠️ Technology Stack

- **[Astro Starlight](https://starlight.astro.build/)** - Documentation framework
- **[Astro](https://astro.build/)** - Static site generator
- **Deployed on:** Vercel

---

## 📝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Submit a pull request

**Documentation Guidelines:**
- Use clear, concise language
- Include code examples
- Test all links
- Follow existing structure

---

## 🔗 Related Repos

- [**lumos**](https://github.com/getlumos/lumos) - Main repository (core + CLI)
- [**vscode-lumos**](https://github.com/getlumos/vscode-lumos) - VSCode extension
- [**awesome-lumos**](https://github.com/getlumos/awesome-lumos) - Community examples

---

## 📄 License

Dual-licensed under MIT OR Apache-2.0

---

**Built with ❤️ for the Solana community**
