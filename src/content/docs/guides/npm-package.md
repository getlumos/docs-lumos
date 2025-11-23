---
title: Using LUMOS with npm
description: Complete guide to using LUMOS in JavaScript/TypeScript projects via npm
---

Use LUMOS in your JavaScript/TypeScript projects without installing Rust. The `@getlumos/cli` npm package provides the full LUMOS functionality via WebAssembly.

## Why Use the npm Package?

- ✅ **No Rust Toolchain Required** - Works with Node.js only
- ✅ **Cross-Platform** - Single package for all platforms
- ✅ **Programmatic API** - Use LUMOS in build scripts
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Lightweight** - 261 KB compressed (~750 KB unpacked)

---

## Installation

### Global Installation

Install globally to use the `lumos` command everywhere:

```bash
npm install -g @getlumos/cli
# or
yarn global add @getlumos/cli
# or
pnpm add -g @getlumos/cli
```

**Verify installation:**
```bash
lumos --version
# Output: 0.1.0
```

### Project Installation

Install as a dev dependency in your project:

```bash
npm install --save-dev @getlumos/cli
# or
yarn add --dev @getlumos/cli
# or
pnpm add -D @getlumos/cli
```

### No Installation (npx)

Run directly without installing:

```bash
npx @getlumos/cli generate schema.lumos
```

---

## CLI Usage

The npm package provides the same CLI commands as the Rust version.

### Generate Code

```bash
# Basic usage
lumos generate schema.lumos

# With custom output paths
lumos generate schema.lumos \\
  --output-rust src/generated.rs \\
  --output-typescript src/generated.ts

# Using npx
npx @getlumos/cli generate schema.lumos
```

### Validate Schema

```bash
lumos validate schema.lumos
# Output: ✓ Schema is valid
```

### Add to package.json Scripts

```json
{
  "scripts": {
    "codegen": "lumos generate schema.lumos",
    "validate": "lumos validate schema.lumos",
    "prebuild": "npm run codegen"
  }
}
```

Then run:
```bash
npm run codegen
```

---

## Programmatic API

Use LUMOS in your JavaScript/TypeScript code.

### Generate Code

```typescript
import { generate } from '@getlumos/cli';

const result = await generate('schema.lumos', {
  outputRust: 'src/generated.rs',
  outputTypeScript: 'src/generated.ts'
});

console.log('Generated Rust code:', result.rust);
console.log('Generated TypeScript code:', result.typescript);
```

**API Signature:**
```typescript
function generate(
  schemaPath: string,
  options?: {
    outputRust?: string;
    outputTypeScript?: string;
  }
): Promise<{
  rust: string;
  typescript: string;
}>;
```

### Validate Schema

```typescript
import { validate } from '@getlumos/cli';

const result = await validate('schema.lumos');

if (result.valid) {
  console.log('✓ Schema is valid');
} else {
  console.error('✗ Schema validation failed');
  console.error(result.errors);
  process.exit(1);
}
```

**API Signature:**
```typescript
function validate(schemaPath: string): Promise<{
  valid: boolean;
  errors?: string[];
}>;
```

### Error Handling

```typescript
import { generate } from '@getlumos/cli';

try {
  await generate('schema.lumos');
} catch (error) {
  if (error instanceof Error) {
    console.error('Generation failed:', error.message);
  }
  process.exit(1);
}
```

---

## Build Tool Integration

### Vite

Create a Vite plugin for automatic code generation:

```typescript
// vite-plugin-lumos.ts
import { Plugin } from 'vite';
import { generate } from '@getlumos/cli';
import { watch } from 'fs';

export function lumosPlugin(schemaPath: string): Plugin {
  return {
    name: 'vite-plugin-lumos',

    async buildStart() {
      // Generate on build start
      await generate(schemaPath);
    },

    configureServer(server) {
      // Watch schema file for changes
      watch(schemaPath, async () => {
        await generate(schemaPath);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}
```

**Usage in vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import { lumosPlugin } from './vite-plugin-lumos';

export default defineConfig({
  plugins: [
    lumosPlugin('schema.lumos')
  ]
});
```

### Webpack

Create a Webpack plugin:

```javascript
// webpack-plugin-lumos.js
const { generate } = require('@getlumos/cli');

class LumosPlugin {
  constructor(schemaPath) {
    this.schemaPath = schemaPath;
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapPromise('LumosPlugin', async () => {
      await generate(this.schemaPath);
    });
  }
}

module.exports = LumosPlugin;
```

**Usage in webpack.config.js:**
```javascript
const LumosPlugin = require('./webpack-plugin-lumos');

module.exports = {
  plugins: [
    new LumosPlugin('schema.lumos')
  ]
};
```

### Rollup

```javascript
// rollup.config.js
import { generate } from '@getlumos/cli';

export default {
  input: 'src/index.ts',
  plugins: [
    {
      name: 'lumos',
      async buildStart() {
        await generate('schema.lumos');
      }
    }
  ]
};
```

### esbuild

```javascript
// build.js
import { build } from 'esbuild';
import { generate } from '@getlumos/cli';

// Generate before building
await generate('schema.lumos');

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js'
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate LUMOS Code

on: [push, pull_request]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Generate LUMOS code
        run: npx @getlumos/cli generate schema.lumos

      - name: Validate generated files
        run: |
          git diff --exit-code generated.rs generated.ts || \\
            (echo "Generated files are outdated!" && exit 1)
```

### GitLab CI

```yaml
generate-code:
  image: node:20
  script:
    - npm install
    - npx @getlumos/cli generate schema.lumos
    - git diff --exit-code generated.rs generated.ts
  only:
    - merge_requests
    - main
```

### CircleCI

```yaml
version: 2.1

jobs:
  generate:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run: npm install
      - run: npx @getlumos/cli generate schema.lumos
      - run: git diff --exit-code

workflows:
  validate:
    jobs:
      - generate
```

---

## Watch Mode (Custom Implementation)

The npm package doesn't have built-in watch mode, but you can create one:

```javascript
// watch.js
import { watch } from 'fs';
import { generate } from '@getlumos/cli';

const schemaPath = 'schema.lumos';

console.log(`👀 Watching ${schemaPath}...`);

watch(schemaPath, async (eventType) => {
  if (eventType === 'change') {
    console.log('🔄 Schema changed, regenerating...');
    try {
      await generate(schemaPath);
      console.log('✓ Code regenerated');
    } catch (error) {
      console.error('✗ Generation failed:', error.message);
    }
  }
});
```

**Run with:**
```bash
node watch.js
```

**Or use nodemon:**
```bash
npm install --save-dev nodemon

# package.json
{
  "scripts": {
    "watch": "nodemon --watch schema.lumos --exec 'npm run codegen'"
  }
}
```

---

## Monorepo Usage

### Nx Workspace

```json
// apps/my-app/project.json
{
  "targets": {
    "codegen": {
      "executor": "nx:run-commands",
      "options": {
        "command": "lumos generate schema.lumos",
        "cwd": "apps/my-app"
      }
    },
    "build": {
      "dependsOn": ["codegen"]
    }
  }
}
```

### Turborepo

```json
// turbo.json
{
  "pipeline": {
    "codegen": {
      "outputs": ["generated.rs", "generated.ts"]
    },
    "build": {
      "dependsOn": ["codegen"]
    }
  }
}
```

---

## TypeScript Configuration

### Type Definitions

The package includes full TypeScript type definitions:

```typescript
import type { GenerateOptions, GeneratedCode, ValidationResult } from '@getlumos/cli';

const options: GenerateOptions = {
  outputRust: 'src/generated.rs',
  outputTypeScript: 'src/generated.ts'
};

const result: GeneratedCode = await generate('schema.lumos', options);
const validation: ValidationResult = await validate('schema.lumos');
```

### tsconfig.json

Ensure proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "types": ["node"]
  }
}
```

---

## Comparison: npm vs Rust CLI

| Feature | npm (`@getlumos/cli`) | Rust (`lumos-cli`) |
|---------|----------------------|-------------------|
| **Installation** | `npm install -g` | `cargo install` |
| **Requirements** | Node.js 16+ | Rust toolchain |
| **Size** | 261 KB (compressed) | ~10 MB (native binary) |
| **Speed** | WASM (~10-20% slower) | Native (fastest) |
| **Platform** | Cross-platform (single package) | Platform-specific binaries |
| **Programmatic API** | ✅ JavaScript/TypeScript | ❌ Rust only |
| **CLI Commands** | ✅ All commands | ✅ All commands |
| **Watch Mode** | ❌ Custom implementation | ❌ Not yet |
| **LSP Support** | ❌ Use Rust LSP | ✅ Via `lumos-lsp` |

**Choose npm if:**
- You don't have Rust installed
- You want programmatic API access
- You're building JavaScript/TypeScript projects
- You need cross-platform compatibility

**Choose Rust if:**
- You want maximum performance
- You're building Rust/Anchor projects
- You need LSP integration
- You prefer native binaries

---

## Troubleshooting

### WASM Initialization Error

**Error:**
```
Failed to load LUMOS WASM module
```

**Fix:**
Ensure you're using Node.js 16 or higher:
```bash
node --version  # Should be >= 16.0.0
```

### Module Not Found

**Error:**
```
Cannot find module '@getlumos/cli'
```

**Fix:**
Reinstall the package:
```bash
npm install --save-dev @getlumos/cli
```

### Permission Denied

**Error:**
```
EACCES: permission denied
```

**Fix:**
Use `npx` instead of global install, or fix npm permissions:
```bash
npx @getlumos/cli generate schema.lumos
```

### Generated Files Missing

**Error:**
```
Cannot write to file: generated.rs
```

**Fix:**
Ensure output directory exists and is writable:
```bash
mkdir -p src/generated
lumos generate schema.lumos --output-rust src/generated/types.rs
```

---

## Performance Tips

### Cache Generated Files

Add to `.gitignore` if regenerating in CI:
```gitignore
generated.rs
generated.ts
```

### Use npx for CI

Avoid installing globally in CI:
```bash
npx @getlumos/cli generate schema.lumos
```

### Parallel Generation

Generate multiple schemas in parallel:

```javascript
import { generate } from '@getlumos/cli';

await Promise.all([
  generate('schemas/accounts.lumos'),
  generate('schemas/instructions.lumos'),
  generate('schemas/events.lumos')
]);
```

---

## Examples

### Basic Node.js Script

```javascript
// codegen.js
import { generate, validate } from '@getlumos/cli';

async function main() {
  // Validate first
  const validation = await validate('schema.lumos');
  if (!validation.valid) {
    console.error('Schema validation failed');
    process.exit(1);
  }

  // Generate
  await generate('schema.lumos', {
    outputRust: 'src/generated.rs',
    outputTypeScript: 'src/types.ts'
  });

  console.log('✓ Code generated successfully');
}

main().catch(console.error);
```

### Pre-build Hook

```json
{
  "scripts": {
    "prebuild": "node codegen.js",
    "build": "tsc"
  }
}
```

### Multi-Schema Generation

```typescript
// generate-all.ts
import { generate } from '@getlumos/cli';
import { readdirSync } from 'fs';
import { join } from 'path';

const schemasDir = './schemas';
const schemas = readdirSync(schemasDir)
  .filter(file => file.endsWith('.lumos'));

for (const schema of schemas) {
  const schemaPath = join(schemasDir, schema);
  const name = schema.replace('.lumos', '');

  await generate(schemaPath, {
    outputRust: `src/generated/${name}.rs`,
    outputTypeScript: `src/types/${name}.ts`
  });

  console.log(`✓ Generated ${name}`);
}
```

---

## Next Steps

- [CLI Commands Reference](/api/cli-commands) - Detailed command documentation
- [Type System](/api/types) - Understanding LUMOS types
- [Generated Code](/api/generated-code) - Working with generated files
- [GitHub Action](https://github.com/marketplace/actions/lumos-generate) - Automate in CI/CD

---

## Package Information

- **npm Registry**: https://www.npmjs.com/package/@getlumos/cli
- **GitHub**: https://github.com/getlumos/lumos/tree/main/packages/npm
- **Issues**: https://github.com/getlumos/lumos/issues
- **License**: MIT OR Apache-2.0
