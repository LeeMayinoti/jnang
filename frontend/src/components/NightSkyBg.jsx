import React, { useEffect, useState } from 'react';

export default function NightSkyBg() {
  const [stars, setStars] = useState([]);
  const [meteors, setMeteors] = useState([]);
  const [embers, setEmbers] = useState([]);

  useEffect(() => {
    // Generate Twinkling Stars
    const numStars = 60;
    const generatedStars = Array.from({ length: numStars }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top: `${Math.random() * 85}%`,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 3 + 2}s`,
      baseOpacity: Math.random() * 0.5 + 0.2,
    }));
    setStars(generatedStars);

    // Generate Magic UI Style Meteors
    const numMeteors = 14;
    const generatedMeteors = Array.from({ length: numMeteors }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 45 - 10}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 9}s`,
      duration: `${Math.random() * 4 + 2.5}s`,
      angle: `${-200 - Math.random() * 30}deg`,
    }));
    setMeteors(generatedMeteors);

    // Generate Fire Embers
    const numEmbers = 25;
    const emberColors = ['#f97316', '#fbbf24', '#ef4444', '#fb923c'];
    const generatedEmbers = Array.from({ length: numEmbers }).map((_, i) => ({
      id: i,
      size: `${Math.random() * 3 + 2}px`,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 7 + 5}s`,
      delay: `${Math.random() * 6}s`,
      drift: `${(Math.random() - 0.5) * 90}px`,
      color: emberColors[Math.floor(Math.random() * emberColors.length)],
    }));
    setEmbers(generatedEmbers);
  }, []);

  return (
    <div className="night-sky-bg">
      <div className="fire-glow" />
      
      {/* Twinkling Stars */}
      <div className="stars-layer">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              top: s.top,
              left: s.left,
              '--duration': s.duration,
              '--base-opacity': s.baseOpacity,
            }}
          />
        ))}
      </div>

      {/* Meteors (Magic UI Shooting Stars) */}
      <div className="meteors-layer">
        {meteors.map((m) => (
          <div
            key={m.id}
            className="meteor"
            style={{
              top: m.top,
              left: m.left,
              '--delay': m.delay,
              '--duration': m.duration,
              '--angle': m.angle,
            }}
          />
        ))}
      </div>

      {/* Campfire Embers */}
      <div className="embers-layer">
        {embers.map((e) => (
          <div
            key={e.id}
            className="ember"
            style={{
              left: e.left,
              '--size': e.size,
              '--duration': e.duration,
              '--delay': e.delay,
              '--drift': e.drift,
              '--ember-color': e.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}
