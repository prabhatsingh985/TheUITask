import React, { useRef, useEffect } from 'react';
import { VIDEO_THEMES } from '../themes';
import { ThemeIcon } from './ThemeIcons';

export default function VideoSettingsDropdown({
  currentTheme,
  isOpen,
  onToggleOpen,
  onSelectTheme
}) {
  const containerRef = useRef(null);

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
      {/* Theme Icon Button (Displays active theme icon as in video) */}
      <button
        id="theme-icon-button"
        onClick={() => onToggleOpen(!isOpen)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md border shadow-sm select-none"
        style={{
          background: currentTheme.btnBg,
          borderColor: currentTheme.btnBorder,
          color: currentTheme.btnColor
        }}
        aria-label="Theme menu"
      >
        <ThemeIcon 
          type={currentTheme.iconType} 
          size={16} 
          color={currentTheme.btnColor}
        />
      </button>

      {/* Dropdown Menu (Exact 6 options from video) */}
      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 mt-2 w-40 rounded-xl py-1 z-50 transition-all duration-200 backdrop-blur-2xl border shadow-xl select-none font-sans"
          style={{
            background: currentTheme.menuBg,
            borderColor: currentTheme.menuBorder,
            boxShadow: `0 12px 30px -6px rgba(0,0,0,0.25)`
          }}
        >
          {VIDEO_THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme.id;

            return (
              <button
                key={theme.id}
                id={`theme-opt-${theme.id}`}
                onClick={() => onSelectTheme(theme.id)}
                className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors duration-150 flex items-center gap-2.5 cursor-pointer rounded-lg mx-auto"
                style={{
                  width: 'calc(100% - 8px)',
                  margin: '1px 4px',
                  color: isSelected ? theme.btnColor : currentTheme.menuText,
                  background: isSelected ? currentTheme.menuActiveBg : 'transparent'
                }}
              >
                <ThemeIcon 
                  type={theme.iconType} 
                  size={14} 
                  color={isSelected ? theme.btnColor : currentTheme.menuText} 
                />
                <span>{theme.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
