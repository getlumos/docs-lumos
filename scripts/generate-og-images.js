/**
 * OG Image Generator for LUMOS Documentation
 * Generates 1200x630 social sharing images for each documentation page
 *
 * Usage: node scripts/generate-og-images.js
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const CONTENT_DIR = join(ROOT_DIR, 'src/content/docs');
const OUTPUT_DIR = join(ROOT_DIR, 'public/og');

// LUMOS Brand Colors
const COLORS = {
  purple900: '#581c87',
  purple600: '#9333ea',
  purple400: '#c084fc',
  purple300: '#d8b4fe',
  gold400: '#facc15',
  gold300: '#fde047',
  darkSlate: '#0f172a',
  slate800: '#1e293b',
  white: '#ffffff',
  gray300: '#d1d5db',
};

// Image dimensions (OG standard)
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate slug from file path
 */
function getSlug(filePath) {
  const relativePath = relative(CONTENT_DIR, filePath);
  return relativePath
    .replace(/\.mdx?$/, '')
    .replace(/index$/, '')
    .replace(/\/$/, '');
}

/**
 * Truncate text to fit
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Create the OG image JSX template
 */
function createImageTemplate(title, description, section) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${COLORS.darkSlate} 0%, ${COLORS.slate800} 50%, ${COLORS.purple900} 100%)`,
        padding: '60px',
        fontFamily: 'Inter, sans-serif',
      },
      children: [
        // Top bar with logo and section
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            },
            children: [
              // Logo
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  },
                  children: [
                    // Star icon
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '32px',
                        },
                        children: '✦',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '28px',
                          fontWeight: 700,
                          color: COLORS.white,
                          letterSpacing: '2px',
                        },
                        children: 'LUMOS',
                      },
                    },
                  ],
                },
              },
              // Section badge
              section ? {
                type: 'div',
                props: {
                  style: {
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.purple300,
                    background: 'rgba(147, 51, 234, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${COLORS.purple600}`,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  },
                  children: section,
                },
              } : null,
            ].filter(Boolean),
          },
        },
        // Main content
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: title.length > 30 ? '52px' : '64px',
                    fontWeight: 700,
                    color: COLORS.white,
                    lineHeight: 1.2,
                    marginBottom: '24px',
                    background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.purple300} 100%)`,
                    backgroundClip: 'text',
                    // Note: -webkit-background-clip and -webkit-text-fill-color not supported in satori
                  },
                  children: truncate(title, 60),
                },
              },
              // Divider line
              {
                type: 'div',
                props: {
                  style: {
                    width: '120px',
                    height: '4px',
                    background: `linear-gradient(90deg, ${COLORS.purple600} 0%, ${COLORS.gold400} 100%)`,
                    marginBottom: '24px',
                    borderRadius: '2px',
                  },
                },
              },
              // Description
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    color: COLORS.gray300,
                    lineHeight: 1.5,
                    maxWidth: '900px',
                  },
                  children: truncate(description, 120),
                },
              },
            ],
          },
        },
        // Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
            },
            children: [
              // Tagline
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '16px',
                    color: COLORS.purple400,
                    fontWeight: 500,
                  },
                  children: 'Type-safe schemas for Solana',
                },
              },
              // URL
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '16px',
                    color: COLORS.gold400,
                    fontWeight: 600,
                  },
                  children: 'docs.lumos-lang.org',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Generate PNG from template
 */
async function generateImage(template, outputPath) {
  // Fetch Inter font from Google Fonts
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'
  ).then(res => res.arrayBuffer());

  const svg = await satori(template, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: fontData,
        weight: 600,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: WIDTH,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, pngBuffer);
}

/**
 * Extract section from slug
 */
function getSection(slug) {
  const parts = slug.split('/');
  if (parts.length > 1) {
    return parts[0].replace(/-/g, ' ');
  }
  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating OG images for LUMOS documentation...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find all markdown files
  const files = findMarkdownFiles(CONTENT_DIR);
  console.log(`📄 Found ${files.length} documentation files\n`);

  let generated = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const { data } = matter(content);

      const slug = getSlug(file);
      const title = data.title || 'LUMOS Documentation';
      const description = data.description || 'Type-safe schema language for Solana development';
      const section = getSection(slug);

      // Generate output path
      const outputFileName = slug ? `${slug}.png` : 'index.png';
      const outputPath = join(OUTPUT_DIR, outputFileName);

      // Create template and generate image
      const template = createImageTemplate(title, description, section);
      await generateImage(template, outputPath);

      console.log(`  ✅ ${outputFileName}`);
      generated++;
    } catch (error) {
      console.error(`  ❌ Error processing ${file}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary: ${generated} generated, ${errors} errors`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
