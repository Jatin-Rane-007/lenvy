# Budget alerts & weekly tips (scheduled Edge Functions)

Two Supabase Edge Functions run on a database-level cron schedule and email users via [Resend](https://resend.com/). Same pattern as the Welth web repo: nothing is triggered from the app — `pg_cron` + `pg_net` POST to the functions on a timer, entirely server-side.

- **`check-budget-alerts`** — runs daily, emails a user the first time they cross 80% and again the first time they cross 100% of their monthly budget (tracked via `last_alert_sent`/`last_alert_threshold` on `budgets`, resets each calendar month).
- **`weekly-tips`** — runs every Monday, asks Gemini for a few short, personalized tips based on each user's last 7 days of transactions and emails them.

## Setup (one-time, per Supabase project)

1. **Link the project** (one-time; skip if using the dashboard only)

   ```bash
   npx supabase login
   npx supabase init
   npx supabase link --project-ref <your-project-ref>
   ```

2. **Deploy the two edge functions** — either:

   ```bash
   npx supabase functions deploy check-budget-alerts
   npx supabase functions deploy weekly-tips
   ```

   or from the dashboard: **Edge Functions → Deploy a new function**, paste in the contents of the corresponding `index.ts` (and the files under `_shared/`), and give it the same name as the folder — no CLI required.

3. **Set secrets** (project-wide, covers both functions) — either `npx supabase secrets set KEY=value` per line below, or dashboard → **Edge Functions → Secrets**:

   ```
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=        # "Lenvy <alerts@yourdomain.com>" once you verify a domain in Resend;
                              # until then, use "Lenvy <onboarding@resend.dev>" — the address must
                              # stay onboarding@resend.dev and only delivers to the email you signed
                              # up with, but the display name (the "Lenvy" part) is yours to set
   GEMINI_API_KEY=           # same Gemini key as EXPO_PUBLIC_GEMINI_API_KEY, without the EXPO_PUBLIC_ prefix
   EMAIL_LOGO_URL=           # any public URL to the Lenvy logo, used in the email header;
                              # omit this secret entirely to fall back to a text "Lenvy" wordmark
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in the edge function runtime — Supabase reserves the `SUPABASE_` prefix, so you can't (and don't need to) set these yourself.

4. **Schedule them** — SQL Editor → run `scripts/cron_jobs.sql` (repo root), after filling in your real project URL and service-role key in the two `vault.create_secret(...)` calls at the top. The script also adds the `budgets.last_alert_threshold` column if it's missing.

Once done: `check-budget-alerts` runs daily at 9am UTC, `weekly-tips` runs Mondays at 9am UTC.

## Testing without waiting for the schedule

Easiest way: dashboard → **Edge Functions** → select the function → use the built-in test/invoke panel to trigger it on demand and see the response and logs right there.

CLI alternative: `curl` the deployed URL directly:

```bash
curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/check-budget-alerts' \
  --header 'Authorization: Bearer <anon-or-service-role-key>'
```

A response of `{"sent": 0}` just means no user currently qualifies — for `check-budget-alerts` you need a test user whose spend is ≥80% of their budget, for `weekly-tips` a test user with a transaction in the last 7 days. `last_alert_sent`/`last_alert_threshold` block repeat sends within the same month, so reset them on your test budget row between runs if you want to re-trigger the same threshold.

## Notes

- Files under `supabase/functions/` run on Deno (Supabase's Edge Function runtime), not the Expo app's toolchain — they're excluded from the app's `tsconfig.json` and `eslint.config.js`, and have their own `tsconfig.json`.
- `weekly-tips` imports `getCategoryConfig` from `src/constants/categories.ts` (a dependency-free file). `supabase functions deploy` bundles relative imports like this from the repo root; if you deploy via the dashboard instead, inline the category→label lookup.
