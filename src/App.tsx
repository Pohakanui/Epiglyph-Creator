/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, History, Search, ArrowRight, X, Layers, Download, Loader2, RefreshCw, AlertCircle, Copy, Check, ChevronLeft, ChevronRight, Zap, Trash2 } from "lucide-react";
import { GlyphData, SynthesisParams, GlyphTheme, GlyphMaterial } from "./types";
import { generateGlyph, generateVariations } from "./services/geminiService";
import GlyphDisplay from "./components/GlyphDisplay";
import Library from "./components/Library";
import gifshot from "gifshot";
import DynamicBackground from "./components/DynamicBackground";

export default function App() {
  const [word, setWord] = useState("");
  const [currentGlyph, setCurrentGlyph] = useState<GlyphData | null>(null);
  const [history, setHistory] = useState<GlyphData[]>([]);
  const [variations, setVariations] = useState<GlyphData[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [activeTab, setActiveTab] = useState<'system' | 'library'>('system');
  const [newGlyphPulse, setNewGlyphPulse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synthesisStages = [
    "Scanning Spectrum",
    "Extracting Fragments",
    "Resolving Geometry",
    "Finalizing Epiglyph"
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % synthesisStages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setLoadingStage(0);
    }
  }, [isLoading]);
  
  const [params, setParams] = useState<SynthesisParams>({
    abstraction: 84,
    density: 42,
    curvature: 12,
    theme: 'technical',
    material: 'chrome',
    atmospherePrompt: '',
    color: '#ffffff',
    showParticles: true,
    particleSpeed: 50,
    humSpeed: 50
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem("glyph-history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    const savedParams = localStorage.getItem("glyph-params");
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        setParams({ ...params, ...parsed });
      } catch (e) {
        console.error("Failed to load params", e);
      }
    }
  }, []);

  const updateParam = (key: keyof SynthesisParams, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      localStorage.setItem("glyph-params", JSON.stringify(newParams));
      return newParams;
    });
  };

  const getHueColor = (hue: number) => {
    if (hue === 0) return '#ffffff';
    return `hsl(${hue}, 80%, 65%)`;
  };

  const hueValue = params.color === '#ffffff' ? 0 : parseInt(params.color.match(/\d+/) || '0');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const manifestWord = word.trim();
    if (!manifestWord) {
      setError("Please manifest a word to begin synthesis.");
      return;
    }

    if (manifestWord.length > 20) {
      setError("Input exceeds resonance capacity (Max 20 chars).");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const glyph = await generateGlyph(manifestWord, params);
      setCurrentGlyph(glyph);
      const newHistory = [glyph, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("glyph-history", JSON.stringify(newHistory));
      setWord("");
      setNewGlyphPulse(true);
    } catch (err: any) {
      console.error("Generation failed:", err);
      if (err?.message?.includes("API key")) {
        setError("System Auth Failure: Invalid spectrum key.");
      } else if (err?.message?.includes("quota")) {
        setError("Resource Exhausted: Spectrum bandwidth exceeded.");
      } else {
        setError("Synthesis Interrupted: External interference detected.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromHistory = (glyph: GlyphData) => {
    setCurrentGlyph(glyph);
    setActiveTab('system'); // Automatically return to system tab to view selected glyph
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(glyph => glyph.id !== id);
    setHistory(newHistory);
    localStorage.setItem("glyph-history", JSON.stringify(newHistory));
    if (currentGlyph && currentGlyph.id === id) {
      setCurrentGlyph(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!currentGlyph || isGeneratingVariations) return;
    setIsGeneratingVariations(true);
    try {
      const vars = await generateVariations(currentGlyph, params);
      setVariations(vars);
    } catch (err: any) {
      console.error("Variation generation failed:", err);
      setError("Variation Manifestation Failure: Distortion detected.");
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const selectVariation = (v: GlyphData) => {
    setCurrentGlyph(v);
    setVariations([]);
    const isNew = !history.find(h => h.id === v.id);
    if (isNew) {
      const newHistory = [v, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("glyph-history", JSON.stringify(newHistory));
    }
  };

  const handleExport = async (format: 'svg' | 'svg-transparent' | 'png' | 'png-transparent' | 'jpg' | 'gif' | 'mp4') => {
    if (!currentGlyph) return;

    const baseColor = params.color !== '#ffffff' ? params.color : 'white';
    let sw = 0.8;
    let dash = "";
    let cap = "square" as CanvasLineCap;
    let join = "miter" as CanvasLineJoin;

    if (params.theme === 'minimal') { sw = 0.6; }
    else if (params.theme === 'mystic') { sw = 1.2; }
    else if (params.theme === 'technical') { sw = 0.6; dash = "1,1"; }
    else if (params.theme === 'organic') { sw = 1.8; cap = "round"; join = "round"; }

    const applyCanvasMaterial = (ctx: CanvasRenderingContext2D, width: number) => {
      ctx.lineWidth = sw;
      ctx.lineCap = cap;
      ctx.lineJoin = join;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      if (dash) ctx.setLineDash(dash.split(',').map(Number));

      if (params.material === 'chrome') {
        const grad = ctx.createLinearGradient(0, 0, 100, 100);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, baseColor);
        grad.addColorStop(0.45, '#0a0a0a');
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(0.75, baseColor);
        grad.addColorStop(1, '#050505');

        ctx.strokeStyle = grad;
        ctx.shadowColor = baseColor === 'white' ? 'rgba(255,255,255,0.8)' : baseColor;
        ctx.shadowBlur = 12;
      } else if (params.material === 'iridescent') {
        const grad = ctx.createLinearGradient(0, 0, 100, 100);
        grad.addColorStop(0, '#ff00ea');
        grad.addColorStop(0.2, '#00f3ff');
        grad.addColorStop(0.4, '#00ff00');
        grad.addColorStop(0.6, '#ffff00');
        grad.addColorStop(0.8, '#ff0000');
        grad.addColorStop(1, '#ff00ea');

        ctx.strokeStyle = grad;
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 20;
      } else if (params.material === 'ethereal') {
        const grad = ctx.createLinearGradient(0, 0, 0, 100);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(0.7, `${baseColor}66`);
        grad.addColorStop(1, `${baseColor}00`);

        ctx.strokeStyle = grad;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 20;
      }
    };

    const getDynamicFontSize = (text: string, maxWidth: number, maxHeight: number, bannerScale: number) => {
      // Start with a large readable size and scale down until the block fits exactly in the designated zone
      let size = 32 * bannerScale;
      const minSize = 12 * bannerScale;
      const leadingRatio = 1.4;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      
      while (size >= minSize) {
        tempCtx.font = `italic 700 ${size}px serif`;
        const words = text.split(' ');
        let lineCount = 1;
        let currentLine = '';
        
        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          if (tempCtx.measureText(testLine).width > maxWidth && n > 0) {
            lineCount++;
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        const totalBlockHeight = lineCount * size * leadingRatio;
        if (totalBlockHeight <= maxHeight) return size;
        
        size -= 0.5 * bannerScale;
      }
      return minSize;
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, currentY: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let y = currentY;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, y);
    };

    const drawBanner = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const bannerScale = width / 1000;
      const bannerHeight = 400 * bannerScale;
      const startY = height - bannerHeight;

      // Banner Layout Constants (Scalable)
      const headerBorder = 80 * bannerScale;  // Space reserved for header
      const footerBorder = 320 * bannerScale; // Start of footer territory
      const contentSafeHeight = footerBorder - headerBorder; // ~240px safe zone
      const contentSafeWidth = 880 * bannerScale;

      const gradient = ctx.createLinearGradient(0, startY, width, startY);
      gradient.addColorStop(0, '#BF953F');
      gradient.addColorStop(0.25, '#FCF6BA');
      gradient.addColorStop(0.5, '#B38728');
      gradient.addColorStop(0.75, '#FBF5B7');
      gradient.addColorStop(1, '#AA771C');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, startY, width, bannerHeight);

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3 * bannerScale;
      ctx.strokeRect(5 * bannerScale, startY + 5 * bannerScale, width - 10 * bannerScale, bannerHeight - 10 * bannerScale);

      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      
      // Header: Name
      ctx.font = `900 ${24 * bannerScale}px serif`;
      ctx.fillText(`— ${currentGlyph.name.toUpperCase()} —`, width / 2, startY + 45 * bannerScale);

      // Footer: Categories
      ctx.font = `900 ${18 * bannerScale}px monospace`;
      ctx.fillText(`SYMANTIC EXTRACTION // CATEGORY: ${currentGlyph.category.toUpperCase()} // ATTR: ${currentGlyph.word.toUpperCase()}`, width / 2, startY + 365 * bannerScale);

      // Content: Dynamic Description
      const descText = `"${currentGlyph.description}"`;
      const idealFontSize = getDynamicFontSize(descText, contentSafeWidth, contentSafeHeight, bannerScale);
      const lineHeight = idealFontSize * 1.4;

      // Measure for centering inside the SAFE zone (80px to 320px)
      const tempCtx = document.createElement('canvas').getContext('2d')!;
      tempCtx.font = `italic 700 ${idealFontSize}px serif`;
      const words = descText.split(' ');
      let lineCount = 1;
      let currentLine = '';
      words.forEach((word, n) => {
        const testLine = currentLine + word + ' ';
        if (tempCtx.measureText(testLine).width > contentSafeWidth && n > 0) {
          lineCount++;
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      
      const totalBlockHeight = lineCount * lineHeight;
      const centeringOffset = (contentSafeHeight - totalBlockHeight) / 2;

      ctx.font = `italic 700 ${idealFontSize}px serif`;
      ctx.textBaseline = 'top'; 
      wrapText(ctx, descText, width / 2, startY + headerBorder + centeringOffset, contentSafeWidth, lineHeight);
      ctx.textBaseline = 'alphabetic'; // Reset
      
      return idealFontSize / bannerScale;
    };

    // Shared scale logic for SVG
    const svgContentSafeWidth = 880;
    const svgContentSafeHeight = 240; // 320 - 80
    const calculatedFontSize = getDynamicFontSize(`"${currentGlyph.description}"`, svgContentSafeWidth, svgContentSafeHeight, 1);

    const isTransSVG = format === 'svg-transparent';

    const materialStroke = params.material === 'chrome' ? 'url(#chromeGradient)' 
                         : params.material === 'iridescent' ? 'url(#iriGradient)'
                         : params.material === 'ethereal' ? 'url(#etherealGradient)'
                         : baseColor;
                         
    const iriGlow = params.material === 'iridescent' ? 'filter: url(#iriGlow);' : '';
    const etherealGlow = params.material === 'ethereal' ? 'filter: url(#etherealGlow);' : '';
    const activeGlow = params.material === 'iridescent' ? iriGlow : params.material === 'ethereal' ? etherealGlow : 'filter: url(#chromeGlow);';

    const atmosGrad = currentGlyph.atmosphere ? `
    <radialGradient id="atmosGrad" cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
      <stop offset="0%" style="stop-color:${currentGlyph.atmosphere.primaryColor};stop-opacity:0.3" />
      <stop offset="60%" style="stop-color:${currentGlyph.atmosphere.secondaryColor};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </radialGradient>` : '';

    const svgString = `
<svg width="1000" height="${isTransSVG ? 1000 : 1400}" viewBox="0 0 1000 ${isTransSVG ? 1000 : 1400}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${atmosGrad}
    <linearGradient id="chromeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="25%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="45%" style="stop-color:#0a0a0a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="75%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iriGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff00ea;stop-opacity:1" />
      <stop offset="20%" style="stop-color:#00f3ff;stop-opacity:1" />
      <stop offset="40%" style="stop-color:#00ff00;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#ffff00;stop-opacity:1" />
      <stop offset="80%" style="stop-color:#ff0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff00ea;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="etherealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
      <stop offset="70%" style="stop-color:${baseColor};stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:${baseColor};stop-opacity:0" />
    </linearGradient>
    <filter id="chromeGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.5" result="blur1" />
      <feGaussianBlur stdDeviation="4" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="etherealGlow" x="-100%" y="-100%" width="300%" height="400%">
      <feGaussianBlur stdDeviation="1, 15" result="fogg" />
      <feOffset dx="0" dy="25" in="fogg" result="off" />
      <feComponentTransfer in="off">
         <feFuncA type="linear" slope="0.5" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="iriGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur1" />
      <feGaussianBlur stdDeviation="6" result="blur2" />
      <feGaussianBlur stdDeviation="15" result="blur3" />
      <feColorMatrix type="saturate" values="2" />
      <feMerge>
        <feMergeNode in="blur3" />
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
      <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
      <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
    </linearGradient>
  </defs>
  ${!isTransSVG ? `<rect width="1000" height="1400" fill="${currentGlyph.atmosphere ? 'url(#atmosGrad)' : '#000'}" />` : ''}
  <g transform="scale(10)">
    <g stroke="${materialStroke}" style="${activeGlow}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}" fill="none" ${dash ? `stroke-dasharray="${dash}"` : ''}>
      ${currentGlyph.paths.map(p => `<path d="${p}" />`).join('\n      ')}
    </g>
  </g>
  ${!isTransSVG ? `
  <g transform="translate(0, 1000)">
    <rect width="1000" height="400" fill="url(#goldGradient)" />
    <rect x="5" y="5" width="990" height="390" fill="none" stroke="#000" stroke-width="3" />
    <text x="500" y="50" font-family="serif" font-size="24" fill="#000" text-anchor="middle" font-weight="900" letter-spacing="10">
      — ${currentGlyph.name.toUpperCase()} —
    </text>
    <foreignObject x="60" y="80" width="880" height="240">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: serif; font-size: ${calculatedFontSize}px; color: #000; text-align: center; font-weight: 700; line-height: 1.4; margin: 0; padding: 0; font-style: italic; display: flex; align-items: center; justify-content: center; height: 100%;">
        "${currentGlyph.description}"
      </div>
    </foreignObject>
    <text x="500" y="365" font-family="monospace" font-size="18" fill="#000" text-anchor="middle" font-weight="900" letter-spacing="15">
      SYMANTIC EXTRACTION // CATEGORY: ${currentGlyph.category.toUpperCase()} // ATTR: ${currentGlyph.word.toUpperCase()}
    </text>
  </g>
  <text x="50" y="980" font-family="monospace" font-size="15" fill="${baseColor}" opacity="0.3">EPIGLYPH GENESIS CREATOR // ${currentGlyph.id.toUpperCase()}</text>
  ` : ''}
</svg>`.trim();

    if (format === 'svg' || format === 'svg-transparent') {
      setIsExporting(true);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `glyph-${currentGlyph.word.toLowerCase()}-${currentGlyph.id.slice(0, 4)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTimeout(() => setIsExporting(false), 500);
      return;
    }

    const renderFrames = async (width: number, height: number, frameCount: number): Promise<string[]> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = width;
      canvas.height = height;
      const frames: string[] = [];
      
      const atmos = currentGlyph.atmosphere;
      const pathLengths = currentGlyph.paths.map(pathStr => {
        const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svgPath.setAttribute('d', pathStr);
        try {
          return svgPath.getTotalLength();
        } catch (e) {
          return 100; // Fallback
        }
      });

      for (let i = 0; i <= frameCount; i++) {
        const progress = i / frameCount;
        
        // Draw Atmosphere Background
        if (atmos) {
          const grad = ctx.createRadialGradient(width/2, height/3, 0, width/2, height/3, width);
          grad.addColorStop(0, atmos.primaryColor + '44');
          grad.addColorStop(0.5, atmos.secondaryColor + '22');
          grad.addColorStop(1, '#000000');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          
          // Add some "Epic" accent light
          ctx.fillStyle = atmos.accentColor + '11';
          ctx.beginPath();
          ctx.arc(width * (0.5 + Math.sin(progress * Math.PI) * 0.2), height/4, width/2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.save();
        ctx.scale(width / 100, width / 100); 
        applyCanvasMaterial(ctx, width);

        currentGlyph.paths.forEach((pathStr, idx) => {
          const p = new Path2D(pathStr);
          const length = pathLengths[idx];
          
          // Animate drawing effect
          ctx.setLineDash([length, length]);
          // Progress 0-0.7 for individual paths, staggered by index
          const staggeredProgress = Math.max(0, Math.min(1, (progress * 1.5) - (idx * 0.1)));
          ctx.lineDashOffset = length * (1 - staggeredProgress);
          
          ctx.globalAlpha = Math.min(1, staggeredProgress * 2);
          ctx.stroke(p);
        });
        ctx.restore();

        // Direct Canvas Banner
        drawBanner(ctx, width, height);

        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.3;
        ctx.font = `${15 * (width/1000)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`EPIGLYPH GENESIS CREATOR // ${currentGlyph.id.toUpperCase()}`, 50 * (width/1000), 980 * (height/1400));
        ctx.globalAlpha = 1.0;

        frames.push(canvas.toDataURL('image/png'));
      }
      return frames;
    };

    if (format === 'gif') {
      setIsExporting(true);
      const frames = await renderFrames(500, 700, 25); // Slighly more frames
      gifshot.createGIF({
        images: frames,
        gifWidth: 500,
        gifHeight: 700,
        interval: 0.08,
        numFrames: 25,
      }, (obj: any) => {
        if (!obj.error) {
          const link = document.createElement('a');
          link.href = obj.image;
          link.download = `glyph-${currentGlyph.word.toLowerCase()}.gif`;
          link.click();
        }
        setIsExporting(false);
      });
      return;
    }

    if (format === 'mp4') {
      setIsExporting(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d')!;
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      const atmos = currentGlyph.atmosphere;
      const pathLengths = currentGlyph.paths.map(pathStr => {
        const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svgPath.setAttribute('d', pathStr);
        try {
          return svgPath.getTotalLength();
        } catch (e) {
          return 100;
        }
      });

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glyph-${currentGlyph.word.toLowerCase()}.mp4`;
        link.click();
        setIsExporting(false);
      };

      recorder.start();
      const duration = 3000; // Longer for epic feel
      const startTime = performance.now();

      const animate = async (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Draw Atmosphere Background
        if (atmos) {
          const grad = ctx.createRadialGradient(500, 400, 0, 500, 400, 1000);
          grad.addColorStop(0, atmos.primaryColor + '44');
          grad.addColorStop(0.5, atmos.secondaryColor + '22');
          grad.addColorStop(1, '#000000');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1000, 1400);
          
          // Accent glow moving with progress
          ctx.fillStyle = atmos.accentColor + '11';
          ctx.beginPath();
          ctx.arc(500 + Math.sin(progress * 6) * 100, 400, 600, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, 1000, 1400);
        }

        ctx.save();
        ctx.scale(10, 10);
        applyCanvasMaterial(ctx, 1000);

        currentGlyph.paths.forEach((pathStr, idx) => {
          const p = new Path2D(pathStr);
          const length = pathLengths[idx];
          
          const staggeredProgress = Math.max(0, Math.min(1, (progress * 1.4) - (idx * 0.08)));
          ctx.setLineDash([length, length]);
          ctx.lineDashOffset = length * (1 - staggeredProgress);
          
          ctx.globalAlpha = Math.min(1, staggeredProgress * 2);
          ctx.stroke(p);
        });
        ctx.restore();

        drawBanner(ctx, 1000, 1400);

        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.3;
        ctx.font = `15px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`EPIGLYPH GENESIS CREATOR // ${currentGlyph.id.toUpperCase()}`, 50, 980);
        ctx.globalAlpha = 1.0;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => recorder.stop(), 500); 
        }
      };

      requestAnimationFrame(animate);
      return;
    }

    // Static Image Logic (PNG/JPG)
    const isTransPNG = format === 'png-transparent';
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1000;
    canvas.height = isTransPNG ? 1000 : 1400;

    if (!isTransPNG) {
      const atmos = currentGlyph.atmosphere;
      if (atmos) {
        const grad = ctx.createRadialGradient(500, 400, 0, 500, 400, 1000);
        grad.addColorStop(0, atmos.primaryColor + '44');
        grad.addColorStop(0.5, atmos.secondaryColor + '22');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#000';
      }
      ctx.fillRect(0, 0, 1000, 1400);
    }

    ctx.save();
    ctx.scale(10, 10);
    applyCanvasMaterial(ctx, 1000);
    
    currentGlyph.paths.forEach((pathStr) => {
      const p = new Path2D(pathStr);
      ctx.stroke(p);
    });
    ctx.restore();

    if (!isTransPNG) {
      drawBanner(ctx, 1000, 1400);

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.3;
      ctx.font = `15px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`EPIGLYPH GENESIS CREATOR // ${currentGlyph.id.toUpperCase()}`, 50, 980);
    }

    const mimeType = format.startsWith('png') ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.85 : 1;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `glyph-${currentGlyph.word.toLowerCase()}.${format.startsWith('png') ? 'png' : 'jpg'}`;
    link.click();
    setTimeout(() => setIsExporting(false), 500);
  };

  const themes: GlyphTheme[] = ['minimal', 'mystic', 'technical', 'organic'];
  const materials: GlyphMaterial[] = ['chrome', 'ethereal', 'iridescent'];

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-elegant-bg text-elegant-ink font-sans overflow-hidden">
      <DynamicBackground 
        theme={params.theme} 
        material={params.material} 
        atmosphere={currentGlyph?.atmosphere}
      />
      
      {/* Mobile Portrait Orientation Lock Overlay */}
      <div className="md:hidden fixed inset-0 z-[100] bg-black flex items-center justify-center p-8 landscape:hidden">
        <div className="text-center space-y-6">
          <motion.div 
            animate={{ rotate: 90 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, ease: "anticipate" }}
            className="w-16 h-24 border-2 border-zinc-700 rounded-lg mx-auto flex items-center justify-center relative"
          >
            <div className="w-10 h-10 border border-blue-500 rounded-full" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-zinc-700 rounded-full" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-blue-400 font-mono text-sm tracking-[0.2em] uppercase font-bold">Tilt Device</h2>
            <p className="text-zinc-500 text-[10px] tracking-widest uppercase">
              Synthesis requires <br/> landscape orientation
            </p>
          </div>
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="h-14 shrink-0 border-b border-white/10 px-4 md:px-6 flex items-center justify-between bg-elegant-surface/80 backdrop-blur-xl relative z-30">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-blue-500 rotate-45 flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500"></div>
          </div>
          <span className="font-medium tracking-[0.2em] text-[8px] md:text-[10px] uppercase text-white hidden sm:block">EpiGlyph Creator</span>
          <span className="font-medium tracking-[0.2em] text-[8px] uppercase text-white sm:hidden">EpiGlyph</span>
        </div>
        <div className="flex items-center gap-3 md:gap-5 text-[10px] uppercase font-bold tracking-[0.2em] h-full">
          <button 
            onClick={() => setActiveTab('system')}
            className={`relative px-6 py-2 h-9 flex items-center transition-all duration-500 group overflow-hidden border-x border-t ${activeTab === 'system' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_-5px_15px_rgba(59,130,246,0.1)]' : 'border-white/5 text-zinc-500 hover:text-white hover:border-white/10 hover:bg-white/5'}`}
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-blue-500 transition-all duration-500 ${activeTab === 'system' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            <span className="relative z-10">Creation Lab</span>
            {activeTab === 'system' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
            )}
          </button>

          <button 
            onClick={() => {
              setActiveTab('library');
              setNewGlyphPulse(false);
            }}
            className={`relative px-6 py-2 h-9 flex items-center transition-all duration-500 group overflow-hidden border-x border-t ${activeTab === 'library' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_-5px_15px_rgba(59,130,246,0.1)]' : 'border-white/5 text-zinc-500 hover:text-white hover:border-white/10 hover:bg-white/5'} ${newGlyphPulse && activeTab !== 'library' ? 'border-green-500/50 text-green-400' : ''}`}
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-500 ${activeTab === 'library' ? 'scale-x-100 bg-blue-500' : (newGlyphPulse ? 'scale-x-100 bg-green-500' : 'scale-x-0 bg-blue-500 group-hover:scale-x-100')}`} />
            <span className="relative z-10 flex items-center gap-2">
              EpiGlyph VAULT
              {newGlyphPulse && activeTab !== 'library' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              )}
            </span>
            {activeTab === 'library' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
            )}
          </button>
          
          <div className="relative group/export h-9">
            <button 
              disabled={!currentGlyph || isExporting}
              className={`relative h-full px-6 flex items-center gap-2.5 border-x border-t transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed font-black tracking-[0.25em] ${isExporting ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-yellow-600/50 bg-yellow-600/5 text-yellow-500 hover:bg-yellow-500 hover:text-black hover:shadow-[0_-5px_20px_rgba(234,179,8,0.2)] hover:border-yellow-400'}`}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-400 opacity-0 group-hover/export:opacity-100 transition-opacity" />
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 transition-transform group-hover/export:-translate-y-0.5" />
              )}
              <span className="hidden sm:inline">{isExporting ? 'SAVING...' : 'SAVE AS'}</span>
            </button>
            {!isExporting && (
              <div className="absolute right-0 top-full hidden group-hover/export:flex flex-col bg-black border border-white/10 p-2 min-w-[200px] shadow-2xl z-50">
              <div className="text-[7px] text-zinc-600 px-3 py-1 uppercase tracking-tighter border-b border-white/5">Static Formats</div>
              <button 
                onClick={() => handleExport('svg')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                SVG (Vector w/ Data Plate)
              </button>
              <button 
                onClick={() => handleExport('svg-transparent')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                SVG (Transparent Glyph Only)
              </button>
              <button 
                onClick={() => handleExport('png')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                PNG (High Res w/ Data Plate)
              </button>
              <button 
                onClick={() => handleExport('png-transparent')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                PNG (Transparent Glyph Only)
              </button>
              <button 
                onClick={() => handleExport('jpg')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                JPG (Web)
              </button>
              
              <div className="text-[7px] text-zinc-600 px-3 py-1 mt-1 uppercase tracking-tighter border-y border-white/5 bg-white/5">Dynamic Formats</div>
              <button 
                onClick={() => handleExport('gif')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                GIF Animation
              </button>
              <button 
                onClick={() => handleExport('mp4')}
                className="w-full text-left py-2 px-3 hover:bg-blue-500 hover:text-white transition-colors text-[9px]"
              >
                MP4 Video
              </button>
            </div>
          )}
        </div>

          <button 
            onClick={() => window.location.reload()}
            title="Refresh"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-all hover:rotate-180 duration-500 shadow-lg group/reload"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover/reload:scale-110 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'system' ? (
          <>
            {/* Left Sidebar: Controls */}
            <aside className="w-[300px] lg:w-[380px] shrink-0 border-r border-white/5 bg-elegant-surface/80 backdrop-blur-xl px-6 lg:px-8 py-6 flex flex-col gap-4 lg:gap-5 relative z-20 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">Source String</label>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="MANIFEST WORD..."
                className={`w-full bg-black/40 border rounded-none p-3 text-sm font-mono focus:border-blue-500 outline-none text-white tracking-[0.2em] uppercase placeholder:text-zinc-700 transition-colors ${
                  error ? 'border-red-500' : 'border-white/10'
                }`}
                disabled={isLoading}
              />
            </form>

            <div className="mt-4 space-y-3">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">Atmosphere Manifestation</label>
              <input
                type="text"
                value={params.atmospherePrompt}
                onChange={(e) => updateParam('atmospherePrompt', e.target.value)}
                placeholder="EPIC STYLE... (e.g. CYBERPUNK VORTEX)"
                className="w-full bg-black/40 border border-white/10 rounded-none p-3 text-[10px] font-mono focus:border-blue-500 outline-none text-white tracking-[0.1em] uppercase placeholder:text-zinc-700 transition-colors"
                disabled={isLoading}
              />
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-[10px] text-red-400 font-bold tracking-wider leading-relaxed px-1"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span className="uppercase">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">
              <Layers className="w-3 h-3" />
              Visual Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <div key={t} className="group/theme-tt relative">
                  <button
                    onClick={() => updateParam('theme', t)}
                    className={`w-full py-2 px-3 text-[9px] uppercase tracking-wider font-bold border transition-all ${
                      params.theme === t 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-black/20 border-white/10 text-zinc-400 hover:border-white/30'
                    }`}
                  >
                    {t}
                  </button>
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/theme-tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                    {t === 'minimal' && <>Essential hairline geometry. Minimalist data extraction without secondary artifacts.</>}
                    {t === 'mystic' && <>Transcendent paths with glowing auras. Influences the model toward ancient or sacred forms.</>}
                    {t === 'technical' && <>Precision dashed vectors and internal grids. Adds geometric telemetry and sharp analytical bias.</>}
                    {t === 'organic' && <>Bold fluid paths with rounded terminals. Mimics growth patterns of natural biological systems.</>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">
              <Layers className="w-3 h-3" />
              Material Finish
            </label>
            <div className="grid grid-cols-3 gap-2">
              {materials.map((m) => (
                <div key={m} className="group/material-tt relative">
                  <button
                    onClick={() => updateParam('material', m)}
                    className={`w-full py-2 px-1 text-[8px] uppercase tracking-wider font-bold border transition-all ${
                      params.material === m 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-black/20 border-white/10 text-zinc-400 hover:border-white/30'
                    }`}
                  >
                    {m}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic border-b border-white/5 pb-2">Synthesis Parameters</label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter group/tt relative">
                <span className="cursor-help border-b border-dashed border-zinc-700 pb-0.5 hover:border-blue-500/50 transition-colors">Core Hue / Chromaticity</span>
                <span style={{ color: params.color }} className="font-mono">{params.color === '#ffffff' ? 'WHITE' : `${hueValue}°`}</span>
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                  <div className="text-blue-400 mb-1 font-bold">SPECTRAL BIAS:</div>
                  Shifts the base frequency of the glyph. Influences both color and AI-perceived energy.
                </div>
              </div>
              <div className="relative group">
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={hueValue} 
                  onChange={(e) => updateParam('color', getHueColor(parseInt(e.target.value)))}
                  className="w-full h-1.5 rounded-none appearance-none cursor-pointer bg-transparent relative z-10"
                  style={{
                    background: 'linear-gradient(to right, #fff 0%, #fff 5%, #ff0000 10%, #ffff00 25%, #00ff00 40%, #00ffff 55%, #0000ff 75%, #ff00ff 90%, #ff0000 100%)'
                  }}
                />
                <style>{`
                  input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 10px;
                    width: 4px;
                    background: white;
                    border: 1px solid black;
                    cursor: pointer;
                  }
                `}</style>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter group/tt relative">
                <span className="cursor-help border-b border-dashed border-zinc-700 pb-0.5 hover:border-blue-500/50 transition-colors">Abstraction</span>
                <span className="text-blue-400 font-mono">{params.abstraction}%</span>
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                  <div className="text-blue-400 mb-1 font-bold">CONCEPTUAL GAP:</div>
                  Determines how far the symbol deviates from literal representation. 0=Simple, 100=Paradoxical.
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={params.abstraction} 
                onChange={(e) => updateParam('abstraction', parseInt(e.target.value))}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer accent-blue-500 px-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter group/tt relative">
                <span className="cursor-help border-b border-dashed border-zinc-700 pb-0.5 hover:border-blue-500/50 transition-colors">Density</span>
                <span className="text-blue-400 font-mono">{params.density}%</span>
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                  <div className="text-blue-400 mb-1 font-bold">STRUCTURAL MASS:</div>
                  Controls the geometric complexity and frequency of distinct paths. 0=Minimal, 100=Intricate.
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={params.density} 
                onChange={(e) => updateParam('density', parseInt(e.target.value))}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter group/tt relative">
                <span className="cursor-help border-b border-dashed border-zinc-700 pb-0.5 hover:border-blue-500/50 transition-colors">Curvature</span>
                <span className="text-blue-400 font-mono">{params.curvature}%</span>
                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                  <div className="text-blue-400 mb-1 font-bold">ARC BIAS:</div>
                  Balances the mathematical ratio between sharp vertices and Bezier curves. 0=Angular, 100=Fluid.
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={params.curvature} 
                onChange={(e) => updateParam('curvature', parseInt(e.target.value))}
                className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="space-y-2 mt-4 pt-2 border-t border-white/5">
                <div className="flex justify-between text-[9px] uppercase tracking-tighter group/tt relative">
                  <span className="cursor-help border-b border-dashed border-zinc-700 pb-0.5 hover:border-blue-500/50 transition-colors text-zinc-500">Hum Resonance</span>
                  <span className="text-blue-400 font-mono">{params.humSpeed}%</span>
                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black border border-blue-500/30 text-[8px] leading-tight text-zinc-400 opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                    <div className="text-blue-400 mb-1 font-bold">OSCILLATION FREQUENCY:</div>
                    Modulates the rotation speed and pulsing rhythm of core geometric rings.
                  </div>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={params.humSpeed} 
                  onChange={(e) => updateParam('humSpeed', parseInt(e.target.value))}
                  className="w-full h-[2px] bg-white/10 appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 pb-2">
            <button 
              onClick={handleSubmit}
              disabled={!word.trim() || isLoading || isGeneratingVariations}
              className="w-full py-4 bg-white text-black text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex flex-col items-center justify-center gap-1 relative overflow-hidden"
            >
              {isLoading && (
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500"
                />
              )}
              
              <div className="flex items-center justify-center gap-2 relative z-10 transition-transform duration-300">
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
                )}
                {isLoading ? synthesisStages[loadingStage] : 'Synthesize'}
              </div>

              {isLoading && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[7px] text-zinc-500 font-mono tracking-tighter"
                >
                  SYST.EXEC // {Math.round(((loadingStage + 1) / synthesisStages.length) * 100)}% COMPLETE
                </motion.span>
              )}
            </button>

            {currentGlyph && (
              <button 
                onClick={handleGenerateVariations}
                disabled={isLoading || isGeneratingVariations}
                className="w-full mt-2 py-3 bg-black/40 border border-white/10 text-white text-[9px] uppercase font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingVariations ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                {isGeneratingVariations ? 'Manifesting Iterations...' : 'Manifest Iterations'}
              </button>
            )}
          </div>
        </aside>

        {/* Center Workspace */}
        <section className="flex-1 relative bg-transparent flex flex-col p-0 min-w-[300px] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {variations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 lg:p-12"
              >
                <div className="max-w-6xl w-full flex flex-col gap-8 h-full">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-serif italic text-white">Visual Iterations</h2>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-mono">Select one fragment to preserve // Others will be discarded</p>
                    </div>
                    <button 
                      onClick={() => setVariations([])}
                      className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar py-4 px-2">
                    {variations.map((v, idx) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative flex flex-col bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all p-4 lg:p-6 cursor-pointer overflow-hidden"
                        onClick={() => selectVariation(v)}
                      >
                        <div className="flex-1 flex items-center justify-center mb-6 min-h-[200px]">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full max-h-[180px] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d={v.paths.join(' ')} 
                              fill="none" 
                              stroke="white" 
                              strokeWidth="1.2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                            />
                          </svg>
                        </div>
                        
                        <div className="space-y-3 z-10 relative">
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-white truncate mr-2">{v.name}</h3>
                            <span className="text-[8px] font-mono text-blue-400 border border-blue-400/30 px-1.5 py-0.5 shrink-0">VAR-0{idx+1}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-serif italic leading-relaxed line-clamp-3">
                            "{v.description}"
                          </p>
                          <div className="pt-4 flex justify-center">
                            <button className="text-[10px] uppercase font-bold tracking-[0.2em] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 px-6 py-2">
                              Preserve Fragment
                            </button>
                          </div>
                        </div>
                        
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-white/0 to-white/0 group-hover:via-white/5 group-hover:transition-all duration-700 pointer-events-none" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 opacity-10 grid-pattern pointer-events-none sticky top-0"></div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-max py-2 lg:py-4 w-full">
            <div className="w-full flex justify-center items-center">
              <GlyphDisplay 
                glyph={currentGlyph} 
                isLoading={isLoading} 
                theme={params.theme}
                material={params.material} 
                color={params.color}
                showParticles={params.showParticles}
                synthesisStage={loadingStage}
                particleSpeed={params.particleSpeed}
                humSpeed={params.humSpeed}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="p-2 lg:p-4 flex justify-between items-end text-[8px] lg:text-[9px] text-zinc-500 font-mono tracking-widest relative z-10 shrink-0 hidden sm:flex sticky bottom-0 bg-gradient-to-t from-black to-transparent">
            <div>COORD: 40.7128N / 74.0060W</div>
            <div className="flex gap-4">
              <span>SEED: {currentGlyph ? currentGlyph.id.toUpperCase() : "INIT-00X"}</span>
              <span className="text-white hidden md:inline">VER: 0.9.4-BETA</span>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Library */}
        <aside className="hidden xl:flex w-[100px] lg:w-[120px] shrink-0 bg-elegant-surface/80 backdrop-blur-xl border-l border-white/5 p-3 flex-col overflow-hidden relative z-20">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-bold italic text-center">Recent</label>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-3">
              {history.map((glyph) => (
                <button
                  key={glyph.id}
                  onClick={() => selectFromHistory(glyph)}
                  className={`aspect-square bg-black border p-2 flex items-center justify-center group cursor-pointer transition-colors overflow-hidden relative ${
                    currentGlyph?.id === glyph.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10 hover:border-blue-500/50'
                  }`}
                >
                  {/* Background Drift Particles (Only for unselected) */}
                  {currentGlyph?.id !== glyph.id && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            x: [Math.random() * 50, Math.random() * 100, Math.random() * 50],
                            y: [Math.random() * 50, Math.random() * 100, Math.random() * 50],
                            opacity: [0, 0.2, 0],
                          }}
                          transition={{
                            duration: 10 + i * 5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="absolute w-0.5 h-0.5 bg-blue-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  <motion.div
                    animate={currentGlyph?.id !== glyph.id ? {
                      opacity: [0.3, 0.5, 0.3],
                      scale: [0.98, 1, 0.98],
                      filter: [
                        'hue-rotate(0deg) saturate(1)',
                        'hue-rotate(15deg) saturate(1.2)',
                        'hue-rotate(0deg) saturate(1)'
                      ]
                    } : {
                      opacity: 1,
                      scale: 1,
                      filter: 'hue-rotate(0deg) saturate(1)'
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-full h-full relative z-10"
                  >
                    <svg viewBox="0 0 100 100" className={`w-full h-full ${currentGlyph?.id === glyph.id ? 'text-blue-400' : 'text-zinc-600 group-hover:text-white'}`}>
                      {glyph.paths.map((p, i) => (
                        <path key={i} d={p} fill="none" stroke="currentColor" strokeWidth="2.5" />
                      ))}
                    </svg>
                  </motion.div>
                </button>
              ))}
              {/* Placeholders if few history items */}
              {Array.from({ length: Math.max(0, 10 - history.length) }).map((_, i) => (
                <div key={i} className="aspect-square bg-black/20 border border-white/5 p-4 flex items-center justify-center opacity-30">
                  <motion.div 
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-full h-full border border-dashed border-white/10" 
                  />
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
          </>
        ) : (
          <Library history={history} onSelect={selectFromHistory} onDelete={deleteFromHistory} />
        )}
      </main>
    </div>
  );
}
