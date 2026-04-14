import { createCoSellPlaybook, type CoSellInput, type CoSellPlaybook, type ResearchSource } from "./playbook";

const LIVE_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type LiveResearchPayload = {
  summary: CoSellPlaybook["summary"];
  accountSignals: string[];
  portfolioMap: CoSellPlaybook["portfolioMap"];
  plays: CoSellPlaybook["plays"];
  messaging: CoSellPlaybook["messaging"];
  actionPlan: CoSellPlaybook["actionPlan"];
  sources: ResearchSource[];
};

function coerceStringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : fallback;
}

function coerceSources(value: unknown): ResearchSource[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((source) => {
      if (!source || typeof source !== "object") return null;
      const record = source as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const url = typeof record.url === "string" ? record.url.trim() : "";
      const publisher = typeof record.publisher === "string" ? record.publisher.trim() : "";
      const note = typeof record.note === "string" ? record.note.trim() : "";

      if (!title || !url || !publisher || !note) return null;
      return { title, url, publisher, note };
    })
    .filter((source): source is ResearchSource => source !== null);
}

function extractJsonObject(text: string): string {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);

  throw new Error("Model response did not contain a JSON object.");
}

function mergeLivePayload(input: CoSellInput, payload: LiveResearchPayload): CoSellPlaybook {
  const fallback = createCoSellPlaybook(input);

  return {
    ...fallback,
    generatedAt: new Date().toISOString(),
    research: {
      mode: "live",
      model: LIVE_MODEL,
      note: "Live research generated with Gemini grounding over Google Search and recent Google Cloud plus Cognizant sources.",
      sources: payload.sources.length > 0 ? payload.sources : fallback.research.sources
    },
    summary: {
      ...fallback.summary,
      ...payload.summary
    },
    accountSignals: payload.accountSignals.length > 0 ? payload.accountSignals : fallback.accountSignals,
    portfolioMap: payload.portfolioMap.length > 0 ? payload.portfolioMap : fallback.portfolioMap,
    plays: payload.plays.length > 0 ? payload.plays : fallback.plays,
    messaging: {
      ...fallback.messaging,
      ...payload.messaging
    },
    actionPlan: {
      ...fallback.actionPlan,
      ...payload.actionPlan
    }
  };
}

function sanitizePayload(input: CoSellInput, raw: unknown): LiveResearchPayload {
  const fallback = createCoSellPlaybook(input);
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const summaryRecord = record.summary && typeof record.summary === "object" ? (record.summary as Record<string, unknown>) : {};
  const messagingRecord = record.messaging && typeof record.messaging === "object" ? (record.messaging as Record<string, unknown>) : {};
  const actionPlanRecord = record.actionPlan && typeof record.actionPlan === "object" ? (record.actionPlan as Record<string, unknown>) : {};

  return {
    summary: {
      headline: typeof summaryRecord.headline === "string" ? summaryRecord.headline : fallback.summary.headline,
      opportunity: typeof summaryRecord.opportunity === "string" ? summaryRecord.opportunity : fallback.summary.opportunity,
      whyNow: typeof summaryRecord.whyNow === "string" ? summaryRecord.whyNow : fallback.summary.whyNow,
      partnerThesis: typeof summaryRecord.partnerThesis === "string" ? summaryRecord.partnerThesis : fallback.summary.partnerThesis
    },
    accountSignals: coerceStringArray(record.accountSignals, fallback.accountSignals).slice(0, 6),
    portfolioMap: Array.isArray(record.portfolioMap)
      ? (record.portfolioMap as CoSellPlaybook["portfolioMap"]).slice(0, 8)
      : fallback.portfolioMap,
    plays: Array.isArray(record.plays) ? (record.plays as CoSellPlaybook["plays"]).slice(0, 4) : fallback.plays,
    messaging: {
      executiveTalkTrack:
        typeof messagingRecord.executiveTalkTrack === "string"
          ? messagingRecord.executiveTalkTrack
          : fallback.messaging.executiveTalkTrack,
      technicalTalkTrack:
        typeof messagingRecord.technicalTalkTrack === "string"
          ? messagingRecord.technicalTalkTrack
          : fallback.messaging.technicalTalkTrack,
      emailOpening:
        typeof messagingRecord.emailOpening === "string" ? messagingRecord.emailOpening : fallback.messaging.emailOpening
    },
    actionPlan: {
      first30Days: coerceStringArray(actionPlanRecord.first30Days, fallback.actionPlan.first30Days).slice(0, 4),
      partnerActions: coerceStringArray(actionPlanRecord.partnerActions, fallback.actionPlan.partnerActions).slice(0, 4),
      assetsToBring: coerceStringArray(actionPlanRecord.assetsToBring, fallback.actionPlan.assetsToBring).slice(0, 4)
    },
    sources: coerceSources(record.sources).slice(0, 8)
  };
}

function extractGroundingSources(response: any): ResearchSource[] {
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  const chunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : [];

  const deduped = new Map<string, ResearchSource>();
  for (const chunk of chunks) {
    const web = chunk?.web;
    const url = typeof web?.uri === "string" ? web.uri.trim() : "";
    const title = typeof web?.title === "string" ? web.title.trim() : "";
    if (!url || !title || deduped.has(url)) continue;

    deduped.set(url, {
      title,
      url,
      publisher: inferPublisher(url, title),
      note: "Grounding source used by Gemini search-backed synthesis."
    });
  }

  return [...deduped.values()].slice(0, 8);
}

function inferPublisher(url: string, title: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("cloud.google.com") || hostname.includes("google.com")) return "Google";
    if (hostname.includes("cognizant.com")) return "Cognizant";
    return hostname;
  } catch {
    return title;
  }
}

function buildResearchPrompt(input: CoSellInput): string {
  const goals = input.goals.length > 0 ? input.goals.join(", ") : "agentic-operations";

  return [
    `Build a field-ready co-sell playbook for Google Cloud AI offerings and Cognizant AI products and solution offerings, customized deeply for the target account: ${input.accountName}.`,
    "MANDATORY RESEARCH PROTOCOL:",
    `1. You MUST use Google Search to deeply investigate ${input.accountName}'s official public website for recent news, strategic initiatives, and technical challenges.`,
    `2. You MUST use Google Search to query LinkedIn (e.g., 'site:linkedin.com/in "${input.accountName}" [Target Role]') to identify the names and exact titles of ACTUAL executive and technical personas.`,
    "3. You MUST inject the actual names and titles of these discovered personas directly into the 'buyer' fields for each generated play.",
    "4. Filter and synthesize your overall findings to ensure the company is adequately context-aware throughout the playbook.",
    "5. Favor official Google Cloud and Cognizant sources whenever possible for portfolio mapping.",
    "If account-specific facts are not clearly public, frame them as hypotheses rather than certainties.",
    "Return ONLY valid JSON. No markdown fences or explanatory text.",
    "",
    "Input Context:",
    JSON.stringify(input, null, 2),
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        summary: {
          headline: "string",
          opportunity: "string",
          whyNow: "string",
          partnerThesis: "string"
        },
        accountSignals: ["string"],
        portfolioMap: [
          {
            name: "string",
            provider: "Google Cloud or Cognizant",
            category: "string",
            summary: "string",
            whyItFits: "string"
          }
        ],
        plays: [
          {
            title: "string",
            motion: "string",
            buyer: "string",
            pain: "string",
            valueHypothesis: "string",
            googleCloudOffer: "string",
            cognizantOffer: "string",
            jointPitch: "string",
            proofPoints: ["string"],
            discoveryQuestions: ["string"],
            firstMeetingAgenda: ["string"],
            nextStep: "string"
          }
        ],
        messaging: {
          executiveTalkTrack: "string",
          technicalTalkTrack: "string",
          emailOpening: "string"
        },
        actionPlan: {
          first30Days: ["string"],
          partnerActions: ["string"],
          assetsToBring: ["string"]
        },
        sources: [
          {
            title: "string",
            url: "string",
            publisher: "string",
            note: "what this source supports"
          }
        ]
      },
      null,
      2
    ),
    "",
    `Target 4 to 8 sources. Focus on these requested goals: ${goals}.`,
    "Make the output concise, practical, and suitable for sellers preparing a first or second account meeting."
  ].join("\n");
}

export async function createLiveResearchedPlaybook(input: CoSellInput): Promise<CoSellPlaybook> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return createCoSellPlaybook(input);
  }

  const response = await fetch(`${GEMINI_API_BASE}/${LIVE_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildResearchPrompt(input) }] }],
      tools: [{ google_search: {} }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini research request failed: ${response.status} ${errorText}`);
  }

  const payloadJson: any = await response.json();

  const outputText = payloadJson?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("") || "";
  if (!outputText) {
    throw new Error("Gemini research request returned no text.");
  }

  const parsed = JSON.parse(extractJsonObject(outputText));
  const payload = sanitizePayload(input, parsed);
  const groundedSources = extractGroundingSources(payloadJson);

  return mergeLivePayload(input, {
    ...payload,
    sources: payload.sources.length > 0 ? payload.sources : groundedSources
  });
}
