interface RadarChartProps {
  scores: number[]; // Array of 5 scores (0-200)
  labels: string[];
  maxScore?: number;
  size?: number;
}

export function RadarChart({ scores, labels, maxScore = 200 }: RadarChartProps) {
  const size = 260;
  const center = size / 2;
  const radius = (size / 2) - 30;
  const levels = 5; // 0, 40, 80, 120, 160, 200
  const angleStep = (2 * Math.PI) / scores.length;
  const startAngle = -Math.PI / 2; // Start from top

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = startAngle + index * angleStep;
    const r = (value / maxScore) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const levelValue = ((level + 1) / levels) * maxScore;
    const points = scores.map((_, i) => getPoint(i, levelValue).join(',')).join(' ');
    return <polygon key={level} points={points} className="radar-grid" opacity={0.5 + (level * 0.1)} />;
  });

  // Axis lines
  const axisLines = scores.map((_, i) => {
    const [x, y] = getPoint(i, maxScore);
    return <line key={i} x1={center} y1={center} x2={x} y2={y} className="radar-axis" />;
  });

  // Data polygon
  const dataPoints = scores.map((score, i) => getPoint(i, score));
  const dataPolygonPoints = dataPoints.map(p => p.join(',')).join(' ');

  // Labels
  const labelElements = labels.map((label, i) => {
    const [x, y] = getPoint(i, maxScore + 18);
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[#737373] text-[9px] font-bold uppercase tracking-widest"
      >
        {label}
      </text>
    );
  });

  // Score labels on vertices
  const scoreLabels = scores.map((score, i) => {
    const [x, y] = getPoint(i, score);
    const titleText = `C${i + 1}: ${score} pts`;
    return (
      <g key={`score-${i}`}>
        <circle cx={x} cy={y} r={12} className="fill-white stroke-[#E5E5E5] cursor-help" strokeWidth={1}>
          <title>{titleText}</title>
        </circle>
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#3b82f6] text-[9px] font-bold pointer-events-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {score}
        </text>
      </g>
    );
  });

  return (
    <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size}`} className="select-none">
      {gridPolygons}
      {axisLines}
      <polygon points={dataPolygonPoints} className="radar-area" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} className="radar-point" />
      ))}
      {labelElements}
      {scoreLabels}
    </svg>
  );
}
