import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import ThemeDropdown from './ThemeDropdown';
import { soundEngine } from '../utils/audio';

export default function Navbar({ 
  currentTheme, 
  onSelectTheme, 
  completedCount = 0 
}) {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(!soundEngine.isPlayingAmbient);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const isPlaying = soundEngine.toggleAmbient(currentTheme.audioFreq);
    setIsMuted(!isPlaying);
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-4 sm:px-8 border-b transition-colors duration-500 backdrop-blur-md sticky top-0 z-40"
            style={{ 
              borderColor: currentTheme.cardBorder,
              background: currentTheme.type === 'light' 
                ? 'rgba(255, 255, 255, 0.45)' 
                : 'rgba(10, 15, 28, 0.4)'
            }}>
      {/* Brand: The Task */}
      <div className="flex items-center gap-3">
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md relative overflow-hidden"
          style={{
            background: currentTheme.accent,
            boxShadow: `0 0 20px ${currentTheme.accentGlow}66`
          }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
          <Layers className="w-5 h-5 text-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 
              id="app-title"
              className="text-lg sm:text-xl font-extrabold tracking-tight"
              style={{ color: currentTheme.textPrimary }}
            >
              The Task
            </h1>
            <span 
              className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
              style={{
                borderColor: `${currentTheme.accent}40`,
                background: `${currentTheme.accent}18`,
                color: currentTheme.accent
              }}
            >
              v2.0
            </span>
          </div>
          <p className="text-[11px] font-medium hidden sm:block opacity-75"
             style={{ color: currentTheme.textMuted }}>
            Atmospheric Focus & Radial Interface
          </p>
        </div>
      </div>

      {/* Center Live Clock & Task Indicator */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: currentTheme.cardBorder,
            background: currentTheme.cardBg,
            color: currentTheme.textSecondary
          }}
        >
          <span 
            className="w-2 h-2 rounded-full animate-ping"
            style={{ background: currentTheme.accent }}
          />
          <span>{timeStr || '12:00'}</span>
        </div>

        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: currentTheme.cardBorder,
            background: currentTheme.cardBg,
            color: currentTheme.textSecondary
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{completedCount} Done</span>
        </div>
      </div>

      {/* Right Controls: Ambient Audio Toggle & Theme Menu Dropdown */}
      <div className="flex items-center gap-3">
        {/* Ambient Soundscape Toggle */}
        <button
          onClick={toggleSound}
          id="soundscape-toggle-button"
          className="p-2 sm:px-3 sm:py-2 rounded-full flex items-center gap-2 transition-all duration-300 cursor-pointer border backdrop-blur-md"
          style={{
            background: isMuted ? 'transparent' : `${currentTheme.accent}22`,
            borderColor: isMuted ? currentTheme.cardBorder : currentTheme.accent,
            color: isMuted ? currentTheme.textMuted : currentTheme.accent
          }}
          title={isMuted ? 'Unmute Ambient Soundscape' : 'Mute Ambient Soundscape'}
          aria-label="Toggle ambient soundscape"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <>
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium hidden sm:inline">
                {currentTheme.audioFreq}Hz
              </span>
            </>
          )}
        </button>

        {/* Theme Menu Icon Dropdown (as depicted in video prompt) */}
        <ThemeDropdown 
          currentTheme={currentTheme} 
          onSelectTheme={onSelectTheme} 
        />
      </div>
    </header>
  );
}
