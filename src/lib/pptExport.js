import pptxgen from "pptxgenjs";

// Premium NotebookLM-inspired dark mode palette
const BG_DARK_BASE = "0F111A"; // Very deep navy/black
const BG_CARD = "1A1E29"; // Slightly lighter for floating cards
const ACCENT_GCP = "4285F4"; // Google standard blue
const ACCENT_NEURO = "9B51E0"; // Vibrant Neuro purple
const ACCENT_GREEN = "0F9D58"; // Success green
const TEXT_H1 = "FFFFFF";
const TEXT_P = "B0B8C1"; // Slate grey text

/**
 * Creates a beautifully styled, highly modern PowerPoint presentation natively.
 */
export async function generateAndDownloadPPTX(slidesData, contextData) {
  let pres = new pptxgen();
  
  pres.layout = "LAYOUT_16x9";
  pres.author = "Cosell Sales Play Generator";

  // Master Slide with deep dark aesthetic and geometric accents
  pres.defineSlideMaster({
    title: "PREMIUM_MASTER",
    background: { color: BG_DARK_BASE },
    objects: [
      { rect: { x: 0, y: 0, w: "50%", h: 0.15, fill: { color: ACCENT_GCP } } },
      { rect: { x: "50%", y: 0, w: "50%", h: 0.15, fill: { color: ACCENT_NEURO } } },
      { text: { text: "GCP + Cognizant • AI Sales Play", options: { x: 0.5, y: "92%", w: 5, h: 0.3, color: "505A69", fontSize: 10, bold: true } } }
    ]
  });

  // --- 1. Stunning Title Slide ---
  let titleSlide = pres.addSlide();
  titleSlide.background = { color: BG_DARK_BASE };
  
  titleSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 3, h: "100%", fill: { color: "131722" } });
  
  titleSlide.addText("Client AI\nPlaybook", { x: 0.8, y: 1.5, w: 8, h: 2, fontSize: 54, color: TEXT_H1, bold: true, fontFace: "Helvetica Neue" });
  titleSlide.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 4.0, w: 4, h: 0.6, fill: { color: "1D2B44" }, rectRadius: 0.2 });
  titleSlide.addText(`Target: ${contextData.industry}`, { x: 0.8, y: 4.0, w: 4, h: 0.6, fontSize: 16, color: ACCENT_GCP, bold: true, align: "center" });

  // --- 2. Dynamic Content Slides ---
  if (slidesData && slidesData.slides) {
    slidesData.slides.forEach(slideInfo => {
      let slide = pres.addSlide({ masterName: "PREMIUM_MASTER" });
      
      slide.addText(slideInfo.title || "Slide Title", { x: 0.5, y: 0.6, w: 9, h: 1, fontSize: 36, color: TEXT_H1, bold: true, fontFace: "Helvetica Neue" });

      if (slideInfo.bulletPoints && slideInfo.bulletPoints.length > 0) {
        const maxCards = Math.min(slideInfo.bulletPoints.length, 5); 
        const cardSpacing = 0.15;
        const cardHeight = (4.5 - (cardSpacing * (maxCards - 1))) / maxCards;

        slideInfo.bulletPoints.slice(0, 5).forEach((point, idx) => {
          const currentY = 1.8 + (idx * (cardHeight + cardSpacing));
          
          slide.addShape(pres.ShapeType.roundRect, { x: 0.5, y: currentY, w: 9, h: cardHeight, fill: { color: BG_CARD }, rectRadius: 0.1, line: { color: "2A303C", width: 1 } });
          
          let accentColors = [ACCENT_GCP, ACCENT_NEURO, ACCENT_GREEN, "F29900", "EA4335"];
          slide.addShape(pres.ShapeType.rect, { x: 0.5, y: currentY, w: 0.1, h: cardHeight, fill: { color: accentColors[idx % 5] } });

          slide.addText(point, { x: 0.8, y: currentY, w: 8.5, h: cardHeight, fontSize: 16, color: "E1E5EA", fontFace: "Arial", valign: "middle" });
        });
      }
    });
  }

  // --- 3. Bold Closing Slide ---
  let finalSlide = pres.addSlide();
  finalSlide.background = { color: BG_DARK_BASE };
  finalSlide.addShape(pres.ShapeType.rect, { x: 4, y: 2, w: 2, h: 0.05, fill: { color: ACCENT_NEURO } });
  finalSlide.addText("Execution Strategy", { x: 0, y: 2.2, w: "100%", h: 1, align:"center", color: TEXT_H1, fontSize: 48, bold: true });

  await pres.writeFile({ fileName: `GCP_Cognizant_Play_${contextData.industry.replace(/\s+/g, '_')}.pptx` });
}
