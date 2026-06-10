import type { InvestigationInput } from "./demoEvidence";

type HttpResponse = {
  ok: boolean;
  status: number;
  text: () => string;
};

type HttpClient = {
  fetch: (
    url: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ) => HttpResponse;
};

export type PublicEvidenceResult = {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt?: string;
  identityScore: number;
  qualityScore: number;
  matchedAnchors: string[];
  dateConfidence: "reported" | "unknown";
};

export type PublicEvidence = {
  answer?: string;
  requestId?: string;
  requestIds: string[];
  queries: string[];
  results: PublicEvidenceResult[];
  submittedAnchors: string[];
  matchedAnchors: string[];
  unmatchedAnchors: string[];
};

export type InvestigationNarrative = {
  dossierSummary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  limitations: string[];
};

export type DossierAnswer = {
  answer: string;
  citationIds: string[];
  confidence: string;
  limitations: string[];
  model?: string;
  requestId?: string;
  executionTimeMs?: number;
};

export type InvestigationSynthesisResult = {
  narrative: InvestigationNarrative;
  model: string;
  requestId?: string;
  executionTimeMs: number;
  cost?: number;
};

export type TowerReceipt = {
  accepted: boolean;
  externalRef?: string;
  detail: string;
};

export type DossierQuestionContext = {
  subjectName: string;
  question: string;
  summary: string;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    snippet: string;
    platform: string;
    sourceType: string;
    identityMatchScore: number;
    sourceQualityScore: number;
    dateConfidence: string;
  }>;
  signals: Array<{
    title: string;
    score: number;
    summary: string;
  }>;
  claims: Array<{
    claim: string;
    support: string;
    evidence: string;
  }>;
  recommendations: string[];
};

const parseJson = <T>(value: string, label: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} returned an invalid response.`);
  }
};

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeIdentifier = (value: string | undefined) =>
  value?.replace(/^@/, "").trim().toLowerCase() || "";

const normalizeUrl = (value: string | undefined) => {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[?#]/, 1)[0]
    .replace(/\/+$/, "");
};

const getHostname = (value: string | undefined) => {
  const normalized = normalizeUrl(value);
  return normalized.split("/", 1)[0].split(":", 1)[0];
};

type IdentityAnchor = {
  label: string;
  value: string;
  kind: "name" | "username" | "url" | "domain";
  weight: number;
};

const buildIdentityAnchors = (input: InvestigationInput) => {
  const anchors: IdentityAnchor[] = [];
  const subject = input.subject_name.trim().toLowerCase();
  if (subject) {
    anchors.push({
      label: `name:${subject}`,
      value: subject,
      kind: "name",
      weight: subject.includes(" ") ? 45 : 30,
    });
  }

  const github = normalizeIdentifier(input.github_username);
  if (github) {
    anchors.push({
      label: `github:${github}`,
      value: github,
      kind: "username",
      weight: 55,
    });
    anchors.push({
      label: `url:github.com/${github}`,
      value: `github.com/${github}`,
      kind: "url",
      weight: 75,
    });
  }

  const xHandle = normalizeIdentifier(input.x_handle);
  if (xHandle) {
    anchors.push({
      label: `x:${xHandle}`,
      value: xHandle,
      kind: "username",
      weight: 55,
    });
    anchors.push({
      label: `url:x.com/${xHandle}`,
      value: `x.com/${xHandle}`,
      kind: "url",
      weight: 75,
    });
    anchors.push({
      label: `url:twitter.com/${xHandle}`,
      value: `twitter.com/${xHandle}`,
      kind: "url",
      weight: 75,
    });
  }

  for (const [label, value] of [
    ["linkedin", input.linkedin_url],
    ["website", input.website_url],
    ["profile", input.other_profile_url],
  ] as const) {
    const normalized = normalizeUrl(value);
    if (!normalized) continue;
    anchors.push({
      label: `${label}:${normalized}`,
      value: normalized,
      kind: "url",
      weight: 80,
    });
    const hostname = getHostname(value);
    if (hostname && !["github.com", "linkedin.com", "x.com", "twitter.com"].includes(hostname)) {
      anchors.push({
        label: `domain:${hostname}`,
        value: hostname,
        kind: "domain",
        weight: 65,
      });
    }
  }

  return anchors;
};

const scoreEvidenceResult = (
  input: InvestigationInput,
  result: Omit<
    PublicEvidenceResult,
    "identityScore" | "qualityScore" | "matchedAnchors" | "dateConfidence"
  >,
) => {
  const anchors = buildIdentityAnchors(input);
  const normalizedResultUrl = normalizeUrl(result.url);
  const searchable =
    `${result.title} ${result.description} ${result.content} ${result.url}`
      .toLowerCase()
      .replace(/\s+/g, " ");
  const matched = anchors.filter((anchor) => {
    if (anchor.kind === "url") {
      return (
        normalizedResultUrl === anchor.value ||
        normalizedResultUrl.startsWith(`${anchor.value}/`)
      );
    }
    if (anchor.kind === "domain") {
      return getHostname(result.url) === anchor.value;
    }
    return searchable.includes(anchor.value);
  });

  const exactUrlMatch = matched.some((anchor) => anchor.kind === "url");
  const domainMatch = matched.some((anchor) => anchor.kind === "domain");
  const usernameMatch = matched.some((anchor) => anchor.kind === "username");
  const nameMatch = matched.some((anchor) => anchor.kind === "name");
  const identityScore = clampScore(
    Math.max(0, ...matched.map((anchor) => anchor.weight)) +
      (exactUrlMatch && nameMatch ? 10 : 0) +
      (usernameMatch && nameMatch ? 8 : 0),
  );

  const hostname = getHostname(result.url);
  let qualityScore = 45;
  if (exactUrlMatch) qualityScore = 92;
  else if (domainMatch) qualityScore = 86;
  else if (hostname === "github.com") qualityScore = 78;
  else if (hostname.endsWith("linkedin.com")) qualityScore = 74;
  else if (hostname === "x.com" || hostname === "twitter.com") qualityScore = 68;
  else if (nameMatch) qualityScore = 58;
  if (!result.description && !result.content) qualityScore -= 12;

  const hasValidDate =
    Boolean(result.publishedAt) &&
    !Number.isNaN(new Date(result.publishedAt || "").getTime());

  return {
    ...result,
    identityScore,
    qualityScore: clampScore(qualityScore),
    matchedAnchors: Array.from(new Set(matched.map((anchor) => anchor.label))),
    dateConfidence: hasValidDate ? ("reported" as const) : ("unknown" as const),
  };
};

const buildSearchQuery = (input: InvestigationInput) => {
  const identifiers = new Set<string>([input.subject_name.trim()]);
  if (input.github_username) {
    identifiers.add(input.github_username.replace(/^@/, "").trim());
    identifiers.add("GitHub");
  }
  if (input.x_handle) {
    identifiers.add(input.x_handle.replace(/^@/, "").trim());
    identifiers.add("X");
  }

  const terms = Array.from(identifiers).filter(Boolean);
  if (terms.length === 1) terms.push("public profile");
  return terms.join(" ");
};

const buildSearchQueries = (input: InvestigationInput) => {
  const queries = [buildSearchQuery(input)];
  const subject = input.subject_name.trim();
  const normalizedSubject = normalizeIdentifier(subject);
  const github = normalizeIdentifier(input.github_username);
  const xHandle = normalizeIdentifier(input.x_handle);

  if (input.website_url) {
    const hostname = getHostname(input.website_url);
    queries.push(
      hostname
        ? `${subject} site:${hostname}`
        : `${subject} personal website`,
    );
  }
  if (github && normalizedSubject !== github) {
    queries.push(`${github} GitHub repositories projects`);
  }
  if (xHandle && normalizedSubject !== xHandle) {
    queries.push(`${subject} ${xHandle} public posts`);
  }
  if (input.linkedin_url) queries.push(`${subject} LinkedIn public profile`);
  if (input.other_profile_url) {
    const hostname = getHostname(input.other_profile_url);
    if (hostname) queries.push(`${subject} site:${hostname}`);
  }

  return Array.from(new Set(queries.map((query) => query.trim())))
    .filter(Boolean)
    .slice(0, 3);
};

const identityTerms = (input: InvestigationInput) =>
  buildIdentityAnchors(input)
    .filter((anchor) => anchor.kind === "name" || anchor.kind === "username")
    .map((anchor) => anchor.value)
    .filter((value) => value.length >= 3);

export const discoverPublicEvidence = (
  http: HttpClient,
  apiKey: string,
  input: InvestigationInput,
): PublicEvidence => {
  const queries = buildSearchQueries(input);
  const requestIds: string[] = [];
  const answers: string[] = [];
  const allResults: PublicEvidenceResult[] = [];

  for (const query of queries) {
    const response = http.fetch("https://sdk.nimbleway.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        focus: "general",
        max_results: 8,
        search_depth: "lite",
        include_answer: true,
      }),
    });
    const responseText = response.text();
    if (!response.ok) continue;

    const body = parseJson<{
      answer?: unknown;
      request_id?: unknown;
      results?: Array<{
        title?: unknown;
        description?: unknown;
        content?: unknown;
        url?: unknown;
        metadata?: Record<string, unknown>;
      }>;
    }>(responseText, "Public evidence search");
    const requestId = asString(body.request_id);
    if (requestId) requestIds.push(requestId);
    const answer = asString(body.answer);
    if (answer) answers.push(answer);

    for (const result of body.results || []) {
      const metadata = result.metadata || {};
      const publishedAt =
        asString(metadata.published_date) ||
        asString(metadata.published_at) ||
        asString(metadata.date);
      const normalized = scoreEvidenceResult(input, {
        title: asString(result.title),
        description: asString(result.description),
        content: asString(result.content),
        url: asString(result.url),
        publishedAt: publishedAt || undefined,
      });
      if (
        normalized.url &&
        (normalized.title || normalized.description) &&
        !allResults.some((existing) => existing.url === normalized.url)
      ) {
        allResults.push(normalized);
      }
    }
  }

  const identifiers = identityTerms(input);
  const results = allResults
    .filter((result) => result.identityScore >= 45)
    .sort(
      (a, b) =>
        b.identityScore + b.qualityScore - (a.identityScore + a.qualityScore),
    )
    .slice(0, 12);

  if (!results.length) {
    throw new Error(
      "Public evidence search returned no sources with a sufficient identity match.",
    );
  }

  const submittedAnchors = Array.from(
    new Set(buildIdentityAnchors(input).map((anchor) => anchor.label)),
  );
  const matchedAnchors = Array.from(
    new Set(results.flatMap((result) => result.matchedAnchors)),
  );
  const answer = answers.find((candidate) =>
    identifiers.some((identifier) => candidate.toLowerCase().includes(identifier)),
  );
  return {
    answer,
    requestId: requestIds[0],
    requestIds,
    queries,
    results,
    submittedAnchors,
    matchedAnchors,
    unmatchedAnchors: submittedAnchors.filter(
      (anchor) => !matchedAnchors.includes(anchor),
    ),
  };
};

const extractRunpodText = (body: unknown) => {
  if (!body || typeof body !== "object") return "";
  const output = (body as { output?: unknown }).output;
  const items = Array.isArray(output) ? output : output ? [output] : [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const choices = (item as { choices?: unknown }).choices;
    if (!Array.isArray(choices)) continue;
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      const tokens = (choice as { tokens?: unknown }).tokens;
      if (Array.isArray(tokens)) {
        const text = tokens.filter((token) => typeof token === "string").join("");
        if (text.trim()) return text.trim();
      }
      const text = asString((choice as { text?: unknown }).text);
      if (text) return text;
    }
  }

  return "";
};

const extractRunpodCost = (body: unknown) => {
  if (!body || typeof body !== "object") return undefined;
  const output = (body as { output?: unknown }).output;
  const items = Array.isArray(output) ? output : output ? [output] : [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const cost = (item as { cost?: unknown }).cost;
    if (typeof cost === "number") return cost;
  }
  return undefined;
};

const runpodRequestBody = (
  model: string,
  prompt: string,
  maxTokens: number,
  temperature: number,
) =>
  model === "granite-4-0-h-small"
    ? {
        input: {
          messages: [
            {
              role: "system",
              content:
                "You are a careful evidence analyst. Follow the requested output format exactly.",
            },
            { role: "user", content: prompt },
          ],
          sampling_params: {
            max_tokens: maxTokens,
            temperature,
            seed: 17,
            top_k: -1,
            top_p: 0.9,
          },
        },
      }
    : {
        input: {
          prompt,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
        },
      };

const generateRunpodText = (
  http: HttpClient,
  apiKey: string,
  models: string[],
  prompt: string,
  maxTokens: number,
  temperature: number,
) => {
  for (const model of Array.from(new Set(models.filter(Boolean)))) {
    const response = http.fetch(
      `https://api.runpod.ai/v2/${encodeURIComponent(model)}/runsync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          runpodRequestBody(model, prompt, maxTokens, temperature),
        ),
      },
    );
    const responseText = response.text();
    if (!response.ok) continue;

    const body = parseJson<{
      id?: unknown;
      status?: string;
      executionTime?: unknown;
      output?: unknown;
    }>(responseText, "Investigation reasoning");
    if (body.status && body.status !== "COMPLETED") continue;
    const text = extractRunpodText(body);
    if (!text) continue;

    return {
      text,
      model,
      requestId: asString(body.id) || undefined,
      executionTimeMs:
        typeof body.executionTime === "number" ? body.executionTime : 0,
      cost: extractRunpodCost(body),
    };
  }
  return null;
};

const parseNarrative = (value: string): InvestigationNarrative | null => {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(value.slice(start, end + 1)) as {
      dossier_summary?: unknown;
      strengths?: unknown;
      concerns?: unknown;
      recommendations?: unknown;
      limitations?: unknown;
    };
    const dossierSummary = asString(parsed.dossier_summary);
    const toList = (items: unknown) =>
      Array.isArray(items)
        ? items.map(asString).filter(Boolean).slice(0, 4)
        : [];
    const strengths = toList(parsed.strengths);
    const concerns = toList(parsed.concerns);
    const recommendations = toList(parsed.recommendations);
    const limitations = toList(parsed.limitations);

    if (
      !dossierSummary ||
      !strengths.length ||
      !concerns.length ||
      !recommendations.length ||
      !limitations.length
    ) {
      return null;
    }

    return {
      dossierSummary,
      strengths,
      concerns,
      recommendations,
      limitations,
    };
  } catch {
    return null;
  }
};

const parseDossierAnswer = (
  value: string,
  validCitationIds: Set<string>,
): DossierAnswer | null => {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(value.slice(start, end + 1)) as {
      answer?: unknown;
      citation_ids?: unknown;
      confidence?: unknown;
      limitations?: unknown;
    };
    const answer = asString(parsed.answer);
    const citationIds = Array.isArray(parsed.citation_ids)
      ? parsed.citation_ids
          .map(asString)
          .filter((id) => validCitationIds.has(id))
          .slice(0, 5)
      : [];
    const confidence = asString(parsed.confidence);
    const limitations = Array.isArray(parsed.limitations)
      ? parsed.limitations.map(asString).filter(Boolean).slice(0, 4)
      : [];
    if (!answer || (validCitationIds.size > 0 && citationIds.length === 0)) {
      return null;
    }
    return {
      answer,
      citationIds,
      confidence: confidence || "Grounded in the available dossier evidence",
      limitations:
        limitations.length > 0
          ? limitations
          : ["Answer is limited to the retained public-source excerpts."],
    };
  } catch {
    return null;
  }
};

export const synthesizeInvestigation = (
  http: HttpClient,
  apiKey: string,
  model: string,
  fallbackModel: string,
  input: InvestigationInput,
  evidence: PublicEvidence,
): InvestigationSynthesisResult | null => {
  const compactEvidence = evidence.results.slice(0, 10).map((result) => ({
    title: result.title,
    url: result.url,
    published_at: result.publishedAt || null,
    identity_match_score: result.identityScore,
    source_quality_score: result.qualityScore,
    date_confidence: result.dateConfidence,
    matched_anchors: result.matchedAnchors,
    excerpt: (result.description || result.content).slice(0, 700),
  }));
  const prompt = [
    "You are an evidence analyst preparing a public-identity consistency dossier.",
    "Use only the supplied public-source excerpts. Do not declare the subject authentic, fake, deceptive, dangerous, or safe.",
    "Separate observed evidence from uncertainty. Keep recommendations focused on manual verification.",
    "Return only minified JSON with keys dossier_summary, strengths, concerns, recommendations, limitations.",
    "Each list must contain 2 to 4 concise strings.",
    "Do not infer authorship, ownership, chronology, or cross-profile continuity beyond the supplied source metadata.",
    `SUBJECT: ${input.subject_name}`,
    `CONTEXT: ${input.context}`,
    `USER NOTES: ${input.notes || "None"}`,
    `SEARCH SUMMARY: ${evidence.answer || "None"}`,
    `EVIDENCE: ${JSON.stringify(compactEvidence)}`,
  ].join("\n");

  const generation = generateRunpodText(
    http,
    apiKey,
    [model, fallbackModel],
    prompt,
    700,
    0.2,
  );
  if (!generation) return null;
  const narrative = parseNarrative(generation.text);
  return narrative ? { narrative, ...generation } : null;
};

export const synthesizeDossierAnswer = (
  http: HttpClient,
  apiKey: string,
  model: string,
  fallbackModel: string,
  context: DossierQuestionContext,
): DossierAnswer | null => {
  const prompt = [
    "You answer questions about a public-identity evidence dossier.",
    "Use only the supplied dossier. Separate direct evidence from inference and uncertainty.",
    "Never make a definitive authenticity, safety, intent, character, or protected-trait judgment.",
    "Return only minified JSON with keys answer, citation_ids, confidence, limitations.",
    "The answer should be concise but useful. citation_ids must contain only supplied source IDs.",
    "Every factual statement must be supported by at least one cited source. If support is absent, say that the dossier cannot answer.",
    "Refer to each source by its supplied sourceType. Never call a repository or webpage a profile or account.",
    `SUBJECT: ${context.subjectName}`,
    `QUESTION: ${context.question}`,
    `SUMMARY: ${context.summary}`,
    `SOURCES: ${JSON.stringify(context.sources)}`,
    `SIGNALS: ${JSON.stringify(context.signals)}`,
    `CLAIMS: ${JSON.stringify(context.claims)}`,
    `RECOMMENDATIONS: ${JSON.stringify(context.recommendations)}`,
  ].join("\n");

  const generation = generateRunpodText(
    http,
    apiKey,
    [model, fallbackModel],
    prompt,
    550,
    0.15,
  );
  if (!generation) return null;
  const answer = parseDossierAnswer(
    generation.text,
    new Set(context.sources.map((source) => source.id)),
  );
  return answer ? { ...answer, ...generation } : null;
};

export const notifyTower = (
  http: HttpClient,
  apiKey: string,
  appName: string,
  environment: string,
  payload: {
    investigationId: string;
    subjectName: string;
    context: string;
    sourceCount: number;
    consistencyScore: number;
  },
): TowerReceipt => {
  const response = http.fetch(
    `https://api.tower.dev/v1/apps/${encodeURIComponent(appName)}/runs`,
    {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        environment,
        parameters: {
          investigation_id: payload.investigationId,
          subject_name: payload.subjectName,
          context: payload.context,
          source_count: String(payload.sourceCount),
          consistency_score: String(payload.consistencyScore),
        },
      }),
    },
  );

  const responseText = response.text();
  if (!response.ok) {
    return {
      accepted: false,
      detail: `Workflow receipt was rejected with status ${response.status}.`,
    };
  }

  let externalRef: string | undefined;
  try {
    const body = JSON.parse(responseText) as Record<string, unknown>;
    externalRef =
      asString(body.id) ||
      asString(body.seq) ||
      asString(body.run_id) ||
      asString(body.runId) ||
      undefined;
  } catch {
    externalRef = undefined;
  }

  return {
    accepted: true,
    externalRef,
    detail: externalRef
      ? `Workflow run ${externalRef} was accepted.`
      : "Workflow run was accepted.",
  };
};
