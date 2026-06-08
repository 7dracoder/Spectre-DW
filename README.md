# Specter

Specter is a public-identity trust analysis product for hiring teams, investors,
journalists, and operators. It accepts public identifiers, runs a structured
investigation pipeline, and produces an evidence-backed human-consistency
dossier with a GPU-style writing fingerprint visualization.

## What Works Now

- Landing page, investigation intake, live pipeline state, and final dossier.
- Keyless local demo mode for end-to-end testing.
- Supabase-ready data model and Edge Function entry point.
- Placeholder configuration for Nimble, Tower, RunPod, and Gemini.
- Supplied Specter ghost mark installed as the app logo.

## Local Development

```sh
npm install
npm run dev
```

The checked-in `.env` defaults to `VITE_DEMO_MODE="true"`, so the app works
without external keys. Use **Run demo** or **Load demo subject** to exercise the
complete flow.

## Production Configuration

Copy `.env.example` into your deployment environment and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DEMO_MODE="false"`

Set provider secrets server-side in Supabase:

```sh
supabase secrets set NIMBLE_API_KEY=...
supabase secrets set TOWER_WEBHOOK_URL=...
supabase secrets set RUNPOD_API_KEY=...
supabase secrets set RUNPOD_ENDPOINT_ID=...
supabase secrets set GEMINI_API_KEY=...
```

Provider keys should never be stored in the browser.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
