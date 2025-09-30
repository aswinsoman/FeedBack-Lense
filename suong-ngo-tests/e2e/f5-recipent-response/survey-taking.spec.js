/**
 * F5: Recipient Response Submission - E2E Tests (Simplified)
 * Tests real database integration for survey taking workflow
 */

const { test, expect } = require('@playwright/test');
const { loginUser } = require('../../helpers/test-helpers');

// Use real test users
const creator = {
  email: 'Aswin2@gmail.com',
  password: 'Feedbacklense@1234'
};

const recipient = {
  email: 'Suongngo11@gmail.com',
  password: 'Feedbacklense@1234'
};

// Helper function for fast login
async function fastLogin(page, email = recipient.email, password = recipient.password) {
  await loginUser(page, email, password);
  await page.waitForTimeout(500);
}

test.describe('F5: Recipient Response Submission', () => {
  
  // ========================================
  // PHASE 1: INVITATION ACCESS
  // ========================================
  test.describe('Phase 1: Invitation Access', () => {
    
    test('should display received invitations', async ({ page }) => {
      // AC2: Given I am logged in, when I navigate to invitations, then I can see my survey invitations
      await fastLogin(page);
      
      // Navigate to invitations page
      await page.goto('/public/dashboard/invitation.html');
      await page.waitForTimeout(1000);
      
      // Should show invitations section
      await expect(page.locator('text=Latest Invitations')).toBeVisible();
      await expect(page.locator('text=Sample survey format')).toBeVisible();
      await page.waitForTimeout(1000);
    });

    test('should navigate to survey when clicking Take Survey button', async ({ page }) => {
      // AC2: Given I am logged in, when I open the survey link, then I can access and complete the survey form
      await fastLogin(page);
      
      // Navigate to invitations page
      await page.goto('/public/dashboard/invitation.html');
      await page.waitForTimeout(1000);
      
      // Find and click the "Take Survey" button for "Sample survey format"
      const takeSurveyButtons = page.locator('button:has-text("Take Survey")');
      const firstButton = takeSurveyButtons.first();
      
      await firstButton.click();
      await page.waitForTimeout(2000);
      
      // Should navigate to take-survey page
      await expect(page).toHaveURL(/.*take-survey\.html.*/);
      
      // Should show survey content
      const surveyTitle = page.locator('.survey-title');
      const isSurveyVisible = await surveyTitle.isVisible().catch(() => false);
      expect(isSurveyVisible).toBeTruthy();
      await page.waitForTimeout(1000);
    });

  });

  // ========================================
  // PHASE 2: SURVEY RESPONSE SUBMISSION
  // ========================================
  test.describe('Phase 2: Survey Response Submission', () => {
    
    test('should complete and submit survey responses', async ({ page }) => {
      // AC3: Given I complete the survey, when I click submit, then my responses are securely saved to the database
      // AC4: Given my submission is successful, when I finish, then the system displays a confirmation message
      await fastLogin(page);
      
      // Navigate to invitations and click Take Survey
      await page.goto('/public/dashboard/invitation.html');
      await page.waitForTimeout(1000);
      
      const takeSurveyButton = page.locator('button:has-text("Take Survey")').first();
      await takeSurveyButton.click();
      await page.waitForTimeout(2000);
      
      // Wait for survey to load
      await page.waitForSelector('.survey-title', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Fill in all question types on the current page
      // Text questions
      const textInputs = page.locator('textarea:visible, input[type="text"]:visible').filter({ hasNot: page.locator('[disabled]') });
      const textCount = await textInputs.count();
      console.log('Text inputs found:', textCount);
      
      for (let i = 0; i < textCount; i++) {
        await textInputs.nth(i).fill(`Test response ${i + 1} from E2E test`);
        await page.waitForTimeout(300);
      }
      
      // Handle all radio button groups (likert scales and multiple choice)
      const allRadioButtons = page.locator('input[type="radio"]:visible');
      const radioCount = await allRadioButtons.count();
      console.log('Radio buttons found:', radioCount);
      
      if (radioCount > 0) {
        // Get all unique radio button groups by their 'name' attribute
        const radioGroups = new Set();
        for (let i = 0; i < radioCount; i++) {
          const name = await allRadioButtons.nth(i).getAttribute('name');
          if (name) {
            radioGroups.add(name);
          }
        }
        
        console.log('Radio groups found:', radioGroups.size);
        
        // Click one option for each radio group
        for (const groupName of radioGroups) {
          const groupRadios = page.locator(`input[type="radio"][name="${groupName}"]:visible`);
          const groupCount = await groupRadios.count();
          
          if (groupCount > 0) {
            // Click the middle option (or first if less than 3 options)
            const indexToClick = groupCount > 2 ? Math.floor(groupCount / 2) : 0;
            await groupRadios.nth(indexToClick).click({ force: true });
            await page.waitForTimeout(300);
          }
        }
      }
      
      // Handle checkboxes (multiple choice with checkboxes)
      const checkboxes = page.locator('input[type="checkbox"]:visible');
      const checkboxCount = await checkboxes.count();
      console.log('Checkboxes found:', checkboxCount);
      
      if (checkboxCount > 0) {
        // Click at least one checkbox for each checkbox group
        await checkboxes.first().click({ force: true });
        await page.waitForTimeout(300);
      }
      
      await page.waitForTimeout(1000);
      
      // Look for Next or Submit/Finish button
      const nextButton = page.locator('button:has-text("Next")').first();
      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Finish")').first();
      
      const hasNext = await nextButton.isVisible().catch(() => false);
      const hasSubmit = await submitButton.isVisible().catch(() => false);
      
      console.log('Next button visible:', hasNext);
      console.log('Submit/Finish button visible:', hasSubmit);
      
      if (hasNext) {
        // Click Next to go to next page
        await nextButton.click();
        await page.waitForTimeout(2000);
        
        // Fill second page if exists
        const textInputs2 = page.locator('textarea:visible, input[type="text"]:visible').filter({ hasNot: page.locator('[disabled]') });
        const textCount2 = await textInputs2.count();
        
        for (let i = 0; i < textCount2; i++) {
          await textInputs2.nth(i).fill(`Test response page 2 - ${i + 1}`);
          await page.waitForTimeout(300);
        }
        
        // Handle all radio button groups on page 2 (likert scales and multiple choice)
        const allRadioButtons = page.locator('input[type="radio"]:visible');
        const radioCount = await allRadioButtons.count();
        console.log('Radio buttons on page 2:', radioCount);
        
        if (radioCount > 0) {
          // Get all unique radio button groups by their 'name' attribute
          const radioGroups = new Set();
          for (let i = 0; i < radioCount; i++) {
            const name = await allRadioButtons.nth(i).getAttribute('name');
            if (name) {
              radioGroups.add(name);
            }
          }
          
          console.log('Radio groups on page 2:', radioGroups.size);
          
          // Click one option for each radio group
          for (const groupName of radioGroups) {
            const groupRadios = page.locator(`input[type="radio"][name="${groupName}"]:visible`);
            const groupCount = await groupRadios.count();
            
            if (groupCount > 0) {
              // Click the middle option (or first if less than 3 options)
              const indexToClick = groupCount > 2 ? Math.floor(groupCount / 2) : 0;
              await groupRadios.nth(indexToClick).click({ force: true });
              await page.waitForTimeout(300);
            }
          }
        }
        
        // Handle checkboxes on page 2 if any
        const checkboxes2 = page.locator('input[type="checkbox"]:visible');
        const checkboxCount2 = await checkboxes2.count();
        console.log('Checkboxes on page 2:', checkboxCount2);
        
        if (checkboxCount2 > 0) {
          await checkboxes2.first().click({ force: true });
          await page.waitForTimeout(300);
        }
        
        await page.waitForTimeout(1000);
        
        // Now click Submit or Finish button
        const submitButton2 = page.locator('button:has-text("Submit"), button:has-text("Finish")').first();
        await submitButton2.click();
        await page.waitForTimeout(3000);
      } else if (hasSubmit) {
        // Click Submit or Finish directly (single page survey)
        await submitButton.click();
        await page.waitForTimeout(3000);
      }
      
      // Should show confirmation or success message
      const successIndicators = [
        page.locator('text=Thank you'),
        page.locator('text=Success'),
        page.locator('text=submitted'),
        page.locator('text=completed'),
        page.locator('.success-message'),
        page.locator('.confirmation')
      ];
      
      let isSuccess = false;
      for (const indicator of successIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          isSuccess = true;
          break;
        }
      }
      
      // Or check if we're on a confirmation page
      const currentUrl = await page.url();
      const isConfirmationPage = currentUrl.includes('confirmation') || currentUrl.includes('success') || currentUrl.includes('thank');
      
      console.log('Success message visible:', isSuccess);
      console.log('Current URL:', currentUrl);
      
      expect(isSuccess || isConfirmationPage).toBeTruthy();
      await page.waitForTimeout(1000);
    });

  });

  // ========================================
  // PHASE 3: ERROR HANDLING
  // ========================================
  test.describe('Phase 3: Error Handling', () => {
    
    test('should show error when accessing survey without invitation token', async ({ page }) => {
      // AC5: Given the survey link is invalid or expired, when I attempt to access it, then the system displays an error page
      await fastLogin(page);
      
      // Try to access a survey directly without invitation token
      await page.goto('/public/dashboard/take-survey.html?id=507f1f77bcf86cd799439011');
      await page.waitForTimeout(2000);
      
      // Should show access denied or error message
      const accessDenied = page.locator('.access-denied-container');
      const errorMessage = page.locator('text=An unexpected error occurred');
      
      // Either access denied or error should be visible
      const isAccessDenied = await accessDenied.isVisible().catch(() => false);
      const isError = await errorMessage.isVisible().catch(() => false);
      
      expect(isAccessDenied || isError).toBeTruthy();
      await page.waitForTimeout(1000);
    });

  });

});
