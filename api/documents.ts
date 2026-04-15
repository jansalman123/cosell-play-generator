import type { IncomingMessage, ServerResponse } from "http";
import { generateDocuments, type DocumentGenerationInput } from "./_lib/documentStudio.ts";

export const maxDuration = 60;

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
