import React from 'react';

const AGENTS = [
  { name: 'Generator',  doing: 'Drafting the narrative' },
  { name: 'Classifier', doing: 'Mapping motifemes and moves' },
  { name: 'Grader',     doing: 'Scoring cultural authenticity' },
];

/**
 * PipelineBeads — the 3-agent pipeline drawn as a strand of ostrich-eggshell beads.
 * Props:
 *   run  — 'generate' | 'analyze' (analyze skips the Generator)
 *   step — 1..3 = that agent is running, 4 = all finished
 */
export default function PipelineBeads({ run, step }) {
  const stateOf = (i) => {
    if (run === 'analyze' && i === 1) return 'skipped';
    if (step > i) return 'done';
    if (step === i) return 'active';
    return 'pending';
  };

  const active = step >= 1 && step <= 3 ? AGENTS[step - 1] : null;

  return (
    <div className="beads" aria-live="polite">
      <div className="beads__strand">
        {AGENTS.map((a, idx) => {
          const i = idx + 1;
          const state = stateOf(i);
          return (
            <React.Fragment key={a.name}>
              {idx > 0 && <span className={`beads__string ${stateOf(i - 1) === 'done' && state !== 'pending' ? 'filled' : ''}`} />}
              <span
                className={`beads__item beads__item--${state}`}
                title={state === 'skipped' ? 'Skipped: you supplied the story' : undefined}
              >
                <span className="bead" />
                <span className="beads__label">{a.name}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
      {active && <div className="beads__status">{active.doing}…</div>}
    </div>
  );
}
