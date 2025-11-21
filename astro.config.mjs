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
			description: 'Write once. Deploy Everywhere. Type-safe schema language for Solana development.',
			logo: {
				src: './src/assets/logo.png',
			},
			components: {
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
					// Use /changelog as the base URL
					prefix: 'changelog',
					// Set the title for the changelog page
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
						{ label: 'Playground', link: '/playground', badge: { text: 'Interactive', variant: 'success' } },
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
					label: 'Guides',
					items: [
						{ label: 'Migration Guide', slug: 'guides/migration-guide' },
					],
				},
				// {
				// 	label: 'Examples',
				// 	items: [
				// 		{ label: 'Gaming Platform', slug: 'examples/gaming' },
				// 		{ label: 'NFT Marketplace', slug: 'examples/nft-marketplace' },
				// 		{ label: 'DeFi Staking', slug: 'examples/defi-staking' },
				// 		{ label: 'DAO Governance', slug: 'examples/dao-governance' },
				// 		{ label: 'Token Vesting', slug: 'examples/token-vesting' },
				// 	],
				// },
				{
					label: 'Changelog',
					link: '/changelog/',
					badge: { text: 'New', variant: 'success' },
				},
			],
		}),
	],
});
