import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import net from "net";
import dotenv from "dotenv";
import { createCoSellPlaybook } from "./src/lib/playbook.ts";
import { createLiveResearchedPlaybook } from "./src/lib/liveResearch.ts";
import analyzeHandler from "./api/analyze.ts";
import documentsHandler from "./api/documents.ts";
import slidesHandler from "./api/slides.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function findOpenPort(startPort: number, host = "0.0.0.0"): Promise<number> {
  let port = startPort;

  while (port < startPort + 25) {
    const available = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();

      tester.once("error", () => resolve(false));
      tester.once("listening", () => {
        tester.close(() => resolve(true));
      });

      tester.listen(port, host);
    });

    if (available) return port;
    port += 1;
  }

  throw new Error(`Unable to find an open port starting from ${startPort}.`);
}

async function startServer() {
  const app = express();
  const requestedPort = Number(process.env.PORT || 3000);
  const host = "0.0.0.0";

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      liveResearchEnabled: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
      note: (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
        ? "Local dev is using Gemini-backed live prospecting and playbook research."
        : "Local dev is missing GEMINI_API_KEY, so prospecting and playbook generation will fall back to demo behavior."
    });
  });

  app.post("/api/analyze", async (req, res) => {
    await analyzeHandler(req as any, res as any);
  });

  app.post("/api/documents", async (req, res) => {
    await documentsHandler(req as any, res as any);
  });

  app.post("/api/slides", async (req, res) => {
    await slidesHandler(req as any, res as any);
  });

  app.post("/api/playbook", async (req, res) => {
    const accountName = String(req.body?.accountName || "").trim();

    if (!accountName) {
      res.status(400).json({ error: "Account name is required." });
      return;
    }

    const fallbackInput = {
      accountName,
      industry: req.body?.industry || "cross-industry",
      geography: req.body?.geography || "North America",
      buyingMode: req.body?.buyingMode || "transform",
      goals: Array.isArray(req.body?.goals) && req.body.goals.length ? req.body.goals : ["agentic-operations", "data-modernization"],
      knownEnvironment: req.body?.knownEnvironment || "",
      urgency: req.body?.urgency || "",
      notes: req.body?.notes || ""
    } as const;

    try {
      const data = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
        ? await createLiveResearchedPlaybook(fallbackInput)
        : createCoSellPlaybook(fallbackInput);

      res.json({ data });
    } catch (error) {
      const data = createCoSellPlaybook(fallbackInput);
      res.json({
        data: {
          ...data,
          research: {
            ...data.research,
            note:
              error instanceof Error
                ? `Local dev fell back to the deterministic playbook generator. ${error.message}`
                : "Local dev fell back to the deterministic playbook generator."
          }
        }
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.HMR_PORT
          ? {
              port: Number(process.env.HMR_PORT),
              clientPort: Number(process.env.HMR_PORT)
            }
          : undefined
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = await findOpenPort(requestedPort, host);
  if (port !== requestedPort) {
    console.log(`Port ${requestedPort} was busy, using http://localhost:${port} instead.`);
  }

  app.listen(port, host, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
