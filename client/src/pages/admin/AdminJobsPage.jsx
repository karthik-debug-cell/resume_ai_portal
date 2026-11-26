import { useEffect, useState } from 'react';
import { jobsApi } from '../../api';
import { errorMessage } from '../../api/client';
import AlertMessage from '../../components/AlertMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import JobCard from '../../components/JobCard';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { csv } from '../../utils/format';

const blank = { title: '', department: '', description: '', requiredSkills: '', preferredSkills: '', minExperience: 0, keywords: '', status: 'active' };

function JobFormModal({ job, onClose, onSaved }) {
  const editing = Boolean(job);
  const [form, setForm] = useState(editing ? { ...job, requiredSkills: csv(job.requiredSkills), preferredSkills: csv(job.preferredSkills), keywords: csv(job.keywords) } : blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { id, createdAt, updatedAt, applicationCount, ...payload } = form; // eslint-disable-line no-unused-vars
    try {
      const res = editing ? await jobsApi.update(job.id, payload) : await jobsApi.create(payload);
      onSaved(res.message);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit job' : 'Add new job'}
      onClose={busy ? () => {} : onClose}
      footer={<><button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" form="job-form" disabled={busy}>{busy && <span className="spinner-border spinner-border-sm me-2" />}{editing ? 'Update job' : 'Add job'}</button></>}
    >
      <AlertMessage>{error}</AlertMessage>
      <form id="job-form" onSubmit={submit} className="row g-3">
        <div className="col-md-6"><label className="form-label fw-semibold small" htmlFor="jt">Job title *</label><input id="jt" className="form-control" required minLength={2} maxLength={200} value={form.title} onChange={set('title')} /></div>
        <div className="col-md-6"><label className="form-label fw-semibold small" htmlFor="jd">Department</label><input id="jd" className="form-control" maxLength={100} value={form.department} onChange={set('department')} /></div>
        <div className="col-12"><label className="form-label fw-semibold small" htmlFor="jdesc">Description</label><textarea id="jdesc" className="form-control" rows={3} maxLength={5000} value={form.description} onChange={set('description')} /></div>
        <div className="col-12"><label className="form-label fw-semibold small" htmlFor="jr">Required skills *</label><input id="jr" className="form-control" required placeholder="React, Node.js, MongoDB" value={form.requiredSkills} onChange={set('requiredSkills')} /><div className="form-text">Separate skills with commas.</div></div>
        <div className="col-12"><label className="form-label fw-semibold small" htmlFor="jp">Preferred skills</label><input id="jp" className="form-control" placeholder="TypeScript, Docker" value={form.preferredSkills} onChange={set('preferredSkills')} /></div>
        <div className="col-md-4"><label className="form-label fw-semibold small" htmlFor="je">Min. experience (years)</label><input id="je" type="number" min={0} max={60} className="form-control" value={form.minExperience} onChange={set('minExperience')} /></div>
        <div className="col-md-5"><label className="form-label fw-semibold small" htmlFor="jk">Keywords</label><input id="jk" className="form-control" placeholder="api, backend, web" value={form.keywords} onChange={set('keywords')} /></div>
        <div className="col-md-3"><label className="form-label fw-semibold small" htmlFor="js">Status</label><select id="js" className="form-select" value={form.status} onChange={set('status')}><option value="active">Active</option><option value="closed">Closed</option></select></div>
      </form>
    </Modal>
  );
}

// Replaces jobs.php: create, edit, delete with application counts
export default function AdminJobsPage() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | job
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => jobsApi.list().then((r) => setJobs(r.data)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const saved = (msg) => { setEditing(null); setNotice(msg); load(); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await jobsApi.remove(toDelete.id);
      setNotice('Job deleted.');
      setToDelete(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h1 className="h3 mb-0">Jobs</h1><p className="text-secondary mb-0">Manage open and closed positions</p></div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><i className="bi bi-plus-lg me-1" />New job</button>
      </div>
      <AlertMessage onClose={() => setError('')}>{error}</AlertMessage>
      <AlertMessage type="success" onClose={() => setNotice('')}>{notice}</AlertMessage>

      {!jobs ? <Loader label="Loading jobs…" /> : jobs.length === 0 ? (
        <div className="card ra-card"><EmptyState icon="bi-briefcase" title="No jobs yet" action={<button className="btn btn-primary" onClick={() => setEditing('new')}>Create your first job</button>}>Add a job to start receiving applications.</EmptyState></div>
      ) : (
        <div className="row g-3">
          {jobs.map((j) => (
            <div className="col-md-6 col-xl-4" key={j.id}>
              <JobCard
                job={j} showStatus count={j.applicationCount}
                footer={<><button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(j)}><i className="bi bi-pencil me-1" />Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => setToDelete(j)}><i className="bi bi-trash me-1" />Delete</button></>}
              />
            </div>
          ))}
        </div>
      )}

      {editing && <JobFormModal job={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}
      {toDelete && <ConfirmDialog title="Delete job" message={`Delete “${toDelete.title}”? Its ${toDelete.applicationCount} application(s) will be kept but no longer linked to a job.`} busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}
    </>
  );
}
