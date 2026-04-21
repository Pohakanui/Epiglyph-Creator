/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { GlyphData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGlyph(word: string): Promise<GlyphData> {
  const prompt = `Create a unique geometric symbol (glyph) representing the word: "${word}".
The glyph should be abstract, meaningful, and composed of clean SVG path data.
Return a JSON object with:
1. "name": A creative name for this specific symbol.
2. "paths": An array of at least 3-6 distinct SVG path "d" attribute strings (viewBox 0 0 100 100). The paths should form a cohesive symbol.
3. "description": A short, profound interpretation of why these geometric shapes represent the word.
4. "category": A broad category like "Celestial", "Primal", "Cognitive", "Ethereal", etc.

Requirements for paths:
- Use coordinates between 0 and 100.
- Keep paths clean and expressive.
- Combine lines, arcs, and polygons.
- Ensure they are centered in the 100x100 viewBox.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          paths: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          description: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["name", "paths", "description", "category"]
      }
    }
  });

  const raw = JSON.parse(response.text || "{}");
  
  return {
    id: Math.random().toString(36).substring(7),
    word,
    ...raw,
    createdAt: Date.now()
  };
}
