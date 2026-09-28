# Where Are We? — interactive world map

This project uses Leaflet with OpenStreetMap tiles, Open-Meteo geocoding, and Supabase database + Realtime updates.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Run `db/schema.sql` in the Supabase SQL Editor and enable Realtime for `public.pins`.
4. Run `npm run dev`.

The participant page is the normal URL. For a projector, use `/?display=true`; this hides the submission panel while keeping the map and live updates.

Only use the Supabase publishable/anon key in this frontend. Never put a `service_role` key in `.env.local` or Vercel.

## Vercel deployment

Import this `city-map` folder as a Vercel project. Vercel detects Vite automatically. Add the two `VITE_*` values under Project Settings → Environment Variables, then redeploy. The QR code should point to the normal deployment URL; the projector uses the same URL with `?display=true`.
