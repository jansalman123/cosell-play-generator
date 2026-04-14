import type { IncomingMessage, ServerResponse } from "http";
import { summarizeDocumentToSlides, type DocumentMode } from "../src/lib/documentStudio";

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
