import React from 'react';
import { Sparkles, Activity, BookOpen, Layers } from 'lucide-react';

export default function Header({ isOnline }) {
  return (
    <header className="header-glass">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="brand-title">jnang</h1>
            <p className="brand-subtitle">Ju|'hoansi Narrative Agentic Generator & Classifier</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>{isOnline ? '3-Agent Pipeline Online' : 'Connecting to Pipeline...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
