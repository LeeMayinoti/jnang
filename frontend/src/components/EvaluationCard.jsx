import React from 'react';

const GRADE_TONE = {
  'Excellent':  'good',
  'Good':       'good',
  'Adequate':   'warn',
  'Needs Work': 'bad',
  'Fails':      'bad',
};

const fmt = (n) => Number(n).toFixed(1);

function ScoreRow({ label, value, children }) {
  return (
    <div className="score-row">
      <div className="score-row__head">
        <span className="score-row__label">{label}</span>
        <span className="score-row__value">{fmt(value)}</span>
      </div>
      <div className="score-row__track">
        <div className="score-row__fill" style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }} />
      </div>
      {children}
    </div>
  );
}

/**
 * EvaluationCard — renders the Classifier + Grader output.
 * Reads the grader's grade_report fields; falls back to the legacy
 * cultural_authenticity / structural_integrity keys in older saved chats.
 */
export default function EvaluationCard({ analysis }) {
  const grade     = analysis.grade || {};
  const motifemes = analysis.motifemes || [];
  const moves     = analysis.moves || [];

  const cultural = grade.cultural_authenticity_score ?? grade.cultural_authenticity;
  const motifeme = grade.motifeme_score ?? grade.structural_integrity;
  const subScores = [
    ['Egalitarianism', grade.egalitarianism_score],
    ['Food sharing',   grade.food_sharing_score],
    ['Kinship',        grade.kinship_score],
  ].filter(([, v]) => v != null);

  return (
    <section className="eval-card">
      <header className="eval-card__header">
        <h3 className="eval-card__title">Evaluation</h3>
        {grade.overall_grade && (
          <span className={`grade-badge grade-badge--${GRADE_TONE[grade.overall_grade] || 'warn'}`}>
            {grade.overall_grade}
          </span>
        )}
      </header>

      {(cultural != null || motifeme != null) && (
        <div className="eval-card__scores">
          {cultural != null && (
            <ScoreRow label="Cultural authenticity" value={cultural}>
              {subScores.length > 0 && (
                <div className="score-row__subs">
                  {subScores.map(([l, v]) => (
                    <span key={l}>{l} <b>{fmt(v)}</b></span>
                  ))}
                </div>
              )}
            </ScoreRow>
          )}
          {motifeme != null && <ScoreRow label="Motifeme coverage" value={motifeme} />}
        </div>
      )}

      {motifemes.length > 0 && (
        <div className="eval-card__section">
          <h4 className="eval-card__label">Dundes motifemes</h4>
          <div className="motif-chain">
            {motifemes.map((m, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="motif-chain__arrow" aria-hidden="true">→</span>}
                <span className="motif-chip">{m}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {moves.length > 0 && (
        <div className="eval-card__section">
          <h4 className="eval-card__label">Narrative moves</h4>
          <ol className="move-list">
            {moves.map((move, idx) => <li key={idx}>{move}</li>)}
          </ol>
        </div>
      )}

      {grade.comments && (
        <div className="eval-card__section">
          <h4 className="eval-card__label">Grader notes</h4>
          <p className="eval-card__notes">{grade.comments}</p>
        </div>
      )}

      {grade.suggestions?.length > 0 && (
        <div className="eval-card__section">
          <h4 className="eval-card__label">Suggestions</h4>
          <ul className="suggestion-list">
            {grade.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
