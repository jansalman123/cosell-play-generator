/**
 * Generates an extremely detailed and comprehensive GTM Playbook in Markdown format.
 */
export async function generateComprehensivePlaybook(apiKey, data) {
  const prompt = `
You are a Principal Google Cloud Architect and a Senior AI Engineering Lead at Cognizant.
Create an exhaustive, highly technical, and architecturally rigorous Go-To-Market (GTM) Playbook document combining Google Cloud Platform (GCP) and Cognizant's engineering capabilities.

This playbook addresses the following technical and business context:
- **Target Industry:** ${data.industry}
- **Primary Core Challenge:** ${data.painPoint}

The architecture natively integrates the following GCP Offerings:
${data.gcpOfferings.map(o => `- ${o}`).join('\n')}

The solution utilizes the following Cognizant Delivery IP/Offerings:
${data.cognizantOfferings.map(o => `- ${o}`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Provide a massive, deeply detailed long-form engineering playbook. 
2. Use professional Markdown formatting (Headers, Lists, Tables, Bold/Italics).
3. Do NOT constraint yourself to concise slide summaries yet. Write this as a comprehensive internal 5-page consulting strategy manifesto.
4. Detail specific architectural data flows, CI/CD pipeline topologies, security compliance standards (e.g. VPC Service Controls), enterprise MLOps lifecycles, and exact GCP service integration mechanics with Cognizant IP.
5. Ban marketing fluff and buzzwords. The audience consists of CTOs, Enterprise Architects, and VP-level engineering leadership.
`;

  return executeGeminiRequest(apiKey, prompt, false);
}

/**
 * Summarizes a previously generated Markdown playbook into a strict JSON schema for presentation slides.
 */
export async function extractSlidesFromPlaybook(apiKey, markdownText) {
  const prompt = `
You are a top-tier executive presentation designer. I have just written a comprehensive engineering playbook below.
Your job is to read this playbook and summarize the core strategic value and technical architecture into exactly 6 impactful presentation slides.

PLAYBOOK TEXT:
"""
${markdownText}
"""

Provide the result STRICTLY as a valid JSON object matching exactly this schema, with no markdown formatting or backticks:
{
  "slides": [
    {
      "title": "Professional Architecture Header",
      "subtitle": "Technical Component Subtitle",
      "bulletPoints": [
        "A deep, rigorous bullet point detailing an engineering standard or workflow.",
        "Another highly detailed engineering point."
      ]
    }
  ]
}

Ensure the presentation includes 6 slides summarizing the play:
1. Executive Summary
2. Target State Architecture 
3. Google Cloud Blueprint 
4. Cognizant Engineering & Delivery 
5. Enterprise Security & Governance 
6. Deployment Roadmap & Technical KPIs
`;

  return executeGeminiRequest(apiKey, prompt, true);
}

/**
 * Shared logic to hit the Gemini endpoint.
 */
async function executeGeminiRequest(apiKey, promptText, expectJson) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const resultData = await response.json();

    if (!response.ok) {
      throw new Error(resultData.error?.message || "Unknown Google API error");
    }

    let textOut = resultData.candidates[0].content.parts[0].text;
    
    if (expectJson) {
      textOut = textOut.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(textOut);
    }

    return textOut;
  } catch (error) {
    throw new Error("Generation failed securely: " + error.message);
  }
}

