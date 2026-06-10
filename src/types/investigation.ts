export type InvestigationStatus = "pending" | "running" | "complete" | "failed";

export type InvestigationInput = {
  subject_name: string;
  github_username?: string;
  x_handle?: string;
  linkedin_url?: string;
  website_url?: string;
  other_profile_url?: string;
  context: string;
  notes?: string;
};

export type InvestigationCounters = {
  sources: number;
  platforms: number;
  timelineEvents: number;
  claims: number;
  writingSamples: number;
  clusters: number;
};

export type EvidenceSource = {
  id: string;
  platform: string;
  source_type: string;
  url: string;
  title: string;
  published_at: string;
  snippet: string;
  identity_match_score?: number;
  source_quality_score?: number;
  date_confidence?: "reported" | "unknown";
  matched_anchors?: string[];
};

export type EvidenceContradiction = {
  id: string;
  summary: string;
  source_ids: string[];
  status: "possible" | "confirmed" | "resolved";
};

export type AnalysisRevisionSnapshot = {
  revision: number;
  completed_at: string;
  consistency_score: number | null;
  evidence_confidence_score: number | null;
  source_count: number;
  added_sources: number;
  removed_sources: number;
  retained_sources: number;
  classification: string | null;
};

export type InvestigationSignal = {
  id: string;
  signal_key: string;
  title: string;
  summary: string;
  score: number;
  weight: number;
  polarity: "positive" | "mixed" | "concern";
};

export type TimelineEvent = {
  id: string;
  date: string;
  platform: string;
  title: string;
  summary: string;
  url: string;
};

export type EvidenceClaim = {
  id: string;
  claim_type: string;
  claim_text: string;
  support_level: "supported" | "partial" | "unresolved";
  evidence: string;
  source_url: string;
};

export type FingerprintPoint = {
  id: string;
  coord_x: number;
  coord_y: number;
  cluster_label: number;
  is_outlier: boolean;
  platform: string;
  observed_at: string;
  title: string;
  snippet: string;
  text_length: number;
};

export type InvestigationRecord = InvestigationInput & {
  id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  analysis_started_at: string;
  status: InvestigationStatus;
  stage_index: number;
  progress_percent: number;
  counters: InvestigationCounters;
  consistency_score: number | null;
  confidence_band: string | null;
  classification: string | null;
  dossier_summary: string | null;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  evidence_confidence_score?: number | null;
  confidence_rationale?: string[];
  contradictions?: EvidenceContradiction[];
  limitations?: string[];
  methodology_version?: string;
  analysis_revision?: number;
  revision_summary?: AnalysisRevisionSnapshot;
  analysis_history?: AnalysisRevisionSnapshot[];
  sources: EvidenceSource[];
  signals: InvestigationSignal[];
  timeline: TimelineEvent[];
  claims: EvidenceClaim[];
  embeddings: FingerprintPoint[];
};

export type InvestigationListItem = Pick<
  InvestigationRecord,
  | "id"
  | "subject_name"
  | "status"
  | "consistency_score"
  | "context"
  | "created_at"
  | "updated_at"
  | "stage_index"
  | "analysis_revision"
>;

export type InvestigationOperation = {
  id: string;
  investigationId: string;
  capability: string;
  status: string;
  detail: string;
  metric: string;
  durationMs: number;
  externalRef: string;
  startedAt: string;
  completedAt: string;
};
