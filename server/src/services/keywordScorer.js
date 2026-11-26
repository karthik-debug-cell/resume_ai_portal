/**
 * Deterministic keyword scorer – a direct port of PHP scoreResume()/skillFoundInText().
 * Used (a) as a fallback when the AI is unavailable and (b) so the app works with no API key.
 *
 * score = required% * 60 + preferred% * 25 + keywords% * 15 + 5 (if resume claims >= min years)
 */
const { escapeRegex } = require('../utils/helpers');

const ALIASES = {
  javascript: ['js'],
  typescript: ['ts'],
  python: ['py'],
  postgresql: ['postgres', 'pg'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'user interface': ['ui'],
  'user experience': ['ux'],
  'cascading style sheets': ['css'],
  'hypertext markup language': ['html'],
  'structured query language': ['sql'],
};

const wordRegex = (term) => new RegExp(`(^|[^a-z0-9+#])${escapeRegex(term)}($|[^a-z0-9+#])`, 'i');

function skillFoundInText(skill, text) {
  // Very short skills ("c", "r", "go") must match as whole words to avoid false hits
  if (skill.length <= 3 ? wordRegex(skill).test(text) : text.includes(skill)) return true;

  for (const [full, shorts] of Object.entries(ALIASES)) {
    if (skill === full && shorts.some((s) => wordRegex(s).test(text))) return true;
    if (shorts.includes(skill) && text.includes(full)) return true;
  }
  return false;
}

function detectExperienceYears(text) {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*years?\s*(?:of)?\s*(?:experience)?/gi)].map((m) => parseInt(m[1], 10));
  return matches.length ? Math.max(...matches) : null;
}

function scoreResume(resumeText, job) {
  const text = String(resumeText || '').toLowerCase();
  const lc = (arr) => (arr || []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const required = lc(job.requiredSkills);
  const preferred = lc(job.preferredSkills);
  const keywords = lc(job.keywords);

  const matched = [];
  const missing = [];
  required.forEach((s) => (skillFoundInText(s, text) ? matched.push(s) : missing.push(s)));
  const reqRatio = required.length ? (required.length - missing.length) / required.length : 0;

  let prefMatched = 0;
  preferred.forEach((s) => {
    if (skillFoundInText(s, text)) {
      matched.push(`${s} (preferred)`);
      prefMatched += 1;
    }
  });
  const prefRatio = preferred.length ? prefMatched / preferred.length : 0;

  const kwMatched = keywords.filter((k) => text.includes(k)).length;
  const kwRatio = keywords.length ? kwMatched / keywords.length : 0;

  const years = detectExperienceYears(text);
  const meetsExp = job.minExperience > 0 ? years !== null && years >= job.minExperience : null;
  const expBonus = meetsExp ? 5 : 0;

  const score = Math.min(100, Math.round((reqRatio * 60 + prefRatio * 25 + kwRatio * 15 + expBonus) * 100) / 100);

  const recommendation = score >= 80 ? 'strong_match' : score >= 60 ? 'good_match' : score >= 40 ? 'partial_match' : 'weak_match';

  return {
    matchScore: score,
    matchedSkills: [...new Set(matched)],
    missingSkills: [...new Set(missing)],
    summary: `Keyword analysis: ${required.length - missing.length} of ${required.length} required skills found.`,
    strengths: matched.slice(0, 5).map((s) => `Mentions ${s}`),
    weaknesses: missing.slice(0, 5).map((s) => `No evidence of ${s}`),
    experienceYears: years,
    experienceMeetsRequirement: meetsExp,
    recommendation,
    source: 'keyword-fallback',
    model: null,
  };
}

module.exports = { scoreResume, skillFoundInText };
