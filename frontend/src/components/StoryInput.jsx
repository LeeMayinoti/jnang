import React from 'react';
import { SAMPLE_STORIES } from '../data/themes';
import { FileText, Cpu, BookMarked } from 'lucide-react';

export default function StoryInput({ storyText, onStoryTextChange, onAnalyze, isAnalyzing }) {
  const wordCount = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
  const charCount = storyText.length;

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
      <div className="section-title">
        <FileText color="#00e5ff" size={28} />
        <div>
          <span>Enter or Paste Story Text</span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Input your story directly to run Agent 2 (Classifier) and Agent 3 (Grader)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <BookMarked size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quick Presets:</span>
          {SAMPLE_STORIES.map((sample) => (
            <button
              key={sample.id}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
              onClick={() => onStoryTextChange(sample.text)}
            >
              Load "{sample.title}"
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {wordCount} words | {charCount} chars
        </div>
      </div>

      <textarea
        className="text-input-field"
        rows={10}
        placeholder="Paste or write a story here. For best structural classification, include Dundes motifemes (Lack, Interdiction, Consequence, Mediation) and Ju|'hoansi ecological settings..."
        value={storyText}
        onChange={(e) => onStoryTextChange(e.target.value)}
        style={{ fontSize: '1rem', lineHeight: '1.7' }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #00e5ff, #0088ff)' }}
          onClick={onAnalyze}
          disabled={isAnalyzing || !storyText.trim()}
        >
          <Cpu size={20} />
          {isAnalyzing ? 'Analyzing Story...' : 'Analyze with Classifier & Grader Agents'}
        </button>
      </div>
    </div>
  );
}
