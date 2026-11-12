import React from 'react';
import { PanelLeft, Sparkles, Search, Sun, Moon } from 'lucide-react';

/**
 * Header — slim top bar above the conversation.
 * Holds the sidebar toggle, current thread title, mode switch and theme toggle.
 */
export default function Header({
  title,
  showSidebarToggle,
  onToggleSidebar,
  activeMode,
  onModeChange,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        {showSidebarToggle && (
          <button className="icon-btn" onClick={onToggleSidebar} title="Open sidebar" aria-label="Open sidebar">
            <PanelLeft size={18} />
          </button>
        )}
        <span className="topbar__title">{title}</span>
      </div>

      <div className="topbar__right">
        <div className="mode-toggle" role="tablist" aria-label="Mode">
          <button
            role="tab"
            aria-selected={activeMode === 'generate'}
            className={`mode-toggle__btn ${activeMode === 'generate' ? 'active' : ''}`}
            onClick={() => onModeChange('generate')}
          >
            <Sparkles size={14} />
            <span>Generate</span>
          </button>
          <button
            role="tab"
            aria-selected={activeMode === 'enter'}
            className={`mode-toggle__btn ${activeMode === 'enter' ? 'active' : ''}`}
            onClick={() => onModeChange('enter')}
          >
            <Search size={14} />
            <span>Analyze</span>
          </button>
        </div>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>
    </header>
  );
}
