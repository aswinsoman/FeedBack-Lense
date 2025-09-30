# F3: Survey Creation - End-to-End Testing

This E2E test suite validates the complete survey creation workflow from user perspective, covering all critical user journeys and ensuring data integrity across the full application stack.

## Feature Overview
**F3: Survey Creation with CSV Upload 
> As a survey creator, I want to upload a CSV file containing questions so that I can quickly set up a survey without manually entering each question.

## E2E Test Coverage
This test suite covers **full user workflows** from frontend interaction to database persistence, ensuring critical business processes work end-to-end.

## Prerequisites
1. **Backend Server**: Must be running on `http://localhost:4000`
2. **Frontend Server**: Must be running on `http://localhost:3000`
3. **MongoDB**: Must be running with `feedbackLense` database
4. **Test Users**: Created in the database (creator@example.com, etc.)

## Frontend Tasks Coverage (E2E Validated)
- ✅ **Design survey creation form & CSV upload UI** - Complete user interface testing
- ✅ **Validate CSV headers and structure (UI validation + error messages)** - Full validation workflow
- ✅ **Show new survey in creator's dashboard list (fetch + render surveys)** - End-to-end data flow

## Acceptance Criteria (E2E Tested)

### AC1: Valid CSV Upload Workflow
> **Given** a logged-in survey creator uploads a valid CSV file with required headers, **when** they submit it, **then** a new survey is created and stored in the database.

**E2E Test Coverage:**
- ✅ User authentication and session management
- ✅ CSV file upload and validation
- ✅ Survey creation API integration
- ✅ Database persistence verification
- ✅ UI state management and transitions

### AC2: Invalid CSV Error Handling
> **Given** a logged-in survey creator uploads an invalid CSV file (e.g., missing headers), **when** they submit it, **then** the system displays a validation error message.

**E2E Test Coverage:**
- ✅ File validation error detection
- ✅ User-friendly error message display
- ✅ UI state management during errors
- ✅ Error recovery and retry mechanisms

### AC3: Dashboard Integration
> **Given** a survey is created, **when** the survey creator views their dashboard, **then** the survey is listed with a unique ID and creation date.

**E2E Test Coverage:**
- ✅ Survey data retrieval from database
- ✅ Dashboard UI rendering with survey data
- ✅ Data consistency across frontend and backend
- ✅ User experience validation

## Test Structure (E2E Workflows)

### Phase 1: User Authentication & Navigation (3 tests)
- ✅ Complete login workflow validation
- ✅ Navigation to survey creation page
- ✅ UI component visibility and accessibility

### Phase 2: CSV Upload & Validation (5 tests)
- ✅ File upload interaction testing
- ✅ Drag and drop functionality
- ✅ CSV validation workflow
- ✅ Error handling and user feedback
- ✅ File type restrictions

### Phase 3: Survey Creation & Database Integration (2 tests)
- ✅ Complete survey creation workflow
- ✅ Database persistence verification
- ✅ Dashboard data synchronization

### Phase 4: Error Handling & Edge Cases (2 tests - TODO)
- ⏭️ Network failure scenarios
- ⏭️ System error recovery

## Running Tests

### 1. Run All Tests (Headless - Fast)
```bash
cd /Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/suong-ngo-tests
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium
```

### 2. Run All Tests (Headed - Visual)
```bash
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --headed
```

### 3. Run Specific Phase
```bash
# Phase 1: Basic Functionality
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 1" --headed

# Phase 2: CSV Upload
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 2" --headed

# Phase 3: Survey Creation (Database Integration)
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --grep "Phase 3" --headed
```

### 4. Run Single Test (Best for Debugging)
```bash
# Run one specific test
npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --headed --workers=1 --grep "should create survey successfully"
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
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging

## Test Data

### Valid CSV File
- **Path**: `/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/sample_survey_format.csv`
- **Format**: questionId, questionText, type, options
- **Example**: Q1, "How satisfied are you?", multiple-choice, "Yes;No;Maybe"

### Invalid CSV File
- **Path**: `/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/invalid-survey.csv`
- **Issues**: Missing questionId, invalid type, duplicate IDs

### Test Users
- **Creator**: creator@example.com / TestCreator@2024!Secure
- **Recipient**: recipient@example.com / TestRecipient@2024!Secure
- **Admin**: admin@example.com / TestAdmin@2024!Secure123

## Troubleshooting

### Common Issues

1. **"No tests found"**
   - Check file path: `e2e/f3-survey-creation/survey-creation.spec.js`
   - Ensure config file exists: `playwright.config.local.js`

2. **"Connection refused"**
   - Start backend: `cd backend && npm start`
   - Start frontend: `cd frontend && npm start`

3. **"Login failed"**
   - Check test users exist in database
   - Verify JWT_SECRET in backend/.env

4. **"Port already in use"**
   - Kill existing processes: `lsof -ti:9323 | xargs kill -9`
   - Or use different port: `npx playwright show-report --port 9324`

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npx playwright test e2e/f3-survey-creation/survey-creation.spec.js --config=playwright.config.local.js --project=chromium --headed --workers=1
```

## Database Verification

After running Phase 3 tests, check MongoDB Compass:
1. **Database**: `feedbackLense`
2. **Collections**: `surveys`, `activities`, `users`
3. **Look for**: New survey records with test data