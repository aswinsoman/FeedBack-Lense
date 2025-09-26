// Individual Survey Analytics Page Logic

console.log('🚀 Survey Analytics JS loaded');

import {
    getSurveyAnalysis,
    getSurveyTimeSeries,
    pollSurveyUpdates,
    getUserSurveys,
    getUserProfile,
    requireAuth,
    getUserSurveysData,
    getSurveyDashboard,
    getAuthToken, // Add this missing import
    // newly added helper
    patchJSONAuth
} from '../api/api.js';

// Import API_BASE for testing
const API_BASE = 'http://localhost:4000/api/v1';
import { exportSurveyPDF, isPDFExportInProgress } from './pdf-export.js';
import { clearToken } from '../lib/lib.js';

import {
    handleAnalyticsError,
    formatNumber,
    formatDuration,
    escapeHtml
} from './analytics-utils.js';

import AnalyticsRealTime from './analytics-realtime.js';

// Global state for survey analytics
const surveyState = {
    surveyId: null,
    survey: null,
    analytics: null,
    timeSeries: null,
    isLoading: false,
    error: null,
    pollingInterval: null,
    charts: {
        timeline: null,
        sentiment: null,
        questionScores: null
    },
    lastResponseAt: null,
    realTime: null,
    isIncrementalUpdating: false
};

class NotificationManager {
    constructor(minIntervalMs = 5000) {
        this.minInterval = minIntervalMs;
        this.lastShown = 0;
    }
    canShow() {
        return Date.now() - this.lastShown >= this.minInterval;
    }
    show(html, classes='blue', opts={}) {
        if(!this.canShow()) return null;
        this.lastShown = Date.now();
        return M.toast({ html, classes, displayLength: opts.displayLength || 4000, ...opts });
    }
}
const notificationManager = new NotificationManager(5000);

// 🔍 System validation functions
function validateSystemRequirements() {
    const issues = [];
    
    // Check authentication
    const token = getAuthToken();
    if (!token) {
        issues.push('No authentication token found');
    } else if (token.length < 10) {
        issues.push('Authentication token appears invalid');
    }
    
    // Check if backend is likely running
    const apiBase = 'http://localhost:4000/api/v1';
    console.log('🔍 Expected backend URL:', apiBase);
    
    return {
        valid: issues.length === 0,
        issues,
        token: !!token,
        tokenLength: token?.length || 0
    };
}

function validateSurveyId(surveyId) {
    console.log('🔍 Validating survey ID:', surveyId, 'Type:', typeof surveyId);
    
    if (!surveyId) return { valid: false, message: 'No survey ID provided' };
    
    // Convert to string if needed
    const surveyIdStr = String(surveyId).trim();
    
    if (surveyIdStr === 'undefined' || surveyIdStr === 'null') {
        return { valid: false, message: 'Survey ID is undefined. Please ensure you are navigating from a valid survey card.' };
    }
    
    // Check for MongoDB ObjectId format (24-character hex)
    if (!/^[0-9a-fA-F]{24}$/.test(surveyIdStr)) {
        return { 
            valid: false, 
            message: `Invalid survey ID format. Expected 24-character hex, got: "${surveyIdStr}" (${surveyIdStr.length} characters)` 
        };
    }
    
    return { valid: true };
}

// Initialize survey analytics page
async function initializeSurveyAnalytics() {
    console.log('🔍 Initializing Survey Analytics Page');
    
    // 🔍 Validate system requirements first
    const systemCheck = validateSystemRequirements();
    console.log('🔍 System Check:', systemCheck);
    
    if (!systemCheck.valid) {
        console.error('❌ System validation failed:', systemCheck.issues);
        showErrorState(`System validation failed: ${systemCheck.issues.join(', ')}`);
        return;
    }
    
    // Check authentication
    if (!requireAuth()) {
        console.log('❌ Authentication required');
        return;
    }
    
    try {
        // Get survey ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const surveyId = urlParams.get('id');
        
        console.log('🔍 DEBUG: Raw survey ID from URL:', surveyId);
        console.log('🔍 DEBUG: URL search params:', window.location.search);
        console.log('🔍 DEBUG: Full URL:', window.location.href);
        
        // Validate survey ID format
        const surveyIdCheck = validateSurveyId(surveyId);
        if (!surveyIdCheck.valid) {
            console.error('Survey ID validation failed:', surveyIdCheck.message);
            
            // Provide more helpful error message based on the type of error
            let userMessage = surveyIdCheck.message;
            if (surveyId === null || surveyId === 'undefined' || surveyId === 'null') {
                userMessage = `
                    <div style="text-align: left;">
                        <h5 style="color: #d32f2f; margin-bottom: 16px;">⚠️ Survey Not Found</h5>
                        <p style="margin-bottom: 12px;">The survey ID in the URL is invalid or missing.</p>
                        <p style="margin-bottom: 16px;"><strong>Possible causes:</strong></p>
                        <ul style="margin-left: 20px; margin-bottom: 16px;">
                            <li>You accessed this page directly without selecting a survey</li>
                            <li>The survey may have been deleted</li>
                            <li>There's an issue with the survey data</li>
                        </ul>
                        <p><strong>What to do:</strong></p>
                        <ul style="margin-left: 20px;">
                            <li>Go back to the <a href="index.html" style="color: #1976d2;">Dashboard</a> and select a survey</li>
                            <li>Make sure you have created surveys in your account</li>
                        </ul>
                    </div>
                `;
            }
            
            showErrorState(userMessage);
            return;
        }
        
        surveyState.surveyId = surveyId;
        console.log('📋 Survey ID:', surveyId);
        console.log('✅ Survey ID format valid');
        
        // Load user profile
        await loadUserProfile();
        
        // Initialize UI components
        initializeEventListeners();
        
        // Load survey analytics data
        await loadSurveyAnalytics(surveyId);
        
        // Start real-time polling (replaced by AnalyticsRealTime class)
        // startRealTimePolling();
        surveyState.realTime = new AnalyticsRealTime(surveyState.surveyId, handleRealTimeUpdate, { baseIntervalMs: 15000, debug: false, onStatusChange: handleRealTimeStatus });
        surveyState.realTime.start();
        
        console.log('✅ Survey Analytics initialized successfully');
    } catch (error) {
        console.error('Failed to initialize survey analytics:', error);
        showErrorState('Failed to initialize survey analytics');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const result = await getUserProfile();
        if (result.success && result.data) {
            updateUserDisplay(result.data);
        }
    } catch (error) {
        console.warn('Could not load user profile:', error);
    }
}

// Update user display
function updateUserDisplay(user) {
    const userName = document.getElementById('userName');
    if (userName && user.name) {
        userName.textContent = user.name;
    }
    // Store for dropdown usage (name + email)
    window.currentUser = user;
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('Setting up event listeners');
    
    // Timeline range selector
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', handleTimelineRangeChange);
    }
    
    // Page visibility for smart polling
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initialize Materialize components
    M.AutoInit();
    
    // Initialize end date components
    initializeEndDateComponents();

    // Initialize logout dropdown similar to dashboard
    initializeUserDropdownForAnalytics();
}

// Load survey analytics data
async function loadSurveyAnalytics(surveyId) {
    console.log('Loading survey analytics for:', surveyId);
    
    if (surveyState.isLoading) {
        console.log('Already loading, skipping duplicate request');
        return;
    }
    
    surveyState.isLoading = true;
    showLoadingStates();
    
    try {
        // 1. Load survey details first using the specific survey endpoint
        console.log('Fetching survey details...');
        
        // Try to get single survey details first
        let surveyResult = await getUserSurveysData(surveyId);
        
        if (surveyResult.success && surveyResult.data?.survey) {
            surveyState.survey = surveyResult.data.survey;
            updateSurveyInfo(surveyState.survey);
            console.log('Survey details loaded:', surveyState.survey.title);
        } else {
            // Fallback: get all surveys and find this one
            console.log('Fallback: Fetching all surveys to find specific one...');
            const allSurveysResult = await getUserSurveys();
            if (allSurveysResult.success) {
                const surveys = allSurveysResult.data?.surveys || [];
                const currentSurvey = surveys.find(s => s._id === surveyId || s.id === surveyId);
                
                if (currentSurvey) {
                    surveyState.survey = currentSurvey;
                    updateSurveyInfo(currentSurvey);
                    console.log('Survey details loaded (fallback):', currentSurvey.title);
                } else {
                    // Use demo data for testing
                    console.log('Using demo survey data for testing');
                    surveyState.survey = {
                        _id: surveyId,
                        title: 'Demo Survey - Customer Satisfaction',
                        description: 'A demonstration survey for analytics testing',
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        questionCount: 5
                    };
                    updateSurveyInfo(surveyState.survey);
                }
            } else {
                throw new Error('Unable to load survey details');
            }
        }
        
        // 2. Load real analytics data from the backend
        console.log('Fetching analytics data...');
        
        const [analyticsResult, dashboardResult] = await Promise.all([
            getSurveyAnalysis(surveyId, { topN: 20, summaryStyle: 'report' }),
            getSurveyDashboard(surveyId) // brings invitation stats + numerical question analysis
        ]);
        
        if (analyticsResult.success && analyticsResult.data) {
            console.log('✅ Real analytics data loaded');
            surveyState.analytics = transformBackendAnalytics(analyticsResult.data);
            
            // Update UI with real data
            updateMetricsCards(surveyState.analytics);
            updateKeywords(surveyState.analytics.topKeywords || []);
            updateAISummary(surveyState.analytics.summary || 'Analysis completed.');
        } else {
            console.error('❌ Analytics API failed - using minimal fallback');
            
            // Simple fallback with minimal analytics
            surveyState.analytics = {
                stats: { totalAnswers: 0, averageTime: null, completionRate: null },
                overallSentiment: { label: 'Neutral', score: 0 },
                sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
                topKeywords: [],
                summary: 'No analytics data available yet.',
                details: { answersCount: 0, totalResponses: 0 },
                overallMetrics: { totalResponses: 0, avgCompletionTime: null }
            };
            
            updateMetricsCards(surveyState.analytics);
            updateKeywords([]);
            updateAISummary('Analytics will be available once responses are collected.');
        }
        
            // Merge dashboard metrics if available
        if (dashboardResult.success && dashboardResult.data) {
            const dash = dashboardResult.data;
            
            // Calculate completion rate: number of responses / total invitations
            const totalInv = dash.stats?.totalInvitations || 0;
            const responseCount = dash.stats?.responseCount || dash.analysis?.overallMetrics?.totalResponses || 0;
            const completionRate = totalInv > 0 ? Math.round((responseCount / totalInv) * 100) : 0;
            
            // Get average completion time from dashboard
                let avgCompletionTime = dash.analysis?.overallMetrics?.avgCompletionTime || 0;
                
                // Fallback: compute average from recentResponses if primary source is missing/zero
                if ((!avgCompletionTime || avgCompletionTime === 0) && Array.isArray(dash.recentResponses)) {
                    const times = dash.recentResponses
                        .map(r => Number(r.completionTime))
                        .filter(v => Number.isFinite(v) && v > 0);
                    if (times.length) {
                        avgCompletionTime = Math.round(times.reduce((a,b) => a + b, 0) / times.length);
                    }
                }
            
            // Enhance analytics with dashboard data
            if (surveyState.analytics) {
                // Update completion rate
                surveyState.analytics.stats.completionRate = completionRate;
                
                // Update average completion time
                    if (avgCompletionTime > 0) {
                    surveyState.analytics.stats.averageTime = avgCompletionTime;
                    surveyState.analytics.overallMetrics.avgCompletionTime = avgCompletionTime;
                }
                
                // Use dashboard questionScores if available
                const qs = dash.analysis?.questionScores || [];
                if (qs.length) {
                    surveyState.questionScores = qs.map((q, idx) => ({
                        label: q.questionId || ('Q'+(idx+1)),
                        score: Math.max(0, Math.min(5, Number(q.score) || 0))
                    }));
                    const sub = document.getElementById('questionScoresSubtitle');
                    if (sub) sub.textContent = 'Average score per question (0-5)';
                }
                
                // Render insights into AI summary area if provided
                const insights = Array.isArray(dash.analysis?.insights) ? dash.analysis.insights.slice(0,4) : [];
                if (insights.length) {
                    renderInsightsInAISummary(insights);
                }
                
                // Update metrics cards with enhanced data
                updateMetricsCards(surveyState.analytics);
            }
            
            // Recent responses table (prefer backend real data)
            if (Array.isArray(dash.recentResponses) && dash.recentResponses.length) {
                const rows = dash.recentResponses.map((r, index) => ({
                    timestamp: r.submittedAt,
                    sentiment: r.sentiment,
                    completionTime: r.completionTime,
                    respondent: r.respondent?.email || `Respondent ${index+1}`
                }));
                updateRecentResponsesAdvanced(rows);
            }
        } else {
            console.warn('⚠️ Dashboard data not available, metrics may be incomplete');
            // Still update metrics cards with available analytics data
            if (surveyState.analytics) {
                updateMetricsCards(surveyState.analytics);
            }
        }
        
        // 3. Load time series data
        console.log('Fetching time series data...');
        // Corrected call signature (previously passed an object)
        const timeSeriesResult = await getSurveyTimeSeries(surveyId, 'day', 'UTC');
        
        if (timeSeriesResult.success && timeSeriesResult.data) {
            console.log('Real time series data loaded');
            surveyState.timeSeries = timeSeriesResult.data;
            integrateTimeSeriesMetrics();
        } else {
            console.warn('Time series data not available, using demo data:', timeSeriesResult.error);
            surveyState.timeSeries = generateDummyTimeSeries();
        }
        
        // 4. Render charts with the loaded data
        renderTimelineChart(surveyState.timeSeries);
        renderSentimentChart(surveyState.analytics);
        renderQuestionScoresChart(surveyState.questionScores); // pass real data if any
        
        // 5. Load recent responses (real)
        await loadRecentResponsesReal(surveyId, dashboardResult);
        
        hideLoadingStates();
        
    } catch (error) {
        console.error('❌ Failed to load survey analytics:', error);
        const errorInfo = handleAnalyticsError('survey analytics load', error, surveyId);
        showErrorState(errorInfo.error);
    } finally {
        surveyState.isLoading = false;
    }
}

// Generate dummy time series data
function generateDummyTimeSeries() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            periodStart: date.toISOString(),
            responseCount: Math.floor(Math.random() * 10) + 1,
            avgCompletionTime: Math.floor(Math.random() * 300) + 60
        });
    }
    return data;
}

// Transform backend analytics to UI format
function transformBackendAnalytics(backendData) {
    if (!backendData) return null;
    
    const sentiment = backendData.overallSentiment || {};
    const keywords = backendData.topKeywords || [];
    const details = backendData.details || {};
    const breakdown = backendData.sentimentBreakdown || backendData.sentimentDistribution || null;
    
    // Extract response count from backend data - use totalResponses for UI display
    const responseCount = details.totalResponses || details.answersCount || 0;

    // Calculate sentiment distribution from overall sentiment and response count
    // Prefer real backend-provided breakdown; fallback to derived
    const sentimentDistribution = breakdown && typeof breakdown === 'object'
        ? {
            positive: Number(breakdown.positive) || 0,
            neutral: Number(breakdown.neutral) || 0,
            negative: Number(breakdown.negative) || 0
          }
        : calculateSentimentDistribution(sentiment, responseCount);

    const transformedData = {
        stats: {
            totalAnswers: responseCount,
            averageTime: null, // Will be filled from dashboard data
            completionRate: null // Will be filled from dashboard data
        },
        overallSentiment: {
            label: sentiment.label || 'Neutral',
            score: sentiment.score != null ? Number(sentiment.score) : 0 // Fix: Check for null/undefined first
        },
        sentimentDistribution,
        topKeywords: keywords.map(k => ({
            word: k.term,
            frequency: k.count,
            stem: k.stem
        })),
        summary: backendData.summary || 'Analysis completed.',
        details: {
            answersCount: details.answersCount || 0,
            totalResponses: responseCount
        },
        overallMetrics: {
            totalResponses: responseCount,
            avgCompletionTime: null // Will be filled from dashboard data
        }
    };
    
    return transformedData;
}

// Calculate sentiment distribution from overall sentiment
function calculateSentimentDistribution(sentiment, totalCount) {
    const score = sentiment.score || 0;
    const label = sentiment.label?.toLowerCase() || 'neutral';
    
    // Distribute based on sentiment score and label
    let positive, neutral, negative;
    
    if (label === 'positive' || score > 0.3) {
        positive = Math.floor(totalCount * 0.6);
        neutral = Math.floor(totalCount * 0.3);
        negative = totalCount - positive - neutral;
    } else if (label === 'negative' || score < -0.3) {
        negative = Math.floor(totalCount * 0.5);
        neutral = Math.floor(totalCount * 0.3);
        positive = totalCount - negative - neutral;
    } else {
        neutral = Math.floor(totalCount * 0.5);
        positive = Math.floor(totalCount * 0.3);
        negative = totalCount - neutral - positive;
    }
    
    return { positive, neutral, negative };
}

// Generate dummy responses for recent responses table
function generateDummyResponses() {
    const responses = [];
    const sentiments = ['positive', 'neutral', 'negative'];
    
    for (let i = 0; i < 8; i++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - i * 2);
        
        const sentimentLabel = sentiments[Math.floor(Math.random() * sentiments.length)];
        const sentimentScore = sentimentLabel === 'positive' ? 
            Math.random() * 5 + 5 : 
            sentimentLabel === 'negative' ? 
                Math.random() * 4 : 
                Math.random() * 2 + 4;
        
        responses.push({
            timestamp: timestamp.toISOString(),
            sentiment: {
                label: sentimentLabel,
                score: sentimentScore
            }
        });
    }
    
    return responses;
}

// Update survey info display
function updateSurveyInfo(survey) {
    const titleElement = document.getElementById('surveyTitle');
    const titleMainElement = document.getElementById('surveyTitleMain');
    const nameElement = document.getElementById('surveyName');
    const descriptionElement = document.getElementById('surveyDescription');
    const statusBadge = document.getElementById('surveyStatusBadge');
    
    const surveyTitle = survey.title || 'Untitled Survey';
    
    if (titleElement) titleElement.textContent = surveyTitle;
    if (titleMainElement) titleMainElement.textContent = surveyTitle;
    if (nameElement) nameElement.textContent = surveyTitle;
    if (descriptionElement) {
        descriptionElement.textContent = survey.description || 'No description available';
    }
    if (statusBadge) {
        const status = getStatusInfo(survey.status);
        statusBadge.textContent = status.label;
        statusBadge.className = `status-badge ${status.class}`;
    }
    
    // Update page title
    document.title = `${surveyTitle} - Analytics - FeedBack-Lense`;
    
    // Update end date display
    updateEndDateDisplay();
}

// Get status information
function getStatusInfo(status) {
    switch (status?.toLowerCase()) {
        case 'active':
        case 'published':
            return { class: 'live', label: 'Live' };
        case 'completed':
        case 'closed':
            return { class: 'complete', label: 'Complete' };
        case 'draft':
            return { class: 'draft', label: 'Draft' };
        default:
            return { class: 'draft', label: 'Draft' };
    }
}

// Update metrics cards
function updateMetricsCards(analytics) {
    if (!analytics) {
        console.warn('⚠️ No analytics data provided to updateMetricsCards');
        return;
    }
    
    const stats = analytics.stats || {};
    
    // Get response count - prioritize totalResponses from backend analytics
    const responseCount = stats.totalAnswers || 
                         analytics.overallMetrics?.totalResponses || 
                         analytics.details?.totalResponses || 0;
    
    // Update total responses
    updateMetricCard('totalResponses', formatNumber(responseCount));
    
    // Update sentiment score and label
    const sentiment = analytics.overallSentiment || {};
    const sentimentScore = sentiment.score != null ? Number(sentiment.score).toFixed(3) : '0.000';
    updateMetricCard('avgSentiment', sentimentScore);
    
    // Update sentiment label
    const sentimentLabel = document.getElementById('sentimentLabel');
    if (sentimentLabel) {
        const label = sentiment.label || 'neutral';
        sentimentLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        sentimentLabel.className = `metric-change sentiment-label ${label.toLowerCase()}`;
    }
    
    // Update completion rate - ensure we show something meaningful
    const completionRate = stats.completionRate;
    const completionDisplay = completionRate != null && completionRate >= 0 ? 
                             completionRate + '%' : 
                             '0%'; // Default to 0% instead of dash
    updateMetricCard('completionRate', completionDisplay);
    
    // Update average completion time
    let avgTime = analytics.overallMetrics?.avgCompletionTime || stats.averageTime || 0;
    // If still zero, try to derive from recentResponses already rendered in state (if any)
    if ((!avgTime || avgTime === 0) && Array.isArray(window.__lastRecentRows)) {
        const times = window.__lastRecentRows.map(r => Number(r.completionTime)).filter(v => Number.isFinite(v) && v > 0);
        if (times.length) avgTime = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
    }
    const timeDisplay = avgTime > 0 ? (avgTime >= 60 ? `${Math.round(avgTime/60)}m` : `${Math.round(avgTime)}s`) : '0s';
    updateMetricCard('avgCompletionTime', timeDisplay);
}

// Update individual metric card
function updateMetricCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        
        // Add animation
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

// Enhanced Keywords Rendering (Task 2.3). Replace previous updateKeywords implementation.
function updateKeywords(keywords) {
    const keywordsCloud = document.getElementById('keywordsCloud');
    const keywordCountEl = document.getElementById('keywordCount');
    if (!keywordsCloud) return;

    // Loading state example: show spinner class if keywords === 'loading'
    if (keywords === 'loading') {
        keywordsCloud.innerHTML = `<div class="keywords-loading"><i class="fas fa-circle-notch fa-spin"></i> Loading keywords...</div>`;
        return;
    }

    if (!keywords || keywords.length === 0) {
        keywordsCloud.innerHTML = `
            <div class="no-keywords">
                <i class="fas fa-tags"></i>
                <p>No keywords yet</p>
            </div>
        `;
        if (keywordCountEl) keywordCountEl.textContent = '0';
        return;
    }
    const normalized = keywords.map(k => ({
        term: k.word || k.term || k.keyword || '',
        freq: k.frequency || k.count || k.freq || 1
    })).filter(k => k.term);
    if (normalized.length === 0) {
        keywordsCloud.innerHTML = '<div class="no-keywords">No keywords</div>';
        if (keywordCountEl) keywordCountEl.textContent = '0';
        return;
    }
    normalized.sort((a,b) => b.freq - a.freq);
    const top = normalized.slice(0,20);
    const maxFreq = top[0].freq || 1;
    const minFont = 12;
    const maxFont = 24;
    const html = top.map(item => {
        const ratio = item.freq / maxFreq;
        const size = (minFont + (maxFont - minFont) * ratio).toFixed(2);
        const opacity = (0.6 + 0.4 * ratio).toFixed(2);
        let tier = 'low-freq';
        if (ratio >= 0.7) tier = 'high-freq';
        else if (ratio >= 0.4) tier = 'medium-freq';
        const safe = escapeHtml(item.term);
        return `<span class="keyword-tag ${tier}" style="font-size:${size}px;opacity:${opacity}" title="${item.freq} occurrences">${safe}<span class="keyword-frequency">${item.freq}</span></span>`;
    }).join('');
    keywordsCloud.innerHTML = html;
    if (keywordCountEl) keywordCountEl.textContent = String(normalized.length);
}

// Update recent responses table
function updateRecentResponses(responses) {
    const responseBody = document.getElementById('responsesTableBody');
    if (!responseBody) {
        console.warn('Recent responses table body not found');
        return;
    }
    
    if (!responses || responses.length === 0) {
        responseBody.innerHTML = `
            <tr>
                <td colspan="5" class="center-align">
                    <i class="fas fa-info-circle"></i>
                    No recent responses found
                </td>
            </tr>
        `;
        return;
    }
    
    const responseRows = responses.slice(0, 10).map((response, index) => {
        const time = formatResponseTime(response.createdAt || response.timestamp);
        const sentiment = response.sentiment || { label: 'neutral', score: 0 };
        const sentimentClass = sentiment.label.toLowerCase();
        const completionTime = formatDuration((response.completionTime || Math.random() * 300 + 60));
        
        return `
            <tr class="response-row">
                <td>Respondent ${index + 1}</td>
                <td>${time}</td>
                <td>
                    <span class="sentiment-badge ${sentimentClass}">
                        <i class="fas fa-${getSentimentIcon(sentiment.label)}"></i>
                        ${sentiment.label}
                    </span>
                </td>
                <td>${completionTime}</td>
                <td>
                    <a href="#" class="btn-small waves-effect view-response-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join('');
    
    responseBody.innerHTML = responseRows;
}

// Enhanced renderer for Recent Responses with respondent email
function updateRecentResponsesAdvanced(rows){
    const responseBody = document.getElementById('responsesTableBody');
    if (!responseBody) return;
    if (!Array.isArray(rows) || rows.length===0){
        responseBody.innerHTML = `<tr><td colspan="5" class="center-align">No recent responses</td></tr>`;
        return;
    }
    const html = rows.slice(0,10).map((r, i)=>{
        const time = formatResponseTime(r.timestamp);
        const label = (r.sentiment?.label || 'neutral');
        const icon = getSentimentIcon(label);
        const dur = formatDuration(r.completionTime || 0);
        const email = r.respondent || `respondent${i+1}@mail.com`;
        const status = r.status || 'Completed';
        const statusLc = String(status).toLowerCase();
        const isRed = /not\s*completed/.test(statusLc) || /not\s*enrolled/.test(statusLc) || /cancel/.test(statusLc);
        const isGreen = statusLc === 'completed';
        const statusClass = isRed ? 'red-text' : (isGreen ? 'green-text' : 'orange-text');
        return `
            <tr class="response-row">
                <td>${email}</td>
                <td>${r.satisfactionLevel || (label ? (label.charAt(0).toUpperCase()+label.slice(1)) : '--')}</td>
                <td>${dur}</td>
                <td class="${statusClass}">${/not\s*completed/i.test(status) ? 'Not Completed' : status}</td>
            </tr>
        `;
    }).join('');
    responseBody.innerHTML = html;
}

// Render insights inside AI Summary area beneath/alongside text
function renderInsightsInAISummary(insights){
    const summaryContent = document.getElementById('aiSummary');
    if (!summaryContent) return;
    // clear loading
    summaryContent.innerHTML = '';
    const cards = insights.slice(0,4).map(ins => {
        const toneClass = (ins.tone || 'neutral').toLowerCase();
        const impact = (ins.impact || 'medium').toLowerCase();
        return `
            <div class="insight-card ${toneClass}" style="border-radius:8px;border:1px solid #eee;padding:12px 14px;margin:8px 0;background:#fff;">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                    <span class="badge ${toneClass}" style="text-transform:capitalize">${toneClass}</span>
                    <span class="badge grey lighten-3" style="text-transform:capitalize">${impact} impact</span>
                </div>
                <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(ins.title || 'Insight')}</div>
                <div style="color:#555;font-size:0.95em;">${escapeHtml(ins.description || '')}</div>
            </div>
        `;
    }).join('');
    summaryContent.innerHTML = cards;
}

// Format response time
function formatResponseTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Get sentiment icon
function getSentimentIcon(sentiment) {
    switch (sentiment?.toLowerCase()) {
        case 'positive': return 'smile';
        case 'negative': return 'frown';
        case 'neutral': return 'meh';
        default: return 'meh';
    }
}

// Update AI summary
function updateAISummary(summary) {
    const summaryContent = document.getElementById('aiSummaryContent');
    if (!summaryContent) return;
    
    if (!summary) {
        summaryContent.innerHTML = `
            <div class="ai-summary-empty">
                <i class="fas fa-info-circle"></i>
                <p>AI summary will be generated as more responses are collected.</p>
            </div>
        `;
        return;
    }
    
    summaryContent.innerHTML = `
        <div class="ai-summary-text">
            <p>${escapeHtml(summary)}</p>
        </div>
    `;
}

// Render timeline chart
function renderTimelineChart(timeSeriesData) {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) {
        console.warn('Timeline chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (surveyState.charts.timeline) {
        surveyState.charts.timeline.destroy();
    }

    // Remove previous empty overlay if any
    const parent = canvas.parentNode;
    const oldOverlay = parent.querySelector('.chart-empty-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Normalize & sort data (day granularity)
    let points = [];
    if (Array.isArray(timeSeriesData)) {
        points = timeSeriesData.map(item => ({
            date: new Date(item.periodStart || item.date),
            count: item.responseCount || item.count || 0
        })).filter(p => !isNaN(p.date.getTime()))
          .sort((a,b) => a.date - b.date);
    }

    // Fill missing days (based on first->last)
    if (points.length > 1) {
        const filled = [];
        let cursor = new Date(points[0].date);
        const end = new Date(points[points.length - 1].date);
        const map = new Map(points.map(p => [p.date.toDateString(), p.count]));
        while (cursor <= end) {
            const key = cursor.toDateString();
            filled.push({ date: new Date(cursor), count: map.get(key) || 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
        points = filled;
    }

    const labels = points.map(p => p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const dataValues = points.map(p => p.count);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(33,150,243,0.30)');
    gradient.addColorStop(1, 'rgba(33,150,243,0)');

    // If no data, create subtle placeholder (still render empty chart for consistent layout)
    const allZero = dataValues.length === 0 || dataValues.every(v => v === 0);
    if (dataValues.length === 0) {
        labels.push('No Data');
        dataValues.push(0);
    }

    surveyState.charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Responses',
                data: dataValues,
                borderColor: '#2196f3',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2196f3',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: ctx => (ctx.dataIndex === dataValues.length - 1 ? 5 : 3),
                pointHoverRadius: 6,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: { weight: '600' },
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y} response${ctx.parsed.y === 1 ? '' : 's'}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
                },
                y: {
                    beginAtZero: true,
                    grace: '5%',
                    ticks: { precision: 0 },
                    grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false }
                }
            }
        }
    });

    if (allZero) {
        const overlay = document.createElement('div');
        overlay.className = 'chart-empty-overlay';
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.pointerEvents = 'none';
        overlay.style.fontSize = '14px';
        overlay.style.color = '#64748b';
        overlay.style.fontWeight = '500';
        overlay.innerHTML = '<div><i class="fas fa-info-circle" style="margin-right:6px;"></i>No responses in selected range</div>';
        parent.style.position = 'relative';
        parent.appendChild(overlay);
    }
}

// Render sentiment chart (Step 4 incremental-friendly)
function renderSentimentChart(analytics) {
    const canvas = document.getElementById('sentimentChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sentimentData = analytics.sentimentDistribution || { positive: 0, neutral: 0, negative: 0 };
    const total = (sentimentData.positive || 0) + (sentimentData.neutral || 0) + (sentimentData.negative || 0);
    const fmtPct = v => total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';
    const newValues = [
        sentimentData.positive || 0,
        sentimentData.neutral || 0,
        sentimentData.negative || 0
    ];
    // If chart already exists, update dataset values directly (no destroy)
    if (surveyState.charts.sentiment) {
        const chart = surveyState.charts.sentiment;
        // Assume single dataset order [Positive, Neutral, Negative]
        chart.data.datasets[0].data = newValues;
        chart.update('none'); // minimal redraw, no animation to keep CPU low
        return;
    }
    // Initial create
    surveyState.charts.sentiment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                `Very Satisfied: ${fmtPct(sentimentData.positive || 0)}`,
                `Neutral: ${fmtPct(sentimentData.neutral || 0)}`,
                `Dissatisfied: ${fmtPct(sentimentData.negative || 0)}`
            ],
            datasets: [{
                data: newValues,
                backgroundColor: ['#4caf50','#ff9800','#f44336'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Update Question Scores chart to use 0-5 range when given questionScores
function renderQuestionScoresChart(scoresData) {
    const canvas = document.getElementById('questionScoresChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let data = scoresData;
    if (!Array.isArray(data) || data.length === 0) {
        // keep existing fallback
        data = [
            { label: 'Q1', score: Math.random() * 5 + 5 },
            { label: 'Q2', score: Math.random() * 5 + 5 },
            { label: 'Q3', score: Math.random() * 5 + 5 },
            { label: 'Q4', score: Math.random() * 5 + 5 }
        ];
    }

    const labels = data.map(d => d.label);
    const values = data.map(d => Number((d.score ?? 0).toFixed(2)));

    if (surveyState.charts.questionScores) {
        surveyState.charts.questionScores.destroy();
    }

    surveyState.charts.questionScores = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Score (0-5)',
                data: values,
                backgroundColor: ['#1976d2','#42a5f5','#66bb6a','#ff9800'],
                borderRadius: 8,
                maxBarThickness: 70
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    callbacks: {
                        label: ctx => ` Score: ${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { weight: '600' } } },
                y: { beginAtZero: true, suggestedMax: 5, max: 5, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false } }
            }
        }
    });

    const info = document.getElementById('questionScoresInfo');
    if (info) info.textContent = `${values.length} questions`;
}

// Remove legacy real-time polling functions (startRealTimePolling, pollForUpdates) and replace with new handler
// Legacy functions kept commented for quick rollback if needed.
/*
function startRealTimePolling() { /* removed by Step 3 refactor */ /* }
async function pollForUpdates() { /* removed by Step 3 refactor */ /* }
*/
// New real-time update handler
function handleRealTimeUpdate(payload) {
    if (!payload) return;
    const { updated, lastResponseAt, newCount } = payload;
    if (updated !== true) {
        return; // freshness handled by realtime class
    }
    if (lastResponseAt && surveyState.lastResponseAt && new Date(lastResponseAt) <= new Date(surveyState.lastResponseAt)) {
        return;
    }
    if (lastResponseAt) surveyState.lastResponseAt = lastResponseAt;
    if (surveyState.isIncrementalUpdating) return; // guard
    surveyState.isIncrementalUpdating = true;

    incrementalRefresh().finally(() => {
        surveyState.isIncrementalUpdating = false;
        if (newCount > 0) {
            notificationManager.show(`<i class='fas fa-bell'></i> ${newCount} new response${newCount>1?'s':''} received <button class='btn-flat toast-action' id='toastViewNew'>View</button>`, 'blue');
            setTimeout(() => {
                const btn = document.getElementById('toastViewNew');
                if (btn) {
                    btn.addEventListener('click', () => {
                        const table = document.getElementById('responsesTable');
                        if (table) table.scrollIntoView({ behavior: 'smooth' });
                    });
                }
            }, 50);
        }
    });
}

async function incrementalRefresh() {
    try {
        const surveyId = surveyState.surveyId;
        if (!surveyId) return;
        const [analysisRes, tsRes] = await Promise.all([
            getSurveyAnalysis(surveyId, { topN: 20, summaryStyle: 'concise' }),
            getSurveyTimeSeries(surveyId, 'day', 'UTC')
        ]);
        if (analysisRes.success) {
            const transformed = transformBackendAnalytics(analysisRes.data);
            animateMetricsUpdate(surveyState.analytics, transformed);
            surveyState.analytics = transformed;
            updateKeywords(surveyState.analytics.topKeywords || surveyState.analytics.keywords || []);
            updateAISummary(surveyState.analytics.summary || surveyState.analytics.aiSummary);
            updateSentimentChartIncremental(surveyState.analytics);
        }
        if (tsRes.success) {
            surveyState.timeSeries = tsRes.data;
            integrateTimeSeriesMetrics();
            updateTimelineChartIncremental(surveyState.timeSeries);
        }
    } catch (e) {
        console.warn('Incremental refresh failed', e);
    }
}

// === Live Metric Animation Utilities (F6 Task 2.2) ===
function tweenNumber(el, from, to, duration = 600, formatter = v => v.toString()) {
  if (!el) return;
  if (from === to) { el.textContent = formatter(to); return; }
  const start = performance.now();
  const diff = to - from;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; // easeInOutCubic
    const current = from + diff * eased;
    el.textContent = formatter(diff % 1 === 0 ? Math.round(current) : current.toFixed(1));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function setMetricChangeIndicator(wrapperId, delta) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  let indicator = wrap.querySelector('.metric-change-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'metric-change-indicator';
    wrap.appendChild(indicator);
  }
  if (!delta || delta === 0) {
    indicator.textContent = '';
    indicator.className = 'metric-change-indicator';
    return;
  }
  const up = delta > 0;
  indicator.textContent = up ? `↑ ${Math.abs(delta)}` : `↓ ${Math.abs(delta)}`;
  indicator.className = 'metric-change-indicator ' + (up ? 'up' : 'down');
}

function animateMetricsUpdate(prev, next) {
    if (!next) return;
    const statsNext = next.stats || {};
    const statsPrev = (prev && prev.stats) || {};

    // Total Responses
    const totalPrev = statsPrev.totalAnswers || prev?.overallMetrics?.totalResponses || 0;
    const totalNext = statsNext.totalAnswers || next.overallMetrics?.totalResponses || 0;
    tweenNumber(document.getElementById('totalResponses'), totalPrev, totalNext, 700, v => formatNumber(Math.round(v)));
    setMetricChangeIndicator('totalResponsesWrapper', totalNext - totalPrev);

    // Sentiment score (avg) if available
    const sentPrev = (prev?.overallSentiment?.score) || 0;
    const sentNext = (next?.overallSentiment?.score) || 0;
    tweenNumber(document.getElementById('avgSentiment'), sentPrev, sentNext, 700, v => Number(v).toFixed(3));
    setMetricChangeIndicator('avgSentimentWrapper', +(sentNext - sentPrev).toFixed(3));

    // Completion rate
    // Preserve prior completionRate if the new payload (analysis-only) lacks it
    const compPrev = statsPrev.completionRate || 0;
    const compNext = (statsNext.completionRate ?? compPrev ?? 0);
    // ensure next carries forward the preserved value for subsequent renders
    next.stats = next.stats || {};
    next.stats.completionRate = compNext;
    tweenNumber(document.getElementById('completionRate'), compPrev, compNext, 700, v => `${Math.round(v)}%`);
    setMetricChangeIndicator('completionRateWrapper', Math.round(compNext - compPrev));

    // Avg completion time (seconds)
    const avgPrev = next.overallMetrics ? (prev?.overallMetrics?.avgCompletionTime || 0) : (statsPrev.averageTime || 0);
    let avgNext = next.overallMetrics?.avgCompletionTime || statsNext.averageTime || 0;
    // Preserve previously known non-zero average if the incoming payload lacks it
    if ((!avgNext || avgNext === 0) && avgPrev > 0) {
        avgNext = avgPrev;
        next.overallMetrics = next.overallMetrics || {};
        next.stats = next.stats || {};
        next.overallMetrics.avgCompletionTime = avgNext;
        next.stats.averageTime = avgNext;
    }
    tweenNumber(document.getElementById('avgCompletionTime'), avgPrev, avgNext, 700, v => formatDuration(Math.round(v)));
    setMetricChangeIndicator('avgCompletionTimeWrapper', Math.round(avgNext - avgPrev));

    // Fallback to updateMetricsCards for any remaining bits (labels etc.)
    updateMetricsCards(next);
}

// Smooth incremental timeline chart update with animation (overwrite previous function if defined)
function updateTimelineChartIncremental(timeSeriesData) {
    const chart = surveyState.charts.timeline;
    if (!chart) { renderTimelineChart(timeSeriesData); return; }
    const latestData = Array.isArray(timeSeriesData) ? timeSeriesData.map(item => ({
        date: new Date(item.periodStart || item.date),
        count: item.responseCount || item.count || 0
    })).sort((a,b)=>a.date-b.date) : [];
    if (latestData.length===0) return;
    const lastPoint = latestData[latestData.length-1];
    const lastLabel = lastPoint.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const labels = chart.data.labels;
    const dataArr = chart.data.datasets[0].data;
    let changed = false;
    if (labels[labels.length-1] === lastLabel) {
        if (dataArr[dataArr.length-1] !== lastPoint.count) {
            dataArr[dataArr.length-1] = lastPoint.count; changed = true; }
    } else {
        labels.push(lastLabel);
        dataArr.push(lastPoint.count);
        if (labels.length > 30) { labels.shift(); dataArr.shift(); }
        changed = true;
    }
    if (changed) {
        chart.update('active'); // allow animation
    }
}

function updateSentimentChartIncremental(analytics) {
    const chart = surveyState.charts.sentiment;
    if (!chart || !analytics) { renderSentimentChart(analytics); return; }
    const pos = analytics.positiveCount || analytics.sentimentBreakdown?.positive || analytics.sentimentDistribution?.positive || 0;
    const neg = analytics.negativeCount || analytics.sentimentBreakdown?.negative || analytics.sentimentDistribution?.negative || 0;
    const neu = analytics.neutralCount || analytics.sentimentBreakdown?.neutral || analytics.sentimentDistribution?.neutral || 0;
    const total = pos + neu + neg;
    const fmtPct = v => total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';
    chart.data.datasets[0].data = [pos, neu, neg];
    chart.data.labels = [
        `Very Satisfied: ${fmtPct(pos)}`,
        `Neutral: ${fmtPct(neu)}`,
        `Dissatisfied: ${fmtPct(neg)}`
    ];
    chart.update('none');
}

// Attach to window for debugging
window.handleRealTimeUpdate = handleRealTimeUpdate;

function handleRealTimeStatus(evt){
    if(!evt) return;
    const { state, meta } = evt;
    if(state==='error' && meta?.consecutiveFailures===3){
        notificationManager.show("<i class='fas fa-wifi'></i> Connection issues (retrying)", 'orange');
    }
    if(state==='active' && (window.__lastRTState==='error' || window.__lastRTState==='paused')){
        notificationManager.show("<i class='fas fa-check-circle'></i> Real-time connection restored", 'green');
    }
    window.__lastRTState = state;
}

// Start real-time polling
function startRealTimePolling() {
    console.log('🔄 Starting real-time polling');
    
    if (surveyState.pollingInterval) {
        clearInterval(surveyState.pollingInterval);
    }
    
    surveyState.pollingInterval = setInterval(async () => {
        if (!document.hidden) {
            await pollForUpdates();
        }
    }, 30000);
    
    const indicator = document.getElementById('realTimeIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

// Poll for updates
async function pollForUpdates() {
    if (!surveyState.surveyId) return;
    
    try {
        console.log('🔄 Polling for updates...');
        const result = await pollSurveyUpdates(surveyState.surveyId);
        
        if (result.success) {
            if (result.data?.updated) {
                console.log('🔄 New updates detected:', result.data);
                
                M.toast({
                    html: '<i class="fas fa-sync-alt"></i> New responses detected!',
                    classes: 'blue',
                    displayLength: 3000
                });
                
                // Reload analytics data
                await loadSurveyAnalytics(surveyState.surveyId);
            } else {
                console.log('📊 No new updates');
            }
        } else {
            console.warn('Polling failed:', result.error);
        }
    } catch (error) {
        console.warn('Polling error:', error);
        // Don't show error toast for polling failures as they're not critical
    }
}

// Handle timeline range change
function handleTimelineRangeChange(event) {
    const range = event.target.value;
    console.log('📊 Timeline range changed to:', range);
    if (surveyState.surveyId) {
        getSurveyTimeSeries(surveyState.surveyId, range, 'UTC').then(timeSeriesResult => {
            if (timeSeriesResult.success) {
                surveyState.timeSeries = timeSeriesResult.data;
                integrateTimeSeriesMetrics();
                renderTimelineChart(surveyState.timeSeries);
            }
        }).catch(error => console.error('Failed to reload timeline data:', error));
    }
}

// Handle page visibility changes for smart polling
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('🔄 Page hidden, pausing polling');
    } else {
        console.log('🔄 Page visible, resuming polling');
        // Poll immediately when page becomes visible again
        pollForUpdates();
    }
}

// Show/hide loading states
function showLoadingStates() {
    console.log('📋 Showing loading states');
    
    // Show loading indicators
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(el => {
        el.style.display = 'block';
    });
    
    // Hide content temporarily
    const contentElements = document.querySelectorAll('.analytics-content');
    contentElements.forEach(el => {
        el.style.opacity = '0.6';
    });
}

function hideLoadingStates() {
    console.log('📋 Hiding loading states');
    
    // Hide loading indicators
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Show content
    const contentElements = document.querySelectorAll('.analytics-content');
    contentElements.forEach(el => {
        el.style.opacity = '1';
    });
}

// Show error state
function showErrorState(errorMessage) {
    console.error('❌ Error:', errorMessage);
    
    // Hide loading states
    hideLoadingStates();
    
    // Find the main content area and replace it with error message
    const mainContent = document.querySelector('.main-content .analytics-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 60px 40px; max-width: 600px; margin: 0 auto;">
                <div style="font-size: 64px; color: #f44336; margin-bottom: 24px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div style="font-size: 18px; color: #333; line-height: 1.6;">
                    ${errorMessage}
                </div>
                <div style="margin-top: 32px;">
                    <a href="index.html" class="btn waves-effect waves-light blue" style="margin-right: 16px;">
                        <i class="fas fa-home"></i> Go to Dashboard
                    </a>
                    <button onclick="window.location.reload()" class="btn waves-effect waves-light grey">
                        <i class="fas fa-refresh"></i> Reload Page
                    </button>
                </div>
            </div>
        `;
    } else {
        // Fallback to toast if main content area not found
        M.toast({
            html: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`,
            classes: 'red',
            displayLength: 5000
        });
    }
}

// Action functions
function refreshSurveyAnalytics() {
    console.log('🔄 Manual refresh requested');
    
    M.toast({
        html: '<i class="fas fa-sync-alt"></i> Refreshing analytics...',
        classes: 'blue'
    });
    
    loadSurveyAnalytics(surveyState.surveyId);
}

async function exportToPDF() {
    console.log('🔄 PDF Export initiated');
    
    // Get survey ID
    const surveyId = surveyState.surveyId;
    console.log('📋 Survey ID for export:', surveyId);
    
    if (!surveyId) {
        console.error('❌ No survey ID available for export');
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> No survey selected for export',
            classes: 'red',
            displayLength: 4000
        });
        return;
    }

    try {
        console.log('🚀 Starting PDF export process...');
        
        // Export PDF with full format - let the PDF export manager handle all state management
        const result = await exportSurveyPDF(surveyId, 'full');
        
        if (result.success) {
            console.log('✅ PDF export successful:', result.filename, 'Size:', result.size);
        } else {
            console.error('❌ PDF export failed:', result.error);
        }
    } catch (error) {
        console.error('❌ PDF export error:', error);
        // Error handling is already done by the PDF export manager
    }
}

function viewAllResponses() {
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Detailed responses view coming soon!',
        classes: 'orange'
    });
}

function exportResponses() {
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Response export feature coming soon!',
        classes: 'orange'
    });
}

function generateSummary() {
    M.toast({
        html: '<i class="fas fa-sync-alt"></i> Regenerating AI summary...',
        classes: 'blue'
    });
    
    // Regenerate summary if we have analytics data
    if (surveyState.analytics && surveyState.analytics.summary) {
        updateAISummary(surveyState.analytics.summary);
    }
}

// End Date Management Functions
function openEndDateModal() {
    const modal = M.Modal.getInstance(document.getElementById('endDateModal'));
    
    // Update modal with current end date if exists
    if (surveyState.survey && surveyState.survey.endDate) {
        const endDate = new Date(surveyState.survey.endDate);
        document.getElementById('currentEndDate').textContent = endDate.toLocaleString();
        document.getElementById('currentEndDateInfo').style.display = 'block';
        document.getElementById('removeEndDateBtn').style.display = 'inline-block';
        
        // Pre-fill the date and time pickers
        const datePicker = M.Datepicker.getInstance(document.getElementById('endDatePicker'));
        const timePicker = M.Timepicker.getInstance(document.getElementById('endTimePicker'));
        
        if (datePicker) datePicker.setDate(endDate);
        if (timePicker) timePicker.setTime(endDate.getHours() + ':' + endDate.getMinutes().toString().padStart(2, '0'));
    } else {
        document.getElementById('currentEndDateInfo').style.display = 'none';
        document.getElementById('removeEndDateBtn').style.display = 'none';
    }
    
    modal.open();
}

async function saveEndDate() {
    try {
        const dateInput = document.getElementById('endDatePicker');
        const timeInput = document.getElementById('endTimePicker');
        
        if (!dateInput.value) {
            M.toast({
                html: '<i class="fas fa-exclamation-triangle"></i> Please select an end date',
                classes: 'orange'
            });
            return;
        }
        
        // Combine date and time
        const selectedDate = M.Datepicker.getInstance(dateInput).date;
        const timeValue = timeInput.value || '23:59';
        const [hours, minutes] = timeValue.split(':');
        
        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Validate end date is in the future
        if (endDateTime <= new Date()) {
            M.toast({
                html: '<i class="fas fa-exclamation-triangle"></i> End date must be in the future',
                classes: 'red'
            });
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveEndDateBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        // Call API to update end date using centralized helper (ensures /api/v1 base & auth)
        const { res, data } = await patchJSONAuth(`/surveys/${surveyState.surveyId}/end-date`, {
            endDate: endDateTime.toISOString()
        });
        if (!res.ok) {
            throw new Error(data?.error || 'Failed to update end date');
        }
        
        // Update local state
        if (surveyState.survey) {
            surveyState.survey.endDate = endDateTime;
            surveyState.survey.status = data.survey?.status || surveyState.survey.status;
        }
        
        // Update UI
        updateEndDateDisplay();
        
        // Close modal
        const modal = M.Modal.getInstance(document.getElementById('endDateModal'));
        modal.close();
        
        // Show success message
        M.toast({
            html: '<i class="fas fa-check"></i> Survey end date updated successfully!',
            classes: 'green'
        });
        
        // Restore button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
    } catch (error) {
        console.error('Error saving end date:', error);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Failed to update end date',
            classes: 'red'
        });
        
        // Restore button state
        const saveBtn = document.getElementById('saveEndDateBtn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save End Date';
        saveBtn.disabled = false;
    }
}

async function removeEndDate() {
    try {
        // Show loading state
        const removeBtn = document.getElementById('removeEndDateBtn');
        const originalText = removeBtn.innerHTML;
        removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
        removeBtn.disabled = true;
        
        // Call API to remove end date (set to null)
        const { res, data } = await patchJSONAuth(`/surveys/${surveyState.surveyId}/end-date`, { endDate: null });
        if (!res.ok) {
            throw new Error(data?.error || 'Failed to remove end date');
        }
        
        // Update local state
        if (surveyState.survey) {
            surveyState.survey.endDate = null;
        }
        
        // Update UI
        updateEndDateDisplay();
        
        // Close modal
        const modal = M.Modal.getInstance(document.getElementById('endDateModal'));
        modal.close();
        
        // Show success message
        M.toast({
            html: '<i class="fas fa-check"></i> Survey end date removed successfully!',
            classes: 'green'
        });
        
        // Restore button state
        removeBtn.innerHTML = originalText;
        removeBtn.disabled = false;
        
    } catch (error) {
        console.error('Error removing end date:', error);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Failed to remove end date',
            classes: 'red'
        });
        
        // Restore button state
        const removeBtn = document.getElementById('removeEndDateBtn');
        removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove End Date';
        removeBtn.disabled = false;
    }
}

function updateEndDateDisplay() {
    const endDateInfo = document.getElementById('surveyEndDateInfo');
    const endDateStatus = document.getElementById('endDateStatus');
    
    if (surveyState.survey && surveyState.survey.endDate) {
        const endDate = new Date(surveyState.survey.endDate);
        const now = new Date();
        const isExpired = endDate <= now;
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        if (isExpired) {
            endDateStatus.innerHTML = `<span class="red-text">Expired on ${endDate.toLocaleDateString()}</span>`;
            endDateInfo.className = 'survey-end-date red-text';
        } else if (daysRemaining <= 1) {
            endDateStatus.innerHTML = `<span class="orange-text">Expires today at ${endDate.toLocaleTimeString()}</span>`;
            endDateInfo.className = 'survey-end-date orange-text';
        } else if (daysRemaining <= 7) {
            endDateStatus.innerHTML = `<span class="orange-text">Expires in ${daysRemaining} days</span>`;
            endDateInfo.className = 'survey-end-date orange-text';
        } else {
            endDateStatus.innerHTML = `<span class="green-text">Expires ${endDate.toLocaleDateString()}</span>`;
            endDateInfo.className = 'survey-end-date green-text';
        }
    } else {
        endDateStatus.textContent = 'No end date set';
        endDateInfo.className = 'survey-end-date';
    }
}

// Initialize Materialize components for end date modal
function initializeEndDateComponents() {
    // Initialize modal
    const modal = document.getElementById('endDateModal');
    if (modal) {
        M.Modal.init(modal);
    }
    
    // Initialize date picker
    const datePicker = document.getElementById('endDatePicker');
    if (datePicker) {
        M.Datepicker.init(datePicker, {
            minDate: new Date(),
            format: 'yyyy-mm-dd',
            yearRange: [new Date().getFullYear(), new Date().getFullYear() + 2]
        });
    }
    
    // Initialize time picker
    const timePicker = document.getElementById('endTimePicker');
    if (timePicker) {
        M.Timepicker.init(timePicker, {
            twelveHour: false,
            defaultTime: '23:59'
        });
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (surveyState.realTime) surveyState.realTime.stop();
    if (surveyState.pollingInterval) {
        clearInterval(surveyState.pollingInterval);
    }
});

// Expose functions globally
window.refreshSurveyAnalytics = refreshSurveyAnalytics;
window.exportToPDF = exportToPDF;
window.viewAllResponses = viewAllResponses;
window.exportResponses = exportResponses;
window.generateSummary = generateSummary;
window.openEndDateModal = openEndDateModal;
window.saveEndDate = saveEndDate;
window.removeEndDate = removeEndDate;
window.renderQuestionScoresChart = renderQuestionScoresChart;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeSurveyAnalytics);

export { initializeSurveyAnalytics };

// Add integrateTimeSeriesMetrics to compute avg time & completion if time series supplies it
function integrateTimeSeriesMetrics() {
    if (!surveyState.timeSeries || !Array.isArray(surveyState.timeSeries)) return;
    
    const ts = surveyState.timeSeries;
    if (!surveyState.analytics) surveyState.analytics = { stats: {}, overallMetrics: {} };
    
    // Average completion time from time series if not already available from dashboard
    if (!surveyState.analytics.stats.averageTime || surveyState.analytics.stats.averageTime === 0) {
        const validTimes = ts.map(p => p.avgCompletionTime).filter(v => Number.isFinite(v) && v > 0);
        if (validTimes.length > 0) {
            const avgTime = Math.round(validTimes.reduce((a,b) => a + b, 0) / validTimes.length);
            surveyState.analytics.stats.averageTime = avgTime;
            if (!surveyState.analytics.overallMetrics) surveyState.analytics.overallMetrics = {};
            surveyState.analytics.overallMetrics.avgCompletionTime = avgTime;
        }
    }
    
    // Total responses from time series if missing (fallback)
    const totalFromTS = ts.reduce((a,b) => a + (b.responseCount || 0), 0);
    if (!surveyState.analytics.stats.totalAnswers && totalFromTS > 0) {
        surveyState.analytics.stats.totalAnswers = totalFromTS;
        if (!surveyState.analytics.overallMetrics) surveyState.analytics.overallMetrics = {};
        surveyState.analytics.overallMetrics.totalResponses = totalFromTS;
    }
    
    // Update metrics after integration
    updateMetricsCards(surveyState.analytics);
}

// Real recent responses loader using dashboard endpoint (fallback to dummy)
async function loadRecentResponsesReal(surveyId, dashboardResultCache=null) {
    try {
        let dash = dashboardResultCache?.data;
        if (!dashboardResultCache) {
            const res = await getSurveyDashboard(surveyId);
            if (res.success) dash = res.data; else dash = null;
        }
        // Prefer backend recentResponses if present
        if (dash && Array.isArray(dash.recentResponses) && dash.recentResponses.length) {
            const rows = dash.recentResponses.map((r, index) => ({
                timestamp: r.submittedAt,
                sentiment: r.sentiment,
                completionTime: r.completionTime,
                respondent: r.respondent?.email || `respondent${index+1}@mail.com`,
                satisfactionLevel: r.satisfactionLevel,
                status: r.status || 'Completed'
            }));
            // keep latest rows globally for fallback calculations
            window.__lastRecentRows = rows;
            updateRecentResponsesAdvanced(rows);
            // Secondary safeguard: update Avg Time card if still zero
            const times = rows.map(r => Number(r.completionTime)).filter(v => Number.isFinite(v) && v > 0);
            if (times.length) {
                const avgSec = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
                // Persist into state for consistency
                surveyState.analytics = surveyState.analytics || { stats: {}, overallMetrics: {} };
                surveyState.analytics.stats = surveyState.analytics.stats || {};
                surveyState.analytics.overallMetrics = surveyState.analytics.overallMetrics || {};
                surveyState.analytics.stats.averageTime = avgSec;
                surveyState.analytics.overallMetrics.avgCompletionTime = avgSec;
                const display = avgSec >= 60 ? `${Math.round(avgSec/60)}m` : `${avgSec}s`;
                updateMetricCard('avgCompletionTime', display);
            }
            return;
        }
        if (dash && Array.isArray(dash.invitations)) {
            const completed = dash.invitations.filter(i => i.completedAt).slice(0,10).map((inv, idx) => ({
                timestamp: inv.completedAt,
                sentiment: { label: (surveyState.analytics?.overallSentiment?.label || 'neutral'), score: surveyState.analytics?.overallSentiment?.score || 0 },
                completionTime: inv.completionTime || surveyState.analytics?.overallMetrics?.avgCompletionTime || 0,
                respondent: inv.recipientEmail || `respondent${idx+1}@mail.com`,
                satisfactionLevel: '--',
                status: 'Completed'
            }));
            if (completed.length) { updateRecentResponsesAdvanced(completed); return; }
        }
        updateRecentResponsesAdvanced([]);
    } catch (e) {
        console.warn('Failed loading real recent responses, using dummy', e);
        updateRecentResponsesAdvanced([]);
    }
}

// --- Logout/dropdown ---
function initializeUserDropdownForAnalytics(){
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    userProfile.style.cursor = 'pointer';
    userProfile.addEventListener('click', toggleUserDropdownAnalytics);
    document.addEventListener('click', (e)=>{
        if (!userProfile.contains(e.target)) closeUserDropdownAnalytics();
    });
}

function toggleUserDropdownAnalytics(){
    const existing = document.querySelector('.user-dropdown');
    if (existing) closeUserDropdownAnalytics(); else showUserDropdownAnalytics();
}

function showUserDropdownAnalytics(){
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-header">
            <div class="dropdown-user-info">
                <img src="../images/profile.png" alt="User Avatar" class="dropdown-avatar">
                <div class="dropdown-user-details">
                    <span class="dropdown-user-name">${window.currentUser?.name || 'User'}</span>
                    <span class="dropdown-user-email">${window.currentUser?.email || ''}</span>
                </div>
            </div>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-items">
            <a href="#" class="dropdown-item" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        </div>`;
    userProfile.appendChild(dropdown);
    setTimeout(()=>dropdown.classList.add('show'),10);
}

function closeUserDropdownAnalytics(){
    const dd = document.querySelector('.user-dropdown');
    if (dd){ dd.classList.remove('show'); setTimeout(()=>dd.remove(),200); }
}

function handleLogout(){
    clearToken();
    sessionStorage.clear();
    M.toast({ html: '<i class="fas fa-sign-out-alt"></i> Logged out successfully', classes: 'success-toast', displayLength: 1500 });
    setTimeout(()=>{ window.location.href = '../auth/signin.html'; }, 400);
}

// expose for inline onclick
window.handleLogout = handleLogout;
