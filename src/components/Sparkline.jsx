import React from 'react';

export default function Sparkline({ prices, width = 120, height = 36, color = '#00ff88' }) {
  if (!prices || prices.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const isPositive = prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? '#00ff88' : '#ff4444';

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}
