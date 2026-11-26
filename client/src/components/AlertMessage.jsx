export default function AlertMessage({ type = 'danger', children, onClose, className = '' }) {
  if (!children) return null;
  const icons = { danger: 'bi-exclamation-triangle-fill', success: 'bi-check-circle-fill', warning: 'bi-exclamation-circle-fill', info: 'bi-info-circle-fill' };
  return (
    <div className={`alert alert-${type} d-flex align-items-start gap-2 ${onClose ? 'alert-dismissible' : ''} ${className}`} role="alert">
      <i className={`bi ${icons[type]} mt-1`} />
      <div className="flex-grow-1">{children}</div>
      {onClose && <button type="button" className="btn-close" aria-label="Dismiss" onClick={onClose} />}
    </div>
  );
}
