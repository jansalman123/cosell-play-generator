export type IndustryKey =
  | "financial-services"
  | "healthcare"
  | "retail"
  | "manufacturing"
  | "communications"
  | "cross-industry";

export type BuyingMode = "land" | "expand" | "transform";

export type InputGoals =
  | "customer-service"
  | "developer-productivity"
  | "document-automation"
  | "data-modernization"
  | "agentic-operations";

export interface CoSellInput {
  accountName: string;
  industry: IndustryKey;
  geography: string;
  buyingMode: BuyingMode;
  goals: InputGoals[];
  knownEnvironment: string;
  urgency: string;
  notes: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  publisher: string;
  note: string;
}

export interface PortfolioOffer {
  name: string;
  provider: "Google Cloud" | "Cognizant";
  category: string;
  summary: string;
  whyItFits: string;
}

export interface SalesPlay {
  title: string;
  motion: string;
  buyer: string;
  pain: string;
  valueHypothesis: string;
  googleCloudOffer: string;
  cognizantOffer: string;
  jointPitch: string;
  proofPoints: string[];
  discoveryQuestions: string[];
  firstMeetingAgenda: string[];
  nextStep: string;
}

export interface CoSellPlaybook {
  generatedAt: string;
  input: CoSellInput;
  research: {
    mode: "live" | "demo";
    model: string;
    note: string;
    sources: ResearchSource[];
  };
  summary: {
    headline: string;
    opportunity: string;
    whyNow: string;
    partnerThesis: string;
  };
  accountSignals: string[];
  portfolioMap: PortfolioOffer[];
  plays: SalesPlay[];
  messaging: {
    executiveTalkTrack: string;
    technicalTalkTrack: string;
    emailOpening: string;
  };
  actionPlan: {
    first30Days: string[];
    partnerActions: string[];
    assetsToBring: string[];
  };
}

type GoalBlueprint = {
  label: string;
  buyer: string;
  pain: string;
  gcOffer: string;
  cognizantOffer: string;
  category: string;
  pitch: string;
  proofPoints: string[];
  discoveryQuestions: string[];
  agenda: string[];
  valueLine: string;
};

const INDUSTRY_PROFILES: Record<
  IndustryKey,
  {
    label: string;
    opportunity: string;
    whyNow: string;
    signals: string[];
    executiveBias: string;
  }
> = {
  "financial-services": {
    label: "Financial Services",
    opportunity: "Governed AI modernization across service, risk, and document-heavy operations.",
    whyNow: "AI budget is being scrutinized, so co-sell plays need fast ROI and clear controls.",
    signals: [
      "Enterprise buyers tend to demand governance, model traceability, and measurable operations lift.",
      "Document-heavy workflows create openings for Document AI, BigQuery, and managed transformation services.",
      "Executive sponsors often prefer phased launches over broad platform overhauls."
    ],
    executiveBias: "risk reduction and measurable productivity"
  },
  healthcare: {
    label: "Healthcare",
    opportunity: "Administrative simplification and clinician-support workflows without compromising trust.",
    whyNow: "Healthcare AI programs move when the motion is tied to burden reduction, member experience, and compliant execution.",
    signals: [
      "Priorities usually include claims, prior auth, patient support, and knowledge retrieval.",
      "Security, governance, and human review are non-negotiable in production conversations.",
      "Data fragmentation makes BigQuery-led modernization a natural wedge."
    ],
    executiveBias: "compliance-safe automation and experience improvement"
  },
  retail: {
    label: "Retail",
    opportunity: "Service intelligence, merchandising insight, and frontline productivity at scale.",
    whyNow: "Retail leaders fund AI when it improves service levels, conversion, and operating margin in the same motion.",
    signals: [
      "Customer support and document workflows often share the same data-quality bottlenecks.",
      "Teams want faster experimentation but still need a production operating model.",
      "Joint value is strongest when analytics and CX are positioned together."
    ],
    executiveBias: "margin, speed, and customer experience"
  },
  manufacturing: {
    label: "Manufacturing",
    opportunity: "AI-enabled service, quality knowledge, and plant-to-office workflow automation.",
    whyNow: "Manufacturers respond to co-sell motions that connect operational resilience to practical AI deployment.",
    signals: [
      "Knowledge is spread across manuals, tickets, and engineering systems.",
      "Leaders want modernization without prolonged platform disruption.",
      "Field operations and shared services often surface the first scalable wins."
    ],
    executiveBias: "throughput, workforce efficiency, and resilience"
  },
  communications: {
    label: "Communications",
    opportunity: "AI-assisted service operations and data-to-action modernization for large support environments.",
    whyNow: "Large service teams and network operations create immediate demand for copilots, routing intelligence, and better knowledge access.",
    signals: [
      "Support leaders often own the clearest first-wave AI use cases.",
      "Platform teams care about operating consistency across analytics, models, and governance.",
      "Co-sell traction rises when the pitch connects customer care and back-office simplification."
    ],
    executiveBias: "service quality and operating leverage"
  },
  "cross-industry": {
    label: "Cross-Industry",
    opportunity: "Enterprise AI scaling with a clear handoff from platform capability to business value.",
    whyNow: "Most enterprise buyers are past experimentation and want help operationalizing repeatable AI wins.",
    signals: [
      "Teams want fewer disconnected pilots and more governed production patterns.",
      "A co-sell motion works best when Google Cloud owns platform credibility and Cognizant owns execution confidence.",
      "Discovery should expose which business workflow deserves the first funded play."
    ],
    executiveBias: "time to value and execution certainty"
  }
};

const GOAL_BLUEPRINTS: Record<InputGoals, GoalBlueprint> = {
  "customer-service": {
    label: "Customer Service Reinvention",
    buyer: "SVP Customer Operations / Contact Center Leader",
    pain: "High handle times, fragmented knowledge, and inconsistent case resolution.",
    gcOffer: "Customer Engagement Suite with Gemini",
    cognizantOffer: "Cognizant service transformation and Neuro AI orchestration",
    category: "Experience Operations",
    pitch: "Use Google Cloud to modernize the service stack and Cognizant to redesign workflows, rollout guardrails, and adoption.",
    proofPoints: [
      "Faster agent assist and summarization use cases",
      "Containment and average-handle-time improvement narrative",
      "Human-in-the-loop rollout with managed change support"
    ],
    discoveryQuestions: [
      "Where do agents lose time switching across knowledge, workflow, and case history?",
      "Which service KPIs already have executive visibility and budget attention?",
      "What would make a pilot credible enough to scale beyond one queue?"
    ],
    agenda: [
      "Confirm service metrics and failure points",
      "Map target journeys for assist, automation, and insights",
      "Align on pilot success criteria and operating owners"
    ],
    valueLine: "Reduce service friction while giving the buyer a measured path from pilot to scaled operations."
  },
  "developer-productivity": {
    label: "Developer Productivity Lift",
    buyer: "CIO / VP Engineering / Platform Leader",
    pain: "Delivery teams are under pressure to move faster without adding tool sprawl or governance risk.",
    gcOffer: "Gemini for Google Cloud",
    cognizantOffer: "Cognizant Flowsource",
    category: "Engineering Productivity",
    pitch: "Pair Gemini’s assistant layer with Flowsource to improve research, build, QA, and operating consistency across delivery teams.",
    proofPoints: [
      "Developer workflow acceleration tied to existing platform standards",
      "A governed path for AI-assisted engineering work",
      "Clear narrative for adoption, enablement, and measurement"
    ],
    discoveryQuestions: [
      "Where is engineering cycle time being lost today?",
      "How are development teams managing AI tooling across SDLC stages?",
      "What would the platform team need to see to bless an enterprise rollout?"
    ],
    agenda: [
      "Baseline developer productivity pain points",
      "Show joint workflow from ideation through QA",
      "Agree on team scope, metrics, and governance checkpoints"
    ],
    valueLine: "Improve developer throughput without creating another disconnected point solution."
  },
  "document-automation": {
    label: "Document Intelligence Motion",
    buyer: "Operations Executive / Shared Services Leader",
    pain: "Manual intake, review, and handoff across high-volume documents slows the business and drives errors.",
    gcOffer: "Document AI",
    cognizantOffer: "Cognizant AI-led process redesign services",
    category: "Intelligent Operations",
    pitch: "Lead with Google Cloud document understanding and bring Cognizant in to redesign the downstream process, controls, and adoption path.",
    proofPoints: [
      "Reduced manual extraction and rekeying effort",
      "Improved turnaround and exception handling",
      "A stronger business case because the workflow changes, not just the OCR layer"
    ],
    discoveryQuestions: [
      "Which document flows create the biggest backlog or compliance burden?",
      "Where do exceptions currently break the process?",
      "How quickly could one document family be piloted with measurable savings?"
    ],
    agenda: [
      "Prioritize document families by value and complexity",
      "Review exception paths and human review checkpoints",
      "Define a 90-day pilot scope"
    ],
    valueLine: "Turn document-heavy work into a faster, more reliable process rather than a one-off automation experiment."
  },
  "data-modernization": {
    label: "Data-to-AI Foundation Play",
    buyer: "Chief Data Officer / VP Data & AI",
    pain: "Fragmented analytics and weak data operating models slow AI rollout across business functions.",
    gcOffer: "BigQuery and Vertex AI",
    cognizantOffer: "Cognizant modernization and managed data services",
    category: "Data and AI Platform",
    pitch: "Use BigQuery and Vertex AI as the target platform, with Cognizant accelerating migration, governance, and rollout sequencing.",
    proofPoints: [
      "A unified data-to-AI narrative instead of siloed pilots",
      "Governed platform buildout with delivery capacity behind it",
      "Faster path from data consolidation to reusable AI use cases"
    ],
    discoveryQuestions: [
      "What data dependencies are blocking AI production use cases?",
      "Which business teams are pushing hardest for better access or model deployment?",
      "How mature is the current governance model for data and genAI?"
    ],
    agenda: [
      "Assess platform sprawl and critical data blockers",
      "Map first reusable AI workloads",
      "Define transformation phases and partner roles"
    ],
    valueLine: "Make the platform conversation business-led by tying modernization directly to funded AI outcomes."
  },
  "agentic-operations": {
    label: "Agentic Operations Launch",
    buyer: "COO / Head of Transformation / AI Program Leader",
    pain: "The company wants multi-agent value but lacks a production operating pattern and cross-functional orchestration model.",
    gcOffer: "Vertex AI",
    cognizantOffer: "Cognizant Neuro AI Enterprise Core and Multi-Agent Accelerator",
    category: "Agentic Enterprise",
    pitch: "Present Google Cloud as the AI platform and Cognizant as the orchestration layer that makes multi-agent operations safe and executable.",
    proofPoints: [
      "Clear bridge from experimentation to operating model",
      "Stronger executive story for AI beyond single-point copilots",
      "Joint credibility across platform, services, and execution"
    ],
    discoveryQuestions: [
      "Which workflow is complex enough to benefit from multi-agent coordination?",
      "What governance, observability, or human-review concerns exist today?",
      "Who would own an operating model after the first launch?"
    ],
    agenda: [
      "Identify the right first orchestration use case",
      "Review policy, escalation, and observability expectations",
      "Align on an accelerator-led pilot plan"
    ],
    valueLine: "Help the customer move from AI interest to a credible operating model for coordinated agents."
  }
};

function toTitleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function buildPortfolioMap(goals: InputGoals[]): PortfolioOffer[] {
  const seen = new Set<string>();
  const entries: PortfolioOffer[] = [];

  for (const goal of goals) {
    const blueprint = GOAL_BLUEPRINTS[goal];
    const pair: PortfolioOffer[] = [
      {
        name: blueprint.gcOffer,
        provider: "Google Cloud",
        category: blueprint.category,
        summary: blueprint.pitch,
        whyItFits: blueprint.valueLine
      },
      {
        name: blueprint.cognizantOffer,
        provider: "Cognizant",
        category: blueprint.category,
        summary: blueprint.pitch,
        whyItFits: `Cognizant strengthens the motion by owning workflow redesign, rollout structure, and business adoption around ${blueprint.gcOffer}.`
      }
    ];

    for (const entry of pair) {
      const key = `${entry.provider}:${entry.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
  }

  return entries;
}

function buildSalesPlay(input: CoSellInput, goal: InputGoals, index: number): SalesPlay {
  const industry = INDUSTRY_PROFILES[input.industry];
  const blueprint = GOAL_BLUEPRINTS[goal];
  const motionLabel = input.buyingMode === "land" ? "new-logo landing motion" : input.buyingMode === "expand" ? "installed-base expansion" : "transformation-led executive motion";
  const notesSuffix = input.notes.trim() ? ` Tailor discovery around: ${input.notes.trim()}` : "";

  return {
    title: `${index + 1}. ${blueprint.label}`,
    motion: `${motionLabel} for ${industry.label.toLowerCase()} buyers in ${input.geography}.`,
    buyer: blueprint.buyer,
    pain: blueprint.pain,
    valueHypothesis: `${blueprint.valueLine} The account urgency is currently framed as ${input.urgency}.${notesSuffix}`,
    googleCloudOffer: blueprint.gcOffer,
    cognizantOffer: blueprint.cognizantOffer,
    jointPitch: `${blueprint.pitch} Position Google Cloud as the platform backbone and Cognizant as the delivery partner that gets the use case operational quickly.`,
    proofPoints: blueprint.proofPoints,
    discoveryQuestions: blueprint.discoveryQuestions,
    firstMeetingAgenda: blueprint.agenda,
    nextStep: `Leave the first meeting with agreement on one ${blueprint.category.toLowerCase()} pilot, named executive sponsor, and a joint follow-up workshop led by Google Cloud and Cognizant.`
  };
}

export function createCoSellPlaybook(input: CoSellInput): CoSellPlaybook {
  const sanitizedGoals: InputGoals[] = input.goals.length > 0 ? input.goals : ["agentic-operations"];
  const industry = INDUSTRY_PROFILES[input.industry];
  const plays = sanitizedGoals.map((goal, index) => buildSalesPlay(input, goal, index));
  const portfolioMap = buildPortfolioMap(sanitizedGoals);

  const summaryHeadline = `${input.accountName}: ${toTitleCase(input.buyingMode)} a ${industry.executiveBias} co-sell motion`;
  const opportunity = `${industry.opportunity} Start with ${GOAL_BLUEPRINTS[sanitizedGoals[0]].label.toLowerCase()} and expand into a broader Google Cloud plus Cognizant roadmap.`;

  return {
    generatedAt: new Date().toISOString(),
    input: {
      ...input,
      goals: sanitizedGoals
    },
    research: {
      mode: "demo",
      model: "deterministic-local-generator",
      note: "Using the local fallback generator. Add GEMINI_API_KEY to enable live web-backed research.",
      sources: []
    },
    summary: {
      headline: summaryHeadline,
      opportunity,
      whyNow: `${industry.whyNow} The stated environment is ${input.knownEnvironment || "still being qualified"}, so the motion should emphasize low-friction entry and visible business outcomes.`,
      partnerThesis: `Google Cloud brings the AI platform and product credibility. Cognizant closes execution risk with industry context, operating-model design, and adoption muscle for ${input.accountName}.`
    },
    accountSignals: [...industry.signals, `Buying posture is ${input.buyingMode}, which suggests the opening conversation should be framed around ${industry.executiveBias} rather than abstract AI vision.`],
    portfolioMap,
    plays,
    messaging: {
      executiveTalkTrack: `${input.accountName} does not need another AI pilot. The better story is a governed business outcome: Google Cloud provides the AI foundation and Cognizant helps your team operationalize it quickly, with the right workflow design, controls, and change support.`,
      technicalTalkTrack: `We can start with a narrow production use case, connect it to ${input.knownEnvironment || "your existing environment"}, and design for reusable platform patterns so the first launch becomes a template rather than a one-off build.`,
      emailOpening: `We see a practical co-sell path for ${input.accountName}: pair Google Cloud AI capabilities with Cognizant delivery to launch a focused ${GOAL_BLUEPRINTS[sanitizedGoals[0]].label.toLowerCase()} motion tied to ${industry.executiveBias}.`
    },
    actionPlan: {
      first30Days: [
        "Validate sponsor, budget pressure, and current AI program maturity.",
        "Choose one opening workflow where Google Cloud product value and Cognizant services value are both obvious.",
        "Run a joint discovery workshop and translate findings into a 90-day pilot proposal."
      ],
      partnerActions: [
        "Assign Google Cloud to lead platform and product positioning in the first meeting.",
        "Assign Cognizant to lead workflow transformation, delivery shape, and adoption planning.",
        "Bring a joint point of view on success metrics, governance, and rollout sequencing."
      ],
      assetsToBring: [
        "One-page account hypothesis and target-buyer map",
        "Reference architecture sketch tied to the opening use case",
        "Pilot success metrics and change-management assumptions"
      ]
    }
  };
}
