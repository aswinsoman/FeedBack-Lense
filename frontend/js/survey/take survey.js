// Global variable to store survey data
import { getUserSurveysData, getUserProfile, submitSurveyResponse } from "../api/api.js";
import { clearToken, getToken } from "../lib/lib.js";

let surveyData = null;
let isInitialized = false; // Prevent multiple initialization
let userProfileLoaded = false; // Prevent multiple user profile loads
let dropdownInitialized = false; // Prevent multiple dropdown initialization
let userResponses = {}; // Store user responses between page navigations

// Initialize Materialize components
document.addEventListener("DOMContentLoaded", function () {
    // Prevent multiple initialization
    if (isInitialized) {
        console.log('Already initialized, skipping...');
        return;
    }
    isInitialized = true;
    
    console.log('Take survey page loaded');
    M.AutoInit();

    // Parse URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get("id") || null;
    
    console.log('Survey ID:', surveyId);

    // SIMPLIFIED AUTHENTICATION FLOW:
    // 1. Always require user authentication
    // 2. Try to load survey directly (access control is handled by backend)
    // 3. Show appropriate error if access denied
    
    const userToken = getToken(); // Use proper token getter from lib.js
    console.log('User auth token present:', !!userToken);
    
    if (!userToken) {
        console.log('No user authentication found, redirecting to login');
        // Save current URL for redirect after login
        const currentUrl = window.location.href;
        sessionStorage.setItem('returnUrl', currentUrl);
        window.location.href = '../auth/signin.html';
        return;
    }

    // User is authenticated, load user profile and survey
    setTimeout(() => {
        console.log('Loading user profile...');
        loadUserProfile();
    }, 100);
    
    // Try to load survey (access control handled by backend)
    loadSurveyData(surveyId);
});

// Show access denied message
function showAccessDenied(message) {
    const surveyContent = document.getElementById("survey-content");
    surveyContent.innerHTML = `
        <div class="access-denied-container" style="text-align: center; padding: 60px 20px;">
            <i class="material-icons large" style="font-size: 80px; color: #f44336; margin-bottom: 20px;">block</i>
            <h4 style="color: #333; margin-bottom: 16px;">No Access</h4>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">${message}</p>
            <a href="index.html" class="btn waves-effect waves-light" style="background-color: #4285f4;">
                <i class="material-icons left">arrow_back</i>
                Back to Dashboard
            </a>
        </div>
    `;
    
    // User profile and dropdown are already initialized in the main flow
    // No need to call them again here
}

// Load survey data from API (access control handled by backend)
async function loadSurveyData(surveyId) {
    try {
        if (!surveyId) {
            showAccessDenied('Invalid survey link.');
            return;
        }

        console.log('Loading survey data for authenticated user');
        const result = await getUserSurveysData(surveyId);
        console.log('Survey load result:', result);

        if (result.success) {
            surveyData = result.data.survey;
            renderSurvey(surveyData);
        } else {
            // Handle different types of errors
            if (result.status === 403) {
                showAccessDenied('You do not have access to this survey.');
            } else if (result.status === 404) {
                showAccessDenied('Survey not found.');
            } else {
                showError("Failed to load survey. Please try again.");
            }
        }
    } catch (error) {
        console.error("LoadSurveyData Error:", error);
        showError("An unexpected error occurred. Please try again.");
    }
}

let currentPage = 1;
const questionsPerPage = 2; // Only 2 questions per page

// Helper function to save responses on the current page - global scope for accessibility
window.saveCurrentPageResponses = function() {
    if (!surveyData || !surveyData.questions) return;
    
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const pageQuestions = surveyData.questions.slice(startIndex, endIndex);
    
    pageQuestions.forEach(question => {
        const textArea = document.getElementById(`text_question_${question.questionId}`);
        if (textArea) {
            userResponses[question.questionId] = textArea.value;
        }
    });
};

function renderSurvey(data) {
    const surveyContent = document.getElementById("survey-content");

    const createdDate = new Date(data.createdAt).toLocaleDateString();

    // Header
    const headerHtml = `
      <div class="survey-header">
        <h1 class="survey-title">${data.title}</h1>
        <div class="survey-meta">
          <div>Created By - ${data.creatorName}</div>
          <div>Created Date : ${createdDate}</div>
        </div>
      </div>
    `;

    // Function to render a page of questions
    function renderPage(page) {
        const startIndex = (page - 1) * questionsPerPage;
        const endIndex = startIndex + questionsPerPage;
        const pageQuestions = data.questions.slice(startIndex, endIndex);

        let questionsHtml = "";
        pageQuestions.forEach((question, index) => {
            const globalIndex = startIndex + index;
            // Get previously saved response for this question, if any
            const savedResponse = userResponses[question.questionId] || '';
            
            questionsHtml += `
              <div class="text-question">
                <div class="question-title">Q${globalIndex + 1}: ${question.questionText}</div>
                <div class="text-area-container">
                  <textarea
                    class="custom-textarea"
                    placeholder="Write your answer here..."
                    rows="5"
                    id="text_question_${question.questionId}"
                  >${savedResponse}</textarea>
                </div>
              </div>
            `;
        });

        // Pagination buttons
        let paginationHtml = `
          <div class="pagination-container" style="display: flex; justify-content: center; align-items: center; margin-top: 32px; gap: 16px;">
            ${currentPage > 1
              ? `<button class="pagination-btn waves-effect waves-light" onclick="prevPage()">
                  <i class="material-icons left">chevron_left</i> Previous
                </button>`
              : ""}
            <span style="font-weight: 500; color: #4285f4; font-size: 1.1rem; margin: 0 12px;">
              Page ${currentPage} of ${Math.ceil(data.questions.length / questionsPerPage)}
            </span>
            ${currentPage * questionsPerPage < data.questions.length
              ? `<button class="pagination-btn waves-effect waves-light" onclick="nextPage()">
                  Next <i class="material-icons right">chevron_right</i>
                </button>`
              : ""}
          </div>
        `;

        // Finish button only on last page
        if (currentPage * questionsPerPage >= data.questions.length) {
            questionsHtml += `
              <div class="finish-section" style="margin-top: 20px;">
                <button class="btn finish-btn waves-effect waves-light" onclick="submitSurvey()">
                  Finish
                </button>
              </div>
            `;
        }

        surveyContent.innerHTML = headerHtml + questionsHtml + paginationHtml;
        M.AutoInit();
    }

    // Pagination navigation functions
    window.nextPage = function() {
        // Save current page responses before navigating
        window.saveCurrentPageResponses();
        currentPage++;
        renderPage(currentPage);
    }

    window.prevPage = function() {
        // Save current page responses before navigating
        window.saveCurrentPageResponses();
        currentPage--;
        renderPage(currentPage);
    }

    // Render first page
    renderPage(currentPage);
}


// Show error
function showError(message) {
    const surveyContent = document.getElementById("survey-content");
    surveyContent.innerHTML = `
      <div class="error-container">
        <i class="material-icons large">error_outline</i>
        <h5>${message}</h5>
        <button class="btn waves-effect waves-light retry-btn" onclick="window.location.reload()">
          Retry
        </button>
      </div>
    `;
}

// Handle survey submission
window.submitSurvey = async function() {
    if (!surveyData) return;

    // Before submission, save responses from the current page
    saveCurrentPageResponses();

    // Prepare responses array for the expected format
    const responsesArray = [];
    let allAnswered = true;

    // Validate all questions are answered - now checking from userResponses object
    surveyData.questions.forEach((question, index) => {
        const answer = userResponses[question.questionId];
        
        if (answer && answer.trim()) {
            responsesArray.push({
                questionId: question.questionId,
                questionText: question.questionText,
                answer: answer.trim()
            });
        } else {
            allAnswered = false;
            M.toast({
                html: `Please provide an answer for Question ${index + 1}`,
                classes: "red",
            });
        }
    });

    if (!allAnswered) return;

    // Show loading state
    document.querySelector(".finish-btn").classList.add("disabled");
    document.querySelector(".finish-btn").innerText = "Submitting...";
    
    // Disable all form inputs
    document.querySelectorAll(".custom-textarea, .finish-btn")
        .forEach((element) => (element.style.pointerEvents = "none"));

    try {
        // Extract URL params to get invitation ID if available
        const urlParams = new URLSearchParams(window.location.search);
        let invitationId = urlParams.get("invitationId") || urlParams.get("token");
        
        // Check if the invitationId is a JWT token and extract the invitationId from it
        if (invitationId && invitationId.includes('.')) {
            try {
                // Attempt to extract invitationId from token payload
                const tokenParts = invitationId.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    if (payload.invitationId) {
                        invitationId = payload.invitationId;
                    }
                }
            } catch (err) {
                console.error('Error extracting invitationId from token:', err);
                // Continue with the original invitationId
            }
        }
        
        console.log("Processed Invitation ID:", invitationId);
        
        // Get respondent ID from current user, or create a placeholder for anonymous
        const respondentId = window.currentUser?._id || '000000000000000000000000';
        
        // Generate a random invitation ID if none exists
        const randomInvitationId = new Date().getTime().toString(16) + Math.random().toString(16).slice(2);
        
        console.log("Survey ID:", surveyData.id);
        console.log("User ID:", respondentId);
        
        // Prepare data for submission
        const responseData = {
            surveyId: surveyData.id,
            respondentId: respondentId,
            invitationId: invitationId || randomInvitationId,
            responses: responsesArray,
            completionTime: 300, // Hardcoded time for now (5 minutes)
        };
        
        console.log("Submitting response data:", responseData);

        // Display submission progress
        M.toast({ html: "Submitting your responses...", classes: "blue" });
        
        // Submit to API
        const result = await submitSurveyResponse(responseData);
        
        // Always log detailed API response for debugging
        console.log("API response details:", {
            success: result.success,
            status: result.status,
            data: result.data,
            error: result.error
        });
        
        if (result.success) {
            // Show success message
            M.toast({ html: "Survey submitted successfully!", classes: "green" });
            
            // Log success with full response data
            console.log("Survey response submission successful:", result.data);
            
            // Show completion screen with survey data
            showCompletionScreen(surveyData);
            
            // Clear stored responses after successful submission
            userResponses = {};
        } else {
            // Extract error message
            let errorMsg = 'Unknown error';
            
            if (result.error) {
                errorMsg = result.error;
            } else if (result.status === 409) {
                errorMsg = 'You have already submitted a response for this survey';
            } else if (result.status === 400) {
                errorMsg = 'Invalid submission data. Please check your responses';
            } else if (result.status === 401 || result.status === 403) {
                errorMsg = 'Authentication error. Please try logging in again';
            }
            
            // Show detailed error message
            M.toast({ 
                html: `Failed to submit survey: ${errorMsg}`, 
                classes: "red",
                displayLength: 6000
            });
            
            // Re-enable the submit button
            document.querySelector(".finish-btn").classList.remove("disabled");
            document.querySelector(".finish-btn").innerText = "Finish";
            
            // Re-enable form inputs
            document.querySelectorAll(".custom-textarea, .finish-btn")
                .forEach((element) => (element.style.pointerEvents = "auto"));
                
            console.error("Survey submission error:", result);
        }
    } catch (error) {
        console.error("Survey submission error:", error);
        
        // Try to extract a more specific error message if possible
        let errorMessage = "An error occurred while submitting the survey.";
        
        if (error.response) {
            try {
                const errorData = error.response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (_) {
                // Fallback to generic message
            }
        }
        
        M.toast({ 
            html: errorMessage + " Please try again.", 
            classes: "red",
            displayLength: 5000
        });
        
        // Add another toast with instructions
        setTimeout(() => {
            M.toast({ 
                html: "Check your connection or contact support if this persists.", 
                classes: "orange",
                displayLength: 5000
            });
        }, 1000);
        
        // Re-enable the submit button
        document.querySelector(".finish-btn").classList.remove("disabled");
        document.querySelector(".finish-btn").innerText = "Finish";
        
        // Re-enable form inputs
        document.querySelectorAll(".custom-textarea, .finish-btn")
            .forEach((element) => (element.style.pointerEvents = "auto"));
            
        // Log the full error for debugging
        console.error("Full error object:", error);
    }
}

// User profile functionality
async function loadUserProfile() {
    if (userProfileLoaded) {
        console.log('User profile already loaded, skipping...');
        return;
    }
    userProfileLoaded = true;
    
    try {
        console.log('Loading user profile...');
        const profile = await getUserProfile();
        console.log('User profile response:', profile);
        
        if (profile.success && profile.data) {
            console.log('Profile data received:', profile.data);
            updateUserDisplay(profile.data);
        } else {
            console.error('Failed to load user profile:', profile.message || 'Unknown error');
            console.log('Profile response status:', profile.status);
            updateUserDisplay({ name: 'User' });
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        updateUserDisplay({ name: 'User' });
    }
}

function updateUserDisplay(userData) {
    // Store user data globally for dropdown (used by dashboard.js)
    window.currentUser = userData;
    
    console.log('User data stored globally for dashboard.js to use');
}

// The user dropdown functionality is now handled by dashboard.js

// The handleLogout function is now handled by dashboard.js

// Function to show the survey completion screen
function showCompletionScreen(surveyData) {
    const surveyContent = document.getElementById("survey-content");
    
    // Format today's date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    // Generate survey ID (use the real one if available, otherwise create a placeholder)
    const surveyId = surveyData.id ? surveyData.id.substring(0, 5) : "01156";
    
    // Create completion screen HTML
    surveyContent.innerHTML = `
        <div class="survey-completed-container">
            <div class="survey-completed-card">
                <div class="survey-completed-content">
                    <h2 class="survey-completed-title">Survey Completed <i class="material-icons green-text">check_circle</i></h2>
                    
                    <div class="survey-completed-details">
                        <p class="survey-info">Survey ID: <span>${surveyId}</span></p>
                        <p class="survey-info">Completed: <span>${formattedDate}</span></p>
                    </div>
                    
                    <div class="survey-completed-illustration">
                        <img src="../images/completed.svg" alt="Survey Completed" 
                            onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/6656/6656309.png';">
                    </div>
                    
                    <div class="survey-completed-actions">
                        <button class="btn waves-effect waves-light" onclick="location.href='../dashboard/index.html'">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
