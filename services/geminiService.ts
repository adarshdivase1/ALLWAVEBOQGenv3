import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Boq, ProductDetails, GroundingSource, BoqItem } from "../types";

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Define the schema for a single BOQ item, which will be used by the Gemini model to generate a structured JSON response.
const boqItemSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, description: "e.g., Display, Audio, Control" },
    itemDescription: { type: Type.STRING, description: "A detailed description of the item." },
    brand: { type: Type.STRING, description: "The manufacturer of the item." },
    model: { type: Type.STRING, description: "The model number or name of the item." },
    quantity: { type: Type.INTEGER, description: "The number of units required." },
    unitPrice: { type: Type.NUMBER, description: "The price of a single unit in USD." },
    totalPrice: { type: Type.NUMBER, description: "The total price for the quantity, in USD." },
  },
  required: ["category", "itemDescription", "brand", "model", "quantity", "unitPrice", "totalPrice"],
};

// Define the schema for the entire Bill of Quantities (BOQ), which is an array of BOQ items.
const boqSchema = {
  type: Type.ARRAY,
  items: boqItemSchema,
};

/**
 * Generates a Bill of Quantities (BOQ) based on user requirements using the Gemini model.
 * @param requirements - A string describing the project and room requirements.
 * @returns A promise that resolves to a BOQ object.
 */
export async function generateBoq(requirements: string): Promise<Boq> {
  const model = "gemini-2.5-pro"; // Using a more capable model for complex generation

  const systemInstruction = `You are a world-class, AVIXA CTS-D certified Audio-Visual system designer. Your primary objective is to generate a detailed, logical, and 100% production-ready Bill of Quantities (BOQ) in JSON format. An AV integrator must be able to install a complete, functional system using only the items in this BOQ.

**PRIMARY OEM PARTNER LIST (CRITICAL):**
Your component selection must be **STRONGLY BIASED** towards the following preferred brands. Only deviate if a specific function is absolutely required and not available from this list.
*   **Displays/Projectors:** Samsung, LG, Sony, BenQ, ViewSonic, Sharp, Newline, NEC, Epson, Christie, Absen
*   **Video Conferencing & Collaboration:** Yealink, Poly, Logitech, Cisco, Neat, Jabra, Microsoft, Huddly, MAXHUB, DTEN, Newline
*   **Control & Signal Management:** Crestron, Extron, AMX, Kramer, QSC, CUE, Lightware, Atlona, BlackBox, C2G, Inogeni, Magewell, Liberty
*   **Audio (Mics, Speakers, DSPs):** Shure, Biamp, QSC, Sennheiser, JBL, Audio-Technica, Yamaha, BSS, Fohhn, Clearcom, Studio Master
*   **Mounts & Racks:** Chief, Middle Atlantic, BTech, Valrack, Panduit, Heckler
*   **Networking & IT:** Netgear, Cisco
*   **Wireless Presentation:** Barco (ClickShare), AIRTAME, Crestron (AirMedia)
*   **Power & UPS:** APC, TrippLite

**NON-NEGOTIABLE DESIGN MANDATES:**

1.  **AVIXA STANDARDS ARE LAW:**
    *   **DISCAS for Displays:** Rigorously calculate the *minimum appropriate display size* based on room dimensions (provided as roomLength, roomWidth, roomHeight in feet) and the farthest viewer. The chosen display must meet this minimum.
    *   **Audio Clarity & Coverage:** Ensure full, intelligible audio coverage for all participants.
        *   **Speaker Quantity Calculation (CRITICAL):** You MUST calculate the required number of ceiling speakers based on room capacity. Use this rule: **For every 8-10 participants, include one pair (2 units) of ceiling speakers.** For example, a room for 40 people requires at least 4 pairs (8 speakers) to be AVIXA compliant.
        *   **DSP Mandate:** For any room larger than a small 4-person huddle space, a Digital Signal Processor (DSP) is **mandatory** for echo cancellation and proper audio routing. This is not optional.
    *   **System Functionality:** The design must be logical and all components compatible. This includes enforcing proper signal flow, considering cable management (e.g., adding cable management accessories to the rack), and ensuring a logical rack elevation where applicable.

2.  **SYSTEM COMPLETENESS IS PARAMOUNT:**
    *   **NO MISSING PARTS:** The BOQ must be exhaustive. Include all major components AND every single necessary ancillary item. This means: mounts, racks, power distribution units (PDDs), all required cables (HDMI, USB, network, speaker), connectors, faceplates, etc. The system must be installable "out-of-the-box" from this list.

**MANDATORY BRAND & SPECIFICATION GUIDELINES:**

1.  **DISPLAY RESOLUTION IS ALWAYS 4K/UHD.** This is the standard. Do not select 1080p displays unless the product category (e.g., a small confidence monitor) makes 4K illogical.
2.  **BRAND PREFERENCES ARE CRITICAL.** The user's requirements may contain lists of preferred brands for specific categories (e.g., displayBrands, vcBrands).
    *   You **MUST** prioritize these brands. If a user selects 'Samsung' and 'LG' for displays, your first choice for a display **MUST** be a suitable model from either Samsung or LG.
    *   If no specific brand is selected by the user for a category, choose the most logical and compatible option from the **PRIMARY OEM PARTNER LIST** based on the other requirements.

**FINAL INSTRUCTIONS:**
*   Output **ONLY** the valid JSON array. Do not include any other text, explanations, or markdown formatting.
*   Calculate 'totalPrice' accurately (quantity * unitPrice).
*   Use realistic, current, professional-grade AV models from the specified brands.
*   **Final Sanity Check:** Before outputting, ask yourself: "Is this a complete, working, 4K-capable system that meets AVIXA standards, uses the requested brands, and could be installed tomorrow by a professional integrator without them needing to add missing core components?"`;

  const response = await ai.models.generateContent({
    model: model,
    contents: `Generate a complete, production-ready BOQ based on the following detailed requirements, adhering to all instructions: ${requirements}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: boqSchema,
    },
  });

  const boqText = response.text.trim();
  try {
    const boq = JSON.parse(boqText);
    return boq as Boq;
  } catch (e) {
    console.error("Failed to parse BOQ JSON:", boqText);
    throw new Error("The AI returned an invalid BOQ format.");
  }
}

/**
 * Refines an existing Bill of Quantities (BOQ) based on a user's prompt.
 * @param currentBoq - The current BOQ object to be refined.
 * @param refinementPrompt - A string describing the desired changes to the BOQ.
 * @returns A promise that resolves to the refined BOQ object.
 */
export async function refineBoq(currentBoq: Boq, refinementPrompt: string): Promise<Boq> {
  const model = "gemini-2.5-pro";

  const systemInstruction = `You are an expert Audio-Visual system designer. Your task is to refine an existing Bill of Quantities (BOQ) based on user instructions.
- You will be given a BOQ in JSON format and a prompt for changes.
- Apply the changes and return the complete, updated BOQ as a JSON array of objects.
- When adding or changing an item, ensure that any necessary dependent components (e.g., a specific mount for a new display, required cables) are also added or updated to maintain a complete and functional system.
- Prioritize brands from the official partner list: Samsung, LG, Sony, BenQ, ViewSonic, Sharp, Newline, NEC, Epson, Christie, Absen, Yealink, Poly, Logitech, Cisco, Neat, Jabra, Microsoft, Huddly, MAXHUB, DTEN, Newline, Crestron, Extron, AMX, Kramer, QSC, CUE, Lightware, Atlona, BlackBox, C2G, Inogeni, Magewell, Liberty, Shure, Biamp, QSC, Sennheiser, JBL, Audio-Technica, Yamaha, BSS, Fohhn, Clearcom, Studio Master, Chief, Middle Atlantic, BTech, Valrack, Panduit, Heckler, Netgear, Cisco, Barco (ClickShare), AIRTAME, Crestron (AirMedia), APC, TrippLite.
- The returned BOQ must conform to the provided schema.
- Ensure all calculations (totalPrice) are correct in the updated BOQ.
- The output must be ONLY the JSON array, with no other text or markdown.`;

  const content = `
    Current BOQ:
    ${JSON.stringify(currentBoq, null, 2)}

    Refinement Request:
    "${refinementPrompt}"

    Please provide the full, updated BOQ in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: content,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: boqSchema,
    },
  });
  
  const boqText = response.text.trim();
  try {
    const boq = JSON.parse(boqText);
    return boq as Boq;
  } catch (e)
{
    console.error("Failed to parse refined BOQ JSON:", boqText);
    throw new Error("The AI returned an invalid refined BOQ format.");
  }
}


/**
 * Fetches product details, including an image, description, and sources, using Google Search grounding.
 * @param productName - The name of the product to search for.
 * @returns A promise that resolves to the product details.
 */
export async function fetchProductDetails(productName: string): Promise<ProductDetails> {
  const model = "gemini-2.5-flash";

  const productDetailsSchemaString = `{
    "imageUrl": "A direct, public URL to a high-quality image of the product. This should link directly to a .jpg, .png, or similar image file. If a direct image URL cannot be found, provide a URL to the product page that prominently features an image.",
    "description": "A brief, one-paragraph technical description of the product."
  }`;

  const systemInstruction = `You are an intelligent product information retriever. Your task is to find information about a specific AV product using Google Search grounding.
- You will be given a product name.
- You MUST return ONLY a valid JSON object conforming to this structure: ${productDetailsSchemaString}.
- Do not include any other text, explanations, or markdown formatting such as \`\`\`json. Your entire response must be the raw JSON object.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: `Find information for the product: "${productName}"`,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      // NOTE: responseMimeType and responseSchema are NOT supported when using tools like googleSearch.
      // They have been removed to fix the API error.
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = groundingChunks.map((chunk: any) => ({
      web: chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : undefined,
      maps: chunk.maps ? { uri: chunk.maps.uri, title: chunk.maps.title } : undefined,
  })).filter((source: GroundingSource) => source.web || source.maps);
  
  let productInfo: { imageUrl: string; description: string } = {
    imageUrl: '',
    description: 'No details found.'
  };

  try {
    const textResponse = response.text.trim();
    // Use a regex to extract the JSON object from the potentially messy string response.
    // This finds the first '{' and the last '}' and assumes everything between is the JSON object.
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
      productInfo = JSON.parse(jsonMatch[0]);
    } else {
      // If no JSON is found, we'll keep the default "No details found" message.
      console.warn("No valid JSON object found in product details response:", textResponse);
    }
  } catch (e) {
    console.error("Failed to parse product details JSON:", response.text, e);
    // If parsing fails, we still return the sources. The UI can handle missing image/description.
  }
  
  return {
    ...productInfo,
    sources: sources,
  };
}

// Helper function to categorize BOQ items for the visualization prompt
const generateEquipmentManifest = (boq: Boq): string => {
  const categories: { [key: string]: BoqItem[] } = {
    Displays: [],
    Cameras: [],
    Microphones: [],
    Speakers: [],
    Controls: [],
    RacksAndInfrastructure: [],
    Other: [],
  };

  boq.forEach(item => {
    const desc = `${item.category.toLowerCase()} ${item.itemDescription.toLowerCase()}`;
    if (desc.includes('display') || desc.includes('screen') || desc.includes('projector') || desc.includes('video wall')) categories.Displays.push(item);
    else if (desc.includes('camera')) categories.Cameras.push(item);
    else if (desc.includes('mic') || desc.includes('microphone')) categories.Microphones.push(item);
    else if (desc.includes('speaker')) categories.Speakers.push(item);
    else if (desc.includes('control') || desc.includes('touch panel') || desc.includes('keypad')) categories.Controls.push(item);
    else if (desc.includes('rack') || desc.includes('pdu') || desc.includes('ups') || desc.includes('credenza')) categories.RacksAndInfrastructure.push(item);
    else categories.Other.push(item);
  });

  let manifest = "**Equipment Manifest & Placement Rules:**\n\n";

  const buildSection = (title: string, items: BoqItem[], rule: string) => {
    if (items.length > 0) {
      manifest += `**${title}:**\n`;
      items.forEach(item => {
        manifest += `- ${item.quantity}x ${item.brand} ${item.model} (${item.itemDescription})\n`;
      });
      manifest += `  - **Placement Rule:** ${rule}\n\n`;
    }
  };

  buildSection(
    "Displays", 
    categories.Displays, 
    "Mount these on the main 'front' wall of the room. If there are two, they must be mounted side-by-side."
  );
  buildSection(
    "Video Conferencing Cameras", 
    categories.Cameras, 
    "Mount the camera(s) logically, typically centered below or between the main display(s)."
  );
  buildSection(
    "Microphones (Audio Input)", 
    categories.Microphones, 
    "If ceiling microphones, show them as discreet square or round units flush-mounted in the ceiling, distributed over the main seating/table area for full coverage. If tabletop, show them on the conference table."
  );
  buildSection(
    "Speakers (Audio Output)", 
    categories.Speakers, 
    "Show these as discreet round grilles flush-mounted in the ceiling, distributed evenly throughout the entire room to provide balanced audio coverage. The exact quantity specified MUST be shown."
  );
  buildSection(
    "Control Interfaces", 
    categories.Controls, 
    "If a tabletop touch panel, place it on the conference table. If a wall-mounted panel, place it near the room's main entrance."
  );
  buildSection(
    "Infrastructure", 
    categories.RacksAndInfrastructure, 
    "Show a tall, enclosed equipment rack (like a Middle Atlantic BGR series) placed discreetly in a corner or an adjacent alcove. If no rack is listed, show a low-profile credenza under the main displays that logically houses the system's core electronics."
  );

  return manifest;
};


/**
 * Generates a photorealistic visualization of a room based on its specifications and a Bill of Quantities.
 * @param roomDetails - An object containing details about the room from the questionnaire.
 * @param boq - The Bill of Quantities for the equipment to be included in the room.
 * @returns A promise that resolves to a base64-encoded image data URL.
 */
export async function generateRoomVisualization(
  roomDetails: { [key: string]: any },
  boq: Boq
): Promise<string> {
  const model = "imagen-4.0-generate-001";

  const roomType = roomDetails.roomType ? `a modern, high-end corporate ${roomDetails.roomType.replace(/_/g, ' ')}` : 'a modern, high-end corporate meeting room';
  const roomDimensions = `The room is approximately ${roomDetails.roomLength || 25} feet long, ${roomDetails.roomWidth || 18} feet wide, and has a ceiling height of ${roomDetails.roomHeight || 10} feet.`;
  const seatingCapacity = `The room's primary function is to host meetings for up to ${roomDetails.capacity || 12} people. The furniture (conference table, chairs) MUST be rendered to realistically and comfortably accommodate this exact number of participants. The scale of the room and furniture must be logical and consistent.`;
  
  const equipmentManifest = generateEquipmentManifest(boq);

  const prompt = `
    **PRIMARY COMMAND:** Generate a single, flawless, photorealistic architectural rendering of a corporate meeting space. The image must be a 100% technically and quantitatively accurate representation of the equipment listed below, integrated into a room that logically matches the specified context.

    **SCENE & CONTEXT:**
    *   **Room Type:** A wide-angle interior view of ${roomType}.
    *   **Dimensions & Style:** ${roomDimensions}. The style is modern, clean, and professional, with high-end finishes (e.g., wood, acoustic panels, architectural lighting). The perspective should be from the back of the room, looking towards the main display wall.
    *   **SEATING (CRITICAL):** ${seatingCapacity} Do not show fewer chairs than the specified capacity.

    **EQUIPMENT MANIFEST & PLACEMENT RULES:**
    ${equipmentManifest}

    **NON-NEGOTIABLE VISUALIZATION DIRECTIVES (FAILURE TO FOLLOW THESE WILL INVALIDATE THE RESULT):**
    1.  **QUANTITY IS LAW:** You MUST visualize the **EXACT QUANTITY** of every single item listed in the 'Equipment Manifest'. This is the most important rule. If the manifest says '2x 98-inch Display', you MUST render TWO distinct displays. If it says '10x Ceiling Speakers', you MUST render TEN speaker grilles. This is not a suggestion; it is a command.
    2.  **LOGICAL PLACEMENT:** Place all equipment according to professional AV standards and the 'Placement Rule' provided for each category in the manifest. The layout must be functional for the room's purpose.
    3.  **COMPLETE SYSTEM:** Visualize the ENTIRE system. Do not omit infrastructure like ceiling speakers, microphones, or the equipment rack/credenza. These are mandatory components.
    4.  **MANDATORY LABELING:** Add a small, subtle, and perfectly legible white text label (clean sans-serif font) on or next to each primary piece of technology (displays, cameras, mics, speakers, control panels). The label should identify the item (e.g., "98-inch 4K Display", "PTZ Camera", "Ceiling Microphone", "Touch Control Panel").
    5.  **NO PEOPLE:** The room must be empty. The focus is exclusively on the room and the technology.
    6.  **ASPECT RATIO:** The final image must be in a 16:9 landscape aspect ratio.
  `;
  
  const response = await ai.models.generateImages({
    model: model,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '16:9',
    },
  });

  const base64ImageBytes: string | undefined = response.generatedImages[0]?.image.imageBytes;
  
  if (base64ImageBytes) {
      return `data:image/png;base64,${base64ImageBytes}`;
  }

  throw new Error('No image was generated by the model. The prompt might have been too complex or rejected.');
}