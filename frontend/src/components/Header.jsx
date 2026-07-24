import React from 'react';

export default function Header({ isOnline, theme, onToggleTheme }) {
  return (
    <header className="header-glass">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '1.4rem' }}></i>
          </div>
          <div>
            <h1 className="brand-title">jnang</h1>
            <p className="brand-subtitle">Ju|'hoansi Narrative Agentic Studio</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Toggle Light / Dark theme"
          >
            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} style={{ color: theme === 'light' ? '#6366f1' : '#f59e0b' }}></i>
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="status-pill">
            <span className="status-dot"></span>
            <span>
              <i className="fa-solid fa-network-wired" style={{ marginRight: '6px' }}></i>
              {isOnline ? '3-Agent Pipeline Online' : 'Connecting to Pipeline...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
