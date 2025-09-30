/**
 * F6: Enhanced Analytics Page - E2E Tests
 * Tests for analytics functionality including real-time updates, charts, and keyword analysis
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
  mockApiResponses 
} = require('../../fixtures/test-data');

test.describe('F6: Enhanced Analytics Page', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await loginUser(page, mockUsers.creator.email, mockUsers.creator.password);
  });

  test.describe('Analytics Overview Page', () => {
    
    test('should load analytics overview page correctly', async ({ page }) => {
      // Mock surveys data
      await mockApiResponse(page, 'api/v1/surveys', {
        success: true,
        data: {
          surveys: [
            {
              _id: '507f1f77bcf86cd799439011',
              title: 'Customer Satisfaction Survey',
              status: 'active',
              publishDate: '2024-01-15T10:00:00Z',
              endDate: '2024-02-15T23:59:59Z',
              responseCount: 42
            },
            {
              _id: '507f1f77bcf86cd799439012',
              title: 'Product Feedback Survey',
              status: 'completed',
              publishDate: '2024-01-10T10:00:00Z',
              endDate: '2024-01-20T23:59:59Z',
              responseCount: 28
            }
          ]
        }
      });
      
      await page.goto('/dashboard/analytics.html');
      
      // Should show page title
      await expect(page.locator('.page-title')).toContainText('Analytics');
      await expect(page.locator('.page-subtitle')).toContainText('Use this page to explore and understand your analytics');
      
      // Should show surveys table
      await expect(page.locator('#surveysTable')).toBeVisible();
      await expect(page.locator('#surveysTableBody')).toBeVisible();
    });

    test('should display surveys in table format', async ({ page }) => {
      // Mock surveys data
      await mockApiResponse(page, 'api/v1/surveys', {
        success: true,
        data: {
          surveys: [
            {
              _id: '507f1f77bcf86cd799439011',
              title: 'Customer Satisfaction Survey',
              status: 'active',
              publishDate: '2024-01-15T10:00:00Z',
              endDate: '2024-02-15T23:59:59Z',
              responseCount: 42
            }
          ]
        }
      });
      
      await page.goto('/dashboard/analytics.html');
      
      // Wait for table to load
      await waitForElement(page, '#surveysTableBody tr');
      
      // Check table headers
      await expect(page.locator('th:nth-child(1)')).toContainText('Survey ID');
      await expect(page.locator('th:nth-child(2)')).toContainText('Survey Title');
      await expect(page.locator('th:nth-child(3)')).toContainText('Publish Date');
      await expect(page.locator('th:nth-child(4)')).toContainText('Status');
      await expect(page.locator('th:nth-child(5)')).toContainText('End Date');
      await expect(page.locator('th:nth-child(6)')).toContainText('Total Response');
      
      // Check survey data rows
      const rows = page.locator('#surveysTableBody tr');
      await expect(rows).toHaveCount(1);
      
      // Check first survey data
      await expect(rows.nth(0).locator('td:nth-child(1)')).toContainText('SURV001');
      await expect(rows.nth(0).locator('td:nth-child(2)')).toContainText('Customer Satisfaction');
      await expect(rows.nth(0).locator('td:nth-child(4)')).toContainText('Live');
    });

    test('should filter surveys by search term', async ({ page }) => {
      // Mock surveys data
      await mockApiResponse(page, 'api/v1/surveys', {
        success: true,
        data: {
          surveys: [
            {
              _id: '507f1f77bcf86cd799439011',
              title: 'Customer Satisfaction Survey',
              status: 'active',
              publishDate: '2024-01-15T10:00:00Z',
              endDate: '2024-02-15T23:59:59Z',
              responseCount: 42
            },
            {
              _id: '507f1f77bcf86cd799439012',
              title: 'Product Feedback Survey',
              status: 'completed',
              publishDate: '2024-01-10T10:00:00Z',
              endDate: '2024-01-20T23:59:59Z',
              responseCount: 28
            }
          ]
        }
      });
      
      await page.goto('/dashboard/analytics.html');
      
      // Wait for table to load
      await waitForElement(page, '#surveysTableBody tr');
      
      // Search for specific survey
      await page.fill('#searchSurveys', 'Customer');
      
      // Wait for search to complete
      await page.waitForTimeout(500);
      
      // Should show only matching surveys
      const rows = page.locator('#surveysTableBody tr');
      await expect(rows).toHaveCount(1);
      await expect(rows.nth(0).locator('td:nth-child(2)')).toContainText('Customer Satisfaction');
    });

    test('should navigate to individual survey analytics', async ({ page }) => {
      // Mock surveys data
      await mockApiResponse(page, 'api/v1/surveys', {
        success: true,
        data: {
          surveys: [
            {
              _id: '507f1f77bcf86cd799439011',
              title: 'Customer Satisfaction Survey',
              status: 'active',
              publishDate: '2024-01-15T10:00:00Z',
              endDate: '2024-02-15T23:59:59Z',
              responseCount: 42
            }
          ]
        }
      });
      
      await page.goto('/dashboard/analytics.html');
      
      // Wait for table to load
      await waitForElement(page, '#surveysTableBody tr');
      
      // Click on first survey row
      await page.click('#surveysTableBody tr:nth-child(1)');
      
      // Should navigate to survey analytics page
      await expect(page).toHaveURL(/.*survey-analytics\.html\?id=/);
      await expect(page.locator('#surveyName')).toBeVisible();
    });

  });

  test.describe('Individual Survey Analytics Page', () => {
    
    test('should load individual survey analytics page', async ({ page }) => {
      // Mock survey and analytics data
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Should show survey info
      await expect(page.locator('#surveyName')).toContainText('Customer Satisfaction Survey');
      await expect(page.locator('#surveyDescription')).toBeVisible();
      await expect(page.locator('#surveyStatusBadge')).toContainText('Live');
      
      // Should show metrics cards
      await expect(page.locator('#totalResponses')).toBeVisible();
      await expect(page.locator('#avgSentiment')).toBeVisible();
      await expect(page.locator('#completionRate')).toBeVisible();
      await expect(page.locator('#avgCompletionTime')).toBeVisible();
    });

    test('should display real-time status indicator', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Should show real-time status
      await expect(page.locator('#realTimeStatus')).toBeVisible();
      await expect(page.locator('#statusText')).toContainText('Connected');
      await expect(page.locator('#statusDot')).toHaveClass(/status-dot/);
      
      // Should show last update time
      await expect(page.locator('#lastUpdate')).toContainText('Last update:');
    });

    test('should display correct metrics in cards', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for metrics to load
      await waitForElement(page, '#totalResponses');
      
      // Check total responses
      await expect(page.locator('#totalResponses')).toContainText('42');
      
      // Check average sentiment
      await expect(page.locator('#avgSentiment')).toContainText('0.750');
      await expect(page.locator('#sentimentLabel')).toContainText('Positive');
      
      // Check completion rate
      await expect(page.locator('#completionRate')).toContainText('85%');
      
      // Check average completion time
      await expect(page.locator('#avgCompletionTime')).toContainText('2m 30s');
    });

  });

  test.describe('Charts and Visualizations', () => {
    
    test('should render timeline chart correctly', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for chart to load
      await waitForElement(page, '#timelineChart');
      
      // Check chart canvas is present
      const chartCanvas = page.locator('#timelineChart');
      await expect(chartCanvas).toBeVisible();
      
      // Check chart title
      await expect(page.locator('.chart-title')).toContainText('Response Timeline');
      
      // Check time range selector
      await expect(page.locator('#timeRangeSelect')).toBeVisible();
      await expect(page.locator('#timeRangeSelect option[value="7d"]')).toHaveAttribute('selected');
    });

    test('should render sentiment distribution chart', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for chart to load
      await waitForElement(page, '#sentimentChart');
      
      // Check chart canvas
      const chartCanvas = page.locator('#sentimentChart');
      await expect(chartCanvas).toBeVisible();
      
      // Check chart title
      await expect(page.locator('#sentimentCard .chart-title')).toContainText('Sentiment Distribution');
    });

    test('should render question scores chart', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for chart to load
      await waitForElement(page, '#questionScoresChart');
      
      // Check chart canvas
      const chartCanvas = page.locator('#questionScoresChart');
      await expect(chartCanvas).toBeVisible();
      
      // Check chart title
      await expect(page.locator('#questionScoresCard .chart-title')).toContainText('Question Scores');
      await expect(page.locator('#questionScoresSubtitle')).toContainText('Average score per question (0-5)');
    });

    test('should update timeline chart when range is changed', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for chart to load
      await waitForElement(page, '#timelineChart');
      
      // Change time range to 30 days
      await page.selectOption('#timeRangeSelect', '30d');
      
      // Should trigger API call for new data
      await page.waitForResponse('**/api/v1/analytics/time-series**');
      
      // Chart should still be visible
      await expect(page.locator('#timelineChart')).toBeVisible();
    });

  });

  test.describe('Keywords Analysis', () => {
    
    test('should display keywords cloud correctly', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for keywords to load
      await waitForElement(page, '#keywordsCloud');
      
      // Check keywords container
      await expect(page.locator('#keywordsCloud')).toBeVisible();
      await expect(page.locator('#topKeywordsCard .chart-title')).toContainText('Top Keywords');
      
      // Check keyword count
      await expect(page.locator('#keywordCount')).toContainText('15 keywords');
      
      // Check for keyword tags
      const keywordTags = page.locator('.keyword-tag');
      await expect(keywordTags).toHaveCount(10); // Top 10 keywords
      
      // Check keyword frequencies
      await expect(page.locator('.keyword-frequency').first()).toBeVisible();
    });

    test('should display keyword frequencies correctly', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for keywords to load
      await waitForElement(page, '#keywordsCloud');
      
      // Check that keywords are sorted by frequency
      const keywordTags = page.locator('.keyword-tag');
      const firstKeyword = keywordTags.nth(0);
      const secondKeyword = keywordTags.nth(1);
      
      // First keyword should have higher frequency
      const firstFreq = await firstKeyword.locator('.keyword-frequency').textContent();
      const secondFreq = await secondKeyword.locator('.keyword-frequency').textContent();
      
      expect(parseInt(firstFreq)).toBeGreaterThanOrEqual(parseInt(secondFreq));
    });

    test('should handle empty keywords state', async ({ page }) => {
      // Mock analytics data with no keywords
      await mockApiResponse(page, 'api/v1/analytics/507f1f77bcf86cd799439011', {
        success: true,
        data: {
          ...mockAnalyticsData.basic,
          topKeywords: []
        }
      });
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for keywords section to load
      await waitForElement(page, '#keywordsCloud');
      
      // Should show no keywords message
      await expect(page.locator('.no-keywords')).toBeVisible();
      await expect(page.locator('.no-keywords p')).toContainText('No keywords yet');
      await expect(page.locator('#keywordCount')).toContainText('0');
    });

  });

  test.describe('Real-time Updates', () => {
    
    test('should poll for updates every 15 seconds', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for initial load
      await waitForElement(page, '#totalResponses');
      
      // Mock new response data
      let pollCount = 0;
      await page.route('**/api/v1/analytics/poll**', route => {
        pollCount++;
        if (pollCount === 1) {
          // First poll - no updates
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { updated: false }
            })
          });
        } else {
          // Second poll - new updates
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { 
                updated: true, 
                newCount: 1,
                lastResponseAt: new Date().toISOString()
              }
            })
          });
        }
      });
      
      // Wait for polling to occur
      await page.waitForTimeout(20000);
      
      // Should have made at least 2 poll requests
      expect(pollCount).toBeGreaterThanOrEqual(2);
    });

    test('should show notification when new responses are received', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for initial load
      await waitForElement(page, '#totalResponses');
      
      // Mock new response notification
      await page.route('**/api/v1/analytics/poll**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { 
              updated: true, 
              newCount: 3,
              lastResponseAt: new Date().toISOString()
            }
          })
        });
      });
      
      // Wait for notification to appear
      await page.waitForSelector('.toast', { timeout: 20000 });
      
      // Should show notification
      await expect(page.locator('.toast')).toContainText('3 new responses received');
    });

  });

  test.describe('Recent Responses Table', () => {
    
    test('should display recent responses in table', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for table to load
      await waitForElement(page, '#responsesTableBody tr');
      
      // Check table headers
      await expect(page.locator('#responsesTable th:nth-child(1)')).toContainText('User email');
      await expect(page.locator('#responsesTable th:nth-child(2)')).toContainText('Satisfaction Level');
      await expect(page.locator('#responsesTable th:nth-child(3)')).toContainText('Time Spent');
      await expect(page.locator('#responsesTable th:nth-child(4)')).toContainText('Status');
      
      // Check response rows
      const rows = page.locator('#responsesTableBody tr');
      await expect(rows).toHaveCount(2); // 2 recent responses
      
      // Check first response data
      await expect(rows.nth(0).locator('td:nth-child(1)')).toContainText('user1@example.com');
      await expect(rows.nth(0).locator('td:nth-child(2)')).toContainText('Positive');
      await expect(rows.nth(0).locator('td:nth-child(4)')).toContainText('Completed');
    });

  });

  test.describe('AI Summary and Insights', () => {
    
    test('should display AI summary correctly', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for AI summary to load
      await waitForElement(page, '#aiSummary');
      
      // Check AI summary section
      await expect(page.locator('.insights-title')).toContainText('Key Insights');
      await expect(page.locator('#aiSummary')).toBeVisible();
      
      // Check regenerate button
      await expect(page.locator('.generate-summary-btn')).toContainText('Regenerate Insights');
    });

    test('should regenerate AI summary when button is clicked', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Wait for AI summary to load
      await waitForElement(page, '#aiSummary');
      
      // Click regenerate button
      await page.click('.generate-summary-btn');
      
      // Should show loading state
      await waitForToast(page, 'Regenerating AI summary');
      
      // Should show updated summary
      await expect(page.locator('#aiSummary')).toBeVisible();
    });

  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle survey not found error', async ({ page }) => {
      // Mock 404 response
      await mockApiError(page, 'api/v1/surveys/999999999999999999999999', 'Survey not found', 404);
      
      await page.goto('/dashboard/survey-analytics.html?id=999999999999999999999999');
      
      // Should show error state
      await expect(page.locator('.error-state')).toBeVisible();
      await expect(page.locator('h4')).toContainText('Unable to Load Survey Analytics');
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should handle analytics data loading error', async ({ page }) => {
      // Mock analytics API error
      await mockApiError(page, 'api/v1/analytics/**', 'Analytics service unavailable', 500);
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      // Should show error state
      await expect(page.locator('.error-state')).toBeVisible();
      await expect(page.locator('#errorMessage')).toContainText('Failed to load survey analytics data');
    });

  });

  test.describe('Performance and Accessibility', () => {
    
    test('should load analytics page within acceptable time', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      const startTime = Date.now();
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      await waitForElement(page, '#totalResponses');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should render charts within acceptable time', async ({ page }) => {
      await mockSurveyAnalyticsData(page, '507f1f77bcf86cd799439011');
      
      await page.goto('/dashboard/survey-analytics.html?id=507f1f77bcf86cd799439011');
      
      const startTime = Date.now();
      await waitForElement(page, '#timelineChart');
      await waitForElement(page, '#sentimentChart');
      await waitForElement(page, '#questionScoresChart');
      const renderTime = Date.now() - startTime;
      
      // Charts should render within 3 seconds
      expect(renderTime).toBeLessThan(3000);
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
          { title: 'High Satisfaction', description: 'Customers rate service quality highly', tone: 'positive', impact: 'high' },
          { title: 'Response Time', description: 'Some concerns about response time', tone: 'neutral', impact: 'medium' }
        ]
      },
      recentResponses: mockAnalyticsData.recentResponses
    }
  });

  // Mock polling endpoint
  await mockApiResponse(page, `api/v1/analytics/${surveyId}/poll`, {
    success: true,
    data: { updated: false }
  });
}
