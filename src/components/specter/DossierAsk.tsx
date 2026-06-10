import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  askInvestigation,
  type DossierAnswer,
} from "@/lib/investigationApi";
import type { InvestigationRecord } from "@/types/investigation";

const SUGGESTIONS = [
  "What are the strongest supporting signals?",
  "Which claims need the most verification?",
  "What are the main evidence gaps?",
  "What should I verify next?",
];

const DossierAsk = ({ record }: { record: InvestigationRecord }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<DossierAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const citations = useMemo(() => {
    if (!answer) return [];
    const citationIds = new Set(answer.citationIds);
    return record.sources.filter((source) => citationIds.has(source.id));
  }, [answer, record.sources]);

  const submitQuestion = async (nextQuestion: string) => {
    const normalized = nextQuestion.trim();
    if (normalized.length < 4 || loading) return;
    setQuestion(normalized);
    setLoading(true);
    setError(null);
    try {
      setAnswer(await askInvestigation(record, normalized));
    } catch {
      setError("The dossier could not answer that question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(question);
  };

  return (
    <section
      id="ask"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card shadow-[0_18px_55px_hsl(20_14%_14%/0.045)]"
    >
      <header className="grid gap-4 border-b border-border px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-medium">Ask this dossier</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Ask about evidence, claims, uncertainty, or the next verification step.
            Every response stays bounded by this dossier.
          </p>
        </div>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success-primary" />
          Evidence grounded
        </span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(340px,1.15fr)]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r md:p-6">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about the subject..."
              className="h-12 border-border bg-background pl-10 pr-14 text-sm shadow-none"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || question.trim().length < 4}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-sm"
              aria-label="Ask dossier"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </form>

          <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Suggested questions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void submitQuestion(suggestion)}
                className="border border-border bg-background px-3 py-2 text-left text-xs leading-5 text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden p-5 md:p-6">
          <div className="report-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/50" />
          {error ? (
            <div className="grid min-h-[230px] place-items-center text-center">
              <p className="max-w-sm text-sm text-destructive-primary">{error}</p>
            </div>
          ) : answer ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary">
                <BookOpenCheck className="h-3.5 w-3.5" />
                Grounded answer
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground/85">
                {answer.answer}
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Answer confidence: {answer.confidence}
                </p>
                {citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {citations.map((source, index) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        [{index + 1}] {source.platform}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
                {(answer.limitations?.length || 0) > 0 && (
                  <div className="mt-4 border-l-2 border-warning-foreground/45 pl-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Limits
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {answer.limitations.join(" ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[230px] place-items-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center border border-border bg-background">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-sm font-medium">
                  The dossier is ready for questions.
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Answers cite the evidence already collected and disclose when the
                  record is incomplete.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DossierAsk;
