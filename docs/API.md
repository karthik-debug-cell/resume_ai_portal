# API reference

Base URL `http://localhost:5000/api`. All responses are JSON: `{ "success": true, "data": … }` or
`{ "success": false, "message": "…", "errors": [{ "field", "message" }] }`.
Admin endpoints need `Authorization: Bearer <token>`.

Status codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `422` unreadable resume, `429` rate limit, `503` AI not configured.

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/auth/setup-status` | – | `{ hasAdmin }` |
| POST | `/auth/register` | `username`, `password` (min 8), `email?`, `inviteCode?` | Open only while no admin exists; then `inviteCode` must equal `ADMIN_INVITE_CODE`. Returns `{ token, admin }` |
| POST | `/auth/login` | `username`, `password` | Returns `{ token, admin }` |
| GET | `/auth/me` | – | Current admin |

## Public
| Method | Path | Description |
|---|---|---|
| GET | `/public/jobs` | Active jobs |
| GET | `/public/jobs/:id` | One active job |
| GET | `/public/stats` | `{ openRoles, applicants, shortlisted }` |
| POST | `/public/apply` | `multipart/form-data`: `name`, `email`, `phone?`, `jobId`, `resume` (PDF/DOCX/TXT, ≤ 5 MB). Returns `{ id, score, matched, missing, summary, recommendation, analysedBy }` |

## Jobs (admin)
| Method | Path | Description |
|---|---|---|
| GET | `/jobs` | All jobs with `applicationCount` |
| POST | `/jobs` | Create. Fields: `title`*, `requiredSkills`* (array or comma string), `department`, `description`, `preferredSkills`, `keywords`, `minExperience`, `status` (`active`/`closed`) |
| GET | `/jobs/:id` | One job |
| PUT | `/jobs/:id` | Partial update |
| DELETE | `/jobs/:id` | Delete; candidates are kept with `job: null` |

## Candidates (admin)
| Method | Path | Description |
|---|---|---|
| GET | `/candidates` | Query: `search`, `job`, `status`, `minScore`, `page`, `limit` (≤100). Sorted by score. Returns `data` + `meta {total,page,limit,pages}` |
| GET | `/candidates/:id` | Full record incl. `resumeText`, `analysis`, populated `job` |
| PATCH | `/candidates/:id/status` | `{ "status": "pending\|reviewed\|shortlisted\|rejected" }` |
| POST | `/candidates/:id/reanalyze` | Re-run screening against the current job |
| GET | `/candidates/:id/resume` | Download original file |
| DELETE | `/candidates/:id` | Delete candidate and file |

## Dashboard (admin)
`GET /dashboard/stats` → `totalCandidates`, `pending`, `shortlisted`, `avgScore`, `openJobs`, `totalJobs`, `statusCounts`, `scoreDistribution {low,medium,high}`, `applicationsByJob[]`, `applicationsOverTime[14]`, `topCandidates[]`, `recentCandidates[]`.

## Health
`GET /health` → `{ status: "ok" }`

## Example
```bash
TOKEN=$(curl -s localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")
curl -s localhost:5000/api/candidates?minScore=70 -H "Authorization: Bearer $TOKEN"
curl -s -F name="Jane Doe" -F email=jane@example.com -F jobId=<id> -F resume=@cv.pdf localhost:5000/api/public/apply
```
