/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { GlyphData, SynthesisParams } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGlyph(word: string, params: SynthesisParams): Promise<GlyphData> {
  const prompt = `Create a unique geometric symbol (glyph) representing the word: "${word}".
The glyph should be abstract, meaningful, and composed of clean SVG path data.

${params.atmospherePrompt ? `Additionally, synthesize an EPIC "Atmosphere" (background environment) based on this style: "${params.atmospherePrompt}".
This atmosphere should amplify the power of the glyph.` : ''}

Synthesis Parameters (Scale 0-100):
- Abstraction: ${params.abstraction} (0 = Literal/Simple, 100 = Highly Abstract/Complex)
- Density: ${params.density} (0 = Minimalist/Open, 100 = Dense/Intricate)
- Curvature: ${params.curvature} (0 = Sharp/Angular/Straight Lines, 100 = Organic/Fluid/Circles)
- Visual Theme: ${params.theme}
- Aesthetic Color: ${params.color}

Return a JSON object with:
1. "name": A creative name for this specific symbol.
2. "paths": An array of distinct SVG path "d" attribute strings (viewBox 0 0 100 100).
3. "description": A short, profound interpretation.
4. "category": A broad category.
5. "atmosphere": (Required) An object defining the environment:
   - "primaryColor": hex color
   - "secondaryColor": hex color
   - "accentColor": hex color
   - "motionType": one of ["nebula", "vortex", "pulse", "flow"]
   - "glitchFrequency": number 0-100

Requirements for paths:
- Use coordinates between 0 and 100.
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
          category: { type: Type.STRING },
          atmosphere: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              motionType: { type: Type.STRING, enum: ["nebula", "vortex", "pulse", "flow"] },
              glitchFrequency: { type: Type.NUMBER }
            },
            required: ["primaryColor", "secondaryColor", "accentColor", "motionType", "glitchFrequency"]
          }
        },
        required: ["name", "paths", "description", "category", "atmosphere"]
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

export async function generateVariations(glyph: GlyphData, params: SynthesisParams): Promise<GlyphData[]> {
  const prompt = `Based on the existing glyph named "${glyph.name}" for the word "${glyph.word}", generate 3 visual variations.

The core structure and meaning must be preserved, but you should explore minor differences in:
- Path complexity/detailing
- Slight deviations in geometric arrangement
- Subtle shifts in weight or curvature

Existing paths: ${JSON.stringify(glyph.paths)}
Synthesis Parameters:
- Abstraction: ${params.abstraction}
- Density: ${params.density}
- Curvature: ${params.curvature}

Return a JSON object with:
- "variations": An array of exactly 3 objects.
  Each object must have the same structure as the original:
  1. "name": A variation name (e.g. "${glyph.name} - Alpha", etc.)
  2. "paths": An array of SVG path "d" attribute strings.
  3. "description": A short explanation of the nuance in this variation.
  4. "category": Inherited from original: "${glyph.category}"
  5. "atmosphere": Inherited or slightly tweaked atmosphere object from: ${JSON.stringify(glyph.atmosphere)}

Requirements:
- viewBox 0 0 100 100.
- Centered.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variations: {
            type: Type.ARRAY,
            minItems: 3,
            maxItems: 3,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                paths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                atmosphere: {
                  type: Type.OBJECT,
                  properties: {
                    primaryColor: { type: Type.STRING },
                    secondaryColor: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    motionType: { type: Type.STRING, enum: ["nebula", "vortex", "pulse", "flow"] },
                    glitchFrequency: { type: Type.NUMBER }
                  },
                  required: ["primaryColor", "secondaryColor", "accentColor", "motionType", "glitchFrequency"]
                }
              },
              required: ["name", "paths", "description", "category", "atmosphere"]
            }
          }
        },
        required: ["variations"]
      }
    }
  });

  const raw = JSON.parse(response.text || "{}");
  
  return raw.variations.map((v: any) => ({
    id: Math.random().toString(36).substring(7),
    word: glyph.word,
    ...v,
    createdAt: Date.now()
  }));
}
