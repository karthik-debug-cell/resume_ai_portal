# ResumeAI Portal: MERN edition

AI-powered resume screening, migrated from the original PHP/MySQL project to **React + Express + MongoDB**, with OpenRouter for the AI analysis.

Candidates browse open jobs and upload a resume (PDF, DOCX, TXT). The server extracts the text, an LLM compares it with the job requirements, and the candidate instantly sees a match score with matched and missing skills. Recruiters manage jobs and candidates from an admin dashboard.

```
resume-ai-mern/
├── server/   Express API, Mongoose models, AI service, seed script, unit tests
├── client/   React (Vite) SPA, React Router, Bootstrap 5, Axios
├── docs/API.md
└── docker-compose.yml   (optional local MongoDB)
```

## Requirements
- Node.js 18 or newer (tested on 22)
- MongoDB 6/7 (local, Docker or Atlas, see below)
- An OpenRouter API key (optional: without it the app falls back to the built-in keyword scorer)

## 1. MongoDB setup (pick one)

**Docker (easiest)**
```bash
docker compose up -d          # MongoDB on mongodb://127.0.0.1:27017
```
**Local install** – install MongoDB Community Edition from mongodb.com, start the service (`mongod` or `brew services start mongodb-community`, `sudo systemctl start mongod`). Collections are created automatically; no manual schema is needed.

**MongoDB Atlas** – create a free cluster, add a database user, allow your IP under *Network Access*, then copy the connection string into `MONGODB_URI` (include the database name, e.g. `.../resume_portal?retryWrites=true&w=majority`).

## 2. Install and configure
```bash
npm run install:all                      # installs server/ and client/
cp server/.env.example server/.env       # then edit it
```
Required in `server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `OPENrouter_API_KEY` | OpenRouter key, **server side only** (`OPENROUTER_API_KEY` also works) |
| `OPENROUTER_MODEL` | any OpenRouter model id, default `openai/gpt-4o-mini` |
| `ADMIN_INVITE_CODE` | needed to register further admins once the first exists |
| `CLIENT_ORIGIN` | allowed browser origin(s), default `http://localhost:5173` |

`client/.env.example` only has `VITE_API_URL`, which stays empty in development because Vite proxies `/api` to the server.

## 3. Seed sample data
```bash
npm run seed
```
Creates 5 jobs (the 3 from the PHP app plus 2 new ones), 10 sample candidates with analyses, and the admin **admin / admin123** (same default as the PHP app, **change it**). Re-running wipes jobs and candidates.

## 4. Run
```bash
npm run dev:server     # terminal 1 → http://localhost:5000
npm run dev:client     # terminal 2 → http://localhost:5173
```
- Public job board: http://localhost:5173
- Admin: http://localhost:5173/admin/login

Production: `npm run build:client` produces `client/dist` (serve it with any static host and set `VITE_API_URL` at build time); run the API with `NODE_ENV=production npm start --prefix server`.

Tests: `npm test` (scoring and AI-output validation, no database needed).

## How the AI analysis works
`server/src/services/aiService.js` is the only file that touches the key.
1. A structured **system prompt** tells the model to act as a screening engine, treat the resume as untrusted data (prompt-injection guard), cite only evidence, and return exactly one JSON object.
2. The reply is parsed (fences and stray prose tolerated) and **validated with Zod**: score clamped to 0–100, lists coerced, recommendation checked against an enum. Invalid output is retried once (second attempt without `response_format`, which some models reject).
3. If the key is missing, the provider fails, or the output is invalid, `analysisService` falls back to the deterministic keyword scorer ported from the PHP `screening.php`, so an application is never lost. Each candidate records `analysis.source` (`ai` or `keyword-fallback`) and the model used.

Stored per candidate: `matchScore`, `matchedSkills`, `missingSkills`, and `analysis` (summary, strengths, weaknesses, experience years, recommendation).

## PHP → MERN migration map

| PHP | MERN |
|---|---|
| `index.php` | `client/src/pages/public/JobBoardPage.jsx` + `publicController` |
| `admin/login.php`, `logout.php` | `LoginPage`, `RegisterPage` + `authController` (JWT) |
| `admin/dashboard.php` | `DashboardPage` (analytics) + `CandidatesPage` (table, filters) + `dashboardController`, `candidateController` |
| `admin/view_candidate.php` | `CandidateDetailPage` |
| `admin/jobs.php` | `AdminJobsPage` + `jobController` |
| `includes/auth.php` | `middleware/auth.js`, `<RequireAdmin>` |
| `includes/screening.php` | `resumeParser.js`, `keywordScorer.js`, `aiService.js`, `analysisService.js` |
| `includes/config.php` | `config/env.js`, `config/db.js`, `.env` |
| MySQL `admin_users` / `jobs` / `candidates` | Mongoose `Admin` / `Job` / `Candidate` |

Data model notes: comma-separated skill columns became string arrays; `ON DELETE SET NULL` on `candidates.job_id` is reproduced in `deleteJob`; bcryptjs verifies PHP `$2y$` hashes, so existing admin hashes can be copied across unchanged.

### Behaviour changes (deliberate)
- **`.doc` is no longer accepted.** Legacy binary Word cannot be parsed reliably; the spec asked for PDF/DOCX/TXT. Uploads are checked by extension, MIME type and file signature.
- Resumes are **not publicly served**; recruiters download them through an authenticated endpoint.
- Admin registration is open only for the **first** admin; afterwards an invite code is required.
- Applying to a **closed** job is rejected.
- Short skills like "C" or "R" match whole words only in the keyword fallback (the PHP substring match produced false hits).
- Candidate list is paginated; re-run analysis and candidate delete were added.

## Security notes
Helmet, CORS allow-list, rate limits on login/register and applying, bcrypt (cost 12), JWT (HS256, expiry), random upload filenames, size limit, Zod validation on every input, generic login errors, API key never leaves the server. Change the seeded admin password and `JWT_SECRET` before deploying.

## Troubleshooting
- *"MongoDB connection failed"*: MongoDB is not running or `MONGODB_URI` is wrong.
- *Scores show "Keyword-based analysis"*: no API key set, or the provider call failed (check the server log).
- *Scanned PDF rejected*: image-only PDFs contain no text; ask for a text-based PDF, DOCX or TXT.

API reference: [docs/API.md](docs/API.md)
