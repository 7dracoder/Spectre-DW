import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SpecterBrand from "@/components/specter/SpecterBrand";

const METHODOLOGY = [
  {
    number: "01",
    title: "Establish the footprint",
    body: "Identify relevant public profiles, publications, repositories, and dated activity tied to the subject.",
  },
  {
    number: "02",
    title: "Reconstruct the timeline",
    body: "Arrange public evidence chronologically to reveal continuity, gaps, bursts, and changes in claimed expertise.",
  },
  {
    number: "03",
    title: "Compare the evidence",
    body: "Examine cross-platform consistency, authorship patterns, and whether public work supports material claims.",
  },
  {
    number: "04",
    title: "Review the dossier",
    body: "Receive a source-linked assessment that separates supporting evidence, open questions, and next checks.",
  },
];

const LandingPage = () => {
  const { user, demoMode } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const ctaTo = user ? "/investigate" : "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-colors ${
          scrolled
            ? "border-b border-border bg-background/95 backdrop-blur"
            : "border-b border-transparent bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <SpecterBrand size="md" />
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#method" className="transition-colors hover:text-foreground">
              Method
            </a>
            <a href="#standards" className="transition-colors hover:text-foreground">
              Standards
            </a>
          </div>
          <div className="flex items-center gap-2">
            {!demoMode && !user && (
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              <Link to={ctaTo}>
                Start investigation
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section id="product" className="relative overflow-hidden border-b border-border pt-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-24">
            <div className="max-w-xl">
              <h1 className="text-[3.35rem] font-medium leading-[0.98] tracking-[-0.045em] md:text-7xl">
                See the history
                <br />
                behind the profile.
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                Specter reviews public evidence across time, helping you understand
                whether a digital identity reflects a coherent, evolving body of work
                before consequential decisions are made.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-foreground px-6 text-background hover:bg-foreground/90"
                >
                  <Link to={ctaTo}>
                    Start an investigation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <a href="#method">View methodology</a>
                </Button>
              </div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                Public evidence only. Source-linked findings. Human review required.
              </p>
            </div>

            <DossierPreview />
          </div>

          <div className="border-t border-border">
            <div className="mx-auto grid max-w-7xl divide-y divide-border px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
              <TrustPoint
                icon={FileSearch}
                title="Public evidence only"
                body="Reviews are limited to relevant, publicly available material."
              />
              <TrustPoint
                icon={CheckCircle2}
                title="Source-linked findings"
                body="Material observations remain connected to their supporting evidence."
              />
              <TrustPoint
                icon={Scale}
                title="Uncertainty made explicit"
                body="Open questions and limitations are shown alongside supporting signals."
              />
            </div>
          </div>
        </section>

        <section id="method" className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                  Methodology
                </p>
                <h2 className="mt-4 text-4xl font-medium tracking-[-0.03em] md:text-5xl">
                  A disciplined review of public identity history.
                </h2>
              </div>
              <p className="max-w-2xl self-end text-base leading-7 text-muted-foreground">
                A polished profile is a moment in time. Specter looks for continuity:
                how claims, activity, language, and public work develop across years
                and contexts.
              </p>
            </div>

            <div className="divide-y divide-border">
              {METHODOLOGY.map((item) => (
                <article
                  key={item.number}
                  className="grid gap-4 py-8 md:grid-cols-[90px_0.8fr_1.2fr] md:items-start md:py-10"
                >
                  <span className="font-mono text-xs text-primary">{item.number}</span>
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">{item.title}</h3>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="standards" className="border-y border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-24">
            <div>
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-6 max-w-xl text-4xl font-medium tracking-[-0.03em] md:text-5xl">
                Built for careful decisions, not automatic verdicts.
              </h2>
            </div>
            <div className="space-y-6 text-sm leading-7 text-background/70">
              <p>
                Specter surfaces consistency signals and uncertainty. It does not
                determine identity, intent, ability, or worth.
              </p>
              <p>
                Every dossier is designed to support further verification through
                interviews, references, work samples, and direct identity checks.
              </p>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="mt-2 h-12 bg-background text-foreground hover:bg-background/90"
              >
                <Link to={ctaTo}>Begin a review</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 text-center md:py-32">
          <div className="mx-auto max-w-3xl px-5">
            <Fingerprint className="mx-auto h-6 w-6 text-primary" />
            <h2 className="mt-6 text-4xl font-medium tracking-[-0.035em] md:text-6xl">
              Review the evidence, not just the presentation.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              Start with a name and a few public identifiers. Specter assembles the
              chronology, signals, sources, and unresolved questions into one dossier.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-9 h-12 bg-foreground px-7 text-background hover:bg-foreground/90"
            >
              <Link to={ctaTo}>
                Start an investigation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <SpecterBrand size="sm" />
          <p>Public evidence intelligence for responsible human review.</p>
          <p>Signals, not verdicts.</p>
        </div>
      </footer>
    </div>
  );
};

const TrustPoint = ({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) => (
  <div className="flex gap-4 py-7 md:px-7">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  </div>
);

const DossierPreview = () => {
  const points = Array.from({ length: 34 }, (_, index) => ({
    cx: 12 + ((index * 19) % 76),
    cy: 18 + ((index * 31) % 64),
    r: index % 7 === 0 ? 2.6 : 1.8,
  }));

  return (
    <div className="relative">
      <div className="overflow-hidden border border-border bg-card shadow-[0_24px_80px_hsl(20_14%_14%/0.08)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Final dossier</p>
            <p className="mt-1 text-sm font-medium">Maya Chen</p>
          </div>
          <span className="text-[10px] text-muted-foreground">Review complete</span>
        </div>

        <div className="grid border-b border-border md:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-border p-6 md:border-b-0 md:border-r">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Consistency score
            </p>
            <p className="mt-4 text-6xl font-medium tracking-[-0.06em]">82</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Strong continuity with two items requiring review.
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Writing pattern
                </p>
                <p className="mt-1 text-sm font-medium">Four stable context clusters</p>
              </div>
              <span className="text-[10px] text-muted-foreground">54 samples</span>
            </div>
            <svg viewBox="0 0 100 72" className="mt-4 h-36 w-full border border-border bg-background">
              <path d="M0 24H100M0 48H100M33 0V72M66 0V72" stroke="hsl(var(--border))" strokeWidth=".35" />
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.cx}
                  cy={point.cy}
                  r={point.r}
                  fill={index % 9 === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                  opacity={index % 9 === 0 ? 0.85 : 0.28}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="border-b border-border p-5 md:border-b-0 md:border-r">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Signal balance
            </p>
            <div className="mt-4 space-y-3">
              <PreviewSignal label="Timeline continuity" score="87" />
              <PreviewSignal label="Cross-platform coherence" score="84" />
              <PreviewSignal label="Claim support" score="74" />
            </div>
          </div>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Evidence timeline
            </p>
            <div className="mt-4 space-y-4">
              {[
                ["2021", "Early public work established"],
                ["2023", "Expertise broadens gradually"],
                ["2025", "Recent claims require follow-up"],
              ].map(([year, label]) => (
                <div key={year} className="grid grid-cols-[42px_1fr] gap-3 text-xs">
                  <span className="font-mono text-primary">{year}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewSignal = ({ label, score }: { label: string; score: string }) => (
  <div>
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <span className="font-mono text-muted-foreground">{score}</span>
    </div>
    <div className="mt-1.5 h-px bg-border">
      <div className="h-px bg-primary" style={{ width: `${score}%` }} />
    </div>
  </div>
);

export default LandingPage;
