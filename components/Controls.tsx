import React from 'react';
import { Eye, ListFilter, Play, Pause, FastForward, Globe, LightbulbOff } from 'lucide-react';
import { AppMode, SpectralType, ObserverState } from '../types';

interface ControlsProps {
  mode: AppMode;
  observationalPower: number;
  setObservationalPower: (val: number) => void;
  activeFilters: SpectralType[];
  toggleFilter: (type: SpectralType) => void;
  visibleCount: number;
  observer: ObserverState;
  setObserver: (obs: ObserverState) => void;
}

const POWER_PRESETS = [
  { label: 'Naked Eye', value: 0.05, maxRange: 0.2, desc: 'Limit ~Mag 6 (Human Eye)' },
  { label: 'Binoculars', value: 0.35, maxRange: 0.5, desc: 'Limit ~Mag 10 (7x50)' },
  { label: 'Telescope', value: 0.65, maxRange: 0.8, desc: 'Limit ~Mag 13 (6-inch)' },
  { label: 'Deep Survey', value: 1.0, maxRange: 1.1, desc: 'Limit ~Mag 16+ (Observatory)' }
];

export const Controls: React.FC<ControlsProps> = ({
  mode,
  observationalPower,
  setObservationalPower,
  activeFilters,
  toggleFilter,
  visibleCount,
  observer,
  setObserver
}) => {
  
  const currentPresetIndex = POWER_PRESETS.findIndex(p => observationalPower < p.maxRange);
  const activePreset = POWER_PRESETS[currentPresetIndex === -1 ? POWER_PRESETS.length - 1 : currentPresetIndex];

  const updateObserver = (key: keyof ObserverState, value: any) => {
    setObserver({ ...observer, [key]: value });
  };

  return (
    <>
      {/* LEFT PANEL: Observer Context (Only in Sky-related modes) */}
      {(mode === AppMode.SKY || mode === AppMode.CLASSIFICATION) && (
        <div className="fixed bottom-6 left-6 z-20 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-slate-200 animate-slide-up">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            <Globe size={12} /> Earth Observer
          </div>

          {/* Time Controls */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Diurnal Motion</span>
              <span className="font-mono text-cyan-400">
                 LST: {Math.floor(observer.localSiderealTime)}°
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => updateObserver('isPaused', !observer.isPaused)}
                className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-cyan-400"
              >
                {observer.isPaused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor" />}
              </button>
              <input 
                type="range" min="0" max="10" step="0.5"
                value={observer.timeSpeed}
                onChange={(e) => updateObserver('timeSpeed', parseFloat(e.target.value))}
                className="flex-1 h-8 bg-slate-800 rounded appearance-none cursor-ew-resize accent-cyan-500"
              />
              <FastForward size={16} className="text-slate-500 my-auto"/>
            </div>
          </div>

          {/* Latitude */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Latitude</span>
              <span className="font-mono">{observer.latitude}° N</span>
            </div>
            <input 
              type="range" min="0" max="90" step="1"
              value={observer.latitude}
              onChange={(e) => updateObserver('latitude', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

           {/* Light Pollution */}
           <div>
            <div className="flex justify-between text-xs mb-1">
              <div className="flex items-center gap-1"><LightbulbOff size={12}/> Light Pollution</div>
              <span className="font-mono text-amber-400">
                {observer.lightPollutionLimit < 0.2 ? 'Urban' : observer.lightPollutionLimit > 0.8 ? 'Dark Sky' : 'Suburban'}
              </span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={observer.lightPollutionLimit}
              onChange={(e) => updateObserver('lightPollutionLimit', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* CENTER PANEL: Instrument Controls */}
      <div className="fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center items-end z-20">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-2xl pointer-events-auto max-w-4xl w-full mx-6 flex flex-col md:flex-row gap-8 items-center text-slate-200">
          
          {/* Counter Section */}
          <div className="flex flex-col items-center md:items-start min-w-[150px]">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Census Count</div>
            <div className="text-4xl font-mono text-cyan-400 tabular-nums">
              {visibleCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Stars Detected</div>
          </div>

          {/* Dynamic Controls based on Mode */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Observational Power Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <Eye size={16} /> Instrument Power
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  {activePreset.desc}
                </span>
              </div>

              {/* Presets Row */}
              <div className="grid grid-cols-4 gap-2">
                {POWER_PRESETS.map((preset) => {
                  const isActive = preset.label === activePreset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setObservationalPower(preset.value)}
                      className={`
                        relative px-2 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 border
                        flex flex-col items-center justify-center gap-1
                        ${isActive 
                          ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105 z-10' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600 hover:text-slate-200'}
                      `}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Fine-tune Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={observationalPower}
                onChange={(e) => setObservationalPower(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all opacity-80 hover:opacity-100"
              />
            </div>

            {/* Spectral Filters */}
            {(mode === AppMode.CLASSIFICATION || mode === AppMode.HR_DIAGRAM) && (
              <div className="space-y-3 animate-fade-in pt-2 border-t border-slate-800">
                 <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                  <ListFilter size={16} /> Spectral Filter
                </div>
                <div className="flex gap-1 justify-between">
                  {(Object.keys(SpectralType) as SpectralType[]).map((type) => {
                    const isActive = activeFilters.includes(type);
                    let colorClass = "";
                    switch(type) {
                      case 'O': colorClass = "shadow-[0_0_10px_#9bb0ff] border-[#9bb0ff]"; break;
                      case 'M': colorClass = "shadow-[0_0_10px_#ffcc6f] border-[#ffcc6f]"; break;
                      default: colorClass = "shadow-none";
                    }
                    
                    return (
                      <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={`
                          w-10 h-10 rounded-full font-bold text-xs transition-all duration-300 border
                          ${isActive 
                            ? `bg-slate-700 text-white ${colorClass || 'border-slate-500'}` 
                            : 'bg-transparent text-slate-600 border-slate-800 hover:border-slate-600'}
                        `}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};