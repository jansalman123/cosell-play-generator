import type { DocumentGenerationInput, GeneratedDocuments, SlideSummary, DocumentMode } from "../lib/documentStudio";

export async function generateDocuments(input: DocumentGenerationInput): Promise<GeneratedDocuments> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (err) {
    throw new Error(`Endpoint returned non-JSON (Status ${response.status}). Vercel Response: ${raw.slice(0, 150)}`);
  }

  if (!response.ok) {
    throw new Error(payload.error || `Unable to generate documents. Endpoint returned ${response.status}.`);
  }

  return payload.data as GeneratedDocuments;
}

export async function summarizeDocument(markdown: string, mode: DocumentMode): Promise<SlideSummary> {
  const response = await fetch("/api/slides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ markdown, mode })
  });

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (err) {
    throw new Error(`Endpoint returned non-JSON (Status ${response.status}). Vercel Response: ${raw.slice(0, 150)}`);
  }

  if (!response.ok) {
    throw new Error(payload.error || `Unable to summarize document. Endpoint returned ${response.status}.`);
  }

  return payload.data as SlideSummary;
}
