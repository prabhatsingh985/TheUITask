import React, { useState, useRef, useEffect } from 'react';
import { THEME_LIST } from '../themes';
import { soundEngine } from '../utils/audio';

// Custom Rising Sun / Celestial Iris Icon from screenshot
function SolarIrisIcon({ className = '', style = {} }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={style}
    >
      {/* Central eye / sun circle */}
      <circle cx="12" cy="13" r="3.2" />
      {/* Radiating solar dots/arcs on top */}
      <circle cx="12" cy="5.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="7.8" r="1" fill="currentColor" />
      <circle cx="17.5" cy="7.8" r="1" fill="currentColor" />
      <circle cx="4.5" cy="13" r="1" fill="currentColor" />
      <circle cx="19.5" cy="13" r="1" fill="currentColor" />
      {/* Subtle horizon arc */}
      <path d="M5 19h14" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

export default function ThemeDropdown({ currentTheme, onSelectTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const handleSelect = (theme) => {
    soundEngine.playThemeSwitchChime(theme.audioFreq);
    onSelectTheme(theme.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Theme Icon Button (Exact square button from screenshot) */}
      <button
        id="theme-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 shadow-sm"
        style={{
          background: currentTheme.themeBtnBg,
          border: `1px solid ${currentTheme.themeBtnBorder}`,
          color: currentTheme.themeBtnColor,
          boxShadow: isOpen ? `0 0 15px ${currentTheme.coreGlow}` : 'none'
        }}
        aria-label="Toggle theme menu"
        aria-expanded={isOpen}
      >
        <SolarIrisIcon className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
      </button>

      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 transition-all duration-200 backdrop-blur-2xl animate-dropdown-fade shadow-2xl"
          style={{
            background: currentTheme.type === 'light' 
              ? 'rgba(255, 255, 255, 0.92)' 
              : 'rgba(15, 20, 38, 0.94)',
            border: `1px solid ${currentTheme.themeBtnBorder}`,
            boxShadow: `0 20px 45px -10px rgba(0,0,0,0.35), 0 0 25px ${currentTheme.coreGlow}`
          }}
        >
          <div className="px-3 py-1.5 border-b mb-1 flex items-center justify-between"
               style={{ borderColor: currentTheme.themeBtnBorder }}>
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-60"
                  style={{ color: currentTheme.textTitle }}>
              Atmosphere
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium"
                  style={{ 
                    background: `${currentTheme.themeBtnColor}20`, 
                    color: currentTheme.themeBtnColor 
                  }}>
              {THEME_LIST.length} Themes
            </span>
          </div>

          <div className="space-y-1">
            {THEME_LIST.map((t) => {
              const isSelected = t.id === currentTheme.id;

              return (
                <button
                  key={t.id}
                  id={`theme-option-${t.id}`}
                  onClick={() => handleSelect(t)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 group cursor-pointer"
                  style={{
                    background: isSelected 
                      ? `${t.themeBtnColor}18` 
                      : 'transparent',
                    border: isSelected 
                      ? `1px solid ${t.themeBtnColor}40` 
                      : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = currentTheme.type === 'light' 
                        ? 'rgba(0, 0, 0, 0.05)' 
                        : 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch circle */}
                    <div 
                      className="w-5 h-5 rounded-full shadow-inner ring-1 ring-white/30 flex-shrink-0"
                      style={{ background: t.swatch }}
                    />

                    <div>
                      <div className="text-xs font-semibold"
                           style={{ color: isSelected ? t.themeBtnColor : currentTheme.textTitle }}>
                        {t.name}
                      </div>
                      <div className="text-[10px] opacity-65 truncate max-w-[145px]"
                           style={{ color: currentTheme.textTitle }}>
                        {t.tagline}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: t.themeBtnColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
