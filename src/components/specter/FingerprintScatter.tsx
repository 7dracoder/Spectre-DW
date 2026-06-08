import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { FingerprintPoint } from "@/types/investigation";

const CLUSTER_COLORS = ["#c84c2f", "#277f7a", "#7156a8", "#ba7a13", "#376f9f"];
const PLATFORM_COLORS: Record<string, string> = {
  GitHub: "#252525",
  Website: "#c84c2f",
  X: "#376f9f",
  LinkedIn: "#277f7a",
};
const YEAR_COLORS = ["#c84c2f", "#d88750", "#9b877a", "#517f83", "#334d67"];

type ColorMode = "cluster" | "platform" | "year";

const FingerprintScatter = ({ points }: { points: FingerprintPoint[] }) => {
  const [mode, setMode] = useState<ColorMode>("cluster");
  const [active, setActive] = useState<FingerprintPoint | null>(points[0] ?? null);

  const years = useMemo(
    () =>
      Array.from(
        new Set(points.map((point) => new Date(point.observed_at).getFullYear())),
      ).sort(),
    [points],
  );

  const colorFor = (point: FingerprintPoint) => {
    if (mode === "platform") return PLATFORM_COLORS[point.platform] ?? "#7156a8";
    if (mode === "year") {
      const index = Math.max(0, years.indexOf(new Date(point.observed_at).getFullYear()));
      return YEAR_COLORS[index % YEAR_COLORS.length];
    }
    return CLUSTER_COLORS[point.cluster_label % CLUSTER_COLORS.length];
  };

  if (points.length === 0) {
    return (
      <div className="grid h-[360px] place-items-center border border-dashed border-border bg-background/50">
        <p className="max-w-sm text-center text-xs text-muted-foreground">
          The RunPod writing fingerprint will appear when embeddings are available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="border border-border bg-background/60 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {(["cluster", "platform", "year"] as ColorMode[]).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] capitalize transition-colors",
                  mode === option
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                By {option}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {points.length} samples · 4 clusters · {points.filter((point) => point.is_outlier).length} outliers
          </span>
        </div>
        <svg viewBox="0 0 100 70" className="aspect-[16/9] w-full" role="img">
          <title>Writing fingerprint scatter plot</title>
          <defs>
            <pattern id="fingerprint-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.22"
              />
            </pattern>
          </defs>
          <rect width="100" height="70" fill="url(#fingerprint-grid)" />
          {points.map((point) => (
            <circle
              key={point.id}
              cx={Math.max(3, Math.min(97, point.coord_x))}
              cy={Math.max(3, Math.min(67, point.coord_y * 0.7))}
              r={point.is_outlier ? 2.1 : 1.2 + Math.min(0.8, point.text_length / 1400)}
              fill={colorFor(point)}
              opacity={active?.id === point.id ? 1 : 0.76}
              stroke={point.is_outlier || active?.id === point.id ? "#151515" : "none"}
              strokeWidth={point.is_outlier || active?.id === point.id ? 0.55 : 0}
              className="cursor-pointer transition-opacity hover:opacity-100"
              onMouseEnter={() => setActive(point)}
              onClick={() => setActive(point)}
            />
          ))}
        </svg>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Expression dimension A</span>
          <span>Expression dimension B</span>
        </div>
      </div>

      <aside className="border border-border bg-card p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Selected sample</p>
        {active && (
          <>
            <h3 className="mt-3 text-base font-medium">{active.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span>{active.platform}</span>
              <span>·</span>
              <span>{new Date(active.observed_at).toLocaleDateString()}</span>
              {active.is_outlier && (
                <span className="rounded-full bg-warning px-2 py-0.5 text-warning-foreground">
                  outlier
                </span>
              )}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {active.snippet}
            </p>
            <div className="mt-5 border-t border-border pt-4 text-[11px] text-muted-foreground">
              Cluster {active.cluster_label + 1} · {active.text_length} characters
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default FingerprintScatter;

