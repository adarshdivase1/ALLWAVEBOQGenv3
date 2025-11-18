import { GoogleGenAI, Type } from '@google/genai';
import type { Boq, BoqItem, ProductDetails, Room, ValidationResult, GroundingSource } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a Bill of Quantities (BOQ) based on user requirements.
 */
export const generateBoq = async (answers: Record<string, any>): Promise<Boq> => {
    const model = 'gemini-2.5-pro';

    const requiredSystems = answers.requiredSystems || ['display', 'video_conferencing', 'audio', 'connectivity_control', 'infrastructure', 'acoustics'];
    
    const categoryMap: Record<string, string[]> = {
        display: ["Display"],
        video_conferencing: ["Video Conferencing & Cameras"],
        audio: ["Audio - Microphones", "Audio - DSP & Amplification", "Audio - Speakers"],
        connectivity_control: ["Video Distribution & Switching", "Control System & Environmental"],
        infrastructure: ["Cabling & Infrastructure", "Mounts & Racks"],
        acoustics: ["Acoustic Treatment"],
    };

    const allowedCategories = requiredSystems.flatMap((system: string) => categoryMap[system] || []);
    allowedCategories.push("Accessories & Services"); // Always include this category

    const requirements = Object.entries(answers)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return `${key}: ${value.join(', ')}`;
        }
        if (value) {
            return `${key}: ${value}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('; ');

    const prompt = `You are a world-class, senior AV Systems Designer. Your task is to create a 100% technically flawless, logical, and production-ready Bill of Quantities (BOQ) based on the client's detailed requirements from a comprehensive questionnaire. You must adhere strictly to all AVIXA standards and all rules below.

**Client Requirements (from questionnaire):** "${requirements}"

**MANDATORY DESIGN RULES:**

0.  **SCOPE DEFINITION (CRITICAL):** The client has specified which systems are required via the 'requiredSystems' answer. You MUST ONLY include items from the following categories: ${allowedCategories.join(', ')}. Do not generate any items for categories that are not on this allowed list. This is the most important rule; ignoring it will result in a failed design.

1.  **Core Design Principles:**
    *   **Production-Ready:** Every item must be essential. The final BOQ must represent a complete, installable system with no missing parts *for the requested scope*.
    *   **Logical Cohesion:** The system must be designed as a single, unified ecosystem. Core components for control, audio DSP, and video distribution must be from the same brand family (e.g., Crestron control with Crestron switching; Q-SYS DSP with Q-SYS cameras). Do not mix competing core ecosystems. This is a critical failure condition.
    *   **No Redundancy:** Avoid duplicative functionality. If a Yealink VC kit includes wireless presentation, DO NOT add a separate Barco ClickShare.
    *   **Current Products:** Specify only current-generation, commercially available products. Do not use end-of-life, outdated, or consumer-grade models. All displays MUST be professional/commercial grade.

2.  **Sizing & Coverage (AVIXA Standards):**
    *   **Display Sizing (AVIXA 4:6:8 Rule):** If displays are in scope, calculate the minimum required display height based on the room length. Assume the furthest viewer is at the back of the room. For Boardrooms, NOCs, or Experience Centers, use "Critical Viewing" (furthest viewer <= 4x image height). For all other rooms, use "Detailed Viewing" (furthest viewer <= 6x image height). Select a standard commercial display size (e.g., 55", 65", 75", 86", 98") that meets or exceeds this calculated height.
    *   **Display Brightness (AVIXA ISCR):** If displays are in scope, consider \`naturalLightLevel\`. If 'high', you MUST specify high-brightness displays (min 700 nits) or a high-lumen projector with an Ambient Light Rejecting (ALR) screen.
    *   **Audio Coverage:** If audio is in scope, ensure even sound pressure level (SPL) and high speech intelligibility across the entire seating area. For rooms longer than 15 feet or with more than 8 people, you MUST specify a sufficient number of ceiling speakers.
    *   **Microphone Coverage:** If audio is in scope, ensure complete audio capture for all participants. For any room with a capacity over 6, ceiling or tabletop microphones are mandatory.
    *   **Camera Field of View (FOV):** If video conferencing is in scope, the selected camera(s) MUST capture all participants based on the seating arrangement and room dimensions.

3.  **Advanced Display & Audio Logic:**
    *   **Display Types:** If displays are in scope, a \`video_wall\` or \`direct_view_led\` requires a dedicated video processor/controller. Use \`videoWallConfig\` to determine the number of displays. \`secondaryDisplays\` (e.g., 'Confidence Monitors') require their own screens and dedicated video outputs from the switching system.
    *   **Audio Types:** If audio is in scope, for \`bgmPaSystem\` ('bgm_only', 'pa_only', or 'both'), you MUST include a 70V/100V multi-zone amplifier and 70V speakers, separate from conferencing audio. If \`audioZoningRequired\` is 'yes', specify a DSP and/or amplifier with multiple output zones. If \`microphoneType\` includes \`throwable_mic\`, add a 'Catchbox'.

4.  **Acoustics, Lighting & Environmental Control (CRITICAL):**
    *   **Acoustics:** If acoustics are in scope, and if \`acousticNeeds\` is 'poor', or if there are significant \`primaryNoiseSources\`, you MUST include line items for the specific treatments selected in \`acousticTreatmentType\` (e.g., 'Acoustic Wall Panels', 'Ceiling Baffles'). These items belong in the 'Acoustic Treatment' category.
    *   **Lighting Control:** If control systems are in scope, and if \`lightingControl\` is 'dimming' or 'full_integration', you MUST include a compatible lighting control system (e.g., Lutron, Crestron) and the correct type of dimmers/interfaces based on \`existingLightingFixtures\` (e.g., phase-adaptive dimmers for LEDs).
    *   **Shade Control:** If control systems are in scope, and if \`shadeControl\` is 'yes', you MUST include motorized shades, a power supply, and a control interface (e.g., Somfy) compatible with the main control system.

5.  **Divisible Room & Control Logic:**
    *   **Divisible Rooms:** If \`roomType\` is \`divisible_room\` and all relevant systems are in scope, the entire design MUST support this. This requires a scalable matrix switcher, a DSP with sufficient I/O and AEC for all combinations, and a control system with logic for combined/separate modes.
    *   **Control Systems:** If control systems are in scope, \`controlSystem\` is multi-select. Include hardware for ALL selected options. If \`bms_integration\` is chosen, the control processor MUST have a BACnet/IP gateway.

6.  **Infrastructure & Connectivity Logic (CRITICAL):**
    *   **Connection Points:** If connectivity is in scope, you MUST specify the correct physical hardware (e.g., a specific Crestron FT2-700 for 'tabletop_box', a brand-name floor box for 'floor_box'). Distribute the ports from \`requiredWiredInputs\` logically across the selected \`connectivityPoints\`.
    *   **Connectivity Hardware:** If connectivity is in scope, include all necessary transmitters, receivers (HDBaseT or AV-over-IP), and cabling for EACH connection point to integrate it back to the main system rack.
    *   **Power & Network:**
        *   If infrastructure is in scope, and if \`powerInfrastructure\` is 'extend_power', include power extension cables and/or floor-rated cable concealers.
        *   If infrastructure is in scope, and if \`upsRequirement\` is not 'none', you MUST include a rack-mountable UPS with an appropriate VA rating for the specified load ('ups_for_rack' or 'ups_for_rack_and_displays').
        *   If infrastructure is in scope, and if \`networkInfrastructure\` is 'coordinate', add a note in the description for the main AV network switch: "Requires coordination with IT for network drop activation/installation".
    *   **Intercom:** If \`intercomSystemRequired\` is 'yes' and audio is in scope, add a complete production intercom system (e.g., Clear-Com, RTS) including a base station, beltpacks, and headsets.

7.  **Completeness & Ancillaries:**
    *   You MUST include every necessary accessory for a complete installation *within the defined scope*.
    *   If connectivity is in scope, a specific, named, managed network switch for ANY system using AV-over-IP.
    *   If infrastructure is in scope, the correct mount for every device, respecting \`wallConstruction\` and \`ceilingConstruction\`.
        *   If \`ceilingConstruction\` is 'acoustic_drop_tile', ceiling speakers and mics MUST have tile bridges.
        *   If 'glass' wall, specify specialized glass mounts or floor stands.
        *   If 'open_exposed' ceiling, specify pendant mounts or beam clamps.
    *   If infrastructure is in scope, a rack-mount power distribution unit (PDU) and blank panels for any equipment rack.
    *   If infrastructure is in scope, all required cables, connectors, and wall plates.
    *   If the \`rackLocation\` is in an 'av_closet', calculate cable lengths and add extenders if necessary.
    *   If \`userTrainingRequired\` is not 'no', you MUST add a line item for the specified training (e.g., 'On-site User Training Session') in the 'Accessories & Services' category.

8.  **BOQ Structure & Formatting:**
    *   You MUST use and order these categories exactly: 1. Display, 2. Video Conferencing & Cameras, 3. Video Distribution & Switching, 4. Audio - Microphones, 5. Audio - DSP & Amplification, 6. Audio - Speakers, 7. Control System & Environmental, 8. Acoustic Treatment, 9. Cabling & Infrastructure, 10. Mounts & Racks, 11. Accessories & Services.
    *   Group all items correctly under their respective categories. Only use categories from the allowed list in Rule #0.

**OUTPUT FORMAT:**
Return ONLY a valid JSON array of objects with the following properties:
- category: string (Must be one from the allowed list in Rule #0)
- itemDescription: string
- brand: string
- model: string
- quantity: number
- unitPrice: number (realistic estimated price in USD, numbers only)
- totalPrice: number (calculated as quantity * unitPrice)
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            itemDescription: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER },
            totalPrice: { type: Type.NUMBER },
          },
          required: ['category', 'itemDescription', 'brand', 'model', 'quantity', 'unitPrice', 'totalPrice'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, // Lower temperature for more deterministic, rule-based output
            },
        });

        const jsonText = response.text.trim();
        const boq: BoqItem[] = JSON.parse(jsonText);
        
        // Define the desired category order for sorting
        const categoryOrder = [
            "Display",
            "Video Conferencing & Cameras",
            "Video Distribution & Switching",
            "Audio - Microphones",
            "Audio - DSP & Amplification",
            "Audio - Speakers",
            "Control System & Environmental",
            "Acoustic Treatment",
            "Cabling & Infrastructure",
            "Mounts & Racks",
            "Accessories & Services",
        ];

        // Sort the BOQ according to the defined order
        const sortedBoq = boq.sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.category);
            const indexB = categoryOrder.indexOf(b.category);
            const effectiveIndexA = indexA === -1 ? Infinity : indexA;
            const effectiveIndexB = indexB === -1 ? Infinity : indexB;
            return effectiveIndexA - effectiveIndexB;
        });

        // Post-processing to ensure totalPrice is correct
        return sortedBoq.map((item: BoqItem) => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice
        }));

    } catch (error) {
        console.error('Error generating BOQ:', error);
        throw new Error('Failed to generate BOQ from Gemini API.');
    }
};

/**
 * Refines an existing BOQ based on a user-provided prompt.
 */
export const refineBoq = async (currentBoq: Boq, refinementPrompt: string): Promise<Boq> => {
    const model = 'gemini-2.5-pro';
    const prompt = `Refine the following Bill of Quantities (BOQ) based on the user's request, ensuring the final design remains technically sound and cohesive.

    Current BOQ (in JSON format):
    ${JSON.stringify(currentBoq, null, 2)}

    User's Refinement Request: "${refinementPrompt}"

    Instructions:
    1.  Analyze the user's request and modify the BOQ. This could involve adding, removing, or updating items.
    2.  **CRITICAL:** When adding or changing items, you MUST maintain the integrity of the core system architecture. Do not introduce components that conflict with the established control or distribution ecosystem.
    3.  Prioritize the latest available models from reputable OEMs and maintain AVIXA standards.
    4.  Recalculate 'totalPrice' for any items where 'quantity' or 'unitPrice' is changed.
    5.  Return the *complete, updated BOQ* as a single JSON array, identical in format to the input.
    
    CRITICAL: The final output must only be the JSON array for the refined BOQ. Do not include any other text, explanations, or markdown formatting.
    `;
    
    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            itemDescription: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unitPrice: { type: Type.NUMBER },
            totalPrice: { type: Type.NUMBER },
          },
          required: ['category', 'itemDescription', 'brand', 'model', 'quantity', 'unitPrice', 'totalPrice'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const boq = JSON.parse(jsonText);
        
        // Post-processing to ensure totalPrice is correct
        return boq.map((item: BoqItem) => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice
        }));
    } catch (error) {
        console.error('Error refining BOQ:', error);
        throw new Error('Failed to refine BOQ with Gemini API.');
    }
};

/**
 * Generates a photorealistic visualization of a room based on requirements and BOQ.
 */
export const generateRoomVisualization = async (answers: Record<string, any>, boq: Boq): Promise<string> => {
    const model = 'imagen-4.0-generate-001';

    const roomDescription = Object.entries(answers)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(', ');

    const equipmentManifest = boq
        .map(item => `- ${item.quantity}x ${item.itemDescription} (${item.brand})`)
        .join('\n');
    
    const prompt = `
      SCENE BRIEF:
      Create a photorealistic, high-quality concept visualization of an AV-equipped room. The image should be from a wide-angle perspective showing the entire room. The final output should look like a professional architectural rendering or a photograph from a high-end magazine.
      
      ROOM DETAILS:
      - This is a ${answers.roomType || 'general use'} room.
      - Seating Arrangement: ${answers.seatingArrangement || 'not specified'}.
      - General Description: ${roomDescription}.
      
      EQUIPMENT TO INCLUDE (seamlessly integrated into the design):
      ${equipmentManifest}
      
      STYLE GUIDANCE:
      - Photorealistic and high-detail.
      - Modern, clean, professional, and well-lit corporate or commercial environment.
      - Avoid clutter. Focus on the technology being elegantly integrated.
      - Aspect Ratio: 16:9 landscape.
      - DO NOT add any text, labels, or numbers onto the image itself. The image must be clean.
    `;

    try {
        const response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error('Error generating room visualization:', error);
        throw error;
    }
};

/**
 * Validates a BOQ against requirements and best practices.
 */
export const validateBoq = async (boq: Boq, requirements: string): Promise<ValidationResult> => {
    const model = 'gemini-2.5-pro';
    const prompt = `You are an expert AV system design auditor. Analyze the provided Bill of Quantities (BOQ) against the user's requirements with extreme scrutiny. Your primary goal is to identify critical design flaws.

    User Requirements: "${requirements}"

    Current BOQ (JSON):
    ${JSON.stringify(boq, null, 2)}

    Perform the following analysis:
    1.  **Ecosystem Conflict Check (HIGHEST PRIORITY):** Does the BOQ mix core control, audio, and video components from competing ecosystems (e.g., a Crestron control processor with Q-SYS video distribution, or an Extron controller with AMX touch panels)? This is a critical design failure. Flag any such conflicts as a major warning.
    2.  **Completeness Check:** Are there any crucial components missing for a fully functional system? (e.g., mounts for displays, a managed network switch for an AV-over-IP system, power distribution units, a control processor if a touch panel is listed).
    3.  **Networking Check:** If AV-over-IP components are listed, is a specific, brand-name managed network switch also listed? A 'generic' switch is a failure.
    4.  **Environmental Check:** Based on the room type (e.g., Auditorium, Town Hall, Boardroom), have **acoustic treatment** and **specialized lighting** been considered? If they appear to be missing but should be present, list them under 'missingComponents' and add a warning.
    5.  **Compatibility Check:** Are there any less obvious component incompatibilities? Flag any potential mismatches.

    Provide your findings in a structured JSON format. Be strict: if there are any warnings or missing components, 'isValid' MUST be false.
    - isValid: boolean
    - warnings: string[] (List of critical design flaws and incompatibilities).
    - suggestions: string[] (Recommendations for improvement).
    - missingComponents: string[] (Specific components you believe are missing).
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isValid: { type: Type.BOOLEAN },
            warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            missingComponents: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
        },
        required: ['isValid', 'warnings', 'suggestions', 'missingComponents'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error('Error validating BOQ:', error);
        return {
            isValid: false,
            warnings: ['AI validation failed to run. Please check the BOQ manually.'],
            suggestions: [],
            missingComponents: [],
        };
    }
};

/**
 * Generates a technical schematic diagram for a room based on requirements and BOQ.
 */
export const generateRoomSchematic = async (answers: Record<string, any>, boq: Boq): Promise<string> => {
    const model = 'imagen-4.0-generate-001';

    const roomDescription = Object.entries(answers)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join(', ');

    const equipmentManifest = boq
        .map(item => `- ${item.quantity}x ${item.itemDescription} (${item.brand} ${item.model})`)
        .join('\n');
    
    const prompt = `
      TASK: Create a professional AV system schematic diagram (functional block diagram).

      STYLE:
      - 2D technical drawing.
      - Black and white line art on a white background.
      - Minimalist and clear.
      - Use standard rectangular blocks for equipment.
      - Label each component with its model name. The text must be as legible as possible.
      - Use clear, straight lines to represent signal flow.

      ROOM CONTEXT:
      - This schematic is for a ${answers.roomType || 'general use'} room.
      - Key requirements: ${roomDescription}.

      EQUIPMENT LIST (MUST be included and connected logically):
      ${equipmentManifest}
    `;

    try {
        const response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API for the schematic.");
        }
    } catch (error) {
        console.error('Error generating room schematic:', error);
        throw error;
    }
};

/**
 * Fetches product details using Google Search grounding.
 */
export const fetchProductDetails = async (productName: string): Promise<ProductDetails> => {
    const model = 'gemini-2.5-flash';
    const prompt = `Give me a one-paragraph technical and functional overview for the product: "${productName}". The description should be suitable for a customer proposal.
    After the description, on a new line, write "IMAGE_URL:" followed by a direct URL to a high-quality, front-facing image of the product if you can find one.
    `;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        let description = text;
        let imageUrl = '';

        const imageUrlMatch = text.match(/\nIMAGE_URL:\s*(.*)/);
        if (imageUrlMatch && imageUrlMatch[1]) {
            imageUrl = imageUrlMatch[1].trim();
            description = text.substring(0, imageUrlMatch.index).trim();
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        // Correctly filter the grounding chunks to preserve the { web: { ... } } structure.
        const sources: GroundingSource[] = groundingChunks
            ?.filter((chunk): chunk is { web: { uri: string; title: string } } => !!chunk.web)
            .map(chunk => ({ web: chunk.web! })) || [];

        return {
            description,
            imageUrl,
            sources,
        };
    } catch (error) {
        console.error(`Error fetching product details for "${productName}":`, error);
        throw new Error(`Failed to fetch product details for "${productName}".`);
    }
};
