import type { OfferingProvider } from "./offeringCatalog";

export interface ResearchSource {
  title: string;
  url: string;
  publisher?: string;
}

export interface PublicSignal {
  category: "financial" | "ai" | "hiring" | "cloud" | "exec" | "partnership";
  label: string;
  detail: string;
  strength: "high" | "medium" | "low";
}

export interface PersonaProfile {
  name: string;
  title: string;
  profileUrl?: string;
  sourceLabel?: string;
  function: string;
  seniority: string;
  buyingRole: "economic buyer" | "technical buyer" | "business champion";
  whyNow: string;
  idealChannels: string[];
  kpis: string[];
  objections: string[];
  objectionHandling: string[];
  tailoredStrategy: string;
  likelyPriorities: string[];
  outreachAngles: string[];
  linkedinSearchQuery: string;
  evidence: string[];
}

export interface ProductMatch {
  product: string;
  partner: OfferingProvider;
  fitScore: number;
  rationale: string;
  reasonForNeed?: string;
  accountBenefit?: string;
  whyCognizant?: string;
  whyGoogleCloud?: string;
  activationPlan: string;
  proofPoints: string[];
  evidenceSignals?: string[];
  deepDiveUrl?: string;
  deepDiveLabel?: string;
}

export interface CompetitorBenchmark {
  name: string;
  benchmarkSummary: string;
  pressurePoint: string;
  cognizantAngle: string;
}

export interface BlueprintSection {
  appName: string;
  purpose: string;
  targetProducts: string[];
  dataSources: string[];
  keyFunctions: string[];
  bigQueryTables: string[];
  orchestration: string[];
}

export interface ProspectData {
  companyName: string;
  companyWebsite?: string;
  executiveSummary: {
    headline: string;
    whyNow: string;
    industryHypothesis: string;
  };
  itSpendIntelligence: {
    estimatedRange: string;
    yoyMomentum: string;
    budgetPriority: string;
    signals: string[];
  };
  strategicAiInitiatives: {
    summary: string;
    programs: string[];
    evidence: string[];
  };
  technographics: {
    cloudFootprint: string[];
    dataEstate: string[];
    contactCenterSignals: string[];
    modernizationSignals: string[];
  };
  publicSignals: PublicSignal[];
  personas: PersonaProfile[];
  productMatches: ProductMatch[];
  competitors: CompetitorBenchmark[];
  accountPlan: {
    whyCognizantNow: string;
    discoveryQuestions: string[];
    nextActions: string[];
    whitespaceHypotheses: string[];
  };
  blueprint: BlueprintSection;
  propensityScore: number;
  researchMetadata: {
    mode: "live" | "demo";
    generatedAt: string;
    model?: string;
    note?: string;
    cached?: boolean;
    cacheExpiresAt?: string;
    sources: ResearchSource[];
  };
}

type Segment = {
  label: string;
  whyNow: string;
  budgetPriority: string;
  programs: string[];
  evidence: string[];
  cloudFootprint: string[];
  dataEstate: string[];
  contactCenterSignals: string[];
  modernizationSignals: string[];
  signals: PublicSignal[];
  personas: Omit<PersonaProfile, "name" | "linkedinSearchQuery">[];
  productMatches: Omit<ProductMatch, "fitScore">[];
  discoveryQuestions: string[];
  nextActions: string[];
  whitespaceHypotheses: string[];
};

const GOOGLE_PRODUCTS = [
  "Vertex AI",
  "Gemini on Google Cloud",
  "Customer Engagement Suite",
  "BigQuery",
  "Document AI"
];

const COGNIZANT_PRODUCTS = [
  "Cognizant Neuro AI",
  "Cognizant Flowsource",
  "Cognizant delivery and managed transformation services"
];

const SEGMENTS: Segment[] = [
  {
    label: "Financial Services",
    whyNow: "Financial institutions are under pressure to modernize risk, service, and compliance operations while proving ROI on AI spend.",
    budgetPriority: "Risk operations modernization with measurable efficiency gains",
    programs: [
      "Fraud and risk intelligence modernization",
      "GenAI-enabled service operations",
      "Data governance upgrades for regulated AI programs"
    ],
    evidence: [
      "Executive commentary tends to center on efficiency and customer experience at the same time.",
      "Hiring patterns usually concentrate around platform engineering, data governance, and AI risk.",
      "Public modernization stories often point to a hybrid cloud and data consolidation agenda."
    ],
    cloudFootprint: ["Google Workspace coexistence", "hybrid AWS and Azure estate", "customer intelligence modernization"],
    dataEstate: ["governed analytics platform", "risk data pipelines", "document-heavy operations"],
    contactCenterSignals: ["AI-assisted service routing", "knowledge retrieval for agents", "regulated call summarization"],
    modernizationSignals: ["mainframe adjacency", "workflow fragmentation", "manual controls and audit burden"],
    signals: [
      { category: "financial", label: "Efficiency mandate", detail: "Operating efficiency and service quality are likely being funded together.", strength: "high" },
      { category: "ai", label: "Risk AI traction", detail: "AI projects tend to cluster around fraud, underwriting, and service automation.", strength: "high" },
      { category: "hiring", label: "Governance hiring", detail: "AI governance and platform roles are a strong signal of enterprise readiness.", strength: "medium" }
    ],
    personas: [
      {
        title: "Chief Information Officer",
        function: "Technology",
        seniority: "C-suite",
        buyingRole: "economic buyer",
        whyNow: "Owns platform spend, modernization sequencing, and strategic partner choice.",
        idealChannels: ["Executive LinkedIn outreach", "Transformation briefings", "Industry leadership forums"],
        kpis: ["platform simplification", "AI program ROI", "migration speed", "resiliency and uptime"],
        objections: ["integration complexity", "unclear business case", "change-management burden"],
        objectionHandling: ["lead with phased roadmap", "tie value to near-term KPI movement", "position Cognizant as implementation and adoption partner"],
        tailoredStrategy: "Frame the discussion around modernization speed, governance, and measurable business value from AI-enabled transformation.",
        likelyPriorities: ["reduce tech sprawl", "modernize data foundation", "prove AI value safely"],
        outreachAngles: ["governed Vertex AI rollout", "shared delivery model with Cognizant", "co-sell backed transformation roadmap"],
        evidence: ["Often quoted in transformation and cloud announcements", "Likely accountable for platform governance"]
      },
      {
        title: "VP, Data & AI",
        function: "Data and AI",
        seniority: "VP",
        buyingRole: "technical buyer",
        whyNow: "Can translate platform strategy into deployable AI use cases.",
        idealChannels: ["Technical architecture sessions", "AI governance councils", "LinkedIn outreach"],
        kpis: ["deployment velocity", "data quality", "reusable model operations", "pilot-to-production rate"],
        objections: ["tool sprawl", "data readiness", "governance complexity"],
        objectionHandling: ["show integrated target architecture", "connect BigQuery and Vertex AI to reuse", "use Cognizant accelerators to reduce delivery friction"],
        tailoredStrategy: "Keep the message technical and execution-oriented, with emphasis on governed rollout and reusable AI platform patterns.",
        likelyPriorities: ["production-grade AI platform", "data quality", "reusable model operations"],
        outreachAngles: ["Vertex AI and BigQuery operating model", "Neuro AI accelerator patterns", "reference architecture and enablement"],
        evidence: ["Likely attached to hiring trends in AI platform and governance", "Usually central to program delivery"]
      },
      {
        title: "Head of Customer Operations",
        function: "Operations",
        seniority: "SVP/VP",
        buyingRole: "business champion",
        whyNow: "Feels pain from manual service workflows, knowledge gaps, and inconsistent customer experiences.",
        idealChannels: ["Direct executive outreach", "Operations transformation workshops", "Peer references"],
        kpis: ["agent productivity", "resolution speed", "containment", "customer satisfaction"],
        objections: ["workflow disruption", "budget tradeoffs", "AI trust concerns"],
        objectionHandling: ["start with narrow pilot use cases", "tie outcomes to service KPIs", "position human-in-the-loop rollout with Cognizant support"],
        tailoredStrategy: "Make the pitch operational and KPI-led, emphasizing fast ROI from service and workflow modernization.",
        likelyPriorities: ["service productivity", "faster resolution times", "agent augmentation"],
        outreachAngles: ["Customer Engagement Suite with Google AI", "Cognizant-led service transformation", "business case tied to containment and handle time"],
        evidence: ["Often associated with contact center or service transformation programs", "Natural champion for near-term ROI"]
      }
    ],
    productMatches: [
      {
        product: "Vertex AI",
        partner: "Google Cloud + Cognizant",
        rationale: "Best fit when the account needs governed model deployment, reusable accelerators, and enterprise controls.",
        activationPlan: "Lead with an AI operating model and a 90-day use-case delivery plan.",
        proofPoints: ["regulated AI governance", "model deployment discipline", "data + app modernization tie-in"]
      },
      {
        product: "Customer Engagement Suite",
        partner: "Google Cloud + Cognizant",
        rationale: "Strong fit for high-volume service operations and agent-assist workflows.",
        activationPlan: "Package a focused customer service pilot with clear metrics around containment and agent productivity.",
        proofPoints: ["service automation", "conversation intelligence", "customer experience modernization"]
      },
      {
        product: "Cognizant Neuro AI",
        partner: "Cognizant",
        rationale: "Useful as the orchestration and governance layer around a broader enterprise AI rollout.",
        activationPlan: "Position as the bridge between experimentation and enterprise-scale operating governance.",
        proofPoints: ["multi-agent orchestration", "enterprise controls", "delivery acceleration"]
      }
    ],
    discoveryQuestions: [
      "Which AI programs are already budgeted versus still in pilot mode?",
      "Where are service, risk, and data teams blocked by fragmented workflows?",
      "What governance barriers are slowing broader AI production rollout?"
    ],
    nextActions: [
      "Build a target-account dossier from public signals and executive commentary.",
      "Map one operational use case to Vertex AI and one to Customer Engagement Suite.",
      "Prepare a Cognizant-led transformation narrative with measurable 90-day outcomes."
    ],
    whitespaceHypotheses: [
      "The account may have AI enthusiasm but weak operating alignment across data and service functions.",
      "A co-sell motion is strongest when tied to regulated workflow modernization rather than generic AI experimentation."
    ]
  },
  {
    label: "Healthcare",
    whyNow: "Healthcare organizations need AI programs that lower administrative burden without compromising trust and compliance.",
    budgetPriority: "Administrative cost takeout with compliant data and AI foundations",
    programs: [
      "Member and provider experience transformation",
      "Prior authorization workflow modernization",
      "Clinical and claims knowledge automation"
    ],
    evidence: [
      "Public strategy tends to emphasize service, interoperability, and administrative efficiency.",
      "Hiring often points to digital operations and health data product roles.",
      "AI stories are strongest where manual document and workflow burdens are high."
    ],
    cloudFootprint: ["analytics modernization", "hybrid clinical systems", "cloud migration around member data"],
    dataEstate: ["claims data", "provider data fragmentation", "documentation-heavy workflows"],
    contactCenterSignals: ["member service modernization", "call summarization opportunities", "knowledge automation for agents"],
    modernizationSignals: ["legacy claims systems", "manual prior auth work", "cross-functional data fragmentation"],
    signals: [
      { category: "financial", label: "Admin cost pressure", detail: "Back-office productivity remains a likely board-level concern.", strength: "high" },
      { category: "ai", label: "Workflow AI demand", detail: "The highest-value AI use cases usually live inside documentation and service operations.", strength: "high" },
      { category: "cloud", label: "Interoperability agenda", detail: "Cloud and data modernization often follow interoperability goals.", strength: "medium" }
    ],
    personas: [
      {
        title: "Chief Digital Officer",
        function: "Digital Transformation",
        seniority: "C-suite",
        buyingRole: "economic buyer",
        whyNow: "Shapes transformation priorities that connect member experience, cost, and platform modernization.",
        idealChannels: ["Executive transformation outreach", "Innovation forums", "LinkedIn"],
        kpis: ["digital adoption", "cost takeout", "experience uplift", "program ROI"],
        objections: ["competing transformation priorities", "long time-to-value", "stakeholder alignment risk"],
        objectionHandling: ["position phased execution roadmap", "anchor on painful workflows first", "show Cognizant cross-functional orchestration"],
        tailoredStrategy: "Lead with administrative burden reduction and enterprise orchestration, connecting AI adoption to visible transformation outcomes.",
        likelyPriorities: ["digital service improvement", "transformation ROI", "enterprise orchestration"],
        outreachAngles: ["Cognizant-led transformation storyline", "Google Cloud AI platform as enabler", "cross-functional adoption plan"],
        evidence: ["Likely sponsor for large service and digital modernization work", "Can connect CX and platform spend"]
      },
      {
        title: "VP, Enterprise Data & AI",
        function: "Data and AI",
        seniority: "VP",
        buyingRole: "technical buyer",
        whyNow: "Owns how compliant AI capabilities get operationalized across claims, service, and care workflows.",
        idealChannels: ["Architecture reviews", "AI governance sessions", "LinkedIn"],
        kpis: ["safe deployment rate", "data quality", "workflow automation yield", "time to governed production"],
        objections: ["compliance risk", "fragmented data", "implementation complexity"],
        objectionHandling: ["highlight governed stack and controls", "show document and data workflow acceleration", "use Cognizant delivery patterns for compliant rollout"],
        tailoredStrategy: "Keep the discussion grounded in compliant AI operations and workflow execution, not generic experimentation.",
        likelyPriorities: ["data governance", "safe AI deployment", "workflow enablement"],
        outreachAngles: ["Vertex AI and BigQuery governance", "Document AI opportunities", "Cognizant accelerators and delivery"],
        evidence: ["Likely connected to governance and AI hiring", "Key translator between data architecture and business programs"]
      },
      {
        title: "SVP, Member Services",
        function: "Operations",
        seniority: "SVP",
        buyingRole: "business champion",
        whyNow: "Feels direct pressure to improve service outcomes while lowering handling costs.",
        idealChannels: ["Operations outreach", "Member service workshops", "Peer case studies"],
        kpis: ["service containment", "agent productivity", "member satisfaction", "cost per interaction"],
        objections: ["rollout fatigue", "AI trust concerns", "unclear operational ownership"],
        objectionHandling: ["propose tightly scoped workflow pilots", "use human-in-the-loop controls", "tie outcomes to current operational dashboards"],
        tailoredStrategy: "Center the conversation on specific service workflows and measurable member-service KPIs with a low-risk pilot approach.",
        likelyPriorities: ["service containment", "agent productivity", "member satisfaction"],
        outreachAngles: ["Customer Engagement Suite for service ops", "AI summarization and guidance", "fast pilot with ROI"],
        evidence: ["Natural sponsor for contact center transformation", "Clear owner of near-term business value"]
      }
    ],
    productMatches: [
      {
        product: "Document AI",
        partner: "Google Cloud + Cognizant",
        rationale: "High fit for document-heavy clinical, claims, and authorization workflows.",
        activationPlan: "Lead with a narrow operational document stream and expand after quality and turnaround gains.",
        proofPoints: ["document classification", "extraction accuracy", "workflow acceleration"]
      },
      {
        product: "Customer Engagement Suite",
        partner: "Google Cloud + Cognizant",
        rationale: "Strong fit when member service modernization is visible in public priorities.",
        activationPlan: "Create a member operations value case tied to agent productivity and containment.",
        proofPoints: ["member experience", "service guidance", "conversational AI"]
      },
      {
        product: "Vertex AI",
        partner: "Google Cloud + Cognizant",
        rationale: "Best used as the governed backbone for healthcare AI programs beyond one-off pilots.",
        activationPlan: "Position a compliant AI foundation with measurable use-case rollout sequencing.",
        proofPoints: ["governed genAI", "enterprise controls", "reusable healthcare patterns"]
      }
    ],
    discoveryQuestions: [
      "Which admin workflows are the most manual and politically important right now?",
      "How is AI governance handled today across clinical, claims, and service teams?",
      "Where could a narrow service or document AI pilot prove value fastest?"
    ],
    nextActions: [
      "Build an AI value map across service, claims, and document-heavy operations.",
      "Create a focused Customer Engagement Suite or Document AI pilot narrative.",
      "Attach Cognizant delivery, change management, and governance support to the proposal."
    ],
    whitespaceHypotheses: [
      "The account may be strong on digital ambition but underpowered on AI operations and workflow deployment.",
      "The co-sell wedge is strongest where administrative burden and service modernization intersect."
    ]
  },
  {
    label: "Technology",
    whyNow: "Tech companies often have many AI experiments already, but still struggle with enterprise packaging, support, and platform sprawl.",
    budgetPriority: "Platform simplification and customer-facing AI monetization",
    programs: [
      "Customer support automation",
      "Developer and product operations productivity",
      "AI feature commercialization"
    ],
    evidence: [
      "Public product launches and acquisition activity create rapid integration pressure.",
      "Hiring usually clusters around AI platform, developer productivity, and support operations.",
      "Cloud and data architectures tend to be advanced but fragmented."
    ],
    cloudFootprint: ["multi-cloud product delivery", "large analytics workloads", "global developer tooling"],
    dataEstate: ["product telemetry", "support knowledge", "customer intelligence streams"],
    contactCenterSignals: ["customer support automation", "agent knowledge augmentation", "case summarization"],
    modernizationSignals: ["tool duplication", "siloed telemetry", "support and product data fragmentation"],
    signals: [
      { category: "ai", label: "AI product race", detail: "The account likely has pressure to ship AI features and support them at scale.", strength: "high" },
      { category: "cloud", label: "Platform sprawl", detail: "Cloud maturity often coexists with duplicated tooling and governance friction.", strength: "high" },
      { category: "exec", label: "Commercial pressure", detail: "Leadership likely needs AI initiatives tied to revenue or product adoption, not just experimentation.", strength: "medium" }
    ],
    personas: [
      {
        title: "Chief Product Officer",
        function: "Product",
        seniority: "C-suite",
        buyingRole: "economic buyer",
        whyNow: "Can sponsor AI investments when they improve product differentiation or support economics.",
        idealChannels: ["Executive product outreach", "Innovation summits", "LinkedIn"],
        kpis: ["release velocity", "adoption", "support efficiency", "AI feature monetization"],
        objections: ["platform lock-in", "developer disruption", "unclear execution leverage"],
        objectionHandling: ["position modular architecture", "show Flowsource and Neuro AI as accelerators", "focus on faster shipping and lower execution drag"],
        tailoredStrategy: "Lead with engineering leverage and commercial impact, showing how Cognizant helps product teams ship AI capabilities faster.",
        likelyPriorities: ["faster product delivery", "customer adoption", "support efficiency"],
        outreachAngles: ["co-sell around product operations and customer support", "Cognizant scale delivery", "Google AI platform for shipping safely"],
        evidence: ["Likely visible in product and AI launch commentary", "Bridges technical and commercial priorities"]
      },
      {
        title: "VP, AI Platform",
        function: "Platform Engineering",
        seniority: "VP",
        buyingRole: "technical buyer",
        whyNow: "Owns the internal platform that determines whether experimentation becomes repeatable execution.",
        idealChannels: ["Technical workshops", "Platform leadership forums", "LinkedIn"],
        kpis: ["standardized deployment", "observability", "governance efficiency", "platform reuse"],
        objections: ["fragmented tooling", "MLOps overhead", "integration burden"],
        objectionHandling: ["show unified data-to-AI architecture", "connect Cognizant accelerators to faster rollout", "reduce overhead with reference patterns"],
        tailoredStrategy: "Keep the story deeply technical and platform-centric, focusing on reducing sprawl and improving repeatable execution.",
        likelyPriorities: ["standardized deployment", "observability", "governance and efficiency"],
        outreachAngles: ["Vertex AI backbone", "BigQuery analytics tie-in", "Cognizant operating model support"],
        evidence: ["Likely tied to AI platform hiring and architecture programs", "Clear technical owner of scale-up"]
      },
      {
        title: "VP, Customer Success Operations",
        function: "Customer Operations",
        seniority: "VP",
        buyingRole: "business champion",
        whyNow: "Owns customer support leverage and can justify AI investments through ticket deflection and resolution gains.",
        idealChannels: ["Customer operations outreach", "Support transformation briefings", "LinkedIn"],
        kpis: ["containment", "case resolution", "agent productivity", "support cost"],
        objections: ["service disruption", "trust in AI recommendations", "competing priorities"],
        objectionHandling: ["start with assistive AI use cases", "show guided rollout with Cognizant services", "tie value to visible support KPIs"],
        tailoredStrategy: "Make it practical and KPI-first, positioning the co-sell around support productivity, knowledge access, and low-risk deployment.",
        likelyPriorities: ["containment", "case resolution", "agent productivity"],
        outreachAngles: ["Customer Engagement Suite", "knowledge-grounded support", "rapid ROI pilot"],
        evidence: ["Likely pressure point in fast-growth or enterprise SaaS models", "Good business entry point"]
      }
    ],
    productMatches: [
      {
        product: "Vertex AI",
        partner: "Google Cloud + Cognizant",
        rationale: "Best fit when AI capabilities need a governed backbone and faster industrialization.",
        activationPlan: "Center the conversation on standardizing AI operations and reducing platform sprawl.",
        proofPoints: ["model operations", "platform simplification", "faster AI release cadence"]
      },
      {
        product: "BigQuery",
        partner: "Google Cloud + Cognizant",
        rationale: "Strong fit when customer telemetry and product usage data must feed AI and support decisions.",
        activationPlan: "Tie product analytics, support intelligence, and AI feature measurement into one modernization motion.",
        proofPoints: ["analytics consolidation", "faster insight loops", "data for AI products"]
      },
      {
        product: "Cognizant Flowsource",
        partner: "Cognizant",
        rationale: "Good complement when the account needs stronger engineering velocity around AI and platform work.",
        activationPlan: "Position as the engineering acceleration layer around product and platform modernization.",
        proofPoints: ["engineering productivity", "delivery speed", "governed SDLC support"]
      }
    ],
    discoveryQuestions: [
      "Where is platform complexity slowing AI feature release or support quality?",
      "How are support and product telemetry connected today?",
      "Which AI initiatives are strategic versus still disconnected pilots?"
    ],
    nextActions: [
      "Frame a platform simplification and support-operations wedge.",
      "Map one product-facing and one internal operations use case to Google Cloud AI.",
      "Position Cognizant as the execution layer that shortens time-to-value."
    ],
    whitespaceHypotheses: [
      "The account may have strong internal AI capabilities but still need outside help scaling delivery and governance.",
      "A co-sell entry point may land faster through support economics than through broad AI platform messaging."
    ]
  }
];

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0;
  }
  return value;
}

function pickSegment(companyName: string): Segment {
  return SEGMENTS[hash(companyName) % SEGMENTS.length];
}

function score(seed: number, offset: number, max: number): number {
  return offset + (seed % max);
}

function buildBlueprint(): BlueprintSection {
  return {
    appName: "AI-Pulse Prospector",
    purpose: "Identify high-propensity accounts, map decision personas, and align Google Cloud AI + Cognizant co-sell plays from public signals.",
    targetProducts: [...GOOGLE_PRODUCTS, ...COGNIZANT_PRODUCTS],
    dataSources: [
      "SEC filings and investor relations",
      "Earnings calls and company newsrooms",
      "Job postings and public hiring patterns",
      "Technographic and cloud footprint clues",
      "LinkedIn and public profile discovery workflows"
    ],
    keyFunctions: [
      "IT spend signal extraction",
      "Strategic AI initiative mapping",
      "Persona discovery and buying-role mapping",
      "Google Cloud and Cognizant product alignment",
      "Propensity scoring and next-best-action generation"
    ],
    bigQueryTables: [
      "accounts_raw_signals",
      "accounts_enriched_profiles",
      "persona_candidates",
      "product_fit_scores",
      "account_action_plans"
    ],
    orchestration: [
      "BigQuery as analytical backbone",
      "Server-side AI synthesis for public web research",
      "Human-in-the-loop review for persona validation",
      "CRM sync and account-based selling workflows"
    ]
  };
}

function buildLinkedInQuery(companyName: string, title: string): string {
  return `site:linkedin.com/in/ "${companyName}" "${title}"`;
}

export function generateDemoProspect(companyName: string, note?: string): ProspectData {
  const trimmed = companyName.trim();
  const seed = hash(trimmed);
  const segment = pickSegment(trimmed);
  const propensityScore = score(seed, 71, 24);

  return {
    companyName: trimmed,
    companyWebsite: "",
    executiveSummary: {
      headline: `${trimmed} shows credible public signals for a Cognizant + Google Cloud AI pursuit.`,
      whyNow: segment.whyNow,
      industryHypothesis: `${trimmed} appears most aligned with a ${segment.label.toLowerCase()} account pattern where AI ambition is real, but execution value depends on platform discipline and workflow adoption.`
    },
    itSpendIntelligence: {
      estimatedRange: `$${score(seed, 65, 120)}M-$${score(seed, 105, 140)}M`,
      yoyMomentum: `+${score(seed, 3, 8)}%`,
      budgetPriority: segment.budgetPriority,
      signals: [
        "Public modernization themes suggest active technology investment.",
        "Role and hiring patterns imply continued spend on AI, data, and operating model work.",
        "Transformation priorities appear tied to measurable business operations, not just experimentation."
      ]
    },
    strategicAiInitiatives: {
      summary: `The most plausible AI path for ${trimmed} centers on workflow transformation, governed data foundations, and targeted customer or employee productivity gains.`,
      programs: segment.programs,
      evidence: segment.evidence
    },
    technographics: {
      cloudFootprint: segment.cloudFootprint,
      dataEstate: segment.dataEstate,
      contactCenterSignals: segment.contactCenterSignals,
      modernizationSignals: segment.modernizationSignals
    },
    publicSignals: segment.signals,
    personas: segment.personas.map((persona, index) => ({
      ...persona,
      name: `${trimmed} ${["Strategic Sponsor", "Platform Owner", "Business Champion"][index]}`,
      linkedinSearchQuery: buildLinkedInQuery(trimmed, persona.title)
    })),
    productMatches: segment.productMatches.map((match, index) => ({
      ...match,
      fitScore: Math.min(95, score(seed + index * 7, 78, 18))
    })),
    competitors: [
      {
        name: `${trimmed} peer benchmark A`,
        benchmarkSummary: `${trimmed} is likely being compared against rivals that are packaging AI and cloud modernization with clearer execution narratives.`,
        pressurePoint: "Peer messaging may sound more concrete around AI ROI, platform readiness, and workflow transformation.",
        cognizantAngle: `Use a benchmark-led sales motion to show how Cognizant can help ${trimmed} accelerate from strategy to execution.`
      },
      {
        name: `${trimmed} peer benchmark B`,
        benchmarkSummary: "Comparable enterprises often signal stronger momentum when they tie AI investment directly to service, data, or operating-model outcomes.",
        pressurePoint: "The target account can look slower if public messaging stays broad and non-operational.",
        cognizantAngle: "Position Google Cloud AI plus Cognizant delivery as the fastest path to measurable wins."
      },
      {
        name: `${trimmed} peer benchmark C`,
        benchmarkSummary: "Public competitors tend to create urgency when they show named programs, platform choices, and enterprise adoption stories.",
        pressurePoint: "Lack of visible execution detail can reduce perceived urgency for the target account.",
        cognizantAngle: "Lead with a competitor-aware blueprint and a focused 90-day pilot wedge."
      }
    ],
    accountPlan: {
      whyCognizantNow: `Cognizant can help ${trimmed} move from scattered AI and modernization work into a co-sell program that connects Google Cloud products to measurable operating outcomes and delivery capacity.`,
      discoveryQuestions: segment.discoveryQuestions,
      nextActions: segment.nextActions,
      whitespaceHypotheses: segment.whitespaceHypotheses
    },
    blueprint: buildBlueprint(),
    propensityScore,
    researchMetadata: {
      mode: "demo",
      generatedAt: new Date().toISOString(),
      note: note ?? "Built from the local prospecting model because live research is unavailable.",
      sources: []
    }
  };
}
