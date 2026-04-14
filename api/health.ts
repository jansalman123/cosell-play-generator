import type { IncomingMessage, ServerResponse } from "http";

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

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  const response = withHelpers(res);
  response.status(200).json({
    status: "ok",
    liveResearchEnabled: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
  });
}
