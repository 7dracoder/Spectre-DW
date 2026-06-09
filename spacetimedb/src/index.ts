import { schema, table, t } from "spacetimedb/server";
import type { Identity } from "spacetimedb";
import {
  buildInvestigationRecord,
  buildLiveInvestigationRecord,
  type InvestigationInput,
} from "./demoEvidence";
import {
  discoverPublicEvidence,
  notifyTower,
  synthesizeInvestigation,
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

export const runInvestigation = spacetimedb.procedure(
  { investigationId: t.string() },
  t.string(),
  (ctx, { investigationId }) => {
    const { investigation, provider } = ctx.withTx((tx) => {
      const row = tx.db.investigations.id.find(investigationId);
      if (!row) throw new Error("Investigation not found.");
      if (!row.owner.isEqual(tx.sender)) {
        throw new Error("Investigation access denied.");
      }
      tx.db.investigations.id.update({
        ...row,
        status: "running",
        progressPercent: 35,
        stageIndex: 2,
        updatedAt: new Date().toISOString(),
      });
      const getProvider = (key: string) =>
        tx.db.providerConfig.key.find(key)?.value || "";
      return {
        investigation: row,
        provider: {
          nimbleApiKey: getProvider("NIMBLE_API_KEY"),
          runpodApiKey: getProvider("RUNPOD_API_KEY"),
          runpodTextModel:
            getProvider("RUNPOD_TEXT_MODEL") || "qwen3-32b-awq",
          towerApiKey: getProvider("TOWER_API_KEY"),
          towerAppName: getProvider("TOWER_APP_NAME"),
          towerEnvironment:
            getProvider("TOWER_ENVIRONMENT") || "default",
        },
      };
    });

    try {
      const input = JSON.parse(investigation.recordJson) as InvestigationInput;
      let record = buildInvestigationRecord(
        input,
        investigation.id,
        investigation.owner.toHexString(),
        investigation.createdAt,
      );

      if (provider.nimbleApiKey) {
        try {
          const evidence = discoverPublicEvidence(
            ctx.http,
            provider.nimbleApiKey,
            input,
          );
          let narrative = null;
          if (provider.runpodApiKey) {
            try {
              narrative = synthesizeInvestigation(
                ctx.http,
                provider.runpodApiKey,
                provider.runpodTextModel,
                input,
                evidence,
              );
            } catch {
              narrative = null;
            }
          }
          record = buildLiveInvestigationRecord(
            input,
            investigation.id,
            investigation.owner.toHexString(),
            investigation.createdAt,
            evidence,
            narrative,
          );
        } catch {
          // The deterministic dossier remains available when discovery is down.
        }
      }

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

      if (provider.towerApiKey && provider.towerAppName) {
        try {
          notifyTower(
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
        } catch {
          // Audit orchestration must not invalidate a completed dossier.
        }
      }

      return JSON.stringify(record);
    } catch (error) {
      ctx.withTx((tx) => {
        const row = tx.db.investigations.id.find(investigationId);
        if (!row) return;
        tx.db.investigations.id.update({
          ...row,
          status: "failed",
          updatedAt: new Date().toISOString(),
        });
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
    ctx.db.voiceSessions.insert({
      id,
      investigationId,
      owner: ctx.sender,
      provider: "ElevenLabs",
      status: "connected",
      startedAt: new Date().toISOString(),
      endedAt: "",
    });
  },
);

export const finishVoiceSession = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const row = ctx.db.voiceSessions.id.find(id);
    if (!row || !row.owner.isEqual(ctx.sender)) return;
    ctx.db.voiceSessions.id.update({
      ...row,
      status: "complete",
      endedAt: new Date().toISOString(),
    });
  },
);
