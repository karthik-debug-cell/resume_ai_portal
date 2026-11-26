const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "PHP, MySQL , JavaScript" | ["PHP","MySQL"]  ->  ["PHP","MySQL","JavaScript"]  (trimmed, de-duplicated, case-insensitive)
function toList(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const v = String(item).trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}

const round1 = (n) => Math.round(n * 10) / 10;

module.exports = { escapeRegex, toList, round1 };
