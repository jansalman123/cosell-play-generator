<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy Cognizant GCP Playbook

This project combines the Cognizant prospecting workspace with the joint Google Cloud and Cognizant co-sell playbook generator.

View your app in AI Studio: https://ai.studio/apps/64535f0a-75db-4b8a-a847-b12b9749c035

## Run locally

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`
2. Optional: set `GEMINI_API_KEY` in `.env.local` or in your Vercel project to enable live web research and model-backed playbook generation.
3. Run the app:
   `npm run dev`

Without `GEMINI_API_KEY`, the app still works with deterministic fallback prospecting and playbook generation.
