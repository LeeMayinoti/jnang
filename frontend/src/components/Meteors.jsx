import React, { useEffect, useState } from 'react';

/**
 * Meteors – shooting-star background effect for .chat-canvas.
 *
 * Fixes vs original:
 *  - Randomises both top (-10% → 40%) and left (0% → 100%) so streaks
 *    originate across the whole upper region, not just the top edge.
 *  - Direction flipped to down-right (rotate 215deg + translateX positive)
 *    so meteors travel fully across the visible canvas instead of clipping
 *    off-screen immediately.
 *  - Per-meteor size randomisation via CSS custom props.
 *  - Opacity envelope: fade in quickly (0→10%), stay visible (10→85%), fade out.
 *  - Longer default delays spread out the bursts so they don't all fire at once.
 */
export default function Meteors({
  number = 18,
  minDelay = 0,
  maxDelay = 8,
  minDuration = 3,
  maxDuration = 8,
}) {
  const [meteorStyles, setMeteorStyles] = useState([]);

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => {
      const size = (Math.random() * 2 + 2).toFixed(1); // 2–4 px head
      const tailW = Math.floor(Math.random() * 80 + 60);  // 60–140 px tail
      return {
        '--meteor-delay':    `${(Math.random() * (maxDelay - minDelay) + minDelay).toFixed(2)}s`,
        '--meteor-dur':      `${(Math.random() * (maxDuration - minDuration) + minDuration).toFixed(1)}s`,
        '--meteor-size':     `${size}px`,
        '--meteor-tail-w':   `${tailW}px`,
        top:  `${Math.floor(Math.random() * 50) - 10}%`,   // -10% → 40%
        left: `${Math.floor(Math.random() * 100)}%`,        // 0% → 100%
      };
    });
    setMeteorStyles(styles);
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span key={idx} className="meteor-head" style={style}>
          <span className="meteor-tail" />
        </span>
      ))}
    </>
  );
}
