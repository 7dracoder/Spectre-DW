import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import {
  createLocalInvestigation,
  getLocalInvestigation,
  listLocalInvestigations,
} from "@/lib/investigationStore";
import type {
  EvidenceClaim,
  EvidenceSource,
  FingerprintPoint,
  InvestigationInput,
  InvestigationRecord,
  InvestigationSignal,
  TimelineEvent,
} from "@/types/investigation";

export const demoMode =
  import.meta.env.VITE_DEMO_MODE !== "false" || !supabaseConfigured;

const isLocal = (id: string) => id.startsWith("demo-");

export const createInvestigation = async (
  input: InvestigationInput,
  userId?: string | null,
) => {
  if (demoMode || !userId || userId === "demo-user") {
    return createLocalInvestigation(input);
  }

  const { data, error } = await supabase
    .from("investigations")
    .insert({
      created_by: userId,
      subject_name: input.subject_name,
      github_username: input.github_username || null,
      x_handle: input.x_handle || null,
      linkedin_url: input.linkedin_url || null,
      website_url: input.website_url || null,
      other_profile_url: input.other_profile_url || null,
      context: input.context,
      notes: input.notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;

  void supabase.functions.invoke("run-investigation", {
    body: { investigationId: data.id },
  });

  return getInvestigation(data.id);
};

export const listInvestigations = async (userId?: string | null) => {
  if (demoMode || !userId || userId === "demo-user") {
    return listLocalInvestigations();
  }

  const { data, error } = await supabase
    .from("investigations")
    .select(
      "id, subject_name, status, consistency_score, context, created_at, progress",
    )
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    subject_name: row.subject_name,
    status: row.status,
    consistency_score: row.consistency_score,
    context: row.context,
    created_at: row.created_at,
    stage_index:
      typeof row.progress === "object" && row.progress && "stage_index" in row.progress
        ? Number(row.progress.stage_index)
        : 0,
  }));
};

export const getInvestigation = async (
  id: string,
): Promise<InvestigationRecord | null> => {
  if (demoMode || isLocal(id)) {
    return getLocalInvestigation(id);
  }

  const [investigation, sources, signals, claims, embeddings] = await Promise.all([
    supabase.from("investigations").select("*").eq("id", id).maybeSingle(),
    supabase.from("source_documents").select("*").eq("investigation_id", id),
    supabase.from("signals").select("*").eq("investigation_id", id),
    supabase.from("claims").select("*").eq("investigation_id", id),
    supabase.from("embeddings").select("*").eq("investigation_id", id),
  ]);

  if (investigation.error) throw investigation.error;
  if (!investigation.data) return null;

  const row = investigation.data;
  const full = (row.dossier_full ?? {}) as Record<string, unknown>;
  const progress = (row.progress ?? {}) as Record<string, unknown>;

  return {
    id: row.id,
    created_by: row.created_by,
    subject_name: row.subject_name,
    github_username: row.github_username ?? "",
    x_handle: row.x_handle ?? "",
    linkedin_url: row.linkedin_url ?? "",
    website_url: row.website_url ?? "",
    other_profile_url: row.other_profile_url ?? "",
    context: row.context ?? "",
    notes: row.notes ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    analysis_started_at: row.created_at,
    status: row.status,
    stage_index: Number(progress.stage_index ?? 0),
    progress_percent: Number(progress.percent ?? (row.status === "complete" ? 100 : 5)),
    counters: (progress.counters as InvestigationRecord["counters"]) ?? {
      sources: sources.data?.length ?? 0,
      platforms: 0,
      timelineEvents: 0,
      claims: claims.data?.length ?? 0,
      writingSamples: embeddings.data?.length ?? 0,
      clusters: 0,
    },
    consistency_score: row.consistency_score,
    confidence_band: row.confidence_band,
    classification: row.classification,
    dossier_summary: row.dossier_summary,
    strengths: (full.strengths as string[]) ?? [],
    concerns: (full.concerns as string[]) ?? [],
    recommendations: (full.recommendations as string[]) ?? [],
    timeline: (full.timeline as TimelineEvent[]) ?? [],
    sources: ((sources.data ?? []) as Array<Record<string, unknown>>).map(
      (source): EvidenceSource => ({
        id: String(source.id),
        platform: String(source.platform ?? "Web"),
        source_type: String(source.source_type ?? "source"),
        url: String(source.url),
        title: String(source.title ?? source.url),
        published_at: String(source.published_at ?? source.fetched_at),
        snippet: String(source.raw_text ?? "").slice(0, 180),
      }),
    ),
    signals: ((signals.data ?? []) as Array<Record<string, unknown>>).map(
      (signal): InvestigationSignal => ({
        id: String(signal.id),
        signal_key: String(signal.signal_key),
        title: String(signal.title),
        summary: String(signal.summary ?? ""),
        score: Number(signal.score ?? 0),
        weight: Number(signal.weight ?? 0),
        polarity:
          signal.polarity === "positive" || signal.polarity === "concern"
            ? signal.polarity
            : "mixed",
      }),
    ),
    claims: ((claims.data ?? []) as Array<Record<string, unknown>>).map(
      (claim): EvidenceClaim => ({
        id: String(claim.id),
        claim_type: String(claim.claim_type ?? "claim"),
        claim_text: String(claim.claim_text),
        support_level:
          claim.support_level === "supported" || claim.support_level === "partial"
            ? claim.support_level
            : "unresolved",
        evidence: String(
          (claim.supporting_evidence_refs as Record<string, unknown>)?.summary ?? "",
        ),
        source_url: String(claim.source_url ?? ""),
      }),
    ),
    embeddings: ((embeddings.data ?? []) as Array<Record<string, unknown>>).map(
      (point): FingerprintPoint => ({
        id: String(point.id),
        coord_x: Number(point.coord_x ?? 0),
        coord_y: Number(point.coord_y ?? 0),
        cluster_label: Number(point.cluster_label ?? 0),
        is_outlier: Boolean(point.is_outlier),
        platform: String(point.platform ?? "Web"),
        observed_at: String(point.observed_at ?? point.created_at),
        title: "Writing sample",
        snippet: "Public text artifact",
        text_length: 300,
      }),
    ),
  };
};

