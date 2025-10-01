# Feature F2: User Account Creation & Login (Sprint 1)

## Feature Overview
Implements **user authentication**, allowing new users to create accounts and existing users to log in securely. Delivered in **Sprint 1**, this feature is the foundation for accessing all FeedbackLens services.

## Key Features
- Registration form for new users (name, email, password).  
- Login form with email and password.  
- Frontend validation and error handling (invalid inputs, incorrect credentials).  
- Secure API integration with JWT authentication.  
- Error messages displayed clearly on the UI.  

## Files Implemented
- **Frontend:**  
  - `signup.html` – User registration page.  
  - `signin.html` – User login page.  
  - `auth.css` – Styling for login and registration.  
  - `auth_validations.js` – Client-side validation and error handling.  
- **Backend (team):**  
  - `authController.js` – Handles registration, login, and authentication logic.  
  - `authService.js` – Service layer for user management.  
  - `User.js` – Mongoose model for users.  
  - `auth.js` – Middleware for JWT token validation.  

## Workflow
1. User registers with valid details → account stored in MongoDB.  
2. User logs in → system validates credentials and issues a JWT token.  
3. Authenticated user is redirected to the dashboard.  
4. Invalid login attempts show error messages without access.  

## Acceptance Criteria
- Valid registration creates new account successfully.  
- Valid login issues JWT token and grants access.  
- Invalid inputs (wrong password, missing fields) return error messages.  



