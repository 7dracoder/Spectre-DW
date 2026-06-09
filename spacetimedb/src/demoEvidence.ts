type InvestigationInput = {
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
        ? "High confidence human pattern"
        : "Mostly organic, minor anomalies",
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
