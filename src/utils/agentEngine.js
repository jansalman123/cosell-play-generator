import { executeGeminiRequest } from './gemini';

/**
 * Autonomous Multi-Agent Loop
 * Runs a cyclic process between an Architect and a Critic to guarantee quality
 * before surfacing the finalized markdown output to the user.
 */
export async function runAutonomousArchitectLoop(apiKey, data, onLog) {
  let draft = "";
  let loopCount = 0;
  const MAX_LOOPS = 3;
  let isApproved = false;

  onLog("[System] Launching Architect Agent...");
  
  // INITIAL ARCHITECT RUN
  let prompt = `
You are a Principal Google Cloud Architect at Cognizant.
Target Industry: ${data.industry}
Business Core Challenge: ${data.painPoint}
GCP Capabilities: ${data.gcpOfferings.join(', ')}
Cognizant Frameworks: ${data.cognizantOfferings.join(', ')}

Create a highly technical 5-page internal architecture playbook.
Ban marketing fluff. Detail specific architectural data flows, CI/CD, and security compliance mechanics integrations between the chosen tech stacks.

CRITICAL FORMATTING INSTRUCTION:
You MUST use strict Markdown formatting. Every single section and subsection title MUST start with markdown hashes (e.g. "# 1. Executive Summary", "## 1.1 Topologies", "### 1.1.1 Network"). 
Do not just use plain text numbers. Use bolding and bulleted lists heavily to make the document highly readable.
`;

  try {
    draft = await executeGeminiRequest(apiKey, prompt, false);
    onLog("[Architect] Draft #1 synthesized. Dispatching to Critic Agent for review...");
  } catch(e) {
    onLog(`[System] Fatal Error connecting to Gemini: ${e.message}`);
    throw e;
  }

  // MULTI-AGENT REVIEW LOOP
  while (loopCount < MAX_LOOPS && !isApproved) {
    loopCount++;
    onLog(`[Critic] Analyzing Playbook Iteration #${loopCount}...`);
    
    let criticPrompt = `
You are an ultra-strict Principal Enterprise Critic reviewing an architectural playbook.
Read the following playbook drafted by your subordinate Architect.
Your job is to reject it if it contains marketing fluff, lacks deep technical specifics (e.g., missing IAM, API Gateway flows, accurate GCP integration topologies), or is too sparse.

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
      criticResponse = { approved: false, score: 0, feedback: "System forced rebuild: Ensure fully expanded technical constraints." };
    }

    if (criticResponse.score !== undefined) {
      onLog(`[Critic] Architectural Score: ${criticResponse.score}/10. Notes: "${criticResponse.feedback}"`);
    } else {
      onLog(`[Critic] Feedback Array: "${criticResponse.feedback}"`);
    }

    // Checking exit loop conditions
    if (criticResponse.approved === true) {
      onLog("[System] Architecture Verified and Approved by Critic! Breaking autonomous loop.");
      isApproved = true;
      break;
    }

    // Architect Rebuild if rejected
    if (loopCount < MAX_LOOPS) {
      onLog(`[System] Rejection constraints logged. Instructing Architect to rebuild architecture (Attempt ${loopCount + 1}/${MAX_LOOPS})...`);
      let correctionPrompt = `
You are the Principal Architect. Your previous comprehensive playbook draft was formally REJECTED by the Enterprise Critic.
You must rewrite the ENTIRE markdown playbook, heavily addressing this EXACT feedback:
"${criticResponse.feedback}"

Here was your initial solution context:
Target Industry: ${data.industry}
Pain Point: ${data.painPoint}
GCP Offerings: ${data.gcpOfferings.join(', ')}
Cognizant Offerings: ${data.cognizantOfferings.join(', ')}

Ensure the new output is fundamentally robust. Provide the fully updated Markdown playbook now. Do not include apologies or conversational filler.

CRITICAL FORMATTING INSTRUCTION:
You MUST use strict Markdown formatting. Every single section and subsection title MUST start with markdown hashes (e.g. "# 1. Executive Summary", "## 1.1 Topologies", "### 1.1.1 Network"). 
Do not just use plain text numbers. Use bolding and bulleted lists heavily to make the document highly readable.
`;
      draft = await executeGeminiRequest(apiKey, correctionPrompt, false);
      onLog(`[Architect] Iterative rework completed. Resubmitting structure...`);
    } else {
      onLog("[System] Maximum agent loop iterations reached. Forcing visual acceptance of latest architectural draft.");
    }
  }

  onLog("[System] Playbook generation complete. Unlocking UI.");
  return draft;
}
