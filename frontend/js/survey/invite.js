// invitation.js
import {getReceivedInvitations, sendInvitations} from '../api/api.js';

class InvitationApp {
  constructor() {
    this.invitations = [];
    this.surveys = {}; // add this to prevent undefined errors
    this.lastToastTime = 0; // Prevent rapid toast messages
    this.init();
  }

  init() {
    console.log("Initializing Invitations UI...");
    this.renderInvitations();
    this.setupEventListeners();
    this.autoApproveDemo();
    this.renderInvitationsList(); // initial render
    this.loadUserProfile(); // Initialize user profile
  }

  setupEventListeners() {
    const emailInput = document.getElementById("emailInput");
    const sendBtn = document.getElementById("sendBtn");

    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.sendInvitation());
    }

    // Optional: search input listener
    const searchInput = document.getElementById('invitation-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderInvitationsList());
    }
  }

  // ======== Email Validation ======== //
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ======== Send Invitation ======== //
  async sendInvitation() {
    // Get email from input field
    const input = document.getElementById("emailInput");
    if (!input) {
      this.showToast("Email input not found. Please refresh the page.", "red");
      return;
    }

    const email = input.value.trim();
    
    // Check if email is provided
    if (!email) {
      this.showToast("Please enter an email address before sending invitation.", "red");
      return;
    }

    // Validate email format
    if (!this.validateEmail(email)) {
      this.showToast("Please enter a valid email address.", "red");
      return;
    }

    // Show loading state
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add("loading");
      sendBtn.innerHTML = `<span class="spinner"></span> Sending...`;
    }

    // Get survey ID
    const surveyIdElement = document.getElementById('surveyId');
    if (!surveyIdElement) {
      this.showToast("Survey ID not found. Please refresh the page.", "red");
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove("loading");
        sendBtn.innerHTML = "Send Invitation";
      }
      return;
    }

    const surveyId = surveyIdElement.getAttribute('data-full-id') || surveyIdElement.textContent;

    try {
      // Send invitation
      const result = await sendInvitations(surveyId, [email]);

      // Restore button state
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove("loading");
        sendBtn.innerHTML = "Send Invitation";
      }

      console.log('Full API result:', result);
      
      // Check if the API call was successful
      if (!result.success) {
        console.log('API call failed with error:', result.error);
        this.showToast(result.error || "Failed to send invitation. Please try again.", "red");
        return;
      }
      
      // Process the result and show appropriate message
      this.handleInvitationResult(result, email);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      
      // Restore button state
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove("loading");
        sendBtn.innerHTML = "Send Invitation";
      }
      
      this.showToast("Failed to send invitation. Please try again.", "red");
    }
  }

  // Handle invitation result and show appropriate message
  handleInvitationResult(result, email) {
    console.log('Processing invitation result:', result);
    console.log('Result structure:', {
      success: result.success,
      data: result.data,
      error: result.error
    });
    
    // Check if API call was successful
    if (!result.success) {
      console.log('API call failed:', result.error);
      this.showToast(result.error || "Failed to send invitation. Please try again.", "red");
      return;
    }
    
    // Check if we have results - try different possible structures
    let individualResults = null;
    
    if (result.data && result.data.results) {
      // Standard structure: result.data.results
      individualResults = result.data.results;
    } else if (result.data && Array.isArray(result.data)) {
      // Direct array structure
      individualResults = result.data;
    } else if (result.results) {
      // Results at top level
      individualResults = result.results;
    } else {
      console.log('Invalid response structure:', result);
      this.showToast("Invalid response from server. Please try again.", "red");
      return;
    }
    
    console.log('Using individual results:', individualResults);
    const emailResult = individualResults.find(r => r.email === email);
    
    console.log('Individual results:', individualResults);
    console.log('Email result for', email, ':', emailResult);
    
    if (!emailResult) {
      console.log('No specific result found for email:', email);
      this.showToast("No response received for this email. Please try again.", "red");
      return;
    }
    
    // Handle the specific result
    if (emailResult.success) {
      // Success case
      this.invitations.push({ email, status: "pending" });
      this.renderInvitations();
      this.renderInvitationsList();
      
      // Clear input field
      const input = document.getElementById("emailInput");
      if (input) input.value = "";
      
      // Show success message
      this.showToast("Invitation sent successfully!", "green");
    } else {
      // Error case - show specific error message
      console.log('Email invitation failed:', emailResult.error);
      this.showToast(emailResult.error || "Failed to send invitation. Please try again.", "red");
    }
  }

  renderInvitations() {
    const listDiv = document.getElementById("invitationList");
    if (!listDiv) return;

    listDiv.innerHTML = "";
    if (!this.invitations.length) {
      listDiv.innerHTML = '<p style="color:#888;">No invitations yet.</p>';
      return;
    }

    this.invitations.forEach((inv, idx) => {
      const statusIcon = inv.status === "approved" ? "fa-check" : "fa-clock";
      const statusClass = inv.status === "approved" ? "approved" : "pending";
      const statusText = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);

      const actionBtns = inv.status === "pending" ? `
        <div class="action-buttons">
          <button class="btn action-btn resend-btn" data-idx="${idx}">Resend</button>
          <button class="btn action-btn revoke-btn" data-idx="${idx}">Revoke</button> 
        </div>
      ` : "";

      listDiv.innerHTML += `
        <div class="invitation-item ${statusClass}">
          <div class="invitation-email">${inv.email}</div>
          <div class="invitation-status">
            <div class="status-badge ${statusClass}">
              <i class="fas ${statusIcon}" style="font-size: 16px;"></i>
              ${statusText}
            </div>
            ${actionBtns}
          </div>
        </div>
      `;
    });

    listDiv.querySelectorAll(".resend-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.showToast("Invitation resent successfully!", "blue"));
    });

    listDiv.querySelectorAll(".revoke-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        this.invitations.splice(idx, 1);
        this.renderInvitations();
        this.renderInvitationsList();
        this.showToast("Invitation revoked!", "red");
      });
    });
  }

  async renderInvitationsList() {
    const list = document.getElementById('invitations-list');
    if (!list) return;

    // Show loading state
    list.innerHTML = '<div style="text-align:center; color:#888; padding:32px 0;">Loading invitations...</div>';

    try {
      // Fetch invitations from API
      const result = await getReceivedInvitations();
      console.log('API result:', result); // Debug log

      if (!result.success) {
        list.innerHTML = '<div style="text-align:center; color:#ff4444; padding:32px 0;">Failed to load invitations.</div>';
        return;
      }

      // Store invitations - result.data now contains the invitations array
      this.invitations = result.data || [];
      console.log('Invitations:', this.invitations); // Debug log

      const searchVal = (document.getElementById('invitation-search')?.value || '').toLowerCase();

      let filtered = this.invitations;
      if (searchVal) {
        filtered = this.invitations.filter(inv =>
            (inv.surveyTitle && inv.surveyTitle.toLowerCase().includes(searchVal)) ||
            (inv.creatorName && inv.creatorName.toLowerCase().includes(searchVal))
        );
      }

      list.innerHTML = '';
      if (!filtered.length) {
        list.innerHTML = '<div style="text-align:center; color:#888; padding:32px 0;">No invitations found.</div>';
        return;
      }

      filtered.forEach(inv => {
        // Calculate expiry based on createdAt (e.g., 30 days from creation)
        let expiryText = 'No expiry date';
        if (inv.createdAt) {
          const createdDate = new Date(inv.createdAt);
          const expiryDate = new Date(createdDate);
          expiryDate.setDate(expiryDate.getDate() + 30);

          const today = new Date();
          const diffTime = expiryDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0) {
            expiryText = `Expires in ${diffDays} days`;
          } else if (diffDays === 0) {
            expiryText = 'Expires today';
          } else {
            expiryText = 'Expired';
          }
        }

        const sender = inv.creatorName ? `From: ${inv.creatorName}` : 'Unknown sender';

        const item = document.createElement('div');
        item.className = 'invitation-item';
        item.innerHTML = `
        <div class="avatar">
          <img src="/public/images/profile.png" alt="User Avatar" class="avatar-image">
        </div>
        <div class="invitation-content">
          <h3 class="invitation-title">${inv.surveyTitle || 'Untitled Survey'}</h3>
          <p class="invitation-sender">${sender}</p>
          <p class="invitation-status">Status: ${inv.status}</p>
          <p class="invitation-date">Received: ${new Date(inv.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="invitation-meta">
          <div class="expiry-info">${expiryText}</div>
          <div class="survey-status">Survey: ${inv.surveyStatus}</div>
          <button class="take-survey-btn" data-surveylink="${inv.surveyLink}" data-invitationid="${inv.id}">
            ${inv.status === 'completed' ? 'View Results' : 'Take Survey'}
          </button>
        </div>
      `;
        list.appendChild(item);
      });

      document.querySelectorAll('.take-survey-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const surveyLink = e.target.getAttribute('data-surveylink');
          const invitationId = e.target.getAttribute('data-invitationid');
          this.navigateToTakeSurvey(surveyLink, invitationId);
        });
      });

    } catch (error) {
      console.error('Error rendering invitations:', error);
      list.innerHTML = '<div style="text-align:center; color:#ff4444; padding:32px 0;">Error loading invitations.</div>';
    }
  }

  navigateToTakeSurvey(surveyId, invitationId) {
    console.log('Navigate to survey:', surveyId, 'invitation:', invitationId);
    // implement actual navigation logic here
  }
  
  // User profile handling
  async loadUserProfile() {
    try {
      const { getUserProfile } = await import('../api/api.js');
      const result = await getUserProfile();
      
      if (result.success && result.data) {
        // Update user display with profile data
        this.updateUserDisplay(result.data);
        
        // Initialize dropdown after profile is loaded
        this.initializeUserDropdown();
      } else {
        console.warn('Failed to load user profile:', result);
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
    
    // Store user data globally for dropdown
    window.currentUser = user;
  }
  
  initializeUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
      userProfile.style.cursor = 'pointer';
      userProfile.addEventListener('click', () => this.toggleUserDropdown());
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userProfile.contains(e.target)) {
          this.closeUserDropdown();
        }
      });
    }
  }
  
  toggleUserDropdown() {
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
      this.closeUserDropdown();
    } else {
      this.showUserDropdown();
    }
  }
  
  showUserDropdown() {
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
        <a href="#" class="dropdown-item" onclick="window.invitationApp.handleLogout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </a>
      </div>
    `;
    
    userProfile.appendChild(dropdown);
    
    // Add show class for animation
    setTimeout(() => dropdown.classList.add('show'), 10);
  }
  
  closeUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      setTimeout(() => dropdown.remove(), 200);
    }
  }
  
  async handleLogout() {
    try {
      const { clearToken } = await import('../lib/lib.js');
      
      // Clear authentication tokens
      clearToken();
      sessionStorage.clear();
      
      // Show logout message
      if (window.M && window.M.toast) {
        M.toast({
          html: '<i class="fas fa-sign-out-alt"></i> Logged out successfully',
          classes: 'success-toast',
          displayLength: 2000
        });
      } else {
        this.showToast('Logged out successfully', 'green');
      }
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        window.location.href = '../auth/signin.html';
      }, 500);
    } catch (error) {
      console.error('Error during logout:', error);
      this.showToast('Error during logout', 'red');
    }
  }

  autoApproveDemo() {
    setTimeout(() => {
      const pendingIdx = this.invitations.findIndex((inv) => inv.status === "pending");
      if (pendingIdx !== -1) {
        this.invitations[pendingIdx].status = "approved";
        this.renderInvitations();
        this.renderInvitationsList();
      }
    }, 5000);
  }

  showToast(message, type = "info") {
    // Prevent rapid toast messages (debounce)
    const now = Date.now();
    if (now - this.lastToastTime < 1000) {
      console.log('Toast debounced - too soon after last toast');
      return;
    }
    this.lastToastTime = now;
    
    // Remove any existing toasts to prevent overlap
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    const colors = {
      blue: "#4285f4",
      green: "#4caf50",
      orange: "#ff9800",
      red: "#f44336",
      info: "#2196f3",
    };
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      max-width: 300px;
      word-wrap: break-word;
      background-color: ${colors[type] || colors.info};
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add("slide-out");
        setTimeout(() => toast.parentNode?.removeChild(toast), 300);
      }
    }, 3000);
  }
}

// Export globally
window.InvitationApp = InvitationApp;

// Auto-init
document.addEventListener("DOMContentLoaded", () => {
  if (!window.invitationApp) window.invitationApp = new InvitationApp();
});
