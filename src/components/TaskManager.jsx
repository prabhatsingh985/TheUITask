import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Target, 
  Sparkles, 
  CheckCircle, 
  Circle,
  Tag
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function TaskManager({ 
  currentTheme, 
  tasks, 
  activeTaskId, 
  onSetActiveTask, 
  onToggleTask, 
  onAddTask, 
  onDeleteTask 
}) {
  const [newTitle, setNewTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('Deep Work');

  const availableTags = ['Deep Work', 'Design', 'Systems', 'Atmospheric'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), selectedTag);
    setNewTitle('');
    soundEngine.playRadialHoverBlip(620);
  };

  return (
    <div 
      className="w-full max-w-xl mx-auto rounded-3xl p-5 sm:p-6 backdrop-blur-xl transition-all duration-500 my-4"
      style={{
        background: currentTheme.cardBg,
        border: `1px solid ${currentTheme.cardBorder}`,
        boxShadow: currentTheme.cardShadow
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b"
           style={{ borderColor: currentTheme.cardBorder }}>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: currentTheme.accent }} />
          <h2 className="text-sm font-bold uppercase tracking-wider"
              style={{ color: currentTheme.textPrimary }}>
            Orbital Task Flow
          </h2>
        </div>
        <span className="text-xs font-mono opacity-65"
              style={{ color: currentTheme.textMuted }}>
          {tasks.filter(t => t.completed).length} / {tasks.length} Completed
        </span>
      </div>

      {/* Add New Task Form */}
      <form onSubmit={handleSubmit} className="mb-5 space-y-2">
        <div className="relative flex items-center">
          <input
            type="text"
            id="new-task-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new atmospheric task..."
            className="w-full py-2.5 pl-4 pr-12 rounded-xl text-sm font-medium transition-all duration-200 outline-none backdrop-blur-md"
            style={{
              background: currentTheme.type === 'light' 
                ? 'rgba(255, 255, 255, 0.7)' 
                : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${currentTheme.cardBorder}`,
              color: currentTheme.textPrimary
            }}
          />
          <button
            type="submit"
            id="add-task-button"
            className="absolute right-1.5 p-1.5 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: currentTheme.accent,
              color: '#ffffff'
            }}
            aria-label="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
          {availableTags.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-medium border"
              style={{
                borderColor: selectedTag === tag ? currentTheme.accent : currentTheme.cardBorder,
                background: selectedTag === tag ? `${currentTheme.accent}25` : 'transparent',
                color: selectedTag === tag ? currentTheme.accent : currentTheme.textMuted
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          return (
            <div
              key={task.id}
              className="group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 backdrop-blur-sm"
              style={{
                background: isActive 
                  ? `${currentTheme.accent}14` 
                  : currentTheme.type === 'light' 
                  ? 'rgba(255, 255, 255, 0.45)' 
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive 
                  ? `1px solid ${currentTheme.accent}55` 
                  : `1px solid ${currentTheme.cardBorder}`,
                boxShadow: isActive ? `0 0 15px ${currentTheme.accentGlow}22` : 'none'
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Complete checkbox */}
                <button
                  onClick={() => {
                    onToggleTask(task.id);
                    soundEngine.playRadialHoverBlip(task.completed ? 400 : 700);
                  }}
                  className="w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
                  style={{
                    background: task.completed ? currentTheme.accent : 'transparent',
                    border: `1.5px solid ${task.completed ? currentTheme.accent : currentTheme.textMuted}`
                  }}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>

                {/* Title & Tag */}
                <div className="flex-1 min-w-0">
                  <div 
                    className={`text-sm font-medium truncate ${task.completed ? 'line-through opacity-50' : ''}`}
                    style={{ color: currentTheme.textPrimary }}
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] mt-0.5">
                    <span 
                      className="px-1.5 py-0.5 rounded-md font-mono"
                      style={{
                        background: `${currentTheme.accent}18`,
                        color: currentTheme.accent
                      }}
                    >
                      #{task.tag}
                    </span>
                    {isActive && (
                      <span className="font-semibold flex items-center gap-1"
                            style={{ color: currentTheme.accentGlow }}>
                        <Sparkles className="w-2.5 h-2.5" /> Orbit Focus
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                {!isActive && !task.completed && (
                  <button
                    onClick={() => {
                      onSetActiveTask(task.id);
                      soundEngine.playThemeSwitchChime(currentTheme.audioFreq);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg transition-all duration-200 font-medium cursor-pointer"
                    style={{
                      background: `${currentTheme.accent}1c`,
                      color: currentTheme.accent
                    }}
                  >
                    Focus
                  </button>
                )}

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 rounded-lg transition-colors duration-200 cursor-pointer opacity-40 hover:opacity-100 hover:text-rose-500"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
