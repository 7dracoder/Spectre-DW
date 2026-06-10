import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  FlaskConical,
  Loader2,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createInvestigation } from "@/lib/investigationApi";

const schema = z
  .object({
    subject_name: z.string().trim().min(1, "Name is required").max(120),
    github_username: z.string().trim().max(60).optional().or(z.literal("")),
    x_handle: z.string().trim().max(60).optional().or(z.literal("")),
    linkedin_url: z.string().trim().url("Must be a URL").max(500).optional().or(z.literal("")),
    website_url: z.string().trim().url("Must be a URL").max(500).optional().or(z.literal("")),
    other_profile_url: z.string().trim().url("Must be a URL").max(500).optional().or(z.literal("")),
    context: z.string().min(1, "Pick a context"),
    notes: z.string().max(2000).optional().or(z.literal("")),
    consent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  })
  .refine(
    (value) =>
      value.github_username ||
      value.x_handle ||
      value.linkedin_url ||
      value.website_url ||
      value.other_profile_url,
    { message: "Provide at least one public identifier", path: ["github_username"] },
  );

const CONTEXTS = [
  { value: "hiring", label: "Hiring or contracting" },
  { value: "diligence", label: "Investment diligence" },
  { value: "journalism", label: "Journalism or research" },
  { value: "client_vetting", label: "Client or partner vetting" },
  { value: "personal", label: "Personal research" },
];

const emptyForm = {
  subject_name: "",
  github_username: "",
  x_handle: "",
  linkedin_url: "",
  website_url: "",
  other_profile_url: "",
  context: "",
  notes: "",
  consent: false,
};

const demoForm = {
  subject_name: "Maya Chen",
  github_username: "maya-builds",
  x_handle: "@mayachen",
  linkedin_url: "https://www.linkedin.com",
  website_url: "https://example.com/maya",
  other_profile_url: "https://example.com/maya/writing",
  context: "hiring",
  notes: "Demo subject with a multi-year public engineering and writing footprint.",
  consent: true,
};

const InvestigatePage = () => {
  const navigate = useNavigate();
  const { user, demoMode } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const identifiers = [
    ["GitHub", form.github_username],
    ["X / Twitter", form.x_handle],
    ["Website", form.website_url],
    ["LinkedIn", form.linkedin_url],
    ["Other profile", form.other_profile_url],
  ].filter(([, value]) => Boolean(value.trim()));
  const readiness = Math.min(
    100,
    (form.subject_name ? 20 : 0) +
      identifiers.length * 12 +
      (form.context ? 12 : 0) +
      (form.notes ? 8 : 0),
  );

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const record = await createInvestigation(
        {
          subject_name: parsed.data.subject_name,
          github_username: parsed.data.github_username,
          x_handle: parsed.data.x_handle,
          linkedin_url: parsed.data.linkedin_url,
          website_url: parsed.data.website_url,
          other_profile_url: parsed.data.other_profile_url,
          context: parsed.data.context,
          notes: parsed.data.notes,
        },
        user?.id,
      );
      if (!record) throw new Error("Investigation was not created.");
      navigate(`/investigation/${record.id}`);
    } catch {
      toast({
        title: "Could not start investigation",
        description: "The review could not be started. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-10 md:py-14">
      <header className="mb-10 grid gap-4 border-b border-border pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">New investigation</p>
          <h1 className="mt-2 text-4xl font-medium tracking-[-0.03em] md:text-5xl">
            Begin a public identity review.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Add a name and relevant public identifiers. Specter reconstructs the
            subject's public history and organizes the evidence for careful review.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setForm(demoForm)}
          className="gap-2"
        >
          <FlaskConical className="h-4 w-4" />
          Load demo subject
        </Button>
      </header>

      {demoMode && (
        <div className="mb-6 border-l-2 border-primary bg-accent/50 px-4 py-3 text-xs text-accent-foreground">
          Sample workspace is active. Evidence in sample dossiers is simulated
          and clearly labeled throughout the review.
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_310px]">
        <form onSubmit={handleSubmit} className="space-y-7">
        <Field
          htmlFor="subject-name"
          label="Full name"
          required
          error={errors.subject_name}
          hint="The person's full or commonly used public name."
        >
          <Input
            id="subject-name"
            value={form.subject_name}
            onChange={(event) => set("subject_name", event.target.value)}
            placeholder="Jane Doe"
            maxLength={120}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            htmlFor="github-username"
            label="GitHub username"
            error={errors.github_username}
          >
            <Input
              id="github-username"
              value={form.github_username}
              onChange={(event) => set("github_username", event.target.value)}
              placeholder="janedoe"
            />
          </Field>
          <Field htmlFor="x-handle" label="X / Twitter handle">
            <Input
              id="x-handle"
              value={form.x_handle}
              onChange={(event) => set("x_handle", event.target.value)}
              placeholder="@janedoe"
            />
          </Field>
        </div>

        <Field
          htmlFor="website-url"
          label="Personal website"
          error={errors.website_url}
        >
          <Input
            id="website-url"
            value={form.website_url}
            onChange={(event) => set("website_url", event.target.value)}
            placeholder="https://janedoe.com"
            type="url"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            htmlFor="linkedin-url"
            label="LinkedIn URL"
            error={errors.linkedin_url}
          >
            <Input
              id="linkedin-url"
              value={form.linkedin_url}
              onChange={(event) => set("linkedin_url", event.target.value)}
              placeholder="https://linkedin.com/in/janedoe"
              type="url"
            />
          </Field>
          <Field
            htmlFor="other-profile-url"
            label="Other public profile"
            error={errors.other_profile_url}
          >
            <Input
              id="other-profile-url"
              value={form.other_profile_url}
              onChange={(event) => set("other_profile_url", event.target.value)}
              placeholder="https://substack.com/@janedoe"
              type="url"
            />
          </Field>
        </div>

        <Field
          htmlFor="investigation-context"
          label="Investigation context"
          required
          error={errors.context}
        >
          <Select value={form.context} onValueChange={(value) => set("context", value)}>
            <SelectTrigger id="investigation-context">
              <SelectValue placeholder="Why are you investigating?" />
            </SelectTrigger>
            <SelectContent>
              {CONTEXTS.map((context) => (
                <SelectItem key={context.value} value={context.value}>
                  {context.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          htmlFor="investigation-notes"
          label="Notes"
          hint="Optional context or claims you want the dossier to examine."
        >
          <Textarea
            id="investigation-notes"
            value={form.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Claims eight years of React experience and a senior role since 2022."
            rows={4}
            maxLength={2000}
          />
        </Field>

        <div className="border border-border bg-card p-4">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={form.consent}
              onCheckedChange={(checked) => set("consent", checked === true)}
              className="mt-0.5"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I understand Specter analyzes public information only and returns
              decision-support signals, not a verdict. I will not use this report
              as the sole basis for a consequential decision.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-2 text-xs text-destructive-primary">{errors.consent}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Start analysis
          </Button>
        </div>
        </form>

        <aside className="border border-border bg-card lg:sticky lg:top-24">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                  Review map
                </p>
                <h2 className="mt-2 text-xl font-medium">Coverage readiness</h2>
              </div>
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 flex items-end justify-between">
              <strong className="font-mono text-4xl font-medium">{readiness}</strong>
              <span className="pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                readiness
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden bg-secondary">
              <div
                className="h-full bg-primary transition-[width] duration-500"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>

          <div className="border-b border-border p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Identity anchors
            </p>
            <div className="mt-4 space-y-3">
              {form.subject_name && (
                <ReviewAnchor label="Subject" value={form.subject_name} />
              )}
              {identifiers.map(([label, value]) => (
                <ReviewAnchor key={label} label={label} value={value} />
              ))}
              {!form.subject_name && identifiers.length === 0 && (
                <p className="text-xs leading-5 text-muted-foreground">
                  Add a name and public identifier to begin mapping the subject.
                </p>
              )}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Analysis sequence
            </p>
            <div className="mt-4 space-y-4">
              <ReviewStage
                complete={identifiers.length > 0}
                label="Identity resolution"
              />
              <ReviewStage
                complete={identifiers.length > 1}
                label="Cross-source evidence"
              />
              <ReviewStage
                complete={Boolean(form.context)}
                label="Contextual assessment"
              />
              <ReviewStage complete={form.consent} label="Responsible-use check" />
            </div>
            <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Public evidence stays linked to its source throughout the dossier.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ReviewAnchor = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[76px_1fr] gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate font-mono text-[11px]">{value}</span>
  </div>
);

const ReviewStage = ({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-3">
    {complete ? (
      <CheckCircle2 className="h-4 w-4 text-success-primary" />
    ) : (
      <CircleDotDashed className="h-4 w-4 text-muted-foreground" />
    )}
    <span className={complete ? "text-xs" : "text-xs text-muted-foreground"}>
      {label}
    </span>
  </div>
);

const Field = ({
  htmlFor,
  label,
  required,
  error,
  hint,
  children,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-xs font-medium"
    >
      {label}
      {required && (
        <span aria-hidden="true" className="text-primary">
          *
        </span>
      )}
    </Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-destructive-primary">{error}</p>}
  </div>
);

export default InvestigatePage;
