import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  FastForward, 
  Sparkles,
  Layers
} from 'lucide-react';
import { THEME_LIST } from '../themes';
import { soundEngine } from '../utils/audio';

// Video Prompt Timestamps sequence:
// 1. Daytime
// 2. Pre-dawn
// 3. Sunrise
// 4. Daytime
// 5. Dusk
// 6. Sunset
// 7. Night (dark blue interface + glowing radial visualizer)
// 8. Pre-dawn
// 9. Sunrise (warm orange)
const SCENE_SEQUENCE = [
  { id: 'daytime', label: 'Daytime', time: '00:00 - 00:04' },
  { id: 'pre-dawn', label: 'Pre-dawn', time: '00:04 - 00:06' },
  { id: 'sunrise', label: 'Sunrise', time: '00:06 - 00:08' },
  { id: 'daytime', label: 'Daytime', time: '00:08 - 00:10' },
  { id: 'dusk', label: 'Dusk', time: '00:10 - 00:13' },
  { id: 'sunset', label: 'Sunset', time: '00:13 - 00:16' },
  { id: 'night', label: 'Night (Dark Blue)', time: '00:16 - 00:32' },
  { id: 'pre-dawn', label: 'Pre-dawn', time: '00:32 - 00:37' },
  { id: 'sunrise', label: 'Sunrise (Warm Orange)', time: '00:37 - 00:43' }
];

export default function ThemeTimelineBar({ currentTheme, onSelectTheme }) {
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);

  useEffect(() => {
    let timer;
    if (isPlayingSequence) {
      timer = setTimeout(() => {
        const nextIndex = (sequenceIndex + 1) % SCENE_SEQUENCE.length;
        setSequenceIndex(nextIndex);
        const targetTheme = SCENE_SEQUENCE[nextIndex].id;
        onSelectTheme(targetTheme);
        soundEngine.playThemeSwitchChime(480);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isPlayingSequence, sequenceIndex, onSelectTheme]);

  const toggleSequence = () => {
    setIsPlayingSequence(!isPlayingSequence);
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto rounded-2xl p-3 backdrop-blur-xl border transition-all duration-500 shadow-xl my-3 select-none"
      style={{
        background: currentTheme.cardBg,
        borderColor: currentTheme.cardBorder
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Quick Swatches Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold mr-1"
                style={{ color: currentTheme.textMuted }}>
            Atmosphere:
          </span>
          {THEME_LIST.map((theme) => {
            const isSelected = theme.id === currentTheme.id;
            return (
              <button
                key={theme.id}
                id={`quick-theme-${theme.id}`}
                onClick={() => {
                  onSelectTheme(theme.id);
                  soundEngine.playThemeSwitchChime(theme.audioFreq);
                }}
                className="group relative px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: isSelected ? theme.accent : 'transparent',
                  color: isSelected ? '#ffffff' : currentTheme.textSecondary,
                  border: isSelected ? `1px solid ${theme.accent}` : `1px solid ${currentTheme.cardBorder}`,
                  boxShadow: isSelected ? `0 0 14px ${theme.accentGlow}66` : 'none'
                }}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ background: theme.swatch }}
                />
                <span>{theme.name}</span>
              </button>
            );
          })}
        </div>

        {/* Video Prompt Simulation Button */}
        <button
          onClick={toggleSequence}
          id="simulate-video-button"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border"
          style={{
            borderColor: isPlayingSequence ? currentTheme.accent : currentTheme.cardBorder,
            background: isPlayingSequence ? `${currentTheme.accent}25` : 'transparent',
            color: isPlayingSequence ? currentTheme.accent : currentTheme.textSecondary
          }}
          title="Play auto-sequence matching video prompt timestamps"
        >
          {isPlayingSequence ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Playing Video Flow ({SCENE_SEQUENCE[sequenceIndex].label})</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Video Demo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
