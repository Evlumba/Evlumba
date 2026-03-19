/**
 * Wix → Supabase Designer Migration
 *
 * Usage:  node scripts/migrate-designers.mjs
 *
 * For each row in the CSV:
 *  1. Converts the Wix photo URL to a public wixstatic URL
 *  2. Creates a Supabase auth user (placeholder email if none)
 *  3. Inserts a `profiles` row with role = 'designer'
 *  4. Sends a password-reset e-mail to rows that have a real address
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://vgtgcjnrsladdharzkwn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CSV_PATH = '/Users/gokhanozfirat/Downloads/Team (1).csv';

// Placeholder emails that Wix inserts by default — treat as "no email"
const PLACEHOLDER_EMAILS = new Set([
  'info@mysite.com',
  'info@example.com',
  '',
]);

// ms to wait between rows to avoid hitting Supabase rate-limits
const DELAY_MS = 400;

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** wix:image://v1/{slug}/{filename}#... → https://static.wixstatic.com/media/{slug} */
function wixUrlToPublic(wixUrl) {
  if (!wixUrl || !wixUrl.startsWith('wix:image://v1/')) return null;
  const withoutPrefix = wixUrl.replace('wix:image://v1/', '');
  const slug = withoutPrefix.split('/')[0];
  return slug ? `https://static.wixstatic.com/media/${slug}` : null;
}

/** "İstanbul,Hepsi" → "İstanbul" */
function parseCity(raw) {
  if (!raw) return null;
  const parts = raw.split(',').map(s => s.trim()).filter(s => s && s !== 'Hepsi');
  return parts[0] || null;
}

/** "Seher Mıdık" → "seher-midik" (ASCII-safe slug) */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Parse CSV ────────────────────────────────────────────────────────────────

async function loadRows() {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const rows = await loadRows();
  console.log(`Loaded ${rows.length} rows from CSV\n`);

  let created = 0, skipped = 0, errors = 0;
  const emailsSeen = new Set(); // guard against duplicate emails in CSV

  for (const [i, row] of rows.entries()) {
    const name = (row['Name'] || '').trim();
    if (!name) { skipped++; continue; }

    const rawEmail  = (row['Email'] || '').trim().toLowerCase();
    const hasReal   = rawEmail && !PLACEHOLDER_EMAILS.has(rawEmail);
    const slug      = toSlug(name);
    const email     = hasReal ? rawEmail : `${slug}@mimarlar.evlumba.com`;

    // Skip true duplicates
    if (emailsSeen.has(email)) {
      console.warn(`[${i + 1}] Duplicate email skipped: ${email}`);
      skipped++;
      continue;
    }
    emailsSeen.add(email);

    const avatarUrl    = wixUrlToPublic(row['Photo'] || '');
    const specialty    = (row['Job Title'] || '').trim() || null;
    const about        = (row['Short Description'] || '').trim() || null;
    const contactEmail = hasReal ? rawEmail : null;
    const instagram    = (row['Insta Link'] || '').trim() || null;
    const city         = parseCity(row['Lokasyon']);

    console.log(`[${i + 1}/${rows.length}] ${name} <${email}>`);

    try {
      // 1. Create auth user
      const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (userErr) {
        // Already exists — look them up
        if (userErr.message?.includes('already been registered') || userErr.message?.includes('already exists')) {
          console.warn(`   ↳ Auth user already exists, skipping profile insert`);
          skipped++;
          await sleep(DELAY_MS);
          continue;
        }
        throw userErr;
      }

      const userId = userData.user.id;

      // 2. Upsert profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id:            userId,
          full_name:     name,
          role:          'designer',
          avatar_url:    avatarUrl,
          specialty,
          about,
          contact_email: contactEmail,
          instagram,
          city,
        }, { onConflict: 'id' });

      if (profileErr) throw profileErr;

      // 3. Send password-reset only to real addresses
      if (hasReal) {
        const { error: resetErr } = await supabase.auth.admin.generateLink({
          type:  'recovery',
          email: rawEmail,
        });
        if (resetErr) {
          console.warn(`   ↳ Password reset failed: ${resetErr.message}`);
        } else {
          console.log(`   ↳ Password reset e-mail queued`);
        }
      }

      created++;
      console.log(`   ↳ OK (uid: ${userId})`);
    } catch (err) {
      errors++;
      console.error(`   ↳ ERROR: ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n── Done ──────────────────────────────────────────`);
  console.log(`Created : ${created}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Errors  : ${errors}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
