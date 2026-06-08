import { CheckCircle2, ExternalLink, KeyRound, Server, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoMode } from "@/lib/investigationApi";

const PROVIDERS = [
  {
    name: "Nimble",
    env: "NIMBLE_API_KEY",
    role: "Live public-web discovery and structured extraction.",
    docs: "https://docs.nimbleway.com",
  },
  {
    name: "Tower",
    env: "TOWER_WEBHOOK_URL",
    role: "Optional pipeline and lakehouse orchestration hook.",
    docs: "https://tower.dev",
  },
  {
    name: "RunPod",
    env: "RUNPOD_API_KEY",
    secondary: "RUNPOD_ENDPOINT_ID",
    role: "Serverless GPU embeddings and writing-fingerprint clustering.",
    docs: "https://docs.runpod.io/serverless/endpoints",
  },
  {
    name: "Gemini",
    env: "GEMINI_API_KEY",
    role: "Balanced dossier synthesis from structured evidence.",
    docs: "https://ai.google.dev/gemini-api/docs",
  },
];

const SettingsPage = () => (
  <div className="mx-auto max-w-4xl py-10">
    <header className="mb-8 border-b border-border pb-7">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Configuration</p>
      <h1 className="mt-2 text-4xl font-medium tracking-tight">Provider connections</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Provider secrets belong in the Supabase Edge Function environment, never
        in browser storage. The checked-in example file contains placeholders only.
      </p>
    </header>

    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Server className="h-4 w-4 text-primary" />
          Current runtime
        </div>
        <p className="mt-3 text-2xl font-medium">{demoMode ? "Local demo pipeline" : "Supabase pipeline"}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {demoMode
            ? "All screens and analysis states work without keys using deterministic demo evidence."
            : "Investigations are persisted in Supabase and dispatched to the server-side worker."}
        </p>
      </div>
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secret handling
        </div>
        <p className="mt-3 text-2xl font-medium">Server-side only</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          The frontend receives report data, never Nimble, RunPod, Tower, or Gemini credentials.
        </p>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {PROVIDERS.map((provider) => (
        <article key={provider.name} className="border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h2 className="text-base font-medium">{provider.name}</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {provider.role}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <a href={provider.docs} target="_blank" rel="noreferrer">
                Docs
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{provider.env}=your-key-here</span>
            </div>
            {provider.secondary && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{provider.secondary}=your-endpoint-id</span>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  </div>
);

export default SettingsPage;

