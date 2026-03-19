/**
 * Wix → Supabase Designer Projects Migration
 *
 * Usage:  node scripts/migrate-projects.mjs
 *
 * For each designer row in the CSV:
 *  1. Finds their auth user by placeholder/real email
 *  2. Creates a designer_projects row
 *  3. Creates designer_project_images rows for each Designs image
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://vgtgcjnrsladdharzkwn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CSV_PATH = '/Users/gokhanozfirat/Downloads/Team (1).csv';

const PLACEHOLDER_EMAILS = new Set(['info@mysite.com', 'info@example.com', '']);
const DELAY_MS = 300;

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wixUrlToPublic(wixUrl) {
  if (!wixUrl || !wixUrl.startsWith('wix:image://v1/')) return null;
  const slug = wixUrl.replace('wix:image://v1/', '').split('/')[0];
  return slug ? `https://static.wixstatic.com/media/${slug}` : null;
}

function parseCity(raw) {
  if (!raw) return null;
  const parts = raw.split(',').map(s => s.trim()).filter(s => s && s !== 'Hepsi');
  return parts[0] || null;
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── CSV ─────────────────────────────────────────────────────────────────────

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
  console.log(`Loaded ${rows.length} rows\n`);

  // Build email → id map once
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error('listUsers failed:', listErr.message); process.exit(1); }
  const emailToId = Object.fromEntries(users.map(u => [u.email, u.id]));
  console.log(`Found ${users.length} auth users\n`);

  let created = 0, skipped = 0, errors = 0;
  const seen = new Set();

  for (const [i, row] of rows.entries()) {
    const name = (row['Name'] || '').trim();
    if (!name) { skipped++; continue; }

    // Deduplicate by name (same logic as user migration)
    const slug = toSlug(name);
    if (seen.has(slug)) { skipped++; continue; }
    seen.add(slug);

    const rawEmail = (row['Email'] || '').trim().toLowerCase();
    const hasReal  = rawEmail && !PLACEHOLDER_EMAILS.has(rawEmail);
    const email    = hasReal ? rawEmail : `${slug}@mimarlar.evlumba.com`;

    // Parse images
    let images = [];
    try {
      const raw = (row['Designs'] || '').trim();
      if (raw.startsWith('[')) images = JSON.parse(raw);
    } catch {}

    if (!images.length) {
      console.log(`[${i + 1}/${rows.length}] ${name} — no images, skipping`);
      skipped++;
      continue;
    }

    const publicImages = images
      .map(img => wixUrlToPublic(img.src || ''))
      .filter(Boolean);

    if (!publicImages.length) {
      console.log(`[${i + 1}/${rows.length}] ${name} — no convertible images, skipping`);
      skipped++;
      continue;
    }

    // Find designer_id from auth
    const designerIdLookup = emailToId[email];
    if (!designerIdLookup) {
      console.warn(`[${i + 1}/${rows.length}] ${name} — auth user not found (${email}), skipping`);
      skipped++;
      continue;
    }

    const designerId = designerIdLookup;
    const projectType = (row['Project Type'] || '').trim() || null;
    const description = (row['Short Description'] || '').trim() || null;
    const location    = parseCity(row['Lokasyon']);
    const coverImage  = publicImages[0];
    const title       = `${name} Projesi`;

    console.log(`[${i + 1}/${rows.length}] ${name} (${publicImages.length} görsel)`);

    try {
      // Insert project
      const { data: project, error: projErr } = await supabase
        .from('designer_projects')
        .insert({
          designer_id:     designerId,
          title,
          project_type:    projectType,
          location,
          description,
          cover_image_url: coverImage,
          is_published:    true,
        })
        .select('id')
        .single();

      if (projErr) throw projErr;

      // Insert images
      const imageRows = publicImages.map((url, idx) => ({
        project_id: project.id,
        image_url:  url,
        sort_order: idx,
      }));

      const { error: imgErr } = await supabase
        .from('designer_project_images')
        .insert(imageRows);

      if (imgErr) throw imgErr;

      created++;
      console.log(`   ↳ OK (project: ${project.id})`);
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
