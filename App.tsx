import React, { useState, useEffect } from 'react';
import { Star, AppMode, SpectralType, ObserverState } from './types';
import { generateStars } from './services/starGen';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { InfoOverlay } from './components/InfoOverlay';
import { Telescope, Grid, BarChart3, Globe2, LayoutTemplate } from 'lucide-react';

export default function App() {
  const [stars, setStars] = useState<Star[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.SKY);
  const [observationalPower, setObservationalPower] = useState(0.05); 
  const [activeFilters, setActiveFilters] = useState<SpectralType[]>(Object.values(SpectralType));
  const [visibleCount, setVisibleCount] = useState(0);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);

  // New Observer State
  const [observer, setObserver] = useState<ObserverState>({
    latitude: 45, // Mid-latitude default
    localSiderealTime: 0,
    lightPollutionLimit: 0.2, // Moderate pollution (Suburban)
    isPaused: false,
    timeSpeed: 1,
  });

  // Generate data once on mount
  useEffect(() => {
    const data = generateStars();
    setStars(data);
  }, []);

  const toggleFilter = (type: SpectralType) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const navItems = [
    { id: AppMode.SKY, label: 'Sky View', icon: Telescope },
    { id: AppMode.CLASSIFICATION, label: 'Classification', icon: LayoutTemplate },
    { id: AppMode.GALAXY, label: 'Galaxy', icon: Globe2 },
    { id: AppMode.HR_DIAGRAM, label: 'HR Diagram', icon: BarChart3 },
  ];

  return (
    <div className="w-screen h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans selection:bg-cyan-900 selection:text-cyan-50">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
             <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <h1 className="font-light text-lg tracking-wider text-white">
            THE STARS <span className="text-slate-600 mx-1">|</span> <span className="text-cyan-400 font-medium">A CELESTIAL CENSUS</span>
          </h1>
        </div>

        <nav className="hidden md:flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                `}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Visualization Layer */}
      <main className="absolute inset-0 z-0">
        <Visualizer 
          stars={stars}
          mode={mode}
          observationalPower={observationalPower}
          activeFilters={activeFilters}
          observer={observer}
          setObserver={setObserver}
          onHoverStar={setHoveredStar}
          setStats={setVisibleCount}
        />
      </main>

      {/* Overlays */}
      <InfoOverlay hoveredStar={hoveredStar} mode={mode} />
      
      {/* Controls */}
      <Controls 
        mode={mode}
        observationalPower={observationalPower}
        setObservationalPower={setObservationalPower}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        visibleCount={visibleCount}
        observer={observer}
        setObserver={setObserver}
      />
      
      {/* Mobile Nav Reminder (Hidden on Desktop) */}
      <div className="md:hidden fixed top-20 right-4 z-40">
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value as AppMode)}
          className="bg-slate-800 text-white border border-slate-600 p-2 rounded shadow-lg text-sm"
        >
          {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

    </div>
  );
}