import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Loader from './components/Loader';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import JobBoardPage from './pages/public/JobBoardPage';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import CandidatesPage from './pages/admin/CandidatesPage';
import CandidateDetailPage from './pages/admin/CandidateDetailPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import NotFoundPage from './pages/NotFoundPage';

// Guards every /admin page (except login/register) – replaces PHP requireAdmin()
function RequireAdmin({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <Loader className="vh-100" label="Checking session…" />;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<JobBoardPage />} />
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/register" element={<RegisterPage />} />

      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<DashboardPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
        <Route path="jobs" element={<AdminJobsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
