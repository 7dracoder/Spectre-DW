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
};

export type PublicEvidence = {
  answer?: string;
  requestId?: string;
  results: PublicEvidenceResult[];
};

export type InvestigationNarrative = {
  dossierSummary: string;
  strengths: string[];
  concerns: string[];
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

const identityTerms = (input: InvestigationInput) =>
  [
    input.subject_name,
    input.github_username?.replace(/^@/, ""),
    input.x_handle?.replace(/^@/, ""),
  ]
    .map((value) => value?.trim().toLowerCase() || "")
    .filter((value) => value.length >= 3);

export const discoverPublicEvidence = (
  http: HttpClient,
  apiKey: string,
  input: InvestigationInput,
): PublicEvidence => {
  const response = http.fetch("https://sdk.nimbleway.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: buildSearchQuery(input),
      focus: "general",
      max_results: 10,
      search_depth: "lite",
      include_answer: true,
    }),
  });
  const responseText = response.text();
  if (!response.ok) {
    throw new Error(`Public evidence search failed (${response.status}).`);
  }

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

  const allResults = (body.results || [])
    .map((result) => {
      const metadata = result.metadata || {};
      const publishedAt =
        asString(metadata.published_date) ||
        asString(metadata.published_at) ||
        asString(metadata.date);
      return {
        title: asString(result.title),
        description: asString(result.description),
        content: asString(result.content),
        url: asString(result.url),
        publishedAt: publishedAt || undefined,
      };
    })
    .filter((result) => result.url && (result.title || result.description));
  const identifiers = identityTerms(input);
  const relevantResults = allResults.filter((result) => {
    const searchable =
      `${result.title} ${result.description} ${result.url}`.toLowerCase();
    return identifiers.some((identifier) => searchable.includes(identifier));
  });
  const results = relevantResults.length ? relevantResults : allResults;

  if (!results.length) {
    throw new Error("Public evidence search returned no usable sources.");
  }

  const answer = asString(body.answer);
  return {
    answer:
      answer &&
      identifiers.some((identifier) => answer.toLowerCase().includes(identifier))
        ? answer
        : undefined,
    requestId: asString(body.request_id) || undefined,
    results,
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
    };
    const dossierSummary = asString(parsed.dossier_summary);
    const toList = (items: unknown) =>
      Array.isArray(items)
        ? items.map(asString).filter(Boolean).slice(0, 4)
        : [];
    const strengths = toList(parsed.strengths);
    const concerns = toList(parsed.concerns);
    const recommendations = toList(parsed.recommendations);

    if (
      !dossierSummary ||
      !strengths.length ||
      !concerns.length ||
      !recommendations.length
    ) {
      return null;
    }

    return {
      dossierSummary,
      strengths,
      concerns,
      recommendations,
    };
  } catch {
    return null;
  }
};

export const synthesizeInvestigation = (
  http: HttpClient,
  apiKey: string,
  model: string,
  input: InvestigationInput,
  evidence: PublicEvidence,
): InvestigationNarrative | null => {
  const compactEvidence = evidence.results.slice(0, 10).map((result) => ({
    title: result.title,
    url: result.url,
    published_at: result.publishedAt || null,
    excerpt: (result.description || result.content).slice(0, 700),
  }));
  const prompt = [
    "You are an evidence analyst preparing a public-identity consistency dossier.",
    "Use only the supplied public-source excerpts. Do not declare the subject authentic, fake, deceptive, dangerous, or safe.",
    "Separate observed evidence from uncertainty. Keep recommendations focused on manual verification.",
    "Return only minified JSON with keys dossier_summary, strengths, concerns, recommendations.",
    "Each list must contain 2 to 4 concise strings.",
    `SUBJECT: ${input.subject_name}`,
    `CONTEXT: ${input.context}`,
    `USER NOTES: ${input.notes || "None"}`,
    `SEARCH SUMMARY: ${evidence.answer || "None"}`,
    `EVIDENCE: ${JSON.stringify(compactEvidence)}`,
  ].join("\n");

  const response = http.fetch(
    `https://api.runpod.ai/v2/${encodeURIComponent(model)}/runsync`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          max_tokens: 700,
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
    },
  );
  const responseText = response.text();
  if (!response.ok) return null;

  const body = parseJson<{ status?: string; error?: unknown }>(
    responseText,
    "Investigation synthesis",
  );
  if (body.status && body.status !== "COMPLETED") return null;
  return parseNarrative(extractRunpodText(body));
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
) => {
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

  return response.ok;
};
