
# Survey Creation & Invitations API

## Create Survey

Create a new survey from CSV question data.

**Endpoint:** `POST /api/v1/surveys/create`  
**Authentication:** Bearer token required

### Request Body

```json
{
  "title": "Customer Satisfaction Survey",
  "csvData": [
    {
      "questionId": "q1",
      "questionText": "How satisfied are you with our service? (1-5)"
    },
    {
      "questionId": "q2", 
      "questionText": "How likely are you to recommend us? (1-10)"
    },
    {
      "questionId": "q3",
      "questionText": "Any additional comments?"
    }
  ]
}
```

### Response

```json
{
  "message": "Survey created successfully",
  "survey": {
    "id": "60f1b2c3d4e5f6789abcdef0",
    "title": "Customer Satisfaction Survey",
    "creatorId": "60f1b2c3d4e5f6789abcdef1",
    "creatorName": "John Doe",
    "questionCount": 3,
    "status": "active",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "csvMetadata": {
      "originalFilename": "manual_input.csv",
      "uploadedAt": "2025-01-15T10:30:00.000Z",
      "rowCount": 3
    }
  }
}
```

---

## Send Invitations

Send survey invitations to multiple users via email.

**Endpoint:** `POST /api/v1/surveys/:surveyId/invitations`  
**Authentication:** Bearer token required

### Request Body

```json
{
  "userEmails": [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

### Response

```json
{
  "message": "Invitations processed",
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  },
  "results": [
    {
      "email": "alice@example.com",
      "success": true,
      "invitationId": "60f1b2c3d4e5f6789abcdef2",
      "inviteLink": "/survey/60f1b2c3d4e5f6789abcdef0?token=abc123def456",
      "recipientName": "Alice Johnson"
    },
    {
      "email": "bob@example.com", 
      "success": true,
      "invitationId": "60f1b2c3d4e5f6789abcdef3",
      "inviteLink": "/survey/60f1b2c3d4e5f6789abcdef0?token=def456ghi789",
      "recipientName": "Bob Smith"
    },
    {
      "email": "charlie@example.com",
      "success": false,
      "error": "User not found - user must be registered"
    }
  ]
}
```

---

## API Constraints

| Constraint | Limit |
|------------|-------|
| Questions per survey | 20 max |
| Invitations per batch | 50 max |
| Question ID length | Must be unique within survey |
| Question text length | 200 characters max |
| Survey title length | 100 characters max |

### Required Fields

**Survey Creation:**
- `title` (string, required)
- `csvData` (array, required)
  - `questionId` (string, required)
  - `questionText` (string, required)

**Send Invitations:**
- `userEmails` (array, required)
- Users must be registered in the system before receiving invitations