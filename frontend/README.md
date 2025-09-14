FeedbackLense

FeedbackLense is a survey management and analysis platform that allows users to create surveys, send invitations, collect responses, and view analytics in real time.

Getting Started

Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local)


Running the Backend
To run the backend, open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
npm start
```

Running the Frontend
```bash
cd frontend
npm install
node server.js
```

OR

Running the Backend
To run the backend, open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
npm start
```

Running the Frontend
```bash
npx http-server frontend -p 3000 -c-1
```


Features Implemented

F2 - User Account Creation & Login

Frontend
•	Designed and implemented registration & login UI using Materialize CSS.
•	Connected forms to backend APIs for authentication.
•	Added error handling for invalid login attempts.

Backend (support)
•	User authentication APIs integrated with MongoDB.



F4 - Survey Invitations
Backend
•	Added survey lookup by surveyCode fallback in invitationService.
•	Removed duplicate invitation check to allow re-inviting users.
•	New controller method: getReceivedInvitationsFromUser.
•	Extended service with getUserReceivedInvitationsList and FromUser helpers.
•	Updated routes:
    o	Changed /received to POST
    o	Added /receivedInvitation endpoint
    o	Added /send/:surveyId endpoint
•	Added debug logging & creatorId validation in controller.
•	Relaxed survey ownership validation in surveyService.getSurveyById.
•	Improved error handling with stack trace logging.

Frontend
•	Added Received Invitation page.
•	Added Take Survey page.
•	Improved invitation input UI.
•	Integrated invitation workflow with dashboard.

