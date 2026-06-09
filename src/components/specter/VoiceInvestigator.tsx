import { useEffect, useMemo, useRef, useState } from "react";
import {
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
} from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  finishVoiceSession,
  getElevenlabsConversationToken,
  startVoiceSession,
} from "@/lib/investigationApi";
import type { InvestigationRecord } from "@/types/investigation";

const buildBriefing = (record: InvestigationRecord) =>
  [
    `${record.subject_name} has a human consistency score of ${record.consistency_score ?? 0} out of 100.`,
    record.dossier_summary,
    `Strongest supporting signals: ${record.strengths.join(" ")}`,
    `Questions that remain: ${record.concerns.join(" ")}`,
    `Recommended next steps: ${record.recommendations.join(" ")}`,
    "This is decision support, not a verdict. Consequential decisions require manual verification.",
  ]
    .filter(Boolean)
    .join(" ");

const buildDossierContext = (record: InvestigationRecord) =>
  JSON.stringify({
    subject: record.subject_name,
    score: record.consistency_score,
    confidence: record.confidence_band,
    classification: record.classification,
    summary: record.dossier_summary,
    strengths: record.strengths,
    concerns: record.concerns,
    recommendations: record.recommendations,
    signals: record.signals.map(({ title, score, summary }) => ({
      title,
      score,
      summary,
    })),
    claims: record.claims.map(
      ({ claim_text, support_level, evidence }) => ({
        claim: claim_text,
        support: support_level,
        evidence,
      }),
    ),
  });

const VoiceInvestigator = ({ record }: { record: InvestigationRecord }) => {
  const { demoMode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const contextSentRef = useRef(false);
  const dossierContext = useMemo(() => buildDossierContext(record), [record]);

  const conversation = useConversation({
    onError: (message) => {
      setError(typeof message === "string" ? message : "Voice session failed.");
    },
  });

  useEffect(() => {
    if (conversation.status !== "connected" || contextSentRef.current) return;
    contextSentRef.current = true;
    conversation.sendContextualUpdate(
      [
        "You are the Spectre dossier investigator.",
        "Answer only from the evidence below.",
        "Separate observed facts, inferences, uncertainty, and recommended verification.",
        "Never call the subject authentic, fake, deceptive, or safe as a definitive verdict.",
        `DOSSIER: ${dossierContext}`,
      ].join("\n"),
    );
  }, [conversation, dossierContext]);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
      if (sessionIdRef.current) {
        void finishVoiceSession(sessionIdRef.current);
      }
    },
    [],
  );

  const startDemoBriefing = () => {
    if (!("speechSynthesis" in window)) {
      setError("Speech synthesis is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildBriefing(record));
    utterance.rate = 0.96;
    utterance.onend = () => setDemoSpeaking(false);
    utterance.onerror = () => {
      setDemoSpeaking(false);
      setError("The browser could not play the voice briefing.");
    };
    setDemoSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopDemoBriefing = () => {
    window.speechSynthesis.cancel();
    setDemoSpeaking(false);
  };

  const startLiveSession = async () => {
    setError(null);
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach((track) => track.stop());

      const token = await getElevenlabsConversationToken(record.id);
      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;
      contextSentRef.current = false;
      await startVoiceSession(sessionId, record.id);

      conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        userId: record.created_by || undefined,
        dynamicVariables: {
          subject_name: record.subject_name,
          consistency_score: record.consistency_score ?? 0,
          confidence_band: record.confidence_band || "unknown",
          classification: record.classification || "unclassified",
          dossier_summary: record.dossier_summary || "",
        },
      });
    } catch {
      setError("The dossier briefing is not available yet. Please try again later.");
      if (sessionIdRef.current) {
        await finishVoiceSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    }
  };

  const endLiveSession = async () => {
    conversation.endSession();
    if (sessionIdRef.current) {
      await finishVoiceSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }
    contextSentRef.current = false;
  };

  const connected = conversation.status === "connected";
  const connecting = conversation.status === "connecting";

  return (
    <section className="border border-border bg-card p-5 shadow-[0_10px_34px_hsl(20_14%_14%/0.025)] md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-medium">Dossier briefing</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Ask about the score, supporting evidence, unresolved claims, and
            recommended verification. Answers remain grounded in this dossier.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground">
          {demoMode
            ? "Sample briefing"
            : conversation.status === "connected"
              ? "Session active"
              : conversation.status === "connecting"
                ? "Connecting"
                : "Available"}
        </span>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {demoMode ? (
          demoSpeaking ? (
            <Button onClick={stopDemoBriefing} variant="outline">
              <PhoneOff className="mr-2 h-4 w-4" />
              Stop briefing
            </Button>
          ) : (
            <Button onClick={startDemoBriefing}>
              <Volume2 className="mr-2 h-4 w-4" />
              Preview briefing
            </Button>
          )
        ) : connected ? (
          <>
            <Button
              variant="outline"
              onClick={() => conversation.setMuted(!conversation.isMuted)}
            >
              {conversation.isMuted ? (
                <MicOff className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {conversation.isMuted ? "Unmute" : "Mute"}
            </Button>
            <Button variant="destructive" onClick={endLiveSession}>
              <PhoneOff className="mr-2 h-4 w-4" />
              End session
            </Button>
          </>
        ) : (
          <Button onClick={startLiveSession} disabled={connecting}>
            {connecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            Start conversation
          </Button>
        )}

        {connected && (
          <span className="text-xs text-muted-foreground">
            {conversation.isSpeaking ? "Briefing in progress" : "Listening"}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-4 border-l-2 border-destructive-primary pl-3 text-xs text-destructive-primary">
          {error}
        </p>
      )}
    </section>
  );
};

export default VoiceInvestigator;
