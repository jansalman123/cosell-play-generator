import pptxgen from "pptxgenjs";

// --- Corporate & Partner Brand Colors ---
const COGNIZANT_NAVY = "000048"; 
const COGNIZANT_BLUE = "0033A0";
const COGNIZANT_GREEN = "00B140";
const GCP_BLUE = "4285F4";
const GCP_RED = "EA4335";
const GCP_YELLOW = "FBBC04"; 
const GCP_GREEN = "34A853";
const GRAY_LIGHT = "F8F9FA";
const GRAY_DARK = "3C4043";
const WHITE = "FFFFFF";

/**
 * Creates a beautifully styled, professional PowerPoint presentation.
 */
export async function generateAndDownloadPPTX(slidesData, contextData) {
  let pres = new pptxgen();
  
  // Presentation Metadata and Layout setup
  pres.layout = "LAYOUT_16x9";
  pres.author = "Cosell Sales Play Generator";
  pres.company = "Cognizant & Google Cloud";

  // --- 1. DEFINE MASTER SLIDES ---
  
  // Standard Content Master
  pres.defineSlideMaster({
    title: "MASTER_CONTENT",
    background: { color: WHITE },
    objects: [
      // Top colored accent bar (combining GCP + Cognizant colors)
      { rect: { x: 0, y: 0, w: "100%", h: 0.1, fill: { color: GCP_BLUE } } },
      { rect: { x: 0, y: 0.1, w: "100%", h: 0.05, fill: { color: GCP_YELLOW } } },
      
      // Footer Separator Line
      { line: { x: 0.5, y: 6.8, w: 9, h: 0, line: { color: "E0E0E0", width: 1 } } },
      
      // Footer Left - Confidentiality or context
      { text: { text: "Cognizant + Google Cloud • Joint Go-To-Market Playbook", options: { x: 0.5, y: 6.9, w: 6, h: 0.3, color: "70757A", fontSize: 10, fontFace: "Segoe UI" } } }
    ],
    slideNumber: { x: 9.5, y: 6.9, color: "70757A", fontSize: 10, fontFace: "Segoe UI", align: "right" }
  });

  // --- 2. TITLE SLIDE ---
  let titleSlide = pres.addSlide();
  titleSlide.background = { color: COGNIZANT_NAVY };

  // Decorative Shapes for Title Slide
  // Left side brand pillars
  titleSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: "100%", fill: { color: COGNIZANT_BLUE } });
  titleSlide.addShape(pres.ShapeType.rect, { x: 0.4, y: 0, w: 0.1, h: "100%", fill: { color: GCP_BLUE } });
  
  // Sub-Headline Text
  titleSlide.addText("Google Cloud + Cognizant", {
    x: 1, y: 1.0, w: 8, h: 0.5, 
    fontSize: 20, color: GCP_BLUE, bold: true, fontFace: "Segoe UI", letterSpacing: 2
  });

  // Main Headline Text
  titleSlide.addText("Strategic Sales Playbook", {
    x: 1, y: 1.7, w: 8, h: 1.2, 
    fontSize: 48, color: WHITE, bold: true, fontFace: "Segoe UI"
  });
  
  // Gradient / Colored rule line
  titleSlide.addShape(pres.ShapeType.rect, { x: 1, y: 3.2, w: 1.5, h: 0.05, fill: { color: GCP_YELLOW } });

  // Dynamic Sub-title (Context)
  titleSlide.addText([
    { text: "Industry Focus: ", options: { bold: true, color: WHITE } },
    { text: `${contextData.industry || "Enterprise"}\n`, options: { color: "BCC1C6" } },
    { text: "Core Challenge: ", options: { bold: true, color: WHITE } },
    { text: `${contextData.painPoint || "Digital Transformation"}`, options: { color: "BCC1C6" } }
  ], {
    x: 1, y: 3.6, w: 8, h: 1.5, 
    fontSize: 22, fontFace: "Segoe UI", paraSpaceAfter: 12
  });

  // Presentation Date/Confidential
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  titleSlide.addText(`Strictly Confidential  |  ${dateStr}`, {
    x: 1, y: 6.5, w: 8, h: 0.5, color: "70757A", fontSize: 12, fontFace: "Segoe UI"
  });


  // --- 3. DYNAMIC CONTENT SLIDES ---
  if (slidesData && Array.isArray(slidesData.slides)) {
    slidesData.slides.forEach((slideInfo) => {
      let slide = pres.addSlide({ masterName: "MASTER_CONTENT" });
      
      // Title Block - strict height/valign to prevent any overlapping
      slide.addText(slideInfo.title || "Key Insight", {
        x: 0.5, y: 0.4, w: 9, h: 1.0,
        valign: "top",
        fontSize: 32, // Adjusted for typical enterprise titles
        color: COGNIZANT_NAVY,
        bold: true,
        fontFace: "Segoe UI"
      });

      // Optional Subtitle
      const hasSubtitle = slideInfo.subtitle && slideInfo.subtitle.trim() !== "";
      let contentY = 1.6;

      if (hasSubtitle) {
        slide.addText(slideInfo.subtitle, {
          x: 0.5, y: 1.4, w: 9, h: 0.6,
          valign: "top",
          fontSize: 18,
          color: GCP_BLUE, 
          bold: true,
          fontFace: "Segoe UI"
        });
        contentY = 2.1;
      }

      // Main Content Box (Bullets)
      if (slideInfo.bulletPoints && slideInfo.bulletPoints.length > 0) {
        
        // Add a subtle background box for content for a premium, embedded look
        slide.addShape(pres.ShapeType.roundRect, {
          x: 0.5, y: contentY, w: 9, h: 6.5 - contentY - 0.2, // calculate height explicitly
          fill: { color: GRAY_LIGHT },
          rectRadius: 0.1
        });

        // Add bullet points with custom professional formatting
        // Crucially using paraSpaceAfter to prevent wrapped text lines from being spaced out
        let texts = slideInfo.bulletPoints.map(point => ({
          text: point,
          options: { 
            bullet: { color: GCP_BLUE }, // Highlight bullets
            color: GRAY_DARK, 
            fontSize: 20, 
            fontFace: "Segoe UI", 
            breakLine: true, 
            paraSpaceAfter: 16 // Correctly gives space between separate bullet points
          }
        }));
        
        slide.addText(texts, {
          x: 0.8, y: contentY + 0.2, w: 8.4, h: 6.5 - contentY - 0.4,
          valign: "top",
          margin: 10
        });
      }
    });
  }

  // --- 4. CLOSING/CALL-TO-ACTION SLIDE ---
  let finalSlide = pres.addSlide();
  finalSlide.background = { color: COGNIZANT_NAVY };

  // Top Accent Frame
  finalSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: GCP_GREEN } });
  
  finalSlide.addText("Ready to Accelerate?", { 
    x: 0, y: 2.2, w: "100%", h: 1, 
    align:"center", color: WHITE, fontSize: 44, bold: true, fontFace: "Segoe UI" 
  });
  
  finalSlide.addText("Let's activate this sales play directly with your client counterparts.", { 
    x: 0.5, y: 3.3, w: 9, h: 0.8, 
    align:"center", color: "BCC1C6", fontSize: 20, fontFace: "Segoe UI" 
  });

  // Call to action button simulator
  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 4, y: 4.5, w: 2, h: 0.6, fill: { color: GCP_BLUE }, rectRadius: 0.2
  });
  finalSlide.addText("Take Action", {
    x: 4, y: 4.5, w: 2, h: 0.6, align: "center", valign: "middle", 
    color: WHITE, bold: true, fontSize: 16, fontFace: "Segoe UI"
  });

  // Define sensible file name with strict string replacement
  const safeName = (contextData?.industry || 'Sales')
    .substring(0, 30) // limit length somewhat
    .replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `GCP_Cognizant_${safeName}_Playbook.pptx`;

  // Save the presentation payload locally
  await pres.writeFile({ fileName });
}

