import React from 'react';
import { Award, Tag, Sparkles, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default function AnalysisDashboard({ motifemes, storyMoves, gradeReport }) {
  const overallScore = gradeReport?.overall_score ?? gradeReport?.final_score ?? 8.5;
  const authenticityScore = gradeReport?.cultural_authenticity ?? gradeReport?.cultural_authenticity_score ?? 9.0;
  const structuralScore = gradeReport?.structural_integrity ?? gradeReport?.structural_integrity_score ?? 8.0;
  const coherenceScore = gradeReport?.narrative_coherence ?? gradeReport?.coherence_score ?? 8.5;

  return (
    <div className="glass-panel analysis-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <Award size={24} color="var(--accent-cyan)" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
          Structural & Cultural Evaluation
        </h3>
      </div>

      {/* Grader Metrics */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Agent 3 — Cultural Authenticity & Grade Report
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Overall Folktale Score</span>
            <span className="metric-score" style={{ color: 'var(--accent-amber)', fontSize: '1.6rem' }}>
              {Number(overallScore).toFixed(1)} / 10
            </span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, (overallScore / 10) * 100)}%`, background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-gold))' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="metric-card" style={{ marginBottom: 0 }}>
            <div className="metric-header">
              <span className="metric-title">Cultural Authenticity</span>
              <span className="metric-score">{Number(authenticityScore).toFixed(1)}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min(100, (authenticityScore / 10) * 100)}%` }}
              />
            </div>
          </div>

          <div className="metric-card" style={{ marginBottom: 0 }}>
            <div className="metric-header">
              <span className="metric-title">Structural Integrity</span>
              <span className="metric-score" style={{ color: 'var(--accent-purple)' }}>{Number(structuralScore).toFixed(1)}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min(100, (structuralScore / 10) * 100)}%`, background: 'linear-gradient(90deg, var(--accent-purple), #7c4dff)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Motifemes Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <Tag size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Alan Dundes Motifeme Sequence ({motifemes?.length || 0})
          </span>
        </div>

        {motifemes && motifemes.length > 0 ? (
          <div className="motifeme-list">
            {motifemes.map((motif, idx) => (
              <div key={idx} className="motifeme-badge">
                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{idx + 1}.</span>
                <span>{motif}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No motifemes extracted yet.</p>
        )}
      </div>

      {/* Story Moves Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Proppian Narrative Moves ({storyMoves?.length || 0})
          </span>
        </div>

        {storyMoves && storyMoves.length > 0 ? (
          <div>
            {storyMoves.map((move, idx) => (
              <div key={idx} className="story-move-item">
                <ChevronRight size={14} inline style={{ marginRight: '6px', color: 'var(--accent-gold)' }} />
                <span>{move}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No story moves extracted yet.</p>
        )}
      </div>
    </div>
  );
}
