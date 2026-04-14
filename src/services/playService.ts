import type { CoSellInput, CoSellPlaybook } from "../lib/playbook";

export type { CoSellInput, CoSellPlaybook } from "../lib/playbook";

export async function generatePlaybook(input: CoSellInput): Promise<CoSellPlaybook> {
  const response = await fetch("/api/playbook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to generate co-sell playbook.");
  }

  return payload.data as CoSellPlaybook;
}
