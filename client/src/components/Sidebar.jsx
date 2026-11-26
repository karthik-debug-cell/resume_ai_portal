import { NavLink } from 'react-router-dom';
import Logo from './Logo';

const items = [
  { to: '/admin', end: true, icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { to: '/admin/candidates', icon: 'bi-people-fill', label: 'Candidates' },
  { to: '/admin/jobs', icon: 'bi-briefcase-fill', label: 'Jobs' },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`ra-sidebar d-flex flex-column ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      <div className="px-3 py-3 mb-2"><Logo to="/admin" light suffix="Admin" /></div>
      <nav className="nav flex-column px-2 gap-1 flex-grow-1">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} onClick={onNavigate} className="nav-link ra-side-link d-flex align-items-center gap-3">
            <i className={`bi ${i.icon}`} />{i.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-3">
        <NavLink to="/" className="nav-link ra-side-link d-flex align-items-center gap-3" onClick={onNavigate}>
          <i className="bi bi-box-arrow-up-right" />Public job board
        </NavLink>
      </div>
    </aside>
  );
}
