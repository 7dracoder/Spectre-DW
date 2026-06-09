# ElevenLabs Setup

## API Key Permissions

Create or edit a restricted ElevenLabs API key and enable:

- Conversational AI / Agents: Read
- Conversational AI / Agents: Write

Write access is needed while creating or updating the Spectre agent. The live
website uses short-lived conversation tokens generated server-side, so the API
key must never be exposed to browser code. Separate text-to-speech, speech-to-
text, music, sound-effects, and voice-cloning permissions are not required for
this agent flow.

## Agent Configuration

1. Create a private agent named `Spectre Dossier Investigator`.
2. Use the system prompt in
   [`elevenlabs-agent-prompt.md`](elevenlabs-agent-prompt.md).
3. Select a low-latency conversational model.
4. Set temperature to `0.2`.
5. Disable extended reasoning.
6. Keep the default backup model enabled.
7. Choose a professional, neutral voice at approximately `0.95` to `1.0`
   speaking speed.

Create these dynamic variables with safe empty defaults:

- `subject_name`
- `consistency_score`
- `confidence_band`
- `classification`
- `dossier_summary`

## Security And Privacy

- Enable agent authentication so conversations require a signed token.
- Do not enable both signed-token authentication and an origin allowlist.
- Keep the agent private and disable public sharing.
- Disable audio saving when recordings are not required.
- Set conversation retention to the shortest period your review process
  permits.
- Do not add client tools, webhooks, or knowledge-base write access for the
  initial release.

After the agent is created, store its agent ID with the owner-only reducer:

```powershell
$name = '\"ELEVENLABS_AGENT_ID\"'
$value = '\"your-agent-id\"'
spacetime call --server local spectre-dw configure_provider $name $value
```
