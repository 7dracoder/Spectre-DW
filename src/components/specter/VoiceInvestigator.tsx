import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AudioWaveform,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  askInvestigation,
  finishVoiceSession,
  getElevenlabsConversationToken,
  getInvestigationOperations,
  startVoiceSession,
} from "@/lib/investigationApi";
import type { InvestigationRecord } from "@/types/investigation";

const buildBriefing = (record: InvestigationRecord) =>
  [
    `${record.subject_name} has a public evidence consistency score of ${record.consistency_score ?? 0} out of 100.`,
    `Evidence confidence is ${record.evidence_confidence_score ?? record.consistency_score ?? 0} out of 100.`,
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
    limitations: record.limitations || [],
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
    sources: record.sources.slice(0, 8).map((source) => ({
      id: source.id,
      title: source.title,
      platform: source.platform,
      url: source.url,
      identity_match_score: source.identity_match_score ?? null,
      source_quality_score: source.source_quality_score ?? null,
      date_confidence: source.date_confidence || "unknown",
    })),
  });

const SOFT_VOICE_NAMES = [
  "samantha",
  "victoria",
  "zira",
  "aria",
  "jenny",
  "sonia",
  "ava",
  "serena",
  "female",
];

const selectSoftBrowserVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return (
        voice.lang.toLowerCase().startsWith("en") &&
        SOFT_VOICE_NAMES.some((candidate) => name.includes(candidate))
      );
    }) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
    null
  );
};

const VoiceInvestigator = ({ record }: { record: InvestigationRecord }) => {
  const { demoMode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [briefingSpeaking, setBriefingSpeaking] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [textReplying, setTextReplying] = useState(false);
  const [voiceCapability, setVoiceCapability] = useState<
    "loading" | "ready" | "setup_required"
  >(demoMode ? "ready" : "loading");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "agent"; message: string }>
  >([]);
  const sessionIdRef = useRef<string | null>(null);
  const contextSentRef = useRef(false);
  const dossierContext = useMemo(() => buildDossierContext(record), [record]);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    getInvestigationOperations(record)
      .then((operations) => {
        if (!active) return;
        const readiness = [...operations]
          .reverse()
          .find((operation) => operation.capability === "voice_readiness");
        setVoiceCapability(readiness?.status === "ready" ? "ready" : "setup_required");
      })
      .catch(() => {
        if (active) setVoiceCapability("setup_required");
      });
    return () => {
      active = false;
    };
  }, [demoMode, record]);

  const conversation = useConversation({
    onError: (message) => {
      setError(typeof message === "string" ? message : "Voice session failed.");
    },
    onMessage: ({ role, message }) => {
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last?.role === role && last.message === message) return current;
        return [...current.slice(-9), { role, message }];
      });
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
        "Cite source titles or source IDs when making factual claims.",
        "State evidence limits before answering beyond the retained record.",
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

  const startBrowserBriefing = () => {
    setError(null);
    setNotice(null);
    setMessages([
      {
        role: "agent",
        message: `Briefing prepared for ${record.subject_name}. The score is ${record.consistency_score ?? 0} out of 100, with ${record.concerns.length} open questions.`,
      },
    ]);
    if (!("speechSynthesis" in window)) {
      setNotice(
        "Audio playback is unavailable in this browser. Briefing is shown in the transcript.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildBriefing(record));
    const preferredVoice = selectSoftBrowserVoice();
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1.04;
    utterance.volume = 0.9;
    utterance.onend = () => setBriefingSpeaking(false);
    utterance.onerror = () => {
      setBriefingSpeaking(false);
      setNotice(
        "Audio playback is unavailable in this browser. Briefing is shown in the transcript.",
      );
    };
    setBriefingSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopBrowserBriefing = () => {
    window.speechSynthesis.cancel();
    setBriefingSpeaking(false);
  };

  const startLiveSession = async () => {
    setError(null);
    setNotice(null);
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach((track) => track.stop());

      const token = await getElevenlabsConversationToken(record.id);
      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;
      contextSentRef.current = false;
      await startVoiceSession(sessionId, record.id);

      await conversation.startSession({
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
    } catch (sessionError) {
      const detail =
        sessionError instanceof Error ? sessionError.message.toLowerCase() : "";
      setNotice(
        detail.includes("missing_permissions") ||
          detail.includes("convai_write") ||
          detail.includes("401")
          ? "ElevenLabs rejected the session token. Enable Conversational AI / Agents: Write for the configured API key."
          : detail.includes("permission") || detail.includes("microphone")
            ? "Microphone access was not granted. Allow microphone access, then try again."
            : "Live conversation could not start. Browser briefing and typed conversation remain available.",
      );
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
  const active = connected || briefingSpeaking;
  const liveVoiceReady = voiceCapability === "ready";
  const promptQuestions = [
    "Brief me on the strongest signal.",
    "What remains unresolved?",
    "What should I verify next?",
  ];

  const sendMessage = async (message: string) => {
    const normalized = message.trim();
    if (!normalized || textReplying) return;
    setMessages((current) => [
      ...current.slice(-9),
      { role: "user", message: normalized },
    ]);
    setTypedMessage("");
    if (connected) {
      conversation.sendUserMessage(normalized);
      return;
    }

    setTextReplying(true);
    setError(null);
    try {
      const answer = await askInvestigation(record, normalized);
      const limitations = answer.limitations?.length
        ? ` Limits: ${answer.limitations.join(" ")}`
        : "";
      setMessages((current) => [
        ...current.slice(-9),
        { role: "agent", message: `${answer.answer}${limitations}` },
      ]);
    } catch {
      setError("The conversational investigator could not answer. Please try again.");
    } finally {
      setTextReplying(false);
    }
  };

  const submitTypedMessage = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(typedMessage);
  };

  return (
    <section
      id="voice"
      className="report-reveal scroll-mt-24 overflow-hidden border border-border bg-card shadow-[0_10px_34px_hsl(20_14%_14%/0.025)]"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-medium">Conversational investigator</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Speak naturally or type during a private, evidence-grounded session.
            Soft voice briefing remains available before live access is configured.
          </p>
        </div>
        <span className="flex items-center gap-2 border border-border bg-background px-2.5 py-1.5 text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              active ? "animate-pulse bg-success-primary" : "bg-muted-foreground/50"
            }`}
          />
          {conversation.status === "connected"
              ? "Session active"
              : conversation.status === "connecting"
                ? "Connecting"
                : voiceCapability === "loading"
                  ? "Checking voice"
                  : liveVoiceReady && !demoMode
                    ? "Live voice ready"
                    : "Briefing ready"}
        </span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r md:p-6">
          <div className="relative overflow-hidden border border-border bg-background px-4 py-6">
            <div className="flex h-24 items-center justify-center gap-1">
              {Array.from({ length: 52 }, (_, index) => (
                <span
                  key={index}
                  className={`voice-wave-bar w-1 rounded-full ${
                    active ? "bg-primary" : "bg-muted-foreground/25"
                  }`}
                  style={{
                    height: `${14 + ((index * 17) % 58)}px`,
                    animationDelay: `${index * 32}ms`,
                    animationPlayState: active ? "running" : "paused",
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AudioWaveform className="h-3.5 w-3.5 text-primary" />
                {active
                  ? connected && conversation.isSpeaking
                    ? "Investigator speaking"
                    : "Listening for your question"
                  : "Ready for an evidence briefing"}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {record.sources.length} sources loaded
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {connected ? (
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
            ) : briefingSpeaking ? (
                <Button onClick={stopBrowserBriefing} variant="outline">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Stop briefing
                </Button>
            ) : (
              <>
                <Button onClick={startBrowserBriefing}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Play briefing
                </Button>
                {!demoMode && liveVoiceReady && (
                  <Button
                    variant="outline"
                    onClick={startLiveSession}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    Start live conversation
                  </Button>
                )}
              </>
            )}
          </div>
          {!demoMode &&
            voiceCapability !== "loading" &&
            !liveVoiceReady && (
              <p className="mt-3 text-xs text-muted-foreground">
                Private live voice setup is pending. Browser briefing is ready now.
              </p>
            )}
        </div>

        <aside className="p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Conversation prompts
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {promptQuestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={textReplying}
                onClick={() => {
                  void sendMessage(prompt);
                }}
                className="flex w-full items-center justify-between border border-border bg-background px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors enabled:hover:border-primary/30 enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55"
              >
                {prompt}
                <Send className="h-3 w-3" />
              </button>
            ))}
          </div>
          <form onSubmit={submitTypedMessage} className="relative mt-3">
            <Input
              value={typedMessage}
              onChange={(event) => {
                setTypedMessage(event.target.value);
                if (connected) conversation.sendUserActivity();
              }}
              disabled={textReplying}
              placeholder={
                connected
                  ? "Ask by voice or type a question..."
                  : "Type a question about this dossier..."
              }
              maxLength={500}
              className="h-11 bg-background pr-12 text-xs"
            />
            <Button
              type="submit"
              size="icon"
              disabled={textReplying || !typedMessage.trim()}
              className="absolute right-1 top-1 h-9 w-9 rounded-sm"
              aria-label="Send message"
            >
              {textReplying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Live transcript
            </p>
            <div className="mt-3 max-h-36 space-y-3 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className="text-xs leading-5">
                    <span className="mr-2 font-medium capitalize text-foreground">
                      {message.role === "agent" ? "Investigator" : "You"}
                    </span>
                    <span className="text-muted-foreground">{message.message}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-5 text-muted-foreground">
                  Transcript appears here once the session begins.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {error && (
        <p className="border-t border-border px-5 py-3 text-xs text-destructive-primary md:px-6">
          {error}
        </p>
      )}
      {notice && (
        <p className="border-t border-border bg-secondary/30 px-5 py-3 text-xs text-muted-foreground md:px-6">
          {notice}
        </p>
      )}
    </section>
  );
};

export default VoiceInvestigator;
