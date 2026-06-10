import type {
  InvestigationNarrative,
  PublicEvidence,
  PublicEvidenceResult,
} from "./providers";

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

const hash = (value: string) =>
  Array.from(value).reduce(
    (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0,
    0,
  );

const isoYearsAgo = (years: number, month = 0, day = 12) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years, month, day);
  return date.toISOString();
};

export const buildInvestigationRecord = (
  input: InvestigationInput,
  id: string,
  owner: string,
  createdAt: string,
) => {
  const subject = input.subject_name;
  const github = input.github_username?.replace(/^@/, "") || "specter-demo";
  const xHandle = input.x_handle?.replace(/^@/, "") || "specter_demo";
  const website = input.website_url || "https://example.com";
  const seed = hash(`${subject}:${github}:${website}`);
  const shift = Math.abs(seed % 6);

  const sources = [
    {
      id: `${id}-source-1`,
      platform: "GitHub",
      source_type: "repository",
      url: `https://github.com/${github}`,
      title: `${github} public repositories`,
      published_at: isoYearsAgo(5, 2),
      snippet:
        "Early utilities and experiments establish a gradual technical footprint.",
    },
    {
      id: `${id}-source-2`,
      platform: "Website",
      source_type: "article",
      url: website,
      title: `${subject} - project archive`,
      published_at: isoYearsAgo(4, 7),
      snippet:
        "A dated archive shows changing tools, vocabulary, and scope over time.",
    },
    {
      id: `${id}-source-3`,
      platform: "GitHub",
      source_type: "readme",
      url: `https://github.com/${github}?tab=repositories`,
      title: "Repository documentation sample",
      published_at: isoYearsAgo(3, 3),
      snippet:
        "README language becomes more concise and domain-specific across later projects.",
    },
    {
      id: `${id}-source-4`,
      platform: "X",
      source_type: "post",
      url: `https://x.com/${xHandle}`,
      title: `@${xHandle} public posts`,
      published_at: isoYearsAgo(2, 10),
      snippet:
        "Casual posts differ from formal writing while retaining recurring phrases.",
    },
    {
      id: `${id}-source-5`,
      platform: "LinkedIn",
      source_type: "profile",
      url: input.linkedin_url || "https://www.linkedin.com",
      title: `${subject} public profile`,
      published_at: isoYearsAgo(2, 1),
      snippet:
        "Role chronology broadly aligns with the public project and writing timeline.",
    },
    {
      id: `${id}-source-6`,
      platform: "Website",
      source_type: "article",
      url: website,
      title: "Recent long-form writing sample",
      published_at: isoYearsAgo(1, 6),
      snippet:
        "Recent writing is more polished but retains sentence rhythm and terminology.",
    },
    {
      id: `${id}-source-7`,
      platform: "GitHub",
      source_type: "commit-history",
      url: `https://github.com/${github}`,
      title: "Contribution activity",
      published_at: isoYearsAgo(0, 1),
      snippet:
        "Activity contains realistic gaps and bursts rather than a uniform cadence.",
    },
  ];

  const signals = [
    {
      id: `${id}-signal-1`,
      signal_key: "timeline_depth",
      title: "Timeline depth",
      summary:
        "Public activity spans multiple years with dated evidence from several source types.",
      score: 82 + shift,
      weight: 12,
      polarity: "positive",
    },
    {
      id: `${id}-signal-2`,
      signal_key: "growth_continuity",
      title: "Growth continuity",
      summary:
        "Skills and project complexity increase gradually instead of appearing fully formed.",
      score: 78 + shift,
      weight: 12,
      polarity: "positive",
    },
    {
      id: `${id}-signal-3`,
      signal_key: "writing_evolution",
      title: "Writing evolution",
      summary:
        "Distinct contexts cluster separately while preserving a recognizable fingerprint.",
      score: 74 + shift,
      weight: 15,
      polarity: "positive",
    },
    {
      id: `${id}-signal-4`,
      signal_key: "expertise_match",
      title: "Expertise evidence match",
      summary:
        "Most capabilities are supported by dated output, with one recent claim thinly evidenced.",
      score: 69 + shift,
      weight: 18,
      polarity: "mixed",
    },
    {
      id: `${id}-signal-5`,
      signal_key: "burst_anomaly",
      title: "Activity burst anomaly",
      summary:
        "A concentrated recent publishing window deserves manual review.",
      score: 48 + shift,
      weight: 10,
      polarity: "concern",
    },
    {
      id: `${id}-signal-6`,
      signal_key: "cross_platform",
      title: "Cross-platform coherence",
      summary:
        "Names, topics, and chronology are broadly consistent across the footprint.",
      score: 79 + shift,
      weight: 10,
      polarity: "positive",
    },
    {
      id: `${id}-signal-7`,
      signal_key: "fingerprint_diversity",
      title: "Fingerprint diversity",
      summary:
        "The writing map shows healthy variation plus two stylistic outliers.",
      score: 76 + shift,
      weight: 10,
      polarity: "mixed",
    },
  ];

  const weighted = signals.reduce(
    (sum, signal) => sum + signal.score * signal.weight,
    0,
  );
  const totalWeight = signals.reduce(
    (sum, signal) => sum + signal.weight,
    0,
  );
  const score = Math.round(weighted / totalWeight);

  const timeline = sources
    .slice(0, 6)
    .map((source) => ({
      id: `${source.id}-event`,
      date: source.published_at,
      platform: source.platform,
      title: source.title,
      summary: source.snippet,
      url: source.url,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const claims = [
    {
      id: `${id}-claim-1`,
      claim_type: "experience",
      claim_text: "Demonstrates sustained work in the claimed domain.",
      support_level: "supported",
      evidence:
        "Dated repositories and project writing show increasing scope across several years.",
      source_url: website,
    },
    {
      id: `${id}-claim-2`,
      claim_type: "authorship",
      claim_text: "Public writing appears to come from one evolving author.",
      support_level: "supported",
      evidence:
        "The fingerprint retains recurring phrasing while drifting naturally by context.",
      source_url: website,
    },
    {
      id: `${id}-claim-3`,
      claim_type: "recent-expertise",
      claim_text: "Recent senior-level expertise is fully evidenced.",
      support_level: "partial",
      evidence:
        "Recent output is credible but compressed into a shorter window than older evidence.",
      source_url: input.linkedin_url || "https://www.linkedin.com",
    },
    {
      id: `${id}-claim-4`,
      claim_type: "identity-continuity",
      claim_text:
        "All discovered profiles can be conclusively tied to the same person.",
      support_level: "unresolved",
      evidence:
        "Profiles align strongly, but consequential use still requires manual verification.",
      source_url: input.other_profile_url || website,
    },
  ];

  const embeddings = Array.from({ length: 54 }, (_, index) => {
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
      coord_x: isOutlier
        ? 12 + index
        : centers[cluster][0] + Math.cos(angle) * radius,
      coord_y: isOutlier
        ? 82 - index / 2
        : centers[cluster][1] + Math.sin(angle) * radius,
      cluster_label: cluster,
      is_outlier: isOutlier,
      platform: source.platform,
      observed_at: source.published_at,
      title: source.title,
      snippet: source.snippet,
      text_length: 180 + ((index * 97) % 920),
    };
  });

  const updatedAt = new Date().toISOString();
  return {
    ...input,
    id,
    created_by: owner,
    created_at: createdAt,
    updated_at: updatedAt,
    analysis_started_at: createdAt,
    status: "complete",
    stage_index: 6,
    progress_percent: 100,
    counters: {
      sources: sources.length,
      platforms: new Set(sources.map((source) => source.platform)).size,
      timelineEvents: timeline.length,
      claims: claims.length,
      writingSamples: embeddings.length,
      clusters: 4,
    },
    consistency_score: score,
    confidence_band: "Moderate-high",
    classification:
      score >= 81
        ? "Strong sample evidence alignment"
        : "Mixed sample evidence alignment",
    dossier_summary:
      `${subject}'s public footprint shows a gradual, multi-year pattern with meaningful variation across technical, formal, and casual contexts. ` +
      "The strongest evidence is timeline depth and cross-platform coherence. A concentrated recent publishing burst and one thinly supported expertise claim merit manual review, but the overall pattern is more consistent with an evolving person than an identity assembled all at once.",
    strengths: [
      "Dated evidence stretches across several years and multiple source types.",
      "Writing changes naturally between repositories, profiles, posts, and long-form work.",
      "Claimed skills broadly align with the progression visible in public output.",
    ],
    concerns: [
      "A recent cluster of polished content appeared within a compressed time window.",
      "Two writing samples sit outside the main stylistic clusters.",
    ],
    recommendations: [
      "Manually verify the two outlier sources before making a consequential decision.",
      "Ask for one recent work sample tied to the senior-level expertise claim.",
      "Use this dossier alongside interviews, references, and direct identity verification.",
    ],
    sources,
    signals,
    timeline,
    claims,
    embeddings,
  };
};

export const buildInsufficientInvestigationRecord = (
  input: InvestigationInput,
  id: string,
  owner: string,
  createdAt: string,
) => {
  const record = buildInvestigationRecord(input, id, owner, createdAt);
  const submittedClaims = [
    input.github_username
      ? `Submitted GitHub identifier @${input.github_username.replace(/^@/, "")}`
      : "",
    input.x_handle
      ? `Submitted X identifier @${input.x_handle.replace(/^@/, "")}`
      : "",
    input.linkedin_url ? "Submitted LinkedIn profile" : "",
    input.website_url ? "Submitted website" : "",
    input.other_profile_url ? "Submitted additional profile" : "",
  ].filter(Boolean);

  record.sources = [];
  record.timeline = [];
  record.embeddings = [];
  record.signals = [
    {
      id: `${id}-signal-identity`,
      signal_key: "identity_match",
      title: "Identity anchor match",
      summary: "No retrieved public source met the minimum identity-match threshold.",
      score: 10,
      weight: 40,
      polarity: "concern",
    },
    {
      id: `${id}-signal-quality`,
      signal_key: "source_quality",
      title: "Source quality",
      summary: "No independently retained source was available for quality assessment.",
      score: 10,
      weight: 25,
      polarity: "concern",
    },
    {
      id: `${id}-signal-timeline`,
      signal_key: "timeline_depth",
      title: "Chronology coverage",
      summary: "No reliable publication dates were retained.",
      score: 5,
      weight: 20,
      polarity: "concern",
    },
    {
      id: `${id}-signal-diversity`,
      signal_key: "evidence_diversity",
      title: "Evidence diversity",
      summary: "No verified cross-source comparison was possible.",
      score: 5,
      weight: 15,
      polarity: "concern",
    },
  ];
  record.claims = submittedClaims.map((claim, index) => ({
    id: `${id}-claim-${index + 1}`,
    claim_type: "submitted-identifier",
    claim_text: claim,
    support_level: "unresolved",
    evidence:
      "The identifier was submitted for review, but no sufficiently matched public source was retained.",
    source_url: "",
  }));
  record.consistency_score = calculateWeightedScore(record.signals);
  record.confidence_band = "Low";
  record.classification = "Insufficient verified public evidence";
  record.dossier_summary = `${input.subject_name}'s submitted identifiers were retained, but public discovery did not return evidence with a strong enough identity match for a reliable consistency assessment. No ownership, authorship, chronology, or cross-profile continuity conclusion should be drawn from this dossier.`;
  record.strengths = [
    "Submitted identifiers remain available for direct manual verification.",
    "Weakly matched search results were excluded instead of being treated as evidence.",
  ];
  record.concerns = [
    "No public source met the identity-match threshold.",
    "The dossier cannot assess chronology, source continuity, or ownership.",
  ];
  record.recommendations = [
    "Verify each submitted profile URL directly with the subject.",
    "Add exact profile URLs or a verified personal domain, then run the investigation again.",
    "Do not use this dossier for a consequential decision.",
  ];
  return {
    ...record,
    evidence_confidence_score: 8,
    confidence_rationale: [
      "No independently retained source.",
      "No reliable publication-date coverage.",
      "No cross-source corroboration.",
    ],
    contradictions: [],
    limitations: [
      "Search snippets can omit context and do not prove account ownership.",
      "No content-level authorship or contradiction analysis was possible.",
    ],
    methodology_version: "public-evidence-v2",
    counters: {
      sources: 0,
      platforms: 0,
      timelineEvents: 0,
      claims: record.claims.length,
      writingSamples: 0,
      clusters: 0,
    },
  };
};

const cleanText = (value: string, fallback: string, maxLength = 360) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}...`
    : normalized;
};

const classifySource = (result: PublicEvidenceResult) => {
  const hostname = result.url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/, 1)[0]
    .split(":", 1)[0];
  if (hostname === "github.com") {
    return { platform: "GitHub", sourceType: "repository" };
  }
  if (hostname.endsWith("linkedin.com")) {
    return { platform: "LinkedIn", sourceType: "profile" };
  }
  if (hostname === "x.com" || hostname === "twitter.com") {
    return { platform: "X", sourceType: "post" };
  }
  if (hostname.endsWith("youtube.com") || hostname === "youtu.be") {
    return { platform: "YouTube", sourceType: "media" };
  }
  return { platform: "Website", sourceType: "webpage" };
};

const normalizePublishedAt = (value: string | undefined) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

const calculateWeightedScore = (
  signals: Array<{ score: number; weight: number }>,
) => {
  const weighted = signals.reduce(
    (sum, signal) => sum + signal.score * signal.weight,
    0,
  );
  const totalWeight = signals.reduce(
    (sum, signal) => sum + signal.weight,
    0,
  );
  return Math.round(weighted / totalWeight);
};

export const buildLiveInvestigationRecord = (
  input: InvestigationInput,
  id: string,
  owner: string,
  createdAt: string,
  evidence: PublicEvidence,
  narrative?: InvestigationNarrative | null,
) => {
  const record = buildInsufficientInvestigationRecord(
    input,
    id,
    owner,
    createdAt,
  );
  const sources = evidence.results.slice(0, 10).map((result, index) => {
    const classification = classifySource(result);
    return {
      id: `${id}-source-${index + 1}`,
      platform: classification.platform,
      source_type: classification.sourceType,
      url: result.url,
      title: cleanText(
        result.title,
        `${input.subject_name} public source ${index + 1}`,
        160,
      ),
      published_at: normalizePublishedAt(result.publishedAt),
      snippet: cleanText(
        result.description || result.content,
        "The source was discovered publicly, but no descriptive excerpt was returned.",
      ),
      identity_match_score: result.identityScore,
      source_quality_score: result.qualityScore,
      date_confidence: result.dateConfidence,
      matched_anchors: result.matchedAnchors,
    };
  });

  const platformCount = new Set(sources.map((source) => source.platform)).size;
  const datedSources = sources.filter((source) => Boolean(source.published_at));
  const datedCount = datedSources.length;
  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  const identityScore = Math.round(
    average(sources.map((source) => source.identity_match_score)),
  );
  const sourceQualityScore = Math.round(
    average(sources.map((source) => source.source_quality_score)),
  );
  const chronologyScore = Math.round(
    15 +
      (datedCount / Math.max(1, sources.length)) * 55 +
      Math.min(20, datedCount * 4),
  );
  const anchorCoverage = Math.round(
    (evidence.matchedAnchors.length /
      Math.max(1, evidence.submittedAnchors.length)) *
      100,
  );
  const diversityScore = Math.round(
    Math.min(70, platformCount * 20) +
      Math.min(30, sources.length * 5),
  );

  record.signals = [
    {
      id: `${id}-signal-identity`,
      signal_key: "identity_match",
      title: "Identity anchor match",
      summary: `${evidence.matchedAnchors.length} of ${evidence.submittedAnchors.length} submitted identity anchors matched retained sources.`,
      score: identityScore,
      weight: 40,
      polarity: identityScore >= 75 ? "positive" : identityScore >= 50 ? "mixed" : "concern",
    },
    {
      id: `${id}-signal-quality`,
      signal_key: "source_quality",
      title: "Source quality",
      summary:
        "Quality favors exact submitted URLs and first-party profile matches over generic search mentions.",
      score: sourceQualityScore,
      weight: 25,
      polarity:
        sourceQualityScore >= 75
          ? "positive"
          : sourceQualityScore >= 55
            ? "mixed"
            : "concern",
    },
    {
      id: `${id}-signal-timeline`,
      signal_key: "timeline_depth",
      title: "Chronology coverage",
      summary: `${datedCount} of ${sources.length} retained sources include a usable reported publication date.`,
      score: chronologyScore,
      weight: 20,
      polarity:
        chronologyScore >= 70
          ? "positive"
          : chronologyScore >= 45
            ? "mixed"
            : "concern",
    },
    {
      id: `${id}-signal-diversity`,
      signal_key: "evidence_diversity",
      title: "Evidence diversity",
      summary: `${sources.length} retained sources span ${platformCount} source ${platformCount === 1 ? "category" : "categories"}.`,
      score: diversityScore,
      weight: 15,
      polarity:
        diversityScore >= 70
          ? "positive"
          : diversityScore >= 45
            ? "mixed"
            : "concern",
    },
  ];

  record.sources = sources;
  record.timeline = datedSources
    .map((source) => ({
      id: `${source.id}-event`,
      date: source.published_at,
      platform: source.platform,
      title: source.title,
      summary: source.snippet,
      url: source.url,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  record.embeddings = [];

  const findAnchorSource = (prefixes: string[]) =>
    sources.find((source) =>
      source.matched_anchors.some((anchor) =>
        prefixes.some((prefix) => anchor.startsWith(prefix)),
      ),
    );
  const claimInputs = [
    input.github_username
      ? {
          type: "github-identifier",
          text: `Submitted GitHub identifier @${input.github_username.replace(/^@/, "")} appears in retained evidence.`,
          prefixes: ["github:", "url:github.com/"],
          fallbackUrl: `https://github.com/${input.github_username.replace(/^@/, "")}`,
        }
      : null,
    input.x_handle
      ? {
          type: "x-identifier",
          text: `Submitted X identifier @${input.x_handle.replace(/^@/, "")} appears in retained evidence.`,
          prefixes: ["x:", "url:x.com/", "url:twitter.com/"],
          fallbackUrl: `https://x.com/${input.x_handle.replace(/^@/, "")}`,
        }
      : null,
    input.linkedin_url
      ? {
          type: "linkedin-profile",
          text: "Submitted LinkedIn profile appears in retained evidence.",
          prefixes: ["linkedin:"],
          fallbackUrl: input.linkedin_url,
        }
      : null,
    input.website_url
      ? {
          type: "website",
          text: "Submitted website domain appears in retained evidence.",
          prefixes: ["website:", "domain:"],
          fallbackUrl: input.website_url,
        }
      : null,
  ].filter(Boolean) as Array<{
    type: string;
    text: string;
    prefixes: string[];
    fallbackUrl: string;
  }>;

  record.claims = claimInputs.map((claim, index) => {
    const source = findAnchorSource(claim.prefixes);
    return {
      id: `${id}-claim-${index + 1}`,
      claim_type: claim.type,
      claim_text: claim.text,
      support_level: source ? ("supported" as const) : ("unresolved" as const),
      evidence: source
        ? `Matched retained source: ${source.title}. This confirms retrieval alignment, not account ownership.`
        : "No retained source matched this submitted identifier strongly enough.",
      source_url: source?.url || claim.fallbackUrl,
    };
  });
  record.claims.push({
    id: `${id}-claim-continuity`,
    claim_type: "identity-continuity",
    claim_text: "All retained profiles are controlled by the same person.",
    support_level: "unresolved",
    evidence:
      "Public search alignment cannot prove common control. Direct ownership verification is still required.",
    source_url: sources[0]?.url || "",
  });
  record.consistency_score = calculateWeightedScore(record.signals);
  const evidenceConfidenceScore = Math.round(
    identityScore * 0.35 +
      sourceQualityScore * 0.2 +
      Math.min(100, sources.length * 15) * 0.1 +
      anchorCoverage * 0.1 +
      chronologyScore * 0.15 +
      diversityScore * 0.1,
  );
  record.confidence_band =
    evidenceConfidenceScore >= 78
      ? "High"
      : evidenceConfidenceScore >= 58
        ? "Moderate"
        : "Low";
  record.classification =
    evidenceConfidenceScore >= 78 && record.consistency_score >= 75
      ? "Strong public-evidence alignment, ownership unverified"
      : evidenceConfidenceScore >= 55
        ? "Partial public-evidence alignment, verification required"
        : "Limited verified public evidence";

  record.dossier_summary = `${input.subject_name}'s dossier retains ${sources.length} public sources across ${platformCount} source ${platformCount === 1 ? "category" : "categories"} after identity-match filtering. Match scores describe alignment with submitted identifiers, not proof of ownership. ${datedCount} sources include usable reported dates. Direct verification remains required for cross-profile control and consequential decisions.`;
  record.strengths = [
    `${sources.length} sources passed the minimum identity-match threshold.`,
    `${evidence.matchedAnchors.length} identity checks matched retained evidence.`,
    "Each retained source preserves its URL, excerpt, match score, quality score, and date confidence.",
  ];
  record.concerns = [
    `${sources.length - datedCount} sources did not provide a reliable publication date.`,
    `${evidence.unmatchedAnchors.length} identity checks remain unmatched.`,
    "Search-result alignment cannot establish account ownership or common control.",
  ];
  record.recommendations = [
    "Open the highest-impact sources and verify ownership directly.",
    "Compare any dated chronology with references and interview claims.",
    "Treat the score as decision support rather than a final identity verdict.",
  ];

  const limitations = [
    "Search excerpts may omit page context and can become stale.",
    "Reported publication dates were not independently verified.",
    "No authorship fingerprint was generated from search snippets.",
  ];

  record.counters = {
    ...record.counters,
    sources: sources.length,
    platforms: platformCount,
    timelineEvents: record.timeline.length,
    claims: record.claims.length,
    writingSamples: 0,
    clusters: 0,
  };

  return {
    ...record,
    evidence_confidence_score: evidenceConfidenceScore,
    confidence_rationale: [
      `Average identity match: ${identityScore}/100.`,
      `Average source quality: ${sourceQualityScore}/100.`,
      `Submitted anchor coverage: ${anchorCoverage}%.`,
      `Dated source coverage: ${datedCount}/${sources.length}.`,
    ],
    contradictions: [],
    limitations,
    methodology_version: "public-evidence-v2",
  };
};
