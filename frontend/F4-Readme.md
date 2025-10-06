# Feature F4: Survey Invitations (Sprint 1)

## Feature Overview
Implements **Survey Invitations**, enabling survey creators to invite participants via email and allowing recipients to securely access surveys. Delivered in **Sprint 1** as a core feature of FeedbackLens.

## Key Features
- Send invitations to participant email addresses.  
- Validate email inputs (prevent duplicates or invalid emails).  
- Generate unique survey links per invitation.  
- Display invited participants under survey details.  
- Recipients view invitations in dashboard with a **“Take Survey”** button.  
- Integrated error handling for invalid/duplicate inputs.  

## Files Implemented
- **Frontend:**  
  - `invite.js` – Handles invitation form submission and UI validation.  
  - `invitations.css` – Styles invitation list and table.  
  - `invitation.html` – Dedicated invitation management page.  
- **Backend (team):**  
  - `invitationController.js`  
  - `invitationService.js`  
  - `Invitation.js` (Mongoose model).  

## Workflow
1. Creator enters email(s) on **Invitations Page**.  
2. System validates entries → rejects duplicates/invalids.  
3. Valid invites saved in MongoDB with **unique survey token**.  
4. Recipients see invitations in dashboard → click **Take Survey**.  

## Acceptance Criteria
- Valid invites create unique links.  
- Invalid/duplicate emails show errors.  
- Dashboard shows pending/received invitations.  
- “Take Survey” works only for active surveys.  

 
