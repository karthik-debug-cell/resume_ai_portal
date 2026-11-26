import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import Logo from '../../components/Logo';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(true);

  useEffect(() => { authApi.setupStatus().then((r) => setHasAdmin(r.data.hasAdmin)).catch(() => {}); }, []);

  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ra-auth min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card ra-card shadow-sm w-100" style={{ maxWidth: 420 }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4"><Logo /></div>
          <h1 className="h4 text-center mb-1">Sign in</h1>
          <p className="text-secondary text-center small mb-4">Access the screening dashboard</p>
          <AlertMessage>{error}</AlertMessage>
          <form onSubmit={submit}>
            <div className="mb-3"><label className="form-label fw-semibold small" htmlFor="u">Username</label><input id="u" className="form-control" autoFocus required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="mb-4"><label className="form-label fw-semibold small" htmlFor="p">Password</label><input id="p" type="password" className="form-control" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <button className="btn btn-primary w-100" disabled={busy}>{busy && <span className="spinner-border spinner-border-sm me-2" />}Sign in</button>
          </form>
          <div className="d-flex justify-content-between mt-4 small">
            <Link to="/" className="text-decoration-none"><i className="bi bi-arrow-left me-1" />Back to job board</Link>
            <Link to="/admin/register" className="text-decoration-none">{hasAdmin ? 'Register with invite code' : 'Create first admin'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
