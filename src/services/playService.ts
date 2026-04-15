import { createCoSellPlaybook, type CoSellInput, type CoSellPlaybook } from "../lib/playbook";

export type { CoSellInput, CoSellPlaybook } from "../lib/playbook";

export async function generatePlaybook(input: CoSellInput): Promise<CoSellPlaybook> {
  try {
    const response = await fetch("/api/playbook", {
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
    } catch {
      throw new Error(`Playbook API returned non-JSON (status ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(payload.error || "Unable to generate co-sell playbook.");
    }

    return payload.data as CoSellPlaybook;
  } catch (error) {
    const fallback = createCoSellPlaybook(input);
    return {
      ...fallback,
      research: {
        ...fallback.research,
        note:
          error instanceof Error
            ? `Live playbook generation fell back to the deterministic client generator. ${error.message}`
            : "Live playbook generation fell back to the deterministic client generator."
      }
    };
  }
}
