import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Investigation = {
  id: string;
  subject_name: string;
  github_username: string | null;
  x_handle: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  other_profile_url: string | null;
  context: string | null;
  notes: string | null;
};

const stages = [
  "discover",
  "crawl",
  "structure",
  "embed",
  "signals",
  "fingerprint",
  "dossier",
];

const hash = (value: string) =>
  Array.from(value).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);

const isoYearsAgo = (years: number, month = 0, day = 12) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years, month, day);
  return date.toISOString();
};

const buildDemoEvidence = (investigation: Investigation) => {
  const subject = investigation.subject_name;
  const github = investigation.github_username?.replace(/^@/, "") || "specter-demo";
  const xHandle = investigation.x_handle?.replace(/^@/, "") || "specter_demo";
  const website = investigation.website_url || "https://example.com";
  const seed = hash(`${subject}:${github}:${website}`);
  const shift = Math.abs(seed % 6);

  const sources = [
    {
      platform: "GitHub",
      source_type: "repository",
      url: `https://github.com/${github}`,
      title: `${github} public repositories`,
      published_at: isoYearsAgo(5, 2),
      raw_text: "Early utilities and small experiments establish a gradual technical footprint.",
    },
    {
      platform: "Website",
      source_type: "article",
      url: website,
      title: `${subject} - project archive`,
      published_at: isoYearsAgo(4, 7),
      raw_text: "A dated project archive shows changing tools, vocabulary, and scope over time.",
    },
    {
      platform: "GitHub",
      source_type: "readme",
      url: `https://github.com/${github}?tab=repositories`,
      title: "Repository documentation sample",
      published_at: isoYearsAgo(3, 3),
      raw_text: "README language becomes more concise and domain-specific across later projects.",
    },
    {
      platform: "X",
      source_type: "post",
      url: `https://x.com/${xHandle}`,
      title: `@${xHandle} public posts`,
      published_at: isoYearsAgo(2, 10),
      raw_text: "Casual posts differ naturally from formal project writing while retaining recurring phrases.",
    },
    {
      platform: "LinkedIn",
      source_type: "profile",
      url: investigation.linkedin_url || "https://www.linkedin.com",
      title: `${subject} public profile`,
      published_at: isoYearsAgo(2, 1),
      raw_text: "Role chronology broadly aligns with the public project and writing timeline.",
    },
    {
      platform: "Website",
      source_type: "article",
      url: website,
      title: "Recent long-form writing sample",
      published_at: isoYearsAgo(1, 6),
      raw_text: "Recent writing is more polished, but retains distinctive sentence rhythm and terminology.",
    },
    {
      platform: "GitHub",
      source_type: "commit-history",
      url: `https://github.com/${github}`,
      title: "Contribution activity",
      published_at: isoYearsAgo(0, 1),
      raw_text: "Activity contains realistic gaps and bursts rather than a perfectly uniform cadence.",
    },
  ];

  const signals = [
    ["timeline_depth", "Timeline depth", "Public activity spans multiple years with dated evidence.", 82 + shift, 12, "positive"],
    ["growth_continuity", "Growth continuity", "Skills and project complexity increase gradually instead of appearing fully formed.", 78 + shift, 12, "positive"],
    ["writing_evolution", "Writing evolution", "Distinct contexts cluster separately while preserving a recognizable author fingerprint.", 74 + shift, 15, "positive"],
    ["expertise_match", "Expertise evidence match", "Most stated capabilities are supported by dated output, with one recent claim still thinly evidenced.", 69 + shift, 18, "mixed"],
    ["burst_anomaly", "Activity burst anomaly", "A concentrated recent publishing window deserves manual review, but is not conclusive.", 48 + shift, 10, "concern"],
    ["cross_platform", "Cross-platform coherence", "Names, topics, and chronology are broadly consistent across the discovered footprint.", 79 + shift, 10, "positive"],
    ["fingerprint_diversity", "Fingerprint diversity", "The writing map shows healthy variation by platform plus two stylistic outliers.", 76 + shift, 10, "mixed"],
  ].map(([signal_key, title, summary, score, weight, polarity]) => ({
    signal_key,
    title,
    summary,
    score,
    weight,
    polarity,
  }));

  const weighted = signals.reduce((sum, signal) => sum + Number(signal.score) * Number(signal.weight), 0);
  const totalWeight = signals.reduce((sum, signal) => sum + Number(signal.weight), 0);
  const score = Math.round(weighted / totalWeight);

  const embeddings = Array.from({ length: 54 }, (_, index) => {
    const cluster = index % 4;
    const angle = index * 1.73 + seed * 0.01;
    const radius = 8 + ((index * 7) % 13);
    const centers = [[25, 28], [66, 30], [42, 68], [74, 70]];
    const source = sources[index % sources.length];
    const isOutlier = index === 17 || index === 43;
    return {
      platform: source.platform,
      coord_x: isOutlier ? 12 + index : centers[cluster][0] + Math.cos(angle) * radius,
      coord_y: isOutlier ? 82 - index / 2 : centers[cluster][1] + Math.sin(angle) * radius,
      cluster_label: cluster,
      is_outlier: isOutlier,
      observed_at: source.published_at,
      embedding_model: "demo-bge-large-placeholder",
      vector_ref: `demo://${investigation.id}/${index}`,
    };
  });

  const claims = [
    ["experience", "Demonstrates sustained work in the claimed domain.", "supported", "Dated repositories and project writing show increasing scope across several years."],
    ["authorship", "Public writing appears to come from one evolving author.", "supported", "The fingerprint retains recurring phrasing while drifting naturally by year and context."],
    ["recent-expertise", "Recent senior-level expertise is fully evidenced.", "partial", "Recent output is credible but compressed into a shorter window than older evidence."],
    ["identity-continuity", "All discovered profiles can be conclusively tied to the same person.", "unresolved", "The profiles align strongly, but manual verification remains appropriate."],
  ].map(([claim_type, claim_text, support_level, summary]) => ({
    claim_type,
    claim_text,
    support_level,
    supporting_evidence_refs: { summary },
    source_url: website,
  }));

  const timeline = sources.slice(0, 6).map((source) => ({
    id: crypto.randomUUID(),
    date: source.published_at,
    platform: source.platform,
    title: source.title,
    summary: source.raw_text,
    url: source.url,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const dossier = {
    provider_mode: "demo-fallback",
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
    timeline,
  };

  return {
    sources,
    signals,
    embeddings,
    claims,
    dossier,
    score,
    classification: score >= 81 ? "High confidence human pattern" : "Mostly organic, minor anomalies",
    confidence_band: "Moderate-high",
    summary:
      `${subject}'s public footprint shows a gradual, multi-year pattern with meaningful variation across technical, formal, and casual contexts. ` +
      "The strongest evidence is timeline depth and cross-platform coherence. A concentrated recent publishing burst and one thinly supported expertise claim merit manual review, but the overall pattern is more consistent with an evolving person than an identity assembled all at once.",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investigationId } = await req.json();
    if (!investigationId) {
      return new Response(JSON.stringify({ error: "investigationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceRoleKey);
    const towerWebhookUrl = Deno.env.get("TOWER_WEBHOOK_URL");

    const { data: investigation, error } = await db
      .from("investigations")
      .select("*")
      .eq("id", investigationId)
      .single();

    if (error || !investigation) {
      return new Response(JSON.stringify({ error: "Investigation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await db.from("investigations").update({
      status: "running",
      progress: { stage_index: 0, percent: 8 },
    }).eq("id", investigationId);

    if (towerWebhookUrl) {
      await fetch(towerWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "specter.investigation.started", investigationId }),
      }).catch(() => {});
    }

    const demo = buildDemoEvidence(investigation as Investigation);

    await Promise.all([
      db.from("source_documents").delete().eq("investigation_id", investigationId),
      db.from("signals").delete().eq("investigation_id", investigationId),
      db.from("claims").delete().eq("investigation_id", investigationId),
      db.from("embeddings").delete().eq("investigation_id", investigationId),
    ]);

    await db.from("source_documents").insert(
      demo.sources.map((source) => ({ ...source, investigation_id: investigationId })),
    );
    await db.from("signals").insert(
      demo.signals.map((signal) => ({ ...signal, investigation_id: investigationId })),
    );
    await db.from("claims").insert(
      demo.claims.map((claim) => ({ ...claim, investigation_id: investigationId })),
    );
    await db.from("embeddings").insert(
      demo.embeddings.map((embedding) => ({ ...embedding, investigation_id: investigationId })),
    );

    await db.from("investigations").update({
      status: "complete",
      consistency_score: demo.score,
      confidence_band: demo.confidence_band,
      classification: demo.classification,
      dossier_summary: demo.summary,
      dossier_full: demo.dossier,
      progress: {
        stage_index: stages.length - 1,
        percent: 100,
        counters: {
          sources: demo.sources.length,
          platforms: new Set(demo.sources.map((source) => source.platform)).size,
          timelineEvents: demo.dossier.timeline.length,
          claims: demo.claims.length,
          writingSamples: demo.embeddings.length,
          clusters: 4,
        },
      },
    }).eq("id", investigationId);

    return new Response(JSON.stringify({ ok: true, mode: "demo-fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("run-investigation error", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

