# F5: Recipient Response Submission - End-to-End Testing

This E2E test suite validates the complete survey response submission workflow from recipient perspective, covering all critical user journeys including invitation access, multi-page survey completion, and error handling.

## Feature Overview
**F5: Recipient Response Submission (Sophie & Team)**
> As a survey recipient, I want to receive survey invitations and submit my responses so that I can provide feedback through the system.

## E2E Test Coverage
This test suite covers **full user workflows** from recipient login to survey completion, ensuring the entire response submission process works end-to-end including:
- Invitation access and validation
- Multi-page survey navigation
- All question types (Likert scales, multiple choice, text inputs, checkboxes)
- Response submission and database persistence
- Success confirmation messages
- Error handling for invalid access

## Prerequisites
1. **Backend Server**: Must be running on `http://localhost:4000`
2. **Frontend Server**: Must be running on `http://localhost:3000`
3. **MongoDB**: Must be running with `feedbackLense` database
4. **Test Data**: 
   - Survey invitation must exist for recipient user
   - Survey "Sample survey format" must be created and shared

## Test Users
```javascript
// Survey Recipient (main test user)
Email: Suongngo11@gmail.com
Password: Feedbacklense@1234

// Survey Creator (for survey setup)
Email: Aswin2@gmail.com
Password: Feedbacklense@1234
```

## Acceptance Criteria (E2E Tested)

### AC1: View Received Invitations
> **Given** I am a logged-in recipient, **when** I navigate to invitations page, **then** I can see all my survey invitations.

**E2E Test Coverage:**
- ✅ User authentication and session management
- ✅ Invitation list retrieval from database
- ✅ UI rendering of invitation cards
- ✅ Survey metadata display (title, creator, date)

### AC2: Access Survey from Invitation
> **Given** I am logged in, **when** I open the survey link, **then** I can access and complete the survey form.

**E2E Test Coverage:**
- ✅ "Take Survey" button click interaction
- ✅ Navigation to survey taking page
- ✅ Survey data loading and rendering
- ✅ Token-based access validation
- ✅ Survey question display

### AC3: Submit Survey Responses
> **Given** I complete the survey, **when** I click submit, **then** my responses are securely saved to the database.

**E2E Test Coverage:**
- ✅ All question types interaction (Likert, multiple choice, text, checkboxes)
- ✅ Multi-page navigation (Next button)
- ✅ Form validation before submission
- ✅ Response data submission to backend
- ✅ Database persistence verification
- ✅ Proper handling of all radio button groups
- ✅ Checkbox selection validation

### AC4: Success Confirmation
> **Given** my submission is successful, **when** I finish, **then** the system displays a confirmation message.

**E2E Test Coverage:**
- ✅ Success message display
- ✅ Confirmation page redirection
- ✅ User feedback and UI state management

### AC5: Invalid Access Handling
> **Given** the survey link is invalid or expired, **when** I attempt to access it, **then** the system displays an error page.

**E2E Test Coverage:**
- ✅ Invalid token detection
- ✅ Access denied message display
- ✅ Error page rendering
- ✅ Security validation

## Test Structure (E2E Workflows)

### Phase 1: Invitation Access (2 tests)
- ✅ **Test 1**: Display received invitations
  - Login workflow
  - Navigate to invitations page
  - Verify invitation list visibility
  - Check "Sample survey format" is displayed
  
- ✅ **Test 2**: Navigate to survey from invitation
  - Click "Take Survey" button
  - Verify URL navigation
  - Confirm survey form loads correctly

### Phase 2: Survey Response Submission (1 test)
- ✅ **Test 3**: Complete and submit survey responses
  - **Page 1 Interaction**:
    - Fill text input fields (Q2: feedback textarea)
    - Select Likert scale options (Q1: 5-point scale)
    - Handle checkboxes if present
    - Click "Next" button
  - **Page 2 Interaction**:
    - Select multiple choice radio options (Q3: 4 teaching methods)
    - Select multiple choice radio options (Q4: 3 recommendation options)
    - Handle all radio button groups properly
    - Click "Finish" or "Submit" button
  - **Validation**:
    - Verify success message or confirmation page
    - Database persistence check

### Phase 3: Error Handling (1 test)
- ✅ **Test 4**: Access denied for invalid invitation
  - Attempt direct survey access without token
  - Verify error message or access denied page
  - Confirm proper security enforcement

## Running Tests

### 1. Run All Tests (Headless - Fast)
```bash
cd /Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/suong-ngo-tests
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium
```

### 2. Run All Tests (Headed - Visual)
```bash
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --headed
```

### 3. Run Specific Phase
```bash
# Phase 1: Invitation Access
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 1" --headed

# Phase 2: Survey Response Submission
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 2" --headed

# Phase 3: Error Handling
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 3" --headed
```

### 4. Run Single Test (Best for Debugging)
```bash
# Run the complete survey submission test
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --headed --workers=1 --grep "should complete and submit survey responses"

# Run invitation display test
npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --headed --workers=1 --grep "should display received invitations"
```

### 5. Interactive UI Mode
```bash
# Opens Playwright UI for interactive testing
npx playwright test --ui
```

## Viewing Results

### 1. HTML Report
```bash
# Open the HTML report
npx playwright show-report

# Or open directly in browser
open playwright-report/index.html
```

### 2. Screenshots and Videos
- **Location**: `test-results/` directory
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for all tests (especially useful for multi-page survey flow)
- **Traces**: Available for debugging complex interactions

### 3. Console Logs
The tests output helpful debugging information:
```
Text inputs found: 1
Radio buttons found: 5
Radio groups found: 1
Checkboxes found: 0
Next button visible: true
Radio buttons on page 2: 7
Radio groups on page 2: 2    <- Q3 (4 options) + Q4 (3 options)
Checkboxes on page 2: 0
```

## Key Features Tested

### Multi-Page Survey Navigation
- ✅ Automatic detection of "Next" vs "Submit/Finish" buttons
- ✅ Proper page transition handling
- ✅ State preservation between pages

### All Question Types Support
1. **Likert Scale Questions** (Q1)
   - Radio button groups with 5 options
   - Middle option selection (Neutral)

2. **Text Input Questions** (Q2)
   - Textarea fields
   - Text input fields
   - Proper text filling validation

3. **Multiple Choice Questions** (Q3, Q4)
   - Radio button groups (single selection)
   - Checkbox groups (multiple selection)
   - **Smart group detection**: Uses `name` attribute to identify unique question groups
   - Automatic selection of appropriate option

### Button Detection
- ✅ Supports both "Submit" and "Finish" button text
- ✅ Handles multi-page surveys with "Next" button
- ✅ Flexible button detection across different survey layouts

## E2E Test Results & Coverage Report

### ✅ Test Execution Results
- **4 E2E tests passed** (~30 seconds)
- **0 tests failed**
- **Database Integration**: ✅ Responses saved to `feedbackLense.responses` collection
- **UI/UX Validation**: ✅ All user interactions work correctly
- **Multi-Page Flow**: ✅ Page navigation and state management validated
- **All Question Types**: ✅ Likert, multiple choice, text inputs all working

### 📊 E2E Performance Metrics
- **Phase 1 (Invitation Access)**: ~3-5 seconds per test
- **Phase 2 (Survey Completion)**: ~12-15 seconds (includes multi-page navigation)
- **Phase 3 (Error Handling)**: ~3-4 seconds
- **Total E2E Execution**: ~30-35 seconds

### 🎯 E2E Coverage Validation
- **User Workflows**: ✅ Complete recipient journey from invitation to submission
- **System Integration**: ✅ Frontend, backend, and database integration verified
- **Error Scenarios**: ✅ Invalid access and security validation
- **Data Integrity**: ✅ Response data correctly saved and associated with survey
- **Multi-Page Surveys**: ✅ Navigation and data persistence across pages


## Troubleshooting

### Common Issues

1. **"No invitations found"**
   - Ensure survey invitation exists in database
   - Check that "Sample survey format" is shared with recipient user
   - Verify recipient email: Suongngo11@gmail.com

2. **"Radio buttons not selected"**
   - Check console logs: `Radio groups found: X`
   - Verify radio buttons have unique `name` attributes
   - Ensure buttons are visible and not disabled

3. **"Submit button timeout"**
   - Check if button text is "Submit" or "Finish"
   - Verify all required fields are filled
   - Check console for validation errors

4. **"Connection refused"**
   - Start backend: `cd backend && npm start`
   - Start frontend: `cd frontend && npm start`
   - Verify ports: backend on 4000, frontend on 3000

5. **"Login failed"**
   - Verify test user exists: Suongngo11@gmail.com
   - Check JWT_SECRET in backend/.env
   - Ensure password matches: Feedbacklense@1234

### Debug Mode
```bash
# Run with debug output and slower execution
DEBUG=pw:api npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium --headed --workers=1

# Run with Playwright Inspector for step-by-step debugging
PWDEBUG=1 npx playwright test e2e/f5-recipent-response/survey-taking.spec.js --config=playwright.config.local.js --project=chromium
```

## Database Verification

After running Phase 2 tests, check MongoDB:

### Collections to Verify
1. **`responses`** collection
   - Look for new response document
   - Verify `surveyId` matches the test survey
   - Check `userId` is recipient's ID
   - Confirm `answers` array contains all responses

2. **`surveys`** collection
   - Verify survey exists with title "Sample survey format"
   - Check survey has questions matching test expectations

3. **`invitations`** collection
   - Confirm invitation record exists for recipient
   - Verify invitation status and metadata

### Sample Response Document
```json
{
  "_id": "ObjectId(...)",
  "surveyId": "ObjectId(...)",
  "userId": "ObjectId(...)",
  "answers": [
    { "questionId": "Q1", "answer": "Neutral" },
    { "questionId": "Q2", "answer": "Test response 1 from E2E test" },
    { "questionId": "Q3", "answer": "Tutorials" },
    { "questionId": "Q4", "answer": "No" }
  ],
  "submittedAt": "2025-09-30T...",
  "status": "completed"
}
```

## Test Architecture

### Helper Functions
- **`fastLogin(page, email, password)`**: Quick login utility
- **Radio Group Detection**: Smart detection by `name` attribute
- **Button Detection**: Flexible "Submit" or "Finish" button locator

### Locator Strategies
- **Radio Groups**: `input[type="radio"][name="${groupName}"]`
- **Checkboxes**: `input[type="checkbox"]:visible`
- **Text Inputs**: `textarea:visible, input[type="text"]:visible`
- **Buttons**: `button:has-text("Next")`, `button:has-text("Submit"), button:has-text("Finish")`

## E2E Testing Best Practices

### What This Test Suite Demonstrates
1. ✅ **Complete User Journeys**: From login to survey submission
2. ✅ **Smart Element Detection**: Handles various question types dynamically
3. ✅ **Multi-Page Navigation**: Proper handling of paginated surveys
4. ✅ **Error Recovery**: Graceful handling of edge cases
5. ✅ **Database Validation**: End-to-end data persistence verification



**E2E Testing Status**: ✅ 4/4 tests passing (100% complete)
**Last Updated**: September 30, 2025
**Test Coverage**: Complete recipient response workflow validated end-to-end
**Special Features**: Multi-page survey support, all question types, smart button detection
