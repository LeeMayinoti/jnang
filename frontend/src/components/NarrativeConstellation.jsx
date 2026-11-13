import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

const FALLBACK_PREVIEW = {
  sources: [
    {
      id: 'S2',
      title: 'The Honey and the Flies',
      moves: [
        { id: 'f1', label: 'Harvesting honey in the bush', motifeme: 'Lack', domain: 'Bush' },
        { id: 'f2', label: 'Whistling magic summons dishes', motifeme: 'Mediation', domain: 'Bush' },
        { id: 'f3', label: 'Imitation breaks natural order', motifeme: 'Violation', domain: 'Bush' },
        { id: 'f4', label: 'Fall and injury on the ground', motifeme: 'Consequence', domain: 'Camp' },
        { id: 'f5', label: 'Communal rescue restores life', motifeme: 'Lack Liquidated', domain: 'Camp' },
      ],
    },
  ],
  motifemes: ['Lack', 'Mediation', 'Violation', 'Consequence', 'Lack Liquidated'],
};

const DOMAIN_Y = {
  Bush: 28,
  Liminal: 55,
  Camp: 82,
};

// Deterministic subtle offset so stars form an organic constellation rather than a flat line
function jitter(index, seed) {
  const angle = (index * 2.399 + seed * 1.13) % (Math.PI * 2);
  return {
    dx: Math.cos(angle) * 7,
    dy: Math.sin(angle) * 8,
  };
}

const AMBIENT_STARS = [
  { x: 26, y: 18, r: 0.7 }, { x: 88, y: 92, r: 0.9 }, { x: 148, y: 16, r: 0.6 },
  { x: 215, y: 96, r: 0.8 }, { x: 270, y: 22, r: 1.0 }, { x: 318, y: 88, r: 0.7 },
  { x: 392, y: 14, r: 0.8 }, { x: 454, y: 95, r: 0.7 }, { x: 512, y: 24, r: 0.9 },
  { x: 64, y: 48, r: 0.6 }, { x: 252, y: 66, r: 0.6 }, { x: 486, y: 58, r: 0.7 },
];

function StarFlare({ x, y, r = 2.6, active = false, target = false }) {
  const flare = active ? r * 2.6 : target ? r * 1.9 : 0;
  return (
    <g className={`constellation__star ${active ? 'is-active' : ''} ${target ? 'is-target' : ''}`}>
      {active && <circle cx={x} cy={y} r={r * 3.1} className="constellation__halo" />}
      {flare > 0 && (
        <path
          d={`M ${x - flare} ${y} L ${x + flare} ${y} M ${x} ${y - flare} L ${x} ${y + flare}`}
          className="constellation__flare"
        />
      )}
      <circle cx={x} cy={y} r={r} className="constellation__dot" />
    </g>
  );
}

/**
 * NarrativeConstellation — minimalistic constellation visualizer showing Neo4j
 * canonical story traversal feeding into the newly generated narrative.
 */
export default function NarrativeConstellation({
  preview,
  pending = false,
  step = 1,
  resultMotifemes = [],
  resultMoves = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeHop, setActiveHop] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);

  const data = preview?.sources?.length ? preview : FALLBACK_PREVIEW;
  const primarySource = data.sources[0];
  const secondarySource = data.sources[1];

  const sourceNodes = useMemo(() => {
    const moves = primarySource?.moves?.slice(0, 6) || [];
    const n = Math.max(1, moves.length);
    return moves.map((m, i) => {
      const baseX = 34 + (i / Math.max(1, n - 1)) * 176;
      const baseY = DOMAIN_Y[m.domain] ?? 55;
      const j = jitter(i, primarySource.id?.charCodeAt(1) || 2);
      return {
        ...m,
        x: Math.round(baseX + j.dx),
        y: Math.round(Math.max(18, Math.min(92, baseY + j.dy))),
      };
    });
  }, [primarySource]);

  const secondaryNodes = useMemo(() => {
    if (!secondarySource?.moves?.length) return [];
    const moves = secondarySource.moves.slice(0, 4);
    return moves.map((m, i) => ({
      ...m,
      x: 52 + i * 42,
      y: i % 2 === 0 ? 86 : 74,
    }));
  }, [secondarySource]);

  const targetNodes = useMemo(() => {
    const items =
      !pending && (resultMoves?.length || resultMotifemes?.length)
        ? (resultMoves.length ? resultMoves : resultMotifemes).slice(0, 6).map((label, idx) => ({
            id: `out-${idx}`,
            label: typeof label === 'string' ? label : String(label),
            motifeme: resultMotifemes[idx] || resultMotifemes[resultMotifemes.length - 1] || 'Motifeme',
          }))
        : (data.motifemes?.length ? data.motifemes : ['Lack', 'Mediation', 'Lack Liquidated'])
            .slice(0, 5)
            .map((mot, idx) => ({
              id: `draft-${idx}`,
              label: `${mot} beat`,
              motifeme: mot,
            }));

    const n = Math.max(1, items.length);
    return items.map((item, i) => {
      const baseX = 330 + (i / Math.max(1, n - 1)) * 176;
      const band = i === 0 ? 64 : i === n - 1 ? 74 : i % 2 === 1 ? 30 : 48;
      const j = jitter(i + 3, 7);
      return {
        ...item,
        x: Math.round(baseX + j.dx),
        y: Math.round(Math.max(20, Math.min(90, band + j.dy * 0.7))),
      };
    });
  }, [pending, resultMoves, resultMotifemes, data.motifemes]);

  // Animate sequential star-to-star traversal while the pipeline is running
  useEffect(() => {
    if (!pending || sourceNodes.length === 0) return undefined;
    const timer = setInterval(() => {
      setActiveHop((prev) => (prev + 1) % sourceNodes.length);
    }, 950);
    return () => clearInterval(timer);
  }, [pending, sourceNodes.length]);

  const activeSourceNode = sourceNodes[activeHop % Math.max(1, sourceNodes.length)];
  const activeTargetNode =
    targetNodes[Math.min(targetNodes.length - 1, Math.floor((activeHop / Math.max(1, sourceNodes.length)) * targetNodes.length))];

  const bridgePath =
    activeSourceNode && activeTargetNode
      ? `M ${activeSourceNode.x} ${activeSourceNode.y} Q 270 ${Math.min(activeSourceNode.y, activeTargetNode.y) - 18} ${activeTargetNode.x} ${activeTargetNode.y}`
      : '';

  const showCanvas = pending || expanded;
  const sourceLabel = secondarySource
    ? `${primarySource.id} · ${primarySource.title} + ${secondarySource.id}`
    : `${primarySource.id} · ${primarySource.title}`;

  return (
    <div className={`constellation ${pending ? 'constellation--live' : 'constellation--settled'}`}>
      {!pending && (
        <button
          type="button"
          className="constellation__pill"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <Sparkles size={12} />
          <span>Graph lineage · {primarySource.id} ({primarySource.title})</span>
          <span className="constellation__pill-meta">
            {targetNodes.length} moves
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        </button>
      )}

      {showCanvas && (
        <div className="constellation__frame">
          <svg
            className="constellation__svg"
            viewBox="0 0 540 112"
            role="img"
            aria-label={`Narrative graph traversal from ${primarySource.title}`}
          >
            {/* Ambient background starlight */}
            {AMBIENT_STARS.map((s, idx) => (
              <circle key={idx} cx={s.x} cy={s.y} r={s.r} className="constellation__dust" />
            ))}

            {/* Secondary faint background constellation */}
            {secondaryNodes.map((n, i) =>
              i > 0 ? (
                <line
                  key={`sec-e-${i}`}
                  x1={secondaryNodes[i - 1].x}
                  y1={secondaryNodes[i - 1].y}
                  x2={n.x}
                  y2={n.y}
                  className="constellation__edge constellation__edge--faint"
                />
              ) : null
            )}
            {secondaryNodes.map((n) => (
              <circle key={`sec-n-${n.id}`} cx={n.x} cy={n.y} r={1.5} className="constellation__dust" />
            ))}

            {/* Primary canonical source constellation */}
            {sourceNodes.map((n, i) =>
              i > 0 ? (
                <line
                  key={`src-e-${n.id}`}
                  x1={sourceNodes[i - 1].x}
                  y1={sourceNodes[i - 1].y}
                  x2={n.x}
                  y2={n.y}
                  className={`constellation__edge ${pending && i <= activeHop ? 'is-lit' : ''}`}
                />
              ) : null
            )}

            {/* Synapse bridge from traversed canonical move to emerging story */}
            {bridgePath && (
              <>
                <path d={bridgePath} className="constellation__bridge-bg" />
                {pending && <path d={bridgePath} className="constellation__bridge-pulse" />}
              </>
            )}

            {/* Emerging / final story constellation */}
            {targetNodes.map((n, i) =>
              i > 0 ? (
                <line
                  key={`tgt-e-${n.id}`}
                  x1={targetNodes[i - 1].x}
                  y1={targetNodes[i - 1].y}
                  x2={n.x}
                  y2={n.y}
                  className={`constellation__edge ${pending ? 'is-forming' : 'is-lit'}`}
                />
              ) : null
            )}

            {/* Source move stars */}
            {sourceNodes.map((n, i) => (
              <g
                key={`src-n-${n.id}`}
                onMouseEnter={() => setHoveredNode({ side: primarySource.id, ...n })}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <StarFlare x={n.x} y={n.y} r={2.3} active={pending && i === activeHop} />
              </g>
            ))}

            {/* Target move stars */}
            {targetNodes.map((n, i) => {
              const isFormed = !pending || step >= 2 || i <= Math.floor((activeHop / Math.max(1, sourceNodes.length)) * targetNodes.length);
              return (
                <g
                  key={`tgt-n-${n.id}`}
                  onMouseEnter={() => setHoveredNode({ side: 'New Story', ...n })}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer', opacity: isFormed ? 1 : 0.35 }}
                >
                  <StarFlare
                    x={n.x}
                    y={n.y}
                    r={2.5}
                    target
                    active={pending && n.id === activeTargetNode?.id}
                  />
                </g>
              );
            })}

            {/* Subtle left/right labels inside the SVG corners */}
            <text x="14" y="104" className="constellation__corner">
              {primarySource.id} CANON
            </text>
            <text x="526" y="104" textAnchor="end" className="constellation__corner">
              {pending ? 'WEAVING' : 'NEW ARC'}
            </text>
          </svg>

          <div className="constellation__caption">
            <span className="constellation__source">
              {hoveredNode
                ? `${hoveredNode.side} · [${hoveredNode.motifeme}] ${hoveredNode.label}`
                : pending && activeSourceNode
                ? `Traversing ${primarySource.id} · [${activeSourceNode.motifeme}] ${activeSourceNode.label}`
                : sourceLabel}
            </span>
            {!hoveredNode && (
              <span className="constellation__chain">
                {(data.motifemes || []).slice(0, 4).join(' → ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
