/**
 * Analytics-specific error handler
 * @param {string} operation - The operation that failed
 * @param {Error|Object} error - The error object
 * @param {string} surveyId - The survey ID (optional)
 * @returns {Object} Standardized error response
 */
export function handleAnalyticsError(operation, error, surveyId = null) {
  console.error(`Analytics ${operation} error:`, error);
  
  const errorResponse = {
    success: false,
    operation,
    surveyId,
    timestamp: new Date().toISOString()
  };
  
  // Handle different types of errors
  if (error.networkError) {
    errorResponse.error = 'Network connection failed. Please check your internet connection.';
    errorResponse.type = 'network';
  } else if (error.status === 401) {
    errorResponse.error = 'Authentication required. Please log in again.';
    errorResponse.type = 'auth';
  } else if (error.status === 403) {
    errorResponse.error = 'Access denied. You may not have permission to view this survey analytics.';
    errorResponse.type = 'permission';
  } else if (error.status === 404) {
    errorResponse.error = 'Survey not found or has no response data for analysis.';
    errorResponse.type = 'notfound';
  } else if (error.status === 500) {
    errorResponse.error = 'Server error occurred. Please try again later.';
    errorResponse.type = 'server';
  } else {
    errorResponse.error = error.message || error.error || 'An unexpected error occurred.';
    errorResponse.type = 'unknown';
  }
  
  return errorResponse;
}

/**
 * Display user-friendly error messages
 * @param {Object} errorResponse - Error response from handleAnalyticsError
 * @param {string} containerId - DOM element ID to display error (optional)
 */
export function displayAnalyticsError(errorResponse, containerId = null) {
  const { error, type, operation } = errorResponse;
  
  // Create error message element
  const errorElement = document.createElement('div');
  errorElement.className = `analytics-error error-${type}`;
  errorElement.innerHTML = `
    <div class="error-content">
      <i class="fas fa-exclamation-triangle error-icon"></i>
      <div class="error-details">
        <h5 class="error-title">Analytics ${operation} Failed</h5>
        <p class="error-message">${error}</p>
        <button class="btn btn-small waves-effect" onclick="this.parentElement.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i> Dismiss
        </button>
      </div>
    </div>
  `;
  
  // Display error
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.appendChild(errorElement);
    }
  } else {
    // Show as toast notification
    M.toast({
      html: `<i class="fas fa-exclamation-triangle"></i> ${error}`,
      classes: 'red darken-1',
      displayLength: 6000
    });
  }
  
  // Auto-remove after delay for certain error types
  if (type === 'network' || type === 'server') {
    setTimeout(() => {
      if (errorElement.parentElement) {
        errorElement.remove();
      }
    }, 10000);
  }
}

/**
 * Show loading state for analytics
 * @param {string} containerId - Container element ID (optional)
 */
export function showAnalyticsLoading(containerId = null) {
  const container = containerId ? document.getElementById(containerId) : document.body;
  if (container) {
    container.style.opacity = '0.6';
    container.style.pointerEvents = 'none';
  }
}

/**
 * Hide loading state for analytics
 * @param {string} containerId - Container element ID (optional)
 */
export function hideAnalyticsLoading(containerId = null) {
  const container = containerId ? document.getElementById(containerId) : document.body;
  if (container) {
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
  }
}

/**
 * Validate survey ID format
 * @param {string} surveyId - Survey ID to validate
 * @returns {boolean} True if valid
 */
export function validateSurveyId(surveyId) {
  if (!surveyId || typeof surveyId !== 'string') {
    return false;
  }
  
  // Check if it's a valid MongoDB ObjectId format (24 hex characters)
  return /^[0-9a-fA-F]{24}$/.test(surveyId);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return num.toLocaleString();
}

/**
 * Format percentage
 * @param {number} percentage - Percentage to format
 * @returns {string} Formatted percentage
 */
export function formatPercentage(percentage) {
  if (!percentage && percentage !== 0) return '0%';
  return `${Math.round(percentage * 10) / 10}%`;
}

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '0s';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Get color for sentiment
 * @param {string} sentiment - Sentiment label
 * @returns {string} Color class or hex
 */
export function getSentimentColor(sentiment) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return '#4caf50';
    case 'negative':
      return '#f44336';
    case 'neutral':
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
}

/**
 * Get color for status
 * @param {string} status - Status label
 * @returns {string} Color class or hex
 */
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'live':
      return '#4caf50';
    case 'completed':
    case 'complete':
      return '#2196f3';
    case 'draft':
      return '#ff9800';
    case 'closed':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

/**
 * Debounce function for search and other frequent operations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate unique ID for DOM elements
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'analytics') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export all utilities
export default {
  handleAnalyticsError,
  displayAnalyticsError,
  showAnalyticsLoading,
  hideAnalyticsLoading,
  validateSurveyId,
  formatNumber,
  formatPercentage,
  formatDuration,
  getSentimentColor,
  getStatusColor,
  debounce,
  escapeHtml,
  generateId
};
