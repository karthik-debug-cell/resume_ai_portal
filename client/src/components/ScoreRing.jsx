import { scoreTone } from '../utils/format';

// AI match-score gauge (SVG ring). The only bespoke visual – everything else is plain Bootstrap.
export default function ScoreRing({ score = 0, size = 120, stroke = 10, label = 'Match' }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(value);
  const display = Number.isInteger(value) ? value : value.toFixed(1);

  return (
    <div className="ra-ring position-relative flex-shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label} score ${display} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bs-border-color)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={`var(--bs-${tone})`} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="position-absolute top-50 start-50 translate-middle text-center lh-1">
        <div className="fw-bold" style={{ fontSize: size * 0.27 }}>{display}<span style={{ fontSize: size * 0.14 }}>%</span></div>
        <div className="text-secondary" style={{ fontSize: Math.max(10, size * 0.1) }}>{label}</div>
      </div>
    </div>
  );
}
