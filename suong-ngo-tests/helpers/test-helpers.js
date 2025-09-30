/**
 * Test Helper Functions
 * Shared utilities for e2e tests across all features
 */

const { expect } = require('@playwright/test');

/**
 * Login a user with given credentials
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function loginUser(page, email, password) {
  try {
    // Navigate to signin page with retry
    await page.goto('/auth/signin.html', { waitUntil: 'networkidle' });
    
    // Wait for email field to be visible
    await page.waitForSelector('#email', { timeout: 15000 });
    
    // Fill login form
    await page.fill('#email', email);
    await page.fill('#password', password);
    
    // Click submit button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

/**
 * Logout current user
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function logoutUser(page) {
  await page.click('#userDropdown');
  await page.click('a[href="/auth/signin.html"]');
  await page.waitForURL(/.*signin\.html$/);
}

/**
 * Mock authentication token
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} token - Authentication token
 */
async function mockAuthToken(page, token = 'mock-auth-token-123') {
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
    sessionStorage.setItem('authToken', token);
  }, token);
}

/**
 * Clear authentication data
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clearAuthData(page) {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
  });
}

/**
 * Wait for API response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForApiResponse(page, urlPattern, timeout = 10000) {
  return page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200,
    { timeout }
  );
}

/**
 * Mock API response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {Object} responseData - Response data to return
 * @param {number} status - HTTP status code
 */
async function mockApiResponse(page, urlPattern, responseData, status = 200) {
  await page.route(`**/${urlPattern}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

/**
 * Mock API error response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {string} errorMessage - Error message
 * @param {number} status - HTTP status code
 */
async function mockApiError(page, urlPattern, errorMessage, status = 500) {
  await page.route(`**/${urlPattern}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: errorMessage
      })
    });
  });
}

/**
 * Wait for element to be visible with custom timeout
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForElement(page, selector, timeout = 15000) {
  try {
    return await page.waitForSelector(selector, { state: 'visible', timeout });
  } catch (error) {
    console.error(`Element not found: ${selector}`, error.message);
    throw error;
  }
}

/**
 * Wait for element to be hidden
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForElementHidden(page, selector, timeout = 10000) {
  return page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Check if element exists
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
async function elementExists(page, selector) {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Get element text content
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
async function getElementText(page, selector) {
  return page.locator(selector).textContent();
}

/**
 * Check if element is visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
async function isElementVisible(page, selector) {
  return page.locator(selector).isVisible();
}

/**
 * Take screenshot with timestamp
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Generate random email
 */
function generateRandomEmail() {
  const timestamp = Date.now();
  return `test-user-${timestamp}@example.com`;
}

/**
 * Generate random string
 * @param {number} length - String length
 */
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random survey ID
 */
function generateRandomSurveyId() {
  return Math.random().toString(36).substr(2, 24);
}

/**
 * Wait for page load
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check for console errors
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function checkConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Mock file upload
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - File input selector
 * @param {string} filePath - Path to file
 */
async function mockFileUpload(page, selector, filePath) {
  await page.setInputFiles(selector, filePath);
}

/**
 * Wait for toast notification
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} message - Expected message
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForToast(page, message, timeout = 5000) {
  await page.waitForSelector('.toast', { timeout });
  await expect(page.locator('.toast')).toContainText(message);
}

/**
 * Clear all form inputs
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clearForm(page) {
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
    });
  });
}

module.exports = {
  loginUser,
  logoutUser,
  mockAuthToken,
  clearAuthData,
  waitForApiResponse,
  mockApiResponse,
  mockApiError,
  waitForElement,
  waitForElementHidden,
  elementExists,
  getElementText,
  isElementVisible,
  takeScreenshot,
  generateRandomEmail,
  generateRandomString,
  generateRandomSurveyId,
  waitForPageLoad,
  checkConsoleErrors,
  mockFileUpload,
  waitForToast,
  clearForm
};
