import React, { useState, useEffect } from 'react';
import { VIDEO_THEMES } from './themes';
import VideoDandelionVisualizer from './components/VideoDandelionVisualizer';
import VideoSettingsDropdown from './components/VideoSettingsDropdown';

export default function App() {
  // Starts on Daytime (as in Frame 1 of the video)
  const [themeId, setThemeId] = useState('daytime');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 44-Second Video Sequence Auto-Demo State
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [sequenceTime, setSequenceTime] = useState(0);

  const currentTheme = VIDEO_THEMES.find(t => t.id === themeId) || VIDEO_THEMES[0];

  const handleSelectTheme = (newId) => {
    setThemeId(newId);
  };

  // Video Timeline Replay (00:00 - 00:44 as observed from the video frames)
  useEffect(() => {
    let timer = null;
    if (isPlayingSequence) {
      timer = setInterval(() => {
        setSequenceTime(t => {
          const next = t + 0.2;
          if (next >= 44.0) {
            setIsPlayingSequence(false);
            return 44.0;
          }
          return next;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlayingSequence]);

  useEffect(() => {
    if (!isPlayingSequence) return;

    // Timeline matches the video frames:
    // 00:00 - 00:04: Daytime established (Frame 1)
    if (sequenceTime < 3.5) {
      if (themeId !== 'daytime') setThemeId('daytime');
      if (isMenuOpen) setIsMenuOpen(false);
    }
    // 00:04 - 00:07: Open menu and click Pre-dawn (Frame 5)
    else if (sequenceTime >= 4.0 && sequenceTime < 7.5) {
      if (!isMenuOpen) setIsMenuOpen(true);
      if (sequenceTime >= 5.0 && themeId !== 'pre-dawn') setThemeId('pre-dawn');
    }
    // 00:07 - 00:10: Click Sunrise
    else if (sequenceTime >= 7.5 && sequenceTime < 11.0) {
      if (themeId !== 'sunrise') setThemeId('sunrise');
    }
    // 00:11 - 00:14: Click Daytime
    else if (sequenceTime >= 11.0 && sequenceTime < 14.0) {
      if (themeId !== 'daytime') setThemeId('daytime');
    }
    // 00:14 - 00:16: Click Dusk
    else if (sequenceTime >= 14.0 && sequenceTime < 16.5) {
      if (themeId !== 'dusk') setThemeId('dusk');
    }
    // 00:16 - 00:20: Click Sunset (Frame 16)
    else if (sequenceTime >= 16.5 && sequenceTime < 20.0) {
      if (themeId !== 'sunset') setThemeId('sunset');
    }
    // 00:20 - 00:32: Click Night (Frame 20) and cursor hovers across visualizer (Frame 25)
    else if (sequenceTime >= 20.0 && sequenceTime < 32.0) {
      if (themeId !== 'night') setThemeId('night');
    }
    // 00:32 - 00:37: Pre-dawn (Frame 35)
    else if (sequenceTime >= 32.0 && sequenceTime < 37.0) {
      if (themeId !== 'pre-dawn') setThemeId('pre-dawn');
    }
    // 00:37 - 00:44: Sunrise warm orange (Frame 43)
    else if (sequenceTime >= 37.0) {
      if (themeId !== 'sunrise') setThemeId('sunrise');
      if (isMenuOpen) setIsMenuOpen(false);
    }
  }, [sequenceTime, isPlayingSequence]);

  const toggleSequencePlay = () => {
    if (isPlayingSequence) {
      setIsPlayingSequence(false);
    } else {
      setThemeId('daytime');
      setSequenceTime(0);
      setIsPlayingSequence(true);
    }
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between font-sans select-none transition-all duration-700 ease-out"
      style={{
        background: currentTheme.bgGradient,
        color: currentTheme.titleColor
      }}
    >
      {/* Centered Structured Frame (Matching video dimensions) */}
      <div 
        className="relative mx-auto w-full max-w-5xl h-full flex flex-col justify-between border-l border-r transition-colors duration-700"
        style={{ borderColor: currentTheme.frameBorder }}
      >
        {/* Top Header Section */}
        <header className="relative w-full py-7 sm:py-9 flex items-center justify-center flex-shrink-0">
          <h1 
            id="app-title"
            className="text-2xl sm:text-3xl font-medium tracking-tight select-none transition-colors duration-500"
            style={{ color: currentTheme.titleColor }}
          >
            The Task
          </h1>
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

        {/* Lower Main Stage: Canvas + Top-Right Theme Button */}
        <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden">
          {/* Top-Right Theme Menu Button (Matches exact location in video) */}
          <div className="absolute top-3 sm:top-4 right-4 sm:right-6 z-30">
            <VideoSettingsDropdown
              currentTheme={currentTheme}
              isOpen={isMenuOpen}
              onToggleOpen={setIsMenuOpen}
              onSelectTheme={handleSelectTheme}
            />
          </div>

          {/* Centered Rising Semi-Circular Dandelion Sunburst Visualizer */}
          <VideoDandelionVisualizer currentTheme={currentTheme} />
        </div>

        {/* Subtle Replay Trigger at bottom */}
        <div className="relative w-full py-2 flex items-center justify-center opacity-25 hover:opacity-100 transition-opacity">
          <button
            onClick={toggleSequencePlay}
            className="text-[10px] font-mono tracking-widest uppercase cursor-pointer"
            style={{ color: currentTheme.titleColor }}
          >
            {isPlayingSequence ? `[ Playing Video Flow: ${sequenceTime.toFixed(1)}s / 44s ]` : `[ Replay Video Flow ]`}
          </button>
        </div>
      </div>
    </div>
  );
}
