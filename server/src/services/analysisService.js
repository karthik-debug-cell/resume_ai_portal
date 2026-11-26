const { analyzeResume, isAIConfigured } = require('./aiService');
const { scoreResume } = require('./keywordScorer');

/**
 * Orchestrates screening: AI first, deterministic keyword scorer if AI is not configured or fails.
 * Never throws – an application must not be lost because a third-party API is down.
 */
async function screenResume(resumeText, job) {
  if (!job) {
    return { matchScore: 0, matchedSkills: [], missingSkills: [], summary: '', strengths: [], weaknesses: [], experienceYears: null, experienceMeetsRequirement: null, recommendation: 'weak_match', source: 'keyword-fallback', model: null };
  }
  if (isAIConfigured()) {
    try {
      return await analyzeResume(resumeText, job);
    } catch (err) {
      console.warn(`[screening] ${err.message} – using keyword fallback`);
    }
  }
  return scoreResume(resumeText, job);
}

// Shape stored on the Candidate document
function toCandidateFields(result) {
  return {
    matchScore: result.matchScore,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    analysis: {
      summary: result.summary,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      experienceYears: result.experienceYears,
      experienceMeetsRequirement: result.experienceMeetsRequirement,
      recommendation: result.recommendation,
      source: result.source,
      model: result.model,
      analyzedAt: new Date(),
    },
  };
}

module.exports = { screenResume, toCandidateFields };
