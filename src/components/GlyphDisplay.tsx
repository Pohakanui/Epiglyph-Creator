/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlyphData, GlyphTheme, GlyphMaterial } from "../types";
import FragmentParticles from "./FragmentParticles";

interface GlyphDisplayProps {
  glyph: GlyphData | null;
  isLoading: boolean;
  theme: GlyphTheme;
  material: GlyphMaterial;
  color: string;
  showParticles: boolean;
  synthesisStage?: number;
  particleSpeed?: number;
  humSpeed?: number;
}

export default function GlyphDisplay({ 
  glyph, 
  isLoading, 
  theme, 
  material = 'chrome',
  color, 
  showParticles, 
  synthesisStage = 0,
  particleSpeed = 50,
  humSpeed = 50 
}: GlyphDisplayProps) {
  const [isShattered, setIsShattered] = useState(false);
  
  // Auto-reform after shatter
  useEffect(() => {
    if (isShattered) {
      const timer = setTimeout(() => {
        setIsShattered(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isShattered]);

  const handleShatter = () => {
    if (!isShattered && glyph) {
      setIsShattered(true);
    }
  };

  const synthesisStages = [
    "Scanning Spectrum",
    "Extracting Fragments",
    "Resolving Geometry",
    "Finalizing Epiglyph"
  ];
  const progress = ((synthesisStage + 1) / synthesisStages.length) * 100;
  
  const pSpeedScale = Math.max(0.1, particleSpeed / 50);
  const humMultiplier = Math.max(0.1, humSpeed / 50);

  const baseColor = color !== '#ffffff' ? color : 'white';

  const getThemeStyles = () => {
    const activeStroke = material === 'chrome' ? `url(#chrome-${glyph?.id})` 
                       : material === 'iridescent' ? `url(#iri-${glyph?.id})`
                       : material === 'ethereal' ? `url(#ethereal-${glyph?.id})`
                       : baseColor;
    
    const intenseGlow = material === 'ethereal'
        ? `drop-shadow(0 10px 15px ${baseColor}66) drop-shadow(0 25px 40px ${baseColor}33) drop-shadow(0 50px 80px ${baseColor}1A)`
        : material === 'iridescent'
            ? `drop-shadow(0 0 15px #FF00FF) drop-shadow(0 0 30px #00FFFF) drop-shadow(0 0 50px #55FF00)`
            : theme === 'mystic' 
                ? `drop-shadow(0 0 10px ${baseColor}) drop-shadow(0 0 25px ${baseColor}) drop-shadow(0 0 40px ${baseColor})`
                : `drop-shadow(0 0 8px ${baseColor}) drop-shadow(0 0 15px ${baseColor})`;

    switch (theme) {
      case 'minimal':
        return {
          strokeWidth: 0.6,
          stroke: activeStroke,
          glow: intenseGlow,
          pathFilter: "none",
          dash: "",
          decorOpacity: 0.05,
        };
      case 'mystic':
        return {
          strokeWidth: 1.2,
          stroke: activeStroke,
          glow: intenseGlow,
          pathFilter: "none",
          dash: "",
          decorOpacity: 0.2,
        };
      case 'technical':
        return {
          strokeWidth: 0.6,
          stroke: activeStroke,
          glow: intenseGlow,
          pathFilter: "none",
          dash: "",
          decorOpacity: 0.15,
        };
      case 'organic':
        return {
          strokeWidth: 2.0,
          stroke: activeStroke,
          glow: intenseGlow,
          pathFilter: "blur(1px)",
          dash: "",
          decorOpacity: 0.1,
        };
      default:
        return {
          strokeWidth: 0.8,
          stroke: activeStroke,
          glow: intenseGlow,
          pathFilter: "none",
          dash: "",
          decorOpacity: 0.1,
        };
    }
  };

  const styles = getThemeStyles();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full aspect-square relative">
        {showParticles && (
          <FragmentParticles 
            count={20} 
            color={baseColor} 
            theme={theme} 
            speedScale={1.5 * pSpeedScale} 
          />
        )}
        
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Progress Circular Arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
             <circle 
              cx="96" cy="96" r="88" 
              fill="none" 
              stroke="white" 
              strokeWidth="1" 
              opacity="0.05" 
            />
            <motion.circle 
              cx="96" cy="96" r="88" 
              fill="none" 
              stroke={baseColor} 
              strokeWidth="2" 
              strokeDasharray="552.92"
              animate={{ strokeDashoffset: 552.92 - (552.92 * progress) / 100 }}
              transition={{ duration: 1 }}
              opacity="0.3"
            />
          </svg>

          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 90, 180],
            }}
            transition={{
              duration: 3 / humMultiplier,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-32 h-32 border-b border-r border-blue-500/20 rounded-full flex items-center justify-center"
          >
             <motion.div
              animate={{
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2 / humMultiplier,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-16 h-16 border-t border-l border-blue-400 rounded-full"
            />
          </motion.div>
        </div>
        
        <div className="mt-8 text-center space-y-1">
          <p className="font-mono text-blue-400 animate-pulse tracking-[0.4em] text-[10px] uppercase font-bold">
            {synthesisStages[synthesisStage]}...
          </p>
          <p className="text-[8px] text-zinc-600 font-mono tracking-widest">
            EPIGLYPH.SYS // PROGRESS: {Math.round(progress)}%
          </p>
        </div>

        {/* Hum Intensity Pulse */}
        <motion.div 
          animate={{ scale: [1, 1.3], opacity: [0.1, 0] }}
          transition={{ duration: 1.5 / humMultiplier, repeat: Infinity }}
          className="absolute w-72 h-72 border border-blue-500/10 rounded-full"
        />
      </div>
    );
  }

  if (!glyph) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full aspect-square text-center">
        <div className="w-40 h-40 border border-dashed border-white/5 rounded-full flex items-center justify-center relative">
          <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-ping" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40 / humMultiplier, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t border-white/10 rounded-full"
          />
        </div>
        <p className="mt-8 font-mono text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-medium">
          Await Synthesis Input
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 lg:p-6 relative">
      {/* Fragments Background Hum */}
      {showParticles && (
        <FragmentParticles 
          count={15} 
          color={baseColor} 
          theme={theme} 
          sizeScale={0.8}
          speedScale={1.0 * pSpeedScale}
        />
      )}
      
      {/* Theme-specific light elements */}
      {theme === 'mystic' && (
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5 / humMultiplier, repeat: Infinity }}
          className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full scale-150 pointer-events-none" 
        />
      )}

      {/* Hum Intensity Pulse over loaded glyph */}
      <motion.div 
        animate={{ scale: [1, 1.4], opacity: [0.08, 0] }}
        transition={{ duration: 2 / humMultiplier, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-[280px] h-[280px] md:w-[400px] md:h-[400px] border border-blue-500/20 rounded-full pointer-events-none"
      />
      
      <motion.div 
        onClick={handleShatter}
        whileHover={{ 
          scale: 1.08,
          filter: styles.glow + " drop-shadow(0 0 20px " + baseColor + "33)"
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative w-full max-w-[320px] md:max-w-[360px] aspect-square flex items-center justify-center cursor-crosshair group/glyph mt-4"
      >
        {/* Hover Glow Effect */}
        <motion.div 
          className="absolute inset-[10%] rounded-full opacity-0 group-hover/glyph:opacity-100 transition-opacity duration-500 blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${baseColor === 'white' ? 'rgba(59,130,246,0.3)' : baseColor + '4D'} 0%, transparent 80%)` 
          }}
        />

        {/* Geometric Decor Frame */}
        <div className="absolute inset-0 border border-white/5 rounded-full" style={{ opacity: styles.decorOpacity }} />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60 / humMultiplier, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[12.5%] border border-white/10 rotate-45" 
          style={{ opacity: styles.decorOpacity }}
        />
        
        {/* Metadata Floating Tags */}
        <div className="absolute top-0 right-0 p-2 border-l border-b border-blue-500/50 text-[9px] uppercase font-mono text-blue-400 z-20">
          Node-{glyph.id.slice(0, 2).toUpperCase()} // {theme.toUpperCase()}
        </div>

        {/* The Glyph SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 relative z-10 overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: styles.glow }}
        >
          <defs>
            <linearGradient id={`chrome-${glyph.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor={baseColor} />
              <stop offset="45%" stopColor="#0a0a0a" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="75%" stopColor={baseColor} />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            <linearGradient id={`iri-${glyph.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff00ea" />
              <stop offset="20%" stopColor="#00f3ff" />
              <stop offset="40%" stopColor="#00ff00" />
              <stop offset="60%" stopColor="#ffff00" />
              <stop offset="80%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#ff00ea" />
            </linearGradient>
            <linearGradient id={`ethereal-${glyph.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
              <stop offset="60%" stopColor={baseColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
            </linearGradient>
            <filter id={`ethereal-fog-${glyph.id}`} x="-100%" y="-100%" width="300%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5, 12" result="fog" />
              <feOffset in="fog" dx="0" dy="15" result="offsetFog" />
              <feComponentTransfer in="offsetFog">
                <feFuncA type="linear" slope="0.6" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.g
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{ duration: 3 / humMultiplier, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: material === 'ethereal' ? `url(#ethereal-fog-${glyph.id})` : undefined }}
          >
            {glyph.paths.map((path, index) => (
              <motion.path
                key={`${glyph.id}-${index}`}
                d={path}
                fill="none"
                stroke={styles.stroke}
                strokeWidth={styles.strokeWidth}
                style={{ filter: styles.pathFilter as any }}
                strokeLinecap={theme === 'organic' ? 'round' : 'square'}
                strokeLinejoin={theme === 'organic' ? 'round' : 'miter'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isShattered ? {
                  pathLength: 0.2 + Math.random() * 0.3,
                  opacity: [1, 0],
                  x: (Math.random() - 0.5) * 150,
                  y: (Math.random() - 0.5) * 150,
                  rotate: (Math.random() - 0.5) * 720,
                  transition: { duration: 1.5, ease: "circOut" }
                } : { 
                  pathLength: 1, 
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  transition: {
                    duration: 2.5,
                    delay: index * 0.05,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
          </motion.g>
          
          {theme === 'technical' && (
             <>
               <circle cx="50" cy="50" r="48" fill="none" stroke="#222" strokeWidth="0.1" />
               <line x1="0" y1="50" x2="100" y2="50" stroke="#222" strokeWidth="0.1" />
               <line x1="50" y1="0" x2="50" y2="100" stroke="#222" strokeWidth="0.1" />
             </>
          )}

          <circle cx="50" cy="50" r="0.5" fill="white" opacity="0.5" />
          <text x="52" y="48" fontSize="2" fontFamily="monospace" fill="white" opacity="0.3">
            {glyph.category.toUpperCase()}
          </text>
        </svg>
      </motion.div>

      {/* Epic Golden Semantic Engraving Plate */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8, type: "spring", bounce: 0.4 }}
        className="mt-4 w-full max-w-md relative z-20 mb-4 group"
      >
        {/* Legendary Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-amber-400/10 to-yellow-600/10 blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-1000 pointer-events-none"></div>
        
        {/* Core Plate Structure */}
        <div className="relative p-[1px] bg-gradient-to-r from-yellow-900/80 via-yellow-200 to-yellow-900/80 shadow-[0_0_20px_rgba(252,211,77,0.1)] overflow-hidden">
          
          {/* Sweeping Shimmer Animation */}
          <motion.div 
            animate={{ x: ['-200%', '300%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-1/2 skew-x-12 z-10 pointer-events-none"
          />

          {/* Inner Dark Slate Container */}
          <div className="relative bg-black/90 backdrop-blur-xl p-4 sm:p-6 flex flex-col items-center text-center border border-white/5 h-full w-full">
            
            {/* Top Ornamental Frame Line */}
            <div className="flex items-center gap-3 w-full justify-center mb-3 opacity-90">
              <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-l from-yellow-500 to-transparent"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-yellow-400 shadow-[0_0_8px_theme(colors.yellow.400)]"></div>
              <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-yellow-500 to-transparent"></div>
            </div>

            {/* Glowing Golden Title */}
            <h4 className="text-[10px] sm:text-[11px] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 uppercase tracking-[0.3em] font-extrabold mb-0.5 drop-shadow-md">
              Semantic Extraction
            </h4>
            
            {/* Sub-ID Registry Tag */}
            <span className="text-[7px] text-yellow-600/60 font-mono tracking-[0.2em] mb-3">
              REGISTRY_ID // {glyph.id.toUpperCase()}
            </span>
            
            {/* The Manifested Idea Text */}
            <p className="text-[11px] sm:text-xs leading-relaxed text-yellow-50/90 font-serif italic text-balance drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] max-w-[90%]">
              "{glyph.description}"
            </p>

            {/* Bottom Ornamental Frame Line */}
            <div className="flex items-center gap-2 w-full justify-center mt-4 opacity-60">
              <div className="h-[2px] w-4 bg-yellow-800/80"></div>
              <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
              <div className="h-[2px] w-4 bg-yellow-800/80"></div>
            </div>
            
          </div>
        </div>
      </motion.div>
    </div>
  );
}
