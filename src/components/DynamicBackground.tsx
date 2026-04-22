/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { GlyphTheme, GlyphMaterial, AtmosphereData } from "../types";

interface DynamicBackgroundProps {
  theme: GlyphTheme;
  material: GlyphMaterial;
  atmosphere?: AtmosphereData;
}

export default function DynamicBackground({ theme, material, atmosphere }: DynamicBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {/* Custom AI-Generated Atmosphere Layer */}
        {atmosphere ? (
          <motion.div
            key={`atmosphere-${atmosphere.motionType}-${atmosphere.primaryColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
            className="absolute inset-0"
          >
            <CustomAtmosphere data={atmosphere} />
          </motion.div>
        ) : (
          /* Default Theme-based Base Layer */
          <motion.div
            key={`theme-${theme}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            {theme === 'mystic' && <MysticBackground />}
            {theme === 'technical' && <TechnicalBackground />}
            {theme === 'organic' && <OrganicBackground />}
            {theme === 'minimal' && <MinimalBackground />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material-based Overlay Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`material-${material}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {material === 'iridescent' && <IridescentOverlay />}
          {material === 'ethereal' && <EtherealOverlay />}
        </motion.div>
      </AnimatePresence>
      
      {/* Glitch Overlay (Active if intensity > 0) */}
      {atmosphere && atmosphere.glitchFrequency > 20 && (
        <motion.div 
          animate={{ 
            opacity: [0, 0.1, 0, 0.15, 0],
            x: [0, -5, 5, -2, 0]
          }}
          transition={{ 
            duration: 0.2, 
            repeat: Infinity, 
            repeatDelay: Math.max(0.5, 10 - (atmosphere.glitchFrequency / 10)) 
          }}
          className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none"
        />
      )}

      {/* Global Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}

function CustomAtmosphere({ data }: { data: AtmosphereData }) {
  const { primaryColor, secondaryColor, accentColor, motionType } = data;

  return (
    <div className="absolute inset-0">
      {motionType === 'nebula' && (
        <div className="absolute inset-0">
          {[primaryColor, secondaryColor, accentColor].map((color, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                x: [i * 10 - 20 + '%', (i * 20 - 10) + '%'],
                y: [i * 5 - 10 + '%', (i * 15 - 5) + '%'],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 10 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute rounded-full blur-[150px]"
              style={{
                width: '800px',
                height: '800px',
                left: `${20 + i * 15}%`,
                top: `${20 + i * 10}%`,
                background: `radial-gradient(circle, ${color}, transparent)`,
              }}
            />
          ))}
        </div>
      )}

      {motionType === 'vortex' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-[150vw] h-[150vw] relative"
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 blur-[100px] opacity-10"
                style={{
                  transform: `rotate(${i * 90}deg)`,
                  background: `conic-gradient(from 0deg at 50% 50%, ${primaryColor}, ${secondaryColor}, ${accentColor}, transparent)`,
                }}
              />
            ))}
          </motion.div>
        </div>
      )}

      {motionType === 'pulse' && (
        <div className="absolute inset-0 bg-black">
          <motion.div
            animate={{ 
              opacity: [0.05, 0.2, 0.05],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${primaryColor}44 0%, transparent 70%)`
            }}
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent, ${secondaryColor}11)` }} />
        </div>
      )}

      {motionType === 'flow' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: ['-100%', '100%'],
                opacity: [0, 0.2, 0],
              }}
              transition={{
                duration: 15 + i * 10,
                repeat: Infinity,
                ease: "linear",
                delay: i * 5,
              }}
              className="absolute inset-x-0 h-[100vh] blur-[120px]"
              style={{
                top: i * 30 + '%',
                background: `linear-gradient(to bottom, transparent, ${i % 2 === 0 ? primaryColor : secondaryColor}, transparent)`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MysticBackground() {
  return (
    <div className="absolute inset-0">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, i % 2 === 0 ? 50 : -50, 0],
            y: [0, i % 2 === 0 ? -50 : 50, 0],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full blur-[120px] opacity-20"
          style={{
            width: '600px',
            height: '600px',
            left: `${20 + i * 20}%`,
            top: `${20 + i * 15}%`,
            background: i === 0 ? 'radial-gradient(circle, #4f46e5, transparent)' : 
                        i === 1 ? 'radial-gradient(circle, #7c3aed, transparent)' :
                                 'radial-gradient(circle, #db2777, transparent)',
          }}
        />
      ))}
    </div>
  );
}

function TechnicalBackground() {
  return (
    <div className="absolute inset-0 opacity-20">
      {/* Moving Grid Scan Line */}
      <motion.div
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-[2px] bg-blue-500/30 blur-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]"
      />
      
      {/* Subtle Data Rain Columns */}
      <div className="absolute inset-0 flex justify-around opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{
              duration: 2 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="w-[1px] h-full bg-gradient-to-b from-transparent via-blue-900 to-transparent"
          />
        ))}
      </div>

      <div className="absolute inset-0 grid-pattern opacity-10" />
    </div>
  );
}

function OrganicBackground() {
  return (
    <div className="absolute inset-0">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
            rotate: [0, 90, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute blur-[100px] opacity-[0.15]"
          style={{
            width: '500px',
            height: '500px',
            left: `${10 + i * 25}%`,
            top: `${10 + i * 20}%`,
            background: i % 2 === 0 ? 'radial-gradient(circle, #059669, transparent)' : 'radial-gradient(circle, #0891b2, transparent)',
          }}
        />
      ))}
    </div>
  );
}

function MinimalBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(30,30,30,0.4)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(30,30,30,0.4)_0%,transparent_50%)]" />
      <motion.div 
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute inset-0 noise-pattern" 
      />
    </div>
  );
}

function IridescentOverlay() {
  return (
    <motion.div
      animate={{
        background: [
          'radial-gradient(circle at 0% 0%, rgba(255,0,255,0.05) 0%, transparent 50%)',
          'radial-gradient(circle at 100% 100%, rgba(0,255,255,0.05) 0%, transparent 50%)',
          'radial-gradient(circle at 0% 100%, rgba(255,255,0,0.05) 0%, transparent 50%)',
          'radial-gradient(circle at 100% 0%, rgba(0,255,0,0.05) 0%, transparent 50%)',
          'radial-gradient(circle at 0% 0%, rgba(255,0,255,0.05) 0%, transparent 50%)'
        ]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 mix-blend-screen"
    />
  );
}

function EtherealOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 0.1, 0],
            x: [i * 10 + '%', (i * 10 + Math.sin(i) * 5) + '%'],
          }}
          transition={{
            duration: 8 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute w-64 h-64 bg-white/5 blur-[80px] rounded-full"
        />
      ))}
    </div>
  );
}
