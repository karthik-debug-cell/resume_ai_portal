import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onToggleSidebar }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/admin/candidates${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className="ra-topbar navbar bg-body border-bottom px-3 gap-3">
      <button className="btn btn-outline-secondary d-lg-none" onClick={onToggleSidebar} aria-label="Toggle navigation"><i className="bi bi-list fs-5" /></button>
      <form className="flex-grow-1 d-none d-sm-block" style={{ maxWidth: 420 }} onSubmit={submit} role="search">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0"><i className="bi bi-search" /></span>
          <input className="form-control border-start-0 ps-0" placeholder="Search candidates by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search candidates" />
        </div>
      </form>
      <div className="ms-auto position-relative" ref={ref}>
        <button className="btn btn-light border d-flex align-items-center gap-2" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <span className="ra-avatar">{admin?.username?.[0]?.toUpperCase()}</span>
          <span className="d-none d-md-inline fw-semibold">{admin?.username}</span>
          <i className="bi bi-chevron-down small" />
        </button>
        {menu && (
          <ul className="dropdown-menu dropdown-menu-end show shadow-sm mt-1">
            <li><span className="dropdown-item-text small text-secondary">Signed in as <strong>{admin?.username}</strong></span></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={() => { logout(); navigate('/admin/login'); }}><i className="bi bi-box-arrow-right me-2" />Sign out</button></li>
          </ul>
        )}
      </div>
    </header>
  );
}
