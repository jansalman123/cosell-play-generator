import type { IncomingMessage, ServerResponse } from "http";

type ResponseWithHelpers = ServerResponse & {
  status: (code: number) => ResponseWithHelpers;
  json: (body: unknown) => void;
};

export default function handler(_req: IncomingMessage, res: ResponseWithHelpers) {
  res.status(200).json({
    status: "ok",
    liveResearchEnabled: Boolean(process.env.GEMINI_API_KEY)
  });
}
