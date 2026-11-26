export default function SkillTags({ skills = [], variant = 'secondary', limit, icon, emptyText }) {
  if (!skills.length) return emptyText ? <span className="text-secondary small">{emptyText}</span> : null;
  const shown = limit ? skills.slice(0, limit) : skills;
  return (
    <div className="d-flex flex-wrap gap-1">
      {shown.map((s) => (
        <span key={s} className={`badge fw-medium text-bg-${variant} bg-opacity-10 text-${variant}-emphasis border border-${variant}-subtle`}>
          {icon && <i className={`bi ${icon} me-1`} />}{s}
        </span>
      ))}
      {limit && skills.length > limit && <span className="badge text-bg-light border text-secondary">+{skills.length - limit}</span>}
    </div>
  );
}
