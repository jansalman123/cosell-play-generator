import type { IncomingMessage, ServerResponse } from "http";
import { createCoSellPlaybook, type CoSellInput } from "../src/lib/playbook";
import { createLiveResearchedPlaybook } from "../src/lib/liveResearch";

type RequestWithBody = IncomingMessage & {
  body?: Partial<CoSellInput>;
};

type ResponseWithHelpers = ServerResponse & {
  status: (code: number) => ResponseWithHelpers;
  json: (body: unknown) => void;
};

function json(res: ServerResponse, body: unknown, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function withHelpers(res: ServerResponse): ResponseWithHelpers {
  const typed = res as ResponseWithHelpers;
  typed.status = (code: number) => {
    res.statusCode = code;
    return typed;
  };
  typed.json = (body: unknown) => json(res, body, res.statusCode || 200);
  return typed;
}

function normalizeBody(body: Partial<CoSellInput> | undefined): CoSellInput | null {
  if (!body || typeof body !== "object") return null;

  const accountName = typeof body.accountName === "string" ? body.accountName.trim() : "";
  const industry = typeof body.industry === "string" ? body.industry : "cross-industry";
  const geography = typeof body.geography === "string" ? body.geography : "North America";
  const buyingMode = body.buyingMode === "land" || body.buyingMode === "expand" || body.buyingMode === "transform" ? body.buyingMode : "transform";
  const goals = Array.isArray(body.goals) ? body.goals.filter((goal): goal is CoSellInput["goals"][number] => typeof goal === "string") : [];
  const knownEnvironment = typeof body.knownEnvironment === "string" ? body.knownEnvironment : "";
  const urgency = typeof body.urgency === "string" ? body.urgency : "";
  const notes = typeof body.notes === "string" ? body.notes : "";

  if (!accountName) return null;

  return {
    accountName,
    industry,
    geography,
    buyingMode,
    goals: goals.length > 0 ? goals : ["agentic-operations", "data-modernization"],
    knownEnvironment,
    urgency,
    notes
  };
}

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  const response = withHelpers(res);

  if (req.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const input = normalizeBody(req.body);
  if (!input) {
    response.status(400).json({ error: "A valid playbook input payload is required." });
    return;
  }

  try {
    const data = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
      ? await createLiveResearchedPlaybook(input)
      : createCoSellPlaybook(input);

    response.status(200).json({ data });
  } catch (error) {
    const fallback = createCoSellPlaybook(input);
    response.status(200).json({
      data: {
        ...fallback,
        research: {
          ...fallback.research,
          note:
            error instanceof Error
              ? `Live research fell back to the deterministic playbook generator. ${error.message}`
              : "Live research fell back to the deterministic playbook generator."
        }
      }
    });
  }
}
