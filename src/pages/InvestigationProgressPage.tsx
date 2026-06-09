import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  FileSearch,
  Library,
  Loader2,
  Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PIPELINE_STEPS } from "@/lib/investigationStore";
import { getInvestigation } from "@/lib/investigationApi";
import type { InvestigationRecord } from "@/types/investigation";

const InvestigationProgressPage = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<InvestigationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        const data = await getInvestigation(id);
        if (!active) return;
        if (!data) setError("Investigation not found.");
        else setRecord(data);
      } catch {
        if (active) {
          setError("Unable to load this investigation. Please try again.");
        }
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 400);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dossiers
          </Link>
        </Button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const complete = record.status === "complete";
  const visibleSources = record.sources.slice(
    0,
    Math.max(1, Math.min(record.sources.length, record.counters.sources)),
  );

  return (
    <div className="mx-auto max-w-6xl py-8 md:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            All investigations
          </Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">
            Evidence review
          </p>
          <h1 className="mt-1 text-4xl font-medium tracking-tight">{record.subject_name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {complete
              ? "Analysis complete. The evidence-backed dossier is ready."
              : PIPELINE_STEPS[record.stage_index]?.detail}
          </p>
        </div>
        {complete && (
          <Button asChild size="lg">
            <Link to={`/report/${record.id}`}>
              Open dossier
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </header>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{complete ? "Dossier ready" : PIPELINE_STEPS[record.stage_index]?.label}</span>
          <span>{record.progress_percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${record.progress_percent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-medium">Review progress</h2>
          </div>
          <div>
            {PIPELINE_STEPS.map((step, index) => {
              const done = complete || index < record.stage_index;
              const current = !complete && index === record.stage_index;
              return (
                <div
                  key={step.key}
                  className={`grid grid-cols-[32px_1fr_auto] gap-3 px-5 py-4 ${
                    index > 0 ? "border-t border-border" : ""
                  } ${current ? "bg-accent/35" : ""}`}
                >
                  <div className="pt-0.5">
                    {done ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : current ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </span>
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground">
                        <Circle className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                  <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border">
            <Counter label="Sources found" value={record.counters.sources} icon={FileSearch} />
            <Counter label="Platforms matched" value={record.counters.platforms} icon={Radar} />
            <Counter label="Timeline events" value={record.counters.timelineEvents} icon={Library} />
            <Counter label="Writing samples" value={record.counters.writingSamples} icon={FileSearch} />
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-medium">Evidence collected</h2>
            </div>
            <div>
              {visibleSources.map((source, index) => (
                <div
                  key={source.id}
                  className={`px-5 py-4 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-primary">
                      {source.platform}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(source.published_at).getFullYear()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{source.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {source.snippet}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Counter = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="bg-card p-5">
    <Icon className="h-4 w-4 text-primary" />
    <p className="mt-4 text-3xl font-medium tabular-nums">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
);

export default InvestigationProgressPage;
