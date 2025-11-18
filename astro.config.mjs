// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.lumos-lang.com',
	integrations: [
		starlight({
			title: 'LUMOS',
			description: 'Type-safe schema language for Solana development',
			logo: {
				src: './src/assets/logo.svg',
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
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Type Mapping', slug: 'guides/type-mapping' },
						{ label: 'Anchor Integration', slug: 'guides/anchor-integration' },
						{ label: 'Enum Support', slug: 'guides/enum-support' },
						{ label: 'Migration Guide', slug: 'guides/migration-guide' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'CLI Commands', slug: 'api/cli-commands' },
						{ label: 'Parser', slug: 'api/parser' },
						{ label: 'Generators', slug: 'api/generators' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Gaming Platform', slug: 'examples/gaming' },
						{ label: 'NFT Marketplace', slug: 'examples/nft-marketplace' },
						{ label: 'DeFi Staking', slug: 'examples/defi-staking' },
						{ label: 'DAO Governance', slug: 'examples/dao-governance' },
						{ label: 'Token Vesting', slug: 'examples/token-vesting' },
					],
				},
			],
		}),
	],
});
