import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileSearch,
  Globe2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  EvidenceSource,
  InvestigationRecord,
} from "@/types/investigation";

const SourceIntelligence = ({ record }: { record: InvestigationRecord }) => {
  const platforms = useMemo(
    () => ["All", ...Array.from(new Set(record.sources.map((source) => source.platform)))],
    [record.sources],
  );
  const [platform, setPlatform] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(record.sources[0]?.id || "");

  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return record.sources.filter((source) => {
      const matchesPlatform = platform === "All" || source.platform === platform;
      const matchesQuery =
        !normalized ||
        `${source.title} ${source.snippet} ${source.platform}`
          .toLowerCase()
          .includes(normalized);
      return matchesPlatform && matchesQuery;
    });
  }, [platform, query, record.sources]);

  const selected =
    filteredSources.find((source) => source.id === selectedId) ||
    filteredSources[0] ||
    record.sources.find((source) => source.id === selectedId) ||
    record.sources[0];

  return (
    <section
      id="sources"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
        <div>
          <h2 className="text-xl font-medium">Source intelligence</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Inspect the public material behind the assessment.
          </p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {filteredSources.length} of {record.sources.length} sources
        </span>
      </header>

      <div className="grid min-h-[470px] lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPlatform(option)}
                  className={cn(
                    "border px-2.5 py-1.5 text-[11px] transition-colors",
                    option === platform
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter evidence"
                className="h-9 bg-background pl-9 text-xs"
              />
            </div>
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            {filteredSources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                active={source.id === selected?.id}
                onSelect={() => setSelectedId(source.id)}
              />
            ))}
            {filteredSources.length === 0 && (
              <div className="grid min-h-52 place-items-center px-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No source matches this filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <article className="relative p-5 md:p-7">
            <div className="absolute left-0 top-7 h-14 w-0.5 bg-primary" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary">
                  Selected evidence
                </p>
                <h3 className="mt-3 max-w-2xl text-2xl font-medium tracking-[-0.02em]">
                  {selected.title}
                </h3>
              </div>
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
              <SourceFact icon={Globe2} label="Platform" value={selected.platform} />
              <SourceFact
                icon={FileSearch}
                label="Evidence type"
                value={selected.source_type.replace("-", " ")}
              />
              <SourceFact
                icon={CalendarDays}
                label="Observed"
                value={
                  selected.published_at
                    ? new Date(selected.published_at).toLocaleDateString()
                    : "Date unknown"
                }
              />
              <SourceFact
                icon={ShieldCheck}
                label="Identity / quality"
                value={`${selected.identity_match_score ?? 0} / ${selected.source_quality_score ?? 0}`}
              />
            </div>

            <div className="mt-7">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Evidence excerpt
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/80">
                {selected.snippet}
              </p>
            </div>

            <div className="mt-8 border-t border-border pt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Provenance
              </p>
              <p className="mt-2 break-all font-mono text-[11px] leading-5 text-muted-foreground">
                {selected.url}
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-success-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-success-primary" />
                Source retained with the dossier record
              </div>
              {(selected.matched_anchors?.length || 0) > 0 && (
                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                  Matched anchors: {selected.matched_anchors?.join(", ")}
                </p>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
};

const SourceRow = ({
  source,
  active,
  onSelect,
}: {
  source: EvidenceSource;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "relative block w-full border-b border-border px-4 py-4 text-left transition-colors",
      active ? "bg-accent/55" : "bg-card hover:bg-secondary/45",
    )}
  >
    {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.14em] text-primary">
        {source.platform}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        {source.published_at
          ? new Date(source.published_at).getFullYear()
          : "Date unknown"}
      </span>
    </div>
    <p className="mt-1.5 line-clamp-1 text-sm font-medium">{source.title}</p>
    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
      {source.snippet}
    </p>
  </button>
);

const SourceFact = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="bg-background p-4">
    <Icon className="h-3.5 w-3.5 text-primary" />
    <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-sm capitalize">{value}</p>
  </div>
);

export default SourceIntelligence;
