/**
 * Wix Members → Supabase Designer Email Migration
 *
 * Usage:  node scripts/migrate-members.mjs [--dry-run]
 *
 * For each row in PrivateMembersData.csv:
 *  1. Skip BLOCKED / OFFLINE_ONLY / rows without Login Email
 *  2. Match existing Supabase profile by:
 *     a) placeholder email:  {toSlug(Name)}@mimarlar.evlumba.com
 *     b) full_name match (case-insensitive)
 *  3. If MATCH → update auth email + contact_email to CSV's "Login Email"
 *  4. If NO MATCH → create new auth user + designer profile
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL     = 'https://vgtgcjnrsladdharzkwn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CSV_PATH         = '/Users/gokhanozfirat/Downloads/PrivateMembersData.csv';

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 350;

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Seher Mıdık" → "seher-midik" */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function normalise(str) {
  return (str || '').trim().toLowerCase();
}

// ─── Load CSV ────────────────────────────────────────────────────────────────

async function loadCsv() {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ─── Load all existing designer profiles from Supabase ───────────────────────

async function loadExistingProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, contact_email')
    .eq('role', 'designer');

  if (error) throw error;
  return data;
}

/** Fetch auth user by email (admin list users, search). Returns user or null. */
async function findAuthUserByEmail(email) {
  // Supabase admin API doesn't have a direct "get by email", so we use listUsers with filter
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be made\n');

  const [csvRows, profiles] = await Promise.all([loadCsv(), loadExistingProfiles()]);
  console.log(`CSV rows: ${csvRows.length}  |  Existing designer profiles: ${profiles.length}\n`);

  // Build lookup maps from existing profiles
  // Key: placeholder email → profile
  const byPlaceholder = new Map();
  // Key: normalised full_name → profile
  const byName = new Map();

  for (const p of profiles) {
    const slug = toSlug(p.full_name || '');
    const placeholder = `${slug}@mimarlar.evlumba.com`;
    byPlaceholder.set(placeholder, p);
    byName.set(normalise(p.full_name), p);
  }

  // Load auth users once (to find IDs for placeholder emails)
  console.log('Loading auth users…');
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) throw authErr;
  const allAuthUsers = authData.users;
  const authByEmail = new Map(allAuthUsers.map(u => [u.email?.toLowerCase(), u]));
  console.log(`Auth users loaded: ${allAuthUsers.length}\n`);

  let updated = 0, created = 0, skipped = 0, errors = 0;
  const seenEmails = new Set();

  for (const [i, row] of csvRows.entries()) {
    const name       = (row['Name'] || '').trim();
    const loginEmail = (row['Login Email'] || '').trim().toLowerCase();
    const status     = (row['Status'] || '').trim().toUpperCase();
    const picture    = (row['Picture'] || '').trim() || null;

    const prefix = `[${i + 1}/${csvRows.length}]`;

    // Skip rows without a usable name or email
    if (!name) { skipped++; console.log(`${prefix} — skip (no name)`); continue; }
    if (!loginEmail) { skipped++; console.log(`${prefix} ${name} — skip (no email)`); continue; }
    if (status === 'BLOCKED' || status === 'OFFLINE_ONLY') {
      skipped++;
      console.log(`${prefix} ${name} — skip (${status})`);
      continue;
    }

    // De-duplicate within CSV
    if (seenEmails.has(loginEmail)) {
      skipped++;
      console.log(`${prefix} ${name} — skip (duplicate email in CSV: ${loginEmail})`);
      continue;
    }
    seenEmails.add(loginEmail);

    const slug        = toSlug(name);
    const placeholder = `${slug}@mimarlar.evlumba.com`;

    // Try to find existing profile
    const existingProfile = byPlaceholder.get(placeholder) || byName.get(normalise(name));

    if (existingProfile) {
      // ── UPDATE path ──────────────────────────────────────────────────────
      console.log(`${prefix} UPDATE  ${name}  →  ${loginEmail}`);

      // Find the auth user (should be under placeholder email)
      let authUser = authByEmail.get(placeholder) || authByEmail.get(loginEmail);

      if (!authUser) {
        // Try matching by profile id
        authUser = allAuthUsers.find(u => u.id === existingProfile.id) || null;
      }

      if (!authUser) {
        console.warn(`   ↳ WARN: no auth user found for profile ${existingProfile.id} — skipping auth update`);
      }

      try {
        if (!DRY_RUN) {
          // Update auth email
          if (authUser && authUser.email?.toLowerCase() !== loginEmail) {
            const { error: ue } = await supabase.auth.admin.updateUserById(authUser.id, {
              email: loginEmail,
              email_confirm: true,
            });
            if (ue) console.warn(`   ↳ WARN auth update: ${ue.message}`);
          }

          // Update contact_email in profiles
          const { error: pe } = await supabase
            .from('profiles')
            .update({ contact_email: loginEmail })
            .eq('id', existingProfile.id);
          if (pe) throw pe;
        }

        updated++;
        console.log(`   ↳ OK`);
      } catch (err) {
        errors++;
        console.error(`   ↳ ERROR: ${err.message}`);
      }
    } else {
      // ── CREATE path ──────────────────────────────────────────────────────
      console.log(`${prefix} CREATE  ${name}  <${loginEmail}>`);

      // Check if auth user already exists with this email
      if (authByEmail.has(loginEmail)) {
        console.warn(`   ↳ WARN: auth user with ${loginEmail} already exists — skipping`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      try {
        if (!DRY_RUN) {
          // Create auth user
          const { data: newUser, error: ue } = await supabase.auth.admin.createUser({
            email: loginEmail,
            email_confirm: true,
            user_metadata: { full_name: name },
          });

          if (ue) {
            if (ue.message?.includes('already') ) {
              console.warn(`   ↳ WARN: ${ue.message} — skipping`);
              skipped++;
              await sleep(DELAY_MS);
              continue;
            }
            throw ue;
          }

          const userId = newUser.user.id;

          // Insert profile
          const { error: pe } = await supabase.from('profiles').upsert({
            id:            userId,
            full_name:     name,
            role:          'designer',
            avatar_url:    picture,
            contact_email: loginEmail,
          }, { onConflict: 'id' });

          if (pe) throw pe;

          console.log(`   ↳ OK (uid: ${userId})`);
        } else {
          console.log(`   ↳ [dry] would create`);
        }

        created++;
      } catch (err) {
        errors++;
        console.error(`   ↳ ERROR: ${err.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n── Summary ───────────────────────────────────────`);
  console.log(`Updated : ${updated}`);
  console.log(`Created : ${created}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Errors  : ${errors}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
