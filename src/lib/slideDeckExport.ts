import PptxGenJS from "pptxgenjs";
import type { SlideSummary } from "./documentStudio";

const COLORS = {
  navy: "0F1F36",
  blue: "4285F4",
  yellow: "FBBC04",
  green: "34A853",
  ink: "233247",
  muted: "607086",
  panel: "F7F9FC",
  line: "DCE4EE",
  white: "FFFFFF"
};

function safeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "playbook";
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function shortenText(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.slice(0, maxLength);
  const stop = Math.max(truncated.lastIndexOf(". "), truncated.lastIndexOf("; "), truncated.lastIndexOf(", "));
  return `${(stop > 90 ? truncated.slice(0, stop) : truncated).trim()}...`;
}

function normalizeBullets(points: string[]) {
  return points
    .map((point) => shortenText(point, 150))
    .filter(Boolean)
    .slice(0, 4);
}

function addHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.7,
    y: 0.42,
    w: 11.4,
    h: 0.52,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
    fit: "shrink"
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7,
      y: 0.98,
      w: 11.4,
      h: 0.32,
      fontFace: "Aptos",
      fontSize: 11,
      color: COLORS.muted,
      fit: "shrink"
    });
  }
}

function addBodyPanel(slide: PptxGenJS.Slide) {
  slide.addShape("roundRect", {
    x: 0.7,
    y: 1.42,
    w: 11.8,
    h: 4.95,
    rectRadius: 0.08,
    fill: { color: COLORS.panel },
    line: { color: COLORS.line, width: 1 }
  });
}

function addBullets(slide: PptxGenJS.Slide, bullets: string[], startY = 1.78) {
  slide.addText(
    bullets.map((bullet) => ({
      text: bullet,
      options: { bullet: { indent: 16 }, breakLine: true, paraSpaceAfter: 10 }
    })),
    {
      x: 1.02,
      y: startY,
      w: 11.0,
      h: 4.25,
      fontFace: "Aptos",
      fontSize: 16,
      color: COLORS.ink,
      margin: 0,
      valign: "top",
      fit: "shrink"
    }
  );
}

export async function exportSlideSummaryToPptx(
  slidesData: SlideSummary,
  contextData: { targetCompany: string; industry: string; painPoint: string; mode: "executive" | "technical" }
) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Codex";
  pptx.company = "Cognizant & Google Cloud";
  pptx.subject = `${contextData.targetCompany} ${contextData.mode} playbook`;
  pptx.title = `${contextData.targetCompany} ${contextData.mode === "executive" ? "Executive" : "Technical"} Presentation`;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };

  pptx.defineSlideMaster({
    title: "CONTENT",
    background: { color: COLORS.white },
    objects: [
      { rect: { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: COLORS.blue } } },
      { rect: { x: 0, y: 0.08, w: 13.333, h: 0.04, fill: { color: COLORS.yellow } } },
      { line: { x: 0.7, y: 6.82, w: 11.9, h: 0, line: { color: COLORS.line, width: 1 } } },
      {
        text: {
          text: "Cognizant + Google Cloud | Document Studio Deck",
          options: { x: 0.7, y: 6.9, w: 6.8, h: 0.22, fontFace: "Aptos", fontSize: 9, color: COLORS.muted }
        }
      }
    ],
    slideNumber: { x: 12.0, y: 6.9, color: COLORS.muted, fontSize: 9, fontFace: "Aptos", align: "right" }
  });

  const cover = pptx.addSlide();
  cover.background = { color: COLORS.navy };
  cover.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: COLORS.green } });
  cover.addText("Google Cloud + Cognizant", {
    x: 0.9,
    y: 0.92,
    w: 5.0,
    h: 0.36,
    fontFace: "Aptos",
    fontSize: 18,
    bold: true,
    color: COLORS.blue
  });
  cover.addText(contextData.mode === "executive" ? "Executive Sales Playbook" : "Technical Architecture Playbook", {
    x: 0.9,
    y: 1.55,
    w: 7.8,
    h: 0.95,
    fontFace: "Aptos Display",
    fontSize: 30,
    bold: true,
    color: COLORS.white,
    fit: "shrink"
  });
  cover.addText(contextData.targetCompany, {
    x: 0.9,
    y: 2.62,
    w: 6.2,
    h: 0.48,
    fontFace: "Aptos",
    fontSize: 22,
    bold: true,
    color: COLORS.white
  });
  cover.addShape("roundRect", {
    x: 7.85,
    y: 1.1,
    w: 4.4,
    h: 3.0,
    rectRadius: 0.1,
    fill: { color: "162944", transparency: 5 },
    line: { color: "38506E", width: 1 }
  });
  cover.addText(`Industry\n${contextData.industry}`, {
    x: 8.2,
    y: 1.45,
    w: 3.6,
    h: 0.75,
    fontFace: "Aptos",
    fontSize: 16,
    bold: true,
    color: COLORS.white,
    breakLine: true
  });
  cover.addText(`Core challenge\n${shortenText(contextData.painPoint, 160)}`, {
    x: 8.2,
    y: 2.3,
    w: 3.6,
    h: 1.25,
    fontFace: "Aptos",
    fontSize: 14,
    color: "D3DCEC",
    breakLine: true,
    fit: "shrink"
  });

  slidesData.slides.forEach((slideInfo) => {
    const title = shortenText(slideInfo.title || "Key Insight", 90);
    const subtitle = slideInfo.subtitle ? shortenText(slideInfo.subtitle, 120) : undefined;
    const bulletPages = chunk(normalizeBullets(slideInfo.bulletPoints), 4);
    const pages = bulletPages.length ? bulletPages : [[]];

    pages.forEach((page, pageIndex) => {
      const slide = pptx.addSlide({ masterName: "CONTENT" });
      addHeader(slide, pageIndex === 0 ? title : `${title} (cont.)`, subtitle);
      addBodyPanel(slide);
      addBullets(slide, page.length ? page : ["No additional content was returned for this section."], 1.82);
    });
  });

  const close = pptx.addSlide();
  close.background = { color: COLORS.navy };
  close.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: COLORS.green } });
  close.addText("Next move", {
    x: 0,
    y: 2.18,
    w: 13.333,
    h: 0.58,
    align: "center",
    fontFace: "Aptos Display",
    fontSize: 32,
    bold: true,
    color: COLORS.white
  });
  close.addText("Use this deck in Google Slides as a clean discussion starter, then tailor the final version to the account team.", {
    x: 1.5,
    y: 3.05,
    w: 10.3,
    h: 0.74,
    align: "center",
    fontFace: "Aptos",
    fontSize: 18,
    color: "D3DCEC",
    fit: "shrink"
  });

  await pptx.writeFile({
    fileName: `${safeName(`${contextData.targetCompany}-${contextData.mode}-sales-play`)}.pptx`
  });
}
