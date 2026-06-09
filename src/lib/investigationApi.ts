import {
  connectSpacetime,
  demoMode,
} from "@/integrations/spacetimedb/client";
import {
  createLocalInvestigation,
  getLocalInvestigation,
  listLocalInvestigations,
} from "@/lib/investigationStore";
import type {
  InvestigationInput,
  InvestigationListItem,
  InvestigationRecord,
} from "@/types/investigation";

export { demoMode };

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
};

export const finishVoiceSession = async (id: string) => {
  if (demoMode) return;
  const { connection } = await connectSpacetime();
  await connection.reducers.finishVoiceSession({ id });
};
