// Fetches and displays user's created surveys with real-time statistics

import { 
    getAuthToken,
    getDashboardStats,
    getReceivedInvitations,
    getReceivedInvitationsFromUser,
    getUserSurveys,
    getUserProfile,
    requireAuth,
    getDashboardPollingStats,
    getCrossSurveyAggregationAPI,
    getUserActivityFeed,
    getSurveyActivityFeed,
    getSurveyInvitationStats,
    getSurveyInvitationsList,
    updateSurveyStatusAPI
} from '../api/api.js';
import { clearToken } from '../lib/lib.js';

// Global state for dashboard data
let dashboardData = {
    surveys: [],
    stats: {},
    isLoading: false
};

let surveyComparisonData = [];

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

   
    DashboardRealTime.start();

    configureStatLabels();
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

    // Search functionality for invitations
    const invitationSearchInput = document.getElementById('invitation-search');
    if (invitationSearchInput) {
        invitationSearchInput.addEventListener('input', function (e) {
            filterInvitations(e.target.value);
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

     
        const statsData = statsResult?.data?.stats || statsResult?.data || null;
        if (statsResult.success && statsData) {
       
            const normalizedStats = {
                totalSurveys: statsData.totalSurveys ?? statsData.totalSurveysCreated ?? 0,
                totalResponses: statsData.totalResponses ?? statsData.totalResponsesReceived ?? statsData.totalResponsesGiven ?? 0,
                invitations: statsData.totalInvitationsSent ?? statsData.totalInvitationsReceived ?? 0,
                completionRate: statsData.avgResponseRate ?? statsData.overallResponseRate ?? 0,
                recentActivity: statsData.recentActivity ?? 0
            };
            dashboardData.stats = normalizedStats;
            updateStats(normalizedStats);
        } else {
            console.warn('Failed to load dashboard stats:', statsResult);
            updateStats(getDefaultStats());
        }

        // Handle surveys data
        if (surveysResult.success && surveysResult.data) {
            const baseSurveys = surveysResult.data.surveys || surveysResult.data || [];
         
            let enriched = await enrichSurveysWithCounts(baseSurveys);
            enriched = await mergeAggregatedResponseCounts(enriched);
            dashboardData.surveys = enriched;
            updateSurveysDisplay(enriched);
            updateResponsesCard();
            await updateCompletionRateCard();
        } else {
            console.warn('Failed to load user surveys:', surveysResult);
            dashboardData.surveys = [];
            updateSurveysDisplay([]);
            updateResponsesCard();
            await updateCompletionRateCard();
        }

        try {
            const totalResponsesEl = document.getElementById('totalResponses');
            if (totalResponsesEl) {
                const backendTotal = Number((dashboardData && dashboardData.stats && dashboardData.stats.totalResponses) || 0);
                const computedTotal = (dashboardData.surveys || []).reduce((sum, s) => {
                    const responses = typeof s.totalResponses === 'number' ? s.totalResponses : (s.responseCount || 0);
                    return sum + responses;
                }, 0);

                const finalValue = backendTotal > 0 ? backendTotal : computedTotal;
                animateStatNumber(totalResponsesEl, finalValue);
            }
        } catch (e) {
            console.warn('Unable to finalize total responses display', e);
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
    if (totalResponsesEl) animateStatNumber(totalResponsesEl, Number(stats.totalResponses || 0));
    if (activeSurveysEl) animateStatNumber(activeSurveysEl, stats.invitations || 0);
    if (avgResponseRateEl) {
        const rate = stats.completionRate || stats.avgResponseRate || '0%';
        avgResponseRateEl.textContent = typeof rate === 'number' ? `${rate}%` : rate;
    }

    console.log('Dashboard stats updated:', stats);
}

function updateResponsesCard() {
    try {
        const totalResponsesEl = document.getElementById('totalResponses');
        if (!totalResponsesEl) return;
        const backendTotal = Number((dashboardData && dashboardData.stats && dashboardData.stats.totalResponses) || 0);
        const computedTotal = (dashboardData.surveys || []).reduce((sum, s) => {
            const responses = typeof s.totalResponses === 'number' ? s.totalResponses : (s.responseCount || 0);
            return sum + Number(responses || 0);
        }, 0);
        const finalValue = backendTotal > 0 ? backendTotal : computedTotal;
        animateStatNumber(totalResponsesEl, finalValue);
    } catch (e) {
        console.warn('Unable to update responses card', e);
    }
}

async function updateCompletionRateCard(aggData = null) {
    try {
        const el = document.getElementById('avgResponseRate');
        if (!el) return;

        const backendRate = (dashboardData && dashboardData.stats && (dashboardData.stats.completionRate || dashboardData.stats.avgResponseRate));
        if (typeof backendRate === 'number' && !isNaN(backendRate)) {
            el.textContent = `${backendRate}%`;
            return;
        }

        const overallFromAgg = aggData && (aggData.overallCompletionRate || (aggData.userStats && aggData.userStats.overallResponseRate));
        if (typeof overallFromAgg === 'number' && !isNaN(overallFromAgg)) {
            el.textContent = `${Math.round(overallFromAgg)}%`;
            return;
        }

        const surveys = dashboardData.surveys || [];
        const totals = surveys.reduce((acc, s) => {
            const responses = typeof s.totalResponses === 'number' ? s.totalResponses : (s.responseCount || 0);
            const invites = typeof s.maxResponses === 'number' ? s.maxResponses : (s.invitationCount || 0);
            return { responses: acc.responses + Number(responses || 0), invitations: acc.invitations + Number(invites || 0) };
        }, { responses: 0, invitations: 0 });

        const computedRate = totals.invitations > 0 ? Math.round((totals.responses / totals.invitations) * 100) : 0;
        el.textContent = `${computedRate}%`;
    } catch (e) {
        console.warn('Unable to update completion rate card', e);
    }
}

// Real-time polling handler
const DashboardRealTime = {
    timer: null,
    intervalMs: 30000,
    isPolling: false,
    start() {
        if (this.timer) clearInterval(this.timer);
        this.pollOnce();
        this.timer = setInterval(() => this.pollOnce(), this.intervalMs);
        window.retryDashboardPolling = () => this.pollOnce(true);
    },
    async pollOnce(isManual = false) {
        if (this.isPolling) return;
        this.isPolling = true;
        try {
            const [pollRes, aggRes] = await Promise.all([
                getDashboardPollingStats(),
                getCrossSurveyAggregationAPI()
            ]);

            if (pollRes.success && pollRes.data) {
                const s = pollRes.data.userStats || pollRes.data.stats || pollRes.data;
                const normalized = {
                    totalSurveys: s.totalSurveys ?? s.totalSurveysCreated ?? 0,
                    totalResponses: s.totalResponses ?? s.totalResponsesReceived ?? s.totalResponsesGiven ?? 0,
                    invitations: s.totalInvitationsSent ?? s.totalInvitationsReceived ?? 0,
                    completionRate: s.avgResponseRate ?? s.overallResponseRate ?? 0,
                    recentActivity: s.recentActivity ?? 0
                };
                updateStats(normalized);
                dashboardData.stats.totalResponses = normalized.totalResponses;
                updateResponsesCard();
            }

            if (aggRes.success && aggRes.data) {
                console.log('Cross-survey aggregation data:', aggRes.data); // Debug log
                updateTrendChart(aggRes.data.responseTrends || []);
                const enrichedStats = await enrichSurveyStatsWithInvitations(aggRes.data.surveyStats || []);
                renderSurveyComparison(enrichedStats);
                renderTrendSummary({ ...aggRes.data, surveyStats: enrichedStats });
                renderInsights({ ...aggRes.data, surveyStats: enrichedStats });
                await updateCompletionRateCard(aggRes.data);
            } else {
                console.log('Cross-survey aggregation failed:', aggRes); // Debug log
            }

            await updateAggregatedActivityFeed();

        } catch (e) {
            console.error('Polling error:', e);
            M.toast({
                html: '<i class="fas fa-wifi"></i> Live update failed. <a href="#" onclick="retryDashboardPolling()" style="color:#fff;text-decoration:underline;margin-left:8px;">Retry</a>',
                classes: 'error-toast',
                displayLength: 4000
            });
        } finally {
            this.isPolling = false;
        }
    }
};

async function updateAggregatedActivityFeed() {
    try {
        const container = document.getElementById('activityFeed');
        const errorEl = document.getElementById('activityError');
        if (!container) return;

        const surveysRes = await getUserSurveys();
        if (!surveysRes.success || !surveysRes.data) {
            if (errorEl) {
                errorEl.textContent = 'Failed to load activity feed';
                errorEl.style.display = 'block';
            }
            return;
        }

        const surveys = surveysRes.data.surveys || surveysRes.data || [];
        const limited = surveys.slice(0, 5);

        const feeds = await Promise.all(limited.map(s =>
            getSurveyActivityFeed(String(s.id || s._id), 1, 10)
        ));

        let activities = feeds
            .filter(f => f && f.success && f.data)
            .flatMap(f => (Array.isArray(f.data.activities) ? f.data.activities : (Array.isArray(f.data) ? f.data : [])));

        if (!activities || activities.length === 0) {
            const invLists = await Promise.all(limited.map(s => getSurveyInvitationsList(String(s.id || s._id))));
            const now = new Date().toISOString();
            activities = invLists
                .filter(r => r && r.success && r.data)
                .flatMap(r => (Array.isArray(r.data.invitations) ? r.data.invitations : []))
                .map(inv => ({
                    type: inv.status === 'completed' ? 'response_submitted' : 'invitation_sent',
                    message: inv.status === 'completed' ? 'Response submitted' : `Invitation sent to ${inv.recipientName || inv.recipientEmail || 'user'}`,
                    createdAt: inv.completedAt || inv.sentAt || now
                }));
        }

        if (!activities || activities.length === 0) {
            const now = new Date();
            activities = (surveys || [])
                .slice(0, 5)
                .map(s => ({
                    type: 'survey_created',
                    message: `Created survey "${s.title}"`,
                    createdAt: s.createdAt || now.toISOString()
                }));
        }

        activities = activities
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        if (!activities || activities.length === 0) {
            if (errorEl) {
                errorEl.textContent = 'No recent activity';
                errorEl.style.display = 'block';
            }
            container.innerHTML = '';
            return;
        }

        renderActivity(activities);
        if (errorEl) errorEl.style.display = 'none';
    } catch (err) {
        console.error('Failed to aggregate activity feed', err);
        showActivityError('Failed to load activity feed');
    }
}

async function enrichSurveysWithCounts(surveys) {
    try {
        if (!Array.isArray(surveys) || surveys.length === 0) return [];
        const limited = surveys.slice(0, 10);
        const results = await Promise.all(limited.map(s => getSurveyInvitationStats(s.id || s._id)));
        return limited.map((s, i) => {
            const r = results[i];
            const invStats = r && r.success && r.data && (r.data.stats || r.data) || {};
            const invitationCount = Number(invStats.totalInvitations || invStats.sent || s.invitationCount || 0);
            const completedCount = Number(invStats.completedInvitations || invStats.completed || 0);
            return {
                ...s,
                invitationCount,
                responseCount: Math.max(Number(s.responseCount || 0), completedCount)
            };
        });
    } catch (e) {
        console.error('Failed to enrich surveys with counts:', e);
        return surveys;
    }
}

let responsesTrendChartInstance = null;
function updateTrendChart(trends) {
    const ctx = document.getElementById('responsesTrendChart');
    if (!ctx) return;

    const labels = trends.map(t => t._id || t.date);
    const data = trends.map(t => t.count || 0);

    if (!responsesTrendChartInstance) {
        if (typeof window.Chart === 'undefined') {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            s.onload = () => updateTrendChart(trends);
            document.head.appendChild(s);
            return;
        }
        responsesTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Responses',
                    data,
                    borderColor: '#4285f4',
                    backgroundColor: 'rgba(66,133,244,0.15)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                animation: { duration: 300 },
                plugins: { legend: { display: false } },
                scales: { x: { display: true }, y: { beginAtZero: true } }
            }
        });
        return;
    }

    responsesTrendChartInstance.data.labels = labels;
    responsesTrendChartInstance.data.datasets[0].data = data;
    responsesTrendChartInstance.update('none');
}

function renderSurveyComparison(stats) {
    const container = document.getElementById('surveyComparison');
    if (!container) return;
    container.innerHTML = '';
    
    if (!stats || stats.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#64748b; padding:20px;">No survey data available</div>';
        return;
    }
    
    console.log('Survey comparison data:', stats); 
    const sorted = [...stats].sort((a, b) => {
        const ta = a.lastResponseDate ? new Date(a.lastResponseDate).getTime() : 0;
        const tb = b.lastResponseDate ? new Date(b.lastResponseDate).getTime() : 0;
        if (tb !== ta) return tb - ta;
        return (b.responseCount || 0) - (a.responseCount || 0);
    });

    surveyComparisonData = sorted;

    // Render all surveys in a scrollable container (no limit to 5)
    sorted.forEach((s, index) => {
        console.log(`Survey: ${s.title}, Responses: ${s.responseCount}, Invitations: ${s.invitationCount}, Last Response: ${s.lastResponseDate}`); // Debug log
        
        const baseInvites = Number(s.invitationCount || 0);
        const baseResponses = Number(s.responseCount || 0);
        const effectiveInvites = baseInvites > 0 ? baseInvites : (baseResponses > 0 ? baseResponses : 0);
        const completion = effectiveInvites > 0 ? Math.round((baseResponses / effectiveInvites) * 100) : (s.completionRate ?? 0);
        const safeCompletion = isNaN(completion) ? 0 : Math.max(0, Math.min(100, completion));
        
        const isRecent = s.lastResponseDate && (new Date() - new Date(s.lastResponseDate)) < (7 * 24 * 60 * 60 * 1000);
        const isTopRecent = index < 3 && s.responseCount > 0; // Top 3 with responses
        
        const item = document.createElement('div');
        item.className = `comparison-item ${isRecent ? 'recent-response' : ''} ${isTopRecent ? 'top-recent' : ''}`;
        item.innerHTML = `
            <div class="comparison-survey-name">
                ${escapeHtml(s.title || 'Untitled Survey')}
                ${isRecent ? '<span class="recent-badge">Recent</span>' : ''}
            </div>
            <div class="comparison-completion">
                <div class="completion-bar">
                    <div class="completion-fill" style="width: ${safeCompletion}%"></div>
                </div>
                <span class="completion-rate">${safeCompletion}%</span>
            </div>
        `;
        container.appendChild(item);
    });
}


async function enrichSurveyStatsWithInvitations(stats) {
    try {
        if (!Array.isArray(stats) || stats.length === 0) return [];
        const limited = stats.slice(0, 8);
        const ids = limited.map(s => s.surveyId || s.id || s._id);
        const results = await Promise.all(ids.map(id => getSurveyInvitationStats(id)));

        const surveyListMap = new Map((dashboardData.surveys || []).map(x => [String(x.id || x._id || x.surveyId), Number(x.responseCount || x.totalResponses || 0)]));

        const enriched = await Promise.all(limited.map(async (s, i) => {
            const r = results[i];
            const invStats = r && r.success && r.data && (r.data.stats || r.data) || {};
            let invitationCount = Number(invStats.totalInvitations || invStats.sent || s.invitationCount || 0);
            let completedCount = Number(invStats.completedInvitations || invStats.completed || s.responseCount || 0);

            if ((!invitationCount || invitationCount === 0) && (!completedCount || completedCount === 0)) {
                const list = await getSurveyInvitationsList(ids[i]);
                if (list && list.success && list.data && Array.isArray(list.data.invitations)) {
                    invitationCount = list.data.invitations.length;
                    completedCount = list.data.invitations.filter(x => x.status === 'completed').length;
                }
            }

            const fromDash = surveyListMap.get(String(ids[i]));
            if ((!completedCount || completedCount === 0) && typeof fromDash === 'number' && fromDash > 0) {
                completedCount = fromDash;
            }

            return {
                ...s,
                invitationCount,
                responseCount: typeof s.responseCount === 'number' ? s.responseCount : completedCount
            };
        }));

        return enriched;
    } catch (e) {
        console.error('Failed to enrich survey stats with invitation data:', e);
        return stats;
    }
}

// Merge response counts from cross-survey aggregation into survey list
async function mergeAggregatedResponseCounts(surveys) {
    try {
        const aggRes = await getCrossSurveyAggregationAPI();
        if (!aggRes.success || !aggRes.data) return surveys;
        const byId = new Map((aggRes.data.surveyStats || []).map(s => [String(s.surveyId), s]));
        return surveys.map(s => {
            const key = String((s.id || s._id || s.surveyId || '').toString());
            const agg = byId.get(key);
            if (!agg) return s;
            const merged = {
                ...s,
                responseCount: Math.max(
                    Number(s.responseCount || 0),
                    Number(agg.responseCount || 0)
                )
            };
            return merged;
        });
    } catch (e) {
        console.error('Failed to merge aggregated response counts:', e);
        return surveys;
    }
}

function renderTrendSummary(agg) {
    const container = document.getElementById('trendSummaryCards');
    if (!container) return;
    container.innerHTML = '';
    
    const trends = agg.responseTrends || [];
    const surveyStats = agg.surveyStats || [];
    
    const lastWeek = trends.slice(-7);
    const responseDelta = lastWeek.length > 1 ? (lastWeek[lastWeek.length-1].count - lastWeek[0].count) : 0;
    const responseChange = responseDelta >= 0 ? responseDelta : Math.abs(responseDelta);
    const responseTrend = responseDelta >= 0 ? 'positive' : 'negative';
    
    const avgCompletion = surveyStats.length > 0 ? 
        surveyStats.reduce((sum, s) => {
            const completion = s.invitationCount > 0 ? (s.responseCount / s.invitationCount) * 100 : 0;
            return sum + completion;
        }, 0) / surveyStats.length : 0;
    
    const activeSurveys = surveyStats.filter(s => s.responseCount > 0).length;
    
    const trendCards = [
        {
            icon: responseTrend,
            text: responseDelta >= 0 ? 'Response increase this week' : 'Response decrease this week',
            value: `${responseDelta >= 0 ? '+' : ''}${responseChange}`,
            period: 'vs last week',
            iconClass: responseTrend
        },
        {
            icon: 'neutral',
            text: 'Average completion rate',
            value: `${Math.round(avgCompletion)}%`,
            period: 'across all surveys',
            iconClass: 'neutral'
        },
        {
            icon: 'positive',
            text: 'Active surveys',
            value: activeSurveys,
            period: 'with responses',
            iconClass: 'positive'
        },
        {
            icon: 'warning',
            text: 'Total responses today',
            value: trends.length > 0 ? trends[trends.length-1]?.count || 0 : 0,
            period: 'responses received',
            iconClass: 'warning'
        }
    ];
    
    trendCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'trend-summary-card';
        cardElement.innerHTML = `
            <div class="trend-summary-header">
                <div class="trend-summary-icon ${card.iconClass}">
                    <i class="fas ${getTrendIcon(card.icon)}"></i>
                </div>
                <div class="trend-summary-text">${card.text}</div>
            </div>
            <div class="trend-summary-value">${card.value}</div>
            <div class="trend-summary-period">${card.period}</div>
        `;
        container.appendChild(cardElement);
    });
}

function getTrendIcon(type) {
    const icons = {
        positive: 'fa-arrow-up',
        negative: 'fa-arrow-down',
        neutral: 'fa-chart-line',
        warning: 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-chart-line';
}

function configureStatLabels() {
    const l1 = document.getElementById('labelTotalSurveys');
    const l2 = document.getElementById('labelTotalResponses');
    const l3 = document.getElementById('labelInvitations');
    const l4 = document.getElementById('labelCompletionRate');
    if (l1) l1.textContent = 'Total Surveys';
    if (l2) l2.textContent = 'Responses';
    if (l3) l3.textContent = 'Invitations';
    if (l4) l4.textContent = 'Completion Rate';
}

function renderInsights(agg) {
    const panel = document.getElementById('insightsPanel');
    if (!panel) return;
    
    const trends = agg.responseTrends || [];
    const surveyStats = agg.surveyStats || [];
    
    const insights = generateAutomatedInsights(trends, surveyStats);
    
    if (insights.length === 0) {
        panel.innerHTML = '<div class="no-insights">No insights available at this time.</div>';
        return;
    }
    
    panel.innerHTML = insights.map(insight => `
        <div class="insight-card ${insight.type}">
            <div class="insight-icon">
                <i class="fas ${insight.icon}"></i>
            </div>
            <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
                ${insight.metric ? `<div class="insight-metric">${insight.metric}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function generateAutomatedInsights(trends, surveyStats) {
    const insights = [];
    
    if (trends.length >= 7) {
        const lastWeek = trends.slice(-7);
        const firstHalf = lastWeek.slice(0, 3);
        const secondHalf = lastWeek.slice(4);
        
        const firstHalfAvg = firstHalf.reduce((sum, t) => sum + (t.count || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, t) => sum + (t.count || 0), 0) / secondHalf.length;
        
        const trendChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        
        if (Math.abs(trendChange) > 10) {
            insights.push({
                type: trendChange > 0 ? 'positive' : 'negative',
                icon: trendChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down',
                title: 'Response Trend Analysis',
                description: trendChange > 0 
                    ? 'Your surveys are trending upwards in responses this week'
                    : 'Response activity has declined in recent days',
                metric: `${Math.abs(trendChange).toFixed(1)}% ${trendChange > 0 ? 'increase' : 'decrease'}`
            });
        }
    }
    
    const surveysWithResponses = surveyStats.filter(s => s.responseCount > 0);
    if (surveysWithResponses.length > 1) {
        const sortedSurveys = surveysWithResponses.sort((a, b) => {
            const aRate = a.invitationCount > 0 ? (a.responseCount / a.invitationCount) * 100 : 0;
            const bRate = b.invitationCount > 0 ? (b.responseCount / b.invitationCount) * 100 : 0;
            return bRate - aRate;
        });
        
        const bestSurvey = sortedSurveys[0];
        const worstSurvey = sortedSurveys[sortedSurveys.length - 1];
        const bestRate = bestSurvey.invitationCount > 0 ? (bestSurvey.responseCount / bestSurvey.invitationCount) * 100 : 0;
        const worstRate = worstSurvey.invitationCount > 0 ? (worstSurvey.responseCount / worstSurvey.invitationCount) * 100 : 0;
        
        if (bestRate > 70) {
            insights.push({
                type: 'positive',
                icon: 'fa-star',
                title: 'Top Performer',
                description: `"${bestSurvey.title}" has excellent completion rates`,
                metric: `${bestRate.toFixed(1)}% completion`
            });
        }
        
        if (worstRate < 30 && worstRate > 0) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'Needs Attention',
                description: `"${worstSurvey.title}" has low completion rates`,
                metric: `${worstRate.toFixed(1)}% completion`
            });
        }
    }
    
    const totalResponses = surveyStats.reduce((sum, s) => sum + s.responseCount, 0);
    const totalInvitations = surveyStats.reduce((sum, s) => sum + s.invitationCount, 0);
    const overallRate = totalInvitations > 0 ? (totalResponses / totalInvitations) * 100 : 0;
    
    if (overallRate > 60) {
        insights.push({
            type: 'positive',
            icon: 'fa-chart-line',
            title: 'Strong Performance',
            description: 'Your surveys are performing well overall',
            metric: `${overallRate.toFixed(1)}% average completion`
        });
    } else if (overallRate < 30 && totalResponses > 0) {
        insights.push({
            type: 'warning',
            icon: 'fa-chart-line',
            title: 'Room for Improvement',
            description: 'Consider optimizing your survey design or invitation strategy',
            metric: `${overallRate.toFixed(1)}% average completion`
        });
    }
    
    const inactiveSurveys = surveyStats.filter(s => s.responseCount === 0 && s.invitationCount > 0);
    if (inactiveSurveys.length > 0) {
        insights.push({
            type: 'info',
            icon: 'fa-pause-circle',
            title: 'Inactive Surveys',
            description: `${inactiveSurveys.length} survey${inactiveSurveys.length > 1 ? 's' : ''} haven't received responses yet`,
            metric: inactiveSurveys.map(s => s.title).slice(0, 2).join(', ') + (inactiveSurveys.length > 2 ? '...' : '')
        });
    }
    
    return insights.slice(0, 4); 
}

function renderActivity(activities) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    feed.innerHTML = '';
    if (!activities || activities.length === 0) {
        showActivityError('No recent activity');
        return;
    }
    activities.forEach(a => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        const icon = a.type === 'response_submitted' ? 'fa-user-plus' : (a.type === 'survey_created' ? 'fa-edit' : 'fa-paper-plane');
        const color = a.type === 'response_submitted' ? 'green' : (a.type === 'survey_created' ? 'orange' : 'blue');
        const when = new Date(a.createdAt).toLocaleString();
        item.innerHTML = `
            <div class="activity-icon ${color}"><i class="fas ${icon}"></i></div>
            <div class="activity-text"><span class="activity-action">${escapeHtml(a.message || a.type)}</span><span class="activity-time">${when}</span></div>
        `;
        feed.appendChild(item);
    });
    feed.parentElement && (feed.parentElement.scrollTop = 0);
}

function showActivityError(msg) {
    const el = document.getElementById('activityError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
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

    // Update the total responses count in stats (computed from surveys)
    const totalResponsesElement = document.getElementById('totalResponses');
    if (totalResponsesElement) {
        const totalResponses = (surveys || []).reduce((sum, s) => {
            const responses = typeof s.totalResponses === 'number' ? s.totalResponses : (s.responseCount || 0);
            return sum + responses;
        }, 0);
        animateStatNumber(totalResponsesElement, totalResponses);
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

    // Check if we're on the my-surveys page to show all surveys
    const isMySurveysPage = window.location.pathname.includes('my-surverys.html');
    
    // Generate survey cards - show all on my-surveys page, limit to 5 on dashboard
    const surveysToShow = isMySurveysPage ? surveys : surveys.slice(0, 5);
    surveysToShow.forEach(survey => {
        const surveyCard = createSurveyCard(survey);
        surveysContainer.appendChild(surveyCard);
    });

    // Add "View All" link only if not on my-surveys page and there are more than 5 surveys
    if (!isMySurveysPage && surveys.length > 5) {
        const viewAllDiv = document.createElement('div');
        viewAllDiv.className = 'view-all-surveys';
        viewAllDiv.innerHTML = `
            <a href="my-surverys.html" class="link-view-all">
                View all ${surveys.length} surveys <i class="fas fa-arrow-right"></i>
            </a>
        `;
        surveysContainer.appendChild(viewAllDiv);
    }

    console.log(`Displayed ${surveysToShow.length} surveys out of ${surveys.length} total${isMySurveysPage ? ' (all surveys on my-surveys page)' : ''}`);
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

    list.innerHTML = '';

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

        if (!invitations.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <h4>No invitations yet</h4>
                    <p>You don't have any invitations at this time.</p>
                </div>
            `;
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
            const senderEmail = inv.creatorEmail ? ` (${inv.creatorEmail})` : '';

            const item = document.createElement('div');
            item.className = 'invitation-card';
            item.innerHTML = `
                <div class="invitation-header">
                        <span class="invitation-title">${inv.surveyTitle || 'Untitled Survey'}</span>
                    <span class="invitation-from">${sender}${senderEmail}</span>
                    <span class="invitation-due">${dueDateText}</span>
                </div>
                <button 
                    class="take-survey-btn ${ (inv.surveyStatus === 'completed' || inv.status === 'completed') ? 'disabled-btn' : '' }" 
                    data-surveylink="${inv.surveyLink}" 
                    data-invitationid="${inv.id}"
                    ${(inv.surveyStatus === 'completed' || inv.status === 'completed') ? 'disabled' : ''}>
                    ${(inv.surveyStatus === 'completed' || inv.status === 'completed') ? 'Completed' : 'Take Survey'}
                </button>


            `;
            list.appendChild(item);
        });

        // Use event delegation to prevent multiple listeners
        if (!list.hasAttribute('data-listeners-attached')) {
            list.setAttribute('data-listeners-attached', 'true');
            list.addEventListener("click", function (e) {
                if (e.target && e.target.classList.contains("take-survey-btn")) {
                    const surveyLink = e.target.getAttribute("data-surveylink");
                    const invitationId = e.target.getAttribute("data-invitationid");

                    const id1 = surveyLink.split("/survey/")[1].split("?")[0];
                    console.log("Survey ID:", id1);  

                    const match = surveyLink.match(/\/survey\/([^?]+)/);
                    const id2 = match ? match[1] : null;
                    console.log("Survey ID (regex):", id2);

                    window.location.href = `/public/dashboard/take-survey.html?id=${id2}&link=${encodeURIComponent(surveyLink)}`;
                }
            });
        }

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
    card.setAttribute('data-survey-id', survey.id || survey._id);

    const responses = typeof survey.totalResponses === 'number' ? survey.totalResponses : Number(survey.responseCount || 0);
    const maxResponses = typeof survey.maxResponses === 'number' ? survey.maxResponses : (survey.invitationCount || 0);
    const responseRate = maxResponses > 0 ? Math.round((responses / maxResponses) * 100) : 0;

    const createdAt = survey.createdAt ? new Date(survey.createdAt) : new Date();
    const createdDate = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Get question count - assuming it's stored in survey.questions or survey.questionCount
    const questionCount = survey.questions ? survey.questions.length : (survey.questionCount || 0);

    // Determine status
    const status = survey.status === 'active' ? 'ACTIVE' : 'INACTIVE';
    const statusClass = survey.status === 'active' ? 'status-active' : 'status-draft';

    card.innerHTML = `
        <div class="card-header">
            <h4 class="survey-title">${escapeHtml(survey.title)}</h4>
            <div class="survey-status ${statusClass}" data-role="status-label" data-id="${survey.id || survey._id}">${status}</div>
        </div>

        <div class="survey-meta">
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>Created ${createdDate}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-question-circle"></i>
                <span>${questionCount} Questions</span>
            </div>
        </div>

        <div class="survey-stats">
            <div class="stat">
                <div class="stat-value">${responses}</div>
                <div class="stat-label">RESPONSES</div>
            </div>
            <div class="stat">
                <div class="stat-value">${responseRate}%</div>
                <div class="stat-label">RESPONSE RATE</div>
            </div>
        </div>

        <div class="survey-actions">
            <button class="btn-small btn-outline" onclick="viewAnalytics('${survey.id || survey._id}')">
                <i class="fas fa-chart-line"></i> ANALYTICS
            </button>
            <button class="btn-small btn-outline" onclick="shareSurvey('${survey.id || survey._id}')">
                <i class="fas fa-share"></i> SHARE
            </button>
            <button class="btn-small btn-primary" onclick="toggleSurveyStatus('${survey.id || survey._id}')">
                <i class="fas fa-play"></i> ${survey.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
            </button>
        </div>
    `;

    return card;
}

window.toggleSurveyStatus = async function (surveyId) {
    try {
        const s = (dashboardData.surveys || []).find(x => String(x.id || x._id) === String(surveyId));
        const current = s && s.status === 'active' ? 'active' : 'closed';
        const nextStatus = current === 'active' ? 'closed' : 'active';
        const res = await updateSurveyStatusAPI(surveyId, nextStatus);
        if (res && res.success) {
            if (s) s.status = nextStatus;
            const card = document.querySelector(`.survey-card[data-survey-id="${surveyId}"]`);
            if (card) {
                const label = card.querySelector('[data-role="status-label"]');
                if (label) {
                    label.textContent = nextStatus === 'active' ? 'ACTIVE' : 'INACTIVE';
                    label.classList.toggle('status-active', nextStatus === 'active');
                    label.classList.toggle('status-draft', nextStatus !== 'active');
                }
                
                // Update the activate/deactivate button text
                const toggleButton = card.querySelector('.btn-primary');
                if (toggleButton) {
                    const buttonText = nextStatus === 'active' ? 'DEACTIVATE' : 'ACTIVATE';
                    const buttonIcon = nextStatus === 'active' ? 'fa-pause' : 'fa-play';
                    toggleButton.innerHTML = `<i class="fas ${buttonIcon}"></i> ${buttonText}`;
                }
            }
            M.toast({ html: `<i class="fas fa-check"></i> Survey ${nextStatus}`, classes: 'success-toast', displayLength: 2000 });
        } else {
            const msg = (res && res.data && res.data.error) || res.error || 'Failed to update survey status';
            M.toast({ html: `<i class="fas fa-exclamation-triangle"></i> ${msg}`, classes: 'error-toast', displayLength: 3000 });
        }
    } catch (e) {
        console.error('Toggle survey status error', e);
        M.toast({ html: '<i class="fas fa-exclamation-triangle"></i> Failed to update survey status', classes: 'error-toast', displayLength: 3000 });
    }
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

// Relative time formatter
function formatRelativeTime(date) {
    try {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const diffMs = date.getTime() - Date.now();
        const seconds = Math.round(diffMs / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        if (Math.abs(days) >= 1) return rtf.format(days, 'day');
        if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
        if (Math.abs(minutes) >= 1) return rtf.format(minutes, 'minute');
        return rtf.format(seconds, 'second');
    } catch (_) {
        return date.toLocaleDateString();
    }
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
 * Phase 6: Survey action handlers - Connected to existing functionality
 */
window.viewSurvey = async function (surveyId) {
    console.log('Viewing survey:', surveyId);
    try {
        // Navigate to my-surveys page which shows detailed survey information
        window.location.href = 'my-surverys.html';
    } catch (error) {
        console.error('Error navigating to survey view:', error);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Error opening survey view',
            classes: 'error-toast',
            displayLength: 3000
        });
    }
};

window.viewAnalytics = async function (surveyId) {
    console.log('Viewing analytics for survey:', surveyId);
    try {
        // Navigate to survey analytics page with survey ID
        window.location.href = `survey-analytics.html?id=${surveyId}`;
    } catch (error) {
        console.error('Error navigating to analytics:', error);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Error opening analytics',
            classes: 'error-toast',
            displayLength: 3000
        });
    }
};

window.editSurvey = function (surveyId) {
    console.log('Editing survey:', surveyId);
    try {
        // Store survey ID for editing and navigate to create-survey page
        sessionStorage.setItem('editSurveyId', surveyId);
        sessionStorage.setItem('editMode', 'true');
        window.location.href = 'create-survey.html';
    } catch (error) {
        console.error('Error navigating to survey edit:', error);
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Error opening survey editor',
            classes: 'error-toast',
            displayLength: 3000
        });
    }
};

window.shareSurvey = async function (surveyId) {
    console.log('Sharing survey:', surveyId);
    
    // Redirect to dedicated share page
    window.location.href = `share-survey.html?surveyId=${surveyId}`;
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

    console.log(`Filtering surveys with term: "${term}"`);
    console.log(`Found ${surveyCards.length} survey cards`);

    let visibleCount = 0;
    surveyCards.forEach(card => {
        const titleElement = card.querySelector('.survey-title');
        if (!titleElement) {
            console.warn('Survey card missing title element:', card);
            return;
        }
        
        const title = titleElement.textContent.toLowerCase();
        const shouldShow = title.includes(term);
        card.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) visibleCount++;
        console.log(`Survey "${title}" - ${shouldShow ? 'SHOW' : 'HIDE'}`);
    });
    
    // Show/hide no results message
    const surveysContainer = document.getElementById('surveysContainer');
    if (surveysContainer) {
        let noResultsMsg = surveysContainer.querySelector('.no-results-message');
        
        if (term && visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.style.cssText = 'text-align: center; color: #6c757d; padding: 20px; font-style: italic;';
                noResultsMsg.innerHTML = `No surveys found matching "${searchTerm}"`;
                surveysContainer.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
}

function filterInvitations(searchTerm) {
    const invitationCards = document.querySelectorAll('.invitation-card');
    const term = searchTerm.toLowerCase();
    
    console.log(`Filtering invitations with term: "${term}"`);
    console.log(`Found ${invitationCards.length} invitation cards`);

    let visibleCount = 0;
    invitationCards.forEach(card => {
        const titleElement = card.querySelector('.invitation-title');
        if (!titleElement) {
            console.warn('Invitation card missing title element:', card);
            return;
        }
        
        const title = titleElement.textContent.toLowerCase();
        const shouldShow = title.includes(term);
        
        // Use display: flex to maintain proper card layout
        card.style.display = shouldShow ? 'flex' : 'none';
        
        // Ensure card maintains its styling
        if (shouldShow) {
            card.style.background = '#ffffff';
            card.style.border = '1px solid #e8edf5';
            card.style.borderRadius = '8px';
            card.style.padding = '16px';
            card.style.boxShadow = '0 1px 2px rgba(16,24,40,0.04)';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.marginBottom = '16px';
        }
        
        if (shouldShow) visibleCount++;
        console.log(`Invitation "${title}" - ${shouldShow ? 'SHOW' : 'HIDE'}`);
    });
    
    // Show/hide no results message
    const invitationsContainer = document.getElementById('invitations-list');
    if (invitationsContainer) {
        let noResultsMsg = invitationsContainer.querySelector('.no-results-message');
        
        if (term && visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.style.cssText = 'text-align: center; color: #6c757d; padding: 20px; font-style: italic;';
                noResultsMsg.innerHTML = `No invitations found matching "${searchTerm}"`;
                invitationsContainer.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
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
