# F6: Enhanced Analytics & Survey UX – Developer and User Guide

This document explains the Feature 6 work delivered for FeedbackLens: what changed, how to run it, and how to use it as a developer and as an end user.

## 1) Scope and Highlights
- Accurate Total Responses on analytics list and detail pages (counted from Response collection).
- Real Avg Time per survey (measured on the take‑survey page; displayed in minutes when applicable; robust fallbacks on dashboard).
- Question Types on Take Survey: `text`, `likert`, `multiple-choice` rendered correctly; answers captured accordingly.
- Invitation/end-date flow: set/remove survey end date with authenticated API.
- Insights text calibrated to sentiment distribution (avoids overstating dissatisfaction).
- Unified Logout UX on analytics pages (same as dashboard).
- Minor UX: Export PDF button placeholder; cleaned status labels.

## 2) Key Files Touched
- `backend/models/Survey.js` – optional question type/options.
- `backend/services/surveyService.js` – pass through type/options from CSV.
- `backend/services/dashboardService.js` – correct counts; sentiment/insight thresholds; recent responses enrichment.
- `backend/services/analyticsService.js` – distribution-aware summary text.
- `backend/controllers/surveyController.js` – `PATCH /api/v1/surveys/:surveyId/end-date`.
- `frontend/js/survey/take survey.js` – render question types; submit `completionTime`.
- `frontend/js/api/api.js` – `patchJSONAuth()` helper; analytics functions.
- `frontend/js/analytics/analytics-real.js` – analytics overview with logout dropdown.
- `frontend/js/analytics/survey-analytics.js` – detail analytics; avg time fallback; logout; end-date UI.
- `frontend/public/dashboard/survey-analytics.html` – UI (Export PDF button, modal, etc).

## 3) Prerequisites
- Node.js 18+
- MongoDB (local or remote)
- Two terminals (backend and frontend)

## 4) Setup & Run
```bash
# Backend
cd backend
npm install
npm run start

# Frontend (new terminal)
cd ../frontend
npm install
npm run start
```
Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/feedbacklens
PORT=4000
JWT_SECRET=changeme
```
Access:
- Dashboard: http://localhost:3000/public/dashboard/index.html
- Analytics overview: http://localhost:3000/public/dashboard/analytics.html
- Survey analytics: http://localhost:3000/public/dashboard/survey-analytics.html?id=<surveyId>

## 5) CSV & Question Types
CSV example:
```
questionId,questionText,type,options
Q1,How would you rate the course overall?,likert,
Q2,What did you like most about the course?,text,
Q3,Which format do you prefer?,multiple-choice,"Online;In-person;Hybrid"
Q4,Any additional feedback?,text,
```
- Supported type: `text` | `likert` | `multiple-choice`
- Multiple‑choice: options are `;` separated
- Persisted to `Survey.questions[].type/options`

## 6) Creating Surveys & Invitations
1. Dashboard → Create Surveys.
2. Upload CSV (validated client-side).
3. Use Invitations to send links; recipients take survey with token.

## 7) Taking Surveys (what changed)
- UI renders per type; time spent is measured and submitted as `completionTime` (seconds).
- Example submission payload:
```json
{
  "surveyId": "<id>",
  "respondentId": "<userId or placeholder>",
  "invitationId": "<from token or generated>",
  "responses": [
    { "questionId": "Q1", "questionText": "...", "answer": "4" },
    { "questionId": "Q2", "questionText": "...", "answer": "Great content" }
  ],
  "completionTime": 536
}
```

## 8) Analytics Overview (list)
- Uses `/api/v1/surveys/created` + batch analytics.
- Total response counts come from Response collection.
- Search filters list; click row to open detail.
- User dropdown: shows name/email + Logout.

## 9) Analytics Detail Page
- Metrics: Total Responses, Avg Sentiment, Completion Rate, Avg Time (minutes if ≥60s)
- Timeline, Sentiment Distribution, Top Keywords, Question Scores
- End‑date modal → `PATCH /api/v1/surveys/:surveyId/end-date` with `{ endDate }`
- Logout dropdown same as dashboard

## 10) API Reference (key)
- `GET /api/v1/surveys/created`
- `GET /api/v1/dashboard/:surveyId`
- `PATCH /api/v1/surveys/:surveyId/end-date`
- `POST /api/v1/surveys/respond`
- `GET /api/v1/analytics/survey/:surveyId/analysis`
- `GET /api/v1/analytics/survey/:surveyId/timeseries`

## 11) Data Model Notes
**Survey**
- `questions[].type`: `text|likert|multiple-choice` (optional)
- `questions[].options`: `string[]` (optional for MCQ)

**Response**
- `completionTime` (seconds) from client timer

## 12) Logout UX
- Dropdown attached to `.user-profile`; `handleLogout()` clears token/session and redirects to sign‑in.

## 13) Insights Calibration
- High Dissatisfaction only if negatives ≥ 60%
- Notable Dissatisfaction if 30–59% negatives
- Mixed/Satisfied otherwise

## 14) Testing & Troubleshooting
- Avg Time = `0s` → refresh; uses recentResponses fallback.
- Total Response low → confirm DB connection and Response docs exist.
- End date failing → ensure auth and `/api/v1` route path; check console/network.
- MCQ becomes textarea → check CSV `type/options` and created survey questions.

## 15) Contributing Workflow
```bash
git checkout -b f6-enhanced-analytics-page
# work...
git add -A && git commit -m "F6: ..."
git fetch origin
git merge origin/master   # or: git rebase origin/master
git push origin f6-enhanced-analytics-page
# open PR → master
```

## 16) Roadmap
- Real PDF export
- Topic–sentiment pairs with example quotes
- Multi-select charts
- Per-question completion-time distribution

## 17) Changelog (F6)
- Response count accuracy
- Client‑timed `completionTime`; minute formatting
- Correct question‑type rendering
- End‑date UI + API wiring
- Calibrated insights/summary wording
- Consistent logout dropdown on analytics pages

## 18) Contact
Include page URL, console logs, backend logs, survey ID, and reproduction steps when filing issues.
