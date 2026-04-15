import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  BadgeDollarSign,
  Blocks,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Factory,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  Users,
  X,
  Mic,
  MicOff
} from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "regenerator-runtime/runtime";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { analyzeCompany, ProspectData } from "./services/geminiService";
import { findOfferingCatalogEntry, MAIN_MENU_OFFERINGS } from "./lib/offeringCatalog";
import { generateDemoProspect } from "./lib/prospect";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { exportPlaybookToPptx, renderDeckOutlineAsText } from "./lib/deckExport";
import {
  createCoSellPlaybook,
  type CoSellInput,
  type CoSellPlaybook,
  type IndustryKey,
  type InputGoals
} from "./lib/playbook";
import { generatePlaybook } from "./services/playService";
import type { DocumentGenerationInput, DocumentMode, GeneratedDocuments, SlideSummary } from "./lib/documentStudio";
import { exportSlideSummaryToPptx } from "./lib/slideDeckExport";
import { generateDocuments as generateStudioDocuments, summarizeDocument } from "./services/documentService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { id: "brief", label: "Brief", icon: Sparkles },
  { id: "signals", label: "Signals", icon: BadgeDollarSign },
  { id: "personas", label: "Personas", icon: Users },
  { id: "plays", label: "Co-Sell Plays", icon: BrainCircuit },
  { id: "playbook", label: "Playbook", icon: Briefcase },
  { id: "benchmarking", label: "Benchmarking", icon: Building2 },
  { id: "documentStudio", label: "Document Studio", icon: ClipboardList }
] as const;

const ACCOUNTS_STORAGE_KEY = "prospector_accounts";
const ACTIVE_STORAGE_KEY = "prospector_active_index";
const PLAYBOOKS_STORAGE_KEY = "prospector_playbooks";
const DOCUMENTS_STORAGE_KEY = "prospector_documents";
const SLIDES_STORAGE_KEY = "prospector_slides";
const LEGACY_ACCOUNTS_STORAGE_KEYS = [
  "prospector_v2_accounts:v5-persona-strategy",
  "prospector_v2_accounts:v4-offerings",
  "prospector_v2_accounts:v3-benchmarking",
  "prospector_v2_accounts:v2-persona-names",
  "prospector_v2_accounts"
];
const LEGACY_ACTIVE_STORAGE_KEYS = [
  "prospector_v2_active:v5-persona-strategy",
  "prospector_v2_active:v4-offerings",
  "prospector_v2_active:v3-benchmarking",
  "prospector_v2_active",
  "prospector_v2_active:v2-persona-names"
];
const COGNIZANT_MENU = MAIN_MENU_OFFERINGS.filter((offering) => offering.provider === "Cognizant")
  .map((offering) => offering.deepDiveLabel.replace(" overview", ""))
  .join(", ");
const GOOGLE_MENU = MAIN_MENU_OFFERINGS.filter((offering) => offering.provider === "Google Cloud")
  .slice(0, 3)
  .map((offering) => offering.deepDiveLabel)
  .join(", ");

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function readFirstAvailable<T>(keys: string[], parser: (raw: string) => T | null): T | null {
  if (typeof window === "undefined") return null;

  try {
    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = parser(raw);
      if (parsed !== null) return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeStoredAccount(raw: unknown): ProspectData | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, any>;
  const companyName = typeof record.companyName === "string" && record.companyName.trim() ? record.companyName.trim() : "";
  if (!companyName) return null;

  const base = generateDemoProspect(companyName, "Recovered from saved browser history.");

  return {
    ...base,
    ...record,
    executiveSummary: {
      ...base.executiveSummary,
      ...(record.executiveSummary || {})
    },
    itSpendIntelligence: {
      ...base.itSpendIntelligence,
      ...(record.itSpendIntelligence || {})
    },
    strategicAiInitiatives: {
      ...base.strategicAiInitiatives,
      ...(record.strategicAiInitiatives || {})
    },
    technographics: {
      ...base.technographics,
      ...(record.technographics || {})
    },
    accountPlan: {
      ...base.accountPlan,
      ...(record.accountPlan || {})
    },
    blueprint: {
      ...base.blueprint,
      ...(record.blueprint || {})
    },
    researchMetadata: {
      ...base.researchMetadata,
      ...(record.researchMetadata || {}),
      sources: Array.isArray(record.researchMetadata?.sources) ? record.researchMetadata.sources : base.researchMetadata.sources
    },
    publicSignals: Array.isArray(record.publicSignals) ? record.publicSignals : base.publicSignals,
    competitors: Array.isArray(record.competitors) ? record.competitors : base.competitors,
    productMatches: Array.isArray(record.productMatches) ? record.productMatches : base.productMatches,
    personas: Array.isArray(record.personas)
      ? record.personas.map((persona: any, index: number) => ({
          ...base.personas[Math.min(index, base.personas.length - 1)],
          ...persona,
          idealChannels: isStringArray(persona?.idealChannels) ? persona.idealChannels : base.personas[Math.min(index, base.personas.length - 1)].idealChannels,
          kpis: isStringArray(persona?.kpis) ? persona.kpis : base.personas[Math.min(index, base.personas.length - 1)].kpis,
          objections: isStringArray(persona?.objections) ? persona.objections : base.personas[Math.min(index, base.personas.length - 1)].objections,
          objectionHandling: isStringArray(persona?.objectionHandling) ? persona.objectionHandling : base.personas[Math.min(index, base.personas.length - 1)].objectionHandling,
          likelyPriorities: isStringArray(persona?.likelyPriorities) ? persona.likelyPriorities : base.personas[Math.min(index, base.personas.length - 1)].likelyPriorities,
          outreachAngles: isStringArray(persona?.outreachAngles) ? persona.outreachAngles : base.personas[Math.min(index, base.personas.length - 1)].outreachAngles,
          evidence: isStringArray(persona?.evidence) ? persona.evidence : base.personas[Math.min(index, base.personas.length - 1)].evidence
        }))
      : base.personas
  };
}

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function getCompanyLogoUrl(account: ProspectData): string | null {
  if (!account.companyWebsite) return null;

  try {
    const hostname = new URL(account.companyWebsite).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return null;
  }
}

function hasGenericPersonaNames(account: ProspectData): boolean {
  const company = account.companyName.trim().toLowerCase();
  return account.personas.some((persona) => {
    const name = persona.name.trim().toLowerCase();
    return (
      !name ||
      name.startsWith(company) ||
      name.includes("executive sponsor") ||
      name.includes("platform owner") ||
      name.includes("business champion")
    );
  });
}

function hasGenericCompetitorNames(account: ProspectData): boolean {
  return account.competitors.some((competitor) => {
    const name = competitor.name.trim().toLowerCase();
    return (
      !name ||
      name.includes("peer benchmark") ||
      name.includes("competitor a") ||
      name.includes("competitor b") ||
      name.includes("competitor c")
    );
  });
}

function needsLiveRepair(account: ProspectData): boolean {
  const note = account.researchMetadata.note || "";
  return (
    account.researchMetadata.mode !== "live" ||
    hasGenericPersonaNames(account) ||
    hasGenericCompetitorNames(account) ||
    note.includes("Recovered from saved browser history.") ||
    note.includes("Live research failed") ||
    note.includes("Live research timed out") ||
    note.includes("Gemini API project has exhausted its quota")
  );
}

function inferIndustry(account: ProspectData): IndustryKey {
  const value = `${account.executiveSummary.industryHypothesis} ${account.strategicAiInitiatives.summary}`.toLowerCase();
  if (value.includes("financial") || value.includes("bank") || value.includes("insurance")) return "financial-services";
  if (value.includes("health")) return "healthcare";
  if (value.includes("retail") || value.includes("commerce") || value.includes("consumer")) return "retail";
  if (value.includes("manufactur") || value.includes("industrial")) return "manufacturing";
  if (value.includes("telecom") || value.includes("communication") || value.includes("network")) return "communications";
  return "cross-industry";
}

function inferGoals(account: ProspectData): InputGoals[] {
  const hints = [
    ...account.productMatches.map((match) => match.product.toLowerCase()),
    account.itSpendIntelligence.budgetPriority.toLowerCase(),
    account.strategicAiInitiatives.summary.toLowerCase()
  ].join(" | ");

  const goals = new Set<InputGoals>();
  if (hints.includes("customer engagement") || hints.includes("contact center") || hints.includes("customer service")) {
    goals.add("customer-service");
  }
  if (hints.includes("flowsource") || hints.includes("developer") || hints.includes("engineering")) {
    goals.add("developer-productivity");
  }
  if (hints.includes("document")) {
    goals.add("document-automation");
  }
  if (hints.includes("bigquery") || hints.includes("data") || hints.includes("modernization")) {
    goals.add("data-modernization");
  }
  if (hints.includes("vertex") || hints.includes("agent") || hints.includes("neuro")) {
    goals.add("agentic-operations");
  }

  if (!goals.size) {
    goals.add("agentic-operations");
    goals.add("data-modernization");
  }

  return [...goals].slice(0, 3);
}

function mapAccountToPlaybookInput(account: ProspectData): CoSellInput {
  const productNames = account.productMatches.slice(0, 5).map((match) => match.product).join(", ");
  const techEstate = [
    ...account.technographics.cloudFootprint,
    ...account.technographics.dataEstate,
    ...account.technographics.contactCenterSignals
  ]
    .filter(Boolean)
    .slice(0, 6)
    .join("; ");

  return {
    accountName: account.companyName,
    industry: inferIndustry(account),
    geography: "North America",
    buyingMode: account.propensityScore >= 75 ? "transform" : account.propensityScore >= 60 ? "expand" : "land",
    goals: inferGoals(account),
    knownEnvironment: techEstate || productNames || account.executiveSummary.industryHypothesis,
    urgency: account.executiveSummary.whyNow,
    notes: [
      account.strategicAiInitiatives.summary,
      `Budget priority: ${account.itSpendIntelligence.budgetPriority}`,
      `Why Cognizant now: ${account.accountPlan.whyCognizantNow}`,
      `Priority offers: ${productNames}`
    ]
      .filter(Boolean)
      .join(" ")
  };
}

function formatOfferLine(value: string) {
  const entry = findOfferingCatalogEntry(value);
  return entry ? `${value} (${entry.deepDiveUrl})` : value;
}

function buildPlaybookExport(account: ProspectData, playbook: CoSellPlaybook) {
  const officialLinks = Array.from(
    new Map(
      [
        ...account.productMatches.map((match) => [match.product, match.deepDiveUrl || findOfferingCatalogEntry(match.product)?.deepDiveUrl]),
        ...playbook.portfolioMap.map((offer) => [offer.name, findOfferingCatalogEntry(offer.name)?.deepDiveUrl]),
        ...playbook.plays.flatMap((play) => [
          [play.googleCloudOffer, findOfferingCatalogEntry(play.googleCloudOffer)?.deepDiveUrl],
          [play.cognizantOffer, findOfferingCatalogEntry(play.cognizantOffer)?.deepDiveUrl]
        ])
      ].filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1]))
    ).entries()
  );

  return [
    renderDeckOutlineAsText(playbook),
    "",
    "Account Prospect Summary",
    `Headline: ${account.executiveSummary.headline}`,
    `Why now: ${account.executiveSummary.whyNow}`,
    `Budget priority: ${account.itSpendIntelligence.budgetPriority}`,
    "",
    "Official links",
    ...officialLinks.map(([label, url]) => `- ${label}: ${url}`),
    "",
    "Offer references in context",
    ...playbook.plays.flatMap((play) => [
      `- ${play.title}`,
      `  Google Cloud offer: ${formatOfferLine(play.googleCloudOffer)}`,
      `  Cognizant offer: ${formatOfferLine(play.cognizantOffer)}`
    ]),
    "",
    "Research sources",
    ...playbook.research.sources.map((source) => `- ${source.publisher}: ${source.title} | ${source.url}`)
  ].join("\n");
}

function mapAccountToDocumentInput(account: ProspectData, playbook: CoSellPlaybook): DocumentGenerationInput {
  const gcpOfferings = account.productMatches
    .filter((match) => match.partner !== "Cognizant")
    .map((match) => match.product)
    .slice(0, 5);
  const cognizantOfferings = account.productMatches
    .filter((match) => match.partner !== "Google Cloud")
    .map((match) => match.product)
    .slice(0, 5);

  return {
    targetCompany: account.companyName,
    industry: account.executiveSummary.industryHypothesis,
    painPoint: `${account.itSpendIntelligence.budgetPriority}. ${account.accountPlan.whitespaceHypotheses[0] || account.strategicAiInitiatives.summary}`,
    gcpOfferings: gcpOfferings.length ? gcpOfferings : playbook.portfolioMap.filter((offer) => offer.provider === "Google Cloud").map((offer) => offer.name),
    cognizantOfferings: cognizantOfferings.length
      ? cognizantOfferings
      : playbook.portfolioMap.filter((offer) => offer.provider === "Cognizant").map((offer) => offer.name),
    accountSummary: `${account.executiveSummary.headline} ${playbook.summary.partnerThesis}`,
    whyNow: account.executiveSummary.whyNow,
    sourceUrls: [
      ...account.researchMetadata.sources.map((source) => source.url),
      ...playbook.research.sources.map((source) => source.url)
    ].filter(Boolean)
  };
}

export default function App() {
  const [query, setQuery] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setPainPoint((prev) => {
        // Only overwrite if currently dictating to avoid wiping manual entry.
        return transcript;
      });
    }
  }, [transcript]);

  const toggleDictate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };
  const [loading, setLoading] = useState(false);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [slideLoading, setSlideLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentView, setDocumentView] = useState<DocumentMode>("executive");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("brief");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const attemptedLiveRefresh = useRef<Set<string>>(new Set());
  const backgroundRefreshInFlight = useRef<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<ProspectData[]>(() => {
    return (
      readFirstAvailable([ACCOUNTS_STORAGE_KEY, ...LEGACY_ACCOUNTS_STORAGE_KEYS], (raw) => {
        try {
          const parsed = JSON.parse(raw) as unknown[];
          return Array.isArray(parsed)
            ? parsed.map((item) => sanitizeStoredAccount(item)).filter((item): item is ProspectData => item !== null)
            : null;
        } catch {
          return null;
        }
      }) || []
    );
  });
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    return (
      readFirstAvailable([ACTIVE_STORAGE_KEY, ...LEGACY_ACTIVE_STORAGE_KEYS], (raw) => {
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
      }) ?? -1
    );
  });
  const [playbooks, setPlaybooks] = useState<Record<string, CoSellPlaybook>>(() => {
    return (
      readFirstAvailable([PLAYBOOKS_STORAGE_KEY], (raw) => {
        try {
          const parsed = JSON.parse(raw) as Record<string, CoSellPlaybook>;
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      }) || {}
    );
  });
  const [documentsByAccount, setDocumentsByAccount] = useState<Record<string, GeneratedDocuments>>(() => {
    return (
      readFirstAvailable([DOCUMENTS_STORAGE_KEY], (raw) => {
        try {
          const parsed = JSON.parse(raw) as Record<string, GeneratedDocuments>;
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      }) || {}
    );
  });
  const [slidesByAccount, setSlidesByAccount] = useState<Record<string, { executive?: SlideSummary; technical?: SlideSummary }>>(() => {
    return (
      readFirstAvailable([SLIDES_STORAGE_KEY], (raw) => {
        try {
          const parsed = JSON.parse(raw) as Record<string, { executive?: SlideSummary; technical?: SlideSummary }>;
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
          return null;
        }
      }) || {}
    );
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // Keep the app usable even if storage is unavailable.
    }
  }, [accounts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_STORAGE_KEY, String(activeIndex));
    } catch {
      // Keep the app usable even if storage is unavailable.
    }
  }, [activeIndex]);
  useEffect(() => {
    try {
      window.localStorage.setItem(PLAYBOOKS_STORAGE_KEY, JSON.stringify(playbooks));
    } catch {
      // Ignore storage failures for playbooks.
    }
  }, [playbooks]);
  useEffect(() => {
    try {
      window.localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documentsByAccount));
    } catch {
      // Ignore storage failures for documents.
    }
  }, [documentsByAccount]);
  useEffect(() => {
    try {
      window.localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(slidesByAccount));
    } catch {
      // Ignore storage failures for slide summaries.
    }
  }, [slidesByAccount]);

  const activeAccount = activeIndex >= 0 ? accounts[activeIndex] : null;
  const activeAccountKey = activeAccount ? normalizeKey(activeAccount.companyName) : "";
  const activePlaybook = useMemo(() => {
    if (!activeAccount) return null;
    return playbooks[activeAccountKey] || createCoSellPlaybook(mapAccountToPlaybookInput(activeAccount));
  }, [activeAccount, activeAccountKey, playbooks]);
  const activeDocuments = activeAccount ? documentsByAccount[activeAccountKey] || null : null;
  const activeSlides = activeAccount ? slidesByAccount[activeAccountKey] || {} : {};

  useEffect(() => {
    if (!activeAccount || loading) return;
    const shouldRefresh = needsLiveRepair(activeAccount);

    if (!shouldRefresh) return;
    if (attemptedLiveRefresh.current.has(activeAccount.companyName)) return;

    attemptedLiveRefresh.current.add(activeAccount.companyName);
    void refreshActiveAccount();
  }, [activeAccount?.companyName, activeAccount?.researchMetadata.mode, activeAccount?.researchMetadata.note]);

  useEffect(() => {
    const staleAccounts = accounts.filter((account) => needsLiveRepair(account));
    if (!staleAccounts.length) return;

    for (const account of staleAccounts) {
      const key = account.companyName.toLowerCase();
      if (attemptedLiveRefresh.current.has(key)) continue;
      if (backgroundRefreshInFlight.current.has(key)) continue;

      attemptedLiveRefresh.current.add(key);
      backgroundRefreshInFlight.current.add(key);

      void analyzeCompany(account.companyName, { forceFresh: true })
        .then((data) => {
          setAccounts((prev) =>
            prev.map((entry) =>
              entry.companyName.toLowerCase() === account.companyName.toLowerCase() ? data : entry
            )
          );
        })
        .catch(() => {
          // Keep the saved account visible even if background repair fails.
        })
        .finally(() => {
          backgroundRefreshInFlight.current.delete(key);
        });
    }
  }, [accounts]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeCompany(query.trim() + (painPoint.trim() ? ` (Pain point context: ${painPoint.trim()})` : ""));
      const existing = accounts.findIndex(
        (account) => account.companyName.toLowerCase() === data.companyName.toLowerCase()
      );

      if (existing >= 0) {
        const next = [...accounts];
        next[existing] = data;
        setAccounts(next);
        setActiveIndex(existing);
      } else {
        setAccounts((prev) => [...prev, data]);
        setActiveIndex(accounts.length);
      }

      setQuery("");
      setPainPoint("");
      setActiveTab("brief");
    } catch (err: any) {
      setError(err.message || "Could not build the account prospect.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshActiveAccount() {
    if (!activeAccount) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeCompany(activeAccount.companyName, { forceFresh: true });
      setAccounts((prev) =>
        prev.map((account, index) => (index !== activeIndex ? account : data))
      );
    } catch (err: any) {
      setError(err.message || "Could not refresh live research.");
    } finally {
      setLoading(false);
    }
  }

  async function generateActivePlaybook() {
    if (!activeAccount) return;

    setPlaybookLoading(true);
    setPlaybookError(null);

    try {
      const data = await generatePlaybook(mapAccountToPlaybookInput(activeAccount));
      setPlaybooks((prev) => ({
        ...prev,
        [normalizeKey(activeAccount.companyName)]: data
      }));
      setActiveTab("playbook");
    } catch (err: any) {
      setPlaybookError(err.message || "Could not generate the executive playbook.");
    } finally {
      setPlaybookLoading(false);
    }
  }

  async function exportActiveDeck() {
    if (!activePlaybook) return;
    await exportPlaybookToPptx(activePlaybook);
  }

  async function generateAccountDocuments() {
    if (!activeAccount || !activePlaybook) return;

    setDocumentLoading(true);
    setDocumentError(null);

    try {
      const data = await generateStudioDocuments(mapAccountToDocumentInput(activeAccount, activePlaybook));
      setDocumentsByAccount((prev) => ({
        ...prev,
        [activeAccountKey]: data
      }));
    } catch (err: any) {
      setDocumentError(err.message || "Could not generate the detailed playbook documents.");
    } finally {
      setDocumentLoading(false);
    }
  }

  async function summarizeActiveDocument(mode: DocumentMode) {
    if (!activeDocuments) return;
    const markdown = mode === "executive" ? activeDocuments.executiveMarkdown : activeDocuments.technicalMarkdown;
    if (!markdown) return;

    setSlideLoading(true);
    setDocumentError(null);

    try {
      const data = await summarizeDocument(markdown, mode);
      setSlidesByAccount((prev) => ({
        ...prev,
        [activeAccountKey]: {
          ...prev[activeAccountKey],
          [mode]: data
        }
      }));
    } catch (err: any) {
      setDocumentError(err.message || "Could not summarize the document into slides.");
    } finally {
      setSlideLoading(false);
    }
  }

  async function exportDocumentSlides(mode: DocumentMode) {
    if (!activeAccount || !activeDocuments) return;
    const slides = activeSlides[mode];
    if (!slides) return;

    await exportSlideSummaryToPptx(slides, {
      targetCompany: activeAccount.companyName,
      industry: activeAccount.executiveSummary.industryHypothesis,
      painPoint: activeAccount.itSpendIntelligence.budgetPriority,
      mode
    });
  }

  function downloadMarkdown(markdown: string, fileStem: string) {
    const element = document.createElement("a");
    const file = new Blob([markdown], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = fileStem;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function closeAccount(index: number) {
    const next = accounts.filter((_, i) => i !== index);
    setAccounts(next);
    setPlaybooks((prev) => {
      const account = accounts[index];
      if (!account) return prev;
      const nextPlaybooks = { ...prev };
      delete nextPlaybooks[normalizeKey(account.companyName)];
      return nextPlaybooks;
    });
    setDocumentsByAccount((prev) => {
      const account = accounts[index];
      if (!account) return prev;
      const nextDocuments = { ...prev };
      delete nextDocuments[normalizeKey(account.companyName)];
      return nextDocuments;
    });
    setSlidesByAccount((prev) => {
      const account = accounts[index];
      if (!account) return prev;
      const nextSlides = { ...prev };
      delete nextSlides[normalizeKey(account.companyName)];
      return nextSlides;
    });
    if (!next.length) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex === index) {
      setActiveIndex(Math.max(0, index - 1));
    } else if (activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }
  }

  function updatePersonaEmail(personaIndex: number, value: string) {
    if (!activeAccount) return;

    setAccounts((prev) =>
      prev.map((account, index) =>
        index !== activeIndex
          ? account
          : {
              ...account,
              personas: account.personas.map((persona, i) =>
                i !== personaIndex ? persona : { ...persona, outreachAngles: [value, ...persona.outreachAngles.slice(1)] }
              )
            }
      )
    );
  }

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText?.(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  const modeLabel = activeAccount?.researchMetadata.mode === "live" ? "Live Research" : "Demo Fallback";

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto max-w-[1500px] px-4 py-4 md:px-6 md:py-6">
        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-line/15 bg-white/70 p-5 shadow-[0_20px_80px_rgba(24,32,56,0.08)] backdrop-blur">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(32,95,255,0.18),_transparent_42%),linear-gradient(135deg,#07203f_0%,#12315a_46%,#164870_100%)] p-6 text-white">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/65">Prospecting + Playbook Workspace</p>
              <h1 className="mt-3 font-serif text-4xl italic leading-none">Cognizant GCP Playbook</h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
                Build a public-data point of view on target accounts, generate joint Google Cloud and Cognizant co-sell
                motions, and export an executive-ready deck without losing the research context.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <Badge label="Cognizant AI" value={COGNIZANT_MENU} />
                <Badge label="Google Cloud AI" value={GOOGLE_MENU} />
                <Badge label="Playbooks" value="Deck export + talk tracks" />
                <Badge label="Workspace" value="Persistent account history" />
              </div>
            </div>

            <form onSubmit={handleAnalyze} className="mt-5 space-y-3">
              <label className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Target Account</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Snowflake, Humana, ServiceNow..."
                  className="w-full rounded-2xl border border-line/15 bg-white px-11 py-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <label className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Business Pain Point (Optional)</label>
              <div className="relative">
                <textarea
                  value={painPoint}
                  onChange={(e) => setPainPoint(e.target.value)}
                  placeholder="What specific outcome or problem are they solving?"
                  className="w-full resize-none rounded-2xl border border-line/15 bg-white pl-4 pr-32 py-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 h-24"
                />
                <button
                  type="button"
                  onClick={toggleDictate}
                  className={cn(
                    "absolute right-2 top-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                    listening
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-line/5 text-ink/65 hover:bg-line/10 hover:text-ink"
                  )}
                >
                  {listening ? <MicOff className="size-3.5 animate-pulse" /> : <Mic className="size-3.5" />}
                  {listening ? "DICTATING" : "DICTATE"}
                </button>
              </div>
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Build Account Prospect
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Workspace</p>
                <p className="text-xs text-ink/40">{accounts.length} accounts</p>
              </div>
              <div className="space-y-2">
                {accounts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line/15 px-4 py-6 text-sm text-ink/45">
                    Start with one target account to generate a fresh public-data prospecting brief.
                  </div>
                )}
                {accounts.map((account, index) => (
                  <button
                    key={account.companyName}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left transition",
                      activeIndex === index
                        ? "border-accent bg-accent/8 shadow-[0_12px_30px_rgba(242,125,38,0.12)]"
                        : "border-line/10 bg-white hover:border-line/25"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <LogoBadge account={account} />
                      <div>
                        <p className="font-serif text-xl italic">{account.companyName}</p>
                        <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">
                          {account.researchMetadata.mode === "live" ? "Live Research" : "Demo Mode"}
                          {playbooks[normalizeKey(account.companyName)] ? " • Playbook ready" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-mono text-white">
                        {account.propensityScore}
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAccount(index);
                        }}
                        className="cursor-pointer text-ink/35 hover:text-red-600"
                      >
                        <X className="size-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-[28px] border border-line/15 bg-white/70 p-5 shadow-[0_20px_80px_rgba(24,32,56,0.08)] backdrop-blur md:p-6">
            {!activeAccount ? (
              <EmptyState loading={loading} />
            ) : (
              <div className="space-y-6">
                <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                  <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(242,125,38,0.24),_transparent_38%),linear-gradient(135deg,#f5f0e8_0%,#eef4ff_54%,#ffffff_100%)] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-ink/45">Account Brief</p>
                        <h2 className="mt-3 font-serif text-4xl italic">{activeAccount.companyName}</h2>
                        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/75">
                          {activeAccount.executiveSummary.headline}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-white/90 px-4 py-3 shadow-sm">
                        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">{modeLabel}</p>
                        <p className="mt-2 text-3xl font-semibold">{activeAccount.propensityScore}</p>
                        <p className="text-xs text-ink/45">Propensity Score</p>
                        <button
                          onClick={generateActivePlaybook}
                          disabled={playbookLoading}
                          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {playbookLoading ? <Loader2 className="size-4 animate-spin" /> : <Briefcase className="size-4" />}
                          {playbooks[activeAccountKey] ? "Refresh playbook" : "Generate playbook"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <MetricCard label="IT Spend Range" value={activeAccount.itSpendIntelligence.estimatedRange} icon={BadgeDollarSign} />
                      <MetricCard label="Momentum" value={activeAccount.itSpendIntelligence.yoyMomentum} icon={ArrowRight} />
                      <MetricCard label="Budget Priority" value={activeAccount.itSpendIntelligence.budgetPriority} icon={Briefcase} />
                    </div>
                    <div className="mt-6 rounded-3xl border border-white/70 bg-white/70 p-5">
                      <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Why now</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink/75">{activeAccount.executiveSummary.whyNow}</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <ScorePanel account={activeAccount} />
                    <ModePanel account={activeAccount} loading={loading} onRefresh={refreshActiveAccount} />
                  </div>
                </section>

                <nav className="flex flex-wrap gap-2 rounded-3xl border border-line/10 bg-[#f8f8f6] p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition",
                        activeTab === tab.id ? "bg-ink text-white shadow-sm" : "text-ink/55 hover:bg-white"
                      )}
                    >
                      <tab.icon className="size-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                {activeTab === "brief" && <BriefTab account={activeAccount} />}
                {activeTab === "signals" && <SignalsTab account={activeAccount} />}
                {activeTab === "personas" && (
                  <PersonasTab
                    account={activeAccount}
                    copiedId={copiedId}
                    copy={copy}
                    updatePersonaEmail={updatePersonaEmail}
                  />
                )}
                {activeTab === "plays" && <PlaysTab account={activeAccount} />}
                {activeTab === "playbook" && activePlaybook && (
                  <PlaybookTab
                    account={activeAccount}
                    playbook={activePlaybook}
                    loading={playbookLoading}
                    error={playbookError}
                    copiedId={copiedId}
                    onGenerate={generateActivePlaybook}
                    onExportDeck={exportActiveDeck}
                    onCopyOutline={() => copy(renderDeckOutlineAsText(activePlaybook), "playbook-outline")}
                    onCopyFullBrief={() => copy(buildPlaybookExport(activeAccount, activePlaybook), "playbook-brief")}
                  />
                )}
                {activeTab === "benchmarking" && <BenchmarkingTab account={activeAccount} />}
                {activeTab === "documentStudio" && activePlaybook && (
                  <DocumentStudioTab
                    account={activeAccount}
                    playbook={activePlaybook}
                    documents={activeDocuments}
                    slides={activeSlides}
                    documentView={documentView}
                    documentLoading={documentLoading}
                    slideLoading={slideLoading}
                    documentError={documentError}
                    onSetDocumentView={setDocumentView}
                    onGenerateDocuments={generateAccountDocuments}
                    onDownloadMarkdown={(mode) =>
                      activeDocuments
                        ? downloadMarkdown(
                            mode === "executive" ? activeDocuments.executiveMarkdown : activeDocuments.technicalMarkdown,
                            `${activeAccount.companyName.replace(/\s+/g, "_")}_${mode}_playbook.md`
                          )
                        : undefined
                    }
                    onSummarizeSlides={summarizeActiveDocument}
                    onExportSlides={exportDocumentSlides}
                  />
                )}
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}

function LogoBadge({ account }: { account: ProspectData }) {
  const logoUrl = getCompanyLogoUrl(account);
  const initials = getCompanyInitials(account.companyName);

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line/10 bg-[#eef4ff] text-sm font-semibold text-ink/70">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${account.companyName} logo`}
          className="size-full object-cover"
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
            const fallback = target.parentElement?.querySelector("[data-logo-fallback]") as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <span data-logo-fallback style={{ display: logoUrl ? "none" : "flex" }} className="size-full items-center justify-center">
        {initials}
      </span>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center rounded-[28px] border border-dashed border-line/15 bg-[radial-gradient(circle_at_center,_rgba(18,49,90,0.07),_transparent_55%)] px-6 text-center">
      {loading ? (
        <Loader2 className="size-10 animate-spin text-accent" />
      ) : (
        <div className="rounded-full border border-line/15 p-6 text-ink/35">
          <Factory className="size-12" />
        </div>
      )}
      <h2 className="mt-6 font-serif text-3xl italic">Build a fresh account plan</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/55">
        Search for a target company and the app will assemble a public-data prospecting view across IT spend momentum,
        strategic AI initiatives, likely decision personas, Google Cloud product fit, detailed Cognizant co-sell plays,
        and a presentation-ready executive playbook.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-ink/45">
        <Icon className="size-4" />
        <p className="text-[11px] font-mono uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-3 text-lg font-medium text-ink">{value}</p>
    </div>
  );
}

function ScorePanel({ account }: { account: ProspectData }) {
  const chartData = [
    { name: "Fit", value: account.propensityScore },
    { name: "Gap", value: 100 - account.propensityScore }
  ];

  return (
    <div className="rounded-[28px] border border-line/10 bg-[#f6f8ff] p-5">
      <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Signal Strength</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius={38} outerRadius={58} strokeWidth={0}>
                <Cell fill="#f27d26" />
                <Cell fill="#cdd5e2" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-4xl font-semibold">{account.propensityScore}</p>
          <p className="mt-1 text-sm text-ink/55">Overall propensity to pursue a Google Cloud AI + Cognizant motion</p>
          <div className="mt-4 space-y-2 text-sm text-ink/65">
            <div className="flex items-center gap-2"><Check className="size-4 text-green-600" />Strategic AI initiative signal present</div>
            <div className="flex items-center gap-2"><Check className="size-4 text-green-600" />Persona pathways identified</div>
            <div className="flex items-center gap-2"><Check className="size-4 text-green-600" />Co-sell product alignment mapped</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModePanel({
  account,
  loading,
  onRefresh
}: {
  account: ProspectData;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-line/10 bg-[#fbf6ef] p-5">
      <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Research mode</p>
      <div className="mt-3 flex items-center gap-3">
        <div className={cn("rounded-full px-3 py-1 text-xs font-medium", account.researchMetadata.mode === "live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
          {account.researchMetadata.mode === "live" ? "Live Research" : "Demo Fallback"}
        </div>
        <p className="text-xs text-ink/45">{new Date(account.researchMetadata.generatedAt).toLocaleString()}</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">{account.researchMetadata.note}</p>
      {account.researchMetadata.mode === "demo" && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Refresh live research
        </button>
      )}
    </div>
  );
}

function BriefTab({ account }: { account: ProspectData }) {
  return (
    <div className="space-y-4">
      <Panel title="Strategic AI initiatives" icon={BrainCircuit}>
        <p className="text-sm leading-relaxed text-ink/72">{account.strategicAiInitiatives.summary}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {account.strategicAiInitiatives.programs.map((program) => (
            <div key={program} className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4 text-sm">{program}</div>
          ))}
        </div>
      </Panel>
      <Panel title="Technographic posture" icon={Blocks}>
        <FourListGrid
          items={[
            { label: "Cloud footprint", values: account.technographics.cloudFootprint },
            { label: "Data estate", values: account.technographics.dataEstate },
            { label: "CX signals", values: account.technographics.contactCenterSignals },
            { label: "Modernization", values: account.technographics.modernizationSignals }
          ]}
        />
      </Panel>
    </div>
  );
}

function SignalsTab({ account }: { account: ProspectData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Panel title="IT spend intelligence" icon={BadgeDollarSign}>
        <div className="grid gap-3">
          {account.itSpendIntelligence.signals.map((signal) => (
            <SignalCard key={signal} label={signal} />
          ))}
        </div>
      </Panel>
      <Panel title="Public signal scanner" icon={Search}>
        <div className="space-y-3">
          {account.publicSignals.map((signal) => (
            <div key={signal.label} className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{signal.label}</p>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-mono uppercase", signal.strength === "high" ? "bg-green-100 text-green-700" : signal.strength === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
                  {signal.strength}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{signal.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PersonasTab({
  account,
  copiedId,
  copy,
  updatePersonaEmail
}: {
  account: ProspectData;
  copiedId: string | null;
  copy: (text: string, id: string) => void;
  updatePersonaEmail: (personaIndex: number, value: string) => void;
}) {
  if (!account.personas.length) {
    return (
      <Panel title="Persona strategy" icon={Users}>
        <div className="rounded-[24px] border border-dashed border-line/15 bg-[#faf9f6] p-6 text-sm leading-relaxed text-ink/62">
          No persona research is available yet for this account. Refresh live research to pull named public decision-makers
          or role-based stakeholder hypotheses into the workspace.
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {account.personas.map((persona, index) => (
        <div key={`${persona.name}-${persona.title}-${index}`} className="grid gap-4 rounded-[28px] border border-line/10 bg-white p-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          {(() => {
            const isHypothesis = persona.sourceLabel === "Public-role hypothesis";
            const displayName = isHypothesis ? persona.name : persona.name;
            const displayTitle = isHypothesis ? `${persona.function} stakeholder hypothesis` : persona.title;

            return (
              <>
          <div className="rounded-[24px] bg-[#0c2646] p-5 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{persona.buyingRole}</p>
            <h3 className="mt-3 font-serif text-3xl italic leading-tight">{displayName}</h3>
            <p className="mt-2 text-base text-white/82">{displayTitle}</p>
            <p className="mt-1 text-sm text-white/70">{persona.function} • {persona.seniority}</p>
            <div className="mt-6 space-y-3 text-sm text-white/78">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Ideal channels</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {persona.idealChannels.map((channel) => (
                    <span key={channel} className="rounded-sm border border-white/15 bg-white/6 px-3 py-2 font-mono text-xs text-white">
                      {channel}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Public source</p>
                {persona.profileUrl ? (
                  <a
                    href={persona.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-white hover:text-white/80"
                  >
                    {persona.sourceLabel || "Public profile"}
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-white/70">{persona.sourceLabel || "Named public source not captured"}</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/6 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">LinkedIn discovery query</p>
                <p className="mt-2 break-all font-mono text-xs">{persona.linkedinSearchQuery}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">Why engage?</p>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/82">{persona.whyNow}</p>
              </div>
              <div className="rounded-[24px] border border-accent/20 bg-[#fff6ef] p-5">
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-accent">Tailored strategy</p>
                <p className="mt-4 text-lg italic leading-relaxed text-ink/80">"{persona.tailoredStrategy}"</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <InfoListCard title="Likely KPIs" items={persona.kpis} icon={BadgeDollarSign} />
              <InfoListCard title="Potential objections" items={persona.objections} icon={X} />
              <InfoListCard title="How to address objections" items={persona.objectionHandling} icon={Check} />
              <InfoListCard title="Cues and priorities" items={[...persona.likelyPriorities, ...persona.evidence].slice(0, 6)} icon={Search} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <InfoListCard title="Likely priorities" items={persona.likelyPriorities} icon={ClipboardList} />
              <InfoListCard title="Outreach angles" items={persona.outreachAngles} icon={Lightbulb} />
            </div>
          </div>
              </>
            );
          })()}
        </div>
      ))}
      <div className="rounded-[28px] border border-line/10 bg-[#faf9f6] p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium">Persona discovery note</p>
          <button
            onClick={() => copy(account.personas.map((persona) => `${persona.name} | ${persona.title}: ${persona.linkedinSearchQuery}`).join("\n"), "persona-searches")}
            className="flex items-center gap-2 text-sm text-ink/55 hover:text-accent"
          >
            {copiedId === "persona-searches" ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            Copy searches
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          Persona cards prioritize named people from public sources when available and fall back to role-based stakeholder
          hypotheses when live public identity signals are too sparse. Keep collection compliant with public-data and
          approved workflow rules rather than scraping private profile data directly.
        </p>
      </div>
    </div>
  );
}

function PlaysTab({ account }: { account: ProspectData }) {
  const cognizantMatches = account.productMatches.filter((match) => match.partner === "Cognizant" || match.product.toLowerCase().includes("cognizant"));
  const googleMatches = account.productMatches.filter((match) => !cognizantMatches.includes(match));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <Panel title="Cognizant AI offerings" icon={BrainCircuit}>
          <div className="space-y-4">
            {cognizantMatches.map((match) => (
              <OfferingPlayCard key={match.product} match={match} accent="cognizant" />
            ))}
          </div>
        </Panel>

        <Panel title="Google Cloud AI offerings" icon={Blocks}>
          <div className="space-y-4">
            {googleMatches.map((match) => (
              <OfferingPlayCard key={match.product} match={match} accent="google" />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Account action plan" icon={ArrowRight}>
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">Why Cognizant now</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/72">{account.accountPlan.whyCognizantNow}</p>
          </div>
          <InfoListCard title="Discovery questions" items={account.accountPlan.discoveryQuestions} icon={Search} />
          <InfoListCard title="Next actions" items={account.accountPlan.nextActions} icon={ArrowRight} />
          <InfoListCard title="Whitespace hypotheses" items={account.accountPlan.whitespaceHypotheses} icon={Lightbulb} />
        </div>
      </Panel>
    </div>
  );
}

function PlaybookTab({
  account,
  playbook,
  loading,
  error,
  copiedId,
  onGenerate,
  onExportDeck,
  onCopyOutline,
  onCopyFullBrief
}: {
  account: ProspectData;
  playbook: CoSellPlaybook;
  loading: boolean;
  error: string | null;
  copiedId: string | null;
  onGenerate: () => void;
  onExportDeck: () => void;
  onCopyOutline: () => void;
  onCopyFullBrief: () => void;
}) {
  return (
    <div className="space-y-4">
      <Panel title="Executive playbook" icon={Briefcase}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed text-ink/72">{playbook.summary.headline}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/62">{playbook.summary.opportunity}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#eef3fb] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#153e76]">
                {playbook.research.mode === "live" ? "Live model-backed playbook" : "Deterministic fallback playbook"}
              </span>
              <span className="rounded-full bg-[#fbf6ef] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-accent">
                {playbook.input.goals.join(" • ")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Refresh playbook
            </button>
            <button
              onClick={onExportDeck}
              className="inline-flex items-center gap-2 rounded-2xl border border-line/15 bg-white px-4 py-3 text-sm text-ink/70 transition hover:text-accent"
            >
              <ArrowRight className="size-4" />
              Export PPTX
            </button>
            <button
              onClick={onCopyOutline}
              className="inline-flex items-center gap-2 rounded-2xl border border-line/15 bg-white px-4 py-3 text-sm text-ink/70 transition hover:text-accent"
            >
              {copiedId === "playbook-outline" ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              Copy slides outline
            </button>
            <button
              onClick={onCopyFullBrief}
              className="inline-flex items-center gap-2 rounded-2xl border border-line/15 bg-white px-4 py-3 text-sm text-ink/70 transition hover:text-accent"
            >
              {copiedId === "playbook-brief" ? <Check className="size-4 text-green-600" /> : <ClipboardList className="size-4" />}
              Copy full export
            </button>
          </div>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricCard label="Industry" value={playbook.input.industry.replace("-", " ")} icon={Building2} />
          <MetricCard label="Buying mode" value={playbook.input.buyingMode} icon={ArrowRight} />
          <MetricCard label="Generated" value={new Date(playbook.generatedAt).toLocaleString()} icon={Sparkles} />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Account signals" icon={Search}>
          <div className="space-y-3">
            {playbook.accountSignals.map((signal) => (
              <SignalCard key={signal} label={signal} />
            ))}
          </div>
        </Panel>

        <Panel title="Messaging" icon={Lightbulb}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Executive talk track</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/72">{playbook.messaging.executiveTalkTrack}</p>
            </div>
            <div className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Technical talk track</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/72">{playbook.messaging.technicalTalkTrack}</p>
            </div>
            <div className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Email opening</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/72">{playbook.messaging.emailOpening}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Portfolio map" icon={Blocks}>
        <div className="grid gap-4 xl:grid-cols-2">
          {playbook.portfolioMap.map((offer) => {
            const catalogEntry = findOfferingCatalogEntry(offer.name);
            return (
              <div key={`${offer.provider}-${offer.name}`} className="rounded-[24px] border border-line/10 bg-[#faf9f6] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">{offer.provider}</p>
                    <h3 className="mt-2 text-xl font-medium text-ink">{offer.name}</h3>
                    <p className="mt-1 text-sm text-ink/55">{offer.category}</p>
                  </div>
                  {catalogEntry && (
                    <a
                      href={catalogEntry.deepDiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-line/10 bg-white px-4 py-3 text-sm text-ink/70 hover:text-accent"
                    >
                      Official link
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink/72">{offer.summary}</p>
                <div className="mt-4 rounded-2xl border border-accent/15 bg-accent/5 p-4 text-sm text-ink/75">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent">Why it fits</p>
                  <p className="mt-2">{offer.whyItFits}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="space-y-4">
        {playbook.plays.map((play) => (
          <Panel key={play.title} title={play.title} icon={BrainCircuit}>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Buyer + motion</p>
                  <p className="mt-2 text-base font-medium text-ink">{play.buyer}</p>
                  <p className="mt-1 text-sm text-ink/62">{play.motion}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoListCard title="Proof points" items={play.proofPoints} icon={Check} />
                  <InfoListCard title="Discovery questions" items={play.discoveryQuestions} icon={Search} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-line/10 bg-white p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Pain</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/72">{play.pain}</p>
                </div>
                <div className="rounded-2xl border border-line/10 bg-white p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Value hypothesis</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/72">{play.valueHypothesis}</p>
                </div>
                <div className="rounded-2xl border border-[#153e76]/12 bg-[#eef3fb] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#153e76]">Joint pitch</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{play.jointPitch}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <OfferReferenceCard label="Google Cloud offer" value={play.googleCloudOffer} />
                  <OfferReferenceCard label="Cognizant offer" value={play.cognizantOffer} />
                </div>
                <InfoListCard title="First meeting agenda" items={play.firstMeetingAgenda} icon={ClipboardList} />
                <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4 text-sm text-ink/75">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent">Next step</p>
                  <p className="mt-2">{play.nextStep}</p>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="30-day action plan" icon={ArrowRight}>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoListCard title="First 30 days" items={playbook.actionPlan.first30Days} icon={ArrowRight} />
            <InfoListCard title="Partner actions" items={playbook.actionPlan.partnerActions} icon={Users} />
            <InfoListCard title="Assets to bring" items={playbook.actionPlan.assetsToBring} icon={ClipboardList} />
          </div>
        </Panel>

        <Panel title="Sources" icon={Search}>
          <div className="space-y-3">
            {playbook.research.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-line/10 bg-[#faf9f6] p-4 transition hover:border-accent/25 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{source.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink/45">{source.publisher}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/62">{source.note}</p>
                  </div>
                  <ExternalLink className="mt-1 size-4 shrink-0 text-ink/45" />
                </div>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function DocumentStudioTab({
  account,
  playbook,
  documents,
  slides,
  documentView,
  documentLoading,
  slideLoading,
  documentError,
  onSetDocumentView,
  onGenerateDocuments,
  onDownloadMarkdown,
  onSummarizeSlides,
  onExportSlides
}: {
  account: ProspectData;
  playbook: CoSellPlaybook;
  documents: GeneratedDocuments | null;
  slides: { executive?: SlideSummary; technical?: SlideSummary };
  documentView: DocumentMode;
  documentLoading: boolean;
  slideLoading: boolean;
  documentError: string | null;
  onSetDocumentView: (mode: DocumentMode) => void;
  onGenerateDocuments: () => void;
  onDownloadMarkdown: (mode: DocumentMode) => void;
  onSummarizeSlides: (mode: DocumentMode) => void;
  onExportSlides: (mode: DocumentMode) => void;
}) {
  const activeMarkdown = documents
    ? documentView === "executive"
      ? documents.executiveMarkdown
      : documents.technicalMarkdown
    : "";
  const activeSlides = slides[documentView];

  return (
    <Panel title="Document studio" icon={ClipboardList}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed text-ink/72">
              Generate long-form executive and technical playbook documents from the current account and co-sell motion,
              then summarize them into presentation-ready slides.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#eef3fb] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#153e76]">
                {account.companyName}
              </span>
              <span className="rounded-full bg-[#fbf6ef] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-accent">
                {playbook.input.goals.join(" • ")}
              </span>
              {documents && (
                <span className="rounded-full border border-line/10 bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
                  {documents.mode === "live" ? "Gemini document studio" : "Fallback document studio"}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onGenerateDocuments}
            disabled={documentLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {documentLoading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
            {documents ? "Refresh detailed docs" : "Generate executive + technical docs"}
          </button>
        </div>

        {documentError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{documentError}</div>
        )}

        {documents ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSetDocumentView("executive")}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm transition",
                    documentView === "executive" ? "bg-[#10b981] text-white" : "border border-line/15 bg-white text-ink/70"
                  )}
                >
                  Executive strategy view
                </button>
                <button
                  onClick={() => onSetDocumentView("technical")}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm transition",
                    documentView === "technical" ? "bg-[#7c4dff] text-white" : "border border-line/15 bg-white text-ink/70"
                  )}
                >
                  Technical architecture view
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onDownloadMarkdown(documentView)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-line/15 bg-white px-4 py-3 text-sm text-ink/70 transition hover:text-accent"
                >
                  <Download className="size-4" />
                  Download markdown
                </button>
                <button
                  onClick={() => onSummarizeSlides(documentView)}
                  disabled={slideLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4f7cff] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {slideLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Summarize into {documentView === "executive" ? "Executive" : "Technical"} PPT
                </button>
                {activeSlides && (
                  <>
                    <button
                      onClick={() => onExportSlides(documentView)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accent"
                    >
                      <ArrowRight className="size-4" />
                      Download full presentation
                    </button>
                    <a
                      href="https://drive.google.com/drive/u/0/my-drive"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-line/15 bg-white px-4 py-3 text-sm text-ink/70 transition hover:text-accent"
                    >
                      <ExternalLink className="size-4" />
                      Open Google Drive
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-line/10 bg-[#fbfcff] p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex justify-end">
                <span className="rounded-full border border-line/10 bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/55">
                  {documentView === "executive" ? "Executive strategy document" : "Technical architecture document"}
                </span>
              </div>
              <div className="max-w-none [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:leading-tight [&_h1]:text-ink [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:italic [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-ink/80 [&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-ink/80">
                <ReactMarkdown>{activeMarkdown}</ReactMarkdown>
              </div>
            </div>

            {activeSlides && activeSlides.slides?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl italic text-ink">
                    {documentView === "executive" ? "Executive" : "Technical"} slide preview
                  </h3>
                  <p className="text-sm text-ink/55">{activeSlides.slides.length} slides prepared</p>
                </div>

                {activeSlides.slides.map((slide, index) => (
                  <div key={`${slide.title}-${index}`} className="rounded-[24px] border border-line/10 bg-[#132238] p-6 text-white">
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">Slide {index + 1}</p>
                    <h4 className="mt-3 text-3xl font-semibold leading-tight text-[#74a3ff]">{slide.title}</h4>
                    {slide.subtitle ? <p className="mt-3 text-sm font-medium text-white/70">{slide.subtitle}</p> : null}
                    <ul className="mt-5 space-y-3">
                      {slide.bulletPoints.map((point) => (
                        <li key={point} className="text-sm leading-relaxed text-white/88">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line/15 bg-[#faf9f6] p-6 text-sm leading-relaxed text-ink/62">
            Generate the detailed document set to unlock the two missing views from the earlier app: executive strategy
            narrative and technical architecture playbook, each with PPT summarization support.
          </div>
        )}
      </div>
    </Panel>
  );
}

function OfferReferenceCard({ label, value }: { label: string; value: string }) {
  const catalogEntry = findOfferingCatalogEntry(value);

  return (
    <div className="rounded-2xl border border-line/10 bg-white p-4">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
      {catalogEntry && (
        <a
          href={catalogEntry.deepDiveUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-accent"
        >
          {catalogEntry.deepDiveLabel}
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function OfferingPlayCard({
  match,
  accent
}: {
  match: ProspectData["productMatches"][number];
  accent: "cognizant" | "google";
}) {
  const catalogEntry = findOfferingCatalogEntry(match.product);
  const deepDiveUrl = match.deepDiveUrl || catalogEntry?.deepDiveUrl;
  const deepDiveLabel = match.deepDiveLabel || catalogEntry?.deepDiveLabel || "Official deep dive";

  return (
    <div className={cn(
      "rounded-[24px] border p-5",
      accent === "cognizant" ? "border-[#153e76]/15 bg-[#eef3fb]" : "border-line/10 bg-[#faf9f6]"
    )}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">{match.partner}</p>
          <h3 className="mt-2 text-xl font-medium">{match.product}</h3>
        </div>
        <div className={cn(
          "rounded-full px-3 py-1 text-xs font-mono text-white",
          accent === "cognizant" ? "bg-[#153e76]" : "bg-ink"
        )}>
          {match.fitScore}/100
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/72">{match.rationale}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line/10 bg-white p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Reason for need</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/72">
            {match.reasonForNeed || "Public signals indicate an immediate need for stronger execution, governance, and AI operating discipline."}
          </p>
        </div>
        <div className="rounded-2xl border border-line/10 bg-white p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Account benefit</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/72">
            {match.accountBenefit || "The account can accelerate business outcomes by moving from AI ambition to measurable operating change."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#153e76]/12 bg-white p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#153e76]">Why Cognizant</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/72">
            {match.whyCognizant || "Cognizant provides delivery capacity, accelerators, and enterprise change management around the solution."}
          </p>
        </div>
        <div className="rounded-2xl border border-line/10 bg-white p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Why Google Cloud</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/72">
            {match.whyGoogleCloud || "Google Cloud provides the AI, data, and platform foundation needed to productionize the motion."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-accent/15 bg-accent/5 p-4 text-sm text-ink/75">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent">Activation plan</p>
        <p className="mt-2">{match.activationPlan}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <ul className="grid flex-1 gap-2 md:grid-cols-3">
          {(match.evidenceSignals?.length ? match.evidenceSignals : match.proofPoints).map((point) => (
            <li key={point} className="rounded-2xl border border-line/10 bg-white px-3 py-3 text-sm">{point}</li>
          ))}
        </ul>
        {deepDiveUrl && (
          <a
            href={deepDiveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70 hover:text-accent"
          >
            {deepDiveLabel}
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function BenchmarkingTab({ account }: { account: ProspectData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel title="Competitive benchmark" icon={Building2}>
        {account.competitors.length ? (
          <div className="space-y-4">
            {account.competitors.map((competitor) => (
              <div key={competitor.name} className="rounded-[24px] border border-line/10 bg-[#faf9f6] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-medium">{competitor.name}</h3>
                  <span className="rounded-full bg-[#0c2646] px-3 py-1 text-[11px] font-mono uppercase text-white">
                    Peer
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink/72">{competitor.benchmarkSummary}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-line/10 bg-white p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">Pressure point</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/72">{competitor.pressurePoint}</p>
                  </div>
                  <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-accent">Cognizant angle</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/72">{competitor.cognizantAngle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-line/15 bg-[#faf9f6] p-6 text-sm leading-relaxed text-ink/62">
            Live competitor benchmarking is still being repaired for this account. The app will only show named
            competitors here once live research returns real companies instead of placeholders.
          </div>
        )}
      </Panel>
      <Panel title="How to use this benchmark" icon={ArrowRight}>
        <div className="space-y-5">
          <InfoListCard
            title="Talk track"
            items={[
              "Show where peer narratives are stronger on AI execution, not just ambition.",
              "Tie the gap back to operating-model discipline, delivery capacity, and measurable outcomes.",
              "Use the benchmark to create urgency for a focused Google Cloud AI plus Cognizant pilot."
            ]}
            icon={Lightbulb}
          />
          <InfoListCard
            title="Executive use"
            items={[
              "Anchor the meeting on external pressure rather than internal shortcomings.",
              "Use named competitors to validate why the account should act now.",
              "Translate benchmark pressure into one or two realistic co-sell plays."
            ]}
            icon={Users}
          />
          <InfoListCard
            title="Caution"
            items={[
              "Treat public competitor signals as directional, not absolute internal truth.",
              "Validate the benchmark with the account team before using it in executive outreach.",
              "Avoid overclaiming specific initiatives unless the cited sources support them directly."
            ]}
            icon={Check}
          />
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-line/10 bg-white p-5 shadow-[0_12px_30px_rgba(25,28,33,0.04)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-2xl bg-accent/10 p-2 text-accent">
          <Icon className="size-4" />
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SignalCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4 text-sm leading-relaxed text-ink/72">
      {label}
    </div>
  );
}

function FourListGrid({
  items
}: {
  items: {
    label: string;
    values: string[];
  }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-line/10 bg-[#faf9f6] p-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45">{item.label}</p>
          <ul className="mt-3 space-y-2">
            {item.values.map((value) => (
              <li key={value} className="flex gap-2 text-sm text-ink/72">
                <span className="mt-1 size-1.5 rounded-full bg-accent" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InfoListCard({
  title,
  items,
  icon: Icon
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[24px] border border-line/10 bg-[#faf9f6] p-4">
      <div className="flex items-center gap-2 text-ink/55">
        <Icon className="size-4" />
        <p className="text-[11px] font-mono uppercase tracking-[0.2em]">{title}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink/72">
            <span className="mt-1 size-1.5 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
