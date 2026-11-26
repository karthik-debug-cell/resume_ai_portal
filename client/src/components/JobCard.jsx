import SkillTags from './SkillTags';

// Used on the public listing (selectable) and on the admin Jobs page (with actions)
export default function JobCard({ job, active, onSelect, footer, showStatus, count }) {
  const Wrapper = onSelect ? 'button' : 'div';
  return (
    <Wrapper
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      className={`ra-job-card card ra-card w-100 text-start ${onSelect ? 'is-clickable' : ''} ${active ? 'is-active' : ''}`}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="h6 mb-0 text-body">{job.title}</h3>
            <div className="text-secondary small">{job.department || 'General'}</div>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            <span className="badge text-bg-primary bg-opacity-10 text-primary-emphasis border border-primary-subtle text-nowrap">{job.minExperience}+ yrs</span>
            {showStatus && <span className={`badge ${job.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'} bg-opacity-25 text-${job.status === 'active' ? 'success' : 'secondary'}-emphasis`}>{job.status === 'active' ? 'Active' : 'Closed'}</span>}
          </div>
        </div>
        <SkillTags skills={job.requiredSkills} limit={4} variant="secondary" />
        {count !== undefined && <div className="text-secondary small mt-2"><i className="bi bi-people me-1" />{count} {count === 1 ? 'application' : 'applications'}</div>}
      </div>
      {footer && <div className="card-footer bg-transparent d-flex gap-2" onClick={(e) => e.stopPropagation()}>{footer}</div>}
    </Wrapper>
  );
}
