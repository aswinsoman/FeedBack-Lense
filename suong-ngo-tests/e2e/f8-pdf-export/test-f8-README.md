# F8: Analytics PDF Export - E2E Testing Guide

## Overview

This directory contains end-to-end (E2E) tests for **Feature 8 (F8): Analytics PDF Export Functionality**. These tests validate the PDF export feature from the analytics page, ensuring users can successfully download professional, comprehensive PDF reports of their survey analytics.

## What is Being Tested

The test suite validates the complete PDF export workflow from the user's perspective (frontend E2E testing):

### Test Coverage Areas:

1. **UI/UX Elements** - Export button visibility and accessibility
2. **User Interactions** - Button clicks and download triggers
3. **PDF Generation** - Actual file download and content validation
4. **Content Quality** - PDF includes charts, analytics data, and metadata
5. **Performance** - Export completes within acceptable timeframes
6. **Error Handling** - Graceful handling of edge cases
7. **Browser Compatibility** - Consistent behavior across browsers

### Acceptance Criteria Validated:

✅ **AC1**: PDF export includes all analytics charts and visualizations  
✅ **AC2**: Export contains keyword analysis, satisfaction metrics, and trend data  
✅ **AC3**: PDF is professionally formatted with survey title, date, and branding  
✅ **AC5**: PDF generation completes within 10 seconds for typical surveys  
✅ **AC6**: Export button is easily accessible from analytics page  
✅ **AC7**: Generated PDF maintains chart quality and readability

## Prerequisites

### 1. Backend Server Running
The tests require a live backend server with real survey data:

```bash
# Navigate to backend directory
cd backend

# Start the backend server
npm start

# Backend should be running on http://localhost:5000
```

### 2. Frontend Server Running
The frontend must be accessible:

```bash
# Navigate to frontend directory
cd frontend

# Start the frontend server
npm start

# Frontend should be running on http://localhost:3000
```

### 3. Test User Account
The tests use a real user account with existing survey data:

- **Email**: `suongngo1811@gmail.com`
- **Password**: `Feedbacklense@1234`

Ensure this account exists and has at least one survey with analytics data.

### 4. Node.js and Dependencies
```bash
# Ensure you're in the test directory
cd suong-ngo-tests

# Install dependencies (if not already installed)
npm install
```

## Installation

### Step 1: Install Test Dependencies

```bash
cd suong-ngo-tests
npm install
```

This installs:
- `@playwright/test` - E2E testing framework
- `pdf-parse` - PDF content validation library
- Other required dependencies

### Step 2: Install Playwright Browsers

```bash
npx playwright install chromium
```

For cross-browser testing (optional):
```bash
npx playwright install firefox webkit
```

## Running the Tests

### Quick Start (Recommended)

**Option A: Test on All Browsers (100% AC4 Coverage)**

Run all F8 tests on Chromium, Firefox, and WebKit (54 tests total):

```bash
cd suong-ngo-tests
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --headed
```

**Option B: Test on Chromium Only (Faster)**

Run all F8 tests in headed mode on Chrome only (18 tests):

```bash
cd suong-ngo-tests
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium --headed
```

### Headless Mode (CI/CD)

Run tests without opening a browser window:

```bash
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium
```

### Run Specific Test Phase

Run only acceptance criteria validation tests:

```bash
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium --grep "Acceptance Criteria"
```

Run only performance tests:

```bash
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium --grep "Performance Testing"
```

### Debug Mode

Run a single test with debugging:

```bash
npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium --headed --debug
```

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report will open in your browser at `http://localhost:9323` with:
- Test results summary
- Screenshots of each step
- Video recordings
- Console logs
- Detailed error messages (if any)

## Test Structure

### Test File: `pdf-export.spec.js`

The test suite is organized into 6 phases with 18 total tests:

#### **Phase 1: PDF Export Button and UI** (2 tests)
- Validates export button visibility on analytics page
- Tests navigation flow to analytics

#### **Phase 2: PDF Export Process** (2 tests)
- Tests actual PDF download functionality
- Validates analytics data is displayed before export

#### **Phase 3: PDF Content Validation** (2 tests)
- Verifies charts are ready for export
- Checks survey metadata display

#### **Phase 3.5: Acceptance Criteria Validation** (6 tests)
- **AC1**: Charts and visualizations in PDF
- **AC2**: Analytics content (keywords, metrics, trends)
- **AC3**: Professional formatting
- **AC5**: Performance (<10 seconds)
- **AC6**: Button accessibility
- **AC7**: Chart quality and readability

#### **Phase 4: Error Handling** (2 tests)
- Handles missing/invalid survey data
- Ensures page doesn't crash

#### **Phase 5: Performance Testing** (2 tests)
- Page load time validation
- PDF export time measurement

#### **Phase 6: Browser Compatibility** (2 tests)
- Chromium browser support
- Export functionality across browsers

## Expected Test Results

### Success Criteria

All 18 tests should pass with results similar to:

```
Running 18 tests using 7 workers

✓ Phase 1: PDF Export Button and UI (2 passed)
✓ Phase 2: PDF Export Process (2 passed)
✓ Phase 3: PDF Content Validation (2 passed)
✓ Phase 3.5: Acceptance Criteria Validation (6 passed)
  - Found 3 chart(s) on analytics page
  - PDF contains 1701 characters of content
  - Survey title: Testing Survey 1
  - PDF export took 1527ms
  - PDF size: 158324 bytes
✓ Phase 4: Error Handling (2 passed)
✓ Phase 5: Performance Testing (2 passed)
✓ Phase 6: Browser Compatibility (2 passed)

18 passed (32.5s)
```

### Key Performance Metrics

- **Total Test Duration**: ~30-35 seconds
- **PDF Export Time**: ~1-2 seconds (well under 10-second limit)
- **PDF File Size**: ~150-200 KB (indicates quality content with charts)
- **PDF Text Content**: ~1,500-2,000 characters

## Understanding Test Results

### Console Output During Tests

The tests output helpful information:

```bash
Found 3 chart(s) on analytics page           # AC1: Charts detected
PDF contains 1701 characters of content      # AC2: Substantial content
Survey title: Testing Survey 1               # AC3: Professional formatting
PDF export took 1527ms                       # AC5: Performance check
PDF size: 158324 bytes                       # AC7: Quality validation
```

### Downloaded PDFs

Tests download PDFs to `e2e/f8-pdf-export/downloads/` with naming pattern:
- `ac1_charts_[timestamp].pdf`
- `ac2_content_[timestamp].pdf`
- `ac3_formatting_[timestamp].pdf`
- etc.

**Note**: PDFs are automatically cleaned up after validation to save space.

## Troubleshooting

### Issue: "Connection Refused" Error

**Problem**: Tests can't connect to localhost:3000

**Solution**:
```bash
# Ensure both servers are running
cd backend && npm start
cd frontend && npm start

# Verify servers are accessible
curl http://localhost:3000
curl http://localhost:5000
```

### Issue: "Export button not found"

**Problem**: Button selector doesn't match your implementation

**Solution**: Update the button selector in `pdf-export.spec.js` (line 35):
```javascript
const exportButton = page.locator('#yourExportButtonId');
```

### Issue: "PDF parse error"

**Problem**: PDF format is not compatible with pdf-parse

**Solution**: This is informational - the test still validates file size and download. The PDF is valid even if parsing fails.

### Issue: "Download timeout"

**Problem**: PDF generation takes longer than 30 seconds

**Solution**: Increase timeout in test or optimize PDF generation:
```javascript
const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
```

### Issue: Port 9323 already in use (Report Server)

**Problem**: Previous report server still running

**Solution**:
```bash
# Kill the existing process
lsof -ti:9323 | xargs kill -9

# Then open report again
npx playwright show-report
```

### Issue: Tests pass but no PDF downloaded

**Problem**: Test mocks may be interfering

**Solution**: These are E2E tests - ensure you're not using mock data. Real servers must be running.

## Configuration Files

### `playwright.config.local.js`

The test configuration includes:

- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Retries**: 0 (tests should be deterministic)
- **Video**: On (for debugging)
- **Screenshots**: On failure
- **Trace**: On first retry

### Helper Functions

The test file includes utility functions:

1. **`fastLogin(page, email, password)`** - Quick authentication
2. **`parsePDF(filePath)`** - Extract text from PDF
3. **`downloadPDF(page, testName)`** - Download and save PDF

## Best Practices

### Before Running Tests

1. ✅ Ensure backend and frontend servers are running
2. ✅ Verify test user account exists with survey data
3. ✅ Close unnecessary browser windows
4. ✅ Clear previous test artifacts if needed

### During Development

1. Use `--headed` mode to see what's happening
2. Use `--debug` for step-by-step execution
3. Check console logs for helpful output
4. Review screenshots/videos in test results

### After Tests

1. Review the HTML report for details
2. Check if PDFs are being generated correctly
3. Verify performance metrics are acceptable
4. Clean up downloads folder if it gets too large

## Continuous Integration (CI/CD)

For automated testing in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run F8 PDF Export Tests
  run: |
    cd suong-ngo-tests
    npx playwright test e2e/f8-pdf-export/pdf-export.spec.js --config=playwright.config.local.js --project=chromium
    
- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: suong-ngo-tests/playwright-report/
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [PDF-Parse Library](https://www.npmjs.com/package/pdf-parse)
- Project main README: `../../README.md`
- Test coverage report: `F8-Test-Coverage-and-Results-Report.md`

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the HTML test report for detailed error messages
3. Check console output for helpful debugging information
4. Verify all prerequisites are met

## Version Information

- **Playwright Version**: ^1.40.0
- **Node.js**: v24.5.0
- **PDF-Parse Version**: ^1.1.1
- **Test Framework**: Playwright Test

---

**Last Updated**: September 30, 2025  
**Test File**: `pdf-export.spec.js`  
**Total Tests**: 18  
**Estimated Runtime**: 30-35 seconds
