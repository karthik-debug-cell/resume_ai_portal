import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { candidatesApi, jobsApi } from '../../api';
import { errorMessage } from '../../api/client';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';
import ScoreBar from '../../components/ScoreBar';
import SkillTags from '../../components/SkillTags';
import StatusSelect from '../../components/StatusSelect';
import { STATUSES, STATUS_META, formatDate } from '../../utils/format';

const LIMIT = 15;

// Replaces dashboard.php candidate table: search + filters, inline status update, pagination
export default function CandidatesPage() {
  const [params, setParams] = useSearchParams();
  const filters = { search: params.get('search') || '', job: params.get('job') || '', status: params.get('status') || '', minScore: params.get('minScore') || '0', page: Number(params.get('page')) || 1 };

  const [searchInput, setSearchInput] = useState(filters.search);
  const [jobs, setJobs] = useState([]);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { jobsApi.list().then((r) => setJobs(r.data)).catch(() => {}); }, []);
  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const update = useCallback((patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== '0' ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  }, [params, setParams]);

  // Debounced search box
  useEffect(() => {
    if (searchInput === filters.search) return undefined;
    const t = setTimeout(() => update({ search: searchInput.trim() }), 350);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = params.toString();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    candidatesApi
      .list({ search: filters.search, job: filters.job, status: filters.status, minScore: filters.minScore, page: filters.page, limit: LIMIT })
      .then((r) => { if (!cancelled) { setRows(r.data); setMeta(r.meta); setError(''); } })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (c, status) => {
    setSavingId(c.id);
    try {
      const res = await candidatesApi.setStatus(c.id, status);
      setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, status: res.data.status } : r)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingId(null);
    }
  };

  const hasFilters = filters.search || filters.job || filters.status || filters.minScore !== '0';

  return (
    <>
      <div className="mb-4"><h1 className="h3 mb-0">Candidates</h1><p className="text-secondary mb-0">Ranked by AI match score</p></div>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>

      <div className="card ra-card mb-3"><div className="card-body">
        <div className="row g-2">
          <div className="col-lg-4"><div className="input-group"><span className="input-group-text bg-transparent"><i className="bi bi-search" /></span><input className="form-control" placeholder="Search name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search" /></div></div>
          <div className="col-sm-6 col-lg-3"><select className="form-select" value={filters.job} onChange={(e) => update({ job: e.target.value })} aria-label="Filter by job"><option value="">All jobs</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></div>
          <div className="col-sm-6 col-lg-2"><select className="form-select" value={filters.status} onChange={(e) => update({ status: e.target.value })} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</select></div>
          <div className="col-sm-6 col-lg-2"><select className="form-select" value={filters.minScore} onChange={(e) => update({ minScore: e.target.value })} aria-label="Minimum score"><option value="0">Any score</option><option value="50">50% and above</option><option value="70">70% and above</option><option value="85">85% and above</option></select></div>
          <div className="col-sm-6 col-lg-1 d-grid"><button className="btn btn-outline-secondary" disabled={!hasFilters} onClick={() => { setSearchInput(''); setParams({}); }}>Clear</button></div>
        </div>
      </div></div>

      <div className="card ra-card">
        {loading ? <Loader label="Loading candidates…" /> : rows.length === 0 ? (
          <EmptyState icon="bi-person-x" title="No candidates found">{hasFilters ? 'Try removing a filter or searching for something else.' : 'Applications will appear here as soon as someone applies.'}</EmptyState>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 ra-table">
                <thead><tr><th>Candidate</th><th>Job</th><th style={{ minWidth: 150 }}>Match score</th><th>Matched skills</th><th style={{ minWidth: 150 }}>Status</th><th>Applied</th><th /></tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td><Link to={`/admin/candidates/${c.id}`} className="fw-semibold text-decoration-none">{c.name}</Link><div className="small"><a href={`mailto:${c.email}`} className="text-secondary text-decoration-none">{c.email}</a></div></td>
                      <td>{c.job?.title || <span className="text-secondary">No job</span>}</td>
                      <td><ScoreBar score={c.matchScore} /></td>
                      <td style={{ maxWidth: 240 }}><SkillTags skills={c.matchedSkills} limit={3} variant="success" emptyText="None" /></td>
                      <td><StatusSelect value={c.status} onChange={(s) => changeStatus(c, s)} disabled={savingId === c.id} /></td>
                      <td className="text-nowrap small">{formatDate(c.submittedAt)}</td>
                      <td className="text-end"><Link to={`/admin/candidates/${c.id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...meta} onChange={(p) => update({ page: String(p) })} />
          </>
        )}
      </div>
    </>
  );
}
