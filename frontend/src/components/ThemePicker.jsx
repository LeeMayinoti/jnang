import React, { useState } from 'react';
import { PRESET_THEMES } from '../data/themes';

export default function ThemePicker({ selectedTheme, onSelectTheme, customTheme, onCustomThemeChange, onGenerate, isGenerating }) {
  const [activeTab, setActiveTab] = useState('preset');

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
      <div className="section-title">
        <i className="fa-solid fa-compass" style={{ color: '#ff6b35', fontSize: '1.8rem' }}></i>
        <div>
          <span>Select Narrative Theme</span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Choose a canonical Ju|'hoansi narrative theme to seed Agent 1's generator
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className={`btn-secondary ${activeTab === 'preset' ? 'active' : ''}`}
          style={activeTab === 'preset' ? { borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' } : {}}
          onClick={() => setActiveTab('preset')}
        >
          <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i>
          Curated Presets ({PRESET_THEMES.length})
        </button>
        <button 
          className={`btn-secondary ${activeTab === 'custom' ? 'active' : ''}`}
          style={activeTab === 'custom' ? { borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' } : {}}
          onClick={() => setActiveTab('custom')}
        >
          <i className="fa-solid fa-lightbulb" style={{ marginRight: '6px' }}></i>
          Custom Prompt Seed
        </button>
      </div>

      {activeTab === 'preset' && (
        <div className="theme-grid">
          {PRESET_THEMES.map((theme) => {
            const isSelected = selectedTheme?.id === theme.id;
            return (
              <div 
                key={theme.id}
                className={`theme-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectTheme(theme)}
              >
                <div>
                  <div className="theme-card-header">
                    <span className="theme-card-icon">{theme.icon}</span>
                    {isSelected && (
                      <span className="badge-tag badge-amber" style={{ margin: 0 }}>
                        <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="theme-card-title">{theme.title}</h3>
                  <p className="theme-card-desc">{theme.description}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-tags" style={{ marginRight: '4px' }}></i> Canonical Motifemes:
                  </p>
                  <div className="theme-motifs">
                    {theme.motifs.map((motif, i) => (
                      <span key={i} className="motif-chip">{motif}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="custom-prompt-container">
          <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <i className="fa-solid fa-pen-nib" style={{ marginRight: '6px', color: 'var(--accent-amber)' }}></i>
            Describe your custom theme or narrative seed:
          </label>
          <textarea 
            className="text-input-field"
            rows={4}
            placeholder="e.g. A young girl who learns the dance of the rain-animal (g!o'e) during the summer thunder..."
            value={customTheme}
            onChange={(e) => onCustomThemeChange(e.target.value)}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button 
          className="btn-primary" 
          onClick={onGenerate}
          disabled={isGenerating || (activeTab === 'custom' && !customTheme.trim())}
        >
          <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-bolt'}`} style={{ marginRight: '8px' }}></i>
          {isGenerating ? 'Generating Story...' : 'Generate & Run 3-Agent Pipeline'}
        </button>
      </div>
    </div>
  );
}
