// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightChangelog from 'starlight-changelog';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.lumos-lang.org',
	integrations: [
		starlight({
			title: 'LUMOS',
			description: 'Solana schema generation tool. Generate synchronized Rust + TypeScript code with type-safe Borsh serialization. Schema-first development for Solana.',
			logo: {
				src: './src/assets/logo.png',
			},
			components: {
				Head: './src/components/Head.astro',
				Footer: './src/components/Footer.astro',
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/getlumos/lumos'
				},
				{
					icon: 'twitter',
					label: 'Twitter',
					href: 'https://twitter.com/getlumos'
				},
			],
			customCss: [
				'./src/styles/custom.css',
			],
			plugins: [
				starlightChangelog({
					repo: {
						owner: 'getlumos',
						name: 'lumos',
					},
					prefix: 'changelog',
					title: 'Changelog',
				}),
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Playground', link: 'https://lumos-lang.org/playground', badge: { text: 'Interactive', variant: 'success' }, attrs: { target: '_blank' } },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'CLI Commands', slug: 'api/cli-commands' },
						{ label: 'Type System', slug: 'api/types' },
						{ label: 'Attributes', slug: 'api/attributes' },
						{ label: 'Generated Code', slug: 'api/generated-code' },
					],
				},
				{
					label: 'FAQ',
					link: '/faq',
					badge: { text: 'New', variant: 'tip' },
				},
				{
					label: 'Guides',
					items: [
						{ label: 'LUMOS vs Codama', slug: 'guides/lumos-vs-codama', badge: { text: 'New', variant: 'tip' } },
						{ label: 'Using npm Package', slug: 'guides/npm-package', badge: { text: 'New', variant: 'success' } },
						{ label: 'Multi-File Schemas', slug: 'guides/multi-file-schemas', badge: { text: 'New', variant: 'success' } },
						{ label: 'Schema Versioning', slug: 'guides/versioning', badge: { text: 'New', variant: 'success' } },
						{ label: 'Schema Migrations', slug: 'guides/schema-migrations', badge: { text: 'New', variant: 'success' } },
						{ label: 'Error Handling', slug: 'guides/error-handling', badge: { text: 'New', variant: 'success' } },
						{ label: 'Debugging', slug: 'guides/debugging', badge: { text: 'New', variant: 'success' } },
						{ label: 'Borsh Internals & Performance', slug: 'guides/borsh-internals', badge: { text: 'New', variant: 'success' } },
						{ label: 'Client Interaction', slug: 'guides/client-interaction', badge: { text: 'New', variant: 'success' } },
						{ label: 'Migration Guide', slug: 'guides/migration-guide' },
						{ label: 'Vision', slug: 'guides/vision', badge: { text: 'New', variant: 'success' } },
						{ label: 'Future', slug: 'guides/future', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Editors',
					items: [
						{ label: 'VS Code', slug: 'editors/vscode', badge: { text: 'New', variant: 'success' } },
						{ label: 'IntelliJ IDEA', slug: 'editors/intellij' },
						{ label: 'Neovim', slug: 'editors/neovim', badge: { text: 'New', variant: 'success' } },
						{ label: 'Emacs', slug: 'editors/emacs', badge: { text: 'New', variant: 'success' } },
						{ label: 'Sublime Text', slug: 'editors/sublime', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Frameworks',
					items: [
						{ label: 'Anchor', slug: 'frameworks/anchor', badge: { text: 'New', variant: 'success' } },
						{ label: 'Native Solana', slug: 'frameworks/native-solana' },
						{ label: 'Metaplex', slug: 'frameworks/metaplex', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Adding Optional Field', slug: 'examples/versioning/adding-optional-field', badge: { text: 'New', variant: 'success' } },
						{ label: 'Changing Field Type', slug: 'examples/versioning/changing-field-type', badge: { text: 'New', variant: 'success' } },
						{ label: 'Deprecating a Field', slug: 'examples/versioning/deprecating-field', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Changelog',
					link: '/changelog/',
					badge: { text: 'New', variant: 'success' },
				},
			],
		}),
	],
});
