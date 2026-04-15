import type { IncomingMessage, ServerResponse } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

type RequestWithBody = IncomingMessage & {
  body?: {
    companyName?: string;
  };
};

type ResponseWithHelpers = ServerResponse & {
  status: (code: number) => ResponseWithHelpers;
  json: (body: unknown) => void;
};

type ProspectData = {
  companyName: string;
  companyWebsite?: string;
  executiveSummary: {
    headline: string;
    whyNow: string;
    industryHypothesis: string;
  };
  itSpendIntelligence: {
    estimatedRange: string;
    yoyMomentum: string;
    budgetPriority: string;
    signals: string[];
  };
  strategicAiInitiatives: {
    summary: string;
    programs: string[];
    evidence: string[];
  };
  technographics: {
    cloudFootprint: string[];
    dataEstate: string[];
    contactCenterSignals: string[];
    modernizationSignals: string[];
  };
  publicSignals: {
    category: "financial" | "ai" | "hiring" | "cloud" | "exec" | "partnership";
    label: string;
    detail: string;
    strength: "high" | "medium" | "low";
  }[];
  personas: {
    name: string;
    title: string;
    profileUrl?: string;
    sourceLabel?: string;
    function: string;
    seniority: string;
    buyingRole: "economic buyer" | "technical buyer" | "business champion";
    whyNow: string;
    idealChannels: string[];
    kpis: string[];
    objections: string[];
    objectionHandling: string[];
    tailoredStrategy: string;
    likelyPriorities: string[];
    outreachAngles: string[];
    linkedinSearchQuery: string;
    evidence: string[];
  }[];
  productMatches: {
    product: string;
    partner: "Google Cloud" | "Cognizant" | "Google Cloud + Cognizant";
    fitScore: number;
    rationale: string;
    reasonForNeed?: string;
    accountBenefit?: string;
    whyCognizant?: string;
    whyGoogleCloud?: string;
    activationPlan: string;
    proofPoints: string[];
    evidenceSignals?: string[];
    deepDiveUrl?: string;
    deepDiveLabel?: string;
  }[];
  competitors: {
    name: string;
    benchmarkSummary: string;
    pressurePoint: string;
    cognizantAngle: string;
  }[];
  accountPlan: {
    whyCognizantNow: string;
    discoveryQuestions: string[];
    nextActions: string[];
    whitespaceHypotheses: string[];
  };
  blueprint: {
    appName: string;
    purpose: string;
    targetProducts: string[];
    dataSources: string[];
    keyFunctions: string[];
    bigQueryTables: string[];
    orchestration: string[];
  };
  propensityScore: number;
  researchMetadata: {
    mode: "live" | "demo";
    generatedAt: string;
    model?: string;
    note?: string;
    cached?: boolean;
    cacheExpiresAt?: string;
    sources: {
      title: string;
      url: string;
      publisher?: string;
    }[];
  };
};

const productCatalog = [
  "Vertex AI",
  "Gemini on Google Cloud",
  "Customer Engagement Suite",
  "BigQuery",
  "Document AI",
  "Cognizant Neuro AI",
  "Cognizant Flowsource"
];

const offeringCatalog = [
  {
    name: "Cognizant Neuro AI Enterprise Core",
    provider: "Cognizant",
    deepDiveUrl: "https://www.cognizant.com/us/en/services/cognizant-platforms/neuro-ai-enterprise-core",
    deepDiveLabel: "Neuro AI Enterprise Core",
    officialSummary:
      "Cognizant positions Neuro AI Enterprise Core as an enterprise AI operating layer with service catalogs, process agent studio, and multi-agent orchestration."
  },
  {
    name: "Cognizant Neuro AI Multi-Agent Accelerator",
    provider: "Cognizant",
    deepDiveUrl:
      "https://news.cognizant.com/2025-01-16-Cognizant-Leads-Enterprises-into-Next-Generation-of-AI-Adoption-with-Neuro-R-AI-Multi-Agent-Accelerator-and-Multi-Agent-Services-Suite",
    deepDiveLabel: "Neuro AI Multi-Agent Accelerator",
    officialSummary:
      "Cognizant describes this as a no-code framework with pre-built agent networks for rapid prototyping, interoperability, and scalable multi-agent deployment."
  },
  {
    name: "Cognizant Flowsource",
    provider: "Cognizant",
    deepDiveUrl:
      "https://www.cognizant.com/assets/en_us/field-marketing/documents/CMP-005644/Elevate%20developer%20experience%20-%20Solution%20Overview.pdf",
    deepDiveLabel: "Flowsource overview",
    officialSummary:
      "Cognizant presents Flowsource as a unified developer experience platform with AI for research, design, code, QA, provisioning, and engineering productivity."
  },
  {
    name: "Vertex AI",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/vertex-ai",
    deepDiveLabel: "Vertex AI",
    officialSummary:
      "Google Cloud positions Vertex AI as a fully managed platform for generative AI, model development, tuning, deployment, and access to Gemini plus third-party models."
  },
  {
    name: "Gemini for Google Cloud",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/blog/products/ai-machine-learning/gemini-for-google-cloud-is-here",
    deepDiveLabel: "Gemini for Google Cloud",
    officialSummary:
      "Google describes Gemini for Google Cloud as enterprise-ready AI assistants for developers, cloud operations, data workflows, and application lifecycle tasks."
  },
  {
    name: "Customer Engagement Suite",
    provider: "Google Cloud",
    deepDiveUrl: "https://docs.cloud.google.com/contact-center/ccai-platform/docs",
    deepDiveLabel: "Gemini Enterprise for CX",
    officialSummary:
      "Google Cloud documents Customer Engagement Suite capabilities through Gemini Enterprise for CX and CCAI Platform for routing, virtual agents, agent assist, and insights."
  },
  {
    name: "BigQuery",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/bigquery",
    deepDiveLabel: "BigQuery",
    officialSummary:
      "Google positions BigQuery as a unified data-to-AI platform with serverless warehousing, multimodal analytics, and native Vertex AI integration."
  },
  {
    name: "Document AI",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/document-ai",
    deepDiveLabel: "Document AI",
    officialSummary:
      "Google positions Document AI as a document understanding platform for extraction, classification, OCR, and downstream automation with BigQuery and other Google Cloud services."
  }
] as const;

const SERVER_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const liveResearchCache = new Map<string, { expiresAt: number; data: ProspectData }>();
const LIVE_RESEARCH_MODEL = "gemini-2.5-flash";
const DISCOVERY_TIMEOUT_MS = 18000;
const SYNTHESIS_TIMEOUT_MS = 12000;
const ENRICHMENT_TIMEOUT_MS = 15000;
const REQUEST_TIME_BUDGET_MS = 52000;
const HEATMAP_OFFERINGS = [
  "Cognizant Neuro AI Enterprise Core",
  "Cognizant Neuro AI Multi-Agent Accelerator",
  "Cognizant Flowsource",
  "Vertex AI",
  "Gemini for Google Cloud",
  "Customer Engagement Suite",
  "BigQuery",
  "Document AI"
] as const;

const KNOWN_COMPETITOR_SETS: Record<string, string[]> = {
  albertsons: ["Kroger", "Walmart", "Costco", "Target"],
  "albertsons companies": ["Kroger", "Walmart", "Costco", "Target"],
  bmw: ["Mercedes-Benz", "Audi", "Tesla", "Lexus"],
  "bmw group": ["Mercedes-Benz", "Audi", "Tesla", "Lexus"],
  verizon: ["AT&T", "T-Mobile", "Comcast", "Charter Communications"],
  "verizon communications": ["AT&T", "T-Mobile", "Comcast", "Charter Communications"],
  "jpmorgan chase": ["Bank of America", "Citigroup", "Wells Fargo", "Goldman Sachs"],
  jpmorgan: ["Bank of America", "Citigroup", "Wells Fargo", "Goldman Sachs"],
  humana: ["UnitedHealth Group", "CVS Health", "Cigna", "Elevance Health"],
  snowflake: ["Databricks", "Google BigQuery", "Amazon Redshift", "Microsoft Fabric"],
  servicenow: ["Salesforce", "Microsoft", "Atlassian", "Zendesk"]
};

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0;
  }
  return value;
}

function normalizeCompanyName(companyName: string): string {
  return companyName.trim().toLowerCase();
}

function knownCompetitorsFor(companyName: string): ProspectData["competitors"] | null {
  const normalized = normalizeCompanyName(companyName);
  const names = KNOWN_COMPETITOR_SETS[normalized];
  if (!names?.length) return null;

  return names.map((name) => ({
    name,
    benchmarkSummary: `${name} is a relevant named peer for ${companyName} based on public market positioning and enterprise competition.`,
    pressurePoint: `${name} can create pressure if its public AI, platform, or modernization story appears clearer than ${companyName}'s.`,
    cognizantAngle: `Use ${name} as a named benchmark to create urgency, then position Cognizant plus Google Cloud around execution speed and governed delivery.`
  }));
}

function hasTimeBudget(startedAt: number, remainingMs: number): boolean {
  return Date.now() - startedAt < REQUEST_TIME_BUDGET_MS - remainingMs;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function buildLiveResearchFallbackNote(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (/RESOURCE_EXHAUSTED|Quota exceeded|429/i.test(message)) {
    return "Live research is temporarily unavailable because the current Gemini API project has exhausted its quota. Fresh live research will resume after quota resets or billing is added to the Gemini project.";
  }

  if (/timed out/i.test(message)) {
    return "Live research timed out before Gemini returned grounded results, so the app used the local fallback.";
  }

  return "Live research failed, so the app returned the local prospecting fallback.";
}

function normalizeCompanyWebsite(value: unknown): string | undefined {
  const raw = asText(value);
  if (!raw) return undefined;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.hostname}`.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function getServerCache(companyName: string): ProspectData | null {
  const key = normalizeCompanyName(companyName);
  const cached = liveResearchCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    liveResearchCache.delete(key);
    return null;
  }

  const data = {
    ...cached.data,
    researchMetadata: {
      ...cached.data.researchMetadata,
      cached: true,
      cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      note: "Returned from cached live research to reduce repeated API usage."
    }
  };
  const hasGenericPersonas = data.personas.some((persona) => isGenericPersonaName(persona.name, companyName));
  const hasGenericCompetitors = data.competitors.some((competitor) => !isRealCompetitorName(competitor.name, companyName));
  if (hasGenericPersonas || hasGenericCompetitors) {
    liveResearchCache.delete(key);
    return null;
  }

  return data;
}

function setServerCache(companyName: string, data: ProspectData) {
  if (data.researchMetadata.mode !== "live") return;
  if (data.personas.some((persona) => isGenericPersonaName(persona.name, companyName))) return;
  if (data.competitors.some((competitor) => !isRealCompetitorName(competitor.name, companyName))) return;

  const expiresAt = Date.now() + SERVER_CACHE_TTL_MS;
  liveResearchCache.set(normalizeCompanyName(companyName), {
    expiresAt,
    data: {
      ...data,
      researchMetadata: {
        ...data.researchMetadata,
        cached: true,
        cacheExpiresAt: new Date(expiresAt).toISOString()
      }
    }
  });
}

function extractBalancedJsonSegment(rawText: string, openingChar: "{" | "["): string | null {
  const closingChar = openingChar === "{" ? "}" : "]";
  const start = rawText.indexOf(openingChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === openingChar) {
      depth += 1;
      continue;
    }

    if (char === closingChar) {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(start, index + 1).trim();
      }
    }
  }

  return null;
}

function extractJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || rawText;
  const object = extractBalancedJsonSegment(candidate, "{");
  if (object) return object;
  throw new Error("Gemini response did not include a complete JSON object.");
}

function extractJsonPayload(rawText: string): string {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || rawText;

  const object = extractBalancedJsonSegment(candidate, "{");
  if (object) return object;

  const array = extractBalancedJsonSegment(candidate, "[");
  if (array) return array;

  throw new Error("Gemini response did not include complete JSON.");
}

type DiscoveryPayload = {
  companyName?: string;
  companyWebsite?: string;
  itSpendSignals?: string[];
  aiInitiatives?: string[];
  publicSignals?: Array<{
    category?: string;
    label?: string;
    detail?: string;
    strength?: string;
  }>;
  productHints?: Array<{
    product?: string;
    partner?: string;
    rationale?: string;
    reasonForNeed?: string;
  }>;
};

function buildDiscoveryPrompt(companyName: string): string {
  return [
    `Find concise public account research for ${companyName} as of ${new Date().toISOString()}.`,
    "Use current public web information only and keep claims conservative.",
    "This is a discovery pass only, so keep the output extremely compact and source-oriented.",
    "Do not include markdown fences, citation markers, or explanatory text before or after the JSON.",
    "Do not repeat the JSON payload.",
    "Keep every string short. Use sentence fragments, not paragraphs.",
    "Never exceed these limits: 2 itSpendSignals, 2 aiInitiatives, 2 publicSignals, 4 productHints.",
    "Keep each string under 140 characters whenever possible.",
    "Find the official company website if publicly identifiable.",
    "Find 2 short public IT spend, modernization, hiring, or AI initiative signals.",
    `Suggest 4 fitting offerings from this list only: ${HEATMAP_OFFERINGS.join(", ")}.`,
    "Return JSON only with these top-level fields: companyName, companyWebsite, itSpendSignals, aiInitiatives, publicSignals, productHints.",
    "For publicSignals include only: category, label, detail, strength.",
    "For productHints include only: product, partner, rationale, reasonForNeed.",
    "Use plain ASCII punctuation only."
  ].join("\n");
}

function buildSynthesisPrompt(companyName: string, discovery: DiscoveryPayload, sources: ProspectData["researchMetadata"]["sources"]): string {
  return [
    `Build a concise account prospecting brief for ${companyName}.`,
    "Use only the discovery evidence below. Do not invent facts beyond it.",
    "Prioritize Cognizant Neuro AI Enterprise Core, Cognizant Neuro AI Multi-Agent Accelerator, Cognizant Flowsource, Vertex AI, Gemini for Google Cloud, Customer Engagement Suite, BigQuery, and Document AI.",
    "Put extra emphasis on Cognizant offerings and explain how they complement Google Cloud AI products in a joint co-sell motion.",
    "Keep the response concise and fact-dense rather than exhaustive.",
    "Return JSON only with these top-level fields: companyName, companyWebsite, executiveSummary, itSpendIntelligence, strategicAiInitiatives, publicSignals, productMatches, accountPlan, propensityScore, researchMetadata.",
    "For productMatches, return 5-6 entries and include: product, partner, fitScore, rationale, reasonForNeed, accountBenefit, whyCognizant, activationPlan.",
    "Inside researchMetadata, set mode to live and include generatedAt plus sources.",
    `Discovery JSON: ${JSON.stringify(discovery)}`,
    `Source list JSON: ${JSON.stringify(sources)}`
  ].join("\n");
}

function buildLiveProspectFromDiscovery(
  companyName: string,
  discovery: DiscoveryPayload,
  sources: ProspectData["researchMetadata"]["sources"],
  note: string
): ProspectData {
  const productMatches =
    discovery.productHints?.map((hint, index) => ({
      product: asText(hint.product) || "Vertex AI",
      partner:
        asText(hint.partner) === "Google Cloud" ||
        asText(hint.partner) === "Cognizant" ||
        asText(hint.partner) === "Google Cloud + Cognizant"
          ? (asText(hint.partner) as ProspectData["productMatches"][number]["partner"])
          : "Google Cloud + Cognizant",
      fitScore: Math.max(68, 88 - index * 4),
      rationale: asText(hint.rationale) || "Matched from live public account signals.",
      reasonForNeed: asText(hint.reasonForNeed) || "Public signals suggest a relevant AI, data, or workflow need.",
      accountBenefit: "This offering can help convert visible modernization pressure into measurable AI outcomes.",
      whyCognizant: "Cognizant can shape the use case, accelerate delivery, and govern adoption around the platform.",
      activationPlan: "Validate this fit in account discovery and convert it into a narrow pilot hypothesis.",
      proofPoints: ["live discovery signal", "offering fit"]
    })) || [];

  const raw = {
    companyName: discovery.companyName || companyName,
    companyWebsite: discovery.companyWebsite,
    executiveSummary: {
      headline: `${companyName} shows live public signals that support a Cognizant and Google Cloud AI pursuit.`,
      whyNow:
        discovery.aiInitiatives?.[0] ||
        discovery.itSpendSignals?.[0] ||
        "Live public data points to active modernization and AI pressure inside the account.",
      industryHypothesis:
        "The account appears to have AI ambition and platform pressure, creating room for a governed co-sell motion."
    },
    itSpendIntelligence: {
      signals: discovery.itSpendSignals || []
    },
    strategicAiInitiatives: {
      summary:
        discovery.aiInitiatives?.join(" ") ||
        "Live public signals indicate active AI or modernization initiatives relevant to the account.",
      programs: discovery.aiInitiatives || [],
      evidence: discovery.itSpendSignals || []
    },
    publicSignals: discovery.publicSignals || [],
    productMatches,
    researchMetadata: {
      mode: "live",
      generatedAt: new Date().toISOString(),
      note,
      sources
    }
  };

  return normalizeProspectData(companyName, raw);
}

async function requestLiveProspect(
  genAI: GoogleGenerativeAI,
  companyName: string
) {
  const model = genAI.getGenerativeModel({
    model: LIVE_RESEARCH_MODEL,
    tools: [{ googleSearch: {} }] as any
  });

  const discoveryResponse = await withTimeout(
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildDiscoveryPrompt(companyName) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900
      }
    }),
    DISCOVERY_TIMEOUT_MS,
    "Gemini source discovery"
  );

  const discoveryText = discoveryResponse.response.text();
  const discovery = JSON.parse(extractJsonPayload(discoveryText)) as DiscoveryPayload;
  const groundingMetadata = (discoveryResponse.response.candidates?.[0] as any)?.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks ?? [];
  const groundedSources = groundingChunks
    .map((chunk: any) => {
      const web = chunk?.web;
      if (!web?.uri || !web?.title) return null;
      return {
        title: web.title as string,
        url: web.uri as string,
        publisher: web.domain as string | undefined
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const personaPromise = withTimeout(
    enrichRealPersonas(genAI, companyName).catch(() => null),
    ENRICHMENT_TIMEOUT_MS,
    "Persona enrichment"
  ).catch(() => null);

  const competitorPromise = withTimeout(
    enrichRealCompetitors(
      genAI,
      companyName,
      `${(discovery.aiInitiatives || []).join(" ")} ${(discovery.itSpendSignals || []).join(" ")}`
    ).catch(() => null),
    ENRICHMENT_TIMEOUT_MS,
    "Competitor enrichment"
  ).catch(() => null);

  try {
    const synthModel = genAI.getGenerativeModel({
      model: LIVE_RESEARCH_MODEL,
    });

    const synthesisResponse = await withTimeout(
      synthModel.generateContent({
        contents: [{ role: "user", parts: [{ text: buildSynthesisPrompt(companyName, discovery, groundedSources) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 2200
        }
      }),
      SYNTHESIS_TIMEOUT_MS,
      "Gemini synthesis"
    );

    const synthesisText = synthesisResponse.response.text();
    const data = normalizeProspectData(companyName, JSON.parse(extractJsonObject(synthesisText)));

    data.researchMetadata = {
      ...data.researchMetadata,
      mode: "live",
      generatedAt: data.researchMetadata.generatedAt || new Date().toISOString(),
      model: LIVE_RESEARCH_MODEL,
      note: "Live web research synthesized through a 2-step discovery and synthesis flow.",
      sources: groundedSources.length ? groundedSources : data.researchMetadata.sources
    };

    const [personas, competitors] = await Promise.all([personaPromise, competitorPromise]);
    if (personas?.length) data.personas = personas;
    if (competitors?.length) data.competitors = competitors.slice(0, 4);

    return data;
  } catch (synthesisError) {
    console.warn("Live synthesis failed after discovery, returning compact live discovery output.", synthesisError);
    const data = buildLiveProspectFromDiscovery(
      companyName,
      discovery,
      groundedSources,
      "Live web research returned compact discovery output because detailed synthesis was unavailable."
    );
    data.researchMetadata = {
      ...data.researchMetadata,
      mode: "live",
      model: LIVE_RESEARCH_MODEL,
      sources: groundedSources
    };

    const [personas, competitors] = await Promise.all([personaPromise, competitorPromise]);
    if (personas?.length) data.personas = personas;
    if (competitors?.length) data.competitors = competitors.slice(0, 4);

    return data;
  }
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asText(item)).filter(Boolean);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeStrength(value: string): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function normalizeCategory(value: string): "financial" | "ai" | "hiring" | "cloud" | "exec" | "partnership" {
  if (value === "financial" || value === "ai" || value === "hiring" || value === "cloud" || value === "exec" || value === "partnership") {
    return value;
  }
  return "ai";
}

function scoreFromLooseValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return clampScore(value);
  const text = asText(value).toLowerCase();
  if (!text) return fallback;
  if (text.includes("high")) return 88;
  if (text.includes("medium")) return 76;
  if (text.includes("low")) return 62;
  const numericMatch = text.match(/\d+/);
  return numericMatch ? clampScore(Number(numericMatch[0])) : fallback;
}

function looksLikePersonName(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (normalized.length < 5 || normalized.length > 80) return false;
  if (/\b(chief|head|director|president|manager|lead|officer|architect|engineer|operations|platform|strategy|technology|customer|data|ai)\b/i.test(normalized)) {
    return false;
  }
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 5) return false;
  return parts.every((part) => /^[A-Z][a-zA-Z.'-]+$/.test(part));
}

function isGenericPersonaName(name: string, companyName: string): boolean {
  const normalized = name.trim().toLowerCase();
  const company = companyName.trim().toLowerCase();
  if (!normalized) return true;
  if (!looksLikePersonName(name)) return true;
  if (normalized.startsWith(company)) return true;
  if (normalized.includes("executive sponsor") || normalized.includes("platform owner") || normalized.includes("business champion")) return true;
  return false;
}

function isRealCompetitorName(name: string, companyName: string): boolean {
  const normalized = name.trim().toLowerCase();
  const company = companyName.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(company)) return false;
  if (normalized.includes("peer benchmark") || normalized.includes("competitor a") || normalized.includes("competitor b") || normalized.includes("competitor c")) return false;
  if (normalized.includes("peer ") && normalized.includes("benchmark")) return false;
  if (normalized.length < 2 || normalized.length > 80) return false;
  return true;
}

function sourceLabelFromProfileUrl(profileUrl: string): string {
  if (!profileUrl) return "Public web";
  if (profileUrl.includes("linkedin.com")) return "LinkedIn";
  if (profileUrl.includes("company") || profileUrl.includes("about")) return "Company leadership page";
  return "Public web";
}

function findOfferingCatalogEntry(name: string) {
  const normalized = name.trim().toLowerCase();
  return offeringCatalog.find((entry) => {
    const entryName = entry.name.toLowerCase();
    if (entryName === normalized) return true;
    if (entryName.includes(normalized) || normalized.includes(entryName)) return true;

    if (normalized.includes("neuro ai") && entryName.includes("neuro ai")) return true;
    if (normalized.includes("multi-agent") && entryName.includes("multi-agent")) return true;
    if (normalized.includes("flowsource") && entryName.includes("flowsource")) return true;
    if (normalized.includes("vertex")) return entryName === "vertex ai";
    if (normalized.includes("gemini") && normalized.includes("cloud")) return entryName === "gemini for google cloud";
    if (normalized.includes("customer engagement") || normalized.includes("customer experience") || normalized.includes("ccai")) {
      return entryName === "customer engagement suite";
    }
    return false;
  });
}

function enrichProductMatch(
  product: string,
  fallbackPartner: ProspectData["productMatches"][number]["partner"],
  fallbackFitScore: number,
  raw: Partial<ProspectData["productMatches"][number]>
): ProspectData["productMatches"][number] {
  const catalogEntry = findOfferingCatalogEntry(product);
  return {
    product: catalogEntry?.name || product,
    partner: raw.partner || catalogEntry?.provider || fallbackPartner,
    fitScore: typeof raw.fitScore === "number" ? raw.fitScore : fallbackFitScore,
    rationale: raw.rationale || catalogEntry?.officialSummary || "Mapped from Gemini live research.",
    reasonForNeed: raw.reasonForNeed || "Public account signals point to a delivery, platform, or workflow need this offering can address.",
    accountBenefit: raw.accountBenefit || "The account can use this offering to accelerate execution and turn AI strategy into measurable operating outcomes.",
    whyCognizant:
      raw.whyCognizant ||
      (catalogEntry?.provider === "Cognizant"
        ? "Cognizant brings accelerators, implementation capacity, governance, and enterprise change management around the offering."
        : "Cognizant can operationalize the platform with domain delivery, orchestration, and adoption support."),
    whyGoogleCloud:
      raw.whyGoogleCloud ||
      (catalogEntry?.provider === "Google Cloud"
        ? "Google Cloud provides the scalable AI, data, and platform foundation needed to productionize the use case."
        : undefined),
    activationPlan: raw.activationPlan || "Validate this use case with a focused discovery workshop and a 90-day pilot path.",
    proofPoints: raw.proofPoints?.length ? raw.proofPoints : ["public initiative alignment", "co-sell relevance"],
    evidenceSignals: raw.evidenceSignals?.length ? raw.evidenceSignals : raw.proofPoints?.slice(0, 3) || ["AI initiative pressure", "workflow modernization need"],
    deepDiveUrl: raw.deepDiveUrl || catalogEntry?.deepDiveUrl,
    deepDiveLabel: raw.deepDiveLabel || catalogEntry?.deepDiveLabel || "Official deep dive"
  };
}

function dedupeProductMatches(matches: ProspectData["productMatches"]): ProspectData["productMatches"] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.product.toLowerCase()}|${match.partner.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ensureHeatmapCoverage(
  matches: ProspectData["productMatches"],
  companyName: string,
  baseScore: number
): ProspectData["productMatches"] {
  const existing = new Map(matches.map((match) => [match.product.toLowerCase(), match]));

  for (const offering of HEATMAP_OFFERINGS) {
    if (existing.has(offering.toLowerCase())) continue;

    const catalogEntry = findOfferingCatalogEntry(offering);
    const fallback = enrichProductMatch(
      offering,
      catalogEntry?.provider || "Google Cloud + Cognizant",
      Math.max(58, baseScore - (offering.includes("Cognizant") ? 6 : 10)),
      {
        rationale: `${offering} is a secondary-fit option for ${companyName} based on the current public account signals and can be validated during discovery.`,
        reasonForNeed: `${companyName} shows public modernization and AI signals that may make ${offering} relevant depending on delivery scope and buying priorities.`,
        accountBenefit: `This offering can help ${companyName} improve execution clarity, platform maturity, or workflow outcomes if validated in discovery.`,
        whyCognizant: "Cognizant can validate fit, shape the use case, and reduce delivery risk around the offering.",
        whyGoogleCloud:
          catalogEntry?.provider === "Google Cloud"
            ? "Google Cloud provides the data and AI platform foundation behind this fit."
            : undefined,
        activationPlan: "Use discovery to validate whether this should be elevated into the top co-sell motion.",
        proofPoints: ["secondary-fit signal", "discovery validation needed"],
        evidenceSignals: ["public AI momentum", "modernization pressure"]
      }
    );

    existing.set(fallback.product.toLowerCase(), fallback);
  }

  return Array.from(existing.values())
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, HEATMAP_OFFERINGS.length);
}

async function enrichRealPersonas(
  genAI: GoogleGenerativeAI,
  companyName: string
): Promise<ProspectData["personas"] | null> {
  const model = genAI.getGenerativeModel({
    model: LIVE_RESEARCH_MODEL,
    tools: [{ googleSearch: {} }] as any
  });

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              `Find 3 to 4 real named decision-makers at ${companyName} using current public sources.`,
              "Use only public sources such as LinkedIn public profiles, company leadership pages, speaker bios, or press releases.",
              "Keep every string short and avoid citation markers.",
              "Return JSON only in the shape {\"personas\":[...]} with each persona including only name, title, whyNow, profileUrl, sourceLabel, linkedinSearchQuery.",
              "Do not return generic role placeholders. If a real person's identity is not public, omit them."
            ].join("\n")
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700
    }
  });

  const text = response.response.text();
  const parsed = JSON.parse(extractJsonPayload(text)) as { personas?: unknown[] };
  if (!Array.isArray(parsed.personas)) return null;

  const normalized = normalizeProspectData(companyName, { personas: parsed.personas }).personas;
  const realOnly = normalized.filter((persona) => !isGenericPersonaName(persona.name, companyName));
  return realOnly.length ? realOnly : null;
}

async function enrichRealCompetitors(
  genAI: GoogleGenerativeAI,
  companyName: string,
  currentSummary: string
): Promise<ProspectData["competitors"] | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: LIVE_RESEARCH_MODEL,
      tools: [{ googleSearch: {} }] as any
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                `Find 3 to 4 real competitor companies for ${companyName} based on current public market positioning.`,
                "Use public sources only and choose actual companies, not generic benchmark labels.",
                "Keep every string short and avoid citation markers.",
                `Context: ${currentSummary}`,
                "Return JSON only in the shape {\"competitors\":[...]} with each competitor including name, benchmarkSummary, pressurePoint, and cognizantAngle."
              ].join("\n")
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700
      }
    });

    const text = response.response.text();
    const parsed = JSON.parse(extractJsonPayload(text)) as { competitors?: unknown[] };
    if (Array.isArray(parsed.competitors)) {
      const normalized = normalizeProspectData(companyName, { competitors: parsed.competitors }).competitors;
      const realOnly = normalized.filter((competitor) => isRealCompetitorName(competitor.name, companyName));
      if (realOnly.length) return realOnly;
    }
  } catch (error) {
    console.warn("Rich competitor enrichment failed, trying names-only fallback.", error);
  }

    const modelBasic = genAI.getGenerativeModel({
      model: LIVE_RESEARCH_MODEL,
      tools: [{ googleSearch: {} }] as any
    });

    const namesResponse = await modelBasic.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                `Find exactly 4 real competitor or peer companies for ${companyName}.`,
                "Use public sources only.",
                "Return JSON only in the shape {\"names\":[\"Company A\",\"Company B\",\"Company C\",\"Company D\"]}.",
                "Use official company names only. No explanations."
              ].join("\n")
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 180
      }
    });

    const namesText = namesResponse.response.text();
    const parsedNames = JSON.parse(extractJsonPayload(namesText)) as { names?: string[] };
  const names = Array.isArray(parsedNames.names)
    ? parsedNames.names.map((name) => asText(name)).filter((name) => isRealCompetitorName(name, companyName))
    : [];

  if (!names.length) {
    return knownCompetitorsFor(companyName);
  }

  return names.slice(0, 4).map((name) => ({
    name,
    benchmarkSummary: `${name} is a relevant public peer for ${companyName} across digital, AI, data, or modernization positioning.`,
    pressurePoint: `${name} can create external pressure if its public narrative appears clearer on execution, platform direction, or AI adoption.`,
    cognizantAngle: `Use ${name} as a named benchmark to create urgency, then position Cognizant plus Google Cloud around execution speed and governed delivery.`
  }));
}

function normalizeProspectData(companyName: string, raw: unknown): ProspectData {
  const base = demoProspect(companyName, "Live research synthesized from public sources and standardized for the workspace.");
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const normalizedWebsite =
    normalizeCompanyWebsite(record.companyWebsite) ||
    normalizeCompanyWebsite(record.companyDomain) ||
    normalizeCompanyWebsite(record.officialWebsite) ||
    normalizeCompanyWebsite(record.website);

  const executiveSummary = record.executiveSummary;
  if (typeof executiveSummary === "string") {
    base.executiveSummary.headline = executiveSummary;
  } else if (executiveSummary && typeof executiveSummary === "object") {
    const summaryRecord = executiveSummary as Record<string, unknown>;
    base.executiveSummary = {
      headline: asText(summaryRecord.headline) || base.executiveSummary.headline,
      whyNow: asText(summaryRecord.whyNow) || base.executiveSummary.whyNow,
      industryHypothesis: asText(summaryRecord.industryHypothesis) || base.executiveSummary.industryHypothesis
    };
  }

  const itSpend = record.itSpendIntelligence;
  if (typeof itSpend === "string") {
    base.itSpendIntelligence.signals = [itSpend, ...base.itSpendIntelligence.signals].slice(0, 3);
  } else if (itSpend && typeof itSpend === "object") {
    const spendRecord = itSpend as Record<string, unknown>;
    base.itSpendIntelligence = {
      estimatedRange: asText(spendRecord.estimatedRange) || base.itSpendIntelligence.estimatedRange,
      yoyMomentum: asText(spendRecord.yoyMomentum) || base.itSpendIntelligence.yoyMomentum,
      budgetPriority: asText(spendRecord.budgetPriority) || base.itSpendIntelligence.budgetPriority,
      signals: asStringArray(spendRecord.signals).length ? asStringArray(spendRecord.signals) : base.itSpendIntelligence.signals
    };
  }

  const initiatives = record.strategicAiInitiatives;
  if (typeof initiatives === "string") {
    base.strategicAiInitiatives.summary = initiatives;
  } else if (initiatives && typeof initiatives === "object") {
    const initiativeRecord = initiatives as Record<string, unknown>;
    base.strategicAiInitiatives = {
      summary: asText(initiativeRecord.summary) || base.strategicAiInitiatives.summary,
      programs: asStringArray(initiativeRecord.programs).length ? asStringArray(initiativeRecord.programs) : base.strategicAiInitiatives.programs,
      evidence: asStringArray(initiativeRecord.evidence).length ? asStringArray(initiativeRecord.evidence) : base.strategicAiInitiatives.evidence
    };
  }

  const technographics = record.technographics;
  if (typeof technographics === "string") {
    base.technographics.cloudFootprint = [technographics, ...base.technographics.cloudFootprint].slice(0, 3);
  } else if (technographics && typeof technographics === "object") {
    const technographicRecord = technographics as Record<string, unknown>;
    base.technographics = {
      cloudFootprint: asStringArray(technographicRecord.cloudFootprint).length ? asStringArray(technographicRecord.cloudFootprint) : base.technographics.cloudFootprint,
      dataEstate: asStringArray(technographicRecord.dataEstate).length ? asStringArray(technographicRecord.dataEstate) : base.technographics.dataEstate,
      contactCenterSignals: asStringArray(technographicRecord.contactCenterSignals).length ? asStringArray(technographicRecord.contactCenterSignals) : base.technographics.contactCenterSignals,
      modernizationSignals: asStringArray(technographicRecord.modernizationSignals).length ? asStringArray(technographicRecord.modernizationSignals) : base.technographics.modernizationSignals
    };
  }

  const publicSignals = record.publicSignals;
  if (Array.isArray(publicSignals)) {
    const normalizedSignals = publicSignals
      .map((signal) => {
        if (!signal || typeof signal !== "object") return null;
        const signalRecord = signal as Record<string, unknown>;
        return {
          category: normalizeCategory(asText(signalRecord.category)),
          label: asText(signalRecord.label) || "Public signal",
          detail: asText(signalRecord.detail) || "Gemini surfaced a relevant public signal.",
          strength: normalizeStrength(asText(signalRecord.strength))
        };
      })
      .filter(Boolean) as ProspectData["publicSignals"];
    if (normalizedSignals.length) {
      base.publicSignals = normalizedSignals;
    }
  } else if (publicSignals && typeof publicSignals === "object") {
    const signalEntries = Object.entries(publicSignals as Record<string, unknown>)
      .map(([label, detail], index) => {
        const categoryOrder: ProspectData["publicSignals"][number]["category"][] = ["financial", "ai", "exec"];
        return {
          category: categoryOrder[index] || "ai",
          label,
          detail: asText(detail),
          strength: "high" as const
        };
      })
      .filter((signal) => signal.detail);
    if (signalEntries.length) {
      base.publicSignals = signalEntries;
    }
  }

  if (Array.isArray(record.personas)) {
    const normalizedPersonas = record.personas
      .map((persona, index) => {
        if (!persona || typeof persona !== "object") return null;
        const personaRecord = persona as Record<string, unknown>;
        const title = asText(personaRecord.title) || asText(personaRecord.role) || `Persona ${index + 1}`;
        const searchStrings = asStringArray(personaRecord.searchStrings);
        const profileUrl =
          asText(personaRecord.profileUrl) ||
          asText(personaRecord.linkedinProfileUrl) ||
          asText(personaRecord.sourceUrl);
        const candidateName = asText(personaRecord.name) || asText(personaRecord.personName);
        const name = looksLikePersonName(candidateName) ? candidateName : `${companyName} ${title}`;
        return {
          name,
          title,
          profileUrl: profileUrl || undefined,
          sourceLabel: asText(personaRecord.sourceLabel) || sourceLabelFromProfileUrl(profileUrl),
          function: asText(personaRecord.function) || "Technology",
          seniority: asText(personaRecord.seniority) || (title.toLowerCase().includes("chief") ? "C-suite" : "VP"),
          buyingRole:
            asText(personaRecord.buyingRole) === "economic buyer" ||
            asText(personaRecord.buyingRole) === "technical buyer" ||
            asText(personaRecord.buyingRole) === "business champion"
              ? (asText(personaRecord.buyingRole) as ProspectData["personas"][number]["buyingRole"])
              : index === 0
                ? "economic buyer"
              : index === 1
                  ? "technical buyer"
                  : "business champion",
          whyNow: asText(personaRecord.whyNow) || "Likely public-facing stakeholder for AI platform and transformation decisions.",
          idealChannels: asStringArray(personaRecord.idealChannels).length
            ? asStringArray(personaRecord.idealChannels)
            : ["LinkedIn executive outreach", "targeted account briefings", "industry event follow-up"],
          kpis: asStringArray(personaRecord.kpis).length
            ? asStringArray(personaRecord.kpis)
            : ["AI ROI", "delivery speed", "operational efficiency"],
          objections: asStringArray(personaRecord.objections).length
            ? asStringArray(personaRecord.objections)
            : ["integration complexity", "cost scrutiny", "execution risk"],
          objectionHandling: asStringArray(personaRecord.objectionHandling).length
            ? asStringArray(personaRecord.objectionHandling)
            : ["lead with phased roadmap", "show KPI-linked pilot outcomes", "position Cognizant delivery support"],
          tailoredStrategy:
            asText(personaRecord.tailoredStrategy) ||
            "Focus on concrete business pressure, measurable KPI movement, and a low-risk path from pilot to enterprise rollout.",
          likelyPriorities: asStringArray(personaRecord.likelyPriorities).length
            ? asStringArray(personaRecord.likelyPriorities)
            : ["AI value realization", "platform modernization", "delivery confidence"],
          outreachAngles: asStringArray(personaRecord.outreachAngles).length
            ? asStringArray(personaRecord.outreachAngles)
            : ["Cognizant + Google Cloud co-sell motion", "governed AI operating model", "measurable pilot outcomes"],
          linkedinSearchQuery: asText(personaRecord.linkedinSearchQuery) || searchStrings[0] || `site:linkedin.com/in/ "${companyName}" "${title}"`,
          evidence: asStringArray(personaRecord.evidence).length ? asStringArray(personaRecord.evidence) : searchStrings
        };
      })
      .filter(Boolean) as ProspectData["personas"];
    if (normalizedPersonas.length) {
      base.personas = normalizedPersonas;
    }
  }

  const competitors = record.competitors ?? record.competitorBenchmarking ?? record.benchmarking;
  if (Array.isArray(competitors)) {
    const normalizedCompetitors = competitors
      .map((competitor) => {
        if (!competitor || typeof competitor !== "object") return null;
        const competitorRecord = competitor as Record<string, unknown>;
        return {
          name: asText(competitorRecord.name) || asText(competitorRecord.company) || "",
          benchmarkSummary: asText(competitorRecord.benchmarkSummary) || asText(competitorRecord.summary) || "",
          pressurePoint: asText(competitorRecord.pressurePoint) || asText(competitorRecord.competitivePressure) || "",
          cognizantAngle: asText(competitorRecord.cognizantAngle) || asText(competitorRecord.recommendedAngle) || ""
        };
      })
      .filter((competitor): competitor is ProspectData["competitors"][number] => Boolean(competitor?.name));

    if (normalizedCompetitors.length) {
      base.competitors = normalizedCompetitors.slice(0, 4);
    }
  } else if (competitors && typeof competitors === "object") {
    const normalizedCompetitors = Object.entries(competitors as Record<string, unknown>)
      .map(([name, value]) => {
        if (typeof value === "string") {
          return {
            name,
            benchmarkSummary: value,
            pressurePoint: "Competitive pressure surfaced from public market positioning.",
            cognizantAngle: "Use Cognizant and Google Cloud to counter with faster enterprise execution."
          };
        }

        if (!value || typeof value !== "object") return null;
        const competitorRecord = value as Record<string, unknown>;
        return {
          name,
          benchmarkSummary: asText(competitorRecord.benchmarkSummary) || asText(competitorRecord.summary) || "",
          pressurePoint: asText(competitorRecord.pressurePoint) || "",
          cognizantAngle: asText(competitorRecord.cognizantAngle) || ""
        };
      })
      .filter((competitor): competitor is ProspectData["competitors"][number] => Boolean(competitor?.name));

    if (normalizedCompetitors.length) {
      base.competitors = normalizedCompetitors.slice(0, 4);
    }
  }

  const productMatches = record.productMatches;
  if (Array.isArray(productMatches)) {
    const normalizedMatches = productMatches
      .map((match) => {
        if (!match || typeof match !== "object") return null;
        const matchRecord = match as Record<string, unknown>;
        const productName = asText(matchRecord.product) || "Google Cloud AI";
        const partner =
          asText(matchRecord.partner) === "Google Cloud" ||
          asText(matchRecord.partner) === "Cognizant" ||
          asText(matchRecord.partner) === "Google Cloud + Cognizant"
            ? (asText(matchRecord.partner) as ProspectData["productMatches"][number]["partner"])
            : "Google Cloud + Cognizant";

        return enrichProductMatch(productName, partner, scoreFromLooseValue(matchRecord.fitScore, base.propensityScore), {
          partner,
          fitScore: scoreFromLooseValue(matchRecord.fitScore, base.propensityScore),
          rationale: asText(matchRecord.rationale) || undefined,
          reasonForNeed: asText(matchRecord.reasonForNeed) || asText(matchRecord.whyNeeded) || undefined,
          accountBenefit: asText(matchRecord.accountBenefit) || asText(matchRecord.businessImpact) || undefined,
          whyCognizant: asText(matchRecord.whyCognizant) || undefined,
          whyGoogleCloud: asText(matchRecord.whyGoogleCloud) || undefined,
          activationPlan: asText(matchRecord.activationPlan) || undefined,
          proofPoints: asStringArray(matchRecord.proofPoints),
          evidenceSignals: asStringArray(matchRecord.evidenceSignals),
          deepDiveUrl: asText(matchRecord.deepDiveUrl) || undefined,
          deepDiveLabel: asText(matchRecord.deepDiveLabel) || undefined
        });
      })
      .filter(Boolean) as ProspectData["productMatches"];
    if (normalizedMatches.length) {
      base.productMatches = ensureHeatmapCoverage(dedupeProductMatches(normalizedMatches), companyName, base.propensityScore);
    }
  } else if (productMatches && typeof productMatches === "object") {
    const nestedMatches: ProspectData["productMatches"] = [];
    for (const [partnerLabel, group] of Object.entries(productMatches as Record<string, unknown>)) {
      if (!group || typeof group !== "object") continue;
      for (const [product, rationale] of Object.entries(group as Record<string, unknown>)) {
        nestedMatches.push({
          ...enrichProductMatch(
            product,
            partnerLabel.toLowerCase().includes("cognizant") && partnerLabel.toLowerCase().includes("google")
              ? "Google Cloud + Cognizant"
              : partnerLabel.toLowerCase().includes("cognizant")
                ? "Cognizant"
                : "Google Cloud",
            scoreFromLooseValue(base.propensityScore, base.propensityScore),
            {
              rationale: asText(rationale) || undefined,
              activationPlan: "Turn this fit into a joint account hypothesis and pilot wedge.",
              proofPoints: ["public strategic signal", "product alignment", "co-sell pathway"]
            }
          )
        });
      }
    }
    if (nestedMatches.length) {
      base.productMatches = ensureHeatmapCoverage(dedupeProductMatches(nestedMatches), companyName, base.propensityScore);
    }
  }

  const accountPlan = record.accountPlan;
  if (typeof accountPlan === "string") {
    base.accountPlan.whyCognizantNow = accountPlan;
  } else if (accountPlan && typeof accountPlan === "object") {
    const planRecord = accountPlan as Record<string, unknown>;
    base.accountPlan = {
      whyCognizantNow: asText(planRecord.whyCognizantNow) || base.accountPlan.whyCognizantNow,
      discoveryQuestions: asStringArray(planRecord.discoveryQuestions).length ? asStringArray(planRecord.discoveryQuestions) : base.accountPlan.discoveryQuestions,
      nextActions: asStringArray(planRecord.nextActions).length ? asStringArray(planRecord.nextActions) : base.accountPlan.nextActions,
      whitespaceHypotheses: asStringArray(planRecord.whitespaceHypotheses).length ? asStringArray(planRecord.whitespaceHypotheses) : base.accountPlan.whitespaceHypotheses
    };
  }

  const blueprint = record.blueprint;
  if (blueprint && typeof blueprint === "object") {
    const blueprintRecord = blueprint as Record<string, unknown>;
    const targetProducts = asStringArray(blueprintRecord.targetProducts);
    const dataSources = asStringArray(blueprintRecord.dataSources);
    const keyFunctions = asStringArray(blueprintRecord.keyFunctions);
    const bigQueryTables = asStringArray(blueprintRecord.bigQueryTables);
    const orchestration = asStringArray(blueprintRecord.orchestration);
    base.blueprint = {
      appName: asText(blueprintRecord.appName) || base.blueprint.appName,
      purpose: asText(blueprintRecord.purpose) || base.blueprint.purpose,
      targetProducts: targetProducts.length ? targetProducts : base.blueprint.targetProducts,
      dataSources: dataSources.length ? dataSources : base.blueprint.dataSources,
      keyFunctions: keyFunctions.length ? keyFunctions : Object.keys(blueprintRecord).filter((key) => key !== "appName" && key !== "purpose").slice(0, 6),
      bigQueryTables: bigQueryTables.length ? bigQueryTables : base.blueprint.bigQueryTables,
      orchestration: orchestration.length ? orchestration : Object.values(blueprintRecord).map((value) => asText(value)).filter(Boolean).slice(0, 6)
    };
  }

  const metadata = record.researchMetadata;
  if (metadata && typeof metadata === "object") {
    const metadataRecord = metadata as Record<string, unknown>;
    base.researchMetadata.generatedAt = asText(metadataRecord.generatedAt) || base.researchMetadata.generatedAt;
    base.researchMetadata.note =
      asText(metadataRecord.note) ||
      "Live research synthesized from public sources and structured for the workspace.";
  }

  base.companyName = asText(record.companyName) || companyName;
  base.companyWebsite = normalizedWebsite || base.companyWebsite;
  base.propensityScore = scoreFromLooseValue(record.propensityScore, base.propensityScore);

  return enrichPersonaMessaging(base);
}

function enrichPersonaMessaging(data: ProspectData): ProspectData {
  const topProducts = data.productMatches.slice(0, 3).map((match) => match.product);
  const topProductText = topProducts.join(", ");

  data.personas = data.personas.map((persona) => {
    const title = persona.title.toLowerCase();
    const functionName = persona.function.toLowerCase();
    const buyingRole = persona.buyingRole;

    let objections = persona.objections;
    let objectionHandling = persona.objectionHandling;
    let tailoredStrategy = persona.tailoredStrategy;

    const looksGenericObjections =
      !objections.length ||
      objections.some((item) =>
        [
          "integration complexity",
          "cost scrutiny",
          "execution risk",
          "tool sprawl",
          "data readiness",
          "governance complexity",
          "workflow disruption",
          "budget scrutiny",
          "ai trust concerns",
          "legacy integration complexity",
          "cost of transformation",
          "change-management risk"
        ].includes(item.toLowerCase())
      );

    const looksGenericHandling =
      !objectionHandling.length ||
      objectionHandling.some((item) =>
        [
          "lead with phased roadmap",
          "show KPI-linked pilot outcomes",
          "position Cognizant delivery support",
          "show integrated architecture",
          "use BigQuery and Vertex AI patterns",
          "position Cognizant accelerators for faster rollout",
          "start with narrow pilot use cases",
          "tie outcomes to service KPIs",
          "use Cognizant change support and human-in-the-loop rollout",
          "lead with phased modernization",
          "tie value to measurable outcomes",
          "show Cognizant delivery capacity"
        ].includes(item.toLowerCase())
      );

    if (buyingRole === "economic buyer" || (buyingRole !== "technical buyer" && buyingRole !== "business champion" && (title.includes("chief") || title.includes("cio") || title.includes("cto")))) {
      if (looksGenericObjections) {
        objections = [
          "Too much platform spend without simplification.",
          "No budget without a KPI-backed business case.",
          `Doubt that ${topProductText || "the stack"} can move quickly enough.`
        ];
      }
      if (looksGenericHandling) {
        objectionHandling = [
          "Lead with one KPI-led workflow and a 90-day outcome.",
          "Show Cognizant as the delivery and adoption owner.",
          "Use accelerators or packaged services to reduce procurement drag."
        ];
      }
      if (!persona.tailoredStrategy || persona.tailoredStrategy.startsWith("Focus on concrete business pressure") || persona.tailoredStrategy.startsWith("Focus on platform scalability")) {
        tailoredStrategy = "Anchor the conversation on simplification and execution speed: show how Cognizant can turn the shortlisted Google offerings into one governed roadmap with visible 90-day outcomes.";
      }
    } else if (buyingRole === "technical buyer" || (buyingRole !== "business champion" && (title.includes("data") || title.includes("ai") || functionName.includes("data")))) {
      if (looksGenericObjections) {
        objections = [
          "The stack may add sprawl to the current estate.",
          "Governance and MLOps may slow production rollout.",
          "Reference patterns may not fit existing data flows."
        ];
      }
      if (looksGenericHandling) {
        objectionHandling = [
          "Show one target architecture, not a list of products.",
          "Use accelerators and delivery patterns to reduce setup work.",
          "Start with one production use case and reusable governance assets."
        ];
      }
      if (!persona.tailoredStrategy || persona.tailoredStrategy.startsWith("Focus on concrete business pressure") || persona.tailoredStrategy.startsWith("Emphasize platform coherence")) {
        tailoredStrategy = "Keep the discussion technical and implementation-specific: reduce sprawl, prove governance, and show how the selected Google and Cognizant offerings create a repeatable production pattern.";
      }
    } else {
      if (looksGenericObjections) {
        objections = [
          "Teams may feel rollout pain before KPI lift appears.",
          "Workflow change may disrupt frontline operations.",
          `No budget unless ${topProductText || "the offering"} improves speed or productivity.`
        ];
      }
      if (looksGenericHandling) {
        objectionHandling = [
          "Tie the first motion to one operational KPI.",
          "Use the most relevant workflow offering as a tight pilot.",
          "Position Cognizant as the rollout and adoption layer."
        ];
      }
      if (!persona.tailoredStrategy || persona.tailoredStrategy.startsWith("Focus on concrete business pressure") || persona.tailoredStrategy.startsWith("Position the motion around service productivity")) {
        tailoredStrategy = "Make the pitch operational and low-risk: connect the shortlisted offerings to one frontline workflow, one KPI, and one adoption plan owned jointly with Cognizant.";
      }
    }

    return {
      ...persona,
      objections,
      objectionHandling,
      tailoredStrategy
    };
  });

  return data;
}

function demoProspect(companyName: string, note: string): ProspectData {
  const seed = hash(companyName);
  const score = 72 + (seed % 21);
  return enrichPersonaMessaging({
    companyName,
    companyWebsite: "",
    executiveSummary: {
      headline: `${companyName} presents a credible public-data-based pursuit for Cognizant and Google Cloud AI co-sell motion.`,
      whyNow: "Public modernization, hiring, and AI transformation narratives suggest the account could respond to an operating-model-led sales motion.",
      industryHypothesis: `${companyName} likely has AI ambition, but still needs better execution linkage between platform investment, workflow transformation, and business outcomes.`
    },
    itSpendIntelligence: {
      estimatedRange: `$${65 + (seed % 110)}M-$${110 + (seed % 135)}M`,
      yoyMomentum: `+${3 + (seed % 7)}%`,
      budgetPriority: "AI-enabled modernization with measurable business impact",
      signals: [
        "Transformation language suggests sustained investment in data, cloud, and AI programs.",
        "Role patterns imply active funding for modernization rather than pure maintenance.",
        "Public narratives likely tie AI interest to customer experience and operating leverage."
      ]
    },
    strategicAiInitiatives: {
      summary: `${companyName} is currently in demo mode, but the likely pattern is a mix of AI experimentation, workflow transformation, and platform modernization.`,
      programs: [
        "Strategic AI use-case prioritization",
        "Data and cloud operating model upgrades",
        "Customer or employee workflow augmentation"
      ],
      evidence: [
        "Executive and hiring signals around AI, cloud, or customer experience",
        "Public references to transformation, productivity, or modernization",
        "Likely interest in governed enterprise AI, not just isolated pilots"
      ]
    },
    technographics: {
      cloudFootprint: ["cloud modernization in motion", "analytics and data consolidation agenda", "AI-ready platform interest"],
      dataEstate: ["fragmented enterprise data", "reporting and workflow dependencies", "need for governed AI inputs"],
      contactCenterSignals: ["customer or employee service automation opportunity", "knowledge retrieval opportunity", "summarization and agent guidance potential"],
      modernizationSignals: ["legacy workflow burden", "tool sprawl", "pressure to align AI to operating outcomes"]
    },
    publicSignals: [
      { category: "financial", label: "Transformation spend", detail: "The account likely ties technology spend to operating efficiency and growth outcomes.", strength: "high" },
      { category: "ai", label: "Enterprise AI agenda", detail: "AI appears relevant, but execution discipline is likely the real differentiator.", strength: "high" },
      { category: "hiring", label: "Persona trail", detail: "Public executive and hiring signals should help narrow likely decision-makers and champions.", strength: "medium" }
    ],
    personas: [
      {
        name: `${companyName} Executive Sponsor`,
        title: "Chief Information Officer",
        function: "Technology",
        seniority: "C-suite",
        buyingRole: "economic buyer",
        whyNow: "Owns modernization sequencing, partner choice, and platform governance.",
        idealChannels: ["LinkedIn professional messaging", "executive transformation briefings", "industry leadership summits"],
        kpis: ["technology simplification", "migration speed", "AI ROI", "platform resiliency"],
        objections: ["legacy integration complexity", "cost of transformation", "change-management risk"],
        objectionHandling: ["lead with phased modernization", "tie value to measurable outcomes", "show Cognizant delivery capacity"],
        tailoredStrategy: "Focus on platform scalability, modernization velocity, and the speed-to-value of moving toward a governed Google Cloud AI stack.",
        likelyPriorities: ["technology simplification", "AI value realization", "governed transformation"],
        outreachAngles: ["Vertex AI operating model", "Cognizant transformation capacity", "Google Cloud plus delivery execution"],
        linkedinSearchQuery: `site:linkedin.com/in/ "${companyName}" "Chief Information Officer"`,
        evidence: ["Likely present in executive or transformation communications", "Natural budget owner for cloud and AI change"]
      },
      {
        name: `${companyName} Platform Owner`,
        title: "VP, Data & AI",
        function: "Data and AI",
        seniority: "VP",
        buyingRole: "technical buyer",
        whyNow: "Bridges AI platform choices with production use cases and governance.",
        idealChannels: ["LinkedIn professional messaging", "architecture reviews", "AI platform roundtables"],
        kpis: ["model deployment cadence", "data quality", "reusable AI assets", "time to governed production"],
        objections: ["tool sprawl", "data readiness", "governance complexity"],
        objectionHandling: ["show integrated architecture", "use BigQuery and Vertex AI patterns", "position Cognizant accelerators for faster rollout"],
        tailoredStrategy: "Emphasize platform coherence, governed AI deployment, and reusable patterns that reduce friction between experimentation and production.",
        likelyPriorities: ["deployable AI platform", "data readiness", "reuse and governance"],
        outreachAngles: ["BigQuery + Vertex AI reference architecture", "Cognizant accelerators", "technical blueprint workshop"],
        linkedinSearchQuery: `site:linkedin.com/in/ "${companyName}" "VP Data AI"`,
        evidence: ["Likely tied to hiring and technical program signals", "Strong translator between business ambition and technical reality"]
      },
      {
        name: `${companyName} Business Champion`,
        title: "VP, Customer Operations",
        function: "Operations",
        seniority: "VP",
        buyingRole: "business champion",
        whyNow: "Feels ROI pressure where AI can improve service, resolution quality, and productivity.",
        idealChannels: ["Direct executive outreach", "operations workshops", "peer success references"],
        kpis: ["containment", "resolution speed", "agent productivity", "customer satisfaction"],
        objections: ["workflow disruption", "budget scrutiny", "AI trust concerns"],
        objectionHandling: ["start with narrow pilot use cases", "tie outcomes to service KPIs", "use Cognizant change support and human-in-the-loop rollout"],
        tailoredStrategy: "Position the motion around service productivity, better guidance for teams, and a low-risk pilot tied to visible operational metrics.",
        likelyPriorities: ["service productivity", "containment", "better agent experiences"],
        outreachAngles: ["Customer Engagement Suite pilot", "Document AI workflow augmentation", "fast ROI co-sell wedge"],
        linkedinSearchQuery: `site:linkedin.com/in/ "${companyName}" "VP Customer Operations"`,
        evidence: ["Operational sponsor for near-term value", "Likely champion for measurable pilot outcomes"]
      }
    ],
    productMatches: [
      {
        product: "Vertex AI",
        partner: "Google Cloud + Cognizant",
        fitScore: Math.min(95, score + 2),
        rationale: "Best fit for enterprise AI platforming, governed deployment, and operating model alignment.",
        activationPlan: "Lead with a 90-day AI use-case roadmap tied to platform and workflow modernization.",
        proofPoints: ["governed genAI", "model deployment discipline", "enterprise AI scale-up"]
      },
      {
        product: "Customer Engagement Suite",
        partner: "Google Cloud + Cognizant",
        fitScore: Math.max(75, score - 4),
        rationale: "Strong fit when customer or employee service operations are visible improvement targets.",
        activationPlan: "Create a pilot tied to containment, handle time, and knowledge guidance metrics.",
        proofPoints: ["service modernization", "AI-assisted operations", "faster ROI path"]
      },
      {
        product: "Cognizant Neuro AI",
        partner: "Cognizant",
        fitScore: Math.max(74, score - 2),
        rationale: "Useful when the account needs orchestration and delivery discipline around AI programs.",
        activationPlan: "Position as the execution and governance layer around Google Cloud AI investments.",
        proofPoints: ["enterprise orchestration", "delivery acceleration", "governance support"]
      }
    ],
    competitors: [
      {
        name: `${companyName} peer benchmark A`,
        benchmarkSummary: `${companyName} likely faces peer pressure from rivals that are packaging AI investment into clearer operating-model stories.`,
        pressurePoint: "Peers may look more execution-ready in public narratives around workflow modernization and AI rollout.",
        cognizantAngle: `Position Cognizant as the delivery layer that helps ${companyName} close the execution gap faster.`
      },
      {
        name: `${companyName} peer benchmark B`,
        benchmarkSummary: "Comparable accounts are likely talking more directly about governed platform adoption and business outcomes.",
        pressurePoint: "A vague AI story can lose to competitors that tie modernization to ROI metrics.",
        cognizantAngle: "Lead with a benchmarked 90-day pilot and stronger business-case messaging."
      },
      {
        name: `${companyName} peer benchmark C`,
        benchmarkSummary: "Industry peers often create urgency by connecting AI investment to customer and employee workflow productivity.",
        pressurePoint: "Operational buyers respond when a rival appears further ahead on measurable service modernization.",
        cognizantAngle: "Use Google Cloud AI products plus Cognizant transformation capacity to reposition around speed to value."
      }
    ],
    accountPlan: {
      whyCognizantNow: `Cognizant gives ${companyName} a credible path from public AI ambition to measurable execution, while Google Cloud supplies the platform products that make the co-sell tangible.`,
      discoveryQuestions: [
        "Which AI programs already have executive funding versus only exploratory interest?",
        "Where are cloud and data modernization goals colliding with operational bottlenecks?",
        "Which business leader would champion a fast pilot if ROI were explicit?"
      ],
      nextActions: [
        "Validate 2-3 real public initiatives and map them to Google Cloud AI products.",
        "Refine persona shortlist with compliant LinkedIn and public-profile discovery.",
        "Build a joint Cognizant + Google Cloud point of view with a narrow pilot wedge."
      ],
      whitespaceHypotheses: [
        "The account may have budget and strategy, but lacks a practical AI operating model.",
        "The strongest co-sell entry point is likely an operational workflow, not a broad platform pitch."
      ]
    },
    blueprint: {
      appName: "AI-Pulse Prospector",
      purpose: "Prospect strategic accounts using public signals and map them to Google Cloud AI + Cognizant co-sell plays.",
      targetProducts: productCatalog,
      dataSources: [
        "SEC filings and investor relations",
        "Earnings calls and public news",
        "Job postings and hiring patterns",
        "Public executive profiles and LinkedIn discovery workflows",
        "Technographic and cloud footprint signals"
      ],
      keyFunctions: [
        "IT spend and transformation signal extraction",
        "AI initiative identification",
        "Persona mapping",
        "Co-sell product matching",
        "BigQuery-ready account intelligence output"
      ],
      bigQueryTables: [
        "accounts_raw_signals",
        "accounts_enriched_profiles",
        "persona_candidates",
        "product_fit_scores",
        "account_action_plans"
      ],
      orchestration: [
        "Server-side live research and synthesis",
        "BigQuery analytical backbone",
        "Human-in-the-loop persona validation",
        "CRM and sales execution handoff"
      ]
    },
    propensityScore: score,
    researchMetadata: {
      mode: "demo",
      generatedAt: new Date().toISOString(),
      note,
      sources: []
    }
  });
}

export default async function handler(req: RequestWithBody, res: ResponseWithHelpers) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const companyName = String(req.body?.companyName || "").trim();
  if (!companyName) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }

  const cached = getServerCache(companyName);
  if (cached) {
    res.status(200).json({ data: cached });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(200).json({
      data: demoProspect(companyName, "No GEMINI_API_KEY is set in Vercel, so the app is using its demo fallback.")
    });
    return;
  }

  try {
    const startedAt = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    const data = await requestLiveProspect(genAI, companyName);

    if (hasTimeBudget(startedAt, ENRICHMENT_TIMEOUT_MS * 2)) {
      try {
        const repairedPersonas = await withTimeout(
          enrichRealPersonas(genAI, companyName),
          ENRICHMENT_TIMEOUT_MS,
          "Persona enrichment"
        );
        if (repairedPersonas?.length) {
          data.personas = repairedPersonas;
        }
      } catch (repairError) {
        console.warn("Persona enrichment repair failed.", repairError);
      }
    }

    if (hasTimeBudget(startedAt, ENRICHMENT_TIMEOUT_MS)) {
      try {
        const repairedCompetitors = await withTimeout(
          enrichRealCompetitors(
            genAI,
            companyName,
            `${data.executiveSummary.headline} ${data.strategicAiInitiatives.summary}`
          ),
          ENRICHMENT_TIMEOUT_MS,
          "Competitor enrichment"
        );
        if (repairedCompetitors?.length) {
          data.competitors = repairedCompetitors.slice(0, 4);
        }
      } catch (repairError) {
        console.warn("Competitor enrichment repair failed.", repairError);
      }
    }

    if (data.personas.some((persona) => isGenericPersonaName(persona.name, companyName))) {
      data.personas = [];
    }

    if (data.competitors.some((competitor) => !isRealCompetitorName(competitor.name, companyName))) {
      data.competitors = [];
    }

    setServerCache(companyName, data);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Live prospecting research failed.", error);
    res.status(200).json({
      data: demoProspect(companyName, buildLiveResearchFallbackNote(error))
    });
  }
}
