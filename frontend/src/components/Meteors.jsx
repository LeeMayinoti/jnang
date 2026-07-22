import React, { useEffect, useState } from 'react';

/**
 * Meteors – a faithful port of the Magic UI Meteors component.
 * Works with vanilla CSS (no Tailwind required).
 *
 * Usage: <Meteors number={30} />
 */
export default function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
}) {
  const [meteorStyles, setMeteorStyles] = useState([]);

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => ({
      '--meteor-delay': `${(Math.random() * (maxDelay - minDelay) + minDelay).toFixed(2)}s`,
      '--meteor-dur': `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
      top: '-5%',
      // Start more to the right since they travel down-left
      left: `${20 + Math.floor(Math.random() * 80)}%`,
    }));
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
