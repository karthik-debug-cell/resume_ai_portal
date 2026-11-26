import { useRef, useState } from 'react';
import { ALLOWED_EXT, MAX_FILE_MB } from '../utils/format';

// Resume upload interface: drag & drop or click, with client-side type/size checks (the server re-validates)
export default function FileDropzone({ file, onChange, onError, disabled }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const accept = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return onError(`Invalid file type. Allowed: ${ALLOWED_EXT.join(', ').toUpperCase()}`);
    if (f.size > MAX_FILE_MB * 1024 * 1024) return onError(`File too large. Max ${MAX_FILE_MB}MB.`);
    onError('');
    onChange(f);
  };

  return (
    <div
      className={`ra-dropzone rounded-3 p-4 text-center ${over ? 'is-over' : ''} ${file ? 'has-file' : ''} ${disabled ? 'opacity-50' : ''}`}
      role="button" tabIndex={0} aria-label="Upload resume"
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); !disabled && accept(e.dataTransfer.files?.[0]); }}
    >
      <input ref={input} type="file" hidden accept=".pdf,.docx,.txt" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }} />
      {file ? (
        <div className="d-flex align-items-center justify-content-center gap-3">
          <i className="bi bi-file-earmark-check-fill fs-2 text-success" />
          <div className="text-start">
            <div className="fw-semibold text-break">{file.name}</div>
            <small className="text-secondary">{(file.size / 1024).toFixed(0)} KB</small>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(null); }}>Remove</button>
        </div>
      ) : (
        <>
          <i className="bi bi-cloud-arrow-up fs-1 text-primary d-block mb-1" />
          <div className="fw-semibold">Drop your resume here or <span className="text-primary text-decoration-underline">browse</span></div>
          <small className="text-secondary">PDF, DOCX or TXT, up to {MAX_FILE_MB}MB</small>
        </>
      )}
    </div>
  );
}
