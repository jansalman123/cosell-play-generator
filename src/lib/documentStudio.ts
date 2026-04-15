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

async function runAutonomousArchitectLoop(input: DocumentGenerationInput, isExecutiveMode: boolean) {
  let draft = "";
  let loopCount = 0;
  const MAX_LOOPS = 1;
  let isApproved = false;

  const authorPersona = isExecutiveMode ? "Enterprise GTM Strategist & Marketing Lead" : "Principal Google Cloud Architect";
  const criticPersona = isExecutiveMode ? "Chief Marketing Officer (CMO)" : "Principal Enterprise Critic";

  const authorGoal = isExecutiveMode
    ? "Create a persuasive executive sales playbook tailored to the target company. Focus on business objectives, ROI, competitive positioning, named buyer roles, and time-to-value."
    : "Create an enterprise integration and implementation architecture playbook tailored to the target company. Focus on structural integration architecture, target-state data flows, governance, delivery sequencing, and named technical personas. Do not emit low-level scripts, terminal commands, or configuration garbage.";

  const criticGoal = isExecutiveMode
    ? "Reject the draft if it lacks company-specific content, real buyer personas, commercial clarity, competitive context, or quantified business value."
    : "Reject the draft if it lacks company-specific architectural guidance, real technical personas, integration structure, governance boundaries, or if it drifts into fluff or low-level implementation noise.";

  let prompt = `
You are a ${authorPersona} at Cognizant.
Target Company: ${input.targetCompany}
Target Industry: ${input.industry}
Business Core Challenge: ${input.painPoint}
Google Cloud Capabilities: ${input.gcpOfferings.join(", ")}
Cognizant Frameworks: ${input.cognizantOfferings.join(", ")}
Account Summary: ${input.accountSummary}
Why Now: ${input.whyNow}
Official Sources: ${input.sourceUrls.join("\n")}

${authorGoal}

CRITICAL RULES:
1. Use official Google Cloud and Cognizant capability boundaries only.
2. Use Google Search grounding to pull in recent official company context, public initiatives, and relevant competitive pressure.
3. Use LinkedIn-focused search to identify realistic named buyer personas or exact titles. If exact names are unclear, use exact titles and mark them as public-role hypotheses.
4. Output strict Markdown with headings, subheadings, bullets, and tables where helpful.
5. Keep the output rich, specific, and useful for a seller preparing a real account meeting.
`;

  draft = await executeGeminiRequest(prompt, false, { useSearch: true });

  while (loopCount < MAX_LOOPS && !isApproved) {
    loopCount += 1;
    const criticPrompt = `
You are an ultra-strict ${criticPersona} reviewing this playbook.
${criticGoal}

PLAYBOOK DRAFT:
"""
${draft}
"""

Return only JSON:
{
  "score": 1,
  "feedback": "specific critique",
  "approved": false
}
Set approved to true only for scores 8 or higher.
`;

    let critique: { score?: number; feedback: string; approved: boolean };
    try {
      critique = await executeGeminiRequest(criticPrompt, true);
    } catch {
      critique = { feedback: "Rebuild with stricter company specificity and stronger role targeting.", approved: false, score: 0 };
    }

    if (critique.approved) {
      isApproved = true;
      break;
    }

    if (loopCount < MAX_LOOPS) {
      const correctionPrompt = `
You are the ${authorPersona}. Your previous draft was rejected.
Feedback:
"${critique.feedback}"

Rewrite the entire Markdown document for:
Target Company: ${input.targetCompany}
Target Industry: ${input.industry}
Pain Point: ${input.painPoint}
Google Cloud Offerings: ${input.gcpOfferings.join(", ")}
Cognizant Offerings: ${input.cognizantOfferings.join(", ")}
Account Summary: ${input.accountSummary}
Why Now: ${input.whyNow}

Preserve specificity, named titles, partner fit, and official capability boundaries.
`;
      draft = await executeGeminiRequest(correctionPrompt, false, { useSearch: true });
    }
  }

  return draft;
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
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "executive"), false), 30000, "Exec doc generation"),
      withTimeout(executeGeminiRequest(buildDocumentPrompt(input, "technical"), false), 30000, "Tech doc generation")
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
