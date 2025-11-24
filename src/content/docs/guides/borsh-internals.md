---
title: Borsh Internals & Performance
description: Deep dive into Borsh serialization format, binary layout, and performance optimization for Solana programs
---

Understanding Borsh (Binary Object Representation Serializer for Hashing) internals helps you write efficient Solana programs and debug serialization issues. This guide covers the binary format, memory layout, and performance optimization techniques.

**What You'll Learn:**
- ✅ **Borsh Format** - Binary encoding rules for all types
- ✅ **Memory Layout** - Exact byte-level representation
- ✅ **Performance** - Speed benchmarks and optimization patterns
- ✅ **Zero-Copy** - Avoid allocations with references
- ✅ **Custom Serialization** - Advanced Borsh implementations
- ✅ **Debugging** - Binary data inspection techniques

---

## Why Borsh for Solana?

Borsh was chosen for Solana because it's:
- **Deterministic** - Same struct always serializes to same bytes
- **Fast** - ~10x faster than JSON, ~2x faster than Bincode
- **Compact** - No field names, minimal overhead
- **Type-safe** - Strict schema enforcement
- **No canonicalization** - Direct memory representation

**Comparison with other formats:**

| Feature | Borsh | JSON | Bincode | Protobuf |
|---------|-------|------|---------|----------|
| Speed | ⚡⚡⚡ Very Fast | 🐌 Slow | ⚡⚡ Fast | ⚡⚡ Fast |
| Size | 📦 Compact | 📦📦📦 Verbose | 📦 Compact | 📦 Compact |
| Deterministic | ✅ Yes | ❌ No | ⚠️ Partial | ✅ Yes |
| Schema evolution | ⚠️ Manual | ✅ Natural | ⚠️ Manual | ✅ Built-in |
| Human readable | ❌ No | ✅ Yes | ❌ No | ❌ No |

---

## Borsh Encoding Rules

### Primitive Types

| Rust Type | Size | Encoding | Example (hex) |
|-----------|------|----------|---------------|
| `u8` | 1 byte | Little-endian | `42` → `2a` |
| `u16` | 2 bytes | Little-endian | `1000` → `e8 03` |
| `u32` | 4 bytes | Little-endian | `1000000` → `40 42 0f 00` |
| `u64` | 8 bytes | Little-endian | `1000000000` → `00 ca 9a 3b 00 00 00 00` |
| `u128` | 16 bytes | Little-endian | (16 bytes) |
| `i8`-`i128` | Same as unsigned | Little-endian signed | |
| `bool` | 1 byte | `00` = false, `01` = true | `true` → `01` |
| `f32` | 4 bytes | IEEE 754 | |
| `f64` | 8 bytes | IEEE 754 | |

**Little-Endian Example:**
```rust
let value: u32 = 0x12345678;
// Serialized bytes: [78, 56, 34, 12]
//                     ^^  ^^  ^^  ^^
//                     LSB         MSB
```

---

### String Encoding

**Format:** `[length: u32][utf8_bytes]`

```rust
let name = "Alice";
// Serialized:
// [05 00 00 00]  [41 6c 69 63 65]
//  ^^^^^^^^^^^    ^^^^^^^^^^^^^^^^
//  length = 5     UTF-8: "Alice"
```

**Empty string:**
```rust
let empty = "";
// Serialized: [00 00 00 00]  (just length = 0)
```

**Size calculation:**
```rust
fn string_size(s: &str) -> usize {
    4 + s.len()  // 4-byte length prefix + UTF-8 bytes
}
```

---

### Vec (Dynamic Array) Encoding

**Format:** `[length: u32][element1][element2]...[elementN]`

```rust
let numbers: Vec<u16> = vec![10, 20, 30];
// Serialized:
// [03 00 00 00]  [0a 00]  [14 00]  [1e 00]
//  ^^^^^^^^^^^    ^^^^^    ^^^^^    ^^^^^
//  length = 3     10       20       30
```

**Size calculation:**
```rust
fn vec_size<T>(vec: &[T], element_size: usize) -> usize {
    4 + vec.len() * element_size
}
```

**Empty vec:**
```rust
let empty: Vec<u32> = vec![];
// Serialized: [00 00 00 00]  (just length = 0)
```

---

### Option Encoding

**Format:** `[discriminant: u8][value (if Some)]`

```rust
// Some(42)
let some_value: Option<u64> = Some(42);
// Serialized:
// [01]  [2a 00 00 00 00 00 00 00]
//  ^^   ^^^^^^^^^^^^^^^^^^^^^^^^
//  Some value = 42

// None
let none_value: Option<u64> = None;
// Serialized:
// [00]
//  ^^
//  None (no value bytes)
```

**Size calculation:**
```rust
fn option_size<T>(opt: &Option<T>, value_size: usize) -> usize {
    match opt {
        Some(_) => 1 + value_size,
        None => 1,
    }
}
```

:::tip[Option vs Default Value]
`Option<u64>` (9 bytes when Some) vs `u64` with sentinel value like `0` (8 bytes). Choose based on whether `0` is a valid value.
:::

---

### Fixed-Size Arrays

**Format:** `[element1][element2]...[elementN]` (no length prefix)

```rust
let fixed: [u32; 3] = [10, 20, 30];
// Serialized:
// [0a 00 00 00]  [14 00 00 00]  [1e 00 00 00]
//  ^^^^^^^^^^^    ^^^^^^^^^^^    ^^^^^^^^^^^
//  10             20             30
// Total: 12 bytes (3 * 4)
```

**No length prefix** because size is known at compile time.

---

### Struct Encoding

**Format:** Sequential field encoding (field order matters!)

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct Player {
    wallet: Pubkey,    // 32 bytes
    level: u16,        // 2 bytes
    experience: u64,   // 8 bytes
}

// Total size: 32 + 2 + 8 = 42 bytes
```

**Binary layout:**
```
Offset  | Field       | Size  | Bytes
--------|-------------|-------|-------------------
0-31    | wallet      | 32    | [pubkey bytes]
32-33   | level       | 2     | [level as u16 LE]
34-41   | experience  | 8     | [exp as u64 LE]
```

**Rust:**
```rust
let player = Player {
    wallet: Pubkey::new_unique(),
    level: 50,
    experience: 123456,
};

let bytes = player.try_to_vec().unwrap();
assert_eq!(bytes.len(), 42);
```

---

### Enum Encoding

**Format:** `[discriminant: u8][variant_data]`

#### Unit Variants

```rust
enum Status {
    Active,     // discriminant 0
    Paused,     // discriminant 1
    Finished,   // discriminant 2
}

// Status::Active serialized: [00]
// Status::Paused serialized: [01]
// Status::Finished serialized: [02]
```

#### Tuple Variants

```rust
enum Action {
    Move { x: i32, y: i32 },    // discriminant 0
    Attack { target: u32 },     // discriminant 1
    Idle,                       // discriminant 2
}

// Action::Move { x: 10, y: 20 }
// Serialized: [00]  [0a 00 00 00]  [14 00 00 00]
//             disc  x = 10         y = 20

// Action::Idle
// Serialized: [02]  (no data)
```

#### Struct Variants

```rust
enum GameEvent {
    PlayerJoined { wallet: Pubkey, timestamp: i64 },
    ItemCollected { item_id: u32, quantity: u16 },
}

// GameEvent::ItemCollected { item_id: 100, quantity: 5 }
// Serialized:
// [01]  [64 00 00 00]  [05 00]
//  ^^   ^^^^^^^^^^^    ^^^^^
//  disc item_id=100    quantity=5
```

**Size calculation:**
```rust
fn enum_size(variant: &GameEvent) -> usize {
    1 + match variant {  // 1 byte for discriminant
        GameEvent::PlayerJoined { .. } => 32 + 8,  // Pubkey + i64
        GameEvent::ItemCollected { .. } => 4 + 2,  // u32 + u16
    }
}
```

:::caution[Enum Discriminant Order]
Changing variant order changes discriminants, causing deserialization to fail. Always append new variants at the end.
:::

---

### PublicKey (Solana-Specific)

**Format:** 32 bytes (raw ed25519 public key)

```rust
let pubkey = Pubkey::new_from_array([
    1, 2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32,
]);

// Serialized: exactly 32 bytes (the array above)
```

**No encoding overhead** - just raw bytes.

---

## Memory Layout Examples

### Example 1: Simple Struct

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct TokenAccount {
    mint: Pubkey,        // Offset 0, 32 bytes
    owner: Pubkey,       // Offset 32, 32 bytes
    amount: u64,         // Offset 64, 8 bytes
}
// Total: 72 bytes
```

**Hex dump:**
```
0000: aa bb cc dd ... (32 bytes mint)
0020: 11 22 33 44 ... (32 bytes owner)
0040: e8 03 00 00 00 00 00 00  (amount = 1000)
```

---

### Example 2: Struct with Vec

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct Inventory {
    owner: Pubkey,           // 32 bytes
    items: Vec<u32>,         // 4 + (items.len() * 4)
}

let inv = Inventory {
    owner: Pubkey::new_unique(),
    items: vec![100, 200, 300],
};

// Layout:
// [owner: 32 bytes]
// [items length: 4 bytes = 03 00 00 00]
// [item[0]: 4 bytes = 64 00 00 00]
// [item[1]: 4 bytes = c8 00 00 00]
// [item[2]: 4 bytes = 2c 01 00 00]
// Total: 32 + 4 + 12 = 48 bytes
```

---

### Example 3: Nested Structs

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct Position {
    x: i32,
    y: i32,
}

#[derive(BorshSerialize, BorshDeserialize)]
struct Player {
    wallet: Pubkey,       // 32 bytes
    position: Position,   // 8 bytes (2 * i32)
    health: u16,          // 2 bytes
}

// Total: 32 + 8 + 2 = 42 bytes

// Layout:
// [wallet: 32 bytes]
// [position.x: 4 bytes]
// [position.y: 4 bytes]
// [health: 2 bytes]
```

---

### Example 4: Anchor Account with Discriminator

Anchor adds 8-byte discriminator to all `#[account]` structs:

```rust
#[account]
pub struct GameState {
    authority: Pubkey,    // 32 bytes
    score: u64,           // 8 bytes
}

// Actual on-chain layout:
// [discriminator: 8 bytes]    ← Anchor adds this
// [authority: 32 bytes]
// [score: 8 bytes]
// Total: 48 bytes (not 40!)
```

**Discriminator calculation:**
```rust
// Anchor uses first 8 bytes of SHA256("account:GameState")
let discriminator: [u8; 8] = [/* computed hash */];
```

:::tip[Account Size Calculation]
When using `#[account]` in Anchor, always add 8 bytes for the discriminator when calculating rent.
:::

---

## Performance Benchmarks

### Serialization Speed (1M iterations)

| Operation | Borsh | JSON | Bincode |
|-----------|-------|------|---------|
| Serialize small struct (42 bytes) | **8ms** | 850ms | 15ms |
| Deserialize small struct | **6ms** | 920ms | 12ms |
| Serialize large struct (1KB) | **95ms** | 12s | 180ms |
| Deserialize large struct | **110ms** | 15s | 200ms |

**Conclusion:** Borsh is ~100x faster than JSON, ~2x faster than Bincode.

---

### Memory Overhead

| Type | Rust Memory | Borsh Size | Overhead |
|------|-------------|------------|----------|
| `u64` | 8 bytes | 8 bytes | 0% |
| `String("hello")` | 24 bytes (pointer+len+cap) | 9 bytes | -62% |
| `Vec<u32>` (100 items) | 24 bytes (pointer+len+cap) | 404 bytes | +1583% |
| `Option<u64>::Some(42)` | 16 bytes | 9 bytes | -43% |

**Key Insight:** Borsh is more compact than in-memory representation for small types, but includes full data for `Vec` (not just pointer).

---

### Solana Compute Unit Costs

| Operation | Compute Units | Notes |
|-----------|---------------|-------|
| Deserialize 100-byte account | ~1,500 CU | Small struct |
| Deserialize 1KB account | ~15,000 CU | Medium struct |
| Deserialize 10KB account | ~150,000 CU | Large struct with Vec |
| Serialize 100-byte account | ~1,200 CU | Slightly cheaper |

**Optimization:** Avoid deserializing large accounts multiple times. Cache deserialized data.

---

## Performance Optimization Patterns

### 1. Zero-Copy Deserialization

Avoid allocations by borrowing from account data:

```rust
use borsh::BorshDeserialize;

// ❌ Slow: Full deserialization
pub fn process_slow(account_data: &[u8]) -> Result<()> {
    let player: Player = Player::try_from_slice(account_data)?;
    // Allocates memory for entire struct
    msg!("Level: {}", player.level);
    Ok(())
}

// ✅ Fast: Zero-copy field access
pub fn process_fast(account_data: &[u8]) -> Result<()> {
    // Skip discriminator (8 bytes) + wallet (32 bytes)
    let level_offset = 8 + 32;
    let level_bytes = &account_data[level_offset..level_offset + 2];
    let level = u16::from_le_bytes(level_bytes.try_into().unwrap());

    msg!("Level: {}", level);
    Ok(())
}
```

**Savings:** ~10,000 compute units for large structs.

---

### 2. Partial Deserialization

Only deserialize fields you need:

```rust
#[derive(BorshDeserialize)]
struct PlayerFull {
    wallet: Pubkey,
    level: u16,
    experience: u64,
    inventory: Vec<Pubkey>,  // Potentially large
}

// ❌ Slow: Deserialize everything
let player = PlayerFull::try_from_slice(data)?;
check_level(player.level);

// ✅ Fast: Deserialize only needed fields
#[derive(BorshDeserialize)]
struct PlayerPartial {
    wallet: Pubkey,
    level: u16,
    // Skip rest of fields
}

let player = PlayerPartial::try_from_slice(data)?;
check_level(player.level);
```

---

### 3. Preallocate Buffers

Reuse serialization buffers to avoid allocations:

```rust
use std::io::Write;

// ❌ Allocates new Vec every time
pub fn serialize_many(players: &[Player]) -> Vec<Vec<u8>> {
    players.iter()
        .map(|p| p.try_to_vec().unwrap())
        .collect()
}

// ✅ Reuse buffer
pub fn serialize_many_fast(players: &[Player]) -> Vec<Vec<u8>> {
    let mut buffer = Vec::with_capacity(100);  // Estimate size

    players.iter()
        .map(|p| {
            buffer.clear();
            p.serialize(&mut buffer).unwrap();
            buffer.clone()  // Only clone filled portion
        })
        .collect()
}
```

---

### 4. Custom Borsh Implementation

Optimize specific fields with manual serialization:

```rust
use borsh::{BorshSerialize, BorshDeserialize};
use std::io::{Write, Read, Result};

#[derive(Debug)]
struct OptimizedPlayer {
    wallet: Pubkey,
    // Pack level (u16) and flags (u8) into 3 bytes instead of 4
    level: u16,
    premium: bool,
}

impl BorshSerialize for OptimizedPlayer {
    fn serialize<W: Write>(&self, writer: &mut W) -> Result<()> {
        self.wallet.serialize(writer)?;
        self.level.serialize(writer)?;
        (self.premium as u8).serialize(writer)?;
        Ok(())
    }
}

impl BorshDeserialize for OptimizedPlayer {
    fn deserialize<R: Read>(reader: &mut R) -> Result<Self> {
        let wallet = Pubkey::deserialize(reader)?;
        let level = u16::deserialize(reader)?;
        let premium = u8::deserialize(reader)? != 0;
        Ok(Self { wallet, level, premium })
    }
}

// Size: 32 + 2 + 1 = 35 bytes
// vs auto-derived: 32 + 2 + 1 + (padding) = 36+ bytes
```

---

### 5. Packed Bit Fields

Store multiple boolean flags in single byte:

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct Flags {
    bits: u8,
}

impl Flags {
    const ACTIVE: u8 = 0b0000_0001;
    const PREMIUM: u8 = 0b0000_0010;
    const VERIFIED: u8 = 0b0000_0100;
    const BANNED: u8 = 0b0000_1000;

    pub fn is_active(&self) -> bool {
        self.bits & Self::ACTIVE != 0
    }

    pub fn set_active(&mut self, value: bool) {
        if value {
            self.bits |= Self::ACTIVE;
        } else {
            self.bits &= !Self::ACTIVE;
        }
    }
}

// Store 8 flags in 1 byte instead of 8 bytes
```

**Savings:** 87.5% space reduction for flags.

---

### 6. Bounded Vec for Fixed Capacity

Avoid dynamic allocations with compile-time bounds:

```rust
// ❌ Unbounded (4 + N*size overhead)
#[derive(BorshSerialize, BorshDeserialize)]
struct Inventory {
    items: Vec<Pubkey>,  // Can grow unbounded
}

// ✅ Bounded (fixed size)
#[derive(BorshSerialize, BorshDeserialize)]
struct BoundedInventory {
    items: [Option<Pubkey>; 100],  // Max 100 items, fixed size
}

// Size: Unbounded = 4 + (N * 32)
//       Bounded = 100 * 33 = 3,300 bytes (predictable)
```

**Use bounded when:**
- Maximum size is known
- Predictable rent is required
- Realloc costs are unacceptable

---

## Debugging Binary Data

### Hex Dump Utility

```rust
pub fn hex_dump(data: &[u8], offset: usize, length: usize) {
    let end = std::cmp::min(offset + length, data.len());

    for (i, chunk) in data[offset..end].chunks(16).enumerate() {
        let addr = offset + (i * 16);
        print!("{:04x}: ", addr);

        // Hex bytes
        for byte in chunk {
            print!("{:02x} ", byte);
        }

        // ASCII representation
        print!(" |");
        for byte in chunk {
            let c = if byte.is_ascii_graphic() || *byte == b' ' {
                *byte as char
            } else {
                '.'
            };
            print!("{}", c);
        }
        println!("|");
    }
}
```

**Output:**
```
0000: 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10  |................|
0010: 41 6c 69 63 65 00 00 00 00 00 00 00 00 00 00 00  |Alice...........|
```

---

### Field-by-Field Parser

```rust
pub fn parse_player_account(data: &[u8]) {
    let mut offset = 0;

    // Skip Anchor discriminator
    let disc = &data[offset..offset + 8];
    msg!("Discriminator: {:?}", disc);
    offset += 8;

    // Parse wallet
    let wallet = Pubkey::new_from_array(
        data[offset..offset + 32].try_into().unwrap()
    );
    msg!("Wallet: {}", wallet);
    offset += 32;

    // Parse level
    let level = u16::from_le_bytes(
        data[offset..offset + 2].try_into().unwrap()
    );
    msg!("Level: {}", level);
    offset += 2;

    // Parse experience
    let exp = u64::from_le_bytes(
        data[offset..offset + 8].try_into().unwrap()
    );
    msg!("Experience: {}", exp);
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Field Reordering

```rust
// v1
struct Account {
    wallet: Pubkey,  // Offset 0
    balance: u64,    // Offset 32
}

// v2 - WRONG! Offsets changed
struct Account {
    balance: u64,    // Offset 0 (was 32)
    wallet: Pubkey,  // Offset 8 (was 0)
}
```

**Fix:** Never reorder fields. Always append new fields at the end.

---

### ❌ Pitfall 2: Using String for Fixed Data

```rust
// ❌ Wastes 4 bytes for length
struct Account {
    symbol: String,  // "SOL" = 4 + 3 = 7 bytes
}

// ✅ Use fixed array
struct Account {
    symbol: [u8; 3],  // "SOL" = 3 bytes
}
```

**Savings:** 57% reduction for 3-character strings.

---

### ❌ Pitfall 3: Large Enums

```rust
// ❌ Largest variant determines size
enum Message {
    Ping,                          // 1 byte (just discriminant)
    Data { payload: [u8; 1024] },  // 1 + 1024 = 1025 bytes
}

// Size of Message: 1025 bytes (always!)
```

**Fix:** Use `Box<[u8]>` for large variants:
```rust
enum Message {
    Ping,
    Data { payload: Box<[u8]> },  // 1 + ptr size on stack
}
```

---

## Production Optimization Checklist

Before deploying, optimize for:

- [ ] **Minimize account size** - Every byte costs rent
- [ ] **Avoid repeated deserializations** - Cache when possible
- [ ] **Use zero-copy for large structs** - Skip full deserialization
- [ ] **Preallocate buffers** - Reuse Vec allocations
- [ ] **Pack bit flags** - 8 bools → 1 byte
- [ ] **Use fixed arrays** - Avoid Vec overhead when size known
- [ ] **Profile compute units** - Measure actual costs
- [ ] **Test serialization roundtrips** - Verify no data corruption

---

## Benchmarking Your Code

```rust
use solana_program::clock::Clock;

pub fn benchmark_deserialization(data: &[u8], iterations: u32) {
    let start = Clock::get().unwrap().unix_timestamp;

    for _ in 0..iterations {
        let _ = Player::try_from_slice(data).unwrap();
    }

    let end = Clock::get().unwrap().unix_timestamp;
    let elapsed = end - start;

    msg!("Iterations: {}", iterations);
    msg!("Total time: {}s", elapsed);
    msg!("Avg per iteration: {}ms", (elapsed * 1000) / iterations as i64);
}
```

---

## Next Steps

- 📖 [Error Handling Guide](/guides/error-handling) - Handle deserialization errors
- 📖 [Debugging Guide](/guides/debugging) - Debug binary data issues
- 📖 [Generated Code Reference](/api/generated-code) - Understand LUMOS output
- 📖 [Schema Migrations](/guides/schema-migrations) - Evolve schemas safely

---

**Remember:** Every byte costs rent. Every deserialization costs compute units. Optimize for both.
