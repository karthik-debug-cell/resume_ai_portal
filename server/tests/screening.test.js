// Run: npm test   (no database or network required)
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1';

const test = require('node:test');
const assert = require('node:assert');
const { scoreResume, skillFoundInText } = require('../src/services/keywordScorer');
const { aiResultSchema, extractJson } = require('../src/services/aiService');
const { toList } = require('../src/utils/helpers');

const job = { requiredSkills: ['PHP', 'JavaScript', 'MySQL'], preferredSkills: ['React', 'Docker'], keywords: ['web', 'api'], minExperience: 2 };

test('keyword scorer matches the original PHP formula', () => {
  // required 3/3 -> 60, preferred 1/2 -> 12.5, keywords 2/2 -> 15, experience bonus 5  => 92.5
  const r = scoreResume('Web developer, 3 years of experience. PHP, JS and MySQL APIs. React.', job);
  assert.strictEqual(r.matchScore, 92.5);
  assert.deepStrictEqual(r.missingSkills, []);
  assert.ok(r.matchedSkills.includes('react (preferred)'));
});

test('missing skills are reported and score is capped at 100', () => {
  const r = scoreResume('I know PHP only.', job);
  assert.deepStrictEqual(r.missingSkills, ['javascript', 'mysql']);
  assert.ok(r.matchScore <= 100 && r.matchScore >= 0);
});

test('aliases and short skills use word boundaries', () => {
  assert.ok(skillFoundInText('javascript', 'wrote js daily'));
  assert.ok(!skillFoundInText('c', 'javascript only'));
  assert.ok(skillFoundInText('c', 'c and c++'));
});

test('AI output is validated, clamped and defaulted', () => {
  const out = aiResultSchema.parse({ matchScore: '150', matchedSkills: ['A', 5], missingSkills: null, summary: 's', strengths: 'x', experienceYears: '4', experienceMeetsRequirement: 'yes', recommendation: 'amazing' });
  assert.strictEqual(out.matchScore, 100);
  assert.deepStrictEqual(out.matchedSkills, ['A', '5']);
  assert.deepStrictEqual(out.missingSkills, []);
  assert.strictEqual(out.experienceYears, 4);
  assert.strictEqual(out.experienceMeetsRequirement, null);
  assert.strictEqual(out.recommendation, 'partial_match');
});

test('AI output without a score is rejected', () => {
  assert.throws(() => aiResultSchema.parse({ matchedSkills: [] }));
});

test('extractJson tolerates fences and surrounding prose', () => {
  assert.deepStrictEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepStrictEqual(extractJson('Here you go: {"a":2} hope it helps'), { a: 2 });
  assert.throws(() => extractJson('no json'));
});

test('toList normalises comma strings and arrays', () => {
  assert.deepStrictEqual(toList(' PHP, MySQL ,php,, '), ['PHP', 'MySQL']);
  assert.deepStrictEqual(toList(['a', ' b ', 'A']), ['a', 'b']);
});
