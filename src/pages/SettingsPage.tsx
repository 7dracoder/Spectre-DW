import {
  AudioLines,
  CheckCircle2,
  Eye,
  FileCheck2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { demoMode } from "@/integrations/spacetimedb/client";

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Public evidence only",
    body: "Reviews are limited to material that is relevant and publicly available. Private access, impersonation, and covert collection are outside the product standard.",
  },
  {
    icon: FileCheck2,
    title: "Traceable findings",
    body: "Material observations are presented with their supporting sources so reviewers can inspect context rather than rely on a black-box conclusion.",
  },
  {
    icon: Scale,
    title: "Proportionate language",
    body: "The dossier distinguishes evidence, inference, uncertainty, and recommendation. It avoids definitive claims that the evidence cannot support.",
  },
  {
    icon: UserCheck,
    title: "Human review required",
    body: "Specter supports professional judgment. It should never be the sole basis for hiring, investment, access, safety, or reputational decisions.",
  },
];

const SettingsPage = () => (
  <div className="mx-auto max-w-6xl py-6 md:py-10">
    <header className="grid gap-7 border-b border-border pb-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Review standards
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.035em] md:text-5xl">
          A clear standard for responsible public-evidence review.
        </h1>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">
        Specter is designed to help reviewers see what the public record supports,
        what remains unresolved, and where direct verification is still necessary.
      </p>
    </header>

    <section className="divide-y divide-border border-b border-border">
      {PRINCIPLES.map((principle) => {
        const Icon = principle.icon;
        return (
          <article
            key={principle.title}
            className="grid gap-4 py-7 md:grid-cols-[48px_240px_1fr] md:items-start md:gap-7 md:py-8"
          >
            <span className="grid h-10 w-10 place-items-center border border-border bg-card">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <h2 className="text-xl font-medium tracking-[-0.02em] md:pt-2">
              {principle.title}
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:pt-1">
              {principle.body}
            </p>
          </article>
        );
      })}
    </section>

    <div className="grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Assessment boundaries
        </p>
        <h2 className="mt-4 text-3xl font-medium tracking-[-0.025em]">
          What a dossier can and cannot tell you.
        </h2>
        <div className="mt-7 divide-y divide-border border-y border-border">
          {[
            [
              "A dossier can surface",
              "chronology, cross-platform coherence, claim support, writing-pattern variation, evidence gaps, and items for follow-up.",
            ],
            [
              "A dossier cannot determine",
              "a person's intent, protected traits, private conduct, moral worth, future performance, or definitive authenticity.",
            ],
            [
              "A responsible next step includes",
              "direct identity checks, interviews, references, original work samples, and review of each cited source in context.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="grid gap-2 py-5 md:grid-cols-[190px_1fr]">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Workspace safeguards</p>
        </div>
        <div className="mt-6 space-y-5">
          <Safeguard
            icon={LockKeyhole}
            title="Private workspace"
            body="Your investigation workspace is separated from public report sources."
          />
          <Safeguard
            icon={AudioLines}
            title="Evidence-grounded briefings"
            body="Voice conversations are constrained to the active dossier and its stated limitations."
          />
          <Safeguard
            icon={CheckCircle2}
            title="Review posture"
            body="Every report carries a visible reminder that consequential decisions require manual verification."
          />
        </div>
        <div className="mt-7 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Workspace status
          </p>
          <p className="mt-2 text-sm font-medium">
            {demoMode ? "Sample workspace" : "Investigator workspace"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {demoMode
              ? "Sample evidence is clearly labeled throughout the review."
              : "Live reviews and dossier briefings are available."}
          </p>
        </div>
      </aside>
    </div>
  </div>
);

const Safeguard = ({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  </div>
);

export default SettingsPage;
