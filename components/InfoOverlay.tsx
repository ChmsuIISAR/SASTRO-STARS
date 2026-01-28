import React from 'react';
import { Star, AppMode } from '../types';

interface InfoOverlayProps {
  hoveredStar: Star | null;
  mode: AppMode;
}

const NARRATIVES: Record<AppMode, React.ReactNode> = {
  [AppMode.SKY]: (
    <>
      <h2 className="text-2xl font-light text-white mb-2">The Living Sky</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        You are standing on a rotating planet. The stars rise and set not because they move, but because <strong className="text-white">Earth spins</strong>.
        <br/><br/>
        Adjust <strong className="text-cyan-400">Time Speed</strong> to see the diurnal motion. Change your <strong className="text-cyan-400">Latitude</strong> to see how the sky changes from the Equator to the Poles. Notice how Light Pollution (in the Observer panel) hides the faint stars that exist just beyond your sight.
      </p>
    </>
  ),
  [AppMode.CLASSIFICATION]: (
    <>
      <h2 className="text-2xl font-light text-white mb-2">Spectral Census</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        A census is about categorizing populations. 
        <br/><br/>
        Use the <strong className="text-white">Spectral Filters</strong> below. When you select 'O' (Blue), you see rare, bright giants. When you select 'M' (Red), you see the common but faint dwarfs. 
        <br/><br/>
        Most stars in the universe are M-dwarfs, yet they are invisible to the naked eye.
      </p>
    </>
  ),
  [AppMode.GALAXY]: (
    <>
      <h2 className="text-2xl font-light text-white mb-2">Galactic Context</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We leave the Earth's surface to view our census from outside.
        <br/><br/>
        The band of light you saw in the sky is actually the disk of the Milky Way. Our census is just a small sample of this structure.
      </p>
    </>
  ),
  [AppMode.HR_DIAGRAM]: (
    <>
      <h2 className="text-2xl font-light text-white mb-2">The Astronomer's Map</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        This is the Hertzsprung–Russell Diagram. It maps stars by <strong className="text-amber-300">Temperature</strong> (X-axis) and <strong className="text-amber-300">Luminosity</strong> (Y-axis).
        <br/><br/>
        Watch how the "Main Sequence" diagonal appears. If you increase observational power, the bottom right fills with faint red stars.
      </p>
    </>
  ),
  [AppMode.CENSUS]: (
    <>
      <h2 className="text-2xl font-light text-white mb-2">Data & Discovery</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        Your star count is not the total number of stars in the universe—it is only what your instrument could detect from your location, through your atmosphere.
        <br/><br/>
        Every astronomical catalog is biased by the observer's limits.
      </p>
    </>
  )
};

export const InfoOverlay: React.FC<InfoOverlayProps> = ({ hoveredStar, mode }) => {
  return (
    <>
      {/* Mode Narrative - Top Left */}
      <div className="fixed top-24 left-6 md:left-12 max-w-sm z-10 pointer-events-none">
        <div className="bg-slate-950/50 backdrop-blur-sm p-6 border-l border-slate-700 animate-fade-in-slow">
          {NARRATIVES[mode]}
        </div>
      </div>

      {/* Star Info Tooltip */}
      {hoveredStar && (
        <div className="fixed top-24 right-6 md:right-12 w-64 bg-slate-900/95 border border-slate-600 p-4 rounded-lg shadow-xl text-sm z-30 animate-scale-in">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
            <div 
              className="w-4 h-4 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: hoveredStar.color, color: hoveredStar.color }}
            ></div>
            <span className="font-bold text-slate-200">Star #{hoveredStar.id}</span>
          </div>
          
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Class</span>
              <span className="font-mono text-cyan-300 font-bold">{hoveredStar.spectralType}-Type</span>
            </div>
             <div className="flex justify-between">
              <span className="text-slate-500">Apparent Mag</span>
              <span>{hoveredStar.apparentMagnitude.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Distance</span>
              <span>{hoveredStar.distance.toFixed(1)} pc</span>
            </div>
             <div className="flex justify-between">
              <span className="text-slate-500">RA / Dec</span>
              <span className="text-[10px] font-mono mt-1">
                {Math.floor(hoveredStar.ra)}° / {Math.floor(hoveredStar.dec)}°
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-xs italic text-slate-500">
              {hoveredStar.apparentMagnitude > 6 ? "Invisible to naked eye." : "Visible to naked eye."}
            </div>
          </div>
        </div>
      )}
    </>
  );
};