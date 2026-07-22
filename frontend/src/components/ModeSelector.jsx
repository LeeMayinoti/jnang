import React from 'react';

export default function ModeSelector({ activeMode, onSelectMode }) {
  return (
    <div className="mode-selector-wrapper">
      <div className="mode-selector-title">
        <h2>Choose Workflow Mode</h2>
        <p>Generate authentic Ju|'hoansi folktales from narrative themes or analyze your custom story text</p>
      </div>

      <div className="mode-grid">
        <div 
          className={`mode-card ${activeMode === 'generate' ? 'active' : ''}`}
          onClick={() => onSelectMode('generate')}
        >
          <div className="mode-header">
            <div className="mode-icon">
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <div className="mode-title">Generate Story</div>
              <span className="badge-tag badge-amber">
                <i className="fa-solid fa-robot" style={{ marginRight: '5px' }}></i> 3-Agent Generator
              </span>
            </div>
          </div>
          <p className="mode-description">
            Select a Ju|'hoansi narrative theme (e.g. sharing honey, cosmic origins, trickster myths) and let Agent 1 craft an authentic story grounded in Kalahari ecology, Dundes motifemes, and native vocabulary.
          </p>
        </div>

        <div 
          className={`mode-card ${activeMode === 'enter' ? 'active' : ''}`}
          onClick={() => onSelectMode('enter')}
        >
          <div className="mode-header">
            <div className="mode-icon">
              <i className="fa-solid fa-pen-to-square" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <div className="mode-title">Enter / Input Story</div>
              <span className="badge-tag badge-cyan">
                <i className="fa-solid fa-brain" style={{ marginRight: '5px' }}></i> Structural Classifier
              </span>
            </div>
          </div>
          <p className="mode-description">
            Paste or write your own story text. Skip Agent 1 story generation and send your text directly to Agent 2 (Classifier) and Agent 3 (Grader) for motifeme extraction and cultural authenticity evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
