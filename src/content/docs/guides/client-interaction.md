---
title: Client-Side Interaction Guide
description: Complete workflow for interacting with LUMOS-generated types from Rust programs to TypeScript clients
---

This guide demonstrates the complete workflow for interacting with LUMOS-generated types, covering account fetching, deserialization, transaction building, and real-time updates.

**What You'll Learn:**
- How to generate code for both Rust and TypeScript
- Fetching and deserializing on-chain account data
- Building and sending transactions
- Subscribing to real-time account updates
- Error handling patterns for client code

---

## Complete Workflow Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   schema.lumos  │────▶│  lumos generate  │────▶│  generated.rs/.ts   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │  Rust Program   │◀────────────▶│  Solana RPC     │◀────────────▶│  TypeScript     │
              │  (Anchor/Borsh) │              │  (On-chain)     │              │  Client         │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
```

---

## Step 1: Define Your Schema

Start with a LUMOS schema that defines your on-chain data structures:

```rust
// schema.lumos
#[solana]
#[account]
struct PlayerAccount {
    /// Player's wallet address
    wallet: PublicKey,
    /// Current level (1-100)
    level: u16,
    /// Total experience points
    experience: u64,
    /// Items in inventory (max 10)
    inventory: [String],
    /// Last activity timestamp
    last_active: i64,
}

#[solana]
enum GameInstruction {
    /// Initialize a new player account
    Initialize {
        wallet: PublicKey,
    },
    /// Add experience points
    AddExperience {
        amount: u64,
    },
    /// Add item to inventory
    AddItem {
        item_name: String,
    },
}
```

---

## Step 2: Generate Code

Generate both Rust and TypeScript code:

```bash
lumos generate schema.lumos --output ./generated
```

This creates:
- `generated/generated.rs` - Rust types for your Anchor program
- `generated/generated.ts` - TypeScript interfaces + Borsh schemas

---

## Step 3: Use in Rust Program

Import and use the generated types in your Anchor program:

```rust
// programs/game/src/lib.rs
use anchor_lang::prelude::*;

// Import LUMOS-generated types
mod generated;
use generated::PlayerAccount;

declare_id!("Game111111111111111111111111111111111111111");

#[program]
pub mod game_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, wallet: Pubkey) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.wallet = wallet;
        player.level = 1;
        player.experience = 0;
        player.inventory = Vec::new();
        player.last_active = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn add_experience(ctx: Context<UpdatePlayer>, amount: u64) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.experience = player.experience.checked_add(amount).unwrap();

        // Level up every 1000 XP
        let new_level = (player.experience / 1000) as u16 + 1;
        if new_level > player.level && new_level <= 100 {
            player.level = new_level;
        }

        player.last_active = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn add_item(ctx: Context<UpdatePlayer>, item_name: String) -> Result<()> {
        let player = &mut ctx.accounts.player;

        require!(player.inventory.len() < 10, GameError::InventoryFull);
        require!(item_name.len() <= 32, GameError::ItemNameTooLong);

        player.inventory.push(item_name);
        player.last_active = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<PlayerAccount>() + 320 // +320 for Vec<String>
    )]
    pub player: Account<'info, PlayerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlayer<'info> {
    #[account(mut, has_one = wallet)]
    pub player: Account<'info, PlayerAccount>,
    pub wallet: Signer<'info>,
}

#[error_code]
pub enum GameError {
    #[msg("Inventory is full (max 10 items)")]
    InventoryFull,
    #[msg("Item name too long (max 32 characters)")]
    ItemNameTooLong,
}
```

---

## Step 4: TypeScript Client Setup

Set up your TypeScript client with the generated types:

```typescript
// client/setup.ts
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

// Import LUMOS-generated types and schemas
import { PlayerAccount, PlayerAccountSchema } from './generated';

// Configuration
const PROGRAM_ID = new PublicKey('Game111111111111111111111111111111111111111');

// Connection setup
export function createConnection(cluster: 'devnet' | 'mainnet-beta' | 'localnet' = 'devnet'): Connection {
  const endpoint = cluster === 'localnet'
    ? 'http://localhost:8899'
    : clusterApiUrl(cluster);

  return new Connection(endpoint, 'confirmed');
}

// Anchor provider setup
export function createProvider(connection: Connection, wallet: anchor.Wallet): anchor.AnchorProvider {
  return new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}

// Find player PDA address
export function findPlayerAddress(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('player'), wallet.toBuffer()],
    PROGRAM_ID
  );
}
```

---

## Step 5: Fetching Account Data

Fetch and deserialize on-chain account data:

```typescript
// client/fetch-account.ts
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';
import { PlayerAccount, PlayerAccountSchema } from './generated';

/**
 * Fetch a single player account
 * @param connection - Solana RPC connection
 * @param address - Player account address
 * @returns PlayerAccount or null if not found
 */
export async function fetchPlayerAccount(
  connection: Connection,
  address: PublicKey
): Promise<PlayerAccount | null> {
  // Fetch raw account data from RPC
  const accountInfo = await connection.getAccountInfo(address);

  if (!accountInfo) {
    console.log('Account not found:', address.toBase58());
    return null;
  }

  try {
    // Skip 8-byte Anchor discriminator
    const data = accountInfo.data.slice(8);

    // Deserialize using LUMOS-generated Borsh schema
    const player = borsh.deserialize(
      PlayerAccountSchema,
      data
    ) as PlayerAccount;

    return player;
  } catch (error) {
    console.error('Deserialization error:', error);
    throw new Error(`Failed to deserialize PlayerAccount: ${error}`);
  }
}

/**
 * Fetch multiple player accounts in a single RPC call
 * @param connection - Solana RPC connection
 * @param addresses - Array of player account addresses
 * @returns Map of address -> PlayerAccount
 */
export async function fetchMultiplePlayers(
  connection: Connection,
  addresses: PublicKey[]
): Promise<Map<string, PlayerAccount>> {
  // Batch fetch all accounts in one RPC call
  const accounts = await connection.getMultipleAccountsInfo(addresses);
  const players = new Map<string, PlayerAccount>();

  for (let i = 0; i < accounts.length; i++) {
    const accountInfo = accounts[i];
    if (!accountInfo) continue;

    try {
      const data = accountInfo.data.slice(8);
      const player = borsh.deserialize(
        PlayerAccountSchema,
        data
      ) as PlayerAccount;

      players.set(addresses[i].toBase58(), player);
    } catch (error) {
      console.warn(`Failed to deserialize account ${addresses[i].toBase58()}:`, error);
    }
  }

  return players;
}

// Usage example
async function example() {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const playerAddress = new PublicKey('...');

  const player = await fetchPlayerAccount(connection, playerAddress);

  if (player) {
    console.log('Player Level:', player.level);
    console.log('Experience:', player.experience);
    console.log('Inventory:', player.inventory);
    console.log('Last Active:', new Date(player.lastActive * 1000));
  }
}
```

---

## Step 6: Sending Transactions

Build and send transactions to your program:

```typescript
// client/send-transaction.ts
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { findPlayerAddress, createProvider } from './setup';

// Import the generated IDL type
import { GameProgram } from '../target/types/game_program';

export class GameClient {
  private program: anchor.Program<GameProgram>;
  private provider: anchor.AnchorProvider;

  constructor(
    program: anchor.Program<GameProgram>,
    provider: anchor.AnchorProvider
  ) {
    this.program = program;
    this.provider = provider;
  }

  /**
   * Initialize a new player account
   */
  async initializePlayer(wallet: PublicKey): Promise<string> {
    const [playerPDA] = findPlayerAddress(wallet);

    const tx = await this.program.methods
      .initialize(wallet)
      .accounts({
        player: playerPDA,
        user: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Initialize transaction:', tx);
    return tx;
  }

  /**
   * Add experience to a player
   */
  async addExperience(
    playerAddress: PublicKey,
    amount: number
  ): Promise<string> {
    const tx = await this.program.methods
      .addExperience(new anchor.BN(amount))
      .accounts({
        player: playerAddress,
        wallet: this.provider.wallet.publicKey,
      })
      .rpc();

    console.log('Add experience transaction:', tx);
    return tx;
  }

  /**
   * Add an item to player's inventory
   */
  async addItem(
    playerAddress: PublicKey,
    itemName: string
  ): Promise<string> {
    const tx = await this.program.methods
      .addItem(itemName)
      .accounts({
        player: playerAddress,
        wallet: this.provider.wallet.publicKey,
      })
      .rpc();

    console.log('Add item transaction:', tx);
    return tx;
  }

  /**
   * Batch add multiple items (single transaction)
   */
  async addMultipleItems(
    playerAddress: PublicKey,
    itemNames: string[]
  ): Promise<string> {
    const ixs = await Promise.all(
      itemNames.map(name =>
        this.program.methods
          .addItem(name)
          .accounts({
            player: playerAddress,
            wallet: this.provider.wallet.publicKey,
          })
          .instruction()
      )
    );

    const tx = new anchor.web3.Transaction().add(...ixs);
    const signature = await this.provider.sendAndConfirm(tx);

    console.log('Batch add items transaction:', signature);
    return signature;
  }
}

// Usage example
async function example() {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {});

  anchor.setProvider(provider);

  const program = anchor.workspace.GameProgram as anchor.Program<GameProgram>;
  const client = new GameClient(program, provider);

  // Initialize player
  const [playerPDA] = findPlayerAddress(wallet.publicKey);
  await client.initializePlayer(wallet.publicKey);

  // Add experience
  await client.addExperience(playerPDA, 500);

  // Add items
  await client.addItem(playerPDA, 'Sword of Light');
  await client.addMultipleItems(playerPDA, ['Health Potion', 'Mana Potion']);
}
```

---

## Step 7: Real-Time Updates with WebSockets

Subscribe to account changes for real-time updates:

```typescript
// client/subscribe-updates.ts
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';
import { PlayerAccount, PlayerAccountSchema } from './generated';

/**
 * Player account subscription manager
 */
export class PlayerSubscription {
  private connection: Connection;
  private address: PublicKey;
  private subscriptionId: number | null = null;

  constructor(connection: Connection, address: PublicKey) {
    this.connection = connection;
    this.address = address;
  }

  /**
   * Subscribe to account changes
   * @param callback - Called whenever account data changes
   */
  subscribe(callback: (player: PlayerAccount) => void): void {
    if (this.subscriptionId !== null) {
      console.warn('Already subscribed');
      return;
    }

    this.subscriptionId = this.connection.onAccountChange(
      this.address,
      (accountInfo: AccountInfo<Buffer>) => {
        try {
          const data = accountInfo.data.slice(8);
          const player = borsh.deserialize(
            PlayerAccountSchema,
            data
          ) as PlayerAccount;

          callback(player);
        } catch (error) {
          console.error('Failed to deserialize account update:', error);
        }
      },
      'confirmed'
    );

    console.log('Subscribed to player updates:', this.address.toBase58());
  }

  /**
   * Unsubscribe from account changes
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriptionId === null) {
      return;
    }

    await this.connection.removeAccountChangeListener(this.subscriptionId);
    this.subscriptionId = null;
    console.log('Unsubscribed from player updates');
  }

  /**
   * Check if currently subscribed
   */
  isSubscribed(): boolean {
    return this.subscriptionId !== null;
  }
}

/**
 * Subscribe to multiple players
 */
export class MultiPlayerSubscription {
  private subscriptions: Map<string, PlayerSubscription> = new Map();
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Add a player to watch
   */
  addPlayer(
    address: PublicKey,
    callback: (address: string, player: PlayerAccount) => void
  ): void {
    const key = address.toBase58();

    if (this.subscriptions.has(key)) {
      console.warn('Already watching:', key);
      return;
    }

    const subscription = new PlayerSubscription(this.connection, address);
    subscription.subscribe((player) => callback(key, player));
    this.subscriptions.set(key, subscription);
  }

  /**
   * Remove a player from watch
   */
  async removePlayer(address: PublicKey): Promise<void> {
    const key = address.toBase58();
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribe from all players
   */
  async unsubscribeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.subscriptions.values()).map(sub => sub.unsubscribe())
    );
    this.subscriptions.clear();
  }
}

// Usage example
async function example() {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const playerAddress = new PublicKey('...');

  const subscription = new PlayerSubscription(connection, playerAddress);

  subscription.subscribe((player) => {
    console.log('Player updated!');
    console.log('  Level:', player.level);
    console.log('  XP:', player.experience);
    console.log('  Items:', player.inventory.length);
  });

  // Later: cleanup
  // await subscription.unsubscribe();
}
```

---

## Step 8: Error Handling

Proper error handling for client operations:

```typescript
// client/error-handling.ts
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SendTransactionError } from '@solana/web3.js';

/**
 * Custom error types for client operations
 */
export enum GameErrorCode {
  AccountNotFound = 'ACCOUNT_NOT_FOUND',
  DeserializationFailed = 'DESERIALIZATION_FAILED',
  TransactionFailed = 'TRANSACTION_FAILED',
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  InvalidInput = 'INVALID_INPUT',
}

export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Parse Anchor program errors
 */
export function parseAnchorError(error: unknown): GameError {
  // Handle Anchor-specific errors
  if (error instanceof anchor.AnchorError) {
    const errorCode = error.error.errorCode;
    const errorMsg = error.error.errorMessage;

    // Map program errors to client errors
    switch (errorCode.code) {
      case 'InventoryFull':
        return new GameError(
          GameErrorCode.InvalidInput,
          'Cannot add item: inventory is full (max 10 items)'
        );
      case 'ItemNameTooLong':
        return new GameError(
          GameErrorCode.InvalidInput,
          'Item name must be 32 characters or less'
        );
      default:
        return new GameError(
          GameErrorCode.TransactionFailed,
          `Program error: ${errorMsg}`,
          error
        );
    }
  }

  // Handle SendTransactionError
  if (error instanceof SendTransactionError) {
    if (error.message.includes('insufficient funds')) {
      return new GameError(
        GameErrorCode.InsufficientFunds,
        'Not enough SOL to complete transaction'
      );
    }

    return new GameError(
      GameErrorCode.TransactionFailed,
      error.message,
      error
    );
  }

  // Generic error
  if (error instanceof Error) {
    return new GameError(
      GameErrorCode.TransactionFailed,
      error.message,
      error
    );
  }

  return new GameError(
    GameErrorCode.TransactionFailed,
    'Unknown error occurred'
  );
}

/**
 * Retry wrapper for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry non-transient errors
      if (error instanceof GameError) {
        if (error.code !== GameErrorCode.TransactionFailed) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

// Usage example
async function safeAddExperience(
  client: GameClient,
  playerAddress: PublicKey,
  amount: number
): Promise<string | null> {
  try {
    return await withRetry(() => client.addExperience(playerAddress, amount));
  } catch (error) {
    const gameError = parseAnchorError(error);

    switch (gameError.code) {
      case GameErrorCode.AccountNotFound:
        console.error('Player account does not exist');
        break;
      case GameErrorCode.InsufficientFunds:
        console.error('Please add more SOL to your wallet');
        break;
      default:
        console.error('Operation failed:', gameError.message);
    }

    return null;
  }
}
```

---

## Runtime Serialization Flow

Understanding how data flows between Rust and TypeScript:

### On-Chain (Rust) → Off-Chain (TypeScript)

```
┌─────────────────────┐
│  Rust Program       │
│  player.level = 5   │
│  player.xp = 1000   │
└──────────┬──────────┘
           │ Anchor serializes via BorshSerialize
           ▼
┌─────────────────────────────────────────────────┐
│  On-Chain Account Data                          │
│  [8-byte discriminator][borsh-serialized data]  │
│  [0x1a,0x2b,...][05,00,e8,03,00,00,00,00,...]  │
└──────────┬──────────────────────────────────────┘
           │ RPC fetches raw bytes
           ▼
┌─────────────────────┐
│  TypeScript Client  │
│  accountInfo.data   │
└──────────┬──────────┘
           │ Skip discriminator, deserialize with Borsh
           ▼
┌─────────────────────┐
│  TypeScript Object  │
│  { level: 5,        │
│    experience: 1000 │
│  }                  │
└─────────────────────┘
```

### Off-Chain (TypeScript) → On-Chain (Rust)

```
┌─────────────────────┐
│  TypeScript Client  │
│  addExperience(100) │
└──────────┬──────────┘
           │ Anchor serializes instruction data via IDL
           ▼
┌─────────────────────────────────────────────────┐
│  Transaction Instruction                         │
│  [program_id][accounts][serialized_data]        │
└──────────┬──────────────────────────────────────┘
           │ Transaction sent to Solana
           ▼
┌─────────────────────┐
│  Rust Program       │
│  fn add_experience  │
│    (amount: u64)    │
│  // amount = 100    │
└─────────────────────┘
```

---

## Best Practices

### 1. Always Handle Missing Accounts

```typescript
const player = await fetchPlayerAccount(connection, address);
if (!player) {
  console.log('Player not initialized yet');
  // Prompt user to initialize account
  return;
}
```

### 2. Use Batch Operations for Multiple Accounts

```typescript
// Good: Single RPC call for multiple accounts
const players = await fetchMultiplePlayers(connection, addresses);

// Avoid: Multiple sequential RPC calls
// for (const addr of addresses) {
//   const player = await fetchPlayerAccount(connection, addr);
// }
```

### 3. Handle Borsh Deserialization Errors

```typescript
try {
  const player = borsh.deserialize(PlayerAccountSchema, data);
} catch (error) {
  // Account data may have different format (wrong discriminator, old version)
  console.error('Failed to deserialize - account may be invalid or outdated');
}
```

### 4. Cleanup WebSocket Subscriptions

```typescript
// Always unsubscribe when component unmounts or user navigates away
useEffect(() => {
  const subscription = new PlayerSubscription(connection, address);
  subscription.subscribe(setPlayer);

  return () => {
    subscription.unsubscribe();
  };
}, [address]);
```

### 5. Use Exponential Backoff for Retries

```typescript
// Built into withRetry helper above
await withRetry(() => client.addExperience(address, amount), 3, 1000);
```

---

## See Also

- [Generated Code Reference](/api/generated-code) - Understanding generated output
- [Type System](/api/types) - LUMOS ↔ Rust ↔ TypeScript mappings
- [Error Handling Guide](/guides/error-handling) - Comprehensive error patterns
- [Borsh Internals](/guides/borsh-internals) - Deep dive into serialization
