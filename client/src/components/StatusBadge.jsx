import { STATUS_META } from '../utils/format';

export default function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: 'secondary', icon: 'bi-dot' };
  return (
    <span className={`badge rounded-pill text-bg-${m.color} bg-opacity-25 text-${m.color}-emphasis border border-${m.color}-subtle fw-semibold`}>
      <i className={`bi ${m.icon} me-1`} />{m.label}
    </span>
  );
}
