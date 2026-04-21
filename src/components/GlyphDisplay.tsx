/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { GlyphData } from "../types";

interface GlyphDisplayProps {
  glyph: GlyphData | null;
  isLoading: boolean;
}

export default function GlyphDisplay({ glyph, isLoading }: GlyphDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full aspect-square relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-32 h-32 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
        />
        <p className="mt-8 font-mono text-blue-400 animate-pulse tracking-[0.3em] text-[10px] uppercase">
          SYNTHESIZING...
        </p>
      </div>
    );
  }

  if (!glyph) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full aspect-square text-center">
        <div className="w-32 h-32 border border-dashed border-white/10 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
        </div>
        <p className="mt-8 font-mono text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
          Awaiting input string
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 lg:p-12 relative">
      {/* Background Grid Dots are in parent */}
      
      <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
        {/* Geometric Decor Frame */}
        <div className="absolute inset-0 border border-white/5 rounded-full" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[12.5%] border border-white/10 rotate-45" 
        />
        
        {/* Metadata Floating Tags */}
        <div className="absolute top-0 right-0 p-2 border-l border-b border-blue-500/50 text-[9px] uppercase font-mono text-blue-400">
          Node-{glyph.id.slice(0, 2).toUpperCase()} // Vec-{glyph.word.length}
        </div>

        {/* The Glyph SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 glyph-canvas relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {glyph.paths.map((path, index) => (
            <motion.path
              key={`${glyph.id}-${index}`}
              d={path}
              fill="none"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 2.5,
                delay: index * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
          <circle cx="50" cy="50" r="0.5" fill="white" opacity="0.5" />
          <text x="52" y="48" fontSize="2" fontFamily="monospace" fill="white" opacity="0.3">
            {glyph.category.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Semantic Analysis (Elegant Theme Style) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="mt-12 p-4 bg-blue-500/5 border border-blue-500/10 rounded w-full max-w-md"
      >
        <h4 className="text-[9px] text-blue-400 uppercase tracking-[0.2em] font-bold mb-2">Semantic Extraction</h4>
        <p className="text-xs leading-relaxed text-zinc-400 italic font-serif">
          "{glyph.description}"
        </p>
      </motion.div>
    </div>
  );
}
