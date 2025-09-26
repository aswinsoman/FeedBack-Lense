// Real Analytics Overview with Backend Integration
// Author: F6 Implementation - Phase 4

console.log('🚀 Real Analytics Overview JS loaded');

import {
    getMultipleSurveyAnalytics,
    getUserSurveys,
    getUserProfile,
    requireAuth
} from '../api/api.js';
import { clearToken } from '../lib/lib.js';

import {
    handleAnalyticsError,
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
    console.log('🔍 Initializing Real Analytics Overview Page');
    
    // Check authentication
    if (!requireAuth()) {
        console.log('❌ Authentication required');
        return;
    }
    
    try {
        console.log('📍 Starting initialization process...');
        
        // Load user profile
        await loadUserProfile();
        console.log('✅ User profile loaded');
        
        // Initialize UI components
        initializeEventListeners();
        console.log('✅ Event listeners initialized');
        
        // Load real analytics data
        await loadRealAnalyticsOverview();
        console.log('✅ Real analytics data loaded');
        
        console.log('✅ Real Analytics Overview initialized successfully');
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
    // Store globally for dropdown (name + email)
    window.currentUser = user;
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('📱 Setting up event listeners');
    
    // Search functionality
    const searchInput = document.getElementById('searchSurveys');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Initialize Materialize components
    M.AutoInit();

    // Setup user dropdown + logout
    initializeUserDropdownForAnalytics();
}

// Load real analytics overview data
async function loadRealAnalyticsOverview() {
    console.log('📊 Loading real analytics overview data');
    
    if (analyticsData.isLoading) {
        console.log('Already loading, skipping duplicate request');
        return;
    }
    
    analyticsData.isLoading = true;
    showLoadingState();
    
    try {
        // Load user surveys
        console.log('📋 Fetching user surveys...');
        const surveysResult = await getUserSurveys();
        
        if (!surveysResult.success) {
            throw new Error(surveysResult.error || 'Failed to load surveys');
        }
        
        const surveys = surveysResult.data?.surveys || [];
        console.log(`📋 Found ${surveys.length} surveys:`, surveys);
        
        // Debug: Log the structure of the first survey to understand the data format
        if (surveys.length > 0) {
            console.log('📋 Sample survey structure:', surveys[0]);
            console.log('📋 Sample survey keys:', Object.keys(surveys[0]));
        }
        
        if (surveys.length === 0) {
            console.log('📋 No surveys found, showing empty state');
            showEmptyState();
            return;
        }
        
        // Store surveys
        analyticsData.surveys = surveys;
        analyticsData.filteredSurveys = [...surveys];
        
        // Load analytics for each survey (batch request)
        console.log('📈 Loading analytics for all surveys...');
        const surveyIds = surveys.map(survey => survey._id);
        const analyticsResult = await getMultipleSurveyAnalytics(surveyIds);
        
        if (analyticsResult.success) {
            analyticsData.analytics = analyticsResult.analytics || {};
            console.log(`📈 Loaded analytics for ${analyticsResult.successCount || 0}/${surveys.length} surveys`);
        } else {
            console.warn('Failed to load analytics data:', analyticsResult.error);
            analyticsData.analytics = {};
        }
        
        // Update UI - render table with real data
        renderSurveysTable();
        hideLoadingState();
        
    } catch (error) {
        console.error('❌ Failed to load real analytics overview:', error);
        const errorInfo = handleAnalyticsError('overview load', error);
        showErrorState(errorInfo.error);
    } finally {
        analyticsData.isLoading = false;
    }
}

// Render surveys table with real data
function renderSurveysTable() {
    console.log('📋 Rendering surveys table with real data');
    
    const tableBody = document.getElementById('surveysTableBody');
    if (!tableBody) {
        console.error('❌ Table body element not found');
        return;
    }
    
    const { filteredSurveys, analytics } = analyticsData;
    console.log(`📊 Rendering ${filteredSurveys.length} real surveys`);
    
    if (filteredSurveys.length === 0) {
        console.log('📋 No surveys to display');
        showEmptyState();
        return;
    }
    
    // Generate table rows HTML with real data
    const rowsHTML = filteredSurveys.map((survey, index) => {
        const surveyAnalytics = analytics[survey._id || survey.id];
        
        // Debug: Log survey data to understand structure
        console.log(`Survey ${index + 1} data:`, survey);
        console.log(`Survey ${index + 1} ID field:`, survey._id);
        console.log(`Survey ${index + 1} fallback ID field:`, survey.id);
        
        // Ensure we have a valid survey ID
        const surveyId = survey._id || survey.id;
        if (!surveyId) {
            console.error(`❌ Survey ${index + 1} has no valid ID:`, survey);
        }
        
        // Get real response count from multiple possible sources
        const totalResponses = surveyAnalytics?.stats?.totalAnswers || 
                              surveyAnalytics?.responseCount || 
                              survey.responseCount || 
                              survey.invitationCount || 0;
        
        console.log(`Survey ${survey.title} response count:`, totalResponses);
        
        // Format dates
        const publishDate = formatTableDate(survey.createdAt);
        const endDate = survey.endDate ? formatTableDate(survey.endDate) : 'N/A';
        
        // Generate short survey ID
        const shortId = generateShortId(surveyId, index);
        
        // Determine status
        const status = getTableStatus(survey);
        
        return `
            <tr class="survey-row survey-row-enter" data-survey-id="${surveyId}" style="animation-delay: ${index * 50}ms; cursor: pointer;">
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
    console.log('✅ Real data table rows updated');
    
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
    console.log(`📱 Adding events to ${surveyRows.length} survey rows`);
    
    surveyRows.forEach((row, index) => {
        const surveyId = row.getAttribute('data-survey-id');
        console.log(`📱 Row ${index + 1} has survey ID:`, surveyId);
        
        // Remove any existing event listeners
        row.replaceWith(row.cloneNode(true));
        const newRow = document.querySelectorAll('.survey-row')[index];
        
        newRow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const surveyId = newRow.getAttribute('data-survey-id');
            console.log('🔄 Row clicked, survey ID:', surveyId);
            navigateToSurveyDetails(surveyId);
        });
        
        // Add hover effect
        newRow.addEventListener('mouseenter', () => {
            newRow.style.transform = 'translateX(4px)';
            newRow.style.transition = 'transform 0.2s ease';
        });
        
        newRow.addEventListener('mouseleave', () => {
            newRow.style.transform = 'translateX(0)';
        });
    });
    
    console.log('✅ All row events added successfully');
}

// Navigate to survey details page
function navigateToSurveyDetails(surveyId) {
    console.log('🔍 Navigating to survey details:', surveyId);
    
    if (!surveyId || surveyId === 'undefined') {
        console.error('❌ No valid survey ID provided for navigation:', surveyId);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Unable to open survey details - Invalid survey ID',
            classes: 'red'
        });
        return;
    }
    
    // Navigate to individual survey analytics page
    const url = `survey-analytics.html?id=${encodeURIComponent(surveyId)}`;
    console.log('🔗 Navigating to URL:', url);
    window.location.href = url;
}

// Handle search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log('🔍 Searching for:', searchTerm);
    
    if (!searchTerm) {
        // Show all surveys
        analyticsData.filteredSurveys = [...analyticsData.surveys];
    } else {
        // Filter surveys by search term
        analyticsData.filteredSurveys = analyticsData.surveys.filter(survey => {
            return (
                survey.title.toLowerCase().includes(searchTerm) ||
                survey.status.toLowerCase().includes(searchTerm) ||
                (survey.description && survey.description.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Re-render table with filtered results
    renderSurveysTable();
    console.log(`🔍 Filtered to ${analyticsData.filteredSurveys.length} surveys`);
}

// Show loading state
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
                    Loading real survey data...
                </td>
            </tr>
        `;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    // Loading state is handled by renderSurveysTable()
}

// Show empty state
function showEmptyState() {
    const tableBody = document.getElementById('surveysTableBody');
    const errorState = document.getElementById('errorState');
    
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
}

// Show error state
function showErrorState(errorMessage) {
    const tableBody = document.getElementById('surveysTableBody');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="center-align" style="padding: 40px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 16px;"></i>
                    <h4 style="color: #2c3e50; margin: 16px 0 8px 0;">Unable to Load Analytics</h4>
                    <p style="color: #7f8c8d; margin-bottom: 24px;">${escapeHtml(errorMessage)}</p>
                    <button class="btn btn-primary waves-effect" onclick="loadRealAnalyticsOverview()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (emptyState) emptyState.style.display = 'none';
}

// Refresh analytics data
async function refreshAnalytics() {
    console.log('🔄 Refreshing real analytics data');
    
    M.toast({
        html: '<i class="fas fa-sync-alt"></i> Refreshing analytics...',
        classes: 'blue'
    });
    
    // Clear current data
    analyticsData.surveys = [];
    analyticsData.analytics = {};
    analyticsData.filteredSurveys = [];
    
    // Reload data
    await loadRealAnalyticsOverview();
    
    M.toast({
        html: '<i class="fas fa-check"></i> Analytics refreshed successfully!',
        classes: 'green'
    });
}

// Expose functions globally
window.loadRealAnalyticsOverview = loadRealAnalyticsOverview;
window.refreshAnalytics = refreshAnalytics;
window.navigateToSurveyDetails = navigateToSurveyDetails;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAnalyticsOverview);

// Export functions for testing
export {
    initializeAnalyticsOverview,
    loadRealAnalyticsOverview,
    renderSurveysTable,
    handleSearch,
    refreshAnalytics,
    navigateToSurveyDetails
};

// ===== Logout/dropdown for analytics overview =====
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
    const dd = document.createElement('div');
    dd.className = 'user-dropdown';
    dd.innerHTML = `
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
    userProfile.appendChild(dd);
    setTimeout(()=>dd.classList.add('show'),10);
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
