export type DocumentMode = "executive" | "technical";

export interface DocumentGenerationInput {
  targetCompany: string;
  industry: string;
  painPoint: string;
  gcpOfferings: string[];
  cognizantOfferings: string[];
  accountSummary: string;
  whyNow: string;
  sourceUrls: string[];
}

export interface GeneratedDocuments {
  executiveMarkdown: string;
  technicalMarkdown: string;
  generatedAt: string;
  mode: "live" | "fallback";
  note: string;
}

export interface SlideSummary {
  slides: {
    title: string;
    subtitle?: string;
    bulletPoints: string[];
  }[];
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
      if (depth === 0) {
        return rawText.slice(start, index + 1).trim();
      }
    }
  }

  return null;
}

function extractJsonPayload(rawText: string) {
  const candidate = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  return extractBalancedJsonSegment(candidate, "{") || extractBalancedJsonSegment(candidate, "[");
}

async function executeGeminiRequest(
  promptText: string,
  expectJson: boolean,
  options?: { useSearch?: boolean }
) {
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

  if (!expectJson) {
    return textOut;
  }

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

  const emphasis =
    mode === "executive"
      ? "business value, executive alignment, and phased co-sell activation"
      : "target-state architecture, integration boundaries, and governed implementation sequencing";

  return [
    title,
    "",
    "## 1. Situation Overview",
    input.accountSummary,
    "",
    "## 2. Why This Matters Now",
    input.whyNow,
    "",
    "## 3. Core Pain Point",
    input.painPoint,
    "",
    "## 4. Google Cloud Fit",
    ...input.gcpOfferings.map((offering) => `- ${offering}`),
    "",
    "## 5. Cognizant Fit",
    ...input.cognizantOfferings.map((offering) => `- ${offering}`),
    "",
    "## 6. Recommended Motion",
    `Focus this document on ${emphasis} for ${input.targetCompany} in ${input.industry}.`,
    "",
    "## 7. Source Set",
    ...input.sourceUrls.map((url) => `- ${url}`)
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

export async function generateDocuments(input: DocumentGenerationInput): Promise<GeneratedDocuments> {
  if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
    return {
      executiveMarkdown: buildFallbackMarkdown(input, "executive"),
      technicalMarkdown: buildFallbackMarkdown(input, "technical"),
      generatedAt: new Date().toISOString(),
      mode: "fallback",
      note: "GEMINI_API_KEY is not configured, so the app generated deterministic markdown documents."
    };
  }

  try {
    const [executiveMarkdown, technicalMarkdown] = await Promise.all([
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "executive"), false, { useSearch: true }), 8000, "Exec doc generation"),
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "technical"), false, { useSearch: true }), 8000, "Tech doc generation")
    ]);

    return {
      executiveMarkdown,
      technicalMarkdown,
      generatedAt: new Date().toISOString(),
      mode: "live",
      note: "Executive and technical documents were generated in parallel for faster turnaround."
    };
  } catch (error) {
    return {
      executiveMarkdown: buildFallbackMarkdown(input, "executive"),
      technicalMarkdown: buildFallbackMarkdown(input, "technical"),
      generatedAt: new Date().toISOString(),
      mode: "fallback",
      note: error instanceof Error ? `Gemini document generation fell back. ${error.message}` : "Gemini document generation fell back."
    };
  }
}

export async function summarizeDocumentToSlides(markdownText: string, mode: DocumentMode): Promise<SlideSummary> {
  if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
    return {
      slides: [
        {
          title: mode === "executive" ? "Executive Summary" : "Architecture Summary",
          subtitle: "Fallback slide summary",
          bulletPoints: markdownText
            .split("\n")
            .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("##"))
            .slice(0, 6)
            .map((line) => line.replace(/^[-#\s]+/, ""))
        }
      ]
    };
  }

  const persona = mode === "executive" ? "top-tier executive presentation designer" : "lead technical presentation designer";
  const structuralSlides =
    mode === "executive"
      ? "1. Executive Summary\n2. Business Value & ROI\n3. Target Operating Model\n4. Core Differentiation\n5. Cognizant Strategic Value\n6. High-Level Timeline"
      : "1. Architecture Summary\n2. Target State Integration\n3. Google Cloud Blueprint\n4. Cognizant Delivery IP\n5. Security & Governance\n6. Technical Roadmap KPIs";

  const prompt = `
You are a ${persona}. Read the playbook below and summarize it into exactly 6 slides.
Preserve the target company and named personas or specific titles whenever they appear.

PLAYBOOK TEXT:
"""
${markdownText}
"""

Return only valid JSON:
{
  "slides": [
    {
      "title": "Professional Header",
      "subtitle": "Component Subtitle",
      "bulletPoints": ["Detailed point", "Detailed point"]
    }
  ]
}

Use this exact slide structure:
${structuralSlides}
`;

  return executeGeminiRequest(prompt, true);
}
