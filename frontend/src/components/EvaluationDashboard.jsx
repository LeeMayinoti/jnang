import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle2, AlertTriangle, Sparkles, GitCompare, FileText } from 'lucide-react';
import { EVAL_RESULTS_FALLBACK } from '../data/evalResultsFallback';

const THEME_LABELS = {
  sharing_honey: 'Sharing Honey',
  moon_life: "Moon's Immortality",
  trickster_waterhole: 'Trickster Waterhole',
  fire_origin: 'Origin of Fire',
  elephant_water: 'Elephant Holds Water',
  ostrich_tortoise: 'Ostrich & Tortoise',
  springhare_dances: 'Springhare Dances',
  ducks_and_people: 'Ducks & People',
};

const THEME_ORDER = [
  'sharing_honey',
  'moon_life',
  'trickster_waterhole',
  'fire_origin',
  'elephant_water',
  'ostrich_tortoise',
  'springhare_dances',
  'ducks_and_people',
];

function gradeTone(grade = '') {
  const g = grade.toLowerCase();
  if (g === 'excellent' || g === 'good') return 'good';
  if (g === 'adequate') return 'warn';
  return 'bad';
}

function ArmComparisonSvg({ summary, judgeView }) {
  const baseObj = summary.baseline?.[judgeView] || {};
  const jnObj = summary.full_jnang?.[judgeView] || {};
  const baseDet = summary.baseline?.deterministic || {};
  const jnDet = summary.full_jnang?.deterministic || {};

  const scoreBars = [
    { key: 'cultural_authenticity', label: 'Cultural Auth.', b: baseObj.cultural_authenticity || 0, j: jnObj.cultural_authenticity || 0 },
    { key: 'egalitarianism', label: 'Egalitarianism', b: baseObj.egalitarianism || 0, j: jnObj.egalitarianism || 0 },
    { key: 'food_sharing', label: 'Food Sharing', b: baseObj.food_sharing || 0, j: jnObj.food_sharing || 0 },
    { key: 'kinship', label: 'Kinship', b: baseObj.kinship || 0, j: jnObj.kinship || 0 },
    { key: 'motifeme', label: 'Motifeme Cov.', b: baseObj.motifeme || 0, j: jnObj.motifeme || 0 },
  ];

  const rateBars = [
    { key: 'hoard_judge', label: 'No Hoarding (Judge)', b: summary.baseline?.judge?.no_hoarding_pct || 0, j: summary.full_jnang?.judge?.no_hoarding_pct || 0 },
    { key: 'hoard_pipe', label: 'No Hoarding (Pipe)', b: summary.baseline?.in_pipe?.no_hoarding_pct || 0, j: summary.full_jnang?.in_pipe?.no_hoarding_pct || 0 },
    { key: 'trope', label: 'Trope-Free', b: baseDet.trope_free_pct || 0, j: jnDet.trope_free_pct || 0 },
    { key: 'gloss', label: 'Dict. Glosses', b: baseDet.verified_gloss_pct || 0, j: jnDet.verified_gloss_pct || 0 },
  ];

  const renderPanel = (items, maxVal, suffix, title, yLabel, xStart, width) => {
    const plotTop = 36;
    const plotBottom = 210;
    const plotH = plotBottom - plotTop;
    const groupW = width / items.length;
    const barW = Math.min(22, groupW * 0.28);
    const ticks = maxVal === 10 ? [0, 2, 4, 6, 8, 10] : [0, 25, 50, 75, 100];

    return (
      <g>
        <text x={xStart} y={18} className="eval-svg__panel-title">{title}</text>
        <text x={xStart - 28} y={(plotTop + plotBottom) / 2} transform={`rotate(-90 ${xStart - 28} ${(plotTop + plotBottom) / 2})`} textAnchor="middle" className="eval-svg__axis-label">{yLabel}</text>
        {ticks.map((t) => {
          const y = plotBottom - (t / maxVal) * plotH;
          return (
            <g key={t}>
              <line x1={xStart} y1={y} x2={xStart + width} y2={y} className="eval-svg__grid" />
              <text x={xStart - 6} y={y + 3} textAnchor="end" className="eval-svg__tick">{t}</text>
            </g>
          );
        })}
        <line x1={xStart} y1={plotBottom} x2={xStart + width} y2={plotBottom} className="eval-svg__axis" />
        {items.map((d, idx) => {
          const cx = xStart + groupW * idx + groupW / 2;
          const hB = (d.b / maxVal) * plotH;
          const hJ = (d.j / maxVal) * plotH;
          const yB = plotBottom - hB;
          const yJ = plotBottom - hJ;
          return (
            <g key={d.key}>
              <rect x={cx - barW - 2} y={yB} width={barW} height={hB} rx={3} className="eval-svg__bar-base" />
              <text x={cx - barW / 2 - 2} y={yB - 5} textAnchor="middle" className="eval-svg__val-base">
                {maxVal === 10 ? d.b.toFixed(2) : `${d.b.toFixed(0)}%`}
              </text>
              <rect x={cx + 2} y={yJ} width={barW} height={hJ} rx={3} className="eval-svg__bar-jnang" />
              <text x={cx + barW / 2 + 2} y={yJ - 5} textAnchor="middle" className="eval-svg__val-jnang">
                {maxVal === 10 ? d.j.toFixed(2) : `${d.j.toFixed(0)}%`}
              </text>
              <text x={cx} y={plotBottom + 16} textAnchor="middle" className="eval-svg__xtick">{d.label}</text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 860 265" className="eval-svg" role="img" aria-label="Arm comparison bar charts">
      {renderPanel(scoreBars, 10, '', `A. Mean Rubric Scores (${judgeView === 'judge' ? 'Blind Independent Judge' : 'In-Pipeline Grader'})`, 'Score (0-10)', 46, 410)}
      {renderPanel(rateBars, 100, '%', 'B. Guardrails & Dictionary Verification (%)', 'Rate (%)', 515, 330)}
      <g transform="translate(275, 252)">
        <rect x={0} y={-8} width={12} height={10} rx={2} className="eval-svg__bar-base" />
        <text x={18} y={0} className="eval-svg__legend">Naive Baseline (Arm A)</text>
        <rect x={168} y={-8} width={12} height={10} rx={2} className="eval-svg__bar-jnang" />
        <text x={186} y={0} className="eval-svg__legend">Full jnang Pipeline (Arm B)</text>
      </g>
    </svg>
  );
}

function PerThemeDeltaSvg({ pairs, selectedTheme, onSelectTheme, judgeKey }) {
  const xMin = 175;
  const xMax = 610;
  const xScale = (val) => xMin + (val / 10) * (xMax - xMin);
  const yRows = [58, 86, 114, 142, 170, 224, 252, 280];

  return (
    <svg viewBox="0 0 700 325" className="eval-svg" role="img" aria-label="Per-theme cultural authenticity shift dumbbell chart">
      <text x={xMin} y={22} className="eval-svg__section-label">Preset Themes (n = 5)</text>
      <text x={xMin} y={199} className="eval-svg__section-label">Held-Out Themes (n = 3)</text>
      <text x={642} y={22} className="eval-svg__tick">Delta</text>
      <line x1={12} y1={184} x2={685} y2={184} className="eval-svg__divider" />

      {[0, 2, 4, 6, 8, 10].map((t) => {
        const x = xScale(t);
        return (
          <g key={t}>
            <line x1={x} y1={34} x2={x} y2={296} className="eval-svg__grid" />
            <text x={x} y={313} textAnchor="middle" className="eval-svg__tick">{t}</text>
          </g>
        );
      })}

      {THEME_ORDER.map((tid, idx) => {
        const pair = pairs[tid];
        if (!pair) return null;
        const y = yRows[idx];
        const bVal = pair.baseline?.[judgeKey]?.cultural_authenticity_score ?? 0;
        const jVal = pair.full_jnang?.[judgeKey]?.cultural_authenticity_score ?? 0;
        const delta = jVal - bVal;
        const isWin = delta >= 0;
        const isSelected = selectedTheme === tid;
        const xb = xScale(bVal);
        const xj = xScale(jVal);

        return (
          <g
            key={tid}
            className={`eval-svg__row ${isSelected ? 'is-selected' : ''}`}
            onClick={() => onSelectTheme(tid)}
            style={{ cursor: 'pointer' }}
          >
            <rect x={4} y={y - 13} width={688} height={26} rx={6} className="eval-svg__row-bg" />
            <text x={xMin - 12} y={y + 4} textAnchor="end" className="eval-svg__ylabel">
              {THEME_LABELS[tid]}
            </text>
            <line x1={xb} y1={y} x2={xj} y2={y} className={isWin ? 'eval-svg__stem-win' : 'eval-svg__stem-loss'} />
            <circle cx={xb} cy={y} r={isSelected ? 6.5 : 5.5} className="eval-svg__dot-base" />
            <circle cx={xj} cy={y} r={isSelected ? 7.2 : 6} className={isWin ? 'eval-svg__dot-win' : 'eval-svg__dot-loss'} />
            {Math.abs(jVal - bVal) >= 0.8 && (
              <>
                <text
                  x={bVal < jVal ? xb + (bVal < 0.7 ? 10 : -9) : xb + 9}
                  y={bVal < 0.7 && jVal > bVal ? y - 9 : y + 3.5}
                  textAnchor={bVal < 0.7 ? 'start' : (bVal < jVal ? 'end' : 'start')}
                  className="eval-svg__val-base"
                >
                  {bVal.toFixed(2)}
                </text>
                <text
                  x={jVal >= bVal ? xj + 10 : xj - 10}
                  y={y + 3.5}
                  textAnchor={jVal >= bVal ? 'start' : 'end'}
                  className={isWin ? 'eval-svg__val-jnang' : 'eval-svg__val-loss'}
                >
                  {jVal.toFixed(2)}
                </text>
              </>
            )}
            <text x={642} y={y + 4} className={isWin ? 'eval-svg__val-jnang' : 'eval-svg__val-loss'}>
              {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GraderDiscrepancySvg({ rows, selectedTheme, onSelectTheme }) {
  const padL = 50;
  const padR = 24;
  const padT = 24;
  const padB = 42;
  const w = 360 - padL - padR;
  const h = 325 - padT - padB;
  const xPos = (v) => padL + (v / 10) * w;
  const yPos = (v) => padT + h - (v / 10) * h;

  return (
    <svg viewBox="0 0 360 325" className="eval-svg" role="img" aria-label="In-pipeline vs blind independent judge scatter plot">
      <polygon points={`${xPos(0)},${yPos(0)} ${xPos(0)},${yPos(10)} ${xPos(10)},${yPos(10)}`} className="eval-svg__zone-top" />
      <polygon points={`${xPos(0)},${yPos(0)} ${xPos(10)},${yPos(0)} ${xPos(10)},${yPos(10)}`} className="eval-svg__zone-bot" />

      {[0, 2, 4, 6, 8, 10].map((t) => (
        <g key={t}>
          <line x1={xPos(t)} y1={yPos(0)} x2={xPos(t)} y2={yPos(10)} className="eval-svg__grid" />
          <line x1={xPos(0)} y1={yPos(t)} x2={xPos(10)} y2={yPos(t)} className="eval-svg__grid" />
          <text x={xPos(t)} y={yPos(0) + 15} textAnchor="middle" className="eval-svg__tick">{t}</text>
          <text x={xPos(0) - 8} y={yPos(t) + 3} textAnchor="end" className="eval-svg__tick">{t}</text>
        </g>
      ))}

      <line x1={xPos(0)} y1={yPos(0)} x2={xPos(10)} y2={yPos(10)} className="eval-svg__diag" />
      <text x={xPos(0.4)} y={yPos(9.3)} className="eval-svg__hint-good">Blind judge higher</text>
      <text x={xPos(5.2)} y={yPos(0.6)} className="eval-svg__hint-warn">In-pipe lenient</text>

      {rows.map((r, i) => {
        const xv = r.inpipeline_grade?.cultural_authenticity_score ?? 0;
        const yv = r.independent_judge?.cultural_authenticity_score ?? 0;
        const cx = xPos(xv);
        const cy = yPos(yv);
        const isJ = r.arm === 'full_jnang';
        const isSel = selectedTheme === r.theme_id;
        return (
          <g
            key={`${r.theme_id}-${r.arm}-${i}`}
            onClick={() => onSelectTheme(r.theme_id)}
            style={{ cursor: 'pointer' }}
          >
            {isJ ? (
              <circle
                cx={cx}
                cy={cy}
                r={isSel ? 6.5 : 5}
                className={`eval-svg__dot-win ${isSel ? 'is-ringed' : ''}`}
              />
            ) : (
              <rect
                x={cx - (isSel ? 5.5 : 4.2)}
                y={cy - (isSel ? 5.5 : 4.2)}
                width={isSel ? 11 : 8.4}
                height={isSel ? 11 : 8.4}
                rx={1.5}
                className={`eval-svg__dot-base ${isSel ? 'is-ringed' : ''}`}
              />
            )}
            <title>{`${THEME_LABELS[r.theme_id] || r.theme_id} (${isJ ? 'jnang' : 'Baseline'}): In-Pipe ${xv.toFixed(2)}, Blind Judge ${yv.toFixed(2)}`}</title>
          </g>
        );
      })}

      <text x={padL + w / 2} y={316} textAnchor="middle" className="eval-svg__axis-label">In-Pipeline Grader (gpt-4o-mini)</text>
      <text x={14} y={padT + h / 2} transform={`rotate(-90 14 ${padT + h / 2})`} textAnchor="middle" className="eval-svg__axis-label">Blind Judge (gemini-2.5-flash)</text>
    </svg>
  );
}

export function EvaluationDashboard() {
  const [payload, setPayload] = useState(EVAL_RESULTS_FALLBACK);
  const [dataSource, setDataSource] = useState('embedded');
  const [judgeView, setJudgeView] = useState('judge');
  const [selectedTheme, setSelectedTheme] = useState('sharing_honey');
  const [showMemo, setShowMemo] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/eval/results')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.rows?.length) {
          setPayload(data);
          setDataSource('live');
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const rows = payload?.rows || [];
  const summary = payload?.summary || {};
  const judgeKey = judgeView === 'judge' ? 'independent_judge' : 'inpipeline_grade';

  const pairs = useMemo(() => {
    const map = {};
    for (const r of rows) {
      if (!map[r.theme_id]) map[r.theme_id] = {};
      map[r.theme_id][r.arm] = r;
    }
    return map;
  }, [rows]);

  const activePair = pairs[selectedTheme] || {};
  const bCell = activePair.baseline;
  const jCell = activePair.full_jnang;

  const baseStats = summary.baseline?.[judgeView] || {};
  const jnStats = summary.full_jnang?.[judgeView] || {};
  const deltaAuth = ((jnStats.cultural_authenticity || 0) - (baseStats.cultural_authenticity || 0)).toFixed(2);

  return (
    <div className="eval-dash">
      <div className="eval-dash__inner">
        <div className="eval-dash__header">
          <div>
            <div className="eval-dash__eyebrow">
              <BarChart3 size={14} />
              <span>14-Story Corpus Benchmark (N = 16 Cells, 8 Themes x 2 Arms)</span>
              <span className={`eval-pill ${dataSource === 'live' ? 'eval-pill--good' : ''}`}>
                {dataSource === 'live' ? 'Live /api/eval/results' : 'Snapshot eval_results.jsonl'}
              </span>
            </div>
            <h1 className="eval-dash__title">Naive Baseline vs. Full jnang Pipeline</h1>
          </div>

          <div className="eval-dash__controls">
            <div className="mode-toggle" role="tablist" aria-label="Evaluator selector">
              <button
                role="tab"
                aria-selected={judgeView === 'judge'}
                className={`mode-toggle__btn ${judgeView === 'judge' ? 'active' : ''}`}
                onClick={() => setJudgeView('judge')}
              >
                Blind Judge (Gemini)
              </button>
              <button
                role="tab"
                aria-selected={judgeView === 'in_pipe'}
                className={`mode-toggle__btn ${judgeView === 'in_pipe' ? 'active' : ''}`}
                onClick={() => setJudgeView('in_pipe')}
              >
                In-Pipeline Grader
              </button>
            </div>
            <button className="eval-memo-toggle" onClick={() => setShowMemo((v) => !v)}>
              <FileText size={14} />
              <span>{showMemo ? 'Hide Setup Memo' : 'Show Setup Memo'}</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="eval-kpis">
          <div className="eval-kpi">
            <span className="eval-kpi__label">Cultural Authenticity</span>
            <div className="eval-kpi__val">
              {(baseStats.cultural_authenticity ?? 0).toFixed(2)} <span className="eval-kpi__arrow">-&gt;</span> <strong>{(jnStats.cultural_authenticity ?? 0).toFixed(2)}</strong>
            </div>
            <span className="eval-kpi__delta">+{deltaAuth} / 10 ({judgeView === 'judge' ? 'blind judge' : 'in-pipe'})</span>
          </div>

          <div className="eval-kpi">
            <span className="eval-kpi__label">Paired Theme Wins</span>
            <div className="eval-kpi__val">
              <strong>{summary.sign_test?.wins ?? 7}/{summary.sign_test?.n ?? 8}</strong>
            </div>
            <span className="eval-kpi__delta">Exact sign test p = {summary.sign_test?.p_value ?? 0.0352}</span>
          </div>

          <div className="eval-kpi">
            <span className="eval-kpi__label">No-Hoarding Pass Rate</span>
            <div className="eval-kpi__val">
              {(baseStats.no_hoarding_pct ?? 0).toFixed(1)}% <span className="eval-kpi__arrow">-&gt;</span> <strong>{(jnStats.no_hoarding_pct ?? 0).toFixed(1)}%</strong>
            </div>
            <span className="eval-kpi__delta">{baseStats.no_hoarding_count ?? 4}/8 -&gt; {jnStats.no_hoarding_count ?? 6}/8 cells pass</span>
          </div>

          <div className="eval-kpi">
            <span className="eval-kpi__label">Verified Glosses / Trope-Free</span>
            <div className="eval-kpi__val">
              <strong>{summary.full_jnang?.deterministic?.verified_gloss_pct ?? 70}%</strong> &middot; <strong>{summary.full_jnang?.deterministic?.trope_free_pct ?? 100}%</strong>
            </div>
            <span className="eval-kpi__delta">7/10 glosses (0/0 base) &middot; 8/8 trope-free</span>
          </div>
        </div>

        {/* Setup Memo */}
        {showMemo && (
          <section className="eval-memo" aria-label="Experiment setup memo">
            <div className="eval-memo__title">
              <BookOpen size={15} />
              <h2>Experiment Setup Memo</h2>
            </div>
            <div className="eval-memo__grid">
              <div className="eval-memo__item">
                <h3>1. Two-Arm Design (N = 16)</h3>
                <p>Both arms generate narratives with <code>gpt-4o-mini</code> (<code>temp = 0.7</code>). <strong>Arm A (Baseline)</strong> receives only the bare theme prompt; <strong>Arm B (jnang)</strong> receives live Neo4j subgraph retrieval, PDF RAG chunks, and 20-entry <code>ju_dictionary.xls</code> lexical grounding.</p>
              </div>
              <div className="eval-memo__item">
                <h3>2. 14-Story Corpus Split</h3>
                <p><strong>11 Formalised Stories</strong> (<code>S1</code>-<code>S4</code>, <code>S8</code>-<code>S14</code>, 91 structural moves) populate Neo4j and RAG. <strong>3 Held-Out Stories</strong> (<code>S5</code>-<code>S7</code> from Chapters 5-7 of Biesele 2009) stay excluded from retrieval to test out-of-corpus generalisation across 5 preset + 3 held-out themes.</p>
              </div>
              <div className="eval-memo__item">
                <h3>3. Three Evaluation Instruments</h3>
                <p>(i) In-pipeline same-family Grader (<code>gpt-4o-mini</code>); (ii) Blind cross-vendor Judge (<code>gemini-2.5-flash</code>, <code>temp = 0</code>, arm labels stripped); (iii) Deterministic checks for 8 European tropes and <code>ju_dictionary.xls</code> parenthetical glosses.</p>
              </div>
            </div>
          </section>
        )}

        {/* Figure 1: Arm Comparison */}
        <section className="eval-card">
          <div className="eval-card__head">
            <div>
              <h2>Arm-Level Aggregate Comparison</h2>
              <p>Mean rubric scores (0-10) and deterministic cultural guardrails across all 8 evaluation themes.</p>
            </div>
          </div>
          <ArmComparisonSvg summary={summary} judgeView={judgeView} />
        </section>

        {/* Figures 2 & 3 side-by-side */}
        <div className="eval-grid-2">
          <section className="eval-card">
            <div className="eval-card__head">
              <div>
                <h2>Per-Theme Authenticity Shift</h2>
                <p>Click any theme row to inspect the generated stories side-by-side below.</p>
              </div>
            </div>
            <PerThemeDeltaSvg
              pairs={pairs}
              selectedTheme={selectedTheme}
              onSelectTheme={setSelectedTheme}
              judgeKey={judgeKey}
            />
          </section>

          <section className="eval-card">
            <div className="eval-card__head">
              <div>
                <h2>Cross-Vendor Grader Discrepancy</h2>
                <p>{summary.grader_agreement?.matches ?? 4}/16 overall grade match, MAE = {summary.grader_agreement?.mae_cultural ?? 3.20}.</p>
              </div>
            </div>
            <GraderDiscrepancySvg
              rows={rows}
              selectedTheme={selectedTheme}
              onSelectTheme={setSelectedTheme}
            />
          </section>
        </div>

        {/* Interactive Side-by-Side Story & Rubric Inspector */}
        <section className="eval-card eval-inspector">
          <div className="eval-inspector__top">
            <div>
              <h2>
                <GitCompare size={16} />
                <span>Pair Inspector: {THEME_LABELS[selectedTheme] || selectedTheme}</span>
              </h2>
              <p className="eval-inspector__prompt">{bCell?.theme_prompt || jCell?.theme_prompt}</p>
            </div>
            <div className="eval-theme-pills" role="tablist" aria-label="Select theme">
              {THEME_ORDER.map((tid) => (
                <button
                  key={tid}
                  className={`eval-theme-pill ${selectedTheme === tid ? 'active' : ''}`}
                  onClick={() => setSelectedTheme(tid)}
                >
                  {THEME_LABELS[tid]}
                </button>
              ))}
            </div>
          </div>

          <div className="eval-compare">
            {[
              { label: 'Arm A · Naive Baseline', cell: bCell, isJnang: false },
              { label: 'Arm B · Full jnang Pipeline', cell: jCell, isJnang: true },
            ].map(({ label, cell, isJnang }) => {
              if (!cell) return null;
              const j = cell.independent_judge || {};
              const p = cell.inpipeline_grade || {};
              const det = cell.deterministic_checks || {};
              return (
                <article key={label} className={`eval-story-pane ${isJnang ? 'eval-story-pane--jnang' : ''}`}>
                  <header className="eval-story-pane__head">
                    <div>
                      <span className="eval-story-pane__arm">{label}</span>
                      <span className="eval-story-pane__meta">
                        {cell.theme_source === 'held_out' ? 'Held-out theme' : 'Preset theme'} &middot; {cell.draft_char_len} chars
                      </span>
                    </div>
                    <div className="eval-story-pane__badges">
                      <span className={`eval-badge eval-badge--${gradeTone(j.overall_grade)}`}>
                        Judge: {j.cultural_authenticity_score?.toFixed(2)} ({j.overall_grade})
                      </span>
                      <span className={`eval-badge eval-badge--${gradeTone(p.overall_grade)}`}>
                        In-Pipe: {p.cultural_authenticity_score?.toFixed(2)} ({p.overall_grade})
                      </span>
                    </div>
                  </header>

                  <div className="eval-subscores">
                    <span>Egalitarianism: <strong>{j.egalitarianism_score}/10</strong></span>
                    <span>Food Sharing: <strong>{j.food_sharing_score}/10</strong></span>
                    <span>Kinship: <strong>{j.kinship_score}/10</strong></span>
                    <span>Motifeme: <strong>{j.motifeme_score}/10</strong></span>
                    <span>
                      {det.trope_free
                        ? <><CheckCircle2 size={12} /> Trope-free</>
                        : <><AlertTriangle size={12} /> Flagged: {det.flagged_terms?.join(', ')}</>}
                    </span>
                    <span>Glosses: <strong>{det.verified_glossed_terms}/{det.total_glossed_terms}</strong></span>
                  </div>

                  {isJnang && cell.rag_stories_used?.length > 0 && (
                    <div className="eval-rag">
                      <Sparkles size={12} />
                      <span>RAG Sources: {cell.rag_stories_used.join(' | ')}</span>
                    </div>
                  )}

                  {j.reasoning && (
                    <p className="eval-reasoning"><strong>Blind Judge Note:</strong> {j.reasoning}</p>
                  )}

                  <div className="eval-prose">{cell.draft_narrative}</div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
