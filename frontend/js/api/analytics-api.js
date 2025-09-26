// Analytics API Module
// Handles all analytics-related API calls for the FeedBack-Lense platform

import { getJSONAuth } from './api.js';

const ANALYTICS_BASE = '/analytics';

/**
 * Get comprehensive survey analysis including sentiment and keywords
 * @param {string} surveyId - The survey ID to analyze
 * @param {Object} options - Analysis options
 * @param {number} options.topN - Number of top keywords to return (default: 20)
 * @param {string[]} options.extraStopwords - Additional stopwords to filter
 * @param {string} options.summaryStyle - Summary style ('report' or 'narrative')
 * @returns {Promise<Object>} Analysis result with sentiment, keywords, and summary
 */
export async function getSurveyAnalysis(surveyId, options = {}) {
  try {
    console.log('Fetching survey analysis for:', surveyId);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.topN) queryParams.append('topN', options.topN);
    if (options.extraStopwords?.length) {
      queryParams.append('extraStopwords', options.extraStopwords.join(','));
    }
    if (options.summaryStyle) queryParams.append('summaryStyle', options.summaryStyle);
    
    const queryString = queryParams.toString();
    const endpoint = `${ANALYTICS_BASE}/survey/${surveyId}/analysis${queryString ? `?${queryString}` : ''}`;
    
    const { res, data } = await getJSONAuth(endpoint);
    
    console.log('Survey analysis result:', { status: res.status, success: res.ok, data });
    
    return {
      success: res.ok,
      data: data?.analysis || null,
      surveyId: data?.surveyId || surveyId,
      status: res.status,
      error: !res.ok ? (data?.error || data?.message || 'Failed to fetch survey analysis') : null
    };
  } catch (error) {
    console.error('API Error in getSurveyAnalysis:', error);
    return {
      success: false,
      data: null,
      surveyId,
      error: error.message || 'Network error occurred while fetching survey analysis',
      networkError: true
    };
  }
}

/**
 * Get time-series data for survey responses
 * @param {string} surveyId - The survey ID
 * @param {string} interval - Time interval ('hour', 'day', 'week', 'month')
 * @param {string} timezone - IANA timezone (default: 'UTC')
 * @param {string|Date} start - Start date for filtering (optional)
 * @param {string|Date} end - End date for filtering (optional)
 * @returns {Promise<Object>} Time-series data with response counts and completion times
 */
export async function getSurveyTimeSeries(surveyId, interval = 'day', timezone = 'UTC', start = null, end = null) {
  try {
    console.log('Fetching time-series data for:', surveyId, { interval, timezone, start, end });
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('interval', interval);
    queryParams.append('tz', timezone);
    if (start) queryParams.append('start', start instanceof Date ? start.toISOString() : start);
    if (end) queryParams.append('end', end instanceof Date ? end.toISOString() : end);
    
    const endpoint = `${ANALYTICS_BASE}/survey/${surveyId}/timeseries?${queryParams.toString()}`;
    
    const { res, data } = await getJSONAuth(endpoint);
    
    console.log('Time-series result:', { status: res.status, success: res.ok, dataLength: data?.data?.length });
    
    return {
      success: res.ok,
      data: data?.data || [],
      surveyId: data?.surveyId || surveyId,
      interval: data?.interval || interval,
      timezone: data?.timezone || timezone,
      status: res.status,
      error: !res.ok ? (data?.error || data?.message || 'Failed to fetch time-series data') : null
    };
  } catch (error) {
    console.error('API Error in getSurveyTimeSeries:', error);
    return {
      success: false,
      data: [],
      surveyId,
      interval,
      timezone,
      error: error.message || 'Network error occurred while fetching time-series data',
      networkError: true
    };
  }
}

/**
 * Poll for survey updates (real-time functionality)
 * @param {string} surveyId - The survey ID to poll
 * @param {Date|string|null} since - Last update timestamp (optional)
 * @returns {Promise<Object>} Update status and new data count
 */
export async function pollSurveyUpdates(surveyId, since = null) {
  try {
    console.log('Polling survey updates for:', surveyId, 'since:', since);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (since) {
      const sinceValue = since instanceof Date ? since.toISOString() : since;
      queryParams.append('since', sinceValue);
    }
    
    const endpoint = `${ANALYTICS_BASE}/survey/${surveyId}/poll${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const { res, data } = await getJSONAuth(endpoint);
    
    // Handle different response status codes
    if (res.status === 304) {
      // Not modified - no updates
      return {
        success: true,
        updated: false,
        lastResponseAt: since,
        newCount: 0,
        status: res.status
      };
    }
    
    if (res.status === 204) {
      // No content - survey has no responses yet
      return {
        success: true,
        updated: false,
        lastResponseAt: null,
        newCount: 0,
        status: res.status
      };
    }
    
    console.log('Poll result:', { status: res.status, success: res.ok, data });
    
    return {
      success: res.ok,
      updated: data?.updated || false,
      lastResponseAt: data?.lastResponseAt || null,
      newCount: data?.newCount || 0,
      status: res.status,
      error: !res.ok ? (data?.error || data?.message || 'Failed to poll survey updates') : null
    };
  } catch (error) {
    console.error('API Error in pollSurveyUpdates:', error);
    return {
      success: false,
      updated: false,
      lastResponseAt: since,
      newCount: 0,
      error: error.message || 'Network error occurred while polling survey updates',
      networkError: true
    };
  }
}

/**
 * Get basic analytics for multiple surveys (for overview page)
 * @param {string[]} surveyIds - Array of survey IDs
 * @returns {Promise<Object>} Basic analytics for each survey
 */
export async function getMultipleSurveyAnalytics(surveyIds) {
  try {
    console.log('Fetching analytics for multiple surveys:', surveyIds);
    
    // Fetch basic analysis for each survey
    const analyticsPromises = surveyIds.map(surveyId => 
      getSurveyAnalysis(surveyId, { topN: 5, summaryStyle: 'report' })
    );
    
    const results = await Promise.allSettled(analyticsPromises);
    
    // Process results
    const analytics = {};
    results.forEach((result, index) => {
      const surveyId = surveyIds[index];
      if (result.status === 'fulfilled' && result.value.success) {
        analytics[surveyId] = result.value.data;
      } else {
        console.warn(`Failed to fetch analytics for survey ${surveyId}:`, result.reason || result.value?.error);
        analytics[surveyId] = null;
      }
    });
    
    return {
      success: true,
      analytics,
      totalSurveys: surveyIds.length,
      successCount: Object.values(analytics).filter(Boolean).length
    };
  } catch (error) {
    console.error('API Error in getMultipleSurveyAnalytics:', error);
    return {
      success: false,
      analytics: {},
      error: error.message || 'Network error occurred while fetching multiple survey analytics'
    };
  }
}

/**
 * Helper function to format analytics data for display
 * @param {Object} analyticsData - Raw analytics data from API
 * @returns {Object} Formatted data for UI consumption
 */
export function formatAnalyticsForDisplay(analyticsData) {
  if (!analyticsData) return null;
  
  const {
    topKeywords = [],
    overallSentiment = {},
    details = {},
    summary = ''
  } = analyticsData;
  
  return {
    keywords: topKeywords.slice(0, 10), // Limit for display
    sentiment: {
      score: overallSentiment.score || 0,
      label: overallSentiment.label || 'neutral',
      className: getSentimentClassName(overallSentiment.label)
    },
    stats: {
      totalAnswers: details.answersCount || 0,
      totalTokens: details.tokens || 0
    },
    summary: summary || 'No analysis available',
    hasData: details.answersCount > 0
  };
}

/**
 * Helper function to get CSS class name for sentiment
 * @param {string} sentimentLabel - Sentiment label ('positive', 'negative', 'neutral')
 * @returns {string} CSS class name
 */
function getSentimentClassName(sentimentLabel) {
  switch (sentimentLabel?.toLowerCase()) {
    case 'positive':
      return 'sentiment-positive';
    case 'negative':
      return 'sentiment-negative';
    default:
      return 'sentiment-neutral';
  }
}

/**
 * Helper function to format time-series data for Chart.js
 * @param {Array} timeSeriesData - Raw time-series data from API
 * @returns {Object} Formatted data for Chart.js
 */
export function formatTimeSeriesForChart(timeSeriesData) {
  if (!Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
    return {
      labels: [],
      datasets: [{
        label: 'Responses',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1
      }]
    };
  }
  
  const labels = timeSeriesData.map(item => {
    const date = new Date(item.periodStart);
    return date.toLocaleDateString();
  });
  
  const responseData = timeSeriesData.map(item => item.responseCount || 0);
  const completionTimeData = timeSeriesData.map(item => item.avgCompletionTime || 0);
  
  return {
    labels,
    datasets: [
      {
        label: 'Response Count',
        data: responseData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Avg Completion Time (s)',
        data: completionTimeData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };
}

// Export all functions for easy importing
export default {
  getSurveyAnalysis,
  getSurveyTimeSeries,
  pollSurveyUpdates,
  getMultipleSurveyAnalytics,
  formatAnalyticsForDisplay,
  formatTimeSeriesForChart
};
