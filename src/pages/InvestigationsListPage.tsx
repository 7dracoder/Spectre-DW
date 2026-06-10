import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FlaskConical,
  Gauge,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteDossierButton from "@/components/specter/DeleteDossierButton";
import RevisitDossierButton from "@/components/specter/RevisitDossierButton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { createFeaturedDemo } from "@/lib/investigationStore";
import { listInvestigations } from "@/lib/investigationApi";
import type { InvestigationListItem } from "@/types/investigation";

type StatusFilter = "all" | "complete" | "active";

const InvestigationsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InvestigationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let active = true;
    const load = () =>
      listInvestigations(user?.id).then((data) => {
        if (!active) return;
        setRows(data);
        setLoading(false);
      });
    void load();
    window.addEventListener("specter:investigations", load);
    return () => {
      active = false;
      window.removeEventListener("specter:investigations", load);
    };
  }, [user?.id]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.subject_name.toLowerCase().includes(normalizedQuery) ||
        row.context.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "complete" && row.status === "complete") ||
        (statusFilter === "active" &&
          (row.status === "pending" || row.status === "running"));
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);
  const workspaceMetrics = useMemo(() => {
    const complete = rows.filter((row) => row.status === "complete");
    const active = rows.filter(
      (row) => row.status === "pending" || row.status === "running",
    ).length;
    const averageScore = complete.length
      ? Math.round(
          complete.reduce(
            (sum, row) => sum + (row.consistency_score || 0),
            0,
          ) / complete.length,
        )
      : 0;
    return {
      total: rows.length,
      complete: complete.length,
      active,
      averageScore,
    };
  }, [rows]);

  const runDemo = () => {
    const record = createFeaturedDemo();
    navigate(`/investigation/${record.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl py-6 md:py-10">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-medium tracking-[-0.035em] md:text-5xl">Dossiers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Evidence-led reviews of public identity history, organized for clear
            human judgment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={runDemo}>
            <FlaskConical className="mr-2 h-4 w-4" />
            View sample
          </Button>
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link to="/investigate">
              <Plus className="mr-2 h-4 w-4" />
              New investigation
            </Link>
          </Button>
        </div>
      </header>

      {!loading && rows.length > 0 && (
        <section className="grid gap-px overflow-hidden border-b border-border bg-border md:grid-cols-4">
          <WorkspaceMetric
            icon={Activity}
            label="Workspace reviews"
            value={workspaceMetrics.total}
            detail={`${workspaceMetrics.active} currently active`}
          />
          <WorkspaceMetric
            icon={CheckCircle2}
            label="Completed dossiers"
            value={workspaceMetrics.complete}
            detail={`${Math.round((workspaceMetrics.complete / workspaceMetrics.total) * 100)}% completion rate`}
          />
          <WorkspaceMetric
            icon={Gauge}
            label="Average score"
            value={workspaceMetrics.averageScore}
            detail="Across completed reviews"
          />
          <WorkspaceMetric
            icon={TrendingUp}
            label="Review posture"
            value="Live"
            detail="Evidence monitoring available"
          />
        </section>
      )}

      <div className="grid gap-8 pt-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-5 text-sm">
              {[
                ["all", "All"],
                ["complete", "Complete"],
                ["active", "In review"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value as StatusFilter)}
                  className={`border-b-2 pb-3 transition-colors ${
                    statusFilter === value
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dossiers"
                className="h-9 border-0 bg-secondary pl-9 shadow-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState hasRows={rows.length > 0} onRunDemo={runDemo} />
          ) : (
            <div className="divide-y divide-border">
              <div className="hidden grid-cols-[minmax(220px,1fr)_150px_130px_100px_130px] gap-5 py-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:grid">
                <span>Subject</span>
                <span>Review context</span>
                <span>Status</span>
                <span className="text-right">Score</span>
                <span className="text-right">Actions</span>
              </div>
              {filteredRows.map((row) => {
                const target =
                  row.status === "complete"
                    ? `/report/${row.id}`
                    : `/investigation/${row.id}`;
                return (
                  <div
                    key={row.id}
                    className="group grid gap-4 py-6 transition-colors hover:bg-card md:grid-cols-[minmax(220px,1fr)_150px_130px_100px_130px] md:items-center md:px-3"
                  >
                    <Link to={target} className="contents">
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium">
                          {row.subject_name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {new Date(row.updated_at).toLocaleDateString()}
                          {" · "}Revision {row.analysis_revision || 1}
                        </p>
                      </div>
                      <p className="text-sm capitalize text-muted-foreground">
                        {row.context.replace("_", " ")}
                      </p>
                      <StatusBadge status={row.status} />
                      <div className="md:text-right">
                        <span className="text-3xl font-medium tabular-nums tracking-[-0.04em]">
                          {row.status === "complete"
                            ? row.consistency_score
                            : "N/A"}
                        </span>
                        {row.status === "complete" && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            /100
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center justify-end gap-1">
                      {(row.status === "complete" || row.status === "failed") && (
                        <RevisitDossierButton
                          compact
                          investigationId={row.id}
                          subjectName={row.subject_name}
                          onRevisited={(record) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.id === row.id
                                  ? {
                                      id: record.id,
                                      subject_name: record.subject_name,
                                      status: record.status,
                                      consistency_score:
                                        record.consistency_score,
                                      context: record.context,
                                      created_at: record.created_at,
                                      updated_at: record.updated_at,
                                      stage_index: record.stage_index,
                                      analysis_revision:
                                        record.analysis_revision || 1,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      )}
                      <DeleteDossierButton
                        compact
                        investigationId={row.id}
                        subjectName={row.subject_name}
                        onDeleted={() =>
                          setRows((current) =>
                            current.filter((item) => item.id !== row.id),
                          )
                        }
                      />
                      <Button asChild variant="ghost" size="icon">
                        <Link to={target} aria-label={`Open ${row.subject_name}`}>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="h-fit border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Review standard
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em]">
            Evidence before inference.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every dossier is structured to make supporting evidence, uncertainty,
            and required follow-up visible.
          </p>
          <div className="mt-7 divide-y divide-border border-y border-border">
            <StandardRow
              icon={FileSearch}
              title="Public evidence only"
              body="Relevant material from publicly available sources."
            />
            <StandardRow
              icon={CheckCircle2}
              title="Source traceability"
              body="Material findings remain tied to supporting evidence."
            />
            <StandardRow
              icon={ShieldCheck}
              title="Uncertainty disclosed"
              body="Limitations and unresolved claims are stated plainly."
            />
            <StandardRow
              icon={UserCheck}
              title="Human review required"
              body="No dossier should be treated as an automatic verdict."
            />
          </div>
          <Button asChild variant="ghost" className="mt-5 h-auto p-0 text-sm">
            <Link to="/settings">
              Read review standards
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
};

const WorkspaceMetric = ({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: string;
}) => (
  <div className="bg-background px-4 py-5 md:px-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
    <p className="mt-3 text-3xl font-medium tracking-[-0.04em]">{value}</p>
    <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
  </div>
);

const EmptyState = ({
  hasRows,
  onRunDemo,
}: {
  hasRows: boolean;
  onRunDemo: () => void;
}) => (
  <div className="grid min-h-[360px] place-items-center border-b border-border py-14 text-center">
    <div className="max-w-md">
      <img
        src="/specter-logo.png"
        alt=""
        className="mx-auto h-24 w-24 scale-[2.1] object-contain opacity-80"
      />
      <h2 className="mt-4 text-2xl font-medium">
        {hasRows ? "No dossiers match this view" : "Your review workspace is ready"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {hasRows
          ? "Try another search or review status."
          : "Open a sample dossier or begin a new public-evidence review."}
      </p>
      {!hasRows && (
        <Button onClick={onRunDemo} variant="outline" className="mt-6">
          <FlaskConical className="mr-2 h-4 w-4" />
          Open sample dossier
        </Button>
      )}
    </div>
  </div>
);

const StandardRow = ({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) => (
  <div className="flex gap-3 py-4">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: InvestigationListItem["status"] }) => {
  const styles = {
    pending: "text-muted-foreground",
    running: "text-warning-foreground",
    complete: "text-success-foreground",
    failed: "text-destructive-foreground",
  };
  const labels = {
    pending: "Queued",
    running: "In review",
    complete: "Complete",
    failed: "Needs attention",
  };
  return (
    <span className={`flex items-center gap-2 text-xs ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
};

export default InvestigationsListPage;
