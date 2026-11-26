// Tiny dependency-free column chart for "applications per day"
export default function BarChart({ data, height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="d-flex align-items-end gap-1" style={{ height }} role="img" aria-label="Applications per day, last 14 days">
      {data.map((d) => (
        <div key={d.date} className="flex-fill d-flex flex-column justify-content-end align-items-center h-100" title={`${d.date}: ${d.count}`}>
          <div className="small text-secondary" style={{ fontSize: 10, visibility: d.count ? 'visible' : 'hidden' }}>{d.count}</div>
          <div className="w-100 rounded-top bg-primary" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 2, opacity: d.count ? 1 : 0.2 }} />
          <div className="text-secondary mt-1" style={{ fontSize: 10 }}>{d.date.slice(8)}</div>
        </div>
      ))}
    </div>
  );
}
