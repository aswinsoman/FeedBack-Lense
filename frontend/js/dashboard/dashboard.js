// Dashboard functionality - Phase 6: Complete Implementation
// Fetches and displays user's created surveys with real-time statistics

import {
    getAuthToken,
    getDashboardStats,
    getReceivedInvitations,
    getReceivedInvitationsFromUser,
    getUserSurveys,
    getUserProfile,
    requireAuth
} from '../api/api.js';
import { clearToken } from '../lib/lib.js';

// Global state for dashboard data
let dashboardData = {
    surveys: [],
    stats: {},
    isLoading: false
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard loaded - Phase 6: Complete Implementation');

    // Check authentication using enhanced method
    if (!checkAuthentication()) {
        return;
    }

    // Check for success messages from survey creation
    checkForSuccessMessages();

    // Initialize dashboard
    initializeDashboard();

    // Setup auto-refresh for real-time updates
    setupAutoRefresh();
});

/**
 * Phase 6: Enhanced authentication check
 */
function checkAuthentication() {
    return requireAuth();
}

/**
 * Phase 6: Check for success messages from other pages
 */
function checkForSuccessMessages() {
    const message = sessionStorage.getItem('dashboardMessage');
    if (message) {
        try {
            const msgData = JSON.parse(message);
            // Only show recent messages (within last 10 seconds)
            if (Date.now() - msgData.timestamp < 10000) {
                M.toast({
                    html: `<i class="fas fa-check-circle"></i> ${msgData.message}`,
                    classes: 'success-toast',
                    displayLength: 4000
                });
            }
        } catch (error) {
            console.error('Error parsing dashboard message:', error);
        }
        // Clear the message after displaying
        sessionStorage.removeItem('dashboardMessage');
    }
}

/**
 * Phase 6: Enhanced dashboard initialization
 */
function initializeDashboard() {
    // Check if we're on the take-survey page
    const isTakeSurveyPage = window.location.pathname.includes('take-survey.html');
    
    // Always set up event listeners and load user profile
    setupEventListeners();
    loadUserProfile();
    
    // Only load dashboard data if not on take-survey page
    if (!isTakeSurveyPage) {
        loadDashboardData();
    } else {
        console.log('On take-survey page, skipping full dashboard data load');
    }

    // Initialize Materialize components
    M.AutoInit();
}

/**
 * Load user profile and update display
 */
async function loadUserProfile() {
    try {
        const result = await getUserProfile();
        if (result.success && result.data) {
            updateUserDisplay(result.data);
        } else {
            console.warn('Failed to load user profile:', result);
            // Keep default display if profile load fails
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

/**
 * Update user display in header
 */
function updateUserDisplay(user) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }

    // Store user data globally for dropdown
    window.currentUser = user;
}

/**
 * Phase 6: Enhanced event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Initialize user dropdown
    initializeUserDropdown();

    // Create survey button
    const createSurveyBtn = document.querySelector('.btn-primary');
    if (createSurveyBtn) {
        createSurveyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'create-survey.html';
        });
    }

    // Refresh button (if exists)
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function (e) {
            e.preventDefault();
            refreshDashboard();
        });
    }

    // Search functionality for surveys
    const searchInput = document.getElementById('surveySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            filterSurveys(e.target.value);
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * Phase 6: Complete dashboard data loading with error handling
 */
async function loadDashboardData() {
    // Check if we're on the take-survey page and skip unnecessary operations
    if (window.location.pathname.includes('take-survey.html')) {
        console.log('On take-survey page, only loading essential dashboard components');
        // We still need user profile data but can skip other dashboard components
        return;
    }
    
    if (dashboardData.isLoading) {
        console.log('Dashboard data is already loading...');
        return;
    }

    dashboardData.isLoading = true;
    showLoading(true);

    renderInvitationsListFromUser()

    try {
        // Load both stats and surveys concurrently
        const [statsResult, surveysResult] = await Promise.all([
            getDashboardStats(),
            getUserSurveys()
        ]);

        // Handle stats data
        if (statsResult.success && statsResult.data) {
            dashboardData.stats = statsResult.data;
            updateStats(statsResult.data);
        } else {
            console.warn('Failed to load dashboard stats:', statsResult);
            updateStats(getDefaultStats());
        }

        // Handle surveys data
        if (surveysResult.success && surveysResult.data) {
            dashboardData.surveys = surveysResult.data.surveys || surveysResult.data || [];
            updateSurveysDisplay(dashboardData.surveys);
        } else {
            console.warn('Failed to load user surveys:', surveysResult);
            dashboardData.surveys = [];
            updateSurveysDisplay([]);
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error message to user
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Failed to load dashboard data',
            classes: 'error-toast',
            displayLength: 4000
        });

        // Load default data
        updateStats(getDefaultStats());
        updateSurveysDisplay([]);
    } finally {
        dashboardData.isLoading = false;
        showLoading(false);
    }
}

/**
 * Phase 6: Get default stats when API fails
 */
function getDefaultStats() {
    return {
        totalSurveys: 0,
        totalResponses: 0,
        activeSurveys: 0,
        avgResponseRate: '0%',
        recentActivity: 0
    };
}

/**
 * Phase 6: Enhanced stats update with animation
 */
function updateStats(stats) {
    // Update statistics with animation
    const totalSurveysEl = document.getElementById('totalSurveys');
    const totalResponsesEl = document.getElementById('totalResponses');
    const activeSurveysEl = document.getElementById('activeSurveys');
    const avgResponseRateEl = document.getElementById('avgResponseRate');

    if (totalSurveysEl) animateStatNumber(totalSurveysEl, stats.totalSurveys || 0);
    if (totalResponsesEl) animateStatNumber(totalResponsesEl, stats.totalResponses || 0);
    if (activeSurveysEl) animateStatNumber(activeSurveysEl, stats.activeSurveys || 0);
    if (avgResponseRateEl) {
        const rate = stats.avgResponseRate || '0%';
        avgResponseRateEl.textContent = typeof rate === 'number' ? `${rate}%` : rate;
    }

    console.log('Dashboard stats updated:', stats);
}

/**
 * Phase 6: Animate stat numbers for better UX
 */
function animateStatNumber(element, targetValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 second
    const stepTime = 50; // Update every 50ms
    const steps = duration / stepTime;
    const increment = (targetValue - startValue) / steps;

    let currentValue = startValue;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        currentValue += increment;

        if (step >= steps) {
            currentValue = targetValue;
            clearInterval(timer);
        }

        element.textContent = Math.round(currentValue);
    }, stepTime);
}

/**
 * Phase 6: Enhanced surveys display with dynamic card generation and real survey count
 */
function updateSurveysDisplay(surveys) {
    // Check if we're on the take-survey page and skip if we are
    if (window.location.pathname.includes('take-survey.html')) {
        console.log('On take-survey page, skipping surveys display update');
        return;
    }

    const surveysContainer = document.getElementById('surveysContainer');
    const emptyState = document.getElementById('emptySurveys');

    if (!surveysContainer) {
        console.error('Surveys container not found');
        return;
    }

    // Update the total surveys count in stats
    const totalSurveysElement = document.getElementById('totalSurveys');
    if (totalSurveysElement && surveys && surveys.length > 0) {
        animateStatNumber(totalSurveysElement, surveys.length);
    }

    // Clear existing content
    surveysContainer.innerHTML = '';

    if (!surveys || surveys.length === 0) {
        // Show empty state
        if (emptyState) {
            surveysContainer.appendChild(emptyState);
        } else {
            surveysContainer.innerHTML = createEmptyStateHTML();
        }
        return;
    }

    // Generate survey cards - limit to first 5 for compact display
    const surveysToShow = surveys.slice(0, 5);
    surveysToShow.forEach(survey => {
        const surveyCard = createSurveyCard(survey);
        surveysContainer.appendChild(surveyCard);
    });

    // Add "View All" link if there are more than 5 surveys
    if (surveys.length > 5) {
        const viewAllDiv = document.createElement('div');
        viewAllDiv.className = 'view-all-surveys';
        viewAllDiv.innerHTML = `
            <a href="#" class="link-view-all" onclick="showAllSurveys()">
                View all ${surveys.length} surveys <i class="fas fa-arrow-right"></i>
            </a>
        `;
        surveysContainer.appendChild(viewAllDiv);
    }

    console.log(`Displayed ${surveysToShow.length} surveys out of ${surveys.length} total`);
}


/**
 * Phase 6: Create individual survey card with complete functionality
 */



async function renderInvitationsListFromUser() {
    // Check if we're on the take-survey page and skip if we are
    if (window.location.pathname.includes('take-survey.html')) {
        console.log('On take-survey page, skipping invitations list update');
        return;
    }

    const list = document.getElementById('invitations-list');
    if (!list) return;

    try {
        // Fetch invitations from API
        const result = await getReceivedInvitationsFromUser();
        console.log('API result:', result);

        if (!result.success) {
            list.innerHTML = '<div style="text-align:center; color:#ff4444; padding:32px 0;">Failed to load invitations.</div>';
            return;
        }

        // Store invitations locally
        const invitations = result.data || [];
        console.log('Invitations:', invitations);

        // list.innerHTML = '';

        if (!invitations.length) {
            list.innerHTML = '<div style="text-align:center; color:#888; padding:32px 0;">No invitations found.</div>';
            return;
        }

        // Render each invitation
        invitations.forEach(inv => {
            // Calculate due date (30 days from creation)
            let dueDateText = 'No due date';
            if (inv.createdAt) {
                const createdDate = new Date(inv.createdAt);
                const dueDate = new Date(createdDate);
                dueDate.setDate(dueDate.getDate() + 30);
                dueDateText = `Due: ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }

            const sender = inv.creatorName ? `From: ${inv.creatorName}` : 'From: Unknown sender';

            const item = document.createElement('div');
            item.className = 'invitation-card';
            item.innerHTML = `
                <div class="invitation-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0; margin-bottom:8px;">
                    <div style="display:flex;flex-direction:column;gap:2px;">
                        <span class="invitation-title" style="font-size:16px;font-weight:500;margin:0;">${inv.surveyTitle || 'Untitled Survey'}</span>
                        <span class="invitation-from" style="font-size:13px;color:#6c757d;margin:0;">${sender}</span>
                    </div>
                    <button class="take-survey-btn" style="margin:0 0 0 12px;padding:6px 16px;font-size:14px;min-width:90px;" data-surveylink="${inv.surveyLink}" data-invitationid="${inv.id}">
                        ${inv.status === 'completed' ? 'View Results' : 'Take Survey'}
                    </button>
                </div>
                <span class="invitation-date" style="font-size:12px;color:#888;margin-top:2px;display:block;">${dueDateText}</span>

            `;
            list.appendChild(item);
        });

        document.addEventListener("click", function (e) {
            if (e.target && e.target.classList.contains("take-survey-btn")) {
                const surveyLink = e.target.getAttribute("data-surveylink");
                const invitationId = e.target.getAttribute("data-invitationid");

                const id1 = surveyLink.split("/survey/")[1].split("?")[0];
                console.log("Survey ID:", id1);  // 👉 68c465cf90313f1bd961daae

                // Method 2: Regex
                const match = surveyLink.match(/\/survey\/([^?]+)/);
                const id2 = match ? match[1] : null;
                console.log("Survey ID (regex):", id2);

                // Redirect to new HTML page with ID passed in query string
                // Example: /survey.html?id=68c465cf90313f1bd961daae&link=...
                window.location.href = `/public/dashboard/take-survey.html?id=${id2}&link=${encodeURIComponent(surveyLink)}`;
            }
        });

        // Add event listeners to buttons
        document.querySelectorAll('.btn-take-survey').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const surveyLink = e.target.getAttribute('data-surveylink');
                const invitationId = e.target.getAttribute('data-invitationid');
                navigateToTakeSurvey(surveyLink, invitationId);
            });
        });

    } catch (error) {
        console.error('Error rendering invitations:', error);
        list.innerHTML = '<div style="text-align:center; color:#ff4444; padding:32px 0;">Error loading invitations.</div>';
    }
}



// Make sure this function is defined
function navigateToTakeSurvey(surveyLink, invitationId) {
    console.log('Navigating to survey:', surveyLink, 'with invitation:', invitationId);
    // Implement your navigation logic here
    // window.location.href = surveyLink;
}


function createSurveyCard(survey) {
    const card = document.createElement('div');
    card.className = 'survey-card';
    card.setAttribute('data-survey-id', survey._id);

    // Calculate response rate
    const responseRate = survey.totalResponses > 0 && survey.maxResponses > 0
        ? Math.round((survey.totalResponses / survey.maxResponses) * 100)
        : 0;

    // Format creation date
    const createdDate = new Date(survey.createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    

    // Determine status
    const status = survey.status === 'active' ? 'Active' : 'Draft';
    const statusClass = survey.status === 'active' ? 'status-active' : 'status-draft';

    card.innerHTML = `
        <div class="card-header">
            <h4 class="survey-title">${escapeHtml(survey.title)}</h4>
            <div class="survey-status ${statusClass}">${status}</div>
        </div>
        
        <div class="survey-meta">
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>Created ${formattedDate}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-question-circle"></i>
                <span>${survey.questionCount || 0} Questions</span>            
                </div>
        </div>
        
        <div class="survey-stats">
            <div class="stat">
                <span class="stat-value">${survey.totalResponses || 0}</span>
                <span class="stat-label">Responses</span>
            </div>
            <div class="stat">
                <span class="stat-value">${responseRate}%</span>
                <span class="stat-label">Response Rate</span>
            </div>
        </div>
        
        <div class="survey-actions">
            <button class="btn btn-small btn-outline" onclick="viewSurvey('${survey._id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-small btn-outline" onclick="editSurvey('${survey._id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-small btn-outline" onclick="shareSurvey('${survey._id}')">
                <i class="fas fa-share"></i> Share
            </button>
            ${survey.isActive ?
            `<button class="btn btn-small btn-outline red" onclick="deactivateSurvey('${survey._id}')">
                    <i class="fas fa-pause"></i> Pause
                </button>` :
            `<button class="btn btn-small btn-primary" onclick="activateSurvey('${survey._id}')">
                    <i class="fas fa-play"></i> Activate
                </button>`
        }
        </div>
    `;

    return card;
}

/**
 * Phase 6: Create empty state HTML
 */
function createEmptyStateHTML() {
    return `
        <div class="empty-state" id="emptySurveys">
            <div class="empty-icon">
                <i class="fas fa-poll"></i>
            </div>
            <h4>No surveys yet</h4>
            <p>Create your first survey to get started with collecting feedback.</p>
            <a href="create-survey.html" class="btn btn-primary">Create Survey</a>
        </div>
    `;
}

/**
 * Phase 6: Utility function to escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Phase 6: Enhanced loading state management
 */
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Also show/hide loading indicators on individual sections
    const statsCards = document.querySelectorAll('.stat-card');
    const surveysContainer = document.getElementById('surveysContainer');

    if (show) {
        statsCards.forEach(card => card.classList.add('loading'));
        if (surveysContainer) surveysContainer.classList.add('loading');
    } else {
        statsCards.forEach(card => card.classList.remove('loading'));
        if (surveysContainer) surveysContainer.classList.remove('loading');
    }
}

/**
 * Phase 6: Survey action handlers
 */
window.viewSurvey = function (surveyId) {
    console.log('Viewing survey:', surveyId);
    // Store survey ID and navigate to view page (when implemented)
    sessionStorage.setItem('viewSurveyId', surveyId);
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Survey view page coming soon!',
        classes: 'info-toast',
        displayLength: 3000
    });
};

window.editSurvey = function (surveyId) {
    console.log('Editing survey:', surveyId);
    // Store survey ID and navigate to edit page (when implemented)
    sessionStorage.setItem('editSurveyId', surveyId);
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Survey editing coming soon!',
        classes: 'info-toast',
        displayLength: 3000
    });
};

window.shareSurvey = function (surveyId) {
    console.log('Sharing survey:', surveyId);

    // Generate survey share link
    const shareLink = `${window.location.origin}/survey/${surveyId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareLink).then(() => {
        M.toast({
            html: '<i class="fas fa-check"></i> Survey link copied to clipboard!',
            classes: 'success-toast',
            displayLength: 3000
        });
    }).catch(() => {
        // Fallback for browsers that don't support clipboard API
        console.log('Survey share link:', shareLink);
        M.toast({
            html: '<i class="fas fa-info-circle"></i> Survey link logged to console',
            classes: 'info-toast',
            displayLength: 3000
        });
    });
};

window.activateSurvey = function (surveyId) {
    console.log('Activating survey:', surveyId);
    // TODO: Implement survey activation API call
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Survey activation coming soon!',
        classes: 'info-toast',
        displayLength: 3000
    });
};

window.deactivateSurvey = function (surveyId) {
    console.log('Deactivating survey:', surveyId);
    // TODO: Implement survey deactivation API call
    M.toast({
        html: '<i class="fas fa-info-circle"></i> Survey deactivation coming soon!',
        classes: 'info-toast',
        displayLength: 3000
    });
};

/**
 * Show all surveys - expands the compact view to show all surveys
 */
function showAllSurveys() {
    const surveysContainer = document.getElementById('surveysContainer');
    if (!surveysContainer || !dashboardData.surveys) {
        console.error('Cannot show all surveys: container or data not found');
        return;
    }

    // Clear existing content
    surveysContainer.innerHTML = '';

    // Show all surveys
    dashboardData.surveys.forEach(survey => {
        const surveyCard = createSurveyCard(survey);
        surveysContainer.appendChild(surveyCard);
    });

    console.log(`Showing all ${dashboardData.surveys.length} surveys`);

    // Show toast notification
    M.toast({
        html: `<i class="fas fa-eye"></i> Showing all ${dashboardData.surveys.length} surveys`,
        classes: 'info-toast',
        displayLength: 2000
    });
}

// Make showAllSurveys available globally for onclick
window.showAllSurveys = showAllSurveys;

/**
 * Phase 6: Search and filter functionality
 */
function filterSurveys(searchTerm) {
    const surveyCards = document.querySelectorAll('.survey-card');
    const term = searchTerm.toLowerCase();

    surveyCards.forEach(card => {
        const title = card.querySelector('.survey-title').textContent.toLowerCase();
        const shouldShow = title.includes(term);
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

/**
 * Phase 6: Dashboard refresh functionality
 */
async function refreshDashboard() {
    console.log('Refreshing dashboard data...');

    M.toast({
        html: '<i class="fas fa-sync-alt"></i> Refreshing dashboard...',
        classes: 'info-toast',
        displayLength: 2000
    });

    await loadDashboardData();

    M.toast({
        html: '<i class="fas fa-check"></i> Dashboard refreshed!',
        classes: 'success-toast',
        displayLength: 2000
    });
}

/**
 * Phase 6: Auto-refresh setup for real-time updates
 */
function setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => {
        if (!dashboardData.isLoading) {
            console.log('Auto-refreshing dashboard data...');
            loadDashboardData();
        }
    }, 5 * 60 * 1000); // 5 minutes

    // Also refresh when user returns to tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !dashboardData.isLoading) {
            console.log('Tab became visible, refreshing data...');
            loadDashboardData();
        }
    });
}

/**
 * Phase 6: Logout functionality
 */
function handleLogout() {
    // Clear authentication tokens using proper token helper
    clearToken();
    sessionStorage.clear();

    // Show logout message
    M.toast({
        html: '<i class="fas fa-sign-out-alt"></i> Logged out successfully',
        classes: 'success-toast',
        displayLength: 2000
    });

    // Redirect to login after a brief delay
    setTimeout(() => {
        window.location.href = '../auth/signin.html';
    }, 500);
}

/**
 * Initialize user profile dropdown
 */
function initializeUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', toggleUserDropdown);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                closeUserDropdown();
            }
        });
    }
}

/**
 * Toggle user dropdown menu
 */
function toggleUserDropdown() {
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        closeUserDropdown();
    } else {
        showUserDropdown();
    }
}

/**
 * Show user dropdown menu
 */
function showUserDropdown() {
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
        </div>
    `;

    userProfile.appendChild(dropdown);
    
    // Add show class for animation
    setTimeout(() => dropdown.classList.add('show'), 10);
}

/**
 * Close user dropdown menu
 */
function closeUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
        setTimeout(() => dropdown.remove(), 200);
    }
}

// Make handleLogout globally available
window.handleLogout = handleLogout;


/**
 * Phase 7: Create view memberlist functionality
 */



// Export functions for use in other modules or testing
export {
    checkAuthentication,
    updateStats,
    showLoading,
    refreshDashboard,
    updateSurveysDisplay,
    renderInvitationsListFromUser,

    dashboardData
};
