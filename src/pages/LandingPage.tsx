import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SpecterBrand from "@/components/specter/SpecterBrand";
import {
  ArrowRight,
  Cpu,
  Globe,
  Layers,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const LandingPage = () => {
  const { user, demoMode } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaTo = user ? "/investigate" : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-background/80 backdrop-blur"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <SpecterBrand size="md" />
          <div className="flex items-center gap-2">
            {!demoMode && (
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm" className="h-8 text-xs" onClick={() => navigate(ctaTo)}>
              <Link to={ctaTo}>
                Run investigation
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-24 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 0%, hsl(var(--specter-ember) / 0.18) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div className="text-left">
              <h1 className="font-display font-semibold tracking-[-0.02em] text-5xl md:text-7xl leading-[1.02] text-[hsl(var(--specter-ember))]">
                Trust the person,
                <br />
                <span className="italic text-foreground/90">not the persona.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground">
                Specter reads a person's public digital trail across years and
                platforms, profiles, posts, articles, code, and tells you whether
                the pattern feels like a real, evolving human or a synthetic
                identity assembled with AI.
              </p>
              <div className="mt-10 flex items-center gap-3">
                <Button asChild size="lg" className="h-11 px-5 text-sm">
                  <Link to={ctaTo}>
                    Start an investigation
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-2xl shadow-primary/10">
              <div className="absolute inset-10 rounded-full border border-dashed border-border" />
              <div className="absolute inset-20 rounded-full border border-border" />
              <img
                src="/specter-logo.png"
                alt="Specter ghost mark"
                className="relative z-10 h-full w-full scale-[1.58] object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl px-6">
          <DossierMock />
        </div>
      </section>

      <section className="border-t border-border bg-card/40 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-primary">The problem</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              Synthetic identities are getting harder to tell from real people.
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI can spin up a polished resume, a year of plausible tweets, a
              GitHub history, and a portfolio site in an afternoon. Single-document
              AI detectors aren't enough — trust decisions in 2026 need temporal,
              cross-platform analysis.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldAlert, title: "Hiring & contracting", body: "Verify that a candidate's public output matches their claimed expertise before the first interview." },
              { icon: ScanSearch, title: "Diligence & journalism", body: "Surface inconsistencies in founder, source, or witness digital histories with cited evidence." },
              { icon: Globe, title: "Operator vetting", body: "Assess freelancers, advisors, and partners against a temporal evidence trail, not a profile glance." },
            ].map((c) => (
              <div key={c.title} className="rounded-lg border border-border bg-card p-5">
                <c.icon className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-sm font-medium">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              A four-layer trust pipeline.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {[
              { step: "01", title: "Discover", tool: "Nimble", body: "Live public-web search and structured extraction across profiles, articles, repos, and personal sites." },
              { step: "02", title: "Orchestrate", tool: "Tower", body: "Python pipelines + lakehouse storage normalize raw evidence into queryable signal tables." },
              { step: "03", title: "Analyze", tool: "RunPod", body: "Serverless GPU inference for text embeddings, clustering, and the writing-fingerprint visualization." },
              { step: "04", title: "Narrate", tool: "Gemini 3.5 Flash", body: "A balanced dossier that explains the structured signals with caveats and recommendations." },
            ].map((s) => (
              <div key={s.step} className="bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.step}</span>
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    {s.tool}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40 py-24">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Signature feature</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
              The writing fingerprint.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every text artifact we find for a subject is embedded on a RunPod
              GPU worker, then clustered and projected into a 2D map. Real
              people drift naturally across years and contexts. Synthetic
              identities cluster suspiciously tight.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Color by platform, cluster, or year",
                "Hover any point for source, date, and snippet",
                "Outlier markers for stylistic anomalies",
                "Plain-language summary of the observed pattern",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Cpu className="mt-0.5 h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <FingerprintMock />
        </div>
      </section>

      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Layers className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            Ready to assess someone?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Drop in a name and a few public identifiers. Specter handles the
            rest — discovery, signal extraction, GPU analysis, and a sourced dossier.
          </p>
          <Button asChild size="lg" className="mt-8 h-11 px-5 text-sm">
            <Link to={ctaTo}>
              Start an investigation
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground md:flex-row">
          <SpecterBrand size="sm" />
          <p>Specter analyzes public information only. Outputs are signals, not verdicts.</p>
        </div>
      </footer>
    </div>
  );
};

const DossierMock = () => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Investigation · jane-doe
      </div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
        complete
      </span>
    </div>
    <div className="grid gap-px bg-border md:grid-cols-3">
      <div className="bg-card p-6">
        <p className="text-xs text-muted-foreground">Human Consistency</p>
        <p className="mt-2 text-5xl font-medium tracking-tight tabular-nums">82</p>
        <p className="mt-1 text-xs text-muted-foreground">Confidence: moderate</p>
      </div>
      <div className="bg-card p-6">
        <p className="text-xs text-muted-foreground">Sources analyzed</p>
        <p className="mt-2 text-5xl font-medium tracking-tight tabular-nums">47</p>
        <p className="mt-1 text-xs text-muted-foreground">across 5 platforms · 4 years</p>
      </div>
      <div className="bg-card p-6">
        <p className="text-xs text-muted-foreground">Signals</p>
        <p className="mt-2 text-5xl font-medium tracking-tight tabular-nums">11</p>
        <p className="mt-1 text-xs text-muted-foreground">2 anomalies flagged</p>
      </div>
    </div>
    <div className="border-t border-border p-6">
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground">Summary.</span> This identity shows
        moderate stylistic drift across 4 years, with one unusually uniform
        cluster of recent posts that merits review.
      </p>
    </div>
  </div>
);

const FingerprintMock = () => {
  const points = Array.from({ length: 60 }).map((_, i) => {
    const cluster = i % 4;
    const cx = [25, 65, 40, 75][cluster] + Math.sin(i) * 8;
    const cy = [30, 35, 70, 65][cluster] + Math.cos(i) * 8;
    const colors = ["#e85d3a", "#5cbdb9", "#a78bfa", "#fbbf24"];
    return { cx, cy, color: colors[cluster], r: 2 + (i % 3) };
  });
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <svg viewBox="0 0 100 100" className="aspect-square w-full">
        <defs>
          <pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#g)" />
        {points.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity={0.75} />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Expression dimension A</span>
        <span>n = 60 · 4 clusters</span>
      </div>
    </div>
  );
};

export default LandingPage;
