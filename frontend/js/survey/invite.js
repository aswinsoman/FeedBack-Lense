// invitation.js
import {getReceivedInvitations} from '../api/api.js';

class InvitationApp {
  constructor() {
    this.invitations = [
     
    ];
    this.chipEmails = [];
    this.surveys = {}; // add this to prevent undefined errors
    this.init();
  }

  init() {
    console.log("Initializing Invitations UI...");
    this.renderInvitations();
    this.renderChips();
    this.setupEventListeners();
    this.autoApproveDemo();
    this.renderInvitationsList(); // initial render
    this.loadUserProfile(); // Initialize user profile
  }

  setupEventListeners() {
    const emailInput = document.getElementById("emailInput");
    const sendBtn = document.getElementById("sendBtn");

    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (["Enter", ",", ";", " "].includes(e.key)) {
          e.preventDefault();
          this.addEmailsToChipsFromInput();
        }
      });

      emailInput.addEventListener("blur", () => {
        if (emailInput.value.trim() !== "") {
          this.addEmailsToChipsFromInput();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.addInvitationsFromChips());
    }

    // Optional: search input listener
    const searchInput = document.getElementById('invitation-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderInvitationsList());
    }
  }

  // ======== Chips ======== //
  renderChips() {
    const chipsWrapper = document.getElementById("chipsWrapper");
    if (!chipsWrapper) return;

    chipsWrapper.innerHTML = "";
    this.chipEmails.forEach((email, idx) => {
      const chip = document.createElement("div");
      chip.className = "chip-email";
      chip.innerHTML = `
        ${email}
        <button class="remove-chip" data-idx="${idx}" title="Remove">
          <i class="fas fa-times" style="font-size:14px;"></i>
        </button>
      `;
      chipsWrapper.appendChild(chip);
    });

    chipsWrapper.querySelectorAll(".remove-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        this.chipEmails.splice(idx, 1);
        this.renderChips();
      });
    });
  }

  parseEmails(input) {
    return input
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && this.validateEmail(e));
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  addEmailsToChipsFromInput() {
    const input = document.getElementById("emailInput");
    if (!input) return;

    const emails = this.parseEmails(input.value);
    let added = 0,
        skipped = 0;

    emails.forEach((email) => {
      if (!this.chipEmails.some((e) => e.toLowerCase() === email.toLowerCase())) {
        this.chipEmails.push(email);
        added++;
      } else {
        skipped++;
      }
    });

    this.renderChips();
    input.value = "";

    if (added > 0) this.showToast(`${added} email${added > 1 ? "s" : ""} added.`, "blue");
    if (skipped > 0)
      this.showToast(`${skipped} duplicate email${skipped > 1 ? "s were" : " was"} skipped.`, "orange");
  }

  // ======== Invitations ======== //
  async addInvitationsFromChips() {
    // Only check for empty chipEmails before sending
    // Only show error if there are invalid emails, not just empty
    if (!this.chipEmails || this.chipEmails.length === 0) {
      const input = document.getElementById("emailInput");
      if (input && input.value.trim() !== "") {
        // Check for invalid email formats in the input
        const emails = input.value.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.length > 0);
        const invalids = emails.filter(e => !this.validateEmail(e));
        if (invalids.length > 0) {
          this.showToast(
            `Error: ${invalids.length > 1 ? "Some emails are" : "This email is"} in incorrect format.`,
            "red"
          );
        } else {
          this.showToast("Please enter at least one valid email address before sending invitations.", "red");
        }
      } else {
        this.showToast("Please enter at least one email address before sending invitations.", "red");
      }
      return;
    }

    // Show a loading/success mode UI when sending invitations
    const sendBtn = document.getElementById("sendInvitesBtn");
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add("loading");
      sendBtn.innerHTML = `<span class="spinner"></span> Sending...`;
    }

    const surveyIdElement = document.getElementById('surveyId');
    if (!surveyIdElement) {
      this.showToast("Survey ID not found. Please refresh the page.", "red");
      return;
    }

    const surveyId = surveyIdElement.getAttribute('data-full-id') || surveyIdElement.textContent;
    console.log('Survey ID:', surveyId);

    let added = 0, skipped = 0; // Move declaration here for scope

    try {
      const result = await window.sendInvitations(surveyId, this.chipEmails);

      if (result.success) {
        // Invitations delivered successfully
        this.chipEmails.forEach((email) => {
          if (!this.invitations.some((inv) => inv.email.toLowerCase() === email.toLowerCase())) {
            this.invitations.push({ email, status: "pending" });
            added++;
          } else {
            skipped++;
          }
        });

        this.renderInvitations();
        this.renderInvitationsList();
        this.chipEmails = [];
        this.renderChips();

        // Always show success message in green if delivered
        this.showToast(`Invitation${added !== 1 ? "s" : ""} sent successfully!`, "green");
        if (skipped > 0) {
          this.showToast(`${skipped} duplicate email${skipped > 1 ? "s were" : " was"} skipped.`, "orange");
        }
      } else {
        // If result.success is false, but no error, treat as partial success (e.g., all were duplicates)
        if (result.error) {
          this.showToast(result.error, "red");
        } else if (result.skipped && result.skipped > 0) {
          this.showToast(`${result.skipped} duplicate email${result.skipped > 1 ? "s were" : " was"} skipped.`, "orange");
        } else {
          this.showToast("No invitations were sent. Please check the emails and try again.", "red");
        }
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      // If some invitations were added before the error, show success for those
      if (added > 0) {
        this.showToast(`Invitation${added !== 1 ? "s" : ""} sent successfully!`, "green");
      } else {
        this.showToast("Failed to send invitations. Please try again.", "red");
      }
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
