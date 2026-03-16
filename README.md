This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup

1. Copy `.env.example` to `.env.local`.
2. Fill the values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_HOSTS` (örn: `admin.evlumba.com`)
3. Run the SQL in `supabase/schema.sql` from Supabase SQL Editor.
4. Test connection with:

```bash
curl http://localhost:3000/api/health/supabase
```

## Admin Panel Setup

### 1) İlk Super Admin Ataması

Schema uygulandıktan sonra Supabase SQL Editor'da kendi kullanıcı UUID'inle şu komutu çalıştır:

```sql
insert into public.admin_users (user_id, role, is_active)
values ('SENIN_USER_UUID', 'super_admin', true)
on conflict (user_id) do update
set role = excluded.role, is_active = excluded.is_active;
```

### 2) Admin Alt Domaini

- Vercel projesine `admin.evlumba.com` domainini ekle.
- DNS tarafında `admin` için CNAME kaydı açıp Vercel hedefini bağla.
- Uygulama `middleware.ts` içinde `ADMIN_HOSTS` env değeriyle bu hostu admin alanına yönlendirir.

### 3) Önerilen Güvenlik Katmanları

- Vercel Firewall/WAF açık olsun.
- Admin oturumlarında zorunlu MFA (Supabase Auth ayarlarından).
- Audit log takibi için `public.admin_audit_logs` tablosunu düzenli kontrol et.
- Production ortamında `SUPABASE_SERVICE_ROLE_KEY` sadece server ortamında tutulmalı.

## Contact Form Mail Setup

`/iletisim` sayfasındaki formun `info@evlumba.com` adresine otomatik mail göndermesi için `.env.local` içine şunları ekleyin:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` (varsayılan: `info@evlumba.com`)
- `CONTACT_FROM_EMAIL` (örn: `Evlumba <onboarding@resend.dev>`)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
