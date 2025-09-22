const API_BASE = 'http://localhost:4000/api/v1';

// Import token helpers from lib
import { getToken } from '../lib/lib.js';

// Get authentication token
export function getAuthToken() {
  return getToken();
}

// Get authentication headers
export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// POST JSON helper
export async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  return { res, data };
}

// POST JSON with authentication
export async function postJSONAuth(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(body)
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  return { res, data };
}

// GET JSON helper
export async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  let data = null;
  try { data = await res.json(); } catch (_) {}

  return { res, data };
}

// GET JSON with authentication
export async function getJSONAuth(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  return { res, data };
}

// Authentication validation helper
export function validateToken() {
  const token = getAuthToken();
  if (!token) {
    return false;
  }
  
  try {
    // Check if token is expired (basic check)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    return payload.exp > now;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

// Get user profile
export async function getUserProfile() {
  try {
    const { res, data } = await getJSONAuth('/auth/me');
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in getUserProfile:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

// Redirect to login if not authenticated
export function requireAuth() {
  if (!validateToken()) {
    console.log('Authentication required - redirecting to login');
    window.location.href = '../auth/signin.html';
    return false;
  }
  return true;
}

// Survey API functions
export async function createSurvey(surveyData) {
  try {
    const { res, data } = await postJSONAuth('/surveys/create', surveyData);
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in createSurvey:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

export async function getUserSurveys() {
  try {
    const { res, data } = await getJSONAuth('/surveys/created');
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in getUserSurveys:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

// Dashboard API functions
export async function getDashboardStats() {
  try {
    const { res, data } = await getJSONAuth('/dashboard/user/stats');
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in getDashboardStats:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

export async function getQuickSummary() {
  try {
    const { res, data } = await getJSONAuth('/dashboard/user/summary');
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in getQuickSummary:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

// Invitation API functions
export async function sendInvitations(surveyId, userEmails) {
  console.log('Sending invitations for survey:', surveyId);
  console.log('Survey ID length:', surveyId ? surveyId.length : 'undefined');
  console.log('User emails:', userEmails);

  // Parse email string into array if it's a string
  let emailArray = userEmails;
  if (typeof userEmails === 'string') {
    emailArray = userEmails
      .split(/[\s,;]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  // Validate that we have at least one valid email
  if (!emailArray || emailArray.length === 0) {
    return { success: false, error: 'Please enter at least one valid email address' };
  }

  try {
    const { res, data } = await postJSONAuth(`/invitations/send/${surveyId}`, { userEmails: emailArray });
    console.log('Invitations sent successfully:', data);
    console.log('Res:', res);
    if (res.ok) {
      console.log('Invitations sent successfully:', data);
    } else {
      console.error('Failed to send invitations:', data);
    }
    
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in sendInvitations:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

// Add this to your API functions section
export async function getReceivedInvitations() {
  try {
    // If your backend needs userID in the request body for POST
    const { res, data } = await postJSONAuth('/invitations/received', {
      userId: '68c4139997873e21c3a7f968'
    });

    // The API returns {invitations: [], count: number}
    // but we need to extract the invitations array
    return {
      success: res.ok,
      data: data.invitations, // Extract the invitations array from response
      count: data.count,
      status: res.status
    };

  } catch (error) {
    console.error('API Error in getReceivedInvitations:', error);
    return {
      success: false,
      error: 'Network error occurred',
      data: [] // Ensure data is always an array
    };
  }
}


export async function getReceivedInvitationsFromUser() {
  try {
    // If your backend needs userID in the request body for POST
    const { res, data } = await postJSONAuth('/invitations/receivedInvitation', {
      userId: '68c4139997873e21c3a7f968'
    });

    // The API returns {invitations: [], count: number}
    // but we need to extract the invitations array
    return {
      success: res.ok,
      data: data.invitations, // Extract the invitations array from response
      count: data.count,
      status: res.status
    };

  } catch (error) {
    console.error('API Error in getReceivedInvitations:', error);
    return {
      success: false,
      error: 'Network error occurred',
      data: [] // Ensure data is always an array
    };
  }
}


export async function getUserSurveysData(surveyId = null) {
  try {
    const endpoint = surveyId ? `/surveys/${surveyId}` : '/surveys';
    const { res, data } = await getJSONAuth(endpoint);
    return { success: res.ok, data, status: res.status };
  } catch (error) {
    console.error('API Error in getUserSurveys:', error);
    return { success: false, error: 'Network error occurred' };
  }
}

// Add new function to submit survey responses
export async function submitSurveyResponse(responseData) {
  try {
    console.log('Submitting survey response with data:', responseData);
    const { res, data } = await postJSONAuth('/surveys/respond', responseData);
    console.log('Survey response API result:', { 
      status: res.status, 
      ok: res.ok, 
      data 
    });
    
    // Return detailed information for debugging
    return { 
      success: res.ok, 
      data, 
      status: res.status,
      statusText: res.statusText,
      error: !res.ok ? (data?.error || 'Unknown error') : null
    };
  } catch (error) {
    console.error('API Error in submitSurveyResponse:', error);
    return { 
      success: false, 
      error: error.message || 'Network error occurred',
      networkError: true
    };
  }
}

// 👇 expose to global scope
window.sendInvitations = sendInvitations;
