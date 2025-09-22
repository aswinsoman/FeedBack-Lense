## Features Implemented

### F2 – User Account Creation & Login

**Frontend**
- Designed and implemented registration & login UI using **Materialize CSS**.
- Connected forms to backend APIs for authentication.
- Added error handling for invalid login attempts.

**Backend (Support)**
- Implemented user authentication APIs integrated with **MongoDB**.

---

### F4 – Survey Invitations

**Backend**
- Added survey lookup by `surveyCode` fallback in `invitationService`.
- Removed duplicate invitation check to allow re-inviting users.
- Introduced new controller method: `getReceivedInvitationsFromUser`.
- Extended service with:
  - `getUserReceivedInvitationsList`
  - `getUserReceivedInvitationsFromUser` helpers
- Updated routes:
  - Changed `/received` to `POST`
  - Added `/receivedInvitation` endpoint
  - Added `/send/:surveyId` endpoint
- Added debug logging and `creatorId` validation in controller.
- Relaxed survey ownership validation in `surveyService.getSurveyById`.
- Improved error handling with stack trace logging.

**Frontend**
- Added **Received Invitation** page.
- Added **Take Survey** page.
- Improved invitation input UI.
- Integrated invitation workflow with dashboard.
