import type { IncomingMessage, ServerResponse } from "http";

type DocumentMode = "executive" | "technical";

type RequestWithBody = IncomingMessage & {
  body?: {
    markdown?: string;
    mode?: DocumentMode;
  };
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

async function executeGeminiRequest(promptText: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  const resultData = await response.json();
  if (!response.ok) {
    throw new Error(resultData.error?.message || "Unknown Gemini API error.");
  }

  const textOut =
    resultData?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";

  const jsonPayload = extractJsonPayload(textOut);
  if (!jsonPayload) {
    throw new Error("Gemini did not return a complete JSON payload.");
  }

  return JSON.parse(jsonPayload);
}

async function summarizeDocumentToSlides(markdownText: string, mode: DocumentMode) {
  if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
    return {
      slides: markdownText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .reduce<Array<{ title: string; subtitle?: string; bulletPoints: string[] }>>((slides, line) => {
          if (line.startsWith("## ")) {
            slides.push({
              title: line.replace(/^##\s+/, ""),
              subtitle: mode === "executive" ? "Fallback summary" : "Fallback architecture summary",
              bulletPoints: []
            });
            return slides;
          }
          if (!slides.length) {
            slides.push({
              title: mode === "executive" ? "Executive Summary" : "Architecture Summary",
              subtitle: "Fallback summary",
              bulletPoints: []
            });
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            slides[slides.length - 1].bulletPoints.push(line.replace(/^[-*]\s+/, ""));
          } else if (!line.startsWith("#")) {
            slides[slides.length - 1].bulletPoints.push(line);
          }
          return slides;
        }, [])
        .filter((slide) => slide.bulletPoints.length)
        .slice(0, 8)
    };
  }

  const persona = mode === "executive" ? "top-tier executive presentation designer" : "lead technical presentation designer";
  const structuralSlides =
    mode === "executive"
      ? "1. Executive Summary\n2. Account Context and Why Now\n3. Business Value and ROI\n4. Joint Google Cloud and Cognizant Solution Position\n5. Priority Sales Plays\n6. Buyer and Stakeholder Angles\n7. Timeline and Next Steps\n8. Source-backed Closing Summary"
      : "1. Architecture Summary\n2. Current State and Problem Frame\n3. Target State Integration\n4. Google Cloud Platform Blueprint\n5. Cognizant Delivery and Operating Model\n6. Security, Governance, and Data Controls\n7. Phased Implementation Roadmap\n8. Architecture Risks, Dependencies, and KPIs";

  const prompt = `
You are a ${persona}. Read the playbook below and summarize it into exactly 8 slides.
Preserve the target company, named personas or specific titles, products, quantified claims, proof points, dependencies, and next steps whenever they appear.
Do not collapse multiple important sections into one vague bullet.
Each slide must contain 4 to 6 detailed bullet points.
Each bullet should preserve concrete content from the source text, not generic paraphrase.
If the playbook contains source references, timelines, risks, buyer names, or product/service pairings, keep them.

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

  return executeGeminiRequest(prompt);
}

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  const response = withHelpers(res);

  if (req.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const markdown = typeof req.body?.markdown === "string" ? req.body.markdown.trim() : "";
  const mode = req.body?.mode === "technical" ? "technical" : "executive";

  if (!markdown) {
    response.status(400).json({ error: "Markdown content is required." });
    return;
  }

  const data = await summarizeDocumentToSlides(markdown, mode);
  response.status(200).json({ data });
}
