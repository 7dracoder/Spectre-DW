import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FlaskConical, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createFeaturedDemo } from "@/lib/investigationStore";
import { listInvestigations } from "@/lib/investigationApi";
import type { InvestigationListItem } from "@/types/investigation";

const InvestigationsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InvestigationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () =>
      listInvestigations(user?.id).then((data) => {
        if (!active) return;
        setRows(data as InvestigationListItem[]);
        setLoading(false);
      });
    void load();
    window.addEventListener("specter:investigations", load);
    return () => {
      active = false;
      window.removeEventListener("specter:investigations", load);
    };
  }, [user?.id]);

  const runDemo = () => {
    const record = createFeaturedDemo();
    navigate(`/investigation/${record.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-7">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Investigations</p>
          <h1 className="mt-1 text-4xl font-medium tracking-tight">Public identity dossiers</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runDemo}>
            <FlaskConical className="mr-1.5 h-4 w-4" />
            Run demo
          </Button>
          <Button asChild>
            <Link to="/investigate">
              <Plus className="mr-1.5 h-4 w-4" />
              New investigation
            </Link>
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid min-h-[360px] place-items-center border border-dashed border-border bg-card/50 p-10 text-center">
          <div>
            <img
              src="/specter-logo.png"
              alt=""
              className="mx-auto h-28 w-28 scale-[2.2] object-contain"
            />
            <h2 className="mt-3 text-xl font-medium">No dossiers yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start with the built-in demo to see the complete discovery,
              fingerprint, and report flow without provider keys.
            </p>
            <Button onClick={runDemo} className="mt-6">
              <FlaskConical className="mr-1.5 h-4 w-4" />
              Run demo investigation
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden border border-border">
          {rows.map((row, index) => {
            const target =
              row.status === "complete"
                ? `/report/${row.id}`
                : `/investigation/${row.id}`;
            return (
              <Link
                key={row.id}
                to={target}
                className={`group grid gap-4 bg-card px-5 py-5 transition-colors hover:bg-secondary/60 md:grid-cols-[1fr_auto_auto] md:items-center ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{row.subject_name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    {row.context && (
                      <span className="capitalize">{row.context.replace("_", " ")}</span>
                    )}
                    <span>·</span>
                    <span>{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                  <span className="min-w-12 text-right text-3xl font-medium tabular-nums">
                    {row.status === "complete" ? row.consistency_score : "—"}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: InvestigationListItem["status"] }) => {
  const styles = {
    pending: "bg-secondary text-muted-foreground",
    running: "bg-accent text-accent-foreground",
    complete: "bg-success text-success-foreground",
    failed: "bg-destructive text-destructive-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${styles[status]}`}>
      {status}
    </span>
  );
};

export default InvestigationsListPage;

