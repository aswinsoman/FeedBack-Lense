# Dashboard & Activity APIs — v1

This README documents the **Dashboard** and **Activity** endpoints exposed by the server. All endpoints are **read‑only (GET)** and require a valid JWT in the `Authorization` header unless stated otherwise.

> **Base URL (local)**: `http://localhost:4000`

## Authentication

All endpoints below require a Bearer token. The authenticated user ID is derived from the token.

```
Authorization: Bearer <JWT>
Content-Type: application/json
```

---

## 1) User Stats Poll

Retrieve a quick snapshot of the signed‑in user’s survey activity for the dashboard.

**HTTP**

* **Method**: `GET`
* **Path**: `/api/v1/dashboard/user/stats/poll`
* **Auth**: Required (user ID inferred from token)

**Response — 200 OK**

```json
{
  "userStats": {
    "totalSurveysCreated": 2,
    "totalInvitationsReceived": 0,
    "totalResponsesGiven": 0,
    "pendingInvitations": 0,
    "activeSurveys": 2,
    "closedSurveys": 0,
    "overallResponseRate": 0,
    "totalInvitationsSent": 1,
    "totalResponsesReceived": 0
  },
  "surveyStats": [
    {
      "surveyId": "68c786fc52a442ebb2fa93fd",
      "title": "Sample survey",
      "responseCount": 0,
      "avgScore": null
    },
    {
      "surveyId": "68c782a852a442ebb2fa9352",
      "title": "Sample survey",
      "responseCount": 6,
      "avgScore": null
    }
  ],
  "lastUpdated": "2025-09-22T02:57:17.948Z"
}
```

**Field notes**

* `overallResponseRate`: number in the range **0–1** (e.g., 0.42 = 42%).
* `avgScore`: average score for the survey if applicable; may be `null` if no scored questions or no responses.
* `lastUpdated`: ISO 8601 UTC timestamp.

**Example**

```bash
curl -X GET \
  "http://localhost:4000/api/v1/dashboard/user/stats/poll" \
  -H "Authorization: Bearer $JWT"
```

**Possible status codes**

* `200` OK — Stats returned
* `401` Unauthorized — Missing/invalid token
* `500` Internal Server Error

---

## 2) Cross‑Survey Aggregation

Aggregated metrics across all surveys owned by the authenticated user.

**HTTP**

* **Method**: `GET`
* **Path**: `/api/v1/dashboard/user/cross-survey-aggregation`
* **Auth**: Required (user ID inferred from token)

**Response — 200 OK**

```json
{
  "surveyStats": [
    {
      "surveyId": "68c786fc52a442ebb2fa93fd",
      "title": "Sample survey",
      "responseCount": 0,
      "avgCompletionTime": null
    },
    {
      "surveyId": "68c782a852a442ebb2fa9352",
      "title": "Sample survey",
      "responseCount": 6,
      "avgCompletionTime": 372
    }
  ],
  "overallCompletionRate": 0,
  "responseTrends": [
    {
      "_id": "2025-09-16",
      "count": 6
    }
  ],
  "lastUpdated": "2025-09-22T02:59:35.384Z"
}
```

**Field notes**

* `avgCompletionTime`: average time **in seconds** to complete the survey; may be `null` if no completed responses.
* `overallCompletionRate`: number in the range **0–1** across all surveys.
* `responseTrends`: daily counts of responses; `_id` is a date string `YYYY-MM-DD`.
* `lastUpdated`: ISO 8601 UTC timestamp.

**Example**

```bash
curl -X GET \
  "http://localhost:4000/api/v1/dashboard/user/cross-survey-aggregation" \
  -H "Authorization: Bearer $JWT"
```

**Possible status codes**

* `200` OK — Aggregates returned
* `401` Unauthorized — Missing/invalid token
* `500` Internal Server Error

---

## 3) Survey Activity (by Survey ID)

List activity events for a specific survey with pagination.

**HTTP**

* **Method**: `GET`
* **Path**: `/api/v1/activity/survey/:surveyId`
* **Query params**:

  * `page` *(optional, default: 1)* — 1‑based page index
  * `limit` *(optional, default: 20)* — items per page
* **Auth**: Typically required (depends on visibility rules); the server may restrict access to owners/collaborators.

**Response — 200 OK**

```json
{
  "activities": [
    {
      "_id": "68d0be6c41ab97ab9984cce4",
      "userId": "68c77d5a845ef3e10e2ec668",
      "surveyId": "68c782a852a442ebb2fa9352",
      "type": "response_submitted",
      "message": "Aswin Soman submitted survey response to \"Sample survey\"",
      "createdAt": "2025-09-22T03:11:40.281Z",
      "__v": 0
    },
    {
      "_id": "68d0bdeadd01c1d16bedb60b",
      "userId": "68c77d5a845ef3e10e2ec668",
      "surveyId": "68c782a852a442ebb2fa9352",
      "type": "response_submitted",
      "message": "You submitted a response to \"Sample survey\"",
      "createdAt": "2025-09-22T03:09:30.865Z",
      "__v": 0
    },
    {
      "_id": "68d0bde5dd01c1d16bedb601",
      "userId": "68c77d5a845ef3e10e2ec668",
      "surveyId": "68c782a852a442ebb2fa9352",
      "type": "response_submitted",
      "message": "You submitted a response to \"Sample survey\"",
      "createdAt": "2025-09-22T03:09:25.961Z",
      "__v": 0
    }
  ],
  "page": 1,
  "totalPages": 1,
  "total": 3
}
```

**Field notes**

* `type`: event type such as `response_submitted`, `survey_created`, `invitation_sent`, etc. (exact set depends on server).
* `createdAt`: ISO 8601 UTC timestamp.
* `page`, `totalPages`, `total`: standard pagination metadata.

**Examples**

```bash
# Default pagination (page=1, limit=20)
curl -X GET \
  "http://localhost:4000/api/v1/activity/survey/68c782a852a442ebb2fa9352" \
  -H "Authorization: Bearer $JWT"

# Custom pagination
curl -X GET \
  "http://localhost:4000/api/v1/activity/survey/68c782a852a442ebb2fa9352?page=2&limit=10" \
  -H "Authorization: Bearer $JWT"
```

**Possible status codes**

* `200` OK — Activity returned
* `401` Unauthorized — Missing/invalid token
* `403` Forbidden — Not allowed to view this survey’s activity
* `404` Not Found — `surveyId` not found
* `500` Internal Server Error

---

## Data Types (TypeScript)

For convenience, here are minimal type hints for common payloads.

```ts
export type UserStatsPoll = {
  userStats: {
    totalSurveysCreated: number;
    totalInvitationsReceived: number;
    totalResponsesGiven: number;
    pendingInvitations: number;
    activeSurveys: number;
    closedSurveys: number;
    overallResponseRate: number; // 0..1
    totalInvitationsSent: number;
    totalResponsesReceived: number;
  };
  surveyStats: Array<{
    surveyId: string;
    title: string;
    responseCount: number;
    avgScore: number | null; // if applicable
  }>;
  lastUpdated: string; // ISO 8601
};

export type CrossSurveyAggregation = {
  surveyStats: Array<{
    surveyId: string;
    title: string;
    responseCount: number;
    avgCompletionTime: number | null; // seconds
  }>;
  overallCompletionRate: number; // 0..1
  responseTrends: Array<{
    _id: string; // YYYY-MM-DD
    count: number;
  }>;
  lastUpdated: string; // ISO 8601
};

export type SurveyActivity = {
  activities: Array<{
    _id: string;
    userId: string;
    surveyId: string;
    type: string;
    message: string;
    createdAt: string; // ISO 8601
    __v?: number;
  }>;
  page: number;
  totalPages: number;
  total: number;
};
```


**Common error codes**

* `UNAUTHORIZED` (401): Missing/invalid token
* `FORBIDDEN` (403): Access denied
* `NOT_FOUND` (404): Resource does not exist
* `RATE_LIMITED` (429): Too many requests
* `INTERNAL` (500): Unexpected server error

---

## Versioning

These endpoints are versioned under `/api/v1/…`. Backward‑incompatible changes will be released under a new version prefix.

## Notes & Assumptions

* Timestamps are returned in **UTC** with `Z` suffix.
* Rates are **0–1** decimals unless otherwise noted.
* Completion time is measured in **seconds**.

---

## Changelog

* **2025‑09‑22**: Initial README covering stats poll, cross‑survey aggregation, and activity APIs.
