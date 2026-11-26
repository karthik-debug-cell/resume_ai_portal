import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { admin } = useAuth();
  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar ra-public-nav">
        <div className="container py-1">
          <Logo light />
          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="btn btn-link text-white-50 text-decoration-none">Jobs</Link>
            <Link to={admin ? '/admin' : '/admin/login'} className="btn btn-light btn-sm fw-semibold">{admin ? 'Dashboard' : 'Admin login'}</Link>
          </div>
        </div>
      </nav>
      <main className="flex-grow-1"><Outlet /></main>
      <footer className="text-center text-secondary small py-4 border-top bg-body">© {new Date().getFullYear()} ResumeAI Portal. AI-powered resume screening.</footer>
    </div>
  );
}
