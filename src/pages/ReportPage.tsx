import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  FileSearch,
  Fingerprint,
  GitBranch,
  Headphones,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  TimerReset,
} from "lucide-react";
import { ConversationProvider } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import DossierAsk from "@/components/specter/DossierAsk";
import DeleteDossierButton from "@/components/specter/DeleteDossierButton";
import FingerprintScatter from "@/components/specter/FingerprintScatter";
import InvestigationOperations from "@/components/specter/InvestigationOperations";
import ScenarioScoreLab from "@/components/specter/ScenarioScoreLab";
import SourceIntelligence from "@/components/specter/SourceIntelligence";
import TimelinePlayback from "@/components/specter/TimelinePlayback";
import VoiceInvestigator from "@/components/specter/VoiceInvestigator";
import { getInvestigation } from "@/lib/investigationApi";
import { useToast } from "@/hooks/use-toast";
import type { InvestigationRecord } from "@/types/investigation";

const SECTION_NAV = [
  ["overview", "Overview", LayoutDashboard],
  ["operations", "Operations", GitBranch],
  ["ask", "Ask dossier", MessageSquareText],
  ["sources", "Sources", FileSearch],
  ["timeline", "Timeline", TimerReset],
  ["scenarios", "Scenarios", SlidersHorizontal],
  ["writing", "Writing", Fingerprint],
  ["voice", "Voice", Headphones],
  ["claims", "Claims", Scale],
] as const;

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [record, setRecord] = useState<InvestigationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

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
        if (active) setError("Unable to load this dossier. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!record) return;
    const sections = SECTION_NAV.map(([sectionId]) =>
      document.getElementById(sectionId),
    ).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [record]);

  const platforms = useMemo(
    () => Array.from(new Set(record?.sources.map((source) => source.platform) ?? [])),
    [record],
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">
            Loading evidence command center
          </p>
        </div>
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
  const years = record.sources
    .map((source) => new Date(source.published_at).getFullYear())
    .filter((year) => Number.isFinite(year));
  const earliestYear = years.length ? Math.min(...years) : new Date().getFullYear();
  const latestYear = years.length ? Math.max(...years) : earliestYear;
  const datedSourceCount = record.sources.filter(
    (source) => source.published_at && source.date_confidence !== "unknown",
  ).length;
  const supportedClaims = record.claims.filter(
    (claim) => claim.support_level === "supported",
  ).length;

  const copySummary = async () => {
    await navigator.clipboard.writeText(
      `${record.subject_name}\nPublic Evidence Consistency Score: ${score}/100\nEvidence Confidence: ${record.evidence_confidence_score ?? score}/100\n\n${record.dossier_summary}`,
    );
    toast({ title: "Summary copied" });
  };

  const exportSummary = () => {
    const content = [
      `SPECTER DOSSIER: ${record.subject_name}`,
      `Public Evidence Consistency Score: ${score}/100`,
      `Evidence Confidence: ${record.evidence_confidence_score ?? score}/100`,
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
    <div className="mx-auto max-w-[1580px]">
      <div className="grid gap-8 xl:grid-cols-[160px_minmax(0,1fr)]">
        <ReportRail activeSection={activeSection} record={record} />

        <div className="min-w-0 space-y-7 pb-10">
          <section id="overview" className="scroll-mt-24">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Dossiers
                </Link>
                <span>/</span>
                <span className="capitalize">{record.context.replace("_", " ")}</span>
                <span>/</span>
                <span>Final dossier</span>
              </div>
              <div className="flex gap-2">
                <DeleteDossierButton
                  investigationId={record.id}
                  subjectName={record.subject_name}
                  onDeleted={() => navigate("/dashboard", { replace: true })}
                />
                <Button variant="outline" size="sm" onClick={copySummary}>
                  <Clipboard className="mr-2 h-3.5 w-3.5" />
                  Copy summary
                </Button>
                <Button size="sm" onClick={exportSummary}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </header>

            <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
                  Subject
                </p>
                <h1 className="mt-2 text-6xl font-medium leading-none tracking-[-0.055em] md:text-7xl">
                  {record.subject_name}
                </h1>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span>{record.classification}</span>
                  <span>Confidence: {record.confidence_band}</span>
                  <span>
                    Updated {new Date(record.updated_at).toLocaleDateString()}
                  </span>
                  {record.id.startsWith("demo-") && (
                    <span>Simulated demo evidence</span>
                  )}
                </div>

                <div className="mt-8 grid gap-px overflow-hidden border-y border-border bg-border sm:grid-cols-4">
                  <HeroMetric
                    label="Sources"
                    value={String(record.sources.length)}
                    meta={`${platforms.length} ${platforms.length === 1 ? "platform" : "platforms"}`}
                  />
                  <HeroMetric
                    label="Dated sources"
                    value={`${datedSourceCount}/${record.sources.length}`}
                    meta={
                      years.length
                        ? `${earliestYear} to ${latestYear}`
                        : "No reliable dates"
                    }
                  />
                  <HeroMetric
                    label="Claims supported"
                    value={`${supportedClaims}/${record.claims.length}`}
                    meta="Evidence matched"
                  />
                  <HeroMetric
                    label="Evidence confidence"
                    value={`${record.evidence_confidence_score ?? score}`}
                    meta="Out of 100"
                  />
                </div>
              </div>

              <ScoreHero score={score} record={record} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
              <Panel title="Executive evidence summary">
                <p className="text-sm leading-7 text-foreground/80">
                  {record.dossier_summary}
                </p>
                <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
                  <SignalList
                    icon={CheckCircle2}
                    label="Strong signals"
                    items={record.strengths}
                    tone="text-success-primary"
                  />
                  <SignalList
                    icon={ShieldAlert}
                    label="Risks and gaps"
                    items={record.concerns}
                    tone="text-warning-foreground"
                  />
                </div>
                {(record.limitations?.length || 0) > 0 && (
                  <div className="mt-5 border-l-2 border-warning-foreground/45 pl-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Evidence limits
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                      {record.limitations?.map((limitation) => (
                        <li key={limitation}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>
              <Panel title="Review posture">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-primary/25 bg-accent">
                    <Scale className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-lg font-medium">
                      Manual verification recommended
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      This score summarizes public consistency signals. It does not
                      determine identity, intent, ability, safety, or worth.
                    </p>
                  </div>
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Next priority
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {record.recommendations[0]}
                  </p>
                </div>
              </Panel>
            </div>
          </section>

          <InvestigationOperations record={record} />
          <DossierAsk record={record} />
          <SourceIntelligence record={record} />
          <TimelinePlayback record={record} />
          <ScenarioScoreLab record={record} />

          {record.embeddings.length > 0 && (
            <section id="writing" className="report-reveal scroll-mt-24">
              <Panel
                title="Writing fingerprint"
                meta={`${record.embeddings.length} public writing samples`}
              >
                <FingerprintScatter points={record.embeddings} />
                <p className="mt-4 max-w-3xl text-xs leading-6 text-muted-foreground">
                  This map is shown only when full writing samples were analyzed.
                  Search snippets alone are never treated as authorship evidence.
                </p>
              </Panel>
            </section>
          )}

          <ConversationProvider>
            <VoiceInvestigator record={record} />
          </ConversationProvider>

          <section
            id="claims"
            className="report-reveal grid scroll-mt-24 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
          >
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
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {claim.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Recommended checks">
              <ol className="space-y-5">
                {record.recommendations.map((recommendation, index) => (
                  <li
                    key={recommendation}
                    className="grid grid-cols-[32px_1fr] gap-3"
                  >
                    <span className="grid h-8 w-8 place-items-center border border-border bg-background font-mono text-xs text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">
                      {recommendation}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
          </section>

          <Panel title="Interpretable signal scores" meta="Editable in scenario lab">
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
                    <span className="text-3xl font-medium tabular-nums tracking-[-0.04em]">
                      {signal.score}
                    </span>
                  </div>
                  <div className="mt-4 h-0.5 overflow-hidden bg-secondary">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${signal.score}%` }}
                    />
                  </div>
                  <p className="mt-4 text-xs leading-6 text-muted-foreground">
                    {signal.summary}
                  </p>
                </article>
              ))}
            </div>
          </Panel>

          <div className="border border-border bg-card p-5 text-xs leading-6 text-muted-foreground">
            <strong className="text-foreground">Signals, not verdicts.</strong>{" "}
            Specter analyzes public information and surfaces uncertainty. It should
            not be used as the sole basis for hiring, investment, access, or
            reputational decisions.
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportRail = ({
  activeSection,
  record,
}: {
  activeSection: string;
  record: InvestigationRecord;
}) => (
  <aside className="hidden xl:block">
    <div className="sticky top-24 flex min-h-[calc(100vh-8rem)] flex-col">
      <nav className="space-y-1">
        {SECTION_NAV.filter(
          ([id]) => id !== "writing" || record.embeddings.length > 0,
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              document.getElementById(id)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left text-xs transition-colors ${
              activeSection === id
                ? "border-primary bg-accent/60 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Evidence integrity
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-success-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-success-primary" />
          {record.sources.length} sources retained
        </div>
      </div>
    </div>
  </aside>
);

const ScoreHero = ({
  score,
  record,
}: {
  score: number;
  record: InvestigationRecord;
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const trend = record.signals.slice(0, 7).map((signal, index) => ({
    x: index * 16.5,
    y: 52 - signal.score * 0.42,
  }));
  const path = trend
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <aside className="relative overflow-hidden border border-border bg-card p-6 shadow-[0_22px_70px_hsl(20_14%_14%/0.055)]">
      <div className="report-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/55" />
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Public evidence consistency
      </p>
      <div className="mt-4 flex items-end justify-between gap-5">
        <div className="flex items-end">
          <span className="text-8xl font-medium leading-none tracking-[-0.075em] text-primary">
            {displayScore}
          </span>
          <span className="mb-2 ml-2 text-lg text-muted-foreground">/100</span>
        </div>
        <svg viewBox="0 0 100 55" className="mb-2 h-16 w-28" aria-hidden="true">
          <path d="M0 50H100" stroke="hsl(var(--border))" strokeWidth="1" />
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-medium">{record.classification}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Evidence confidence {record.evidence_confidence_score ?? score}/100
          </span>
          <span className="flex items-center gap-1.5 text-success-primary">
            <Check className="h-3.5 w-3.5" />
            Review complete
          </span>
        </div>
      </div>
    </aside>
  );
};

const HeroMetric = ({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) => (
  <div className="bg-background py-4 pr-4 sm:px-4 sm:first:pl-0">
    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 text-2xl font-medium tracking-[-0.03em]">{value}</p>
    <p className="mt-1 text-[10px] text-muted-foreground">{meta}</p>
  </div>
);

const Panel = ({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) => (
  <section className="report-reveal border border-border bg-card p-5 shadow-[0_10px_34px_hsl(20_14%_14%/0.025)] md:p-6">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="text-xl font-medium">{title}</h2>
      {meta && (
        <span className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
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
  <div className="bg-card p-4">
    <p className={`flex items-center gap-2 text-xs font-medium ${tone}`}>
      <Icon className="h-4 w-4" />
      {label}
    </p>
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="text-xs leading-5 text-muted-foreground">
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
    supported: "border-success-primary/25 bg-success text-success-foreground",
    partial: "border-warning-primary/25 bg-warning text-warning-foreground",
    unresolved: "border-border bg-secondary text-muted-foreground",
  };
  return (
    <span
      className={`shrink-0 border px-2 py-1 text-[10px] capitalize ${styles[level]}`}
    >
      {level}
    </span>
  );
};

export default ReportPage;
