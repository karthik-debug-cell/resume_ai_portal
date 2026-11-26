export default function StatCard({ label, value, icon, tone = 'primary', hint }) {
  return (
    <div className="card ra-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`ra-stat-icon bg-${tone}-subtle text-${tone}-emphasis`}><i className={`bi ${icon}`} /></div>
        <div className="min-w-0">
          <div className="fs-3 fw-bold lh-1">{value}</div>
          <div className="text-secondary small mt-1">{label}</div>
          {hint && <div className="text-secondary small opacity-75">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
