import React from 'react';

const WIDTH = 1440;
const HEIGHT = 200;

/** Generator deterministik agar bentuk buih sama di setiap render. */
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function crestY(x, base, amplitude, phase) {
  return (
    base +
    Math.sin(x / 190 + phase) * amplitude +
    Math.sin(x / 71 + phase * 2.3) * amplitude * 0.45 +
    Math.sin(x / 23 + phase * 3.7) * amplitude * 0.16 -
    Math.abs(Math.sin(x / 13 + phase * 5.1)) * amplitude * 0.32
  );
}

function crestPoints(base, amplitude, phase) {
  const points = [];
  for (let x = 0; x <= WIDTH; x += 4) {
    points.push([x, crestY(x, base, amplitude, phase)]);
  }
  return points;
}

const toLine = (points) => points.map(([x, y]) => `${x},${y.toFixed(1)}`).join(' L');
const toFill = (points) => `M0,${HEIGHT} L${toLine(points)} L${WIDTH},${HEIGHT} Z`;

const LAYERS = [
  { color: '#566680', base: 44, amplitude: 20, phase: 0.4, tide: '34px', delay: '0ms' },
  { color: '#8E9CB7', base: 72, amplitude: 18, phase: 1.7, tide: '26px', delay: '70ms' },
  { color: '#B4C0D5', base: 98, amplitude: 16, phase: 3.1, tide: '20px', delay: '140ms' },
  { color: '#F5F7FB', base: 124, amplitude: 15, phase: 4.6, tide: '14px', delay: '210ms' },
];

const LACE = [
  { base: 58, amplitude: 19, phase: 1.1, opacity: 0.35 },
  { base: 86, amplitude: 17, phase: 2.4, opacity: 0.5 },
  { base: 112, amplitude: 15, phase: 3.9, opacity: 0.7 },
];

function buildBubbles() {
  const random = seededRandom(90210);
  return Array.from({ length: 220 }, () => {
    const x = random() * WIDTH;
    const y = crestY(x, 124, 15, 4.6) - random() * random() * 62;
    return { x, y, r: 0.7 + random() * random() * 3.4, opacity: 0.35 + random() * 0.6 };
  });
}

const BUBBLES = buildBubbles();

/** Garis buih ombak: pemisah khas antara area gelap dan area berwarna `fill`. */
export default function FoamEdge({ fill = '#DAE1EE', className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      className={`block w-full h-24 sm:h-32 lg:h-40 ${className}`}
    >
      {LAYERS.map((layer) => (
        <path
          key={layer.color}
          className="animate-tide"
          style={{ '--tide-from': layer.tide, animationDelay: layer.delay }}
          d={toFill(crestPoints(layer.base, layer.amplitude, layer.phase))}
          fill={layer.color}
        />
      ))}
      {LACE.map((lace) => (
        <path
          key={lace.base}
          d={`M${toLine(crestPoints(lace.base, lace.amplitude, lace.phase))}`}
          fill="none"
          stroke="#F5F7FB"
          strokeWidth="1.4"
          strokeDasharray="10 7 3 9"
          strokeLinecap="round"
          opacity={lace.opacity}
        />
      ))}
      {BUBBLES.map((bubble, index) => (
        <circle key={index} cx={bubble.x} cy={bubble.y} r={bubble.r} fill="#F5F7FB" opacity={bubble.opacity} />
      ))}
      <path d={toFill(crestPoints(160, 11, 5.8))} fill={fill} />
    </svg>
  );
}
