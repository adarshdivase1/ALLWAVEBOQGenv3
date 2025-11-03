import { GoogleGenAI, Type } from '@google/genai';
import type { Boq, BoqItem, ProductDetails, Room, ValidationResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a Bill of Quantities (BOQ) based on user requirements.
 */
export const generateBoq = async (requirements: string): Promise<Boq> => {
    const model = 'gemini-2.5-pro';
    const prompt = `Based on the following requirements for an AV room, generate a comprehensive Bill of Quantities (BOQ). 
    
    Requirements: "${requirements}"

    The BOQ should be an array of objects, where each object represents a line item and has the following properties:
    - category: string (e.g., "Display", "Audio", "Video Conferencing", "Control", "Cabling & Infrastructure")
    - itemDescription: string (A clear and concise description of the item)
    - brand: string (A well-known, reputable brand for the item)
    - model: string (A specific, valid model number for the item)
    - quantity: number (The number of units required)
    - unitPrice: number (A realistic estimated unit price in USD, without currency symbols or commas)
    - totalPrice: number (Calculated as quantity * unitPrice)

    Ensure the list is complete and covers all necessary components for a functional system based on the requirements. Include all necessary accessories, mounts, cables, and connectors.
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
        console.error('Error generating BOQ:', error);
        throw new Error('Failed to generate BOQ from Gemini API.');
    }
};

/**
 * Refines an existing BOQ based on a user-provided prompt.
 */
export const refineBoq = async (currentBoq: Boq, refinementPrompt: string): Promise<Boq> => {
    const model = 'gemini-2.5-pro';
    const prompt = `Refine the following Bill of Quantities (BOQ) based on the user's request.

    Current BOQ (in JSON format):
    ${JSON.stringify(currentBoq, null, 2)}

    User's Refinement Request: "${refinementPrompt}"

    Instructions:
    1. Carefully analyze the user's request and modify the BOQ accordingly.
    2. The request might be to add, remove, update items, change brands, adjust quantities, etc.
    3. Return the *complete, updated BOQ* as a single JSON array. 
    4. Ensure the output format is identical to the input BOQ format (an array of objects with the same properties).
    5. Recalculate 'totalPrice' for any items where 'quantity' or 'unitPrice' is changed.
    
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
    const prompt = `You are an expert AV system design auditor. Analyze the provided Bill of Quantities (BOQ) against the user's requirements. 
    Your goal is to identify potential issues, missing components, incompatibilities, or areas for improvement.

    User Requirements: "${requirements}"

    Current BOQ (JSON):
    ${JSON.stringify(boq, null, 2)}

    Perform the following analysis:
    1.  **Completeness Check:** Are there any crucial components missing for a fully functional system? (e.g., mounts for displays, correct cables, power distribution units, a control processor if a touch panel is listed, etc.).
    2.  **Compatibility Check:** Are the chosen components generally compatible? (e.g., a Cisco video conferencing codec with a non-certified camera). Flag potential mismatches.
    3.  **Best Practices:** Does the BOQ align with AV industry best practices for the given room type?
    4.  **Requirement Mismatch:** Does any part of the BOQ contradict the user's stated requirements?

    Provide your findings in a structured JSON format with the following keys:
    - isValid: boolean (true if there are no major issues, false otherwise. Be strict - if there are any warnings or missing components, this should be false).
    - warnings: string[] (A list of potential issues, incompatibilities, or deviations from best practices).
    - suggestions: string[] (A list of recommendations for improvement, like alternative products or additions that would enhance the system).
    - missingComponents: string[] (A list of specific components you believe are missing).
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
        const sources = groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string, title: string } => web !== undefined && web !== null) || [];

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