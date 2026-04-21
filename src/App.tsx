/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, History, Search, ArrowRight, X } from "lucide-react";
import { GlyphData } from "./types";
import { generateGlyph } from "./services/geminiService";
import GlyphDisplay from "./components/GlyphDisplay";

export default function App() {
  const [word, setWord] = useState("");
  const [currentGlyph, setCurrentGlyph] = useState<GlyphData | null>(null);
  const [history, setHistory] = useState<GlyphData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("glyph-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const glyph = await generateGlyph(word.trim());
      setCurrentGlyph(glyph);
      const newHistory = [glyph, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("glyph-history", JSON.stringify(newHistory));
      setWord("");
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromHistory = (glyph: GlyphData) => {
    setCurrentGlyph(glyph);
  };

  return (
    <div className="h-screen flex flex-col bg-elegant-bg text-elegant-ink font-sans overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-elegant-surface relative z-30">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-blue-500 rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500"></div>
          </div>
          <span className="font-medium tracking-[0.2em] text-[10px] uppercase text-white">Logos / Glyph.Sys</span>
        </div>
        <div className="flex items-center gap-8 text-[10px] uppercase tracking-widest font-semibold">
          <button className="text-blue-400 border-b border-blue-400 pb-1 cursor-default">System</button>
          <button className="hover:text-white transition-colors">Library</button>
          <button className="hover:text-white transition-colors">Export</button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10"></div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Controls */}
        <aside className="w-72 border-r border-white/5 bg-elegant-surface p-6 flex flex-col gap-8 relative z-20">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold italic">Source String</label>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="MANIFEST WORD..."
                className="w-full bg-black/40 border border-white/10 rounded-none p-3 text-sm font-mono focus:border-blue-500 outline-none text-white tracking-[0.2em] uppercase placeholder:text-zinc-700"
                disabled={isLoading}
              />
            </form>
          </div>

          <div className="space-y-6">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">Synthesis Parameters</label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                <span>Abstraction</span>
                <span className="text-blue-400">84%</span>
              </div>
              <div className="h-[2px] w-full bg-white/10">
                <div className="h-full bg-blue-500 w-[84%]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                <span>Density</span>
                <span className="text-blue-400">42%</span>
              </div>
              <div className="h-[2px] w-full bg-white/10">
                <div className="h-full bg-blue-500 w-[42%]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                <span>Curvature</span>
                <span className="text-blue-400">12%</span>
              </div>
              <div className="h-[2px] w-full bg-white/10">
                <div className="h-full bg-blue-500 w-[12%]"></div>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <button 
              onClick={handleSubmit}
              disabled={!word.trim() || isLoading}
              className="w-full py-4 bg-white text-black text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
              Synthesize
            </button>
          </div>
        </aside>

        {/* Center Workspace */}
        <section className="flex-1 relative bg-black flex flex-col p-0">
          <div className="absolute inset-0 opacity-10 grid-pattern pointer-events-none"></div>
          
          <div className="flex-1 flex items-center justify-center relative">
            <GlyphDisplay glyph={currentGlyph} isLoading={isLoading} />
          </div>

          {/* Status Bar */}
          <div className="p-8 flex justify-between items-end text-[9px] text-zinc-500 font-mono tracking-widest relative z-10">
            <div>COORD: 40.7128N / 74.0060W</div>
            <div className="flex gap-4">
              <span>SEED: {currentGlyph ? currentGlyph.id.toUpperCase() : "INIT-00X"}</span>
              <span className="text-white">VER: 0.9.4-BETA</span>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Library */}
        <aside className="w-64 bg-elegant-surface border-l border-white/5 p-6 flex flex-col overflow-hidden relative z-20">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-bold italic">Recent Fragments</label>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              {history.map((glyph) => (
                <button
                  key={glyph.id}
                  onClick={() => selectFromHistory(glyph)}
                  className={`aspect-square bg-black border p-2 flex items-center justify-center group cursor-pointer transition-colors ${
                    currentGlyph?.id === glyph.id ? 'border-blue-500' : 'border-white/10 hover:border-blue-500/50'
                  }`}
                >
                  <svg viewBox="0 0 100 100" className={`w-full h-full ${currentGlyph?.id === glyph.id ? 'text-blue-400' : 'text-white/40 group-hover:text-white'}`}>
                    {glyph.paths.map((p, i) => (
                      <path key={i} d={p} fill="none" stroke="currentColor" strokeWidth="2.5" />
                    ))}
                  </svg>
                </button>
              ))}
              {/* Placeholders if few history items */}
              {Array.from({ length: Math.max(0, 10 - history.length) }).map((_, i) => (
                <div key={i} className="aspect-square bg-black/20 border border-white/5 p-4 flex items-center justify-center opacity-30">
                  <div className="w-full h-full border border-dashed border-white/10"></div>
                </div>
              ))}
            </div>
          </div>

          {currentGlyph && (
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-[10px] text-zinc-300 font-display font-medium uppercase tracking-[0.2em] mb-2">{currentGlyph.name}</h4>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{currentGlyph.word}</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
