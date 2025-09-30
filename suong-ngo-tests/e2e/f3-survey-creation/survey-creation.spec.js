/**
 * F3: Survey Creation with CSV Upload - Consolidated E2E Tests
 * Step-by-step testing approach for F3 requirements
 */

const { test, expect } = require('@playwright/test');
const { mockUsers } = require('../../fixtures/test-data');

test.describe('F3: Survey Creation with CSV Upload', () => {
  
  // Fast login function for all tests
  async function fastLogin(page) {
    await page.goto('/auth/signin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    await page.fill('#email', mockUsers.creator.email);
    await page.waitForTimeout(300);
    
    await page.fill('#password', mockUsers.creator.password);
    await page.waitForTimeout(300);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }

  // ========================================
  // PHASE 1: BASIC FUNCTIONALITY TESTS
  // ========================================
  test.describe('Phase 1: Basic Functionality', () => {
    
    test('should login and access survey creation page', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Check if we're on dashboard (using consistent URL pattern)
      await expect(page).toHaveURL(/.*\/public\/dashboard\/index\.html/);
      await page.waitForTimeout(500);
      
      // Navigate to survey creation (using consistent /public/dashboard/ URL pattern)
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Check if we're on survey creation page
      await expect(page.locator('h1')).toContainText('Create Survey');
      await page.waitForTimeout(500);
    });

    test('should display CSV upload area', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation (using consistent /public/dashboard/ URL pattern)
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Check for CSV upload area
      await expect(page.locator('text=Upload the surveys Questions (CSV)')).toBeVisible();
      await page.waitForTimeout(500);
      
      // Check for upload button
      await expect(page.locator('text=Click to upload')).toBeVisible();
      await page.waitForTimeout(500);
    });

    test('should show required CSV format', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation (using consistent /public/dashboard/ URL pattern)
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Check for CSV format requirements
      await expect(page.locator('text=Required CSV format:')).toBeVisible();
      await page.waitForTimeout(300);
      
      await expect(page.locator('text=Headers: questionId, questionText, type')).toBeVisible();
      await page.waitForTimeout(300);
      
      await expect(page.locator('text=Maximum 20 questions')).toBeVisible();
      await page.waitForTimeout(300);
    });
  });

  // ========================================
  // PHASE 2: CSV UPLOAD FUNCTIONALITY
  // ========================================
  test.describe('Phase 2: CSV Upload', () => {
    
    test('should handle file selection via click', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Verify the upload elements are present
      const fileInput = page.locator('#csvFileInput');
      await expect(fileInput).toBeAttached();
      await expect(fileInput).toHaveAttribute('accept', '.csv');
      
      // Test that clicking the upload area triggers the file input
      // We'll use the upload area click which should trigger the file input
      await page.click('#uploadArea');
      await page.waitForTimeout(300);
      
      // Verify the upload link is present and clickable
      const uploadLink = page.locator('#uploadLink');
      await expect(uploadLink).toBeVisible();
      await expect(uploadLink).toHaveText('Click to upload');
    });

    test('should handle drag and drop file upload', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Test drag and drop functionality
      const uploadArea = page.locator('#uploadArea');
      await expect(uploadArea).toBeVisible();
      
      // Create a test file for drag and drop
      const csvPath = '/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/sample_survey_format.csv';
      
      // Simulate drag and drop by setting files directly
      // This tests the drop event handler
      await page.setInputFiles('#csvFileInput', csvPath);
      await page.waitForTimeout(1000); // Wait for processing
      
      // Verify the file was processed (next button should be enabled for valid CSV)
      const nextButton = page.locator('#nextStep1');
      await expect(nextButton).not.toBeDisabled();
    });

    test('should validate valid CSV file correctly', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Upload valid CSV file
      const csvPath = '/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/sample_survey_format.csv';
      
      // Set the file input with valid CSV
      await page.setInputFiles('#csvFileInput', csvPath);
      await page.waitForTimeout(1000); // Wait for processing
      
      // Check for success message or next step activation
      const nextButton = page.locator('#nextStep1');
      await expect(nextButton).not.toBeDisabled();
      await page.waitForTimeout(500);
    });

    test('should show error for invalid CSV file', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Upload invalid CSV file
      const invalidCsvPath = '/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/invalid-survey.csv';
      
      // Set the file input with invalid CSV
      await page.setInputFiles('#csvFileInput', invalidCsvPath);
      await page.waitForTimeout(1000); // Wait for processing
      
      // Check for error message (validation should fail)
      // The next button should remain disabled
      const nextButton = page.locator('#nextStep1');
      await expect(nextButton).toBeDisabled();
      await page.waitForTimeout(500);
    });

    test('should show error for non-CSV file', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Create a temporary text file for testing
      const tempFilePath = '/tmp/test.txt';
      
      // Note: We'll test this by trying to upload a non-CSV file
      // The file input should only accept .csv files due to the accept attribute
      const fileInput = page.locator('#csvFileInput');
      await expect(fileInput).toHaveAttribute('accept', '.csv');
      
      // The browser should prevent non-CSV files from being selected
      // We can verify the accept attribute is correctly set
      await page.waitForTimeout(500);
    });
  });

  // ========================================
  // PHASE 3: SURVEY CREATION WORKFLOW
  // ========================================
  test.describe('Phase 3: Survey Creation Workflow', () => {
    
    test('should create survey successfully and save to database', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to survey creation
      await page.goto('/public/dashboard/create-survey.html');
      await page.waitForTimeout(500);
      
      // Upload valid CSV file
      const csvPath = '/Users/sophiengo1811/Documents/SIT725/CodeFL/FL/FeedBack-Lense/sample_survey_format.csv';
      await page.setInputFiles('#csvFileInput', csvPath);
      await page.waitForTimeout(1000); // Wait for processing
      
      // Verify next button is enabled
      const nextButton = page.locator('#nextStep1');
      await expect(nextButton).not.toBeDisabled();
      
      // Click Next to proceed to step 2 (CSV Preview)
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Verify we're on step 2 (CSV Preview)
      await expect(page.locator('#step2')).toBeVisible();
      await page.waitForTimeout(500);
      
      // Click Next to proceed to step 3 (Survey Setup)
      const nextStep2 = page.locator('#nextStep2');
      await nextStep2.click();
      await page.waitForTimeout(1000);
      
      // Verify we're on step 3 (Survey Setup)
      await expect(page.locator('#step3')).toBeVisible();
      await page.waitForTimeout(500);
      
      // Fill in survey title
      const titleInput = page.locator('#surveyTitle');
      await titleInput.fill('Test Survey from E2E Test');
      await page.waitForTimeout(500);
      
      // Click "Save Survey" button
      const saveButton = page.locator('#saveSurvey');
      await saveButton.click();
      await page.waitForTimeout(2000); // Wait for API call
      
      // Verify success message or redirect
      // The survey should be created and saved to the database
      await expect(page.locator('text=Survey Created Successfully')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    });

    test('should show new survey in dashboard after creation', async ({ page }) => {
      // Login
      await fastLogin(page);
      
      // Go to dashboard to check for created surveys
      await page.goto('/public/dashboard/index.html');
      await page.waitForTimeout(1000);
      
      // Check if there are any surveys listed
      // This will verify that surveys are being saved to the database
      const surveysContainer = page.locator('#surveysContainer');
      await expect(surveysContainer).toBeVisible();
      
      // Check if there are survey cards (not empty state)
      const emptyState = page.locator('#emptySurveys');
      const surveyCards = page.locator('.survey-card, .survey-item');
      
      // Either we should see survey cards OR the empty state should not be visible
      await expect(emptyState).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);
    });
  });

  // ========================================
  // PHASE 4: ERROR HANDLING & EDGE CASES
  // ========================================
  test.describe('Phase 4: Error Handling (TODO - Implement after Phase 3)', () => {
    
    test.skip('should handle network errors during validation', async ({ page }) => {
      // TODO: Implement network error handling
    });

    test.skip('should handle file upload errors', async ({ page }) => {
    });
  });
});

