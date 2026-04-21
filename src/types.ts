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

export type GlyphTheme = 'minimal' | 'mystic' | 'technical' | 'organic';
