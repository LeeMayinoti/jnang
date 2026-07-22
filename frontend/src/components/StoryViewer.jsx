import React, { useState } from 'react';

export default function StoryViewer({ narrativeText, themeTitle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([narrativeText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `juhoansi_story_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Process text to wrap Ju|'hoan terms in parenthetical spans for highlighting
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Matches Ju|'hoan vocabulary like zo (honey) or n!ore (territory)
    const regex = /([\w!\|\/\'\-]+\s*\([\w\s\-\/\'\!]+\))/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span key={index} className="juhoansi-term">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="glass-panel story-panel">
      <div className="story-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600 }}>
            <i className="fa-solid fa-book-open"></i>
            <span>Narrative Output</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>
            {themeTitle || 'Ju|\'hoansi Narrative Draft'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={handleCopy} title="Copy to clipboard">
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} style={copied ? { color: 'var(--accent-emerald)' } : {}}></i>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="btn-secondary" onClick={handleDownload} title="Download text">
            <i className="fa-solid fa-download"></i>
            Export
          </button>
        </div>
      </div>

      <div className="story-body">
        {renderFormattedText(narrativeText)}
      </div>
    </div>
  );
}
