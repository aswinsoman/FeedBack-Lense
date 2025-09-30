/**
 * F8: Analytics PDF Export Functionality - E2E Tests
 * Tests for PDF export functionality including generation, download, and error handling
 */

const { test, expect } = require('@playwright/test');
const { 
  loginUser, 
  mockApiResponse, 
  mockApiError, 
  waitForElement, 
  waitForToast,
  takeScreenshot
} = require('../../helpers/test-helpers');
const { 
  mockUsers, 
  mockSurveys, 
  mockAnalyticsData, 
  mockPdfData,
  mockApiResponses 
} = require('../../fixtures/test-data');

test.describe('F8: Analytics PDF Export Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await loginUser(page, mockUsers.creator.email, mockUsers.creator.password);
    
    // Mock survey analytics data
    await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
  });

  test.describe('PDF Export Button and UI', () => {
    
    test('should display PDF export button on analytics page', async ({ page }) => {
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Should show export button
      await expect(page.locator('#exportPdfBtn')).toBeVisible();
      await expect(page.locator('#exportPdfBtn')).toContainText('Export PDF');
      
      // Should show export icon
      await expect(page.locator('#exportPdfBtn .material-icons')).toContainText('picture_as_pdf');
    });

    test('should show export button in correct location', async ({ page }) => {
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Should be in the header section
      await expect(page.locator('.analytics-header #exportPdfBtn')).toBeVisible();
      
      // Should be positioned correctly
      const exportBtn = page.locator('#exportPdfBtn');
      await expect(exportBtn).toHaveClass(/btn/);
      await expect(exportBtn).toHaveClass(/blue/);
    });

    test('should show tooltip on hover', async ({ page }) => {
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Hover over export button
      await page.hover('#exportPdfBtn');
      
      // Should show tooltip
      await expect(page.locator('.tooltip')).toBeVisible();
      await expect(page.locator('.tooltip')).toContainText('Export analytics as PDF');
    });

  });

  test.describe('PDF Export Process', () => {
    
    test('should initiate PDF export when button is clicked', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Should show loading state
      await expect(page.locator('#exportPdfBtn .loading-spinner')).toBeVisible();
      await expect(page.locator('#exportPdfBtn')).toContainText('Generating PDF...');
      
      // Button should be disabled
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
    });

    test('should show progress indicator during export', async ({ page }) => {
      // Mock slow PDF generation
      await page.route('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockPdfData.success)
          });
        }, 2000);
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Should show progress indicator
      await expect(page.locator('.export-progress')).toBeVisible();
      await expect(page.locator('.progress-text')).toContainText('Generating PDF...');
      
      // Should show progress bar
      await expect(page.locator('.progress-bar')).toBeVisible();
    });

    test('should complete PDF export successfully', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
      await expect(page.locator('#exportPdfBtn')).toContainText('Export PDF');
    });

    test('should trigger file download after successful export', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Should have correct filename
      expect(download.suggestedFilename()).toContain('survey-analytics');
      expect(download.suggestedFilename()).toContain('.pdf');
    });

  });

  test.describe('PDF Content Validation', () => {
    
    test('should include all analytics charts in PDF', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

    test('should include survey metadata in PDF', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

    test('should include keyword analysis in PDF', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

  });

  test.describe('Error Handling', () => {
    
    test('should handle PDF generation failure', async ({ page }) => {
      // Mock PDF generation error
      await mockApiError(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', 'PDF generation failed', 500);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Should show error message
      await waitForToast(page, 'Failed to generate PDF');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
      await expect(page.locator('#exportPdfBtn')).toContainText('Export PDF');
    });

    test('should handle network errors during export', async ({ page }) => {
      // Mock network error
      await page.route('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', route => {
        route.abort('failed');
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Should show error message
      await waitForToast(page, 'Network error occurred');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
    });

    test('should handle timeout during PDF generation', async ({ page }) => {
      // Mock slow response that times out
      await page.route('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', route => {
        // Don't fulfill the request to simulate timeout
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for timeout (assuming 30 second timeout)
      await page.waitForTimeout(35000);
      
      // Should show timeout error
      await waitForToast(page, 'PDF generation timed out');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
    });

  });

  test.describe('Export Button States', () => {
    
    test('should prevent multiple exports simultaneously', async ({ page }) => {
      // Mock slow PDF generation
      await page.route('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockPdfData.success)
          });
        }, 2000);
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Button should be disabled
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
      
      // Try to click again - should not trigger another request
      await page.click('#exportPdfBtn');
      
      // Should still be disabled
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
    });

    test('should re-enable button after successful export', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Button should be disabled
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
    });

    test('should re-enable button after failed export', async ({ page }) => {
      // Mock PDF generation error
      await mockApiError(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', 'PDF generation failed', 500);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Button should be disabled
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
      
      // Wait for error
      await waitForToast(page, 'Failed to generate PDF');
      
      // Button should be re-enabled
      await expect(page.locator('#exportPdfBtn')).toBeEnabled();
    });

  });

  test.describe('File Size and Format Validation', () => {
    
    test('should handle large PDF files', async ({ page }) => {
      // Mock successful PDF generation with large file
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', {
        success: true,
        data: {
          pdfUrl: '/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf',
          filename: 'survey-analytics-large.pdf',
          generatedAt: '2024-01-19T14:30:00Z',
          fileSize: '5MB'
        }
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

    test('should validate PDF format', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Should have PDF extension
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

  });

  test.describe('Browser Compatibility', () => {
    
    test('should work in Chrome', async ({ page, browserName }) => {
      if (browserName !== 'chromium') return;
      
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      if (browserName !== 'firefox') return;
      
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

    test('should work in Safari', async ({ page, browserName }) => {
      if (browserName !== 'webkit') return;
      
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

  });

  test.describe('Performance Testing', () => {
    
    test('should complete PDF generation within acceptable time', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      const startTime = Date.now();
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(generationTime).toBeLessThan(10000);
    });

    test('should handle concurrent export requests', async ({ page }) => {
      // Mock successful PDF generation
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011/export/pdf', mockPdfData.success);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for page to load
      await waitForElement(page, '#totalResponses');
      
      // Click export button
      await page.click('#exportPdfBtn');
      
      // Button should be disabled to prevent concurrent requests
      await expect(page.locator('#exportPdfBtn')).toBeDisabled();
      
      // Wait for export to complete
      await page.waitForResponse('**/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf');
      
      // Should show success message
      await waitForToast(page, 'PDF exported successfully');
    });

  });

});

/**
 * Helper function to mock survey analytics data
 */
async function mockSurveyAnalyticsData(page, surveyId) {
  // Mock survey details
  await mockApiResponse(page, `api/v1/surveys/${surveyId}`, {
    success: true,
    data: {
      survey: {
        _id: surveyId,
        title: 'Customer Satisfaction Survey',
        description: 'A comprehensive survey about customer satisfaction',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        responseCount: 42
      }
    }
  });

  // Mock analytics data
  await mockApiResponse(page, `api/v1/analytics/${surveyId}`, {
    success: true,
    data: mockAnalyticsData.basic
  });

  // Mock time series data
  await mockApiResponse(page, `api/v1/analytics/${surveyId}/time-series**`, {
    success: true,
    data: mockAnalyticsData.timeSeries
  });

  // Mock dashboard data
  await mockApiResponse(page, `api/v1/analytics/${surveyId}/dashboard`, {
    success: true,
    data: {
      stats: { totalInvitations: 50, responseCount: 42 },
      analysis: {
        overallMetrics: { totalResponses: 42, avgCompletionTime: 150 },
        questionScores: mockAnalyticsData.questionScores,
        insights: [
          { title: 'High Satisfaction', description: 'Customers rate service quality highly', tone: 'positive', impact: 'high' }
        ]
      },
      recentResponses: mockAnalyticsData.recentResponses
    }
  });
}
