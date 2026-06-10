import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { InvestigationRecord } from "@/types/investigation";

const ScenarioScoreLab = ({ record }: { record: InvestigationRecord }) => {
  const initialWeights = useMemo(
    () => Object.fromEntries(record.signals.map((signal) => [signal.id, signal.weight])),
    [record.signals],
  );
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const originalScore = record.consistency_score ?? 0;
  const scenarioScore = useMemo(() => {
    const totalWeight = record.signals.reduce(
      (sum, signal) => sum + (weights[signal.id] ?? signal.weight),
      0,
    );
    if (!totalWeight) return originalScore;
    return Math.round(
      record.signals.reduce(
        (sum, signal) =>
          sum + signal.score * (weights[signal.id] ?? signal.weight),
        0,
      ) / totalWeight,
    );
  }, [originalScore, record.signals, weights]);
  const delta = scenarioScore - originalScore;

  return (
    <section
      id="scenarios"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-medium">Scenario score lab</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore how review priorities affect the score. The saved dossier never changes.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeights(initialWeights)}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Reset
        </Button>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="space-y-5 border-b border-border p-5 lg:border-b-0 lg:border-r md:p-6">
          {record.signals.map((signal) => (
            <div key={signal.id} className="grid gap-3 sm:grid-cols-[190px_1fr_52px] sm:items-center">
              <div>
                <p className="text-sm font-medium">{signal.title}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Signal score {signal.score}
                </p>
              </div>
              <Slider
                min={0}
                max={30}
                step={1}
                value={[weights[signal.id] ?? signal.weight]}
                onValueChange={([value]) =>
                  setWeights((current) => ({ ...current, [signal.id]: value }))
                }
                aria-label={`${signal.title} weight`}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-foreground [&_[role=slider]]:bg-card [&_[data-orientation=horizontal]>span]:bg-foreground"
              />
              <span className="text-right font-mono text-xs text-muted-foreground">
                wt {weights[signal.id] ?? signal.weight}
              </span>
            </div>
          ))}
        </div>

        <aside className="flex flex-col justify-between bg-background p-5 md:p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Simulated score
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-medium tracking-[-0.06em] text-primary">
                {scenarioScore}
              </span>
              <span className="pb-2 text-sm text-muted-foreground">/100</span>
            </div>
            <div
              className={`mt-3 inline-flex items-center gap-1.5 text-xs ${
                delta > 0
                  ? "text-success-primary"
                  : delta < 0
                    ? "text-warning-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : delta < 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              {delta === 0 ? "Matches the saved score" : `${delta > 0 ? "+" : ""}${delta} points`}
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <p className="text-xs leading-5 text-muted-foreground">
              This sandbox changes weighting only. It does not add evidence or alter the official dossier.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ScenarioScoreLab;
