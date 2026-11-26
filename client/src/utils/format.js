export const STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected'];

export const STATUS_META = {
  pending: { label: 'Pending', color: 'warning', icon: 'bi-hourglass-split' },
  reviewed: { label: 'Reviewed', color: 'info', icon: 'bi-eye' },
  shortlisted: { label: 'Shortlisted', color: 'success', icon: 'bi-star-fill' },
  rejected: { label: 'Rejected', color: 'danger', icon: 'bi-x-circle' },
};

export const RECOMMENDATION_META = {
  strong_match: { label: 'Strong match', color: 'success' },
  good_match: { label: 'Good match', color: 'primary' },
  partial_match: { label: 'Partial match', color: 'warning' },
  weak_match: { label: 'Weak match', color: 'danger' },
};

// Same thresholds as the original PHP UI: >=70 good, >=40 ok, otherwise low
export const scoreTone = (score) => (score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger');

export const formatDate = (d, withTime = false) =>
  d
    ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime && { hour: '2-digit', minute: '2-digit' }) })
    : '-';

export const formatScore = (n) => `${Number.isInteger(n) ? n : Number(n).toFixed(1)}%`;

export const csv = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');

export const ALLOWED_EXT = ['pdf', 'docx', 'txt'];
export const MAX_FILE_MB = 5;
