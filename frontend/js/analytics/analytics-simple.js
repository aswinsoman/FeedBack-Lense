// Simple Analytics Overview (No Modules)
console.log('🚀 Simple Analytics loaded');

// Simple utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTableDate(date) {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });
}

// Generate short survey ID
function generateShortId(fullId, index) {
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

// Navigate to survey details
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
    
    window.location.href = `survey-analytics.html?id=${encodeURIComponent(surveyId)}`;
}

// Render dummy surveys table
function renderDummySurveysTable() {
    console.log('📋 Rendering dummy surveys table');
    
    const tableBody = document.getElementById('surveysTableBody');
    if (!tableBody) {
        console.error('❌ Table body element not found');
        return;
    }
    
    // Create dummy survey data
    const dummySurveys = [
        {
            _id: 'survey_001',
            title: 'Customer Satisfaction Survey',
            createdAt: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'active'
        },
        {
            _id: 'survey_002', 
            title: 'Employee Feedback Survey',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'active'
        },
        {
            _id: 'survey_003',
            title: 'Product Review Survey',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'completed'
        },
        {
            _id: 'survey_004',
            title: 'Website Usability Survey',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: 'active'
        },
        {
            _id: 'survey_005',
            title: 'Market Research Survey',
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: 'completed'
        }
    ];
    
    console.log(`📊 Rendering ${dummySurveys.length} dummy surveys`);
    
    // Generate table rows HTML
    const rowsHTML = dummySurveys.map((survey, index) => {
        const totalResponses = Math.floor(Math.random() * 100) + 10; // Random responses
        
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
    
    // Add hover effects
    document.querySelectorAll('.survey-row').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateX(4px)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateX(0)';
        });
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchSurveys');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.survey-row');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// Initialize the page
function initializeSimpleAnalytics() {
    console.log('🔍 Initializing Simple Analytics');
    
    // Initialize Materialize components
    M.AutoInit();
    
    // Show dummy data immediately
    setTimeout(() => {
        renderDummySurveysTable();
        initializeSearch();
        console.log('✅ Simple Analytics initialized');
    }, 500);
}

// Make functions global
window.navigateToSurveyDetails = navigateToSurveyDetails;
window.renderDummySurveysTable = renderDummySurveysTable;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSimpleAnalytics);
