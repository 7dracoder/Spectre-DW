import {
  connectSpacetime,
  demoMode,
} from "@/integrations/spacetimedb/client";
import {
  createLocalInvestigation,
  deleteLocalInvestigation,
  getLocalInvestigation,
  listLocalInvestigations,
} from "@/lib/investigationStore";
import type {
  InvestigationInput,
  InvestigationListItem,
  InvestigationOperation,
  InvestigationRecord,
} from "@/types/investigation";

export { demoMode };

export type DossierAnswer = {
  answer: string;
  citationIds: string[];
  confidence: string;
  limitations: string[];
  model?: string;
  requestId?: string;
  executionTimeMs?: number;
};

const isLocal = (id: string) => id.startsWith("demo-");

const parseRecord = (value: string): InvestigationRecord | null => {
  try {
    const record = JSON.parse(value) as InvestigationRecord;
    return Array.isArray(record.sources) ? record : null;
  } catch {
    return null;
  }
};

export const createInvestigation = async (
  input: InvestigationInput,
  userId?: string | null,
) => {
  if (demoMode || !userId || userId === "demo-user") {
    return createLocalInvestigation(input);
  }

  const { connection } = await connectSpacetime();
  const id = crypto.randomUUID();
  await connection.reducers.createInvestigation({
    id,
    inputJson: JSON.stringify(input),
  });
  const recordJson = await connection.procedures.runInvestigation({
    investigationId: id,
  });
  const record = parseRecord(recordJson);
  if (!record) throw new Error("The investigation could not be completed.");
  return record;
};

export const listInvestigations = async (
  userId?: string | null,
): Promise<InvestigationListItem[]> => {
  if (demoMode || !userId || userId === "demo-user") {
    return listLocalInvestigations();
  }

  const { connection, identity } = await connectSpacetime();
  return Array.from(connection.db.investigations.iter())
    .filter((row) => row.owner.isEqual(identity))
    .map((row) => {
      const record = parseRecord(row.recordJson);
      return {
        id: row.id,
        subject_name: row.subjectName,
        status: record?.status ?? (row.status as InvestigationListItem["status"]),
        consistency_score:
          record?.consistency_score ?? row.consistencyScore,
        context: row.context,
        created_at: row.createdAt,
        stage_index: record?.stage_index ?? row.stageIndex,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const getInvestigation = async (
  id: string,
): Promise<InvestigationRecord | null> => {
  if (demoMode || isLocal(id)) return getLocalInvestigation(id);

  const { connection, identity } = await connectSpacetime();
  const row = connection.db.investigations.id.find(id);
  if (!row || !row.owner.isEqual(identity)) return null;
  return parseRecord(row.recordJson);
};

export const deleteInvestigation = async (id: string) => {
  if (demoMode || isLocal(id)) {
    deleteLocalInvestigation(id);
    return;
  }

  const { connection } = await connectSpacetime();
  await connection.reducers.deleteInvestigation({ investigationId: id });
  window.dispatchEvent(new Event("specter:investigations"));
};

export const getElevenlabsConversationToken = async (investigationId: string) => {
  const { connection } = await connectSpacetime();
  return connection.procedures.getElevenlabsConversationToken({
    investigationId,
  });
};

export const startVoiceSession = async (
  id: string,
  investigationId: string,
) => {
  if (demoMode || isLocal(investigationId)) return;
  const { connection } = await connectSpacetime();
  await connection.reducers.startVoiceSession({ id, investigationId });
  window.dispatchEvent(new Event("specter:operations"));
};

export const finishVoiceSession = async (id: string) => {
  if (demoMode) return;
  const { connection } = await connectSpacetime();
  await connection.reducers.finishVoiceSession({ id });
  window.dispatchEvent(new Event("specter:operations"));
};

const buildLocalDossierAnswer = (
  record: InvestigationRecord,
  question: string,
): DossierAnswer => {
  const normalized = question.toLowerCase();
  let answer = record.dossier_summary || "The dossier does not include a summary.";
  if (normalized.includes("strong") || normalized.includes("support")) {
    answer = `The strongest supporting evidence is: ${record.strengths.join(" ")}`;
  } else if (
    normalized.includes("risk") ||
    normalized.includes("concern") ||
    normalized.includes("gap") ||
    normalized.includes("unresolved")
  ) {
    answer = `The main open questions are: ${record.concerns.join(" ")}`;
  } else if (normalized.includes("verify") || normalized.includes("next")) {
    answer = `The recommended verification steps are: ${record.recommendations.join(" ")}`;
  } else if (
    normalized.includes("claim") ||
    normalized.includes("experience")
  ) {
    answer = record.claims
      .slice(0, 3)
      .map(
        (claim) =>
          `${claim.claim_text} Support is ${claim.support_level}: ${claim.evidence}`,
      )
      .join(" ");
  }

  return {
    answer: `${answer} This response is limited to the evidence currently attached to the dossier.`,
    citationIds: record.sources.slice(0, 3).map((source) => source.id),
    confidence: `Grounded in ${Math.min(3, record.sources.length)} cited sources`,
    limitations: record.limitations?.slice(0, 3) || [
      "Answer is limited to evidence currently attached to the dossier.",
    ],
  };
};

export const askInvestigation = async (
  record: InvestigationRecord,
  question: string,
): Promise<DossierAnswer> => {
  if (demoMode || isLocal(record.id)) {
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    const answer = buildLocalDossierAnswer(record, question);
    emitOperation({
      id: `${record.id}-local-query-${Date.now()}`,
      investigationId: record.id,
      capability: "dossier_query",
      status: "complete",
      detail:
        "A grounded sample dossier question was answered from retained evidence.",
      metric: `${answer.citationIds.length} citations`,
      durationMs: 550,
      externalRef: "",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    return answer;
  }

  const { connection } = await connectSpacetime();
  const answerJson = await connection.procedures.askInvestigation({
    investigationId: record.id,
    question,
  });
  const answer = JSON.parse(answerJson) as DossierAnswer;
  const completedAt = new Date().toISOString();
  emitOperation({
    id: `${record.id}-query-${answer.requestId || Date.now()}`,
    investigationId: record.id,
    capability: "dossier_query",
    status: answer.model ? "complete" : "fallback",
    detail: answer.model
      ? `A grounded dossier question was answered with hosted evidence reasoning (${answer.model}).`
      : "A grounded dossier question was answered from retained evidence and scored signals.",
    metric: `${answer.citationIds.length} citations`,
    durationMs: answer.executionTimeMs || 0,
    externalRef: answer.requestId || "",
    startedAt: completedAt,
    completedAt,
  });
  return answer;
};

const emitOperation = (operation: InvestigationOperation) => {
  window.dispatchEvent(
    new CustomEvent<InvestigationOperation>("specter:operations", {
      detail: operation,
    }),
  );
};

const buildLocalOperations = (
  record: InvestigationRecord,
): InvestigationOperation[] => {
  const completedAt = record.updated_at;
  const base = [
    {
      capability: "discovery",
      detail: `${record.sources.length} sample sources were resolved across ${record.counters.platforms} public-source categories.`,
      metric: `${record.sources.length} sources`,
    },
    {
      capability: "reasoning",
      detail:
        "Evidence was challenged against uncertainty and transformed into an interpretable review.",
      metric: `${record.signals.length} signals`,
    },
    {
      capability: "memory",
      detail:
        "Sources, claims, signals, and writing samples were retained with the dossier.",
      metric: `${record.sources.length + record.claims.length + record.signals.length + record.embeddings.length} records`,
    },
    {
      capability: "orchestration",
      detail:
        "A sample workflow receipt was issued after the evidence review completed.",
      metric: "Receipt issued",
    },
    {
      capability: "voice_readiness",
      detail:
        "A browser voice briefing is ready for the sample investigation.",
      metric: "Briefing ready",
    },
  ];
  return base.map((operation, index) => ({
    id: `${record.id}-local-operation-${index}`,
    investigationId: record.id,
    status: "complete",
    durationMs: 280 + index * 190,
    externalRef: "",
    startedAt: record.analysis_started_at,
    completedAt,
    ...operation,
  }));
};

export const getInvestigationOperations = async (
  record: InvestigationRecord,
): Promise<InvestigationOperation[]> => {
  if (demoMode || isLocal(record.id)) return buildLocalOperations(record);

  const { connection } = await connectSpacetime();
  const operationsJson = await connection.procedures.getInvestigationOperations({
    investigationId: record.id,
  });
  return (JSON.parse(operationsJson) as InvestigationOperation[])
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
};
