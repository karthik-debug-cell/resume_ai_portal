import api from './client';

const unwrap = (p) => p.then((r) => r.data);

export const authApi = {
  setupStatus: () => unwrap(api.get('/auth/setup-status')),
  login: (body) => unwrap(api.post('/auth/login', body)),
  register: (body) => unwrap(api.post('/auth/register', body)),
  me: () => unwrap(api.get('/auth/me')),
};

export const publicApi = {
  jobs: () => unwrap(api.get('/public/jobs')),
  stats: () => unwrap(api.get('/public/stats')),
  apply: (formData) => unwrap(api.post('/public/apply', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
};

export const jobsApi = {
  list: () => unwrap(api.get('/jobs')),
  create: (body) => unwrap(api.post('/jobs', body)),
  update: (id, body) => unwrap(api.put(`/jobs/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/jobs/${id}`)),
};

export const candidatesApi = {
  list: (params) => unwrap(api.get('/candidates', { params })),
  get: (id) => unwrap(api.get(`/candidates/${id}`)),
  setStatus: (id, status) => unwrap(api.patch(`/candidates/${id}/status`, { status })),
  reanalyze: (id) => unwrap(api.post(`/candidates/${id}/reanalyze`)),
  remove: (id) => unwrap(api.delete(`/candidates/${id}`)),
  // Authenticated download: the file endpoint needs the JWT, so fetch as a blob and save it
  async downloadResume(id, fallbackName = 'resume') {
    const res = await api.get(`/candidates/${id}/resume`, { responseType: 'blob' });
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(res.headers['content-disposition'] || '');
    const name = match ? decodeURIComponent(match[1]) : fallbackName;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const dashboardApi = { stats: () => unwrap(api.get('/dashboard/stats')) };
