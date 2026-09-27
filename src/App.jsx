import React, { useState } from 'react';
import { VIDEO_THEMES } from './themes';
import VideoDandelionVisualizer from './components/VideoDandelionVisualizer';
import VideoSettingsDropdown from './components/VideoSettingsDropdown';

export default function App() {
  const [themeId, setThemeId] = useState('night');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentTheme = VIDEO_THEMES.find(t => t.id === themeId) || VIDEO_THEMES[0];

  const handleSelectTheme = (newId) => {
    setThemeId(newId);
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans select-none transition-all duration-700 ease-out"
      style={{
        background: currentTheme.bgGradient,
        color: currentTheme.titleColor
      }}
    >
      {/* Centered Structured Frame */}
      <div 
        className="relative mx-auto w-full max-w-5xl h-full flex flex-col justify-between border-l border-r transition-colors duration-700"
        style={{ borderColor: currentTheme.frameBorder }}
      >
        {/* Top Header Section with Centered Title & Far-Right Theme Button */}
        <header className="relative w-full py-6 sm:py-8 flex items-center justify-between px-6 sm:px-10 flex-shrink-0">
          {/* Left balance spacer so title remains exactly dead-center */}
          <div className="w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0" />

          {/* Centered App Title */}
          <h1 
            id="app-title"
            className="text-2xl sm:text-3xl font-medium tracking-tight select-none transition-colors duration-500 text-center flex-1 mx-4"
            style={{ color: currentTheme.titleColor }}
          >
            The Task
          </h1>

          {/* Theme Dropdown Button placed at the far right */}
          <div className="w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0 flex items-center justify-end z-30">
            <VideoSettingsDropdown
              currentTheme={currentTheme}
              isOpen={isMenuOpen}
              onToggleOpen={setIsMenuOpen}
              onSelectTheme={handleSelectTheme}
            />
          </div>
        </header>

        {/* Minimalist Horizontal Line with Left-accent gradient line */}
        <div 
          className="relative w-full h-[1px] flex-shrink-0 transition-colors duration-700"
          style={{ background: currentTheme.frameBorder }}
        >
          <div 
            className="absolute left-0 top-0 h-[1.5px] w-48 sm:w-64 transition-all duration-700 opacity-80"
            style={{
              background: currentTheme.lineAccent
            }}
          />
        </div>

        {/* Main Stage: Dandelion Sunburst Visualizer */}
        <div className="relative w-full flex-1 flex flex-col justify-end overflow-hidden">
          <VideoDandelionVisualizer currentTheme={currentTheme} />
        </div>
      </div>
    </div>
  );
}
