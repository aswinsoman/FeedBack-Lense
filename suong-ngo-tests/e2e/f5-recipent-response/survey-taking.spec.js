/**
 * F5: Recipient Response Submission - E2E Tests
 * Tests for survey taking functionality including authentication and response submission
 */

const { test, expect } = require('@playwright/test');
const { 
  loginUser, 
  mockApiResponse, 
  mockApiError, 
  waitForElement, 
  waitForToast,
  takeScreenshot,
  clearAuthData
} = require('../../helpers/test-helpers');
const { 
  mockUsers, 
  mockSurveys, 
  mockResponses, 
  mockApiResponses 
} = require('../../fixtures/test-data');

test.describe('F5: Recipient Response Submission', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock survey data
    await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
      success: true,
      data: { survey: mockSurveys.basic }
    });
  });

  test.describe('Authentication & Access Control', () => {
    
    test('should redirect to login when accessing survey without authentication', async ({ page }) => {
      // Clear authentication
      await clearAuthData(page);
      
      // Try to access survey
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*signin\.html$/);
      await expect(page.locator('h1')).toContainText('Sign In');
      
      // Should preserve return URL
      const returnUrl = await page.evaluate(() => sessionStorage.getItem('returnUrl'));
      expect(returnUrl).toContain('take-survey.html');
    });

    test('should allow access to survey when authenticated', async ({ page }) => {
      // Login as recipient
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Should show survey content
      await expect(page.locator('.survey-title')).toBeVisible();
      await expect(page.locator('.survey-card')).toBeVisible();
    });

    test('should show error for non-existent survey', async ({ page }) => {
      // Mock 404 response
      await mockApiError(page, 'api/v1/surveys/999999999999999999999999', 'Survey not found', 404);
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=999999999999999999999999');
      
      // Should show access denied message
      await expect(page.locator('.access-denied-container')).toBeVisible();
      await expect(page.locator('h4')).toContainText('No Access');
    });

  });

  test.describe('Survey Loading and Display', () => {
    
    test('should display survey header information correctly', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Wait for survey to load
      await waitForElement(page, '.survey-title');
      
      // Check survey title
      await expect(page.locator('.survey-title')).toContainText('Customer Satisfaction Survey');
      
      // Check creator name
      await expect(page.locator('.survey-meta')).toContainText('Created By - John Doe');
      
      // Check creation date
      await expect(page.locator('.survey-meta')).toContainText('Created Date');
    });

    test('should render all questions correctly', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Wait for questions to load
      await waitForElement(page, '.text-question');
      
      // Check question count
      const questions = page.locator('.text-question');
      await expect(questions).toHaveCount(3);
      
      // Check question numbering
      await expect(page.locator('.question-title').nth(0)).toContainText('Q1:');
      await expect(page.locator('.question-title').nth(1)).toContainText('Q2:');
      await expect(page.locator('.question-title').nth(2)).toContainText('Q3:');
    });

    test('should render different question types correctly', async ({ page }) => {
      // Mock survey with multiple types
      await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
        success: true,
        data: { survey: mockSurveys.withMultipleTypes }
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Text question
      await expect(page.locator('.custom-textarea')).toBeVisible();
      
      // Likert scale question
      await expect(page.locator('.likert-scale')).toBeVisible();
      await expect(page.locator('input[type="radio"]')).toHaveCount(5); // 5 likert options
      
      // Multiple choice question
      await expect(page.locator('.choice-options')).toBeVisible();
      await expect(page.locator('.choice-option')).toHaveCount(3); // 3 options
    });

  });

  test.describe('Survey Navigation and Pagination', () => {
    
    test('should navigate between pages correctly', async ({ page }) => {
      // Mock survey with multiple pages
      await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
        success: true,
        data: { 
          survey: {
            ...mockSurveys.basic,
            questions: [
              ...mockSurveys.basic.questions,
              ...mockSurveys.basic.questions // Duplicate to create multiple pages
            ]
          }
        }
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Check initial page
      await expect(page.locator('.pagination-container')).toContainText('Page 1 of 2');
      
      // Navigate to next page
      await page.click('button:has-text("Next")');
      await expect(page.locator('.pagination-container')).toContainText('Page 2 of 2');
      
      // Navigate back
      await page.click('button:has-text("Previous")');
      await expect(page.locator('.pagination-container')).toContainText('Page 1 of 2');
    });

    test('should persist responses when navigating between pages', async ({ page }) => {
      // Mock survey with multiple pages
      await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
        success: true,
        data: { 
          survey: {
            ...mockSurveys.basic,
            questions: [
              ...mockSurveys.basic.questions,
              ...mockSurveys.basic.questions
            ]
          }
        }
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Fill response on page 1
      await page.fill('.custom-textarea', 'This is my response');
      
      // Navigate to page 2
      await page.click('button:has-text("Next")');
      
      // Navigate back to page 1
      await page.click('button:has-text("Previous")');
      
      // Response should still be there
      await expect(page.locator('.custom-textarea')).toHaveValue('This is my response');
    });

  });

  test.describe('Response Input and Validation', () => {
    
    test('should handle text question responses', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Fill text response
      const textResponse = 'This is a detailed response to the survey question.';
      await page.fill('.custom-textarea', textResponse);
      
      // Verify the response is captured
      await expect(page.locator('.custom-textarea')).toHaveValue(textResponse);
    });

    test('should handle likert scale responses', async ({ page }) => {
      // Mock survey with likert question
      await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
        success: true,
        data: { 
          survey: {
            ...mockSurveys.basic,
            questions: [mockSurveys.basic.questions[1]] // Only likert question
          }
        }
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Select likert response
      await page.check('input[value="4"]'); // Agree
      
      // Verify selection
      await expect(page.locator('input[value="4"]')).toBeChecked();
      
      // Change selection
      await page.check('input[value="5"]'); // Strongly Agree
      await expect(page.locator('input[value="5"]')).toBeChecked();
      await expect(page.locator('input[value="4"]')).not.toBeChecked();
    });

    test('should handle multiple choice responses', async ({ page }) => {
      // Mock survey with multiple choice question
      await mockApiResponse(page, 'api/v1/surveys/507f1f77bcf86cd799439011', {
        success: true,
        data: { 
          survey: {
            ...mockSurveys.basic,
            questions: [mockSurveys.basic.questions[2]] // Only multiple choice question
          }
        }
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Select multiple choice option
      await page.check('input[value="Option 2"]');
      
      // Verify selection
      await expect(page.locator('input[value="Option 2"]')).toBeChecked();
    });

  });

  test.describe('Survey Submission', () => {
    
    test('should submit complete survey successfully', async ({ page }) => {
      // Mock successful submission
      await mockApiResponse(page, 'api/v1/responses', mockApiResponses.responses.submit);
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Fill all responses
      await page.fill('.custom-textarea', 'This is my response');
      await page.check('input[value="4"]'); // Likert response
      await page.check('input[value="Option 1"]'); // Multiple choice
      
      // Submit survey
      await page.click('.finish-btn');
      
      // Should show completion screen
      await expect(page.locator('.survey-completed-container')).toBeVisible();
      await expect(page.locator('.survey-completed-title')).toContainText('Survey Completed');
    });

    test('should prevent submission of incomplete survey', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Leave some questions unanswered
      await page.fill('.custom-textarea', 'Only answering text question');
      // Don't answer likert or multiple choice
      
      // Try to submit
      await page.click('.finish-btn');
      
      // Should show validation error
      await waitForToast(page, 'Please provide an answer for Question');
    });

    test('should handle submission errors gracefully', async ({ page }) => {
      // Mock API error
      await mockApiError(page, 'api/v1/responses', 'Internal server error', 500);
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Fill responses
      await page.fill('.custom-textarea', 'This is my response');
      await page.check('input[value="4"]');
      
      // Submit survey
      await page.click('.finish-btn');
      
      // Should show error message
      await waitForToast(page, 'Failed to submit survey');
      
      // Submit button should be re-enabled
      await expect(page.locator('.finish-btn')).toBeEnabled();
    });

  });

  test.describe('User Experience and Interface', () => {
    
    test('should show loading states appropriately', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/v1/surveys/*', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { survey: mockSurveys.basic }
            })
          });
        }, 1000);
      });
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Should show loading spinner
      await expect(page.locator('.preloader-wrapper')).toBeVisible();
      
      // Wait for content to load
      await waitForElement(page, '.survey-title');
      await expect(page.locator('.preloader-wrapper')).not.toBeVisible();
    });

    test('should display user profile information', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Check user name display
      await expect(page.locator('#userName')).toContainText('Jane Smith');
      
      // Check user role
      await expect(page.locator('.user-role')).toContainText('User');
    });

    test('should show completion screen with correct information', async ({ page }) => {
      // Mock successful submission
      await mockApiResponse(page, 'api/v1/responses', mockApiResponses.responses.submit);
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Complete and submit survey
      await completeAndSubmitSurvey(page);
      
      // Check completion screen elements
      await expect(page.locator('.survey-completed-title')).toContainText('Survey Completed');
      await expect(page.locator('.survey-info')).toContainText('Survey ID:');
      await expect(page.locator('.survey-info')).toContainText('Completed:');
      await expect(page.locator('.survey-completed-illustration')).toBeVisible();
      
      // Check return to dashboard button
      await expect(page.locator('button:has-text("Return to Dashboard")')).toBeVisible();
    });

  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      
      // Mock network failure
      await page.route('**/api/v1/surveys/*', route => {
        route.abort('failed');
      });
      
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Should show error state
      await expect(page.locator('.error-container')).toBeVisible();
      await expect(page.locator('h5')).toContainText('An unexpected error occurred');
    });

    test('should handle session expiration during survey', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Clear authentication token
      await clearAuthData(page);
      
      // Try to submit survey
      await page.fill('.custom-textarea', 'This is my response');
      await page.click('.finish-btn');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*signin\.html$/);
    });

    test('should prevent duplicate submissions', async ({ page }) => {
      // Mock duplicate submission error
      await mockApiError(page, 'api/v1/responses', 'You have already submitted a response for this survey', 409);
      
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Complete survey
      await page.fill('.custom-textarea', 'This is my response');
      await page.check('input[value="4"]');
      
      await page.click('.finish-btn');
      
      // Should show duplicate submission error
      await waitForToast(page, 'already submitted a response');
    });

  });

  test.describe('Performance and Accessibility', () => {
    
    test('should load survey within acceptable time', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      
      const startTime = Date.now();
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      await waitForElement(page, '.survey-title');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await loginUser(page, mockUsers.recipient.email, mockUsers.recipient.password);
      await page.goto('/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should focus on textarea
      await expect(page.locator('.custom-textarea')).toBeFocused();
      
      // Type response
      await page.keyboard.type('Keyboard navigation test');
      
      // Tab to next element
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should focus on radio button
      await expect(page.locator('input[type="radio"]').first()).toBeFocused();
    });

  });

});

/**
 * Helper function to complete and submit survey
 */
async function completeAndSubmitSurvey(page) {
  // Fill text response
  await page.fill('.custom-textarea', 'This is my response');
  
  // Fill likert response
  await page.check('input[value="4"]');
  
  // Fill multiple choice response
  await page.check('input[value="Option 1"]');
  
  // Submit survey
  await page.click('.finish-btn');
  
  // Wait for completion screen
  await waitForElement(page, '.survey-completed-container');
}
