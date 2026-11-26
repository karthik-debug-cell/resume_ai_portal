export default function Loader({ label = 'Loading…', className = 'py-5' }) {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center text-secondary ${className}`} role="status">
      <div className="spinner-border spinner-border-sm mb-2" aria-hidden="true" />
      <span className="small">{label}</span>
    </div>
  );
}
