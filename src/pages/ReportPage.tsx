import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import FingerprintScatter from "@/components/specter/FingerprintScatter";
import VoiceInvestigator from "@/components/specter/VoiceInvestigator";
import { getInvestigation } from "@/lib/investigationApi";
import { useToast } from "@/hooks/use-toast";
import type { InvestigationRecord } from "@/types/investigation";

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<InvestigationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getInvestigation(id)
      .then((data) => {
        if (!active) return;
        if (!data) setError("Investigation not found.");
        else setRecord(data);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load this dossier. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const platforms = useMemo(
    () => Array.from(new Set(record?.sources.map((source) => source.platform) ?? [])),
    [record],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-destructive-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dossiers
          </Link>
        </Button>
      </div>
    );
  }

  const score = record.consistency_score ?? 0;
  const copySummary = async () => {
    await navigator.clipboard.writeText(
      `${record.subject_name}\nHuman Consistency Score: ${score}/100\n\n${record.dossier_summary}`,
    );
    toast({ title: "Summary copied" });
  };

  const exportSummary = () => {
    const content = [
      `SPECTER DOSSIER: ${record.subject_name}`,
      `Human Consistency Score: ${score}/100`,
      `Classification: ${record.classification}`,
      `Confidence: ${record.confidence_band}`,
      "",
      record.dossier_summary ?? "",
      "",
      "SUPPORTING SIGNALS",
      ...record.strengths.map((item) => `- ${item}`),
      "",
      "CONCERNS",
      ...record.concerns.map((item) => `- ${item}`),
      "",
      "RECOMMENDATIONS",
      ...record.recommendations.map((item) => `- ${item}`),
      "",
      "Specter provides decision-support signals, not a verdict.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `specter-${record.subject_name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            All investigations
          </Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">Final dossier</p>
          <h1 className="mt-2 text-4xl font-medium tracking-[-0.035em] md:text-5xl">
            {record.subject_name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            <span className="capitalize">{record.context.replace("_", " ")}</span>
            <span>·</span>
            <span>{new Date(record.created_at).toLocaleString()}</span>
            {record.id.startsWith("demo-") && (
              <>
                <span>·</span>
                <span>Simulated demo evidence</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copySummary}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy summary
          </Button>
          <Button onClick={exportSummary}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      <section className="grid overflow-hidden border border-border bg-border shadow-[0_16px_50px_hsl(20_14%_14%/0.04)] lg:grid-cols-[320px_1fr_1fr] lg:gap-px">
        <div className="bg-card p-6">
          <p className="text-xs text-muted-foreground">Human Consistency Score</p>
          <div className="mt-4 flex items-center gap-5">
            <div
              className="grid h-28 w-28 place-items-center rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, hsl(var(--secondary)) 0deg)`,
              }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-card">
                <span className="text-5xl font-medium tabular-nums">{score}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{record.classification}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Confidence: {record.confidence_band}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0">
          <p className="text-xs text-muted-foreground">Evidence coverage</p>
          <p className="mt-4 text-4xl font-medium tabular-nums">{record.sources.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            sources across {platforms.length} platforms
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <span key={platform} className="rounded-full bg-secondary px-2.5 py-1 text-[11px]">
                {platform}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0">
          <p className="text-xs text-muted-foreground">Assessment posture</p>
          <p className="mt-4 text-2xl font-medium">Manual verification recommended</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This score summarizes public consistency signals. It does not determine
            identity, intent, ability, or worth.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Executive summary">
          <p className="text-sm leading-7 text-muted-foreground">{record.dossier_summary}</p>
        </Panel>
        <Panel title="Signal balance">
          <div className="space-y-5">
            <SignalList
              icon={CheckCircle2}
              label="Supporting evidence"
              items={record.strengths}
              tone="text-success-primary"
            />
            <SignalList
              icon={ShieldAlert}
              label="Open questions"
              items={record.concerns}
              tone="text-warning-primary"
            />
          </div>
        </Panel>
      </section>

      <ConversationProvider>
        <VoiceInvestigator record={record} />
      </ConversationProvider>

      <Panel title="Writing fingerprint" meta="54 public writing samples">
        <FingerprintScatter points={record.embeddings} />
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          The map shows healthy variation across contexts while preserving a
          recognizable author pattern. Two outliers are highlighted for manual review.
        </p>
      </Panel>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Evidence timeline">
          <div>
            {record.timeline.map((event, index) => (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className={`group grid grid-cols-[82px_1fr] gap-4 py-4 ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="text-xs text-muted-foreground">
                  <p>{new Date(event.date).getFullYear()}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-primary">
                    {event.platform}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {event.title}
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {event.summary}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Panel>

        <Panel title="Claim vs. evidence">
          <div>
            {record.claims.map((claim, index) => (
              <div
                key={claim.id}
                className={`py-4 ${index > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium">{claim.claim_text}</p>
                  <SupportBadge level={claim.support_level} />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {claim.evidence}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Interpretable signal scores">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
          {record.signals.map((signal) => (
            <article key={signal.id} className="bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{signal.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Weight {signal.weight}
                  </p>
                </div>
                <span className="text-2xl font-medium tabular-nums">{signal.score}</span>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${signal.score}%` }}
                />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {signal.summary}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Recommendations">
          <ol className="space-y-4">
            {record.recommendations.map((recommendation, index) => (
              <li key={recommendation} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-medium">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {recommendation}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Source evidence">
          <div className="grid gap-3 md:grid-cols-2">
            {record.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group border border-border p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-primary">
                    {source.platform} · {source.source_type}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm font-medium">{source.title}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {source.snippet}
                </p>
              </a>
            ))}
          </div>
        </Panel>
      </section>

      <div className="border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Signals, not verdicts.</strong> Specter
        analyzes public information and surfaces uncertainty. It should not be used
        as the sole basis for hiring, investment, access, or reputational decisions.
      </div>
    </div>
  );
};

const Panel = ({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) => (
  <section className="border border-border bg-card p-5 shadow-[0_10px_34px_hsl(20_14%_14%/0.025)] md:p-6">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="text-lg font-medium">{title}</h2>
      {meta && (
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground">
          {meta}
        </span>
      )}
    </header>
    {children}
  </section>
);

const SignalList = ({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: string[];
  tone: string;
}) => (
  <div>
    <p className={`flex items-center gap-2 text-xs font-medium ${tone}`}>
      <Icon className="h-4 w-4" />
      {label}
    </p>
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="text-xs leading-relaxed text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const SupportBadge = ({
  level,
}: {
  level: InvestigationRecord["claims"][number]["support_level"];
}) => {
  const styles = {
    supported: "bg-success text-success-foreground",
    partial: "bg-warning text-warning-foreground",
    unresolved: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] capitalize ${styles[level]}`}>
      {level}
    </span>
  );
};

export default ReportPage;
