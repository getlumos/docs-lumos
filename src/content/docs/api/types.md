---
title: Type System
description: Complete reference for all supported types in LUMOS schemas across 5 languages
---

LUMOS supports a rich type system that maps cleanly between Rust, TypeScript, Python, Go, and Ruby.

## Multi-Language Type Mapping

LUMOS generates type-safe code in 5 languages from a single schema. All languages use Borsh serialization for guaranteed cross-language compatibility.

### Quick Reference

| LUMOS Type | Rust | TypeScript | Python | Go | Ruby |
|------------|------|------------|--------|----|----|
| `u8` | `u8` | `number` | `int` | `uint8` | `Integer` |
| `u16` | `u16` | `number` | `int` | `uint16` | `Integer` |
| `u32` | `u32` | `number` | `int` | `uint32` | `Integer` |
| `u64` | `u64` | `number` | `int` | `uint64` | `Integer` |
| `u128` | `u128` | `bigint` | `int` | `[16]byte` | `Integer` |
| `i8` | `i8` | `number` | `int` | `int8` | `Integer` |
| `i16` | `i16` | `number` | `int` | `int16` | `Integer` |
| `i32` | `i32` | `number` | `int` | `int32` | `Integer` |
| `i64` | `i64` | `number` | `int` | `int64` | `Integer` |
| `i128` | `i128` | `bigint` | `int` | `[16]byte` | `Integer` |
| `bool` | `bool` | `boolean` | `bool` | `bool` | `TrueClass/FalseClass` |
| `String` | `String` | `string` | `str` | `string` | `String` |
| `PublicKey` | `Pubkey` | `PublicKey` | `bytes(32)` | `[32]byte` | `Array (32 bytes)` |
| `Signature` | `Signature` | `Uint8Array` | `bytes(64)` | `[64]byte` | `Array (64 bytes)` |
| `Vec<T>` | `Vec<T>` | `T[]` | `list[T]` | `[]T` | `Array` |
| `Option<T>` | `Option<T>` | `T \| undefined` | `T \| None` | `*T` | `T / nil` |
| `[T; N]` | `[T; N]` | `T[]` | `list[T]` | `[N]T` | `Array` |

### Borsh Serialization Libraries

| Language | Library | Installation |
|----------|---------|--------------|
| Rust | `borsh` | `cargo add borsh` |
| TypeScript | `@coral-xyz/borsh` | `npm install @coral-xyz/borsh` |
| Python | `borsh-construct` | `pip install borsh-construct` |
| Go | Manual (struct tags) | Built-in encoding |
| Ruby | `borsh-rb` | `gem install borsh-rb` |

---

## Language-Specific Details

### Rust Types

Rust is the primary target for LUMOS. Generated code uses:
- `borsh::BorshSerialize` and `BorshDeserialize` derives
- Anchor's `Pubkey` for Solana types
- Native Rust primitives

```rust
// Generated Rust
use borsh::{BorshSerialize, BorshDeserialize};
use anchor_lang::prelude::*;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct Account {
    pub owner: Pubkey,       // PublicKey → Pubkey
    pub balance: u64,        // u64 → u64
    pub name: String,        // String → String
    pub items: Vec<u8>,      // Vec<T> → Vec<T>
    pub email: Option<String>, // Option<T> → Option<T>
}
```

### TypeScript Types

TypeScript generation includes both interfaces and Borsh schemas:

```typescript
// Generated TypeScript
import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';

export interface Account {
  owner: PublicKey;         // PublicKey → PublicKey
  balance: number;          // u64 → number (precision warning)
  name: string;             // String → string
  items: number[];          // Vec<u8> → number[]
  email: string | undefined; // Option<String> → string | undefined
}

export const AccountBorshSchema = borsh.struct([
  borsh.publicKey('owner'),
  borsh.u64('balance'),
  borsh.string('name'),
  borsh.vec(borsh.u8(), 'items'),
  borsh.option(borsh.string(), 'email'),
]);
```

:::caution[u64 Precision in TypeScript]
JavaScript `number` can only safely represent integers up to `2^53 - 1`.
For `u64` values larger than this, use `bigint` or validate ranges.
:::

### Python Types

Python generation uses dataclasses with `borsh-construct`:

```python
# Generated Python
from dataclasses import dataclass
from typing import Optional, List
from borsh_construct import CStruct, U64, String, Vec, Option, Bytes

@dataclass
class Account:
    owner: bytes  # 32 bytes for PublicKey
    balance: int  # u64 → int (Python handles arbitrary precision)
    name: str     # String → str
    items: List[int]  # Vec<u8> → List[int]
    email: Optional[str]  # Option<String> → Optional[str]

AccountSchema = CStruct(
    "owner" / Bytes(32),
    "balance" / U64,
    "name" / String,
    "items" / Vec(U8),
    "email" / Option(String),
)
```

**Advantages:**
- Python's `int` handles arbitrary precision natively (no u64 overflow)
- `borsh-construct` provides zero-copy deserialization
- Type hints for IDE support

### Go Types

Go generation uses struct tags for Borsh encoding:

```go
// Generated Go
package schema

// Account represents the account data
type Account struct {
    Owner   [32]byte `borsh:"owner"`   // PublicKey → [32]byte
    Balance uint64   `borsh:"balance"` // u64 → uint64
    Name    string   `borsh:"name"`    // String → string
    Items   []uint8  `borsh:"items"`   // Vec<u8> → []uint8
    Email   *string  `borsh:"email"`   // Option<String> → *string (nil = None)
}
```

**Key Mappings:**
- `PublicKey` → `[32]byte` (fixed array)
- `u128` → `[16]byte` (Go lacks native 128-bit integers)
- `Option<T>` → `*T` (pointer, `nil` represents None)

### Ruby Types

Ruby generation uses classes with YARD documentation:

```ruby
# Generated Ruby
require 'borsh'

# Account represents the account data
# @attr owner [Array<Integer>] The account owner (32 bytes)
# @attr balance [Integer] The account balance
# @attr name [String] The account name
# @attr items [Array<Integer>] The items list
# @attr email [String, nil] Optional email address
class Account
  attr_accessor :owner, :balance, :name, :items, :email

  SCHEMA = {
    owner: [:u8, 32],
    balance: :u64,
    name: :string,
    items: [:array, :u8],
    email: [:option, :string]
  }

  def initialize(opts = {})
    @owner = opts[:owner] || Array.new(32, 0)
    @balance = opts[:balance] || 0
    @name = opts[:name] || ""
    @items = opts[:items] || []
    @email = opts[:email]
  end
end
```

---

## Type Mapping Overview (Legacy)

| LUMOS Type | Rust Type | TypeScript Type | Borsh Schema |
|------------|-----------|-----------------|--------------|
| `u8` | `u8` | `number` | `borsh.u8()` |
| `u16` | `u16` | `number` | `borsh.u16()` |
| `u32` | `u32` | `number` | `borsh.u32()` |
| `u64` | `u64` | `number` | `borsh.u64()` |
| `u128` | `u128` | `bigint` | `borsh.u128()` |
| `i8` | `i8` | `number` | `borsh.i8()` |
| `i16` | `i16` | `number` | `borsh.i16()` |
| `i32` | `i32` | `number` | `borsh.i32()` |
| `i64` | `i64` | `number` | `borsh.i64()` |
| `i128` | `i128` | `bigint` | `borsh.i128()` |
| `bool` | `bool` | `boolean` | `borsh.bool()` |
| `String` | `String` | `string` | `borsh.string()` |
| `PublicKey` | `Pubkey` | `PublicKey` | `borsh.publicKey()` |
| `Signature` | `Signature` | `Uint8Array` | `borsh.array(borsh.u8(), 64)` |
| `[T]` | `Vec<T>` | `T[]` | `borsh.vec(...)` |
| `Option<T>` | `Option<T>` | `T \| undefined` | `borsh.option(...)` |

---

## Primitive Types

### Unsigned Integers

```rust
#[solana]
struct Numbers {
    tiny: u8,       // 0 to 255
    small: u16,     // 0 to 65,535
    medium: u32,    // 0 to 4,294,967,295
    large: u64,     // 0 to 18,446,744,073,709,551,615
    huge: u128,     // 0 to 340,282,366,920,938,463,463,374,607,431,768,211,455
}
```

**Rust output:**
```rust
pub struct Numbers {
    pub tiny: u8,
    pub small: u16,
    pub medium: u32,
    pub large: u64,
    pub huge: u128,
}
```

**TypeScript output:**
```typescript
export interface Numbers {
  tiny: number;
  small: number;
  medium: number;
  large: number;   // May lose precision > Number.MAX_SAFE_INTEGER
  huge: bigint;
}
```

:::caution[u64 Precision in TypeScript]
JavaScript `number` can only safely represent integers up to `2^53 - 1` (9,007,199,254,740,991).

For `u64` values larger than this, precision may be lost. Use `bigint` carefully or validate ranges.
:::

---

### Signed Integers

```rust
#[solana]
struct SignedNumbers {
    tiny: i8,       // -128 to 127
    small: i16,     // -32,768 to 32,767
    medium: i32,    // -2,147,483,648 to 2,147,483,647
    large: i64,     // Large signed range
    huge: i128,     // Massive signed range
}
```

**TypeScript mapping:**
- `i8`, `i16`, `i32`, `i64` → `number`
- `i128` → `bigint`

---

### Boolean

```rust
#[solana]
struct Flags {
    is_active: bool,
    has_permission: bool,
}
```

**Borsh encoding:**
- `true` → `0x01`
- `false` → `0x00`

---

### String

```rust
#[solana]
struct Metadata {
    name: String,
    description: String,
    symbol: String,
}
```

**Borsh encoding:**
- Length prefix (4 bytes, little-endian)
- UTF-8 bytes

**Example:**
- `"hello"` → `0x05000000` + `0x68656c6c6f`

:::tip[String Storage]
Strings on Solana consume:
- 4 bytes for length
- N bytes for UTF-8 content

Keep strings short for efficient on-chain storage.
:::

---

## Solana-Specific Types

### PublicKey

Represents a Solana public key (32 bytes).

```rust
#[solana]
struct Account {
    owner: PublicKey,
    authority: PublicKey,
}
```

**Rust mapping:**
```rust
use anchor_lang::prelude::*;

pub struct Account {
    pub owner: Pubkey,
    pub authority: Pubkey,
}
```

**TypeScript mapping:**
```typescript
import { PublicKey } from '@solana/web3.js';

export interface Account {
  owner: PublicKey;
  authority: PublicKey;
}

export const AccountBorshSchema = borsh.struct([
  borsh.publicKey('owner'),
  borsh.publicKey('authority'),
]);
```

**Borsh encoding:**
- 32 bytes (fixed size)

---

### Signature

Represents a Solana signature (64 bytes).

```rust
#[solana]
struct Transaction {
    signature: Signature,
}
```

**Rust mapping:**
```rust
pub struct Transaction {
    pub signature: Signature,  // From solana_program
}
```

**TypeScript mapping:**
```typescript
export interface Transaction {
  signature: Uint8Array;  // 64 bytes
}

export const TransactionBorshSchema = borsh.struct([
  borsh.array(borsh.u8(), 64, 'signature'),
]);
```

---

## Complex Types

### Vec (Arrays/Lists)

Dynamic-length arrays.

```rust
#[solana]
struct Inventory {
    items: [PublicKey],
    scores: [u64],
}
```

**Rust output:**
```rust
pub struct Inventory {
    pub items: Vec<Pubkey>,
    pub scores: Vec<u64>,
}
```

**TypeScript output:**
```typescript
export interface Inventory {
  items: PublicKey[];
  scores: number[];
}

export const InventoryBorshSchema = borsh.struct([
  borsh.vec(borsh.publicKey(), 'items'),
  borsh.vec(borsh.u64(), 'scores'),
]);
```

**Borsh encoding:**
- Length prefix (4 bytes, little-endian)
- Elements sequentially

**Example:**
- `[1, 2, 3]` → `0x03000000` + `0x01` + `0x02` + `0x03`

:::tip[Vec Storage Costs]
Vectors cost 4 bytes for length + (item size × count).

For 100 PublicKeys: 4 + (32 × 100) = 3,204 bytes
:::

---

### Option (Optional Values)

Nullable fields.

```rust
#[solana]
struct Profile {
    username: String,
    email: Option<String>,
    avatar: Option<PublicKey>,
}
```

**Rust output:**
```rust
pub struct Profile {
    pub username: String,
    pub email: Option<String>,
    pub avatar: Option<Pubkey>,
}
```

**TypeScript output:**
```typescript
export interface Profile {
  username: string;
  email: string | undefined;
  avatar: PublicKey | undefined;
}

export const ProfileBorshSchema = borsh.struct([
  borsh.string('username'),
  borsh.option(borsh.string(), 'email'),
  borsh.option(borsh.publicKey(), 'avatar'),
]);
```

**Borsh encoding:**
- `None` → `0x00`
- `Some(value)` → `0x01` + value bytes

**Example:**
- `None` → `0x00`
- `Some(42)` → `0x01` + `0x2a`

---

## Enum Types

Rust-style enums with three variant types.

### Unit Variants

```rust
#[solana]
enum Status {
    Active,
    Paused,
    Terminated,
}
```

**Rust output:**
```rust
pub enum Status {
    Active,
    Paused,
    Terminated,
}
```

**TypeScript output:**
```typescript
export type Status =
  | { kind: 'Active' }
  | { kind: 'Paused' }
  | { kind: 'Terminated' };

export const StatusBorshSchema = borsh.rustEnum([
  borsh.unit('Active'),
  borsh.unit('Paused'),
  borsh.unit('Terminated'),
]);
```

**Borsh encoding:**
- Discriminant (1 byte) + variant data
- `Active` → `0x00`
- `Paused` → `0x01`
- `Terminated` → `0x02`

---

### Tuple Variants

```rust
#[solana]
enum Event {
    UserJoined(PublicKey),
    ScoreUpdated(PublicKey, u64),
    GameEnded(PublicKey, u64, i64),
}
```

**Rust output:**
```rust
pub enum Event {
    UserJoined(Pubkey),
    ScoreUpdated(Pubkey, u64),
    GameEnded(Pubkey, u64, i64),
}
```

**TypeScript output:**
```typescript
export type Event =
  | { kind: 'UserJoined'; fields: [PublicKey] }
  | { kind: 'ScoreUpdated'; fields: [PublicKey, number] }
  | { kind: 'GameEnded'; fields: [PublicKey, number, number] };

export const EventBorshSchema = borsh.rustEnum([
  borsh.tuple([borsh.publicKey()], 'UserJoined'),
  borsh.tuple([borsh.publicKey(), borsh.u64()], 'ScoreUpdated'),
  borsh.tuple([borsh.publicKey(), borsh.u64(), borsh.i64()], 'GameEnded'),
]);
```

---

### Struct Variants

```rust
#[solana]
enum Instruction {
    Initialize {
        authority: PublicKey,
        max_users: u32,
    },
    UpdateConfig {
        new_authority: PublicKey,
    },
    Terminate,
}
```

**Rust output:**
```rust
pub enum Instruction {
    Initialize {
        authority: Pubkey,
        max_users: u32,
    },
    UpdateConfig {
        new_authority: Pubkey,
    },
    Terminate,
}
```

**TypeScript output:**
```typescript
export type Instruction =
  | { kind: 'Initialize'; authority: PublicKey; max_users: number }
  | { kind: 'UpdateConfig'; new_authority: PublicKey }
  | { kind: 'Terminate' };

export const InstructionBorshSchema = borsh.rustEnum([
  borsh.struct([
    borsh.publicKey('authority'),
    borsh.u32('max_users'),
  ], 'Initialize'),
  borsh.struct([
    borsh.publicKey('new_authority'),
  ], 'UpdateConfig'),
  borsh.unit('Terminate'),
]);
```

---

## Type Constraints

### Not Supported

The following types are **NOT** supported:

❌ Floating point (`f32`, `f64`)
❌ Fixed-size arrays (`[u8; 32]`) - use `Vec` or `PublicKey`
❌ Tuples (`(u64, String)`) - use structs instead
❌ References (`&str`, `&[u8]`)
❌ Raw pointers (`*const`, `*mut`)
❌ Function pointers

### Workarounds

**Fixed-size arrays → Vec:**
```rust
// ❌ Not supported
struct Data {
    buffer: [u8; 1024],
}

// ✅ Use Vec instead
struct Data {
    buffer: [u8],  // Vec<u8>
}
```

**Tuples → Struct:**
```rust
// ❌ Not supported
struct Pair {
    data: (u64, String),
}

// ✅ Use struct instead
struct Pair {
    first: u64,
    second: String,
}
```

---

## Best Practices

:::tip[Choose the Right Integer Size]
Use the smallest type that fits your range:
- **Counts (0-255)**: `u8`
- **Years, IDs**: `u16` or `u32`
- **Lamports, timestamps**: `u64`
:::

:::tip[Be Careful with u64 in TypeScript]
JavaScript `number` loses precision beyond `2^53 - 1`.

For large `u64` values, consider:
1. Validate ranges on-chain
2. Use `BN` or `bigint` in TypeScript
3. Display as strings in UI
:::

:::tip[Use Option for Nullable Fields]
Always use `Option<T>` for optional values:
```rust
struct User {
    name: String,
    email: Option<String>,  // Not all users have email
}
```
:::

:::caution[Vec Costs Storage]
Every Vec item costs space:
- Small vecs (1-10 items): Fine
- Medium vecs (10-100 items): Watch account size
- Large vecs (100+ items): Consider pagination or off-chain storage
:::

---

## See Also

- [Attributes](/api/attributes) - `#[solana]`, `#[account]`
- [Generated Code](/api/generated-code) - See actual output
- [Examples](/examples/) - Real-world schemas
- [Python Types](/api/python-types) - Python dataclasses with borsh-construct
- [Go Types](/api/go-types) - Go structs with Borsh serialization
- [Ruby Types](/api/ruby-types) - Ruby classes with borsh-rb
