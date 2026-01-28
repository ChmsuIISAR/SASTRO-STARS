import React, { useRef, useEffect, useState } from 'react';
import { Star, AppMode, SpectralType, ObserverState } from '../types';

interface VisualizerProps {
  stars: Star[];
  mode: AppMode;
  observationalPower: number;
  activeFilters: SpectralType[];
  observer: ObserverState;
  setObserver: (obs: ObserverState) => void;
  onHoverStar: (star: Star | null) => void;
  setStats: (visible: number) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  stars, 
  mode, 
  observationalPower, 
  activeFilters,
  observer,
  setObserver,
  onHoverStar,
  setStats
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dpr, setDpr] = useState(1);
  const lastTimeRef = useRef<number>(0);

  // Keep latest observer state in ref to avoid restarting effect loop
  const observerRef = useRef(observer);
  useEffect(() => {
    observerRef.current = observer;
  }, [observer]);

  // Transition state
  const transitionRef = useRef({
    progress: 1, 
    sourceMode: mode,
    targetMode: mode,
    startTime: 0,
    duration: 1500 
  });

  // Derived limits
  const instrumentLimit = 3 + (observationalPower * 12);
  const pollutionLimit = 2.5 + (observer.lightPollutionLimit * 4.5);
  const effectiveLimit = Math.min(instrumentLimit, pollutionLimit + (observationalPower * 5));

  useEffect(() => {
    if (mode !== transitionRef.current.targetMode) {
      transitionRef.current.sourceMode = transitionRef.current.targetMode;
      transitionRef.current.targetMode = mode;
      transitionRef.current.progress = 0;
      transitionRef.current.startTime = performance.now();
    }
  }, [mode]);

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      const currentObserver = observerRef.current;
      
      // 1. Time & Rotation Update
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!currentObserver.isPaused && mode === AppMode.SKY) {
        // Update LST (Earth Rotation)
        const newLST = (currentObserver.localSiderealTime + (delta * 0.01 * currentObserver.timeSpeed)) % 360;
        // Optimization: Only update React state if change is significant to reduce renders, 
        // OR rely on parent to not kill us. 
        // Since we decoupled the loop from observer prop, calling setObserver is safe-ish,
        // but it triggers parent render -> this component render -> observerRef update.
        // It won't break the loop.
        setObserver({ ...currentObserver, localSiderealTime: newLST });
      }

      // 2. Transition Math
      let t = transitionRef.current.progress;
      if (t < 1) {
        const elapsed = time - transitionRef.current.startTime;
        t = Math.min(elapsed / transitionRef.current.duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        transitionRef.current.progress = ease;
        // Use eased t for interpolation
        t = ease;
      }

      // 3. Canvas Setup
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.scale(dpr, dpr);

      // 4. Background
      // Blend background if transitioning
      if (mode === AppMode.SKY || (mode === AppMode.CLASSIFICATION && t < 1) || (transitionRef.current.sourceMode === AppMode.SKY && t < 1)) {
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0f172a'); 
        gradient.addColorStop(0.4, '#020617'); 
        gradient.addColorStop(1, '#000000'); 
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#020617';
      }
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const scaleFactor = Math.min(width, height) * 0.4;
      const deg2rad = Math.PI / 180;

      // Pre-calc Observer math
      const latRad = currentObserver.latitude * deg2rad;
      const sinLat = Math.sin(latRad);
      const cosLat = Math.cos(latRad);
      const lstRad = currentObserver.localSiderealTime * deg2rad;

      let visibleCount = 0;

      stars.forEach(star => {
        // --- Global Filter Checks ---
        if (!activeFilters.includes(star.spectralType)) return;
        if (star.apparentMagnitude > effectiveLimit) return;

        // --- Projection Logic ---
        
        // Calculate Alt/Az for Sky View always (needed for transitions)
        const raRad = star.ra * deg2rad;
        const decRad = star.dec * deg2rad;
        let haRad = lstRad - raRad;
        
        const sinDec = Math.sin(decRad);
        const cosDec = Math.cos(decRad);
        const cosHA = Math.cos(haRad);
        const sinHA = Math.sin(haRad);

        const sinAlt = sinDec * sinLat + cosDec * cosLat * cosHA;
        const altRad = Math.asin(sinAlt);
        const altDeg = altRad * (180/Math.PI);
        const cosAlt = Math.cos(altRad);
        const cosAz = (sinDec - sinAlt * sinLat) / (cosAlt * cosLat + 0.0001);
        const sinAz = (-cosDec * sinHA) / (cosAlt + 0.0001);
        const azRad = Math.atan2(sinAz, cosAz);

        // --- Horizon Culling Strategy ---
        // If we are fully in SKY mode, cull.
        // If we are transitioning, DO NOT CULL, let them fly.
        // Exception: If target is SKY, stars landing far below horizon can be skipped if t=1.
        if (transitionRef.current.progress >= 1 && (mode === AppMode.SKY || mode === AppMode.CLASSIFICATION)) {
           if (altDeg < -5) return; // Hard cull when stable
        }

        // --- Screen Position Calculation ---
        const getScreenPos = (m: AppMode) => {
          switch (m) {
            case AppMode.HR_DIAGRAM:
              // HR Diagram is normalized -1 to 1.
              return { 
                x: star.hrX * scaleFactor * 1.5, 
                y: star.hrY * scaleFactor * 0.8 
              };
            
            case AppMode.GALAXY:
               // Galaxy Rotation
               // Use a fixed rotation if paused? No, let galaxy always spin slowly.
               const rot = time * 0.00005;
               const gx = star.galX * Math.cos(rot) - star.galY * Math.sin(rot);
               const gy = star.galX * Math.sin(rot) + star.galY * Math.cos(rot);
               // Tilt view (Galactic coords are -1 to 1)
               return { 
                 x: gx * scaleFactor * 2.5, 
                 y: (gy * 0.4 + star.galZ * 20) * scaleFactor * 2.5 
               };
            
            case AppMode.SKY:
            case AppMode.CLASSIFICATION:
            default:
              // Polar Projection
              const r = ((90 - altDeg) / 90); 
              const theta = azRad - Math.PI / 2;
              return { 
                x: r * Math.cos(theta) * scaleFactor * 1.8, 
                y: r * Math.sin(theta) * scaleFactor * 1.8
              };
          }
        };

        const startPos = getScreenPos(transitionRef.current.sourceMode);
        const endPos = getScreenPos(transitionRef.current.targetMode);

        const currentX = centerX + (startPos.x + (endPos.x - startPos.x) * t);
        const currentY = centerY + (startPos.y + (endPos.y - startPos.y) * t);

        // --- Appearance Logic ---
        let radius = Math.max(0.5, (15 - star.apparentMagnitude) / 5);
        if (mode === AppMode.HR_DIAGRAM) {
          // In HR, size based on physical radius, but clamped for visibility
          // Log scale radius?
           radius = Math.log10(star.radius * 10) * 2; 
           if (radius < 1) radius = 1;
        }

        let alpha = 1;
        // Fade out faint stars
        if (star.apparentMagnitude > effectiveLimit - 1) {
          alpha = (effectiveLimit - star.apparentMagnitude);
        }

        // Atmospheric Extinction (Only in Sky modes)
        // If transitioning, interpolate extinction effect
        let extinction = 0;
        if (altDeg < 30) {
             extinction = (30 - altDeg) / 30;
        }
        
        let extinctionFactor = 1;
        if (mode === AppMode.SKY || mode === AppMode.CLASSIFICATION) {
           extinctionFactor = (1 - (extinction * 0.7)); 
        } else if (transitionRef.current.sourceMode === AppMode.SKY) {
           // Fade out extinction effect as we leave sky
           const skyExtinction = (1 - (extinction * 0.7));
           extinctionFactor = skyExtinction + (1 - skyExtinction) * t;
        }

        alpha *= extinctionFactor;

        // Fade out stars below horizon during transition to prevent them being visible outside circle
        if (altDeg < 0 && (mode === AppMode.SKY || transitionRef.current.targetMode === AppMode.SKY)) {
             // If target is sky, fade out as they go below horizon
             const horizonFade = Math.max(0, 1 + (altDeg / 5)); // Fade out over 5 degrees below horizon
             alpha *= horizonFade;
        }

        if (alpha <= 0) return;

        visibleCount++;

        ctx.beginPath();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        
        // Glow logic
        if (radius > 1.8 && alpha > 0.5) {
           ctx.shadowBlur = radius * 3;
           ctx.shadowColor = star.color;
        } else {
           ctx.shadowBlur = 0;
        }

        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Horizon Circle & Indicators
      const drawHorizon = (opacity: number) => {
         ctx.globalAlpha = opacity;
         ctx.beginPath();
         ctx.strokeStyle = '#1e293b';
         ctx.lineWidth = 2;
         ctx.arc(centerX, centerY, scaleFactor * 1.8, 0, Math.PI * 2);
         ctx.stroke();
         
         ctx.font = '12px monospace';
         ctx.fillStyle = '#64748b';
         ctx.textAlign = 'center';
         ctx.fillText('N', centerX, centerY - scaleFactor * 1.8 - 10);
         ctx.fillText('S', centerX, centerY + scaleFactor * 1.8 + 20);
         ctx.fillText('E', centerX + scaleFactor * 1.8 + 15, centerY + 4);
         ctx.fillText('W', centerX - scaleFactor * 1.8 - 15, centerY + 4);

         // Draw crosshair or Zenith
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(centerX - 1, centerY - 5, 2, 10);
         ctx.fillRect(centerX - 5, centerY - 1, 10, 2);
      };

      if (mode === AppMode.SKY || mode === AppMode.CLASSIFICATION) {
         drawHorizon(t); // Fade in if entering, solid if there
      } else if (transitionRef.current.sourceMode === AppMode.SKY) {
         drawHorizon(1 - t); // Fade out if leaving
      }
      
      // Draw HR Diagram Axes if in HR mode
      if (mode === AppMode.HR_DIAGRAM) {
         ctx.globalAlpha = t;
         ctx.strokeStyle = '#334155';
         ctx.lineWidth = 2;
         
         // Axis lines
         ctx.beginPath();
         // Y Axis (Luminosity)
         ctx.moveTo(centerX - scaleFactor * 1.6, centerY - scaleFactor * 0.9);
         ctx.lineTo(centerX - scaleFactor * 1.6, centerY + scaleFactor * 0.9);
         // X Axis (Temp)
         ctx.moveTo(centerX - scaleFactor * 1.6, centerY + scaleFactor * 0.9);
         ctx.lineTo(centerX + scaleFactor * 1.6, centerY + scaleFactor * 0.9);
         ctx.stroke();

         ctx.fillStyle = '#94a3b8';
         ctx.font = '10px sans-serif';
         ctx.textAlign = 'right';
         ctx.fillText('Luminosity (Solar)', centerX - scaleFactor * 1.7, centerY);
         ctx.textAlign = 'center';
         ctx.fillText('Temperature (Kelvin)', centerX, centerY + scaleFactor * 1.0);
         
         // Labels
         ctx.fillText('10⁶', centerX - scaleFactor * 1.7, centerY - scaleFactor * 0.8);
         ctx.fillText('10⁻⁴', centerX - scaleFactor * 1.7, centerY + scaleFactor * 0.8);
         
         ctx.fillText('40,000K', centerX - scaleFactor * 1.5, centerY + scaleFactor * 1.0);
         ctx.fillText('2,000K', centerX + scaleFactor * 1.5, centerY + scaleFactor * 1.0);
      }

      setStats(visibleCount);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [stars, mode, effectiveLimit, activeFilters, dpr]); 
  // Removed observer from dependencies to prevent loop kill. Accessed via ref.

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full cursor-crosshair block"
      onMouseMove={(e) => {
         onHoverStar(null); // Simple hit test disabled for perf during anim
      }}
    />
  );
};