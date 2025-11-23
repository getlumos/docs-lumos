---
title: Debugging
description: Comprehensive techniques for debugging LUMOS schemas and generated code
---

Debugging serialization issues, schema mismatches, and on-chain data problems can be challenging. This guide provides systematic approaches to identify and fix common issues in LUMOS-based Solana programs.

**What You'll Learn:**
- ✅ **Schema Validation** - Catch errors before deployment
- ✅ **Binary Data Inspection** - Understand what's actually on-chain
- ✅ **Deserialization Debugging** - Fix data format mismatches
- ✅ **Performance Profiling** - Identify bottlenecks
- ✅ **Testing Strategies** - Verify correctness at every stage

---

## Schema Validation

### Validate Syntax Before Generation

Always validate your schema before generating code:

```bash
lumos validate schema.lumos
```

**Output (valid schema):**
```
✓ Schema is valid
Exit code: 0
```

**Output (syntax error):**
```
Error: Failed to parse schema
  --> schema.lumos:5:12
  |
5 |     level u16,
  |          ^ expected ':'
Exit code: 1
```

**Common Syntax Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `expected ':'` | Missing colon after field name | `level: u16` |
| `unexpected token` | Invalid syntax | Check LUMOS syntax rules |
| `undefined type` | Type not defined in schema | Define type or check spelling |
| `circular dependency` | Type A → B → A | Use `PublicKey` references |

---

### View Generated Code

Inspect generated code to understand how LUMOS translates your schema:

```bash
# Generate code
lumos generate schema.lumos

# View Rust output
cat generated.rs

# View TypeScript output
cat generated.ts
```

**Check for:**
- Correct field order (must match schema declaration order)
- Proper Anchor attributes (`#[account]`, `#[derive(...)]`)
- Correct Borsh schema definitions
- Type mappings (u64 → number vs bigint)

**Example Comparison:**

```rust
// schema.lumos
struct Player {
    wallet: PublicKey,
    level: u16,
    score: u64,
}
```

```rust
// generated.rs - Verify this matches
pub struct Player {
    pub wallet: Pubkey,    // ✓ First field
    pub level: u16,        // ✓ Second field
    pub score: u64,        // ✓ Third field
}
```

```typescript
// generated.ts - Verify field order matches
export const PlayerBorshSchema = borsh.struct([
  borsh.publicKey('wallet'),  // ✓ First field
  borsh.u16('level'),         // ✓ Second field
  borsh.u64('score'),         // ✓ Third field
]);
```

---

## Deserialization Debugging

### Rust: Print Binary Data

When deserialization fails, inspect the raw bytes:

```rust
use hex;

pub fn debug_account_data(data: &[u8]) {
    msg!("=== ACCOUNT DATA DEBUG ===");
    msg!("Total length: {} bytes", data.len());

    // Print discriminator (first 8 bytes for Anchor accounts)
    if data.len() >= 8 {
        msg!("Discriminator (hex): {}", hex::encode(&data[..8]));
    }

    // Print full data (truncated for long accounts)
    let preview_len = std::cmp::min(data.len(), 64);
    msg!("Data preview (hex): {}", hex::encode(&data[..preview_len]));

    // Print as chunks for readability
    msg!("=== BYTE BREAKDOWN ===");
    for (i, chunk) in data.chunks(32).enumerate() {
        msg!("Bytes {}-{}: {}",
             i * 32,
             i * 32 + chunk.len() - 1,
             hex::encode(chunk)
        );
    }
}
```

**Usage in Instructions:**

```rust
pub fn diagnostic_instruction(ctx: Context<Diagnostic>) -> Result<()> {
    let account = ctx.accounts.player.to_account_info();
    let data = account.try_borrow_data()?;

    debug_account_data(&data);

    Ok(())
}
```

---

### TypeScript: Inspect Binary Data

```typescript
function debugAccountData(data: Buffer) {
  console.log('=== ACCOUNT DATA DEBUG ===');
  console.log('Total length:', data.length, 'bytes');

  // Print discriminator
  if (data.length >= 8) {
    const discriminator = data.slice(0, 8);
    console.log('Discriminator (hex):', discriminator.toString('hex'));
    console.log('Discriminator (decimal):', Array.from(discriminator));
  }

  // Print full hex dump
  console.log('Full data (hex):', data.toString('hex'));

  // Print as chunks for readability
  console.log('=== BYTE BREAKDOWN ===');
  const chunkSize = 32;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
    console.log(`Bytes ${i}-${i + chunk.length - 1}:`, chunk.toString('hex'));
  }

  // Try parsing as ASCII
  console.log('=== ASCII PREVIEW (if printable) ===');
  const ascii = data.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
  console.log(ascii.slice(0, 100));
}
```

**Usage:**

```typescript
const accountInfo = await connection.getAccountInfo(playerAddress);
if (accountInfo) {
  debugAccountData(accountInfo.data);
}
```

---

### Compare Expected vs Actual Binary Layout

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_account_size() {
        // Calculate expected size
        let expected_size =
            32 +  // wallet: Pubkey
            2 +   // level: u16
            8;    // score: u64
        // Total: 42 bytes (without discriminator)

        // Create test instance
        let player = PlayerAccount {
            wallet: Pubkey::default(),
            level: 1,
            score: 100,
        };

        // Serialize
        let serialized = player.try_to_vec().unwrap();

        println!("Expected size: {} bytes", expected_size);
        println!("Actual size: {} bytes", serialized.len());
        println!("Serialized (hex): {}", hex::encode(&serialized));

        assert_eq!(serialized.len(), expected_size);
    }

    #[test]
    fn test_field_offsets() {
        let player = PlayerAccount {
            wallet: Pubkey::new_unique(),
            level: 10,
            score: 1000,
        };

        let bytes = player.try_to_vec().unwrap();

        // Verify field offsets
        // wallet: bytes 0-31 (32 bytes)
        // level: bytes 32-33 (2 bytes, little-endian)
        // score: bytes 34-41 (8 bytes, little-endian)

        let level_bytes = &bytes[32..34];
        let level = u16::from_le_bytes(level_bytes.try_into().unwrap());
        assert_eq!(level, 10);

        let score_bytes = &bytes[34..42];
        let score = u64::from_le_bytes(score_bytes.try_into().unwrap());
        assert_eq!(score, 1000);

        println!("✓ Field offsets correct");
    }
}
```

---

### Round-Trip Testing

Verify data survives serialization → deserialization:

```rust
#[test]
fn test_roundtrip_serialization() {
    let original = PlayerAccount {
        wallet: Pubkey::new_unique(),
        level: 50,
        score: 123456,
    };

    // Serialize
    let bytes = original.try_to_vec().unwrap();
    println!("Serialized: {} bytes", bytes.len());

    // Deserialize
    let deserialized = PlayerAccount::try_from_slice(&bytes).unwrap();

    // Compare
    assert_eq!(original.wallet, deserialized.wallet);
    assert_eq!(original.level, deserialized.level);
    assert_eq!(original.score, deserialized.score);

    println!("✓ Round-trip successful");
}
```

**TypeScript Round-Trip:**

```typescript
import * as borsh from '@coral-xyz/borsh';
import { PlayerAccount, PlayerAccountBorshSchema } from './generated';

function testRoundTrip() {
  const original: PlayerAccount = {
    wallet: new PublicKey('11111111111111111111111111111111'),
    level: 50,
    score: 123456,
  };

  // Serialize
  const bytes = borsh.serialize(PlayerAccountBorshSchema, original);
  console.log('Serialized:', bytes.length, 'bytes');
  console.log('Hex:', Buffer.from(bytes).toString('hex'));

  // Deserialize
  const deserialized = borsh.deserialize(
    PlayerAccountBorshSchema,
    bytes
  ) as PlayerAccount;

  // Compare
  console.assert(deserialized.wallet.equals(original.wallet), 'wallet mismatch');
  console.assert(deserialized.level === original.level, 'level mismatch');
  console.assert(deserialized.score === original.score, 'score mismatch');

  console.log('✓ Round-trip successful');
}
```

---

## Performance Debugging

### Measure Serialization Time

```rust
use std::time::Instant;

pub fn benchmark_serialization() {
    let player = PlayerAccount {
        wallet: Pubkey::new_unique(),
        level: 10,
        score: 1000,
    };

    // Warm-up
    for _ in 0..100 {
        let _ = player.try_to_vec().unwrap();
    }

    // Benchmark
    let iterations = 10_000;
    let start = Instant::now();

    for _ in 0..iterations {
        let _ = player.try_to_vec().unwrap();
    }

    let elapsed = start.elapsed();
    let avg_nanos = elapsed.as_nanos() / iterations;

    msg!("Serialization benchmark:");
    msg!("  Iterations: {}", iterations);
    msg!("  Total time: {:?}", elapsed);
    msg!("  Average: {} ns per operation", avg_nanos);
}
```

**Performance Baselines:**

| Account Size | Expected Time |
|--------------|---------------|
| < 100 bytes | < 1 µs |
| 100-1000 bytes | 1-10 µs |
| 1-10 KB | 10-100 µs |
| > 10 KB | Consider restructuring |

---

### Account Size Analysis

Calculate exact account sizes:

```rust
pub fn analyze_account_size() {
    msg!("=== ACCOUNT SIZE ANALYSIS ===");

    // Fixed-size fields
    let wallet_size = std::mem::size_of::<Pubkey>();
    let level_size = std::mem::size_of::<u16>();
    let score_size = std::mem::size_of::<u64>();

    msg!("Fixed fields:");
    msg!("  wallet (Pubkey): {} bytes", wallet_size);
    msg!("  level (u16): {} bytes", level_size);
    msg!("  score (u64): {} bytes", score_size);

    let fixed_total = wallet_size + level_size + score_size;
    msg!("  Fixed total: {} bytes", fixed_total);

    // Account with variable-size fields
    let player = PlayerAccount {
        wallet: Pubkey::new_unique(),
        level: 10,
        score: 1000,
    };

    let actual_size = player.try_to_vec().unwrap().len();
    msg!("Actual serialized size: {} bytes", actual_size);

    // Anchor discriminator (8 bytes)
    let with_discriminator = 8 + actual_size;
    msg!("With discriminator: {} bytes", with_discriminator);

    // Rent calculation
    let rent_lamports = Rent::default().minimum_balance(with_discriminator);
    msg!("Minimum rent: {} lamports", rent_lamports);
}
```

**TypeScript Size Calculator:**

```typescript
function calculateAccountSize(account: PlayerAccount): number {
  // Fixed-size fields
  const walletSize = 32; // PublicKey
  const levelSize = 2;   // u16
  const scoreSize = 8;   // u64

  // Variable-size fields
  const nameSize = 4 + Buffer.byteLength(account.name || '', 'utf-8'); // length prefix + UTF-8 bytes

  // Vec<T> = 4-byte length + (element size * count)
  const inventorySize = 4 + (account.inventory?.length || 0) * 32;

  const totalSize = walletSize + levelSize + scoreSize + nameSize + inventorySize;
  const withDiscriminator = 8 + totalSize; // Anchor discriminator

  console.log('Account size breakdown:');
  console.log('  wallet:', walletSize, 'bytes');
  console.log('  level:', levelSize, 'bytes');
  console.log('  score:', scoreSize, 'bytes');
  console.log('  name:', nameSize, 'bytes');
  console.log('  inventory:', inventorySize, 'bytes');
  console.log('  Total (without disc):', totalSize, 'bytes');
  console.log('  Total (with disc):', withDiscriminator, 'bytes');

  return withDiscriminator;
}
```

---

### Identify Performance Bottlenecks

```rust
pub fn profile_instruction(ctx: Context<ProcessPlayer>) -> Result<()> {
    let total_start = Instant::now();

    // Step 1: Deserialization
    let deser_start = Instant::now();
    let player = &mut ctx.accounts.player;
    msg!("Deserialization: {:?}", deser_start.elapsed());

    // Step 2: Validation
    let valid_start = Instant::now();
    player.validate()?;
    msg!("Validation: {:?}", valid_start.elapsed());

    // Step 3: Business logic
    let logic_start = Instant::now();
    player.score += 100;
    msg!("Business logic: {:?}", logic_start.elapsed());

    // Step 4: Serialization (automatic on return)
    msg!("Total instruction time: {:?}", total_start.elapsed());

    Ok(())
}
```

**Optimization Targets:**
- Deserialization > 10µs → Check for deeply nested structures
- Validation > 5µs → Reduce validation complexity
- Business logic > 50µs → Optimize algorithm

---

## Common Issues & Solutions

### Issue: Generated Code Doesn't Compile

**Debug Steps:**

1. **Check LUMOS CLI version:**
   ```bash
   lumos --version
   ```

2. **Validate schema:**
   ```bash
   lumos validate schema.lumos
   ```

3. **Regenerate with verbose output:**
   ```bash
   lumos generate schema.lumos --verbose
   ```

4. **Check Rust/TS dependencies match generated code:**
   ```toml
   # Cargo.toml
   [dependencies]
   anchor-lang = "0.29.0"  # Must match generated imports
   borsh = "0.10.3"
   ```

   ```json
   // package.json
   {
     "dependencies": {
       "@coral-xyz/borsh": "^0.29.0",
       "@solana/web3.js": "^1.87.0"
     }
   }
   ```

---

### Issue: Deserialization Fails in Tests

**Debug Steps:**

1. **Print hex data:**
   ```rust
   println!("Data: {}", hex::encode(&data));
   ```

2. **Check discriminator:**
   ```rust
   let disc = &data[..8];
   println!("Expected: {:?}", PlayerAccount::DISCRIMINATOR);
   println!("Actual: {:?}", disc);
   ```

3. **Try deserializing without discriminator:**
   ```rust
   let account = PlayerAccount::try_from_slice(&data[8..])?;
   ```

4. **Verify Borsh version consistency:**
   - Rust program: `borsh = "0.10.3"`
   - TypeScript client: `@coral-xyz/borsh = "^0.29.0"`

---

### Issue: Type Mismatch Between Rust and TypeScript

**Debug Steps:**

1. **Regenerate both files from same schema:**
   ```bash
   lumos generate schema.lumos --force
   ```

2. **Check field order matches:**
   ```typescript
   // Compare Borsh schema field order
   console.log(Object.keys(PlayerAccountBorshSchema.struct));
   ```

3. **Verify type mappings:**
   ```typescript
   // u64 should be number (< 2^53-1) or bigint (>= 2^53-1)
   // u128 must always be bigint
   // PublicKey is 32-byte buffer
   ```

4. **Test serialization compatibility:**
   ```rust
   // Serialize in Rust
   let bytes = account.try_to_vec()?;

   // Deserialize in TypeScript (copy bytes to test)
   const account = borsh.deserialize(schema, bytes);
   ```

---

## Testing Strategies

### Unit Tests for Schemas

```rust
#[cfg(test)]
mod schema_tests {
    use super::*;

    #[test]
    fn test_player_account_size() {
        let player = PlayerAccount::default();
        let size = player.try_to_vec().unwrap().len();
        assert!(size > 0, "Serialized size must be positive");
        println!("PlayerAccount size: {} bytes", size);
    }

    #[test]
    fn test_default_values() {
        let player = PlayerAccount::default();
        assert_eq!(player.level, 0);
        assert_eq!(player.score, 0);
    }

    #[test]
    fn test_invalid_data_rejection() {
        let invalid_data = vec![0u8; 10]; // Too short
        let result = PlayerAccount::try_from_slice(&invalid_data);
        assert!(result.is_err(), "Should reject invalid data");
    }
}
```

---

### Integration Tests with Actual Serialization

```typescript
import { describe, it, expect } from 'vitest';

describe('PlayerAccount Serialization', () => {
  it('should serialize and deserialize correctly', () => {
    const original: PlayerAccount = {
      wallet: new PublicKey('11111111111111111111111111111111'),
      level: 42,
      score: 999999,
    };

    const bytes = borsh.serialize(PlayerAccountBorshSchema, original);
    const deserialized = borsh.deserialize(
      PlayerAccountBorshSchema,
      bytes
    ) as PlayerAccount;

    expect(deserialized.wallet.equals(original.wallet)).toBe(true);
    expect(deserialized.level).toBe(original.level);
    expect(deserialized.score).toBe(original.score);
  });

  it('should handle optional fields correctly', () => {
    const withOptional: PlayerAccount = {
      wallet: new PublicKey('11111111111111111111111111111111'),
      level: 10,
      score: 100,
      nickname: 'TestPlayer',
    };

    const bytes = borsh.serialize(PlayerAccountBorshSchema, withOptional);
    const deserialized = borsh.deserialize(PlayerAccountBorshSchema, bytes) as PlayerAccount;

    expect(deserialized.nickname).toBe('TestPlayer');
  });

  it('should handle missing optional fields', () => {
    const withoutOptional: PlayerAccount = {
      wallet: new PublicKey('11111111111111111111111111111111'),
      level: 10,
      score: 100,
    };

    const bytes = borsh.serialize(PlayerAccountBorshSchema, withoutOptional);
    const deserialized = borsh.deserialize(PlayerAccountBorshSchema, bytes) as PlayerAccount;

    expect(deserialized.nickname).toBeUndefined();
  });
});
```

---

## Debugging Checklist

Before reporting a bug:

- [ ] Validated schema with `lumos validate`
- [ ] Regenerated code with latest LUMOS CLI
- [ ] Checked Borsh version consistency (Rust & TS)
- [ ] Inspected binary data with hex dumps
- [ ] Verified discriminator matches (Anchor accounts)
- [ ] Tested round-trip serialization
- [ ] Checked field order matches schema
- [ ] Validated large numbers use BigInt
- [ ] Tested with minimal example
- [ ] Reviewed error messages carefully

---

## Next Steps

- 📖 [Error Handling](/guides/error-handling) - Comprehensive error handling patterns
- 📖 [Schema Versioning](/guides/versioning) - Handle breaking changes
- 📖 [CLI Commands](/api/cli-commands) - Full CLI reference
- 📖 [Generated Code](/api/generated-code) - Understanding output

---

**Remember:** Debugging is systematic investigation. Use print statements, inspect binary data, compare expected vs actual, and test incrementally. Most issues are schema mismatches or version inconsistencies.
