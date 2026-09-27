import React, { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { TIME_PERIODS } from '../themes';

export default function SettingsGearDropdown({ currentTheme, onSelectTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click or escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  const handleSelect = (item) => {
    onSelectTheme(item.id);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Settings Gear Icon Button (Top Right) */}
      <button
        id="settings-gear-button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer backdrop-blur-md border shadow-sm hover:scale-105 active:scale-95"
        style={{
          background: currentTheme.type === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.08)',
          borderColor: currentTheme.borderColor,
          color: currentTheme.textColor,
          boxShadow: isOpen ? `0 0 20px ${currentTheme.activeGlow}55` : 'none'
        }}
        aria-label="Settings time of day menu"
        aria-expanded={isOpen}
      >
        <Settings 
          className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-90' : 'hover:rotate-45'}`}
          style={{ color: currentTheme.subTextColor }}
        />
      </button>

      {/* Fade-in Drop-down Menu */}
      {isOpen && (
        <div
          id="time-of-day-dropdown"
          className="absolute right-0 mt-2.5 w-64 rounded-2xl p-2 z-50 transition-all duration-200 backdrop-blur-2xl border shadow-2xl animate-dropdown-fade"
          style={{
            background: currentTheme.type === 'light' 
              ? 'rgba(255, 255, 255, 0.94)' 
              : 'rgba(12, 16, 32, 0.94)',
            borderColor: currentTheme.borderColor,
            boxShadow: `0 20px 45px -10px rgba(0,0,0,0.5), 0 0 25px ${currentTheme.coreGlow}`
          }}
        >
          <div className="px-3 py-2 border-b mb-1 flex items-center justify-between"
               style={{ borderColor: currentTheme.borderColor }}>
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-60"
                  style={{ color: currentTheme.textColor }}>
              Time of Day
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium"
                  style={{ 
                    background: `${currentTheme.subTextColor}20`, 
                    color: currentTheme.subTextColor 
                  }}>
              6 Themes
            </span>
          </div>

          <div className="space-y-1">
            {TIME_PERIODS.map((period) => {
              const isSelected = period.id === currentTheme.id;

              return (
                <button
                  key={period.id}
                  id={`theme-option-${period.id}`}
                  onClick={() => handleSelect(period)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 group cursor-pointer"
                  style={{
                    background: isSelected 
                      ? `${period.subTextColor}20` 
                      : 'transparent',
                    border: isSelected 
                      ? `1px solid ${period.subTextColor}40` 
                      : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = currentTheme.type === 'light' 
                        ? 'rgba(0, 0, 0, 0.04)' 
                        : 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch circle */}
                    <div 
                      className="w-4 h-4 rounded-full shadow-inner ring-1 ring-white/20 flex-shrink-0"
                      style={{ background: period.swatch }}
                    />
                    <div>
                      <div className="text-xs font-semibold"
                           style={{ color: isSelected ? period.subTextColor : currentTheme.textColor }}>
                        {period.name}
                      </div>
                      <div className="text-[10px] opacity-60 truncate max-w-[140px]"
                           style={{ color: currentTheme.textColor }}>
                        {period.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: period.subTextColor, color: '#ffffff' }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
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
