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
- ElevenLabs voice investigator with microphone controls, dossier context,
  short-lived WebRTC authentication, and voice-session audit rows.
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
configuration, and ElevenLabs voice-session audit records.

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
RunPod, Tower, and Gemini placeholders listed in `.env.example`.

## ElevenLabs Agent

Create a private ElevenLabs agent, then use
[`docs/elevenlabs-agent-prompt.md`](docs/elevenlabs-agent-prompt.md) as its
system prompt. The app supplies dynamic dossier fields and sends the full
evidence context when each conversation connects.

## Stack

- Vite, React, TypeScript
- Tailwind CSS and shadcn/ui
- SpacetimeDB
- ElevenLabs Agents
