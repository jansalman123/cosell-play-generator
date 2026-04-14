import type { ProspectData } from "../lib/prospect";

export type { ProspectData } from "../lib/prospect";

const CLIENT_CACHE_PREFIX = "prospector_live_cache:v5-persistence-heatmap:";
const CLIENT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function normalizeCompanyName(companyName: string): string {
  return companyName.trim().toLowerCase();
}

function hasGenericPersonaNames(data: ProspectData): boolean {
  const company = normalizeCompanyName(data.companyName);
  return data.personas.some((persona) => {
    const name = normalizeCompanyName(persona.name);
    return (
      !name ||
      name.startsWith(company) ||
      name.includes("executive sponsor") ||
      name.includes("platform owner") ||
      name.includes("business champion")
    );
  });
}

function hasGenericCompetitorNames(data: ProspectData): boolean {
  return data.competitors.some((competitor) => {
    const name = normalizeCompanyName(competitor.name);
    return (
      !name ||
      name.includes("peer benchmark") ||
      name.includes("competitor a") ||
      name.includes("competitor b") ||
      name.includes("competitor c")
    );
  });
}

function hasReusableLiveQuality(data: ProspectData): boolean {
  return (
    data.researchMetadata.mode === "live" &&
    !hasGenericPersonaNames(data) &&
    !hasGenericCompetitorNames(data)
  );
}

function readClientCache(companyName: string): ProspectData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${CLIENT_CACHE_PREFIX}${normalizeCompanyName(companyName)}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { expiresAt: number; data: ProspectData };
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(`${CLIENT_CACHE_PREFIX}${normalizeCompanyName(companyName)}`);
      return null;
    }

    const data = {
      ...parsed.data,
      researchMetadata: {
        ...parsed.data.researchMetadata,
        cached: true,
        cacheExpiresAt: new Date(parsed.expiresAt).toISOString()
      }
    };
    if (!hasReusableLiveQuality(data)) {
      window.localStorage.removeItem(`${CLIENT_CACHE_PREFIX}${normalizeCompanyName(companyName)}`);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function writeClientCache(companyName: string, data: ProspectData) {
  if (typeof window === "undefined" || !hasReusableLiveQuality(data)) return;

  const expiresAt = Date.now() + CLIENT_CACHE_TTL_MS;
  try {
    window.localStorage.setItem(
      `${CLIENT_CACHE_PREFIX}${normalizeCompanyName(companyName)}`,
      JSON.stringify({
        expiresAt,
        data: {
          ...data,
          researchMetadata: {
            ...data.researchMetadata,
            cached: true,
            cacheExpiresAt: new Date(expiresAt).toISOString()
          }
        }
      })
    );
  } catch {
    // Ignore cache write failures and keep live analysis working.
  }
}

export async function analyzeCompany(companyName: string, options?: { forceFresh?: boolean }): Promise<ProspectData> {
  if (!options?.forceFresh) {
    const cached = readClientCache(companyName);
    if (cached) {
      return cached;
    }
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ companyName })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to analyze company.");
  }

  const data = payload.data as ProspectData;
  writeClientCache(companyName, data);
  return data;
}
