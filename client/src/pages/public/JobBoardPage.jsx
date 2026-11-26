import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api';
import { errorMessage } from '../../api/client';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import FileDropzone from '../../components/FileDropzone';
import JobCard from '../../components/JobCard';
import Loader from '../../components/Loader';
import ScoreRing from '../../components/ScoreRing';
import SkillTags from '../../components/SkillTags';
import { RECOMMENDATION_META } from '../../utils/format';

const emptyForm = { name: '', email: '', phone: '' };

// Replaces index.php: job listing, job details, application form and instant match result
export default function JobBoardPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('job');

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ openRoles: 0, applicants: 0, shortlisted: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([publicApi.jobs(), publicApi.stats()])
      .then(([j, s]) => { setJobs(j.data); setStats(s.data); })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const selected = jobs.find((j) => j.id === selectedId);

  const select = (id) => { setParams({ job: id }); setResult(null); setError(''); setFile(null); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) return setError('Please upload your resume (PDF, DOCX or TXT).');
    const body = new FormData();
    body.append('name', form.name);
    body.append('email', form.email);
    body.append('phone', form.phone);
    body.append('jobId', selected.id);
    body.append('resume', file);
    setSubmitting(true);
    try {
      const res = await publicApi.apply(body);
      setResult(res.data);
      setForm(emptyForm);
      setFile(null);
      publicApi.stats().then((s) => setStats(s.data)).catch(() => {});
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="ra-hero text-white">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold mb-3">Know how well you fit before a recruiter does.</h1>
              <p className="lead text-white-50 mb-0">Upload your resume for any open role. Our AI reads it against the job requirements and shows your match score, the skills it found, and the ones it did not.</p>
            </div>
            <div className="col-lg-5">
              <div className="row g-3 text-center">
                {[['Open roles', stats.openRoles], ['Applicants', stats.applicants], ['Shortlisted', stats.shortlisted]].map(([label, n]) => (
                  <div className="col-4" key={label}>
                    <div className="ra-hero-stat rounded-3 py-3"><div className="fs-2 fw-bold lh-1">{n}</div><div className="small text-white-50 mt-1">{label}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-4 py-lg-5">
        <AlertMessage>{loadError}</AlertMessage>
        {loading ? <Loader label="Loading open roles…" /> : (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Open positions</h2>
                <span className="badge text-bg-primary bg-opacity-10 text-primary-emphasis border border-primary-subtle">{jobs.length} roles</span>
              </div>
              {jobs.length === 0 ? (
                <div className="card ra-card"><EmptyState icon="bi-briefcase" title="No open positions">Check back soon for new roles.</EmptyState></div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {jobs.map((j) => <JobCard key={j.id} job={j} active={j.id === selectedId} onSelect={() => select(j.id)} />)}
                </div>
              )}
            </div>

            <div className="col-lg-7">
              <div className="card ra-card sticky-lg-top" style={{ top: 16 }}>
                {result ? (
                  <div className="card-body p-4">
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
                      <ScoreRing score={result.score} size={130} />
                      <div>
                        <h2 className="h5"><i className="bi bi-check-circle-fill text-success me-2" />Application submitted</h2>
                        {result.recommendation && <span className={`badge text-bg-${RECOMMENDATION_META[result.recommendation]?.color} mb-2`}>{RECOMMENDATION_META[result.recommendation]?.label}</span>}
                        {result.summary && <p className="text-secondary mb-0">{result.summary}</p>}
                      </div>
                    </div>
                    <hr />
                    <div className="mb-3"><div className="fw-semibold small mb-1"><i className="bi bi-check2-circle text-success me-1" />Skills found</div><SkillTags skills={result.matched} variant="success" emptyText="No matching skills found" /></div>
                    <div className="mb-4"><div className="fw-semibold small mb-1"><i className="bi bi-x-circle text-danger me-1" />Skills missing</div><SkillTags skills={result.missing} variant="danger" emptyText="None. You cover every required skill." /></div>
                    <button className="btn btn-outline-primary" onClick={() => setResult(null)}>Apply to another role</button>
                  </div>
                ) : selected ? (
                  <div className="card-body p-4">
                    <h2 className="h4">{selected.title}</h2>
                    <p className="text-secondary small mb-3">{selected.department || "General"}, {selected.minExperience}+ years of experience</p>
                    {selected.description && <p style={{ whiteSpace: 'pre-line' }}>{selected.description}</p>}
                    <div className="mb-2"><div className="fw-semibold small mb-1">Required skills</div><SkillTags skills={selected.requiredSkills} variant="success" /></div>
                    {selected.preferredSkills?.length > 0 && <div className="mb-2"><div className="fw-semibold small mb-1">Nice to have</div><SkillTags skills={selected.preferredSkills} variant="secondary" /></div>}
                    <hr className="my-4" />
                    <h3 className="h6 mb-3">Apply for this role</h3>
                    <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>
                    <form onSubmit={submit} noValidate={false}>
                      <div className="row g-3 mb-3">
                        <div className="col-sm-6"><label className="form-label fw-semibold small" htmlFor="name">Full name *</label><input id="name" className="form-control" required minLength={2} maxLength={150} placeholder="Jane Doe" value={form.name} onChange={set('name')} disabled={submitting} /></div>
                        <div className="col-sm-6"><label className="form-label fw-semibold small" htmlFor="email">Email *</label><input id="email" type="email" className="form-control" required placeholder="jane@email.com" value={form.email} onChange={set('email')} disabled={submitting} /></div>
                        <div className="col-sm-6"><label className="form-label fw-semibold small" htmlFor="phone">Phone</label><input id="phone" type="tel" className="form-control" maxLength={30} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} disabled={submitting} /></div>
                        <div className="col-12"><label className="form-label fw-semibold small">Resume *</label><FileDropzone file={file} onChange={setFile} onError={setError} disabled={submitting} /></div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Analysing your resume…</> : <>Submit and get my match score</>}
                      </button>
                      {submitting && <div className="form-text mt-2">AI analysis can take up to a minute. Please keep this page open.</div>}
                    </form>
                  </div>
                ) : (
                  <EmptyState icon="bi-hand-index-thumb" title="Select a job">Choose a position from the list to read the details and apply.</EmptyState>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
