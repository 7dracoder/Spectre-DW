import type {
  EvidenceClaim,
  EvidenceSource,
  FingerprintPoint,
  InvestigationInput,
  InvestigationRecord,
  InvestigationSignal,
  TimelineEvent,
} from "@/types/investigation";

const STORAGE_KEY = "specter.investigations.v1";
const STAGE_MS = 850;
const TOTAL_STAGES = 7;

export const PIPELINE_STEPS = [
  {
    key: "discover",
    label: "Establishing the public footprint",
    detail: "Identifying relevant profiles, publications, projects, and dated activity.",
    provider: "Discovery",
  },
  {
    key: "crawl",
    label: "Reviewing public sources",
    detail: "Collecting dated material and preserving source context.",
    provider: "Evidence",
  },
  {
    key: "structure",
    label: "Reconstructing the timeline",
    detail: "Organizing sources, claims, dates, and cross-platform relationships.",
    provider: "Timeline",
  },
  {
    key: "embed",
    label: "Comparing writing patterns",
    detail: "Examining how public language varies across time and context.",
    provider: "Authorship",
  },
  {
    key: "signals",
    label: "Assessing consistency signals",
    detail: "Reviewing continuity, claim support, activity bursts, and coherence.",
    provider: "Signals",
  },
  {
    key: "fingerprint",
    label: "Mapping the writing fingerprint",
    detail: "Grouping public writing samples and highlighting meaningful outliers.",
    provider: "Pattern",
  },
  {
    key: "dossier",
    label: "Preparing the dossier",
    detail: "Summarizing evidence, uncertainty, and recommended verification.",
    provider: "Review",
  },
] as const;

const readAll = (): InvestigationRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const writeAll = (records: InvestigationRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("specter:investigations"));
};

const hash = (value: string) =>
  Array.from(value).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);

const isoYearsAgo = (years: number, month = 0, day = 12) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years, month, day);
  return date.toISOString();
};

const buildSources = (input: InvestigationInput, id: string): EvidenceSource[] => {
  const subject = input.subject_name;
  const github = input.github_username?.replace(/^@/, "") || "specter-demo";
  const xHandle = input.x_handle?.replace(/^@/, "") || "specter_demo";
  const website = input.website_url || "https://example.com";

  return [
    {
      id: `${id}-source-1`,
      platform: "GitHub",
      source_type: "repository",
      url: `https://github.com/${github}`,
      title: `${github} public repositories`,
      published_at: isoYearsAgo(5, 2),
      snippet: "Early utilities and small experiments establish a gradual technical footprint.",
    },
    {
      id: `${id}-source-2`,
      platform: "Website",
      source_type: "article",
      url: website,
      title: `${subject} - project archive`,
      published_at: isoYearsAgo(4, 7),
      snippet: "A dated project archive shows changing tools, vocabulary, and scope over time.",
    },
    {
      id: `${id}-source-3`,
      platform: "GitHub",
      source_type: "readme",
      url: `https://github.com/${github}?tab=repositories`,
      title: "Repository documentation sample",
      published_at: isoYearsAgo(3, 3),
      snippet: "README language becomes more concise and domain-specific across later projects.",
    },
    {
      id: `${id}-source-4`,
      platform: "X",
      source_type: "post",
      url: `https://x.com/${xHandle}`,
      title: `@${xHandle} public posts`,
      published_at: isoYearsAgo(2, 10),
      snippet: "Casual posts differ naturally from formal project writing while retaining recurring phrases.",
    },
    {
      id: `${id}-source-5`,
      platform: "LinkedIn",
      source_type: "profile",
      url: input.linkedin_url || "https://www.linkedin.com",
      title: `${subject} public profile`,
      published_at: isoYearsAgo(2, 1),
      snippet: "Role chronology broadly aligns with the public project and writing timeline.",
    },
    {
      id: `${id}-source-6`,
      platform: "Website",
      source_type: "article",
      url: website,
      title: "Recent long-form writing sample",
      published_at: isoYearsAgo(1, 6),
      snippet: "Recent writing is more polished, but retains distinctive sentence rhythm and terminology.",
    },
    {
      id: `${id}-source-7`,
      platform: "GitHub",
      source_type: "commit-history",
      url: `https://github.com/${github}`,
      title: "Contribution activity",
      published_at: isoYearsAgo(0, 1),
      snippet: "Activity contains realistic gaps and bursts rather than a perfectly uniform cadence.",
    },
  ];
};

const buildSignals = (id: string, seed: number): InvestigationSignal[] => {
  const shift = Math.abs(seed % 6);
  return [
    {
      id: `${id}-signal-1`,
      signal_key: "timeline_depth",
      title: "Timeline depth",
      summary: "Public activity spans multiple years with dated evidence from several source types.",
      score: 82 + shift,
      weight: 12,
      polarity: "positive",
    },
    {
      id: `${id}-signal-2`,
      signal_key: "growth_continuity",
      title: "Growth continuity",
      summary: "Skills and project complexity increase gradually instead of appearing fully formed.",
      score: 78 + shift,
      weight: 12,
      polarity: "positive",
    },
    {
      id: `${id}-signal-3`,
      signal_key: "writing_evolution",
      title: "Writing evolution",
      summary: "Distinct contexts cluster separately while preserving a recognizable author fingerprint.",
      score: 74 + shift,
      weight: 15,
      polarity: "positive",
    },
    {
      id: `${id}-signal-4`,
      signal_key: "expertise_match",
      title: "Expertise evidence match",
      summary: "Most stated capabilities are supported by dated output, with one recent claim still thinly evidenced.",
      score: 69 + shift,
      weight: 18,
      polarity: "mixed",
    },
    {
      id: `${id}-signal-5`,
      signal_key: "burst_anomaly",
      title: "Activity burst anomaly",
      summary: "A concentrated recent publishing window deserves manual review, but is not conclusive on its own.",
      score: 48 + shift,
      weight: 10,
      polarity: "concern",
    },
    {
      id: `${id}-signal-6`,
      signal_key: "cross_platform",
      title: "Cross-platform coherence",
      summary: "Names, topics, and chronology are broadly consistent across the discovered footprint.",
      score: 79 + shift,
      weight: 10,
      polarity: "positive",
    },
    {
      id: `${id}-signal-7`,
      signal_key: "fingerprint_diversity",
      title: "Fingerprint diversity",
      summary: "The writing map shows healthy variation by platform plus two stylistic outliers.",
      score: 76 + shift,
      weight: 10,
      polarity: "mixed",
    },
  ];
};

const buildTimeline = (sources: EvidenceSource[]): TimelineEvent[] =>
  sources.slice(0, 6).map((source, index) => ({
    id: `${source.id}-event`,
    date: source.published_at,
    platform: source.platform,
    title: source.title,
    summary: source.snippet,
    url: source.url,
  })).sort((a, b) => a.date.localeCompare(b.date));

const buildClaims = (input: InvestigationInput, id: string): EvidenceClaim[] => [
  {
    id: `${id}-claim-1`,
    claim_type: "experience",
    claim_text: "Demonstrates sustained work in the claimed domain.",
    support_level: "supported",
    evidence: "Dated repositories and project writing show increasing scope across several years.",
    source_url: input.website_url || `https://github.com/${input.github_username || "specter-demo"}`,
  },
  {
    id: `${id}-claim-2`,
    claim_type: "authorship",
    claim_text: "Public writing appears to come from one evolving author.",
    support_level: "supported",
    evidence: "The fingerprint retains recurring phrasing while drifting naturally by year and context.",
    source_url: input.website_url || "https://example.com",
  },
  {
    id: `${id}-claim-3`,
    claim_type: "recent-expertise",
    claim_text: "Recent senior-level expertise is fully evidenced.",
    support_level: "partial",
    evidence: "Recent output is credible but compressed into a shorter window than the older evidence.",
    source_url: input.linkedin_url || "https://www.linkedin.com",
  },
  {
    id: `${id}-claim-4`,
    claim_type: "identity-continuity",
    claim_text: "All discovered profiles can be conclusively tied to the same person.",
    support_level: "unresolved",
    evidence: "The profiles align strongly, but manual verification is still appropriate for consequential use.",
    source_url: input.other_profile_url || input.website_url || "https://example.com",
  },
];

const buildEmbeddings = (
  sources: EvidenceSource[],
  id: string,
  seed: number,
): FingerprintPoint[] =>
  Array.from({ length: 54 }, (_, index) => {
    const cluster = index % 4;
    const angle = index * 1.73 + seed * 0.01;
    const radius = 8 + ((index * 7) % 13);
    const centers = [
      [25, 28],
      [66, 30],
      [42, 68],
      [74, 70],
    ];
    const source = sources[index % sources.length];
    const isOutlier = index === 17 || index === 43;
    return {
      id: `${id}-point-${index}`,
      coord_x: isOutlier ? 12 + index : centers[cluster][0] + Math.cos(angle) * radius,
      coord_y: isOutlier ? 82 - index / 2 : centers[cluster][1] + Math.sin(angle) * radius,
      cluster_label: cluster,
      is_outlier: isOutlier,
      platform: source.platform,
      observed_at: source.published_at,
      title: source.title,
      snippet: source.snippet,
      text_length: 180 + ((index * 97) % 920),
    };
  });

const buildRecord = (input: InvestigationInput, id: string): InvestigationRecord => {
  const now = new Date().toISOString();
  const seed = hash(`${input.subject_name}:${input.github_username}:${input.website_url}`);
  const sources = buildSources(input, id);
  const signals = buildSignals(id, seed);
  const weighted = signals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const score = Math.round(weighted / totalWeight);

  return {
    ...input,
    id,
    created_by: "demo-user",
    created_at: now,
    updated_at: now,
    analysis_started_at: now,
    status: "running",
    stage_index: 0,
    progress_percent: 3,
    counters: {
      sources: 0,
      platforms: 0,
      timelineEvents: 0,
      claims: 0,
      writingSamples: 0,
      clusters: 0,
    },
    consistency_score: score,
    confidence_band: "Moderate-high",
    classification: score >= 81 ? "High confidence human pattern" : "Mostly organic, minor anomalies",
    dossier_summary:
      `${input.subject_name}'s public footprint shows a gradual, multi-year pattern with meaningful variation across technical, formal, and casual contexts. ` +
      "The strongest evidence is timeline depth and cross-platform coherence. A concentrated recent publishing burst and one thinly supported expertise claim merit manual review, but the overall pattern is more consistent with an evolving person than an identity assembled all at once.",
    strengths: [
      "Dated evidence stretches across several years and multiple source types.",
      "Writing changes naturally between repositories, profiles, short posts, and long-form work.",
      "Claimed skills broadly align with the progression visible in public output.",
    ],
    concerns: [
      "A recent cluster of polished content appeared within a compressed time window.",
      "Two writing samples sit outside the main stylistic clusters and should be reviewed in context.",
    ],
    recommendations: [
      "Manually verify the two outlier sources before making a consequential decision.",
      "Ask for one recent work sample tied to the senior-level expertise claim.",
      "Use this dossier alongside interviews, references, and direct identity verification.",
    ],
    sources,
    signals,
    timeline: buildTimeline(sources),
    claims: buildClaims(input, id),
    embeddings: buildEmbeddings(sources, id, seed),
  };
};

const advance = (record: InvestigationRecord): InvestigationRecord => {
  if (record.status === "complete" || record.status === "failed") return record;
  const elapsed = Math.max(0, Date.now() - new Date(record.analysis_started_at).getTime());
  const stageIndex = Math.min(TOTAL_STAGES - 1, Math.floor(elapsed / STAGE_MS));
  const ratio = Math.min(1, elapsed / (STAGE_MS * TOTAL_STAGES));
  const complete = ratio >= 1;

  return {
    ...record,
    status: complete ? "complete" : "running",
    stage_index: stageIndex,
    progress_percent: complete ? 100 : Math.max(3, Math.round(ratio * 96)),
    updated_at: new Date().toISOString(),
    counters: {
      sources: Math.min(record.sources.length, Math.floor(ratio * record.sources.length + 1)),
      platforms: Math.min(4, Math.floor(ratio * 5)),
      timelineEvents: Math.min(record.timeline.length, Math.floor(ratio * record.timeline.length)),
      claims: Math.min(record.claims.length, Math.floor(ratio * record.claims.length)),
      writingSamples: Math.min(record.embeddings.length, Math.floor(ratio * record.embeddings.length)),
      clusters: stageIndex >= 5 ? 4 : 0,
    },
  };
};

export const createLocalInvestigation = (input: InvestigationInput) => {
  const id = `demo-${crypto.randomUUID()}`;
  const record = buildRecord(input, id);
  writeAll([record, ...readAll()]);
  return record;
};

export const getLocalInvestigation = (id: string) => {
  const records = readAll();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return null;
  const next = advance(records[index]);
  records[index] = next;
  writeAll(records);
  return next;
};

export const listLocalInvestigations = () =>
  readAll()
    .map(advance)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

export const createFeaturedDemo = () =>
  createLocalInvestigation({
    subject_name: "Maya Chen",
    github_username: "maya-builds",
    x_handle: "@mayachen",
    linkedin_url: "https://www.linkedin.com",
    website_url: "https://example.com/maya",
    other_profile_url: "https://example.com/maya/writing",
    context: "hiring",
    notes: "Demo subject with a multi-year public engineering and writing footprint.",
  });
