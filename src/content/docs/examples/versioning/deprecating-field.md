---
title: 'Example: Deprecating a Field'
description: Phased migration using dual-field pattern for safe field deprecation
---

This example shows how to **safely deprecate a field** using a multi-phase migration strategy that gives users time to migrate.

**Scenario:** Rename `email` to `email_address` for better clarity, with zero downtime.

**Strategy:** Dual-field pattern with 3 phases over 6 months.

---

## Phase 1: Add New Field, Deprecate Old (v1.1.0)

**File:** `user_profile_v1.1.lumos`

```rust
#[solana]
#[account]
#[version("1.1.0")]
struct UserProfile {
    wallet: PublicKey,
    username: String,

    #[deprecated("Use 'email_address' instead. Will be removed in v2.0.0 (June 2025)")]
    email: Option<String>,

    email_address: Option<String>,  // ✅ New field
}
```

**Why This is Safe:**
- ✅ **Non-breaking** - Old accounts still deserialize
- ✅ **Both fields exist** - Transition period for clients
- ✅ **Deprecation warning** - Developers get clear notice

**LUMOS Output:**
```bash
lumos validate user_profile_v1.1.lumos

# warning: UserProfile.email is deprecated
#   --> user_profile_v1.1.lumos:6
#   |
# 6 |     email: Option<String>,
#   |     ^^^^^ Use 'email_address' instead. Will be removed in v2.0.0 (June 2025)
```

---

## Phase 1 Program Logic: Write to Both

**Write to BOTH fields during transition:**

```rust
use anchor_lang::prelude::*;

#[program]
pub mod user_profile {
    use super::*;

    pub fn update_email(
        ctx: Context<UpdateEmail>,
        new_email: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;

        // ✅ Write to BOTH fields during Phase 1
        profile.email = Some(new_email.clone());
        profile.email_address = Some(new_email);

        msg!("Email updated (dual-write): {}", new_email);
        Ok(())
    }

    pub fn get_email(profile: &UserProfile) -> Option<String> {
        // ✅ Read from new field first, fall back to old
        profile.email_address.clone()
            .or_else(|| profile.email.clone())
    }
}

#[derive(Accounts)]
pub struct UpdateEmail<'info> {
    #[account(mut)]
    pub profile: Account<'info, UserProfile>,
}

#[account]
pub struct UserProfile {
    pub wallet: Pubkey,
    pub username: String,
    pub email: Option<String>,
    pub email_address: Option<String>,
}
```

**Key Principles:**
1. **Write to both** old and new fields
2. **Read from new** field first, fall back to old
3. **No data loss** during transition

---

## Phase 1 TypeScript SDK

**Generated TypeScript (v1.1.0):**

```typescript
export interface UserProfile {
  wallet: PublicKey;
  username: string;

  /** @deprecated Use email_address instead. Will be removed in v2.0.0 */
  email: string | undefined;

  emailAddress: string | undefined;
}

export const UserProfileBorshSchema = borsh.struct([
  borsh.publicKey('wallet'),
  borsh.string('username'),
  borsh.option(borsh.string(), 'email'),
  borsh.option(borsh.string(), 'emailAddress'),
]);
```

**Client Code Update:**

```typescript
// OLD (v1.0.0) - Still works
const email = profile.email;

// NEW (v1.1.0) - Preferred
const email = profile.emailAddress ?? profile.email;

// BEST - Use helper function
function getUserEmail(profile: UserProfile): string | undefined {
  return profile.emailAddress ?? profile.email;
}
```

**Deprecation Linting:**
```typescript
// TypeScript will warn:
// [ts] 'email' is deprecated: Use email_address instead. Will be removed in v2.0.0

const userEmail = profile.email;  // ⚠️ Warning in IDE
```

---

## Phase 2: Migrate Existing Accounts (v1.2.0)

**Timeline:** 2 months after Phase 1 (March 2025)

**Goal:** Copy data from `email` to `email_address` for all existing accounts.

### Migration Instruction

```rust
#[program]
pub mod user_profile {
    use super::*;

    pub fn migrate_email_field(ctx: Context<MigrateProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;

        // Only migrate if new field is empty and old field has data
        if profile.email_address.is_none() && profile.email.is_some() {
            profile.email_address = profile.email.clone();
            msg!(
                "Migrated email for {}: {}",
                profile.wallet,
                profile.email.as_ref().unwrap()
            );
        } else {
            msg!("Profile already migrated or no email set");
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MigrateProfile<'info> {
    #[account(mut)]
    pub profile: Account<'info, UserProfile>,

    /// Signer can be profile owner or admin
    pub signer: Signer<'info>,
}
```

### Bulk Migration Script

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';

async function migrateAllProfiles(program: Program) {
  // Fetch all profiles
  const allProfiles = await program.account.userProfile.all();

  console.log(`Found ${allProfiles.length} profiles`);

  let migrated = 0;
  let alreadyMigrated = 0;
  let failed = 0;

  for (const { publicKey, account } of allProfiles) {
    // Skip if already migrated
    if (account.emailAddress !== undefined) {
      alreadyMigrated++;
      continue;
    }

    // Skip if no email to migrate
    if (account.email === undefined) {
      continue;
    }

    try {
      const tx = await program.methods
        .migrateEmailField()
        .accounts({
          profile: publicKey,
          signer: provider.wallet.publicKey,
        })
        .rpc();

      console.log(`✅ Migrated ${publicKey.toBase58()}: ${tx}`);
      migrated++;
    } catch (err) {
      console.error(`❌ Failed ${publicKey.toBase58()}:`, err);
      failed++;
    }
  }

  console.log(`\nMigration Complete:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Already migrated: ${alreadyMigrated}`);
  console.log(`  Failed: ${failed}`);
}
```

### Web UI for User Migration

```typescript
// Self-service migration button
async function migrateMyProfile() {
  setStatus('Checking migration status...');

  const profile = await program.account.userProfile.fetch(profilePubkey);

  if (profile.emailAddress !== undefined) {
    setStatus('✅ Already migrated!');
    return;
  }

  if (profile.email === undefined) {
    setStatus('ℹ️ No email to migrate');
    return;
  }

  setStatus('Migrating...');

  try {
    const tx = await program.methods
      .migrateEmailField()
      .accounts({
        profile: profilePubkey,
        signer: wallet.publicKey,
      })
      .rpc();

    setStatus(`✅ Migrated! TX: ${tx.slice(0, 8)}...`);
  } catch (err) {
    setStatus(`❌ Migration failed: ${err.message}`);
  }
}
```

---

## Phase 3: Remove Old Field (v2.0.0)

**Timeline:** 4-6 months after Phase 1 (June 2025)

**File:** `user_profile_v2.0.lumos`

```rust
#[solana]
#[account]
#[version("2.0.0")]
struct UserProfile {
    wallet: PublicKey,
    username: String,
    email_address: Option<String>,  // ✅ Only new field remains
}
```

**Program Logic - Simplified:**

```rust
pub fn update_email(
    ctx: Context<UpdateEmail>,
    new_email: String,
) -> Result<()> {
    let profile = &mut ctx.accounts.profile;

    // ✅ Only write to new field
    profile.email_address = Some(new_email);

    Ok(())
}

pub fn get_email(profile: &UserProfile) -> Option<String> {
    // ✅ Only read from new field
    profile.email_address.clone()
}
```

**Breaking Change Notice:**

```markdown
# BREAKING CHANGE in v2.0.0

The deprecated `email` field has been removed from `UserProfile`.

## Migration Required

All profiles must have been migrated by June 1, 2025.

### Check If Migrated

solana account <PROFILE_PUBKEY> --output json

If `emailAddress` field exists, you're good. If not:

### Migrate Now

Visit https://example.com/migrate or use CLI:

program-cli migrate-profile --profile <PUBKEY>

## For Developers

Update your code:

// OLD (v1.x):
const email = profile.email;

// NEW (v2.0):
const email = profile.emailAddress;
```

---

## Migration Timeline Summary

| Phase | Version | Date | Action | Breaking? |
|-------|---------|------|--------|-----------|
| **Phase 1** | v1.1.0 | Jan 2025 | Add `email_address`, deprecate `email` | ❌ No |
| **Phase 2** | v1.2.0 | Mar 2025 | Provide migration instruction | ❌ No |
| **Phase 3** | v2.0.0 | Jun 2025 | Remove `email` field | ✅ Yes |

**Total Timeline:** 6 months (recommended for production)

---

## Monitoring Migration Progress

### On-Chain Statistics

```rust
#[account]
pub struct MigrationStats {
    pub total_profiles: u64,
    pub migrated_profiles: u64,
    pub last_updated: i64,
}

pub fn update_stats(ctx: Context<UpdateStats>) -> Result<()> {
    let stats = &mut ctx.accounts.stats;

    // Count migrated profiles
    // (In practice, use a cron job to update this)

    stats.last_updated = Clock::get()?.unix_timestamp;
    Ok(())
}
```

### Dashboard Query

```typescript
async function getMigrationProgress() {
  const allProfiles = await program.account.userProfile.all();

  const total = allProfiles.length;
  const migrated = allProfiles.filter(
    p => p.account.emailAddress !== undefined
  ).length;

  const percentage = (migrated / total * 100).toFixed(2);

  console.log(`Migration Progress: ${migrated}/${total} (${percentage}%)`);

  return { total, migrated, percentage };
}
```

---

## Testing

### Test Phase 1: Dual-Write

```rust
#[test]
fn test_dual_write() {
    let mut profile = UserProfile {
        wallet: Pubkey::new_unique(),
        username: "alice".to_string(),
        email: None,
        email_address: None,
    };

    // Update email (writes to both)
    let new_email = "alice@example.com".to_string();
    profile.email = Some(new_email.clone());
    profile.email_address = Some(new_email.clone());

    // Verify both fields have same value
    assert_eq!(profile.email, Some(new_email.clone()));
    assert_eq!(profile.email_address, Some(new_email));
}
```

### Test Phase 2: Migration

```rust
#[test]
fn test_migration_from_old_field() {
    let mut profile = UserProfile {
        wallet: Pubkey::new_unique(),
        username: "bob".to_string(),
        email: Some("bob@example.com".to_string()),
        email_address: None,  // Not yet migrated
    };

    // Run migration
    if profile.email_address.is_none() && profile.email.is_some() {
        profile.email_address = profile.email.clone();
    }

    // Verify migration
    assert_eq!(profile.email_address, Some("bob@example.com".to_string()));
}
```

### Test Phase 3: Old Field Removed

```rust
#[test]
fn test_v2_schema_compiles() {
    // v2.0.0 schema (no 'email' field)
    let profile = UserProfileV2 {
        wallet: Pubkey::new_unique(),
        username: "charlie".to_string(),
        email_address: Some("charlie@example.com".to_string()),
    };

    // Should compile without 'email' field
    assert!(profile.email_address.is_some());
}
```

---

## Communication Plan

### Phase 1 Announcement (Jan 2025)

**Subject:** Deprecation Notice: `email` field renamed to `email_address`

```
Hi Developers,

We're renaming the `email` field to `email_address` for better clarity.

Timeline:
- Jan 2025 (v1.1.0): New field added, old field deprecated
- Mar 2025 (v1.2.0): Migration tool available
- Jun 2025 (v2.0.0): Old field removed

Action Required:
Update your code to use `email_address` instead of `email`.

Migration is automatic - no action needed for users.

Questions? Join our Discord: https://discord.gg/...
```

### Phase 2 Reminder (Mar 2025)

**Subject:** Reminder: Migrate to `email_address` field (3 months until removal)

```
The `email` field will be removed in June 2025 (v2.0.0).

Self-Migration Tool: https://example.com/migrate

Or use CLI:
program-cli migrate-profile --profile <PUBKEY>

Check migration status:
solana account <PROFILE_PUBKEY>
```

### Phase 3 Final Notice (May 2025)

**Subject:** FINAL NOTICE: `email` field removal in 1 month

```
⚠️ The `email` field will be REMOVED on June 1, 2025.

Current Migration Status: 87% complete

If you haven't migrated yet, do it NOW:
https://example.com/migrate

After June 1, unmigrated profiles will lose email data.
```

---

## Key Takeaways

✅ **Dual-field pattern is safest** for field deprecation
✅ **Give users time** (6+ months recommended)
✅ **Communicate clearly** at each phase
✅ **Provide self-service tools** for migration
✅ **Monitor progress** before removing old field
✅ **Phase 1 & 2 are non-breaking** - only Phase 3 is breaking

---

## Production Checklist

### Phase 1 (v1.1.0)

- [ ] Add new field (`email_address`)
- [ ] Mark old field `#[deprecated]`
- [ ] Update program to dual-write
- [ ] Update program to read from new field first
- [ ] Regenerate TypeScript SDK
- [ ] Announce deprecation
- [ ] Deploy to mainnet

### Phase 2 (v1.2.0)

- [ ] Create migration instruction
- [ ] Build web UI for migration
- [ ] Write bulk migration script
- [ ] Test migration on devnet
- [ ] Deploy migration tool
- [ ] Send migration reminders

### Phase 3 (v2.0.0)

- [ ] Verify >95% profiles migrated
- [ ] Send final warning (1 month before)
- [ ] Remove old field from schema
- [ ] Update program logic (remove dual-write)
- [ ] Increment MAJOR version
- [ ] Deploy v2.0.0 to mainnet

---

## Next Steps

- 📖 [Schema Versioning Guide](/guides/versioning) - Deprecation best practices
- 📖 [Schema Migrations Guide](/guides/schema-migrations) - Dual-schema pattern
- 📖 [Adding Optional Field](/examples/versioning/adding-optional-field) - Simpler alternative

---

**Gradual deprecation gives users time to adapt without breaking their applications.** 🚀
