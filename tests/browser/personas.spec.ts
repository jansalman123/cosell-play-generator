import { expect, test } from "@playwright/test";

test("personas tab offers LinkedIn verification instead of a dead-end empty state", async ({ page }) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          companyName: "Verizon",
          executiveSummary: {
            headline: "Verizon shows credible public AI and cloud modernization signals.",
            whyNow: "AI and customer operations modernization are active priorities.",
            industryHypothesis: "Telecom"
          },
          itSpendIntelligence: {
            estimatedRange: "$76M-$136M",
            yoyMomentum: "+6%",
            budgetPriority: "Platform simplification and customer-facing AI monetization",
            signals: ["AI modernization", "Customer operations", "Data platform"]
          },
          strategicAiInitiatives: {
            summary: "Verizon is pursuing AI-enabled service and operations modernization.",
            programs: ["AI customer experience", "Network operations intelligence", "Data platform modernization"],
            evidence: ["Public AI strategy signal"]
          },
          technographics: {
            cloudFootprint: ["Google Cloud adjacency"],
            dataEstate: ["Enterprise analytics estate"],
            contactCenterSignals: ["Customer operations"],
            modernizationSignals: ["Platform simplification"]
          },
          publicSignals: [
            {
              category: "ai",
              label: "AI modernization",
              detail: "Public signals indicate AI-enabled transformation priorities.",
              strength: "high"
            }
          ],
          personas: [],
          productMatches: [],
          competitors: [
            {
              name: "AT&T",
              benchmarkSummary: "Named telecom peer.",
              pressurePoint: "AI positioning pressure.",
              cognizantAngle: "Use benchmark to create urgency."
            }
          ],
          accountPlan: {
            whyCognizantNow: "Execution risk and operating-model design matter.",
            discoveryQuestions: ["Who owns AI governance?"],
            nextActions: ["Validate named buyer map"],
            whitespaceHypotheses: ["Customer operations AI"]
          },
          blueprint: {
            appName: "Verizon AI Playbook",
            purpose: "Prospecting",
            targetProducts: ["Vertex AI"],
            dataSources: ["Public web"],
            keyFunctions: ["Research"],
            bigQueryTables: [],
            orchestration: []
          },
          propensityScore: 82,
          researchMetadata: {
            mode: "live",
            generatedAt: new Date().toISOString(),
            note: "Live research completed with no verified named personas.",
            sources: []
          }
        }
      })
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("Snowflake, Humana, ServiceNow...").fill("Verizon");
  await page.getByRole("button", { name: /build account prospect/i }).click();
  await page.getByRole("button", { name: /personas/i }).click();

  await expect(page.getByText("LinkedIn verification queue")).toBeVisible();
  await expect(page.getByRole("link", { name: /open linkedin search/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /public web check/i }).first()).toBeVisible();
  await expect(page.getByText(/Named public decision-makers could not be verified/i)).toHaveCount(0);
});
