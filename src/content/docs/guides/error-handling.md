---
title: Error Handling
description: Comprehensive patterns for handling errors in LUMOS-based Solana programs
---

Production Solana programs require robust error handling to prevent data corruption, fund lockups, and transaction failures. This guide shows you how to handle errors safely in both Rust and TypeScript.

**What You'll Learn:**
- ✅ **Rust Error Patterns** - Deserialization, validation, and custom errors
- ✅ **TypeScript Safety** - Type guards, safe deserialization, RPC error handling
- ✅ **Common Pitfalls** - How to avoid the most frequent mistakes
- ✅ **Production Patterns** - Battle-tested error handling strategies

---

## Rust Error Handling

### Deserialization Errors

Handle Borsh deserialization failures gracefully:

```rust
use anchor_lang::prelude::*;
use borsh::BorshDeserialize;

pub fn process_account(data: &[u8]) -> Result<PlayerAccount> {
    PlayerAccount::try_from_slice(data)
        .map_err(|e| {
            msg!("Failed to deserialize PlayerAccount: {}", e);
            error!(ErrorCode::DeserializationFailed)
        })
}

#[error_code]
pub enum ErrorCode {
    #[msg("Failed to deserialize account data")]
    DeserializationFailed,
}
```

**Why This Matters:**
- Prevents silent failures that corrupt data
- Provides clear error messages for debugging
- Allows client-side error handling

---

### Account Discriminator Validation

Always validate the account type before deserializing:

```rust
use anchor_lang::Discriminator;

pub fn validate_and_deserialize(data: &[u8]) -> Result<PlayerAccount> {
    // Check minimum length
    require!(
        data.len() >= 8,
        ErrorCode::AccountDataTooShort
    );

    // Check discriminator (first 8 bytes)
    let disc = &data[..8];

    require!(
        disc == PlayerAccount::DISCRIMINATOR,
        ErrorCode::InvalidAccountType
    );

    // Deserialize remaining data
    PlayerAccount::try_from_slice(&data[8..])
        .map_err(|_| error!(ErrorCode::DeserializationFailed))
}

#[error_code]
pub enum ErrorCode {
    #[msg("Account data is too short")]
    AccountDataTooShort,
    #[msg("Invalid account type - discriminator mismatch")]
    InvalidAccountType,
    #[msg("Failed to deserialize account data")]
    DeserializationFailed,
}
```

**Common Scenario:**
User passes wrong account address → program crashes without validation → transaction fails with unclear error.

**With Validation:**
Clear error message: "Invalid account type - expected PlayerAccount"

---

### Field Validation After Deserialization

Validate field values to prevent invalid state:

```rust
pub fn update_score(ctx: Context<UpdateScore>, amount: u64) -> Result<()> {
    let player = &mut ctx.accounts.player;

    // Validate input
    require!(
        amount > 0,
        ErrorCode::InvalidAmount
    );

    // Check for overflow
    let new_score = player.score
        .checked_add(amount)
        .ok_or(ErrorCode::ScoreOverflow)?;

    // Enforce business rules
    require!(
        new_score <= 1_000_000,
        ErrorCode::ScoreExceedsMaximum
    );

    player.score = new_score;

    msg!("Score updated: {} -> {}", player.score, new_score);
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Score overflow detected - operation would exceed u64::MAX")]
    ScoreOverflow,
    #[msg("Score exceeds maximum allowed value (1,000,000)")]
    ScoreExceedsMaximum,
}
```

**Best Practice:**
- Use `checked_add`, `checked_sub`, `checked_mul` to detect overflows
- Validate business rules explicitly with `require!`
- Provide descriptive error messages

---

### Type and Structure Validation

Validate complex structures after deserialization:

```rust
impl PlayerAccount {
    pub fn validate(&self) -> Result<()> {
        // Validate PublicKey is not default (all zeros)
        require!(
            self.wallet != Pubkey::default(),
            ErrorCode::InvalidPublicKey
        );

        // Validate String is non-empty and within limits
        require!(
            !self.name.is_empty() && self.name.len() <= 32,
            ErrorCode::InvalidNameLength
        );

        // Validate String is valid UTF-8 and printable
        require!(
            self.name.chars().all(|c| c.is_ascii_alphanumeric() || c == ' '),
            ErrorCode::InvalidNameCharacters
        );

        // Validate Vec is within size limits
        require!(
            self.inventory.len() <= 100,
            ErrorCode::InventoryTooLarge
        );

        // Validate nested fields
        for item in &self.inventory {
            require!(
                *item != Pubkey::default(),
                ErrorCode::InvalidInventoryItem
            );
        }

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid public key - cannot be default (all zeros)")]
    InvalidPublicKey,
    #[msg("Invalid name length - must be 1-32 characters")]
    InvalidNameLength,
    #[msg("Invalid name characters - only alphanumeric and spaces allowed")]
    InvalidNameCharacters,
    #[msg("Inventory too large - maximum 100 items")]
    InventoryTooLarge,
    #[msg("Invalid inventory item - cannot be default public key")]
    InvalidInventoryItem,
}
```

**Usage in Instructions:**

```rust
pub fn create_player(ctx: Context<CreatePlayer>, name: String) -> Result<()> {
    let player = &mut ctx.accounts.player;

    player.wallet = *ctx.accounts.user.key;
    player.name = name;
    player.level = 1;
    player.inventory = Vec::new();

    // Validate before saving
    player.validate()?;

    Ok(())
}
```

---

### Version Compatibility Checking

Handle schema version migrations safely:

```rust
#[account]
pub struct PlayerAccount {
    pub schema_version: u8,
    pub wallet: Pubkey,
    pub level: u16,
    pub experience: u64,
}

pub fn process_instruction(ctx: Context<ProcessPlayer>) -> Result<()> {
    let player = &ctx.accounts.player;

    match player.schema_version {
        1 => handle_v1_player(ctx),
        2 => handle_v2_player(ctx),
        _ => {
            msg!("Unsupported schema version: {}", player.schema_version);
            return Err(ErrorCode::UnsupportedSchemaVersion.into());
        }
    }
}

fn handle_v1_player(ctx: Context<ProcessPlayer>) -> Result<()> {
    // v1 logic
    Ok(())
}

fn handle_v2_player(ctx: Context<ProcessPlayer>) -> Result<()> {
    // v2 logic with new fields
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unsupported schema version - please migrate account")]
    UnsupportedSchemaVersion,
}
```

:::tip[Version Field Best Practice]
Always place `schema_version` as the **first field** in your struct. This ensures you can read it even if the schema changes.
:::

---

## TypeScript Error Handling

### Safe Deserialization

Always wrap deserialization in try-catch:

```typescript
import * as borsh from '@coral-xyz/borsh';
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';

function deserializePlayer(data: Buffer): PlayerAccount | null {
  try {
    // Skip 8-byte discriminator for Anchor accounts
    const accountData = data.slice(8);

    const player = borsh.deserialize(
      PlayerAccountBorshSchema,
      accountData
    ) as PlayerAccount;

    // Validate after deserialization
    if (!validatePlayer(player)) {
      console.error('Player validation failed');
      return null;
    }

    return player;
  } catch (error) {
    console.error('Deserialization failed:', error);

    // Log diagnostic information
    console.error('Data length:', data.length);
    console.error('Data hex:', data.toString('hex').slice(0, 100) + '...');

    return null;
  }
}
```

**Defensive Pattern:**
- Never throw errors in deserialization - return null instead
- Log diagnostic info for debugging
- Validate structure after deserialization

---

### Validation Before Serialization

Validate data before sending transactions:

```typescript
function validatePlayer(player: PlayerAccount): boolean {
  // Check required fields exist
  if (!player.wallet) {
    console.error('Missing wallet field');
    return false;
  }

  // Check PublicKey format (32 bytes)
  if (player.wallet.toBuffer().length !== 32) {
    console.error('Invalid wallet address - must be 32 bytes');
    return false;
  }

  // Check number ranges (JavaScript Number is 53-bit precision)
  if (player.score < 0 || player.score > Number.MAX_SAFE_INTEGER) {
    console.error('Score out of valid range');
    return false;
  }

  // Check string constraints
  if (!player.name || player.name.length === 0 || player.name.length > 32) {
    console.error('Invalid name length - must be 1-32 characters');
    return false;
  }

  // Check array constraints
  if (player.inventory.length > 100) {
    console.error('Inventory too large - maximum 100 items');
    return false;
  }

  return true;
}
```

---

### Type Guards for Enums

Safe enum handling with TypeScript type guards:

```typescript
type GameState =
  | { kind: 'Active'; startTime: number }
  | { kind: 'Paused'; pausedAt: number }
  | { kind: 'Finished'; finalScore: number };

// Type guard functions
function isActiveState(
  state: GameState
): state is Extract<GameState, { kind: 'Active' }> {
  return state.kind === 'Active';
}

function isPausedState(
  state: GameState
): state is Extract<GameState, { kind: 'Paused' }> {
  return state.kind === 'Paused';
}

function isFinishedState(
  state: GameState
): state is Extract<GameState, { kind: 'Finished' }> {
  return state.kind === 'Finished';
}

// Safe handling with type narrowing
function handleGameState(state: GameState) {
  if (isActiveState(state)) {
    // TypeScript knows state.startTime exists
    const elapsed = Date.now() - state.startTime;
    console.log(`Game active for ${elapsed}ms`);
  } else if (isPausedState(state)) {
    // TypeScript knows state.pausedAt exists
    console.log(`Game paused at ${state.pausedAt}`);
  } else if (isFinishedState(state)) {
    // TypeScript knows state.finalScore exists
    console.log(`Game finished with score: ${state.finalScore}`);
  } else {
    // Exhaustiveness check - shouldn't reach here
    const _exhaustive: never = state;
    throw new Error(`Unhandled game state: ${JSON.stringify(state)}`);
  }
}
```

**Benefit:**
TypeScript compiler ensures all enum variants are handled.

---

### Handling RPC Errors

Graceful error handling for Solana RPC calls:

```typescript
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';

async function fetchPlayerSafe(
  connection: Connection,
  address: PublicKey
): Promise<PlayerAccount | null> {
  try {
    const accountInfo = await connection.getAccountInfo(address);

    if (!accountInfo) {
      console.log(`Account not found: ${address.toBase58()}`);
      return null;
    }

    if (accountInfo.data.length < 8) {
      console.error('Account data too short - missing discriminator');
      return null;
    }

    return deserializePlayer(accountInfo.data);
  } catch (error) {
    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        console.error('RPC rate limit exceeded - retry with backoff');
      } else if (error.message.includes('timeout')) {
        console.error('RPC timeout - try different endpoint');
      } else {
        console.error('RPC error:', error.message);
      }
    }

    return null;
  }
}
```

**Retry with Exponential Backoff:**

```typescript
async function fetchPlayerWithRetry(
  connection: Connection,
  address: PublicKey,
  maxRetries = 3
): Promise<PlayerAccount | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchPlayerSafe(connection, address);
    } catch (error) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`Failed after ${maxRetries} attempts`);
  return null;
}
```

---

### Handling Large Numbers (u64/u128)

JavaScript `number` type is limited to 53-bit precision. Use `BigInt` for u64/u128:

```typescript
interface TokenVault {
  balance: bigint; // u128 in Rust
  lastUpdate: bigint; // u64 in Rust
}

// Safe comparison
if (vault.balance > BigInt('1000000000')) {
  console.log('Balance exceeds 1 billion');
}

// Safe arithmetic
const newBalance = vault.balance + BigInt(500);

// Formatting for display
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;

  return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
}

// Example: 1,234,567,890 lamports with 9 decimals
console.log(formatBalance(BigInt('1234567890'), 9)); // "1.234567890"
```

:::caution[Number Precision Loss]
Never use `number` for u64 values > 2^53-1 (9,007,199,254,740,991). Always use `bigint` for token amounts and timestamps.
:::

---

## Common Errors Reference

### Rust Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to deserialize account data` | Data format doesn't match schema | Verify discriminator, check schema version |
| `AccountNotInitialized` | Trying to use uninitialized account | Check `init` constraint in Anchor |
| `AccountOwnedByWrongProgram` | Account owned by different program | Verify account address is correct |
| `ConstraintRaw` | `require!` or `require_keys_eq!` failed | Check constraint logic and error message |
| `Integer overflow` | Arithmetic operation exceeded max value | Use `checked_add`, `checked_mul` |

---

### TypeScript Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to deserialize account data` | Data format doesn't match schema | Ensure schema matches on-chain data |
| `Number precision lost` | u64/u128 exceeds JavaScript Number range | Use `BigInt` instead of `number` |
| `Invalid PublicKey` | Bad base58 string or wrong length | Validate before constructing PublicKey |
| `429 Too Many Requests` | RPC rate limit exceeded | Implement retry with backoff |
| `Account not found` | Invalid address or account doesn't exist | Check address spelling, verify on explorer |

---

### Deserialization Errors

**Error:** "Failed to deserialize account data"

**Causes:**
1. Schema version mismatch (client using old schema)
2. Account discriminator doesn't match
3. Account data corrupted or truncated
4. Wrong account type passed

**Debug Steps:**

```typescript
// 1. Check account exists
const account = await connection.getAccountInfo(address);
if (!account) {
  console.log('Account not found');
}

// 2. Check data length
console.log('Data length:', account.data.length);

// 3. Check discriminator
const discriminator = account.data.slice(0, 8);
console.log('Discriminator:', discriminator.toString('hex'));

// 4. Try deserializing without discriminator
const withoutDisc = account.data.slice(8);
const player = borsh.deserialize(PlayerAccountBorshSchema, withoutDisc);
```

**Rust Debug:**

```rust
pub fn debug_account(data: &[u8]) {
    msg!("Account data length: {}", data.len());
    msg!("Discriminator: {:?}", &data[..8]);

    // Try deserializing
    match PlayerAccount::try_from_slice(&data[8..]) {
        Ok(player) => msg!("Deserialized successfully: {:?}", player),
        Err(e) => msg!("Deserialization error: {}", e),
    }
}
```

---

### Circular Dependency Errors

**Error:** "Circular dependency detected"

**Cause:** Type A references B, B references A

```rust
// ❌ Circular dependency
struct Player {
    guild: Guild,
}

struct Guild {
    leader: Player, // Infinite recursion!
}
```

**Solution:** Use PublicKey references instead

```rust
// ✅ Use Pubkey references
struct Player {
    guild_address: Pubkey,
}

struct Guild {
    leader_address: Pubkey,
}
```

---

## Production Error Handling Checklist

Before deploying to mainnet:

### Rust Program Checklist

- [ ] All deserialization wrapped in error handlers
- [ ] Account discriminators validated
- [ ] Field values validated after deserialization
- [ ] Integer overflow protection (`checked_*` operations)
- [ ] Business rules enforced with `require!`
- [ ] Custom error codes defined with descriptive messages
- [ ] Schema version field included (if using migrations)
- [ ] Validation functions tested with edge cases

### TypeScript Client Checklist

- [ ] All RPC calls wrapped in try-catch
- [ ] Deserialization errors handled gracefully
- [ ] Large numbers use `BigInt` (u64/u128)
- [ ] PublicKey validation before construction
- [ ] Retry logic for rate limits
- [ ] Type guards for enum variants
- [ ] Input validation before transactions
- [ ] Error messages logged for debugging

---

## Next Steps

- 📖 [Debugging Guide](/guides/debugging) - Techniques for debugging LUMOS schemas
- 📖 [Schema Versioning](/guides/versioning) - Handle breaking changes safely
- 📖 [Schema Migrations](/guides/schema-migrations) - Migration patterns for production
- 📖 [CLI Commands](/api/cli-commands) - Validate schemas during development

---

**Remember:** Good error handling is the difference between a production-ready program and a security vulnerability. Always validate, always handle errors, never assume data is correct.
