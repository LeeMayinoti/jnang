import React from 'react';
import { Wand2, Tag, Award, CheckCircle2, Loader2 } from 'lucide-react';

export default function PipelineTracker({ activeMode, currentStep, isRunning }) {
  // Steps: 1: Generator, 2: Classifier, 3: Grader, 4: Complete
  return (
    <div className="glass-panel pipeline-tracker">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
          3-Agent Narrative Pipeline Execution
        </h3>
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.85rem' }}>
            <Loader2 className="animate-spin" size={16} />
            <span>Agents Processing...</span>
          </div>
        )}
      </div>

      <div className="tracker-steps">
        {/* Step 1: Generator */}
        <div className={`step-card ${activeMode === 'enter' ? 'completed' : (currentStep === 1 ? 'active' : (currentStep > 1 ? 'completed' : ''))}`}>
          <div className="step-num">
            {currentStep > 1 || activeMode === 'enter' ? <CheckCircle2 size={20} /> : <Wand2 size={18} />}
          </div>
          <div className="step-info">
            <h4>Agent 1 — Story Generator</h4>
            <p>{activeMode === 'enter' ? 'Skipped (Direct Entry)' : 'Crafts authentic folktale from theme & graph RAG'}</p>
          </div>
        </div>

        {/* Step 2: Classifier */}
        <div className={`step-card ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'completed' : '')}`}>
          <div className="step-num">
            {currentStep > 2 ? <CheckCircle2 size={20} /> : <Tag size={18} />}
          </div>
          <div className="step-info">
            <h4>Agent 2 — Structural Classifier</h4>
            <p>Extracts Alan Dundes motifemes & Proppian moves</p>
          </div>
        </div>

        {/* Step 3: Grader */}
        <div className={`step-card ${currentStep === 3 ? 'active' : (currentStep > 3 ? 'completed' : '')}`}>
          <div className="step-num">
            {currentStep > 3 ? <CheckCircle2 size={20} /> : <Award size={18} />}
          </div>
          <div className="step-info">
            <h4>Agent 3 — Cultural Grader</h4>
            <p>Evaluates authenticity, structure & narrative flow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
