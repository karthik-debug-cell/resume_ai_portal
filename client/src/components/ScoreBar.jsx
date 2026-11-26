import { scoreTone, formatScore } from '../utils/format';

export default function ScoreBar({ score = 0, width = 110 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="d-flex align-items-center gap-2" style={{ minWidth: width }}>
      <div className="progress flex-grow-1" style={{ height: 8 }} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
        <div className={`progress-bar bg-${scoreTone(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className="small fw-semibold text-nowrap" style={{ width: 48 }}>{formatScore(value)}</span>
    </div>
  );
}
