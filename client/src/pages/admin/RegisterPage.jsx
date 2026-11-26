import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import Logo from '../../components/Logo';

export default function RegisterPage() {
  const { admin, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(null);

  useEffect(() => { authApi.setupStatus().then((r) => setHasAdmin(r.data.hasAdmin)).catch(() => setHasAdmin(true)); }, []);

  if (admin) return <Navigate to="/admin" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password, inviteCode: form.inviteCode || undefined });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ra-auth min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card ra-card shadow-sm w-100" style={{ maxWidth: 460 }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4"><Logo /></div>
          <h1 className="h4 text-center mb-1">{hasAdmin === false ? 'Create the first admin' : 'Register an admin'}</h1>
          <p className="text-secondary text-center small mb-4">{hasAdmin === false ? 'No admin exists yet. This account will have full access.' : 'You need the invite code set in the server configuration.'}</p>
          <AlertMessage>{error}</AlertMessage>
          <form onSubmit={submit}>
            <div className="mb-3"><label className="form-label fw-semibold small" htmlFor="ru">Username</label><input id="ru" className="form-control" required minLength={3} maxLength={50} pattern="[A-Za-z0-9_.\-]+" title="Letters, numbers, . _ -" autoComplete="username" value={form.username} onChange={set('username')} /></div>
            <div className="mb-3"><label className="form-label fw-semibold small" htmlFor="re">Email</label><input id="re" type="email" className="form-control" autoComplete="email" value={form.email} onChange={set('email')} /></div>
            <div className="row g-3 mb-3">
              <div className="col-sm-6"><label className="form-label fw-semibold small" htmlFor="rp">Password</label><input id="rp" type="password" className="form-control" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /></div>
              <div className="col-sm-6"><label className="form-label fw-semibold small" htmlFor="rc">Confirm password</label><input id="rc" type="password" className="form-control" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></div>
              <div className="form-text mt-1">At least 8 characters.</div>
            </div>
            {hasAdmin !== false && <div className="mb-3"><label className="form-label fw-semibold small" htmlFor="ri">Invite code</label><input id="ri" className="form-control" required value={form.inviteCode} onChange={set('inviteCode')} /></div>}
            <button className="btn btn-primary w-100 mt-2" disabled={busy || hasAdmin === null}>{busy && <span className="spinner-border spinner-border-sm me-2" />}Create account</button>
          </form>
          <div className="text-center mt-4 small"><Link to="/admin/login" className="text-decoration-none"><i className="bi bi-arrow-left me-1" />Back to sign in</Link></div>
        </div>
      </div>
    </div>
  );
}
