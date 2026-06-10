import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvestigationRecord } from "@/types/investigation";

const TimelinePlayback = ({ record }: { record: InvestigationRecord }) => {
  const events = useMemo(
    () => [...record.timeline].sort((a, b) => a.date.localeCompare(b.date)),
    [record.timeline],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || events.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= events.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1450);
    return () => window.clearInterval(timer);
  }, [events.length, playing]);

  if (!events.length) return null;

  const active = events[activeIndex];
  const progress = events.length === 1 ? 100 : (activeIndex / (events.length - 1)) * 100;

  return (
    <section
      id="timeline"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
        <div>
          <h2 className="text-xl font-medium">Chronology playback</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Move through the public record in time order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveIndex(0);
              setPlaying(false);
            }}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (activeIndex === events.length - 1) setActiveIndex(0);
              setPlaying((current) => !current);
            }}
          >
            {playing ? (
              <Pause className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5" />
            )}
            {playing ? "Pause" : "Playback"}
          </Button>
        </div>
      </header>

      <div className="p-5 md:p-6">
        <div className="relative pt-8">
          <div className="absolute left-0 right-0 top-[42px] h-px bg-border" />
          <div
            className="absolute left-0 top-[42px] h-px bg-primary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          <div className="grid" style={{ gridTemplateColumns: `repeat(${events.length}, minmax(52px, 1fr))` }}>
            {events.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setPlaying(false);
                }}
                className="group relative flex min-w-0 flex-col items-center text-center"
              >
                <span className="mb-4 font-mono text-[10px] text-muted-foreground">
                  {new Date(event.date).getFullYear()}
                </span>
                <span
                  className={`relative z-10 h-3 w-3 rounded-full border-2 transition-all ${
                    index <= activeIndex
                      ? "border-primary bg-primary"
                      : "border-border bg-card group-hover:border-primary/50"
                  } ${index === activeIndex ? "timeline-active-dot scale-125" : ""}`}
                />
              </button>
            ))}
          </div>
        </div>

        <article className="mt-8 grid gap-5 border border-border bg-background p-5 md:grid-cols-[120px_1fr_auto] md:items-start">
          <div>
            <p className="font-mono text-xs text-primary">
              {new Date(active.date).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {active.platform}
            </p>
          </div>
          <div className="animate-in fade-in slide-in-from-right-2 duration-300" key={active.id}>
            <h3 className="text-lg font-medium">{active.title}</h3>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
              {active.summary}
            </p>
          </div>
          <a
            href={active.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Inspect
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </article>
      </div>
    </section>
  );
};

export default TimelinePlayback;
