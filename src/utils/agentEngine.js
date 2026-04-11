import { executeGeminiRequest } from './gemini';

/**
 * Autonomous Multi-Agent Loop
 * Runs a cyclic process between an Author and a Critic to guarantee quality
 * Mode toggle dictates whether it produces deep Architecture or Executive Strategy.
 */
export async function runAutonomousArchitectLoop(apiKey, data, onLog, isExecutiveMode = false) {
  let draft = "";
  let loopCount = 0;
  const MAX_LOOPS = 3;
  let isApproved = false;

  const authorPersona = isExecutiveMode ? "Enterprise GTM Strategist & Marketing Lead" : "Principal Google Cloud Architect";
  const criticPersona = isExecutiveMode ? "Chief Marketing Officer (CMO)" : "Principal Enterprise Critic";
  
  const authorGoal = isExecutiveMode 
    ? "Create a high-level, persuasive 5-page Executive Sales Playbook. Focus entirely on business objectives, ROI, competitive positioning, and time-to-market. Ban deep technical API specifications. Speak directly to C-Suite buyers."
    : "Create a 5-page enterprise Integration and Implementation Architecture Playbook. Ban marketing fluff. Focus on how the systems connect, major architectural data flows, and integration boundaries. CRITICAL: Do NOT output overly granular 'garbage' details like raw terminal command lines, script blocks, precise IP CIDR ranges, or low-level configurations. Keep it structural.";

  const criticGoal = isExecutiveMode
    ? `Your job is to reject it if it becomes too technical, uses complex engineering jargon, or fails to highlight explicit business ROI and competitive advantages.`
    : `Your job is to reject it if it contains marketing fluff, lacks structural integration specifics, OR if it contains overly granular details like raw terminal command lines, script blocks, or precise IP subnets. Force the author to focus strictly on high-level systems integration architecture.`;

  onLog(`[System] Launching ${authorPersona} Agent...`);
  
  // INITIAL AUTHOR RUN
  let prompt = `
You are a ${authorPersona} at Cognizant.
Target Industry: ${data.industry}
Business Core Challenge: ${data.painPoint}
GCP Capabilities: ${data.gcpOfferings.join(', ')}
Cognizant Frameworks: ${data.cognizantOfferings.join(', ')}

${authorGoal}

CRITICAL RULES:
1. Do NOT hallucinate. All assertions must be purely factual.
2. Do NOT invent fictitious case studies or fake metrics. Base all capabilities strictly on official Google Cloud and Cognizant service boundaries.
3. You MUST use strict Markdown formatting. Every single section and subsection title MUST start with markdown hashes (e.g. "# 1. Executive Summary", "## 1.1 Competitors", "### 1.1.1 Landscape"). 
Do not just use plain text numbers. Use bolding and bulleted lists heavily to make the document highly readable.
`;

  try {
    draft = await executeGeminiRequest(apiKey, prompt, false);
    onLog(`[Author] Draft #1 synthesized. Dispatching to ${criticPersona} for review...`);
  } catch(e) {
    onLog(`[System] Fatal Error connecting to Gemini: ${e.message}`);
    throw e;
  }

  // MULTI-AGENT REVIEW LOOP
  while (loopCount < MAX_LOOPS && !isApproved) {
    loopCount++;
    onLog(`[Critic] Analyzing Playbook Iteration #${loopCount}...`);
    
    let criticPrompt = `
You are an ultra-strict ${criticPersona} reviewing a playbook document.
Read the following playbook drafted by your subordinate.
${criticGoal}

PLAYBOOK DRAFT:
"""
${draft}
"""

Provide your EXACT critique and a score. 
You MUST output strictly in JSON format without markdown ticks:
{
  "score": 5,
  "feedback": "A very harsh critique explaining exactly what is missing and what constraints must be rebuilt.",
  "approved": false
}

Note: "approved" must strictly be true if the score is greater than or equal to 8. False otherwise.
`;

    let criticResponse;
    try {
      criticResponse = await executeGeminiRequest(apiKey, criticPrompt, true);
    } catch(e) {
      onLog("[Critic/System] Critic Agent failed to output valid JSON schema. Injecting forced rebuild constraint.");
      criticResponse = { approved: false, score: 0, feedback: "System forced rebuild: Adhere strictly to the requested persona constraints." };
    }

    if (criticResponse.score !== undefined) {
      onLog(`[Critic] Review Score: ${criticResponse.score}/10. Notes: "${criticResponse.feedback}"`);
    } else {
      onLog(`[Critic] Feedback Array: "${criticResponse.feedback}"`);
    }

    // Checking exit loop conditions
    if (criticResponse.approved === true) {
      onLog("[System] Document Verified and Approved by Critic! Breaking autonomous loop.");
      isApproved = true;
      break;
    }

    // Author Rebuild if rejected
    if (loopCount < MAX_LOOPS) {
      onLog(`[System] Rejection constraints logged. Instructing Author to rebuild document (Attempt ${loopCount + 1}/${MAX_LOOPS})...`);
      let correctionPrompt = `
You are the ${authorPersona}. Your previous comprehensive playbook draft was formally REJECTED by the ${criticPersona}.
You must rewrite the ENTIRE markdown playbook, heavily addressing this EXACT feedback:
"${criticResponse.feedback}"

Here was your initial solution context:
Target Industry: ${data.industry}
Pain Point: ${data.painPoint}
GCP Offerings: ${data.gcpOfferings.join(', ')}
Cognizant Offerings: ${data.cognizantOfferings.join(', ')}

Ensure the new output is fundamentally robust. Provide the fully updated Markdown playbook now. Do not include apologies or conversational filler.

CRITICAL RULES:
1. Do NOT hallucinate. All assertions must be purely factual.
2. Do NOT invent fictitious case studies or fake metrics. Base all capabilities strictly on official Google Cloud and Cognizant service boundaries.
3. You MUST use strict Markdown formatting. Every single section and subsection title MUST start with markdown hashes (e.g. "# 1. Executive Summary", "## 1.1 Themes", "### 1.1.1 Tiers"). 
Do not just use plain text numbers. Use bolding and bulleted lists heavily to make the document highly readable.
`;
      draft = await executeGeminiRequest(apiKey, correctionPrompt, false);
      onLog(`[Author] Iterative rework completed. Resubmitting structure...`);
    } else {
      onLog("[System] Maximum agent loop iterations reached. Forcing visual acceptance of latest draft.");
    }
  }

  onLog("[System] Playbook generation complete. Unlocking UI.");
  return draft;
}
