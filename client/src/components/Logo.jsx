import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, suffix }) {
  return (
    <Link to={to} className={`ra-logo text-decoration-none d-inline-flex align-items-center gap-2 ${light ? 'text-white' : 'text-body'}`}>
      <span className="ra-logo-mark"><i className="bi bi-file-earmark-person-fill" /></span>
      <span className="fw-bold fs-5">
        Resume<span className="text-accent">AI</span>
        {suffix && <small className="ms-2 fw-medium opacity-75 fs-6">{suffix}</small>}
      </span>
    </Link>
  );
}
