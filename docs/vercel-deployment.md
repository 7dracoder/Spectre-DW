# Vercel Deployment

## Project Settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

`vercel.json` includes the single-page application rewrite required for direct
links such as `/report/:id` and `/investigation/:id`.

## Environment Variables

Add these values for Production, Preview, and Development:

```env
VITE_DEMO_MODE=false
VITE_SPACETIMEDB_URI=https://maincloud.spacetimedb.com
VITE_SPACETIMEDB_DATABASE=spectre-dw
```

Change `VITE_SPACETIMEDB_DATABASE` if the published production database uses a
different name. Change the URI only when using a private SpacetimeDB host.

All `VITE_` variables are bundled into public browser code. Never add provider
API keys to Vercel. Nimble, RunPod, Tower, and ElevenLabs credentials remain in
the private SpacetimeDB `provider_config` table.

After changing an environment variable, redeploy so Vite can include the value
in the production bundle.
