// Analytics Overview Page Logic
// Author: F6 Implementation

console.log('🚀 Analytics Overview JS loaded');

import {
    getSurveyAnalysis,
    getMultipleSurveyAnalytics,
    formatAnalyticsForDisplay,
    getUserSurveys,
    getUserProfile,
    requireAuth
} from '../api/api.js';

import {
    handleAnalyticsError,
    displayAnalyticsError,
    showAnalyticsLoading,
    hideAnalyticsLoading,
    formatNumber,
    formatPercentage,
    formatDuration,
    getSentimentColor,
    getStatusColor,
    debounce,
    escapeHtml
} from './analytics-utils.js';

// Global state
let analyticsData = {
    surveys: [],
    analytics: {},
    filteredSurveys: [],
    isLoading: false,
    error: null
};

// Initialize the analytics overview page
async function initializeAnalyticsOverview() {
    console.log('🔍 Initializing Analytics Overview Page');
    
    // Check authentication - but continue for debugging
    const isAuth = requireAuth();
    if (!isAuth) {
        console.log('❌ Authentication required - but continuing for debug');
        // For debugging, let's continue anyway
        console.log('🔧 Debug mode: skipping auth check');
    }
    
    try {
        // Add debug message
        console.log('📍 Starting initialization process...');
        
        // Load user profile
        await loadUserProfile();
        console.log('✅ User profile loaded');
        
        // Initialize UI components
        initializeEventListeners();
        console.log('✅ Event listeners initialized');
        
        // Load analytics data
        await loadAnalyticsOverview();
        console.log('✅ Analytics data loaded');
        
        console.log('✅ Analytics Overview initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize analytics overview:', error);
        showErrorState('Failed to initialize analytics overview');
    }
}

// Load user profile information
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

// Update user display in header
function updateUserDisplay(user) {
    const userName = document.getElementById('userName');
    if (userName && user.name) {
        userName.textContent = user.name;
    }
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('📱 Setting up event listeners');
    
    // Search functionality
    const searchInput = document.getElementById('searchSurveys');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const sentimentFilter = document.getElementById('sentimentFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }
    
    if (sentimentFilter) {
        sentimentFilter.addEventListener('change', handleFilter);
    }
    
    // Initialize Materialize components
    M.AutoInit();
}

// Load analytics overview data
async function loadAnalyticsOverview() {
    console.log('📊 Loading analytics overview data');
    
    if (analyticsData.isLoading) {
        console.log('Already loading, skipping duplicate request');
        return;
    }
    
    analyticsData.isLoading = true;
    showLoadingState();
    
    try {
        // For debugging, use dummy data first
        console.log('🔧 Using dummy data for testing');
        
        const dummySurveys = [
            {
                _id: '1',
                title: 'Customer Satisfaction Survey',
                createdAt: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'active'
            },
            {
                _id: '2', 
                title: 'Employee Feedback Survey',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                status: 'active'
            },
            {
                _id: '3',
                title: 'Product Review Survey',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                status: 'completed'
            }
        ];
        
        console.log(`📋 Using ${dummySurveys.length} dummy surveys`);
        
        // Store surveys
        analyticsData.surveys = dummySurveys;
        analyticsData.filteredSurveys = [...dummySurveys];
        analyticsData.analytics = {};
        
        // Update UI - render table
        renderSurveysTable();
        hideLoadingState();
        
        console.log('✅ Dummy data loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load analytics overview:', error);
        const errorInfo = handleAnalyticsError('overview load', error);
        showErrorState(errorInfo.error);
    } finally {
        analyticsData.isLoading = false;
    }
}

// Update overview statistics
function updateOverviewStats() {
    console.log('📊 Updating overview statistics');
    
    const { surveys, analytics } = analyticsData;
    
    let totalResponses = 0;
    let totalSentimentScore = 0;
    let totalCompletionTime = 0;
    let surveysWithData = 0;
    let surveysWithResponses = 0;
    
    // Calculate aggregated statistics
    surveys.forEach(survey => {
        const surveyAnalytics = analytics[survey._id];
        
        if (surveyAnalytics && surveyAnalytics.details) {
            surveysWithData++;
            
            const responseCount = surveyAnalytics.details.answersCount || 0;
            totalResponses += responseCount;
            
            if (responseCount > 0) {
                surveysWithResponses++;
                
                // Add sentiment score
                if (surveyAnalytics.overallSentiment?.score !== undefined) {
                    totalSentimentScore += surveyAnalytics.overallSentiment.score;
                }
                
                // Note: completion time would come from time-series data
                // For now, we'll use a placeholder
                totalCompletionTime += 180; // 3 minutes average placeholder
            }
        }
    });
    
    // Update stat cards
    updateStatCard('totalSurveysAnalyzed', surveysWithData);
    updateStatCard('totalResponses', formatNumber(totalResponses));
    
    // Average sentiment score
    const avgSentiment = surveysWithResponses > 0 ? 
        (totalSentimentScore / surveysWithResponses) : 0;
    updateStatCard('avgSentiment', avgSentiment.toFixed(1));
    
    // Average completion time
    const avgCompletionTime = surveysWithResponses > 0 ? 
        (totalCompletionTime / surveysWithResponses) : 0;
    updateStatCard('avgCompletionTime', formatDuration(avgCompletionTime));
    
    // Update survey count
    updateSurveyCount(analyticsData.filteredSurveys.length, surveys.length);
}

// Update individual stat card
function updateStatCard(elementId, value) {
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

// Update survey count display
function updateSurveyCount(filtered, total) {
    const countElement = document.getElementById('surveyCount');
    if (countElement) {
        if (filtered === total) {
            countElement.textContent = `${total} surveys`;
        } else {
            countElement.textContent = `${filtered} of ${total} surveys`;
        }
    }
}

// Render surveys table (Phase 2 Update)
function renderSurveysTable() {
    console.log('📋 Rendering surveys table');
    
    const tableBody = document.getElementById('surveysTableBody');
    if (!tableBody) {
        console.error('❌ Table body element not found');
        return;
    }
    
    const { filteredSurveys, analytics } = analyticsData;
    console.log(`📊 Rendering ${filteredSurveys.length} surveys`);
    
    if (filteredSurveys.length === 0) {
        console.log('📋 No surveys to display');
        showEmptyState();
        return;
    }
    
    // Generate table rows HTML
    const rowsHTML = filteredSurveys.map((survey, index) => {
        const surveyAnalytics = analytics[survey._id];
        const totalResponses = surveyAnalytics?.stats?.totalAnswers || 0;
        
        // Format dates
        const publishDate = formatTableDate(survey.createdAt);
        const endDate = survey.endDate ? formatTableDate(survey.endDate) : 'N/A';
        
        // Generate short survey ID
        const shortId = generateShortId(survey._id, index);
        
        // Determine status
        const status = getTableStatus(survey);
        
        return `
            <tr class="survey-row survey-row-enter" data-survey-id="${survey._id}" onclick="navigateToSurveyDetails('${survey._id}')" style="animation-delay: ${index * 50}ms">
                <td>${shortId}</td>
                <td>${escapeHtml(survey.title)}</td>
                <td>${publishDate}</td>
                <td>
                    <span class="survey-status-badge ${status.class}">${status.label}</span>
                </td>
                <td>${endDate}</td>
                <td>${totalResponses}</td>
            </tr>
        `;
    }).join('');
    
    // Update table body
    tableBody.innerHTML = rowsHTML;
    console.log('✅ Table rows updated');
    
    // Add click events to rows
    addTableRowEvents();
    console.log('✅ Table events added');
}

// Generate short survey ID
function generateShortId(fullId, index) {
    // Use a combination of index and last 3 characters of ID
    const shortIndex = String(index + 1).padStart(3, '0');
    return shortIndex;
}

// Get table status information
function getTableStatus(survey) {
    const status = survey.status || 'draft';
    
    switch (status.toLowerCase()) {
        case 'active':
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

// Format date for table display
function formatTableDate(date) {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });
}

// Add event listeners to table rows
function addTableRowEvents() {
    const surveyRows = document.querySelectorAll('.survey-row');
    
    surveyRows.forEach(row => {
        row.addEventListener('click', (e) => {
            e.preventDefault();
            const surveyId = row.getAttribute('data-survey-id');
            navigateToSurveyDetails(surveyId);
        });
        
        // Add hover effect
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateX(4px)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateX(0)';
        });
    });
}

// Update the old card rendering function to call table rendering
function renderSurveyAnalyticsCards() {
    // Phase 2 Update: Use table instead of cards
    renderSurveysTable();
}

// Create individual survey analytics card
function createSurveyAnalyticsCard(survey, analyticsData) {
    const analytics = formatAnalyticsForDisplay(analyticsData);
    const hasData = analytics && analytics.hasData;
    
    // Calculate metrics
    const responseCount = hasData ? analytics.stats.totalAnswers : 0;
    const completionRate = calculateCompletionRate(survey, responseCount);
    const sentiment = hasData ? analytics.sentiment : { label: 'neutral', score: 0, className: 'sentiment-neutral' };
    const keywords = hasData ? analytics.keywords.slice(0, 5) : [];
    
    // Format last response date
    const lastResponse = getLastResponseDate(survey);
    
    return `
        <div class="survey-analytics-card slide-up" data-survey-id="${survey._id}">
            <div class="survey-card-header">
                <h4 class="survey-title">${escapeHtml(survey.title)}</h4>
                <span class="survey-status ${survey.status}">${survey.status}</span>
            </div>
            
            <div class="survey-metrics">
                <div class="metric-item">
                    <h5 class="metric-value">${formatNumber(responseCount)}</h5>
                    <p class="metric-label">Responses</p>
                </div>
                <div class="metric-item">
                    <h5 class="metric-value">${completionRate}%</h5>
                    <p class="metric-label">Completion Rate</p>
                </div>
            </div>
            
            <div class="sentiment-section">
                <div class="sentiment-info">
                    <div class="sentiment-icon ${sentiment.label}">
                        ${getSentimentIcon(sentiment.label)}
                    </div>
                    <span class="sentiment-label ${sentiment.label}">${sentiment.label}</span>
                </div>
                <span class="sentiment-score">Score: ${sentiment.score}</span>
            </div>
            
            ${keywords.length > 0 ? `
                <div class="keywords-preview">
                    <h6 class="keywords-title">Top Keywords</h6>
                    <div class="keywords-list">
                        ${keywords.map(keyword => 
                            `<span class="keyword-tag ${getKeywordFrequencyClass(keyword.count)}">${escapeHtml(keyword.term)}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : `
                <div class="keywords-preview">
                    <p class="no-keywords">No keywords available</p>
                </div>
            `}
            
            <div class="survey-card-actions">
                <span class="last-response">${lastResponse}</span>
                <button class="btn waves-effect waves-light view-details-btn" data-survey-id="${survey._id}">
                    <i class="fas fa-chart-line"></i> View Details
                </button>
            </div>
        </div>
    `;
}

// Get sentiment icon
function getSentimentIcon(sentiment) {
    switch (sentiment) {
        case 'positive': return '😊';
        case 'negative': return '😞';
        default: return '😐';
    }
}

// Get keyword frequency class
function getKeywordFrequencyClass(count) {
    if (count >= 10) return 'high-freq';
    if (count >= 5) return 'medium-freq';
    return '';
}

// Calculate completion rate (placeholder logic)
function calculateCompletionRate(survey, responseCount) {
    // This would typically be based on invitations sent vs responses received
    // For now, we'll use a simple calculation
    const estimatedInvitations = Math.max(responseCount * 1.2, responseCount + 5);
    return Math.min(Math.round((responseCount / estimatedInvitations) * 100), 100);
}

// Get last response date (placeholder)
function getLastResponseDate(survey) {
    // This would come from the analytics data
    // For now, we'll use the survey's updated date
    const date = new Date(survey.updatedAt || survey.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

// Add event listeners to cards
function addCardEventListeners() {
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    const surveyCards = document.querySelectorAll('.survey-analytics-card');
    
    // View details button clicks
    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const surveyId = btn.getAttribute('data-survey-id');
            navigateToSurveyDetails(surveyId);
        });
    });
    
    // Card clicks
    surveyCards.forEach(card => {
        card.addEventListener('click', () => {
            const surveyId = card.getAttribute('data-survey-id');
            navigateToSurveyDetails(surveyId);
        });
    });
}

// Navigate to survey details page (Phase 2 Update)
function navigateToSurveyDetails(surveyId) {
    console.log('🔍 Navigating to survey details:', surveyId);
    
    if (!surveyId) {
        console.error('No survey ID provided for navigation');
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Unable to open survey details',
            classes: 'red'
        });
        return;
    }
    
    // Navigate to individual survey analytics page
    window.location.href = `survey-analytics.html?id=${encodeURIComponent(surveyId)}`;
}

// Animate cards
function animateCards() {
    const cards = document.querySelectorAll('.survey-analytics-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Handle search functionality (Phase 2 Update)
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log('🔍 Searching surveys:', searchTerm);
    
    // Filter surveys based on search term
    if (searchTerm === '') {
        analyticsData.filteredSurveys = [...analyticsData.surveys];
    } else {
        analyticsData.filteredSurveys = analyticsData.surveys.filter(survey =>
            survey.title.toLowerCase().includes(searchTerm) ||
            survey.status.toLowerCase().includes(searchTerm) ||
            survey._id.toLowerCase().includes(searchTerm)
        );
    }
    
    // Re-render table
    renderSurveysTable();
    
    // Show no results state if needed
    if (analyticsData.filteredSurveys.length === 0 && analyticsData.surveys.length > 0) {
        showNoResultsState();
    }
}

// Handle filter functionality
function handleFilter() {
    console.log('📊 Applying filters');
    applyFilters();
}

// Apply all filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const sentimentFilter = document.getElementById('sentimentFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchSurveys')?.value.toLowerCase().trim() || '';
    
    let filtered = [...analyticsData.surveys];
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(survey =>
            survey.title.toLowerCase().includes(searchTerm) ||
            survey.status.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(survey => survey.status === statusFilter);
    }
    
    // Apply sentiment filter
    if (sentimentFilter !== 'all') {
        filtered = filtered.filter(survey => {
            const analytics = analyticsData.analytics[survey._id];
            const sentiment = analytics?.overallSentiment?.label || 'neutral';
            return sentiment === sentimentFilter;
        });
    }
    
    analyticsData.filteredSurveys = filtered;
    
    // Update display
    updateSurveyCount(filtered.length, analyticsData.surveys.length);
    renderSurveyAnalyticsCards();
    
    if (filtered.length === 0 && analyticsData.surveys.length > 0) {
        showNoResultsState();
    }
}

// Show loading state (Phase 2 Update)
function showLoadingState() {
    const tableBody = document.getElementById('surveysTableBody');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="6" class="center-align">
                    <div class="preloader-wrapper small active">
                        <div class="spinner-layer spinner-blue-only">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div>
                            <div class="gap-patch">
                                <div class="circle"></div>
                            </div>
                            <div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>
                    </div>
                    Loading surveys...
                </td>
            </tr>
        `;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
}

// Hide loading state (Phase 2 Update)
function hideLoadingState() {
    // Loading state is handled by renderSurveysTable()
}

// Show empty state (Phase 2 Update)
function showEmptyState() {
    const tableBody = document.getElementById('surveysTableBody');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="center-align" style="padding: 40px 20px;">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 16px;"></i>
                    <h4 style="color: #2c3e50; margin: 16px 0 8px 0;">No Surveys Found</h4>
                    <p style="color: #7f8c8d; margin-bottom: 24px;">Create your first survey to see analytics data.</p>
                    <a href="create-survey.html" class="btn btn-primary">Create Survey</a>
                </td>
            </tr>
        `;
    }
    
    if (errorState) errorState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
}

// Show error state (Phase 2 Update)
function showErrorState(message) {
    const tableBody = document.getElementById('surveysTableBody');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="center-align" style="padding: 40px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f44336; margin-bottom: 16px;"></i>
                    <h4 style="color: #2c3e50; margin: 16px 0 8px 0;">Unable to Load Analytics</h4>
                    <p style="color: #7f8c8d; margin-bottom: 24px;">${message}</p>
                    <button class="btn btn-primary waves-effect" onclick="loadAnalyticsOverview()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
}

// Show no results state (Phase 2 Update)
function showNoResultsState() {
    const tableBody = document.getElementById('surveysTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="center-align" style="padding: 40px 20px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 16px;"></i>
                    <h4 style="color: #2c3e50; margin: 16px 0 8px 0;">No Surveys Found</h4>
                    <p style="color: #7f8c8d; margin-bottom: 24px;">Try adjusting your search terms.</p>
                    <button class="btn waves-effect waves-light" onclick="clearFilters()">
                        <i class="fas fa-eraser"></i> Clear Search
                    </button>
                </td>
            </tr>
        `;
    }
}

// Clear all filters
function clearFilters() {
    const searchInput = document.getElementById('searchSurveys');
    const statusFilter = document.getElementById('statusFilter');
    const sentimentFilter = document.getElementById('sentimentFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (sentimentFilter) sentimentFilter.value = 'all';
    
    // Trigger Materialize update
    M.updateTextFields();
    
    // Reset filtered surveys
    analyticsData.filteredSurveys = [...analyticsData.surveys];
    
    // Update display
    updateSurveyCount(analyticsData.filteredSurveys.length, analyticsData.surveys.length);
    renderSurveyAnalyticsCards();
}

// Refresh analytics data
async function refreshAnalytics() {
    console.log('🔄 Refreshing analytics data');
    
    M.toast({
        html: '<i class="fas fa-sync-alt"></i> Refreshing analytics...',
        classes: 'blue'
    });
    
    // Clear current data
    analyticsData.surveys = [];
    analyticsData.analytics = {};
    analyticsData.filteredSurveys = [];
    
    // Reload data
    await loadAnalyticsOverview();
    
    M.toast({
        html: '<i class="fas fa-check"></i> Analytics refreshed successfully!',
        classes: 'green'
    });
}

// Expose functions globally
window.loadAnalyticsOverview = loadAnalyticsOverview;
window.refreshAnalytics = refreshAnalytics;
window.clearFilters = clearFilters;
window.navigateToSurveyDetails = navigateToSurveyDetails;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAnalyticsOverview);

// Export functions for testing
export {
    initializeAnalyticsOverview,
    loadAnalyticsOverview,
    renderSurveyAnalyticsCards,
    handleSearch,
    handleFilter,
    refreshAnalytics,
    navigateToSurveyDetails
};
