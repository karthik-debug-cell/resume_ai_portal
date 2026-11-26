export default function EmptyState({ icon = 'bi-inbox', title, children, action }) {
  return (
    <div className="text-center text-secondary py-5 px-3">
      <i className={`bi ${icon} display-5 d-block mb-3 opacity-50`} />
      <h3 className="h6 text-body mb-1">{title}</h3>
      {children && <p className="small mb-3">{children}</p>}
      {action}
    </div>
  );
}
