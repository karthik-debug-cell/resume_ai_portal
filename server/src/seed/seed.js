/**
 * Sample data: 5 jobs, 10 candidates, default admin.
 *   npm run seed          -> wipes jobs + candidates, upserts admin
 */
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { scoreResume } = require('../services/keywordScorer');

const jobs = [
  // The three jobs shipped in the original database.sql
  { title: 'Full Stack Developer', department: 'Engineering', description: 'We are looking for a skilled Full Stack Developer to join our team.', requiredSkills: ['PHP', 'JavaScript', 'MySQL', 'HTML', 'CSS'], preferredSkills: ['React', 'Laravel', 'Docker'], minExperience: 2, keywords: ['web', 'backend', 'frontend', 'api'] },
  { title: 'Data Analyst', department: 'Analytics', description: 'Analyze complex data sets to provide business insights.', requiredSkills: ['Python', 'SQL', 'Excel', 'Data Analysis'], preferredSkills: ['Tableau', 'Power BI', 'Machine Learning'], minExperience: 1, keywords: ['data', 'analytics', 'reports', 'statistics'] },
  { title: 'UI/UX Designer', department: 'Design', description: 'Create intuitive and beautiful user experiences.', requiredSkills: ['Figma', 'Adobe XD', 'CSS', 'HTML'], preferredSkills: ['React', 'Prototyping', 'User Research'], minExperience: 1, keywords: ['design', 'ui', 'ux', 'interface', 'wireframe'] },
  // Extra modern roles
  { title: 'MERN Stack Developer', department: 'Engineering', description: 'Build and ship features across our React front-end and Node.js/MongoDB back-end.', requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript'], preferredSkills: ['TypeScript', 'Docker', 'AWS', 'Redis'], minExperience: 3, keywords: ['rest', 'api', 'full stack', 'agile'] },
  { title: 'DevOps Engineer', department: 'Infrastructure', description: 'Own CI/CD, cloud infrastructure and reliability.', requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD'], preferredSkills: ['Terraform', 'Prometheus', 'Python'], minExperience: 4, keywords: ['infrastructure', 'monitoring', 'automation'], status: 'closed' },
];

const day = 24 * 3600 * 1000;
const candidates = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91 98765 43210', job: 'MERN Stack Developer', status: 'shortlisted', daysAgo: 1, text: 'Aarav Sharma – Full Stack Developer. 5 years of experience building web apps with React, Node.js, Express and MongoDB. Built REST API services, deployed with Docker on AWS. Strong JavaScript and TypeScript. Led an agile team of 4 and shipped a full stack SaaS product.' },
  { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '+91 91234 56780', job: 'Full Stack Developer', status: 'reviewed', daysAgo: 2, text: 'Priya Nair. 3 years of experience as a web developer. PHP, Laravel, MySQL and JavaScript. Maintained a legacy CMS and built a few admin dashboards.' },
  { name: 'Rahul Verma', email: 'rahul.verma@example.com', phone: '', job: 'Data Analyst', status: 'pending', daysAgo: 0, text: 'Rahul Verma – Data Analyst, 2 years of experience. Python, SQL and Excel for monthly reports and statistics. Dashboards in Tableau.' },
  { name: 'Sneha Kapoor', email: 'sneha.kapoor@example.com', phone: '+91 99887 76655', job: 'UI/UX Designer', status: 'shortlisted', daysAgo: 3, text: 'Sneha Kapoor – UI/UX Designer with 4 years of experience. Figma, Adobe XD, wireframe and prototyping, user research. HTML and CSS for handoff. Interface design for fintech.' },
  { name: 'Daniel Brooks', email: 'daniel.brooks@example.com', phone: '+1 415 555 0142', job: 'MERN Stack Developer', status: 'pending', daysAgo: 0, text: 'Daniel Brooks. Junior developer, 1 year of experience. JavaScript and some React. Built a small Express app. Learning MongoDB.' },
  { name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '', job: 'Data Analyst', status: 'rejected', daysAgo: 6, text: 'Meera Iyer – Marketing coordinator. Experienced with social media campaigns and content calendars. Basic Excel for budgeting.' },
  { name: 'Kenji Tanaka', email: 'kenji.tanaka@example.com', phone: '+81 90 1234 5678', job: 'Full Stack Developer', status: 'pending', daysAgo: 4, text: 'Kenji Tanaka – Software engineer, 6 years of experience. JavaScript, PHP, MySQL, HTML, CSS, REST api design, backend and frontend. Docker and Laravel in production.' },
  { name: 'Olivia Martin', email: 'olivia.martin@example.com', phone: '+44 7700 900123', job: 'UI/UX Designer', status: 'reviewed', daysAgo: 8, text: 'Olivia Martin, product designer. 2 years of experience. Figma, prototyping, wireframes, CSS. No Adobe XD.' },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 90000 11122', job: 'MERN Stack Developer', status: 'reviewed', daysAgo: 10, text: 'Vikram Singh – 4 years of experience. React, Node.js, Express, MongoDB, JavaScript, REST api. Redis caching, some AWS. Agile full stack delivery.' },
  { name: 'Laura Fischer', email: 'laura.fischer@example.com', phone: '', job: 'Data Analyst', status: 'pending', daysAgo: 12, text: 'Laura Fischer – 3 years of experience. SQL and Excel reporting, Power BI dashboards, statistics for the finance team.' },
];

(async () => {
  await connectDB();

  await Admin.findOneAndUpdate({ username: 'admin' }, { $setOnInsert: { username: 'admin', email: 'admin@portal.com' } }, { upsert: true });
  const admin = await Admin.findOne({ username: 'admin' }).select('+password');
  if (!admin.password) {
    admin.password = 'admin123'; // same default as the PHP app – CHANGE IT after first login
    await admin.save();
  }

  await Promise.all([Job.deleteMany({}), Candidate.deleteMany({})]);
  const createdJobs = await Job.insertMany(jobs);
  const byTitle = Object.fromEntries(createdJobs.map((j) => [j.title, j]));

  const docs = candidates.map((c) => {
    const job = byTitle[c.job];
    const r = scoreResume(c.text, job);
    const when = new Date(Date.now() - c.daysAgo * day - Math.floor(Math.random() * 6) * 3600 * 1000);
    return {
      name: c.name, email: c.email, phone: c.phone, job: job._id, status: c.status,
      resumeText: c.text, submittedAt: when, updatedAt: when,
      matchScore: r.matchScore, matchedSkills: r.matchedSkills, missingSkills: r.missingSkills,
      analysis: { summary: r.summary, strengths: r.strengths, weaknesses: r.weaknesses, experienceYears: r.experienceYears, experienceMeetsRequirement: r.experienceMeetsRequirement, recommendation: r.recommendation, source: 'seed', model: null, analyzedAt: when },
    };
  });
  await Candidate.collection.insertMany(docs); // raw insert so custom submittedAt timestamps are kept

  console.log(`Seeded ${createdJobs.length} jobs, ${docs.length} candidates. Admin login: admin / admin123`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
