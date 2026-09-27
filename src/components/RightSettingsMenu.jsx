import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  X, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Camera, 
  Sparkles, 
  Activity,
  ChevronDown
} from 'lucide-react';
import { COLOR_PALETTES } from './ParticleDataSphere';
import { soundEngine } from '../utils/audio';

export default function RightSettingsMenu({
  paletteIndex,
  onSelectPalette,
  autoShift,
  onToggleAutoShift,
  expansion,
  onChangeExpansion,
  cameraSpeed,
  onChangeCameraSpeed,
  glowIntensity,
  onChangeGlowIntensity,
  networkDensity,
  onChangeNetworkDensity,
  currentPalette
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const menuRef = useRef(null);

  // Close on Escape or Outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSound = () => {
    const isPlaying = soundEngine.toggleAmbient(currentPalette.audioFreq);
    setIsMuted(!isPlaying);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Right Side Settings Trigger Button */}
      <button
        id="settings-dropdown-button"
        onClick={() => {
          setIsOpen(!isOpen);
          soundEngine.playRadialHoverBlip(540);
        }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-200 cursor-pointer backdrop-blur-xl border shadow-lg"
        style={{
          background: isOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isOpen ? `rgb(${currentPalette.primary.join(',')})` : 'rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          boxShadow: isOpen ? `0 0 20px rgba(${currentPalette.primary.join(',')}, 0.35)` : 'none'
        }}
        aria-label="Toggle settings menu"
      >
        <Sliders className="w-3.5 h-3.5" style={{ color: `rgb(${currentPalette.primary.join(',')})` }} />
        <span className="hidden sm:inline">Settings</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Right Side Dropdown Settings Panel */}
      {isOpen && (
        <div
          id="settings-dropdown-panel"
          className="absolute right-0 mt-3 w-80 rounded-2xl p-4 z-50 transition-all duration-200 backdrop-blur-2xl border shadow-2xl animate-dropdown-fade font-sans"
          style={{
            background: 'rgba(8, 12, 24, 0.94)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.7), 0 0 30px rgba(${currentPalette.primary.join(',')}, 0.2)`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-3.5"
               style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: `rgb(${currentPalette.primary.join(',')})` }} />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-white/90">
                Visualization Settings
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white/90 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Color Palette Selector */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2">
                Color Tones
              </label>
              <div className="space-y-1.5">
                {COLOR_PALETTES.map((pal, idx) => {
                  const isSelected = paletteIndex === idx && !autoShift;
                  return (
                    <button
                      key={pal.id}
                      onClick={() => onSelectPalette(idx)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border"
                      style={{
                        background: isSelected ? `rgba(${pal.primary.join(',')}, 0.2)` : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isSelected ? `rgb(${pal.primary.join(',')})` : 'rgba(255, 255, 255, 0.06)',
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ background: `rgb(${pal.primary.join(',')})` }}
                        />
                        <span className="font-sans text-xs font-medium">{pal.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold" style={{ color: `rgb(${pal.primary.join(',')})` }}>
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Auto Smooth Color Shift Toggle */}
                <button
                  onClick={onToggleAutoShift}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer border"
                  style={{
                    background: autoShift ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: autoShift ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                    color: autoShift ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCw className={`w-3 h-3 ${autoShift ? 'animate-spin-slow text-emerald-400' : ''}`} />
                    <span className="font-sans text-xs font-medium">Smooth Auto-Shift</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold ${autoShift ? 'text-emerald-400' : 'text-white/30'}`}>
                    {autoShift ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Expansion Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="uppercase tracking-wider text-white/50">Radiating Lines Expansion</span>
                <span className="text-white/80">{Math.round(expansion * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.65"
                max="1.45"
                step="0.01"
                value={expansion}
                onChange={(e) => onChangeExpansion(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Camera Motion Speed Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="uppercase tracking-wider text-white/50">Camera Motion Speed</span>
                <span className="text-white/80">{cameraSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                value={cameraSpeed}
                onChange={(e) => onChangeCameraSpeed(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Soft Diffused Lighting Glow */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="uppercase tracking-wider text-white/50">Lighting Glow Intensity</span>
                <span className="text-white/80">{Math.round(glowIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.6"
                step="0.05"
                value={glowIntensity}
                onChange={(e) => onChangeGlowIntensity(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Network Mesh Density */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="uppercase tracking-wider text-white/50">Network Mesh Density</span>
                <span className="text-white/80">{Math.round(networkDensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.6"
                step="0.05"
                value={networkDensity}
                onChange={(e) => onChangeNetworkDensity(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Audio Toggle */}
            <div className="pt-2 border-t flex items-center justify-between"
                 style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <span className="text-[11px] uppercase tracking-wider text-white/50">Harmonic Audio</span>
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg border transition-all cursor-pointer"
                style={{
                  background: isMuted ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
                  borderColor: isMuted ? 'rgba(255, 255, 255, 0.12)' : `rgb(${currentPalette.primary.join(',')})`,
                  color: isMuted ? 'rgba(255, 255, 255, 0.4)' : '#ffffff'
                }}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
