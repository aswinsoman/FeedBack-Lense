// Share Survey Page - Based on existing invitation functionality
import { 
    getAuthToken,
    requireAuth,
    getUserProfile,
    getUserSurveys,
    sendInvitations,
    getSurveyInvitationsList
} from '../api/api.js';

class ShareSurveyApp {
    constructor() {
        this.invitations = [];
        this.surveys = {};
        this.lastToastTime = 0;
        this.currentSurvey = null;
        this.init();
    }

    init() {
        console.log("Initializing Share Survey UI...");
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }
        
        this.loadUserProfile();
        this.loadSurveyData();
        this.setupEventListeners();
        this.renderInvitationsList();
    }

    checkAuthentication() {
        return requireAuth();
    }

    async loadUserProfile() {
        try {
            const result = await getUserProfile();
            if (result.success && result.data) {
                this.updateUserDisplay(result.data);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    updateUserDisplay(user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
    }

    async loadSurveyData() {
        try {
            // Get survey ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const surveyId = urlParams.get('surveyId');
            
            if (!surveyId) {
                this.showToast('No survey ID provided', 'red');
                return;
            }

            const result = await getUserSurveys();
            if (!result.success || !result.data) {
                throw new Error('Failed to load surveys');
            }
            
            const surveys = result.data.surveys || result.data || [];
            const survey = surveys.find(s => String(s.id || s._id) === String(surveyId));
            
            if (!survey) {
                throw new Error('Survey not found');
            }
            
            this.currentSurvey = survey;
            this.surveys[surveyId] = survey;
            
        } catch (error) {
            console.error('Error loading survey data:', error);
            this.showToast('Failed to load survey data', 'red');
        }
    }

    setupEventListeners() {
        const emailInput = document.getElementById("emailInput");
        const sendBtn = document.getElementById("sendBtn");
        const returnBtn = document.querySelector('.return-btn');

        if (sendBtn) {
            sendBtn.addEventListener("click", () => this.sendInvitation());
        }

        if (emailInput) {
            emailInput.addEventListener("keypress", (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendInvitation();
                }
            });
        }

        // Add event listener for return button as backup
        if (returnBtn) {
            returnBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Return button clicked via event listener');
                window.location.href = 'index.html';
            });
        }
    }

    // ======== Email Validation ======== //
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ======== Send Invitation ======== //
    async sendInvitation() {
        const input = document.getElementById("emailInput");
        if (!input) {
            this.showToast("Email input not found. Please refresh the page.", "red");
            return;
        }

        const email = input.value.trim();
        if (!email) {
            this.showToast("Please enter an email address.", "red");
            return;
        }

        if (!this.validateEmail(email)) {
            this.showToast("Please enter a valid email address.", "red");
            return;
        }

        if (!this.currentSurvey) {
            this.showToast("Survey not found. Please refresh the page.", "red");
            return;
        }

        // Check if email already exists
        const existingInvitation = this.invitations.find(inv => 
            inv.recipientEmail === email || inv.email === email
        );
        
        if (existingInvitation) {
            this.showToast("This email has already been invited.", "red");
            return;
        }

        try {
            const sendBtn = document.getElementById("sendBtn");
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            }

            const result = await sendInvitations(this.currentSurvey.id || this.currentSurvey._id, [email]);
            
            if (result.success && result.data && result.data.results) {
                // Check the individual result for this email
                const emailResult = result.data.results.find(r => r.email === email);
                
                if (emailResult && emailResult.success) {
                    this.showToast("Invitation sent successfully!", "green");
                    input.value = "";
                    
                    // Add to local invitations list
                    const newInvitation = {
                        id: Date.now(), // Temporary ID
                        recipientEmail: email,
                        email: email,
                        status: 'pending',
                        surveyId: this.currentSurvey.id || this.currentSurvey._id,
                        createdAt: new Date().toISOString()
                    };
                    
                    this.invitations.unshift(newInvitation);
                    this.renderInvitationsList();
                } else {
                    // Check the specific error for this email
                    const errorMessage = emailResult ? emailResult.error : "Failed to send invitation";
                    const lowerErrorMessage = errorMessage.toLowerCase();
                    
                    // Check for various patterns that might indicate user doesn't exist
                    if (lowerErrorMessage.includes('user not found') || 
                        lowerErrorMessage.includes('user must be registered') ||
                        lowerErrorMessage.includes('not registered')) {
                        this.showToast("This email is not registered as a user. Only registered users can receive invitations.", "red");
                    } else if (lowerErrorMessage.includes('cannot invite yourself')) {
                        this.showToast("You cannot invite yourself.", "red");
                    } else if (lowerErrorMessage.includes('already invited')) {
                        this.showToast("This email has already been invited to this survey.", "red");
                    } else {
                        this.showToast(errorMessage, "red");
                    }
                }
            } else {
                // Fallback for unexpected response format
                this.showToast("Failed to send invitation. Please try again.", "red");
            }
        } catch (error) {
            console.error("Error sending invitation:", error);
            this.showToast("Failed to send invitation. Please try again.", "red");
        } finally {
            const sendBtn = document.getElementById("sendBtn");
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = 'Send Invitation';
            }
        }
    }

    // ======== Render Invitations List ======== //
    async renderInvitationsList() {
        const list = document.getElementById('invitationList');
        if (!list) return;

        list.innerHTML = '';

        try {
            if (this.currentSurvey) {
                const result = await getSurveyInvitationsList(this.currentSurvey.id || this.currentSurvey._id);
                
                if (result.success && result.data) {
                    this.invitations = result.data.invitations || [];
                }
            }

            if (this.invitations.length === 0) {
                list.innerHTML = '<p class="no-invitations-text">No invitations yet.</p>';
                return;
            }

            this.invitations.forEach(invitation => {
                const item = document.createElement('div');
                item.className = `invitation-item ${invitation.status}`;
                
                const email = invitation.recipientEmail || invitation.email || 'Unknown Email';
                const status = invitation.status || 'pending';
                const statusText = status === 'completed' ? 'Approved' : 'Pending';
                const statusClass = status === 'completed' ? 'approved' : 'pending';

                item.innerHTML = `
                    <div class="invitation-email">${email}</div>
                    <div class="invitation-status">
                        <div class="status-badge ${statusClass}">
                            <i class="fas ${status === 'completed' ? 'fa-check' : 'fa-clock'}"></i>
                            ${statusText}
                        </div>
                        <div class="action-buttons">
                            <button class="btn action-btn resend-btn" onclick="shareApp.resendInvitation('${invitation._id || invitation.id}')">
                                <i class="fas fa-paper-plane"></i> Resend
                            </button>
                            <button class="btn action-btn revoke-btn" onclick="shareApp.revokeInvitation('${invitation._id || invitation.id}')">
                                <i class="fas fa-times"></i> Revoke
                            </button>
                        </div>
                    </div>
                `;
                
                list.appendChild(item);
            });

        } catch (error) {
            console.error('Error rendering invitations:', error);
            list.innerHTML = '<div style="text-align: center; color: #dc3545; padding: 20px;">Error loading invitations</div>';
        }
    }

    // ======== Resend Invitation ======== //
    async resendInvitation(invitationId) {
        const invitation = this.invitations.find(inv => inv._id === invitationId || inv.id === invitationId);
        if (!invitation) {
            this.showToast("Invitation not found", "red");
            return;
        }

        try {
            const email = invitation.recipientEmail || invitation.email;
            const result = await sendInvitations(this.currentSurvey.id || this.currentSurvey._id, [email]);
            
            if (result.success) {
                this.showToast("Invitation resent successfully!", "green");
            } else {
                this.showToast(result.error || "Failed to resend invitation", "red");
            }
        } catch (error) {
            console.error("Error resending invitation:", error);
            this.showToast("Failed to resend invitation", "red");
        }
    }

    // ======== Revoke Invitation ======== //
    async revokeInvitation(invitationId) {
        if (!confirm('Are you sure you want to revoke this invitation?')) {
            return;
        }

        try {
            // Remove from local list
            this.invitations = this.invitations.filter(inv => inv._id !== invitationId && inv.id !== invitationId);
            this.renderInvitationsList();
            this.showToast("Invitation revoked!", "red");
        } catch (error) {
            console.error("Error revoking invitation:", error);
            this.showToast("Failed to revoke invitation", "red");
        }
    }

    // ======== Toast Notifications ======== //
    showToast(message, type = 'info') {
        const now = Date.now();
        if (now - this.lastToastTime < 1000) return; // Prevent rapid toasts
        this.lastToastTime = now;

        const toastClass = type === 'green' ? 'success-toast' : 
                          type === 'red' ? 'error-toast' : 'info-toast';
        
        M.toast({
            html: `<i class="fas fa-${type === 'green' ? 'check-circle' : type === 'red' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`,
            classes: toastClass,
            displayLength: 3000
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.shareApp = new ShareSurveyApp();
});

// Global function for return to dashboard button
window.returnToDashboard = function() {
    console.log('Returning to dashboard...');
    try {
        // Try multiple methods to ensure navigation works
        window.location.href = 'index.html';
        // Fallback method
        setTimeout(() => {
            if (window.location.pathname.includes('share-survey.html')) {
                window.location.replace('index.html');
            }
        }, 100);
    } catch (error) {
        console.error('Error navigating to dashboard:', error);
        // Final fallback
        window.location.replace('index.html');
    }
};
