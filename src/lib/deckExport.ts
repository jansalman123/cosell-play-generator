import PptxGenJS from "pptxgenjs";
import type { CoSellPlaybook } from "./playbook";

const COLORS = {
  ink: "17263B",
  mist: "627389",
  accent: "EA7A17",
  accentSoft: "FCE8D4",
  line: "D8DEE8",
  white: "FFFFFF",
  panel: "FFFDFA",
  warm: "F6F1E8"
};

function safeName(value: string) {
  return value.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "sales-play";
}

function addTitle(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.6,
    y: 0.45,
    w: 12.0,
    h: 0.6,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: COLORS.ink
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 1.0,
      w: 11.7,
      h: 0.4,
      fontFace: "Aptos",
      fontSize: 10,
      color: COLORS.mist
    });
  }

  slide.addShape("line", {
    x: 0.6,
    y: subtitle ? 1.45 : 1.05,
    w: 11.6,
    h: 0,
    line: { color: COLORS.line, width: 1 }
  });
}

function addBullets(slide: PptxGenJS.Slide, items: string[], opts: { x: number; y: number; w: number; h: number; fontSize?: number }) {
  slide.addText(
    items.map((item) => ({ text: item, options: { bullet: { indent: 14 } } })),
    {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fontFace: "Aptos",
      fontSize: opts.fontSize ?? 13,
      color: COLORS.ink,
      breakLine: true,
      paraSpaceAfter: 10,
      valign: "top",
      margin: 3
    }
  );
}

function addPanel(slide: PptxGenJS.Slide, title: string, body: string, x: number, y: number, w: number, h: number) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: COLORS.panel },
    line: { color: COLORS.line, width: 1 }
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.12,
    w: w - 0.36,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 10,
    bold: true,
    color: COLORS.mist
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.45,
    w: w - 0.36,
    h: h - 0.56,
    fontFace: "Aptos",
    fontSize: 15,
    color: COLORS.ink,
    fit: "shrink"
  });
}

export function renderDeckOutlineAsText(playbook: CoSellPlaybook) {
  return [
    `${playbook.input.accountName} Executive Sales Play Deck`,
    "",
    `Slide 1 - Executive Overview`,
    `Title: ${playbook.summary.headline}`,
    `Why now: ${playbook.summary.whyNow}`,
    "",
    `Slide 2 - Account Signals`,
    ...playbook.accountSignals.map((item) => `- ${item}`),
    "",
    `Slide 3 - Portfolio Fit`,
    ...playbook.portfolioMap.map((item) => `- ${item.name}${item.provider ? ` (${item.provider})` : ""}${item.whyItFits ? ` | ${item.whyItFits}` : ""}`),
    "",
    ...playbook.plays.flatMap((play, index) => [
      `Slide ${index + 4} - ${play.title}`,
      `Buyer: ${play.buyer}`,
      `Motion: ${play.motion}`,
      `Pain: ${play.pain}`,
      `Value hypothesis: ${play.valueHypothesis}`,
      `Google Cloud offer: ${play.googleCloudOffer}`,
      `Cognizant offer: ${play.cognizantOffer}`,
      "Proof points:",
      ...play.proofPoints.map((item) => `- ${item}`),
      "Discovery questions:",
      ...play.discoveryQuestions.map((item) => `- ${item}`),
      ""
    ]),
    `Slide ${playbook.plays.length + 4} - Talk Tracks`,
    `Executive: ${playbook.messaging.executiveTalkTrack}`,
    `Technical: ${playbook.messaging.technicalTalkTrack}`,
    `Email: ${playbook.messaging.emailOpening}`,
    "",
    `Slide ${playbook.plays.length + 5} - 30 Day Plan`,
    ...playbook.actionPlan.first30Days.map((item) => `- ${item}`),
    ...playbook.actionPlan.partnerActions.map((item) => `- ${item}`),
    ...playbook.actionPlan.assetsToBring.map((item) => `- ${item}`),
    "",
    `Slide ${playbook.plays.length + 6} - Sources`,
    ...playbook.research.sources.map((item) => `- ${item.publisher}: ${item.title} | ${item.url}`)
  ].join("\n");
}

export async function exportPlaybookToPptx(playbook: CoSellPlaybook) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Codex";
  pptx.company = "OpenAI";
  pptx.subject = `${playbook.input.accountName} Cognizant GCP playbook executive deck`;
  pptx.title = `${playbook.input.accountName} Cognizant GCP Playbook`;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };

  const cover = pptx.addSlide();
  cover.background = { color: COLORS.warm };
  cover.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: COLORS.warm }
  });
  cover.addText("Cognizant GCP Playbook", {
    x: 0.75,
    y: 0.85,
    w: 6.5,
    h: 0.6,
    fontFace: "Aptos Display",
    fontSize: 16,
    color: COLORS.mist,
    bold: false
  });
  cover.addText(playbook.summary.headline, {
    x: 0.75,
    y: 1.55,
    w: 7.0,
    h: 1.4,
    fontFace: "Aptos Display",
    fontSize: 26,
    bold: true,
    color: COLORS.ink,
    fit: "shrink"
  });
  cover.addText(playbook.summary.opportunity, {
    x: 0.75,
    y: 3.15,
    w: 6.7,
    h: 1.2,
    fontFace: "Aptos",
    fontSize: 16,
    color: COLORS.mist,
    fit: "shrink"
  });
  addPanel(cover, "Why now", playbook.summary.whyNow, 8.0, 1.0, 4.45, 2.0);
  addPanel(cover, "Partner thesis", playbook.summary.partnerThesis, 8.0, 3.3, 4.45, 2.2);
  cover.addText(`Research mode: ${playbook.research.mode.toUpperCase()}`, {
    x: 0.75,
    y: 6.65,
    w: 2.0,
    h: 0.25,
    fontSize: 9,
    color: COLORS.mist
  });

  const signals = pptx.addSlide();
  signals.background = { color: COLORS.white };
  addTitle(signals, "Account Signals", playbook.input.accountName);
  addBullets(signals, playbook.accountSignals, { x: 0.75, y: 1.75, w: 5.8, h: 4.8, fontSize: 16 });
  addPanel(signals, "Executive talk track", playbook.messaging.executiveTalkTrack, 7.1, 1.8, 5.4, 1.95);
  addPanel(signals, "Technical talk track", playbook.messaging.technicalTalkTrack, 7.1, 4.0, 5.4, 1.95);

  const portfolio = pptx.addSlide();
  portfolio.background = { color: COLORS.white };
  addTitle(portfolio, "Portfolio Fit", "Mapped Google Cloud and Cognizant offers");
  playbook.portfolioMap.slice(0, 6).forEach((entry, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    addPanel(portfolio, `${entry.provider} | ${entry.name}`, entry.whyItFits, 0.75 + col * 6.0, 1.6 + row * 1.75, 5.45, 1.45);
  });

  playbook.plays.forEach((play) => {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.white };
    addTitle(slide, play.title, `${play.buyer} | ${play.motion}`);
    addPanel(slide, "Pain", play.pain, 0.75, 1.55, 4.0, 1.3);
    addPanel(slide, "Value hypothesis", play.valueHypothesis, 4.95, 1.55, 4.0, 1.3);
    addPanel(slide, "Joint pitch", play.jointPitch, 9.15, 1.55, 3.45, 1.3);
    addBullets(slide, play.proofPoints, { x: 0.75, y: 3.15, w: 3.8, h: 2.6 });
    addBullets(slide, play.discoveryQuestions, { x: 4.8, y: 3.15, w: 3.8, h: 2.6 });
    addBullets(slide, play.firstMeetingAgenda, { x: 8.85, y: 3.15, w: 3.55, h: 2.6 });
    slide.addText(`Google Cloud offer: ${play.googleCloudOffer}`, {
      x: 0.75,
      y: 6.2,
      w: 5.6,
      h: 0.3,
      fontSize: 10,
      color: COLORS.mist
    });
    slide.addText(`Cognizant offer: ${play.cognizantOffer}`, {
      x: 6.6,
      y: 6.2,
      w: 5.6,
      h: 0.3,
      fontSize: 10,
      color: COLORS.mist
    });
    slide.addText(`Next step: ${play.nextStep}`, {
      x: 0.75,
      y: 6.55,
      w: 11.5,
      h: 0.45,
      fontSize: 12,
      bold: true,
      color: COLORS.ink
    });
  });

  const messaging = pptx.addSlide();
  messaging.background = { color: COLORS.white };
  addTitle(messaging, "Talk Tracks and Next Actions");
  addPanel(messaging, "Executive", playbook.messaging.executiveTalkTrack, 0.75, 1.65, 4.0, 2.0);
  addPanel(messaging, "Technical", playbook.messaging.technicalTalkTrack, 4.95, 1.65, 4.0, 2.0);
  addPanel(messaging, "Email opener", playbook.messaging.emailOpening, 9.15, 1.65, 3.45, 2.0);
  addBullets(messaging, playbook.actionPlan.first30Days, { x: 0.75, y: 4.2, w: 3.8, h: 2.2 });
  addBullets(messaging, playbook.actionPlan.partnerActions, { x: 4.8, y: 4.2, w: 3.8, h: 2.2 });
  addBullets(messaging, playbook.actionPlan.assetsToBring, { x: 8.85, y: 4.2, w: 3.55, h: 2.2 });

  const sources = pptx.addSlide();
  sources.background = { color: COLORS.white };
  addTitle(sources, "Sources and Research Notes", playbook.research.note);
  addBullets(
    sources,
    playbook.research.sources.length > 0
      ? playbook.research.sources.map((source) => `${source.publisher}: ${source.title} | ${source.url}`)
      : ["No live sources were captured for this playbook."],
    { x: 0.75, y: 1.75, w: 11.6, h: 4.9, fontSize: 13 }
  );

  await pptx.writeFile({ fileName: `${safeName(playbook.input.accountName)}-executive-sales-play.pptx` });
}
