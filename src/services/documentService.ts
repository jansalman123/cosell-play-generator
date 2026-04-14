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
  const payload = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    throw new Error((payload as any).error || `Unable to generate documents. Endpoint returned ${response.status}.`);
  }

  return (payload as any).data as GeneratedDocuments;
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
  const payload = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    throw new Error((payload as any).error || `Unable to summarize document. Endpoint returned ${response.status}.`);
  }

  return (payload as any).data as SlideSummary;
}
