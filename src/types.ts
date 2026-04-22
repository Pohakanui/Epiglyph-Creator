/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GlyphData {
  id: string;
  word: string;
  name: string;
  paths: string[];
  description: string;
  category: string;
  createdAt: number;
}

export interface SynthesisParams {
  abstraction: number;
  density: number;
  curvature: number;
  theme: GlyphTheme;
  material: GlyphMaterial;
  color: string;
  showParticles: boolean;
  particleSpeed: number;
  humSpeed: number;
}

export type GlyphTheme = 'minimal' | 'mystic' | 'technical' | 'organic';
export type GlyphMaterial = 'chrome' | 'ethereal' | 'iridescent';
