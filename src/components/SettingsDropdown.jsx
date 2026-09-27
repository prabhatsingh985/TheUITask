import React, { useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { THEMES } from '../themes';

export default function SettingsDropdown({
  currentTheme,
  isOpen,
  onToggleOpen,
  onSelectOption
}) {
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) onToggleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggleOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Settings Gear Button (Upper-right corner) */}
      <button
        id="settings-gear-btn"
        onClick={() => onToggleOpen(!isOpen)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer backdrop-blur-md border shadow-sm select-none"
        style={{
          background: currentTheme.gearBg,
          borderColor: currentTheme.gearBorder,
          color: currentTheme.gearColor
        }}
        aria-label="Settings"
      >
        <Settings 
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-500 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Neat Dropdown Menu with 6 Options in Exact Order & Spelling */}
      {isOpen && (
        <div
          id="time-of-day-menu"
          className="absolute right-0 mt-2 w-48 rounded-xl py-1.5 z-50 transition-all duration-200 backdrop-blur-2xl border shadow-xl animate-dropdown-fade select-none font-sans"
          style={{
            background: currentTheme.menuBg,
            borderColor: currentTheme.menuBorder,
            boxShadow: `0 15px 35px -8px rgba(0,0,0,0.4)`
          }}
        >
          {THEMES.map((t) => {
            const isSelected = t.id === currentTheme.id;

            return (
              <button
                key={t.id}
                id={`menu-option-${t.id.toLowerCase()}`}
                onClick={() => onSelectOption(t.id)}
                className="w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-150 flex items-center justify-between cursor-pointer"
                style={{
                  color: isSelected ? currentTheme.menuTextSelected : currentTheme.menuText,
                  background: isSelected ? currentTheme.menuActiveBg : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = currentTheme.menuHoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{t.name}</span>
                {isSelected && (
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ background: currentTheme.menuTextSelected }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
