export type OfferingProvider = "Cognizant" | "Google Cloud" | "Google Cloud + Cognizant";

export type OfferingCatalogEntry = {
  name: string;
  provider: OfferingProvider;
  deepDiveUrl: string;
  deepDiveLabel: string;
  officialSummary: string;
  menuPriority: number;
};

export const OFFERING_CATALOG: OfferingCatalogEntry[] = [
  {
    name: "Cognizant Neuro AI Enterprise Core",
    provider: "Cognizant",
    deepDiveUrl: "https://www.cognizant.com/us/en/services/cognizant-platforms/neuro-ai-enterprise-core",
    deepDiveLabel: "Neuro AI Enterprise Core",
    officialSummary:
      "Cognizant positions Neuro AI Enterprise Core as an enterprise AI operating layer with service catalogs, process agent studio, and multi-agent orchestration.",
    menuPriority: 1
  },
  {
    name: "Cognizant Neuro AI Multi-Agent Accelerator",
    provider: "Cognizant",
    deepDiveUrl:
      "https://news.cognizant.com/2025-01-16-Cognizant-Leads-Enterprises-into-Next-Generation-of-AI-Adoption-with-Neuro-R-AI-Multi-Agent-Accelerator-and-Multi-Agent-Services-Suite",
    deepDiveLabel: "Neuro AI Multi-Agent Accelerator",
    officialSummary:
      "Cognizant describes this as a no-code framework with pre-built agent networks for rapid prototyping, interoperability, and scalable multi-agent deployment.",
    menuPriority: 2
  },
  {
    name: "Cognizant Flowsource",
    provider: "Cognizant",
    deepDiveUrl:
      "https://www.cognizant.com/assets/en_us/field-marketing/documents/CMP-005644/Elevate%20developer%20experience%20-%20Solution%20Overview.pdf",
    deepDiveLabel: "Flowsource overview",
    officialSummary:
      "Cognizant presents Flowsource as a unified developer experience platform with AI for research, design, code, QA, provisioning, and engineering productivity.",
    menuPriority: 3
  },
  {
    name: "Vertex AI",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/vertex-ai",
    deepDiveLabel: "Vertex AI",
    officialSummary:
      "Google Cloud positions Vertex AI as a fully managed platform for generative AI, model development, tuning, deployment, and access to Gemini plus third-party models.",
    menuPriority: 4
  },
  {
    name: "Gemini for Google Cloud",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/blog/products/ai-machine-learning/gemini-for-google-cloud-is-here",
    deepDiveLabel: "Gemini for Google Cloud",
    officialSummary:
      "Google describes Gemini for Google Cloud as enterprise-ready AI assistants for developers, cloud operations, data workflows, and application lifecycle tasks.",
    menuPriority: 5
  },
  {
    name: "Customer Engagement Suite",
    provider: "Google Cloud",
    deepDiveUrl: "https://docs.cloud.google.com/contact-center/ccai-platform/docs",
    deepDiveLabel: "Gemini Enterprise for CX",
    officialSummary:
      "Google Cloud documents Customer Engagement Suite capabilities through Gemini Enterprise for CX and CCAI Platform for routing, virtual agents, agent assist, and insights.",
    menuPriority: 6
  },
  {
    name: "BigQuery",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/bigquery",
    deepDiveLabel: "BigQuery",
    officialSummary:
      "Google positions BigQuery as a unified data-to-AI platform with serverless warehousing, multimodal analytics, and native Vertex AI integration.",
    menuPriority: 7
  },
  {
    name: "Document AI",
    provider: "Google Cloud",
    deepDiveUrl: "https://cloud.google.com/document-ai",
    deepDiveLabel: "Document AI",
    officialSummary:
      "Google positions Document AI as a document understanding platform for extraction, classification, OCR, and downstream automation with BigQuery and other Google Cloud services.",
    menuPriority: 8
  }
];

export const MAIN_MENU_OFFERINGS = OFFERING_CATALOG.slice()
  .sort((a, b) => a.menuPriority - b.menuPriority)
  .slice(0, 6);

export function findOfferingCatalogEntry(name: string): OfferingCatalogEntry | undefined {
  const normalized = name.trim().toLowerCase();
  return OFFERING_CATALOG.find((entry) => {
    const entryName = entry.name.toLowerCase();
    if (entryName === normalized) return true;
    if (entryName.includes(normalized) || normalized.includes(entryName)) return true;

    if (normalized.includes("neuro ai") && entryName.includes("neuro ai")) return true;
    if (normalized.includes("multi-agent") && entryName.includes("multi-agent")) return true;
    if (normalized.includes("flowsource") && entryName.includes("flowsource")) return true;
    if (normalized.includes("vertex")) return entryName === "vertex ai";
    if (normalized.includes("gemini") && normalized.includes("cloud")) return entryName === "gemini for google cloud";
    if (normalized.includes("customer engagement") || normalized.includes("customer experience") || normalized.includes("ccai")) {
      return entryName === "customer engagement suite";
    }
    return false;
  });
}
