import { useEffect, useMemo, useState } from "react";
import {
  AudioWaveform,
  BrainCircuit,
  Check,
  CircleDotDashed,
  Database,
  GitBranch,
  Radar,
  RefreshCw,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvestigationOperations } from "@/lib/investigationApi";
import { cn } from "@/lib/utils";
import type {
  InvestigationOperation,
  InvestigationRecord,
} from "@/types/investigation";

const CAPABILITIES = [
  {
    key: "discovery",
    title: "Discovery mesh",
    eyebrow: "Public evidence",
    icon: Radar,
  },
  {
    key: "reasoning",
    title: "Evidence reasoner",
    eyebrow: "Analysis pass",
    icon: BrainCircuit,
  },
  {
    key: "memory",
    title: "Live evidence memory",
    eyebrow: "Durable record",
    icon: Database,
  },
  {
    key: "orchestration",
    title: "Workflow receipt",
    eyebrow: "External audit",
    icon: GitBranch,
  },
  {
    key: "voice_readiness",
    title: "Voice investigator",
    eyebrow: "Private session",
    icon: AudioWaveform,
  },
] as const;

const InvestigationOperations = ({
  record,
}: {
  record: InvestigationRecord;
}) => {
  const [operations, setOperations] = useState<InvestigationOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refreshTimers: number[] = [];
    const load = async () => {
      const next = await getInvestigationOperations(record);
      if (active) {
        setOperations(next);
        setLoading(false);
      }
    };
    const refresh = (event: Event) => {
      const optimistic = (event as CustomEvent<InvestigationOperation>).detail;
      if (optimistic) {
        setOperations((current) => [
          ...current.filter((operation) => operation.id !== optimistic.id),
          optimistic,
        ]);
        if (record.id.startsWith("demo-")) return;
      }
      void load();
      refreshTimers.forEach((timer) => window.clearTimeout(timer));
      refreshTimers.length = 0;
      refreshTimers.push(
        window.setTimeout(() => void load(), 500),
        window.setTimeout(() => void load(), 2200),
      );
    };
    void load();
    window.addEventListener("specter:operations", refresh);
    return () => {
      active = false;
      refreshTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("specter:operations", refresh);
    };
  }, [record]);

  const latestByCapability = useMemo(() => {
    const latest = new Map<string, InvestigationOperation>();
    operations.forEach((operation) => latest.set(operation.capability, operation));
    return latest;
  }, [operations]);
  const completed = operations.filter((operation) =>
    ["complete", "ready"].includes(operation.status),
  ).length;
  const fallbacks = operations.filter((operation) =>
    ["fallback", "skipped", "setup_required"].includes(operation.status),
  ).length;
  const totalRuntime = operations.reduce(
    (sum, operation) => sum + operation.durationMs,
    0,
  );

  return (
    <section
      id="operations"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card"
    >
      <header className="grid gap-5 border-b border-border px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-medium">Investigation operations</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
            A receipt-backed view of how public evidence moved from discovery to
            analysis, durable memory, workflow audit, and private voice review.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-border bg-border text-center">
          <OperationMetric label="Completed" value={String(completed)} />
          <OperationMetric label="Fallbacks" value={String(fallbacks)} />
          <OperationMetric
            label="Runtime"
            value={totalRuntime ? formatDuration(totalRuntime) : "Ready"}
          />
        </div>
      </header>

      <div className="relative p-5 md:p-6">
        <div className="pointer-events-none absolute left-10 right-10 top-[75px] hidden h-px bg-border xl:block">
          <div className="operation-route h-full w-full bg-primary/55" />
        </div>
        <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {CAPABILITIES.map((capability, index) => (
            <CapabilityCard
              key={capability.key}
              index={index}
              capability={capability}
              operation={latestByCapability.get(capability.key)}
              loading={loading}
            />
          ))}
        </div>
      </div>

      <div className="grid border-t border-border lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Receipt ledger
              </p>
              <p className="mt-1 text-sm font-medium">
                Recent capability activity
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {operations.length} records
            </span>
          </div>
          <div>
            {[...operations]
              .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
              .slice(0, 7)
              .map((operation) => (
                <ReceiptRow key={operation.id} operation={operation} />
              ))}
            {!loading && operations.length === 0 && (
              <p className="px-6 py-8 text-xs text-muted-foreground">
                Operation receipts will appear after the next live review.
              </p>
            )}
          </div>
        </div>

        <aside className="flex flex-col justify-between bg-background p-5 md:p-6">
          <div>
            <div className="flex items-center gap-2 text-success-primary">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs font-medium">Evidence route retained</p>
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Provider secrets remain server-side. The dossier stores outcomes,
              timing, and external receipt IDs without exposing credentials or raw
              private configuration.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-6 justify-start"
            onClick={async () => {
              setLoading(true);
              setOperations(await getInvestigationOperations(record));
              setLoading(false);
            }}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh receipts
          </Button>
        </aside>
      </div>
    </section>
  );
};

const CapabilityCard = ({
  capability,
  operation,
  index,
  loading,
}: {
  capability: (typeof CAPABILITIES)[number];
  operation?: InvestigationOperation;
  index: number;
  loading: boolean;
}) => {
  const Icon = capability.icon;
  const status = loading ? "running" : operation?.status || "pending";
  const positive = ["complete", "ready"].includes(status);
  const attention = ["fallback", "setup_required", "skipped"].includes(status);

  return (
    <article className="relative min-h-56 border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center border border-border bg-card">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {capability.eyebrow}
      </p>
      <h3 className="mt-1 text-base font-medium">{capability.title}</h3>
      <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-muted-foreground">
        {operation?.detail || "Waiting for an operation receipt."}
      </p>
      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]",
            positive
              ? "text-success-primary"
              : attention
                ? "text-warning-foreground"
                : "text-muted-foreground",
          )}
        >
          {positive ? (
            <Check className="h-3 w-3" />
          ) : (
            <CircleDotDashed
              className={cn("h-3 w-3", status === "running" && "animate-spin")}
            />
          )}
          {status.replace("_", " ")}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {operation?.metric || "Pending"}
        </span>
      </div>
    </article>
  );
};

const ReceiptRow = ({
  operation,
}: {
  operation: InvestigationOperation;
}) => (
  <div className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[126px_1fr_auto] sm:items-center md:px-6">
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-primary">
        {operationLabel(operation.capability)}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        {new Date(operation.startedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">
      {operation.detail}
    </p>
    <div className="text-left sm:text-right">
      <p className="font-mono text-[10px] text-foreground">
        {operation.durationMs ? formatDuration(operation.durationMs) : operation.metric}
      </p>
      {operation.externalRef && (
        <p
          className="mt-1 max-w-32 truncate font-mono text-[9px] text-muted-foreground"
          title={operation.externalRef}
        >
          {operation.externalRef}
        </p>
      )}
    </div>
  </div>
);

const OperationMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-24 bg-background px-3 py-2.5">
    <p className="font-mono text-sm font-medium">{value}</p>
    <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </p>
  </div>
);

const operationLabel = (capability: string) =>
  ({
    discovery: "Discovery",
    reasoning: "Reasoning",
    memory: "Evidence memory",
    orchestration: "Workflow",
    voice_readiness: "Voice readiness",
    voice_session: "Voice session",
    dossier_query: "Dossier query",
  })[capability] || capability.replace("_", " ");

const formatDuration = (durationMs: number) =>
  durationMs >= 1000
    ? `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 0 : 1)}s`
    : `${durationMs}ms`;

export default InvestigationOperations;
