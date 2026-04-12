/**
 * Summarizes a previously generated Markdown playbook into a strict JSON schema for presentation slides.
 * This represents the "Executive Designer Agent Persona".
 */
export async function extractSlidesFromPlaybook(apiKey, markdownText, mode = 'executive') {
  const persona = mode === 'executive' ? 'top-tier executive presentation designer' : 'lead technical presentation designer';
  const structuralSlides = mode === 'executive'
    ? `1. Executive Summary\n2. Business Value & ROI\n3. Target Operating Model\n4. Core Differentiation\n5. Cognizant Strategic Value\n6. High-Level Timeline`
    : `1. Architecture Summary\n2. Target State Integration\n3. Google Cloud Blueprint\n4. Cognizant Delivery IP\n5. Security & Governance\n6. Technical Roadmap KPIs`;

  const prompt = `
You are a ${persona}. I have just written a comprehensive playbook below.
Your job is to read this playbook and summarize its core data into exactly 6 impactful presentation slides.

CRITICAL: Do NOT generalize the company name or the identified personas. If the playbook mentions specific target companies or named roles (e.g., 'Targeting the VP of Supply Chain at Home Depot'), you MUST retain that specific company context and naming in your slide bullets.

PLAYBOOK TEXT:
"""
${markdownText}
"""

Provide the result STRICTLY as a valid JSON object matching exactly this schema, with no markdown formatting or backticks:
{
  "slides": [
    {
      "title": "Professional Header",
      "subtitle": "Component Subtitle",
      "bulletPoints": [
        "A rigorous bullet point detailing a strategic or technical standard.",
        "Another highly detailed point."
      ]
    }
  ]
}

Ensure the presentation strictly follows these 6 slide themes based on the context:
${structuralSlides}
`;

  return executeGeminiRequest(apiKey, prompt, true);
}

/**
 * Shared logic to hit the Gemini endpoint.
 * Exported so other autonomous modules and loops can stream prompts to the LLM.
 */
export async function executeGeminiRequest(apiKey, promptText, expectJson) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        tools: [{ google_search: {} }]
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

