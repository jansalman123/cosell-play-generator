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
