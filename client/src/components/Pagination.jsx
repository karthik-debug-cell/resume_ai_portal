export default function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2 border-top">
      <small className="text-secondary">Showing {from}–{to} of {total}</small>
      {pages > 1 && (
        <nav aria-label="Pagination">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page - 1)}>Previous</button></li>
            <li className="page-item disabled"><span className="page-link">{page} / {pages}</span></li>
            <li className={`page-item ${page >= pages ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page + 1)}>Next</button></li>
          </ul>
        </nav>
      )}
    </div>
  );
}
