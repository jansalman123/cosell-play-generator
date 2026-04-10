import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateSalesPlay(apiKey, data) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `
Create a compelling, professional joint Go-To-Market (GTM) Sales Play document for Google Cloud Platform (GCP) and Cognizant.
This play is targeting the following industry and business pain point:
- **Target Industry:** ${data.industry}
- **Primary Business Pain Point:** ${data.painPoint}

The solution leverages the following GCP AI Offerings:
${data.gcpOfferings.map(o => `- ${o}`).join('\n')}

The solution integrates with the following Cognizant AI Offerings/Services:
${data.cognizantOfferings.map(o => `- ${o}`).join('\n')}

Provide the result formatted in Markdown. It must include the following sections (use H1, H2, H3 tags appropriately):
1. **Executive Summary**: A brief, high-impact summary of why GCP + Cognizant is the right choice for the target industry and pain point.
2. **Joint Value Proposition (GCP + Cognizant)**: Detail the unique synergy between the chosen GCP technologies and Cognizant's offerings.
3. **Target Audience & Pain Points Resolved**: Detail the exact buyer personas and how their lives are improved by this solution.
4. **Reference Architecture / Playbook Approach**: Describe how the selected GCP and Cognizant products integrate functionally to solve the problem. Speak directly to the selected capabilities.
5. **Success Metrics & Next Steps**: How to measure success and actual tangible next steps for a sales rep to take.

Match a premium, modern, and persuasive tone suitable for an enterprise sales motion. Make it sound highly tailored to the selections.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating sales play:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}
