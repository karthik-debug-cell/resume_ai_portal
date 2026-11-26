import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api';
import { errorMessage } from '../../api/client';
import AlertMessage from '../../components/AlertMessage';
import BarChart from '../../components/BarChart';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import ScoreBar from '../../components/ScoreBar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_META, STATUSES, formatDate } from '../../utils/format';

// Recruiter analytics (extends the stat cards of the original dashboard.php)
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { dashboardApi.stats().then((r) => setData(r.data)).catch((e) => setError(errorMessage(e))); }, []);

  if (error) return <AlertMessage>{error}</AlertMessage>;
  if (!data) return <Loader label="Loading analytics…" />;

  const total = data.totalCandidates || 1;
  const sd = data.scoreDistribution;
  const scoreRows = [['70% and above', sd.high, 'success'], ['40% to 69%', sd.medium, 'warning'], ['Below 40%', sd.low, 'danger']];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h1 className="h3 mb-0">Dashboard</h1><p className="text-secondary mb-0">Hiring pipeline at a glance</p></div>
        <Link to="/admin/jobs" className="btn btn-primary"><i className="bi bi-plus-lg me-1" />New job</Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><StatCard label="Total applicants" value={data.totalCandidates} icon="bi-people-fill" tone="primary" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Pending review" value={data.pending} icon="bi-hourglass-split" tone="warning" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Shortlisted" value={data.shortlisted} icon="bi-star-fill" tone="success" /></div>
        <div className="col-6 col-xl-3"><StatCard label="Average match score" value={`${data.avgScore}%`} icon="bi-bullseye" tone="info" hint={`${data.openJobs} of ${data.totalJobs} jobs open`} /></div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-xl-8">
          <div className="card ra-card h-100"><div className="card-body">
            <h2 className="h6 mb-3">Applications, last 14 days</h2>
            <BarChart data={data.applicationsOverTime} />
          </div></div>
        </div>
        <div className="col-xl-4">
          <div className="card ra-card h-100"><div className="card-body">
            <h2 className="h6 mb-3">Candidates by status</h2>
            <div className="progress mb-3" style={{ height: 12 }}>
              {STATUSES.map((s) => <div key={s} className={`progress-bar bg-${STATUS_META[s].color}`} style={{ width: `${(data.statusCounts[s] / total) * 100}%` }} title={`${STATUS_META[s].label}: ${data.statusCounts[s]}`} />)}
            </div>
            <ul className="list-unstyled mb-0">
              {STATUSES.map((s) => (
                <li key={s} className="d-flex justify-content-between py-1">
                  <span><span className={`d-inline-block rounded-circle bg-${STATUS_META[s].color} me-2`} style={{ width: 10, height: 10 }} />{STATUS_META[s].label}</span>
                  <Link to={`/admin/candidates?status=${s}`} className="fw-semibold text-decoration-none">{data.statusCounts[s]}</Link>
                </li>
              ))}
            </ul>
          </div></div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="card ra-card h-100"><div className="card-body">
            <h2 className="h6 mb-3">Match score distribution</h2>
            {scoreRows.map(([label, n, tone]) => (
              <div key={label} className="mb-3">
                <div className="d-flex justify-content-between small mb-1"><span>{label}</span><span className="fw-semibold">{n}</span></div>
                <div className="progress" style={{ height: 8 }}><div className={`progress-bar bg-${tone}`} style={{ width: `${(n / total) * 100}%` }} /></div>
              </div>
            ))}
          </div></div>
        </div>
        <div className="col-lg-6">
          <div className="card ra-card h-100"><div className="card-body">
            <h2 className="h6 mb-3">Applications by job</h2>
            {data.applicationsByJob.length === 0 ? <EmptyState icon="bi-bar-chart" title="No applications yet" /> : data.applicationsByJob.map((j) => (
              <div key={j.jobId} className="d-flex align-items-center gap-3 mb-2">
                <Link to={`/admin/candidates?job=${j.jobId}`} className="text-body text-decoration-none text-truncate flex-grow-1">{j.title}</Link>
                <span className="small text-secondary text-nowrap">avg {j.avgScore}%</span>
                <span className="badge text-bg-primary">{j.count}</span>
              </div>
            ))}
          </div></div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card ra-card h-100">
            <div className="card-header bg-transparent fw-semibold">Top matches</div>
            <ul className="list-group list-group-flush">
              {data.topCandidates.length === 0 && <li className="list-group-item"><EmptyState icon="bi-trophy" title="No candidates yet" /></li>}
              {data.topCandidates.map((c) => (
                <li key={c._id} className="list-group-item d-flex align-items-center gap-3">
                  <div className="flex-grow-1 min-w-0"><Link to={`/admin/candidates/${c._id}`} className="fw-semibold text-decoration-none">{c.name}</Link><div className="small text-secondary text-truncate">{c.jobTitle || 'No job'}</div></div>
                  <ScoreBar score={c.matchScore} width={130} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card ra-card h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center"><span className="fw-semibold">Recent applications</span><Link to="/admin/candidates" className="small text-decoration-none">View all</Link></div>
            <ul className="list-group list-group-flush">
              {data.recentCandidates.map((c) => (
                <li key={c._id} className="list-group-item d-flex align-items-center gap-3">
                  <div className="flex-grow-1 min-w-0"><Link to={`/admin/candidates/${c._id}`} className="fw-semibold text-decoration-none">{c.name}</Link><div className="small text-secondary text-truncate">{c.jobTitle || 'No job'}, {formatDate(c.submittedAt)}</div></div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
