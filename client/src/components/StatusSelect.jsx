import { STATUSES, STATUS_META } from '../utils/format';

// Inline candidate-status control (replaces the PHP auto-submitting <select>)
export default function StatusSelect({ value, onChange, disabled, size = 'sm' }) {
  const color = STATUS_META[value]?.color || 'secondary';
  return (
    <select
      className={`form-select form-select-${size} ra-status-select border-${color}-subtle bg-${color}-subtle text-${color}-emphasis fw-semibold`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Candidate status"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
    </select>
  );
}
