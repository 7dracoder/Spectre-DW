# Vercel Deployment

## Project Settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

`vercel.json` includes the single-page application rewrite required for direct
links such as `/report/:id` and `/investigation/:id`. The build command runs
TypeScript project validation before creating the production bundle.

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

## Deployment Verification

Run the same contract before pushing:

```sh
npm ci
npm run check
```

The repository's `.vercelignore` excludes backend source, local database state,
documentation, and Tower workflow files from CLI deployment uploads. Generated
SpacetimeDB client bindings remain under `src/module_bindings` and are included
in the web build. Root-anchored exclusions deliberately preserve
`src/integrations/spacetimedb`, which is required by the browser application.

## Domain

Use Name.com DNS to point the production hostname to Vercel. Add the domain in
Vercel first, then create exactly the DNS records Vercel requests. Keep
SpacetimeDB and provider credentials outside Name.com and Vercel.
