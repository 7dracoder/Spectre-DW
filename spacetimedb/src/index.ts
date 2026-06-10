import { schema, table, t } from "spacetimedb/server";
import type { Identity } from "spacetimedb";
import {
  buildInsufficientInvestigationRecord,
  buildLiveInvestigationRecord,
  type InvestigationInput,
} from "./demoEvidence";
import {
  discoverPublicEvidence,
  notifyTower,
  synthesizeDossierAnswer,
} from "./providers";

const investigations = table(
  { name: "investigations", public: true },
  {
    id: t.string().primaryKey(),
    owner: t.identity().index("btree"),
    subjectName: t.string(),
    context: t.string(),
    status: t.string(),
    consistencyScore: t.i32(),
    stageIndex: t.u32(),
    progressPercent: t.u32(),
    recordJson: t.string(),
    createdAt: t.string(),
    updatedAt: t.string(),
  },
);

const sourceDocuments = table(
  { name: "source_documents", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    recordJson: t.string(),
  },
);

const signals = table(
  { name: "signals", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    recordJson: t.string(),
  },
);

const claims = table(
  { name: "claims", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    recordJson: t.string(),
  },
);

const embeddings = table(
  { name: "embeddings", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    recordJson: t.string(),
  },
);

const voiceSessions = table(
  { name: "voice_sessions", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    owner: t.identity().index("btree"),
    provider: t.string(),
    status: t.string(),
    startedAt: t.string(),
    endedAt: t.string(),
  },
);

const integrationRuns = table(
  { name: "integration_runs", public: true },
  {
    id: t.string().primaryKey(),
    investigationId: t.string().index("btree"),
    owner: t.identity().index("btree"),
    capability: t.string(),
    provider: t.string(),
    status: t.string(),
    detail: t.string(),
    metric: t.string(),
    durationMs: t.u32(),
    externalRef: t.string(),
    startedAt: t.string(),
    completedAt: t.string(),
  },
);

const providerConfig = table(
  { name: "provider_config" },
  {
    key: t.string().primaryKey(),
    value: t.string(),
  },
);

const moduleOwner = table(
  { name: "module_owner" },
  {
    ownerIdentity: t.identity().primaryKey(),
  },
);

const spacetimedb = schema({
  investigations,
  sourceDocuments,
  signals,
  claims,
  embeddings,
  voiceSessions,
  integrationRuns,
  providerConfig,
  moduleOwner,
});

export default spacetimedb;

const getOwner = (ctx: {
  db: {
    moduleOwner: {
      iter: () => Iterable<{ ownerIdentity: Identity }>;
    };
  };
}) => {
  for (const row of ctx.db.moduleOwner.iter()) return row.ownerIdentity;
  throw new Error("Module owner is not configured.");
};

const assertModuleOwner = (
  ctx: Parameters<typeof getOwner>[0] & { sender: Identity },
) => {
  if (!getOwner(ctx).isEqual(ctx.sender)) {
    throw new Error("Only the database owner may configure provider secrets.");
  }
};

export const init = spacetimedb.init((ctx) => {
  ctx.db.moduleOwner.insert({ ownerIdentity: ctx.sender });
});

export const configureProvider = spacetimedb.reducer(
  { key: t.string(), value: t.string() },
  (ctx, { key, value }) => {
    assertModuleOwner(ctx);
    const normalizedKey = key.trim().toUpperCase();
    if (!normalizedKey || !value.trim()) {
      throw new Error("Provider key and value are required.");
    }

    const existing = ctx.db.providerConfig.key.find(normalizedKey);
    const row = { key: normalizedKey, value: value.trim() };
    if (existing) ctx.db.providerConfig.key.update(row);
    else ctx.db.providerConfig.insert(row);
  },
);

export const createInvestigation = spacetimedb.reducer(
  {
    id: t.string(),
    inputJson: t.string(),
  },
  (ctx, { id, inputJson }) => {
    if (ctx.db.investigations.id.find(id)) {
      throw new Error("Investigation already exists.");
    }

    const input = JSON.parse(inputJson) as {
      subject_name?: string;
      context?: string;
    };
    if (!input.subject_name?.trim()) {
      throw new Error("Subject name is required.");
    }

    const now = new Date().toISOString();
    ctx.db.investigations.insert({
      id,
      owner: ctx.sender,
      subjectName: input.subject_name.trim(),
      context: input.context || "general",
      status: "pending",
      consistencyScore: 0,
      stageIndex: 0,
      progressPercent: 3,
      recordJson: inputJson,
      createdAt: now,
      updatedAt: now,
    });
  },
);

export const deleteInvestigation = spacetimedb.reducer(
  { investigationId: t.string() },
  (ctx, { investigationId }) => {
    const investigation = ctx.db.investigations.id.find(investigationId);
    if (!investigation) return;
    if (!investigation.owner.isEqual(ctx.sender)) {
      throw new Error("Investigation access denied.");
    }

    for (const row of ctx.db.sourceDocuments.investigationId.filter(
      investigationId,
    )) {
      ctx.db.sourceDocuments.id.delete(row.id);
    }
    for (const row of ctx.db.signals.investigationId.filter(investigationId)) {
      ctx.db.signals.id.delete(row.id);
    }
    for (const row of ctx.db.claims.investigationId.filter(investigationId)) {
      ctx.db.claims.id.delete(row.id);
    }
    for (const row of ctx.db.embeddings.investigationId.filter(investigationId)) {
      ctx.db.embeddings.id.delete(row.id);
    }
    for (const row of ctx.db.voiceSessions.investigationId.filter(
      investigationId,
    )) {
      ctx.db.voiceSessions.id.delete(row.id);
    }
    for (const row of ctx.db.integrationRuns.investigationId.filter(
      investigationId,
    )) {
      ctx.db.integrationRuns.id.delete(row.id);
    }
    ctx.db.investigations.id.delete(investigationId);
  },
);

const parseInvestigationInput = (recordJson: string): InvestigationInput => {
  const value = JSON.parse(recordJson) as Partial<InvestigationInput>;
  const subjectName = value.subject_name?.trim();
  if (!subjectName) throw new Error("Investigation subject is missing.");

  const optional = (field: string | undefined) => field?.trim() || undefined;
  return {
    subject_name: subjectName,
    github_username: optional(value.github_username),
    x_handle: optional(value.x_handle),
    linkedin_url: optional(value.linkedin_url),
    website_url: optional(value.website_url),
    other_profile_url: optional(value.other_profile_url),
    context: value.context?.trim() || "general",
    notes: optional(value.notes),
  };
};

type StoredInvestigationRecord = ReturnType<
  typeof buildInsufficientInvestigationRecord
>;

const buildRevisionSummary = (
  previousRecord: StoredInvestigationRecord | null,
  record: StoredInvestigationRecord,
  revision: number,
) => {
  const previousUrls = new Set(
    previousRecord?.sources.map((source) => source.url) || [],
  );
  const currentUrls = new Set(record.sources.map((source) => source.url));
  return {
    revision,
    completed_at: new Date().toISOString(),
    consistency_score: record.consistency_score,
    evidence_confidence_score: record.evidence_confidence_score,
    source_count: record.sources.length,
    added_sources: Array.from(currentUrls).filter(
      (url) => !previousUrls.has(url),
    ).length,
    removed_sources: Array.from(previousUrls).filter(
      (url) => !currentUrls.has(url),
    ).length,
    retained_sources: Array.from(currentUrls).filter((url) =>
      previousUrls.has(url),
    ).length,
    classification: record.classification,
  };
};

export const runInvestigation = spacetimedb.procedure(
  { investigationId: t.string() },
  t.string(),
  (ctx, { investigationId }) => {
    const analysisStartedAt = new Date().toISOString();
    const {
      investigation,
      input,
      previousRecord,
      previousOperations,
      nextRevision,
      provider,
    } = ctx.withTx((tx) => {
      const row = tx.db.investigations.id.find(investigationId);
      if (!row) throw new Error("Investigation not found.");
      if (!row.owner.isEqual(tx.sender)) {
        throw new Error("Investigation access denied.");
      }
      const parsed = JSON.parse(row.recordJson) as Partial<StoredInvestigationRecord>;
      const completedRecord =
        Array.isArray(parsed.sources) && parsed.status === "complete"
          ? (parsed as StoredInvestigationRecord)
          : null;
      const runningRecord = completedRecord
        ? {
            ...completedRecord,
            status: "running",
            progress_percent: 35,
            stage_index: 2,
            analysis_started_at: analysisStartedAt,
            updated_at: analysisStartedAt,
          }
        : null;
      tx.db.investigations.id.update({
        ...row,
        status: "running",
        progressPercent: 35,
        stageIndex: 2,
        recordJson: runningRecord
          ? JSON.stringify(runningRecord)
          : row.recordJson,
        updatedAt: analysisStartedAt,
      });
      const operations = Array.from(
        tx.db.integrationRuns.investigationId.filter(investigationId),
      );
      for (const operation of tx.db.integrationRuns.investigationId.filter(
        investigationId,
      )) {
        tx.db.integrationRuns.id.delete(operation.id);
      }
      const getProvider = (key: string) =>
        tx.db.providerConfig.key.find(key)?.value || "";
      return {
        investigation: row,
        input: parseInvestigationInput(row.recordJson),
        previousRecord: completedRecord,
        previousOperations: operations,
        nextRevision: completedRecord
          ? Math.max(1, completedRecord.analysis_revision || 1) + 1
          : 1,
        provider: {
          nimbleApiKey: getProvider("NIMBLE_API_KEY"),
          towerApiKey: getProvider("TOWER_API_KEY"),
          towerAppName: getProvider("TOWER_APP_NAME"),
          towerEnvironment:
            getProvider("TOWER_ENVIRONMENT") || "default",
          elevenlabsApiKey: getProvider("ELEVENLABS_API_KEY"),
          elevenlabsAgentId: getProvider("ELEVENLABS_AGENT_ID"),
        },
      };
    });

    const writeOperation = ({
      capability,
      providerName,
      status,
      detail,
      metric = "",
      durationMs = 0,
      externalRef = "",
      startedAt,
      completedAt = "",
    }: {
      capability: string;
      providerName: string;
      status: string;
      detail: string;
      metric?: string;
      durationMs?: number;
      externalRef?: string;
      startedAt: string;
      completedAt?: string;
    }) => {
      ctx.withTx((tx) => {
        const id = `${investigationId}-operation-${capability}`;
        const row = {
          id,
          investigationId,
          owner: investigation.owner,
          capability,
          provider: providerName,
          status,
          detail,
          metric,
          durationMs: Math.max(0, Math.round(durationMs)),
          externalRef,
          startedAt,
          completedAt,
        };
        if (tx.db.integrationRuns.id.find(id)) {
          tx.db.integrationRuns.id.update(row);
        } else {
          tx.db.integrationRuns.insert(row);
        }
      });
    };

    try {
      let record = buildInsufficientInvestigationRecord(
        input,
        investigation.id,
        investigation.owner.toHexString(),
        investigation.createdAt,
      );

      writeOperation({
        capability: "memory",
        providerName: "SpacetimeDB",
        status: "running",
        detail: "Opening a durable evidence workspace for this dossier.",
        startedAt: analysisStartedAt,
      });
      writeOperation({
        capability: "voice_readiness",
        providerName: "ElevenLabs",
        status:
          provider.elevenlabsApiKey && provider.elevenlabsAgentId
            ? "ready"
            : provider.elevenlabsApiKey
              ? "setup_required"
              : "not_configured",
        detail:
          provider.elevenlabsApiKey && provider.elevenlabsAgentId
            ? "A private evidence-grounded voice session is ready."
            : provider.elevenlabsApiKey
              ? "Voice access is secured; an agent ID is still required."
              : "Voice sessions are available after private configuration.",
        metric:
          provider.elevenlabsApiKey && provider.elevenlabsAgentId
            ? "Session ready"
            : "Setup pending",
        startedAt: analysisStartedAt,
        completedAt: new Date().toISOString(),
      });

      if (provider.nimbleApiKey) {
        const discoveryStartedAt = new Date().toISOString();
        const discoveryStartedMs = new Date().getTime();
        writeOperation({
          capability: "discovery",
          providerName: "Nimble",
          status: "running",
          detail: "Resolving identity anchors across focused public-source queries.",
          startedAt: discoveryStartedAt,
        });
        try {
          const evidence = discoverPublicEvidence(
            ctx.http,
            provider.nimbleApiKey,
            input,
          );
          writeOperation({
            capability: "discovery",
            providerName: "Nimble",
            status: "complete",
            detail: `${evidence.queries.length} focused searches resolved ${evidence.results.length} unique public sources.`,
            metric: `${evidence.results.length} sources`,
            durationMs: new Date().getTime() - discoveryStartedMs,
            externalRef: evidence.requestIds.join(","),
            startedAt: discoveryStartedAt,
            completedAt: new Date().toISOString(),
          });
          const reasoningStartedAt = new Date().toISOString();
          writeOperation({
            capability: "reasoning",
            providerName: "Spectre",
            status: "complete",
            detail:
              "Deterministic identity, source-quality, chronology, and diversity scoring completed without an unnecessary generation pass.",
            metric: `${evidence.results.length} sources scored`,
            startedAt: reasoningStartedAt,
            completedAt: new Date().toISOString(),
          });
          record = buildLiveInvestigationRecord(
            input,
            investigation.id,
            investigation.owner.toHexString(),
            investigation.createdAt,
            evidence,
            null,
          );
        } catch (error) {
          writeOperation({
            capability: "discovery",
            providerName: "Nimble",
            status: "fallback",
            detail:
              "Public discovery was unavailable; the submitted identity anchors were preserved in a deterministic dossier.",
            metric: "Safe fallback",
            durationMs: new Date().getTime() - discoveryStartedMs,
            startedAt: discoveryStartedAt,
            completedAt: new Date().toISOString(),
          });
          writeOperation({
            capability: "reasoning",
            providerName: "Spectre",
            status: "skipped",
            detail:
              "Evidence scoring was skipped because no live public evidence was returned.",
            metric: "Awaiting evidence",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          });
          if (previousRecord) {
            const detail =
              error instanceof Error
                ? error.message
                : "Public discovery returned no usable evidence.";
            throw new Error(
              `Revisit could not refresh public evidence. Previous dossier was preserved. ${detail}`,
            );
          }
        }
      } else {
        const completedAt = new Date().toISOString();
        writeOperation({
          capability: "discovery",
          providerName: "Nimble",
          status: "not_configured",
          detail:
            "The dossier used submitted public identifiers because discovery is not configured.",
          metric: "Submitted anchors",
          startedAt: completedAt,
          completedAt,
        });
        writeOperation({
          capability: "reasoning",
          providerName: "Spectre",
          status: "skipped",
          detail:
            "Evidence scoring is waiting for a live discovery result.",
          metric: "Awaiting evidence",
          startedAt: completedAt,
          completedAt,
        });
        if (previousRecord) {
          throw new Error(
            "Revisit requires configured public discovery. Previous dossier was preserved.",
          );
        }
      }

      record.analysis_started_at = analysisStartedAt;
      record.updated_at = new Date().toISOString();
      const revisionSummary = buildRevisionSummary(
        previousRecord,
        record,
        nextRevision,
      );
      const previousHistory = previousRecord?.analysis_history || [];
      const previousSnapshot = previousRecord?.revision_summary;
      record.analysis_revision = nextRevision;
      record.revision_summary = revisionSummary;
      record.analysis_history = previousSnapshot
        ? [...previousHistory, previousSnapshot].slice(-5)
        : previousHistory.slice(-5);

      ctx.withTx((tx) => {
        for (const row of tx.db.sourceDocuments.investigationId.filter(investigationId)) {
          tx.db.sourceDocuments.id.delete(row.id);
        }
        for (const row of tx.db.signals.investigationId.filter(investigationId)) {
          tx.db.signals.id.delete(row.id);
        }
        for (const row of tx.db.claims.investigationId.filter(investigationId)) {
          tx.db.claims.id.delete(row.id);
        }
        for (const row of tx.db.embeddings.investigationId.filter(investigationId)) {
          tx.db.embeddings.id.delete(row.id);
        }

        for (const source of record.sources) {
          tx.db.sourceDocuments.insert({
            id: source.id,
            investigationId,
            recordJson: JSON.stringify(source),
          });
        }
        for (const signal of record.signals) {
          tx.db.signals.insert({
            id: signal.id,
            investigationId,
            recordJson: JSON.stringify(signal),
          });
        }
        for (const claim of record.claims) {
          tx.db.claims.insert({
            id: claim.id,
            investigationId,
            recordJson: JSON.stringify(claim),
          });
        }
        for (const embedding of record.embeddings) {
          tx.db.embeddings.insert({
            id: embedding.id,
            investigationId,
            recordJson: JSON.stringify(embedding),
          });
        }

        const row = tx.db.investigations.id.find(investigationId);
        if (!row) throw new Error("Investigation disappeared during processing.");
        tx.db.investigations.id.update({
          ...row,
          status: record.status,
          consistencyScore: record.consistency_score,
          stageIndex: record.stage_index,
          progressPercent: record.progress_percent,
          recordJson: JSON.stringify(record),
          updatedAt: record.updated_at,
        });
      });
      writeOperation({
        capability: "memory",
        providerName: "SpacetimeDB",
        status: "complete",
        detail:
          "Sources, claims, signals, available text analysis, and the final dossier were committed atomically.",
        metric: `${record.sources.length + record.claims.length + record.signals.length + record.embeddings.length} records`,
        durationMs: new Date().getTime() - new Date(analysisStartedAt).getTime(),
        startedAt: analysisStartedAt,
        completedAt: new Date().toISOString(),
      });

      if (provider.towerApiKey && provider.towerAppName) {
        const orchestrationStartedAt = new Date().toISOString();
        const orchestrationStartedMs = new Date().getTime();
        writeOperation({
          capability: "orchestration",
          providerName: "Tower",
          status: "running",
          detail: "Issuing an external workflow receipt for this completed review.",
          startedAt: orchestrationStartedAt,
        });
        try {
          const receipt = notifyTower(
            ctx.http,
            provider.towerApiKey,
            provider.towerAppName,
            provider.towerEnvironment,
            {
              investigationId,
              subjectName: record.subject_name,
              context: record.context,
              sourceCount: record.sources.length,
              consistencyScore: record.consistency_score,
            },
          );
          writeOperation({
            capability: "orchestration",
            providerName: "Tower",
            status: receipt.accepted ? "complete" : "failed",
            detail: receipt.detail,
            metric: receipt.accepted ? "Receipt issued" : "Receipt rejected",
            durationMs: new Date().getTime() - orchestrationStartedMs,
            externalRef: receipt.externalRef || "",
            startedAt: orchestrationStartedAt,
            completedAt: new Date().toISOString(),
          });
        } catch {
          writeOperation({
            capability: "orchestration",
            providerName: "Tower",
            status: "failed",
            detail:
              "The dossier completed, but the external workflow receipt could not be issued.",
            metric: "Dossier preserved",
            durationMs: new Date().getTime() - orchestrationStartedMs,
            startedAt: orchestrationStartedAt,
            completedAt: new Date().toISOString(),
          });
        }
      } else {
        const completedAt = new Date().toISOString();
        writeOperation({
          capability: "orchestration",
          providerName: "Tower",
          status: "not_configured",
          detail:
            "The dossier is complete; external workflow receipts are not configured.",
          metric: "Local receipt only",
          startedAt: completedAt,
          completedAt,
        });
      }

      return JSON.stringify(record);
    } catch (error) {
      ctx.withTx((tx) => {
        const row = tx.db.investigations.id.find(investigationId);
        if (!row) return;
        for (const operation of tx.db.integrationRuns.investigationId.filter(
          investigationId,
        )) {
          tx.db.integrationRuns.id.delete(operation.id);
        }
        if (previousRecord) {
          tx.db.investigations.id.update(investigation);
          for (const operation of previousOperations) {
            tx.db.integrationRuns.insert(operation);
          }
        } else {
          tx.db.investigations.id.update({
            ...row,
            status: "failed",
            updatedAt: new Date().toISOString(),
          });
        }
      });
      throw error;
    }
  },
);

export const getElevenlabsConversationToken = spacetimedb.procedure(
  { investigationId: t.string() },
  t.string(),
  (ctx, { investigationId }) => {
    const config = ctx.withTx((tx) => {
      const investigation = tx.db.investigations.id.find(investigationId);
      if (!investigation) throw new Error("Investigation not found.");
      if (!investigation.owner.isEqual(tx.sender)) {
        throw new Error("Investigation access denied.");
      }

      const apiKey = tx.db.providerConfig.key.find("ELEVENLABS_API_KEY")?.value;
      const agentId = tx.db.providerConfig.key.find("ELEVENLABS_AGENT_ID")?.value;
      if (!apiKey || !agentId) {
        throw new Error(
          "ElevenLabs is not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID.",
        );
      }
      return { apiKey, agentId };
    });

    const url =
      "https://api.elevenlabs.io/v1/convai/conversation/token" +
      `?agent_id=${encodeURIComponent(config.agentId)}` +
      `&participant_name=${encodeURIComponent(ctx.sender.toHexString())}`;
    const response = ctx.http.fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `ElevenLabs token request failed (${response.status}): ${response.text()}`,
      );
    }

    const body = response.json() as { token?: string };
    if (!body.token) throw new Error("ElevenLabs did not return a conversation token.");
    return body.token;
  },
);

export const getInvestigationOperations = spacetimedb.procedure(
  { investigationId: t.string() },
  t.string(),
  (ctx, { investigationId }) =>
    ctx.withTx((tx) => {
      const investigation = tx.db.investigations.id.find(investigationId);
      if (!investigation) throw new Error("Investigation not found.");
      if (!investigation.owner.isEqual(tx.sender)) {
        throw new Error("Investigation access denied.");
      }

      return JSON.stringify(
        Array.from(
          tx.db.integrationRuns.investigationId.filter(investigationId),
        ).map((operation) => ({
          id: operation.id,
          investigationId: operation.investigationId,
          capability: operation.capability,
          status: operation.status,
          detail: operation.detail,
          metric: operation.metric,
          durationMs: operation.durationMs,
          externalRef: operation.externalRef,
          startedAt: operation.startedAt,
          completedAt: operation.completedAt,
        })),
      );
    }),
);

const QUESTION_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "been",
  "before",
  "could",
  "does",
  "from",
  "have",
  "into",
  "most",
  "should",
  "that",
  "their",
  "there",
  "these",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
]);

const questionTerms = (question: string) =>
  question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 3 && !QUESTION_STOP_WORDS.has(term));

export const askInvestigation = spacetimedb.procedure(
  { investigationId: t.string(), question: t.string() },
  t.string(),
  (ctx, { investigationId, question }) => {
    const normalizedQuestion = question.trim();
    if (normalizedQuestion.length < 4 || normalizedQuestion.length > 500) {
      throw new Error("Ask a question between 4 and 500 characters.");
    }

    const { record, provider } = ctx.withTx((tx) => {
      const investigation = tx.db.investigations.id.find(investigationId);
      if (!investigation) throw new Error("Investigation not found.");
      if (!investigation.owner.isEqual(tx.sender)) {
        throw new Error("Investigation access denied.");
      }
      const getProvider = (key: string) =>
        tx.db.providerConfig.key.find(key)?.value || "";
      return {
        record: JSON.parse(investigation.recordJson) as ReturnType<
          typeof buildInsufficientInvestigationRecord
        >,
        provider: {
          runpodApiKey: getProvider("RUNPOD_API_KEY"),
          runpodTextModel:
            getProvider("RUNPOD_TEXT_MODEL") || "qwen3-32b-awq",
          runpodFallbackModel:
            getProvider("RUNPOD_FALLBACK_MODEL") || "granite-4-0-h-small",
        },
      };
    });

    const terms = questionTerms(normalizedQuestion);
    const rankedSources = record.sources
      .map((source) => {
        const sourceWithMetadata = source as typeof source & {
          identity_match_score?: number;
          source_quality_score?: number;
          date_confidence?: string;
        };
        const searchable =
          `${source.title} ${source.snippet} ${source.platform}`.toLowerCase();
        const relevance = terms.reduce(
          (score, term) => score + (searchable.includes(term) ? 1 : 0),
          0,
        );
        const qualityBoost =
          ((sourceWithMetadata.identity_match_score || 0) +
            (sourceWithMetadata.source_quality_score || 0)) /
          200;
        return {
          source: sourceWithMetadata,
          relevance: relevance + qualityBoost,
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(({ source }) => source);
    const strongestSignals = [...record.signals]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    const context = {
      subjectName: record.subject_name,
      question: normalizedQuestion,
      summary: record.dossier_summary,
      sources: rankedSources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        platform: source.platform,
        sourceType: source.source_type,
        identityMatchScore: source.identity_match_score || 0,
        sourceQualityScore: source.source_quality_score || 0,
        dateConfidence: source.date_confidence || "unknown",
      })),
      signals: strongestSignals.map((signal) => ({
        title: signal.title,
        score: signal.score,
        summary: signal.summary,
      })),
      claims: record.claims.slice(0, 5).map((claim) => ({
        claim: claim.claim_text,
        support: claim.support_level,
        evidence: claim.evidence,
      })),
      recommendations: record.recommendations,
    };

    const questionLower = normalizedQuestion.toLowerCase();
    const deterministicIntent = [
      "strong",
      "support",
      "risk",
      "concern",
      "gap",
      "unresolved",
      "verify",
      "next",
      "claim",
      "experience",
    ].some((term) => questionLower.includes(term));

    if (provider.runpodApiKey && !deterministicIntent) {
      try {
        const answer = synthesizeDossierAnswer(
          ctx.http,
          provider.runpodApiKey,
          provider.runpodTextModel,
          provider.runpodFallbackModel,
          context,
        );
        if (answer) {
          const completedAt = new Date().toISOString();
          ctx.withTx((tx) => {
            tx.db.integrationRuns.insert({
              id: `${investigationId}-query-${new Date().getTime()}`,
              investigationId,
              owner: tx.sender,
              capability: "dossier_query",
              provider: "RunPod",
              status: "complete",
              detail: `A grounded dossier question was answered using ${answer.model || "hosted reasoning"}.`,
              metric: `${answer.citationIds.length} citations`,
              durationMs: Math.max(0, answer.executionTimeMs || 0),
              externalRef: answer.requestId || "",
              startedAt: completedAt,
              completedAt,
            });
          });
          return JSON.stringify(answer);
        }
      } catch {
        // Continue with the evidence-grounded extractive response.
      }
    }

    let lead = record.dossier_summary;
    if (questionLower.includes("strong") || questionLower.includes("support")) {
      lead = `The strongest signals are ${strongestSignals
        .slice(0, 3)
        .map((signal) => `${signal.title} (${signal.score}/100)`)
        .join(", ")}.`;
    } else if (
      questionLower.includes("risk") ||
      questionLower.includes("concern") ||
      questionLower.includes("gap") ||
      questionLower.includes("unresolved")
    ) {
      lead = record.concerns.join(" ");
    } else if (
      questionLower.includes("verify") ||
      questionLower.includes("next")
    ) {
      lead = record.recommendations.join(" ");
    } else if (
      questionLower.includes("claim") ||
      questionLower.includes("experience")
    ) {
      lead = record.claims
        .slice(0, 3)
        .map(
          (claim) =>
            `${claim.claim_text} Support is ${claim.support_level}: ${claim.evidence}`,
        )
        .join(" ");
    }

    const fallbackAnswer = {
      answer:
        `${lead} This response is limited to the evidence currently attached to the dossier.`.trim(),
      citationIds: rankedSources.slice(0, 3).map((source) => source.id),
      confidence: `Grounded in ${rankedSources.length} cited sources and ${strongestSignals.length} scored signals`,
      limitations: record.limitations?.slice(0, 3) || [
        "Answer is limited to retained public-source excerpts.",
      ],
    };
    const completedAt = new Date().toISOString();
    ctx.withTx((tx) => {
      tx.db.integrationRuns.insert({
        id: `${investigationId}-query-${new Date().getTime()}`,
        investigationId,
        owner: tx.sender,
        capability: "dossier_query",
        provider: "SpacetimeDB",
        status: "fallback",
        detail:
          "The question was answered from scored signals and retained evidence without external generation.",
        metric: `${fallbackAnswer.citationIds.length} citations`,
        durationMs: 0,
        externalRef: "",
        startedAt: completedAt,
        completedAt,
      });
    });
    return JSON.stringify(fallbackAnswer);
  },
);

export const startVoiceSession = spacetimedb.reducer(
  {
    id: t.string(),
    investigationId: t.string(),
  },
  (ctx, { id, investigationId }) => {
    const investigation = ctx.db.investigations.id.find(investigationId);
    if (!investigation || !investigation.owner.isEqual(ctx.sender)) {
      throw new Error("Investigation access denied.");
    }
    const startedAt = new Date().toISOString();
    ctx.db.voiceSessions.insert({
      id,
      investigationId,
      owner: ctx.sender,
      provider: "ElevenLabs",
      status: "connected",
      startedAt,
      endedAt: "",
    });
    ctx.db.integrationRuns.insert({
      id: `${investigationId}-voice-${id}`,
      investigationId,
      owner: ctx.sender,
      capability: "voice_session",
      provider: "ElevenLabs",
      status: "active",
      detail:
        "A private voice investigator session connected with dossier context.",
      metric: "Live session",
      durationMs: 0,
      externalRef: id,
      startedAt,
      completedAt: "",
    });
  },
);

export const finishVoiceSession = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const row = ctx.db.voiceSessions.id.find(id);
    if (!row || !row.owner.isEqual(ctx.sender)) return;
    const endedAt = new Date().toISOString();
    ctx.db.voiceSessions.id.update({
      ...row,
      status: "complete",
      endedAt,
    });
    for (const operation of ctx.db.integrationRuns.investigationId.filter(
      row.investigationId,
    )) {
      if (operation.externalRef !== id) continue;
      ctx.db.integrationRuns.id.update({
        ...operation,
        status: "complete",
        detail:
          "The private voice investigator session ended and its audit receipt was retained.",
        metric: "Session complete",
        durationMs: Math.max(
          0,
          new Date(endedAt).getTime() - new Date(operation.startedAt).getTime(),
        ),
        completedAt: endedAt,
      });
    }
  },
);
