import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { candidatesApi } from '../../api';
import { errorMessage } from '../../api/client';
import AlertMessage from '../../components/AlertMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import ScoreRing from '../../components/ScoreRing';
import SkillTags from '../../components/SkillTags';
import StatusSelect from '../../components/StatusSelect';
import { RECOMMENDATION_META, formatDate } from '../../utils/format';

// Replaces view_candidate.php and adds the full AI analysis
export default function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setC(null);
    candidatesApi.get(id).then((r) => setC(r.data)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const run = async (key, fn) => {
    setBusy(key); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(''); }
  };

  const changeStatus = (status) => run('status', async () => {
    const r = await candidatesApi.setStatus(id, status);
    setC((prev) => ({ ...prev, status: r.data.status }));
    setNotice('Status updated.');
  });
  const reanalyze = () => run('analyze', async () => { const r = await candidatesApi.reanalyze(id); setC(r.data); setNotice('Analysis refreshed.'); });
  const download = () => run('download', () => candidatesApi.downloadResume(id, c.resumeOriginalName || 'resume'));
  const remove = () => run('delete', async () => { await candidatesApi.remove(id); navigate('/admin/candidates', { replace: true }); });

  if (!c) return error ? (<><AlertMessage>{error}</AlertMessage><Link to="/admin/candidates" className="btn btn-outline-secondary">Back to candidates</Link></>) : <Loader label="Loading candidate…" />;

  const a = c.analysis || {};
  const rec = RECOMMENDATION_META[a.recommendation];
  const text = c.resumeText || '';
  const PREVIEW = 2000;
  const isAI = a.source === 'ai';

  return (
    <>
      <Link to="/admin/candidates" className="text-decoration-none small"><i className="bi bi-arrow-left me-1" />All candidates</Link>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 my-3">
        <div>
          <h1 className="h3 mb-1">{c.name}</h1>
          <div className="text-secondary">{c.job ? <>Applied for <strong className="text-body">{c.job.title}</strong></> : 'No job linked (the job was deleted)'}</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {c.hasResumeFile && <button className="btn btn-primary" onClick={download} disabled={busy === 'download'}><i className="bi bi-download me-2" />Download resume</button>}
          <button className="btn btn-outline-primary" onClick={reanalyze} disabled={busy === 'analyze' || !c.job || !text}>{busy === 'analyze' ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-arrow-repeat me-2" />}Re-run analysis</button>
          <button className="btn btn-outline-danger" onClick={() => setConfirmDelete(true)}><i className="bi bi-trash" /><span className="visually-hidden">Delete candidate</span></button>
        </div>
      </div>

      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>
      <AlertMessage type="success" onClose={() => setNotice('')}>{notice}</AlertMessage>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card ra-card mb-3"><div className="card-body p-4">
            <div className="d-flex flex-column flex-sm-row gap-4 align-items-sm-center">
              <ScoreRing score={c.matchScore} size={150} stroke={12} />
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <h2 className="h5 mb-0">AI match analysis</h2>
                  {rec && <span className={`badge text-bg-${rec.color}`}>{rec.label}</span>}
                </div>
                <p className="mb-2">{a.summary || 'No summary available for this candidate.'}</p>
                <div className="small text-secondary">
                  {isAI ? <><i className="bi bi-stars me-1" />Analysed by AI ({a.model})</> : <><i className="bi bi-list-check me-1" />{a.source === 'seed' ? 'Sample data' : 'Keyword-based analysis'}</>}
                  {a.analyzedAt && `, ${formatDate(a.analyzedAt, true)}`}
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="row g-4">
              <div className="col-md-6"><h3 className="h6"><i className="bi bi-check2-circle text-success me-1" />Matched skills ({c.matchedSkills.length})</h3><SkillTags skills={c.matchedSkills} variant="success" emptyText="No required skills were found." /></div>
              <div className="col-md-6"><h3 className="h6"><i className="bi bi-x-circle text-danger me-1" />Missing skills ({c.missingSkills.length})</h3><SkillTags skills={c.missingSkills} variant="danger" emptyText="No missing skills." /></div>
              <div className="col-md-6"><h3 className="h6">Strengths</h3>{a.strengths?.length ? <ul className="small ps-3 mb-0">{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <span className="small text-secondary">None recorded</span>}</div>
              <div className="col-md-6"><h3 className="h6">Gaps and concerns</h3>{a.weaknesses?.length ? <ul className="small ps-3 mb-0">{a.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul> : <span className="small text-secondary">None recorded</span>}</div>
            </div>
            {(a.experienceYears !== null && a.experienceYears !== undefined) || c.job?.minExperience ? (
              <div className="mt-4 small d-flex flex-wrap gap-3">
                <span><i className="bi bi-clock-history me-1" />Experience found: <strong>{a.experienceYears ?? 'not stated'}{a.experienceYears != null ? ' years' : ''}</strong></span>
                {c.job?.minExperience > 0 && <span>Required: <strong>{c.job.minExperience}+ years</strong>{a.experienceMeetsRequirement === true && <i className="bi bi-check-circle-fill text-success ms-1" title="Meets requirement" />}{a.experienceMeetsRequirement === false && <i className="bi bi-exclamation-circle-fill text-warning ms-1" title="Below requirement" />}</span>}
              </div>
            ) : null}
          </div></div>

          <div className="card ra-card"><div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 mb-0">Resume text</h2>
              {text.length > PREVIEW && <button className="btn btn-sm btn-link" onClick={() => setShowFull((s) => !s)}>{showFull ? 'Show less' : `Show all (${text.length.toLocaleString()} characters)`}</button>}
            </div>
            {text ? <pre className="ra-resume-text mb-0">{showFull ? text : text.slice(0, PREVIEW)}{!showFull && text.length > PREVIEW && '\n…[truncated]'}</pre> : <p className="text-secondary small mb-0">No text could be extracted from this resume.</p>}
          </div></div>
        </div>

        <div className="col-lg-4">
          <div className="card ra-card mb-3"><div className="card-body">
            <h2 className="h6 mb-3">Candidate status</h2>
            <StatusSelect value={c.status} onChange={changeStatus} disabled={busy === 'status'} size="md" />
          </div></div>
          <div className="card ra-card"><div className="card-body">
            <h2 className="h6 mb-3">Contact and details</h2>
            <dl className="mb-0 small">
              <dt className="text-secondary fw-medium">Email</dt><dd><a href={`mailto:${c.email}`} className="text-decoration-none">{c.email}</a></dd>
              <dt className="text-secondary fw-medium">Phone</dt><dd>{c.phone || '-'}</dd>
              <dt className="text-secondary fw-medium">Applied</dt><dd>{formatDate(c.submittedAt, true)}</dd>
              <dt className="text-secondary fw-medium">Resume file</dt><dd className="mb-0 text-break">{c.hasResumeFile ? c.resumeOriginalName : 'No file stored'}</dd>
            </dl>
          </div></div>
          {c.job && (
            <div className="card ra-card mt-3"><div className="card-body">
              <h2 className="h6 mb-2">Job requirements</h2>
              <div className="small text-secondary mb-1">Required</div><SkillTags skills={c.job.requiredSkills} variant="secondary" />
              {c.job.preferredSkills?.length > 0 && <><div className="small text-secondary mt-3 mb-1">Preferred</div><SkillTags skills={c.job.preferredSkills} variant="secondary" /></>}
            </div></div>
          )}
        </div>
      </div>

      {confirmDelete && <ConfirmDialog title="Delete candidate" message={`Delete ${c.name} and the stored resume file? This cannot be undone.`} busy={busy === 'delete'} onConfirm={remove} onCancel={() => setConfirmDelete(false)} />}
    </>
  );
}
