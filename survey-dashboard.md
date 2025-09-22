# Survey Dashboard API

## Get Survey Dashboard

Retrieve comprehensive dashboard data including survey details, invitation statistics, and response analysis.

**Endpoint:** `GET /api/v1/dashboard/:surveyId`  
**Authentication:** Bearer token required

### Response

```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "60f1b2c3d4e5f6789abcdef0",
      "title": "Customer Satisfaction Survey",
      "creatorId": "60f1b2c3d4e5f6789abcdef1",
      "creatorName": "John Doe",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "questions": [
        {
          "questionId": "q1",
          "questionText": "How satisfied are you with our service? (1-5)"
        },
        {
          "questionId": "q2", 
          "questionText": "How likely are you to recommend us? (1-10)"
        }
      ]
    },
    "stats": {
      "questionCount": 2,
      "totalInvitations": 10,
      "completedInvitations": 7,
      "pendingInvitations": 3,
      "responseRate": 70
    },
    "invitations": [
      {
        "id": "60f1b2c3d4e5f6789abcdef2",
        "recipientName": "Alice Johnson",
        "recipientEmail": "alice@example.com",
        "status": "completed",
        "sentAt": "2025-01-15T11:00:00.000Z",
        "completedAt": "2025-01-15T14:30:00.000Z"
      }
    ],
    "analysis": {
      "questionAnalysis": [
        {
          "questionId": "q1",
          "questionText": "How satisfied are you with our service? (1-5)",
          "type": "numerical",
          "responseCount": 7,
          "statistics": {
            "count": 7,
            "mean": 4.2,
            "median": 4,
            "mode": 5,
            "min": 3,
            "max": 5
          }
        },
        {
          "questionId": "q2",
          "questionText": "How likely are you to recommend us? (1-10)",
          "type": "numerical", 
          "responseCount": 7,
          "statistics": {
            "count": 7,
            "mean": 8.1,
            "median": 8,
            "mode": 9,
            "min": 6,
            "max": 10
          }
        }
      ],
      "overallMetrics": {
        "totalResponses": 7,
        "avgCompletionTime": 120
      }
    },
    "lastUpdated": "2025-01-15T15:45:00.000Z"
  }
}
```

---

## Response Structure

| Section | Description |
|---------|-------------|
| `survey` | Basic survey information and questions |
| `stats` | Invitation and response statistics |
| `invitations` | Recent invitation details (last 10) |
| `analysis` | **NEW** - Numerical response analysis |
| `lastUpdated` | Timestamp of data generation |

---

## Analysis Features

### Numerical Analysis Only
- Only questions with **80%+ numerical responses** are analyzed
- Non-numerical questions are automatically skipped

### Available Statistics
- **count** - Number of numerical responses
- **mean** - Average value (rounded to 2 decimal places)
- **median** - Middle value when sorted
- **mode** - Most frequently occurring value
- **min** - Lowest value
- **max** - Highest value

### Overall Metrics
- **totalResponses** - Total number of survey completions
- **avgCompletionTime** - Average time to complete survey (seconds)

### Example Use Cases
- Rating scales (1-5, 1-10)
- Satisfaction scores
- NPS scores
- Age or numerical input fields