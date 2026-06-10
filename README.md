# Spectre-DW

Spectre-DW is a public-identity trust analysis product for hiring teams,
investors, journalists, and operators. It produces an evidence-backed human
consistency dossier and an interactive writing fingerprint.

## What Works

- Complete investigation intake, progress, dossier, and fingerprint flow.
- Keyless local demo mode backed by browser storage.
- SpacetimeDB module with typed tables, reducers, procedures, and generated
  TypeScript bindings.
- Owner-only private provider configuration in SpacetimeDB.
- Multi-query public discovery with URL deduplication, evidence links, dated
  coverage, and retained request receipts.
- Dual-model dossier synthesis with automatic hosted-model failover and a
  deterministic evidence-safe fallback.
- Tower completion runs with acceptance receipts for investigation audit and
  workflow visibility.
- ElevenLabs voice investigator with microphone controls, dossier context,
  short-lived WebRTC authentication, and voice-session audit rows.
- A SpacetimeDB-backed operations ledger for discovery, reasoning, durable
  evidence memory, orchestration, dossier questions, and voice sessions.
- Browser voice briefing fallback while demo mode is enabled.

## Local Frontend

```sh
npm install
npm run dev
```

The checked-in `.env` uses `VITE_DEMO_MODE="true"`, so the full UI works without
external services.

## SpacetimeDB

Build and regenerate the typed client:

```sh
npm run db:build
npm run db:generate
```

Run a local SpacetimeDB host, publish the module, then switch demo mode off:

```sh
spacetime start
spacetime publish --server local spectre-dw
```

```env
VITE_DEMO_MODE="false"
VITE_SPACETIMEDB_URI="http://127.0.0.1:3000"
VITE_SPACETIMEDB_DATABASE="spectre-dw"
```

SpacetimeDB owns investigation records, normalized evidence payloads, provider
configuration, provider operation receipts, and ElevenLabs voice-session audit
records.

## Investigation Operations

Every live dossier records a server-side capability trail:

1. Nimble runs up to three focused searches based on submitted identity
   anchors, then deduplicates and relevance-filters the returned URLs.
2. RunPod synthesizes the evidence with Qwen3 32B AWQ and automatically fails
   over to Granite 4.0 when public capacity is unavailable.
3. SpacetimeDB commits sources, claims, signals, embeddings, and the dossier in
   one durable transaction.
4. Tower receives a completion run containing the investigation ID, subject,
   context, source count, and consistency score.
5. ElevenLabs issues private WebRTC tokens and records voice-session start/end
   receipts once an agent ID is configured.

The product UI presents these as investigation capabilities rather than a
technology list. Credentials remain server-side, while timing, status, and
external request receipts are retained for auditability.

## Provider Secrets

Provider keys are private SpacetimeDB rows and can only be changed by the
identity that published the database:

```powershell
$name = '\"ELEVENLABS_API_KEY\"'
$value = '\"your-key\"'
spacetime call --server local spectre-dw configure_provider $name $value

$name = '\"ELEVENLABS_AGENT_ID\"'
$value = '\"your-agent-id\"'
spacetime call --server local spectre-dw configure_provider $name $value
```

Do not prefix provider credentials with `VITE_`; Vite-prefixed values are
exposed to browser code. Use the same owner-only reducer for the Nimble,
RunPod, and Tower placeholders listed in `.env.example`.

SpacetimeDB procedures keep those credentials server-side, perform external
requests, and persist the resulting dossier. SpacetimeDB does not currently
provide an application-facing foundation-model inference API, so RunPod is the
configured synthesis provider. `RUNPOD_FALLBACK_MODEL` defaults to
`granite-4-0-h-small`.

## ElevenLabs Agent

Create a private ElevenLabs agent, then use
[`docs/elevenlabs-agent-prompt.md`](docs/elevenlabs-agent-prompt.md) as its
system prompt. The app supplies dynamic dossier fields and sends the full
evidence context when each conversation connects.

The minimum dashboard permissions and privacy settings are documented in
[`docs/elevenlabs-setup.md`](docs/elevenlabs-setup.md).

## Vercel Deployment

Vercel needs only the public SpacetimeDB connection values. Provider secrets
remain in SpacetimeDB. Exact project settings and environment variables are in
[`docs/vercel-deployment.md`](docs/vercel-deployment.md).
