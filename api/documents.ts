import type { IncomingMessage, ServerResponse } from "http";

export const maxDuration = 60;

type DocumentMode = "executive" | "technical";

type DocumentGenerationInput = {
  targetCompany: string;
  industry: string;
  painPoint: string;
  gcpOfferings: string[];
  cognizantOfferings: string[];
  accountSummary: string;
  whyNow: string;
  sourceUrls: string[];
};

type RequestWithBody = IncomingMessage & {
  body?: Partial<DocumentGenerationInput>;
};

type ResponseWithHelpers = ServerResponse & {
  status: (code: number) => ResponseWithHelpers;
  json: (body: unknown) => void;
};

function withHelpers(res: ServerResponse): ResponseWithHelpers {
  const typed = res as ResponseWithHelpers;
  typed.status = (code: number) => {
    res.statusCode = code;
    return typed;
  };
  typed.json = (body: unknown) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  return typed;
}

function normalizeBody(body: Partial<DocumentGenerationInput> | undefined): DocumentGenerationInput | null {
  if (!body) return null;
  const targetCompany = typeof body.targetCompany === "string" ? body.targetCompany.trim() : "";
  if (!targetCompany) return null;

  return {
    targetCompany,
    industry: typeof body.industry === "string" ? body.industry : "Cross-industry",
    painPoint: typeof body.painPoint === "string" ? body.painPoint : "",
    gcpOfferings: Array.isArray(body.gcpOfferings) ? body.gcpOfferings.filter((item): item is string => typeof item === "string") : [],
    cognizantOfferings: Array.isArray(body.cognizantOfferings)
      ? body.cognizantOfferings.filter((item): item is string => typeof item === "string")
      : [],
    accountSummary: typeof body.accountSummary === "string" ? body.accountSummary : "",
    whyNow: typeof body.whyNow === "string" ? body.whyNow : "",
    sourceUrls: Array.isArray(body.sourceUrls) ? body.sourceUrls.filter((item): item is string => typeof item === "string") : []
  };
}

function extractBalancedJsonSegment(rawText: string, openingChar: "{" | "["): string | null {
  const closingChar = openingChar === "{" ? "}" : "]";
  const start = rawText.indexOf(openingChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
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
      if (depth === 0) return rawText.slice(start, index + 1).trim();
    }
  }

  return null;
}

function extractJsonPayload(rawText: string) {
  const candidate = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  return extractBalancedJsonSegment(candidate, "{") || extractBalancedJsonSegment(candidate, "[");
}

async function executeGeminiRequest(promptText: string, expectJson: boolean, options?: { useSearch?: boolean }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  if (options?.useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  const resultData = await response.json();
  if (!response.ok) {
    throw new Error(resultData.error?.message || "Unknown Gemini API error.");
  }

  let textOut =
    resultData?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";

  if (!textOut) {
    throw new Error("Gemini did not return any content.");
  }

  if (!expectJson) return textOut;

  const jsonPayload = extractJsonPayload(textOut);
  if (!jsonPayload) {
    throw new Error("Gemini did not return a complete JSON payload.");
  }

  return JSON.parse(jsonPayload);
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

function buildFallbackMarkdown(input: DocumentGenerationInput, mode: DocumentMode) {
  const title =
    mode === "executive"
      ? `# ${input.targetCompany}: Joint Google Cloud + Cognizant Executive Sales Play`
      : `# ${input.targetCompany}: Technical Architecture Playbook for Google Cloud + Cognizant`;

  const googleFit = input.gcpOfferings.length
    ? input.gcpOfferings.map((offering) => `- ${offering}: relevant to the stated modernization and AI agenda at ${input.targetCompany}.`)
    : ["- Google Cloud AI and data services should anchor the platform conversation."];
  const cognizantFit = input.cognizantOfferings.length
    ? input.cognizantOfferings.map((offering) => `- ${offering}: helps reduce delivery risk and accelerate adoption with managed transformation support.`)
    : ["- Cognizant services should anchor execution, governance, and operating-model rollout."];
  const sources = input.sourceUrls.length ? input.sourceUrls.map((url) => `- ${url}`) : ["- No clean official source URLs were captured for this account."];

  return [
    title,
    "",
    "## 1. Executive Context",
    input.accountSummary || `${input.targetCompany} presents a credible joint Google Cloud and Cognizant co-sell opportunity.`,
    "",
    "## 2. Why This Matters Now",
    input.whyNow || `The account has visible pressure to turn AI ambition into measurable operating outcomes in ${input.industry}.`,
    "",
    mode === "executive" ? "## 3. Business Problem to Solve" : "## 3. Architecture Problem to Solve",
    input.painPoint || `The account needs a clearer operating model, delivery sequence, and platform handoff for AI modernization.`,
    "",
    mode === "executive" ? "## 4. Joint Value Hypothesis" : "## 4. Target State Direction",
    mode === "executive"
      ? `Google Cloud provides the AI, data, and application platform foundation, while Cognizant provides the industry delivery model, governance structure, and change enablement required to land a credible first motion at ${input.targetCompany}.`
      : `Establish Google Cloud as the governed AI and data platform layer, then use Cognizant to design integration boundaries, rollout sequencing, and production operating controls around the initial deployment scope.`,
    "",
    "## 5. Google Cloud Fit",
    ...googleFit,
    "",
    "## 6. Cognizant Fit",
    ...cognizantFit,
    "",
    mode === "executive" ? "## 7. Recommended First Motion" : "## 7. Delivery and Governance Motion",
    mode === "executive"
      ? `Lead with a focused executive workshop for ${input.targetCompany} that aligns on one measurable AI use case, the Google Cloud platform posture, the Cognizant delivery role, and a 90-day pilot path with named sponsors.`
      : `Define the first implementation slice, confirm data and workflow boundaries, align security and governance controls, and build a phased plan that moves from pilot to production without platform sprawl.`,
    "",
    "## 8. Reference Set",
    ...sources
  ].join("\n");
}

function buildDocumentPrompt(input: DocumentGenerationInput, mode: DocumentMode) {
  const flavor = mode === "executive"
    ? "An executive strategy playbook for business and GTM leaders. Focus on business case, buyers, ROI, co-sell narrative, and phased next steps."
    : "A technical architecture playbook for technical buyers and architects. Focus on target-state architecture, data/integration flows, governance, security, and delivery plan.";

  return `
You are a joint Google Cloud and Cognizant field strategist.

Create a polished markdown document for this account:
${flavor}

Target Company: ${input.targetCompany}
Target Industry: ${input.industry}
Core Pain Point: ${input.painPoint}
Google Cloud Offerings: ${input.gcpOfferings.join(", ")}
Cognizant Offerings: ${input.cognizantOfferings.join(", ")}
Account Summary: ${input.accountSummary}
Why Now: ${input.whyNow}
Source URLs:
${input.sourceUrls.join("\n")}

REQUIREMENTS:
- Use only official Google Cloud and Cognizant capability boundaries.
- Use Google Search grounding for company context where helpful.
- Keep the document rich but concise enough to generate quickly.
- Use strong markdown headings and bullets.
`;
}

async function generateDocuments(input: DocumentGenerationInput) {
  if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
    return {
      executiveMarkdown: buildFallbackMarkdown(input, "executive"),
      technicalMarkdown: buildFallbackMarkdown(input, "technical"),
      generatedAt: new Date().toISOString(),
      mode: "fallback" as const,
      note: "GEMINI_API_KEY is not configured, so the app generated deterministic markdown documents."
    };
  }

  try {
    const [executiveMarkdown, technicalMarkdown] = await Promise.all([
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "executive"), false), 30000, "Exec doc generation"),
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "technical"), false), 30000, "Tech doc generation")
    ]);

    return {
      executiveMarkdown,
      technicalMarkdown,
      generatedAt: new Date().toISOString(),
      mode: "live" as const,
      note: "Executive and technical documents were generated in parallel for faster turnaround."
    };
  } catch (error) {
    return {
      executiveMarkdown: buildFallbackMarkdown(input, "executive"),
      technicalMarkdown: buildFallbackMarkdown(input, "technical"),
      generatedAt: new Date().toISOString(),
      mode: "fallback" as const,
      note: error instanceof Error ? `Gemini document generation fell back. ${error.message}` : "Gemini document generation fell back."
    };
  }
}

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  const response = withHelpers(res);

  try {
    if (req.method !== "POST") {
      response.status(405).json({ error: "Method not allowed." });
      return;
    }

    const input = normalizeBody(req.body);
    if (!input) {
      response.status(400).json({ error: "A valid document generation payload is required." });
      return;
    }

    const data = await generateDocuments(input);
    response.status(200).json({ data });
  } catch (error: any) {
    response.status(500).json({ error: "Server handler error: " + (error.message || String(error)) });
  }
}
