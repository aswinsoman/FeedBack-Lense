// Survey Creation Module - Phase 5: API Integration & Survey Creation
// Handles drag-and-drop file upload, CSV validation, UI transitions, and survey creation via API

import { getAuthToken, createSurvey, requireAuth, getUserProfile } from '../api/api.js';
import { csvValidator } from './csvValidator.js';
import { clearToken } from '../lib/lib.js';

// Global state to store parsed questions
let currentSurveyData = {
    questions: [],
    title: '',
    fileName: ''
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Survey creation page loaded - Phase 5: API Integration');
    
    // Check authentication using enhanced method
    if (!checkAuthentication()) {
        return;
    }
    
    // Initialize survey creation
    initializeSurveyCreation();
});

// Phase 5: Enhanced authentication check with proper token validation
function checkAuthentication() {
    return requireAuth();
}

/**
 * Phase 5: Setup periodic authentication checks to ensure session validity
 */
function setupPeriodicAuthCheck() {
    // Check authentication every 5 minutes
    setInterval(() => {
        if (!requireAuth()) {
            console.log('Session expired during periodic check');
            // Don't redirect here as requireAuth() already handles it
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Also check on window focus (user returns to tab)
    window.addEventListener('focus', () => {
        if (!requireAuth()) {
            console.log('Session expired when user returned to tab');
        }
    });
}

function initializeSurveyCreation() {
    // Initialize survey creation components
    setupFileUpload();
    setupEventListeners();
    showStep(1);
    
    // Load user profile for header display
    loadUserProfile();
    
    // Phase 5: Setup periodic authentication check (every 5 minutes)
    setupPeriodicAuthCheck();
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
 * Phase 2: Setup file upload functionality
 */
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('csvFileInput');
    const uploadLink = document.getElementById('uploadLink');

    if (!uploadArea || !fileInput || !uploadLink) {
        console.error('Upload elements not found');
        return;
    }

    // Click to upload
    uploadLink.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });

    uploadArea.addEventListener('click', function(e) {
        if (e.target === uploadArea || e.target.closest('.upload-content')) {
            fileInput.click();
        }
    });

    // File input change event
    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
}

/**
 * Phase 2: Handle file selection and validation
 */
async function handleFileSelect(file) {
    console.log('File selected:', file.name);
    
    // Show loading state
    showUploadLoading(true);
    
    try {
        // Validate file
        const validation = await validateFile(file);
        
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }

        // Parse CSV
        const csvResult = await parseCSV(file);
        
        if (!csvResult.isValid) {
            showValidationErrors(csvResult.errors);
            return;
        }

        // Store data and show success
        currentSurveyData.questions = csvResult.data;
        currentSurveyData.fileName = file.name;
        
        console.log('Parsed CSV data:', csvResult.data);
        
        // Show success and transition to step 2
        showUploadSuccess(file.name);
        
        // Enable next button
        const nextButton = document.getElementById('nextStep1');
        if (nextButton) {
            nextButton.disabled = false;
        }

    } catch (error) {
        console.error('Error processing file:', error);
        showValidationErrors(['An unexpected error occurred while processing the file']);
    } finally {
        showUploadLoading(false);
    }
}

/**
 * Phase 2: Validate uploaded file
 */
async function validateFile(file) {
    return await csvValidator.validateCSV(file);
}

/**
 * Phase 2: Parse CSV file
 */
async function parseCSV(file) {
    return await csvValidator.validateCSV(file);
}

/**
 * Phase 2: Show upload loading state
 */
function showUploadLoading(show) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = uploadArea?.querySelector('.upload-content');
    
    if (!uploadArea || !uploadContent) return;

    if (show) {
        uploadContent.innerHTML = `
            <div class="upload-loading">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="upload-text">Processing file...</p>
            </div>
        `;
        uploadArea.style.pointerEvents = 'none';
    } else {
        // Reset to original content
        uploadContent.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <p class="upload-text">
                <span class="upload-link" id="uploadLink">Click to upload</span> 
                or drag and drop
            </p>
            <p class="upload-format">CSV format only</p>
        `;
        uploadArea.style.pointerEvents = 'auto';
        
        // Re-attach click event to upload link
        const uploadLink = document.getElementById('uploadLink');
        if (uploadLink) {
            uploadLink.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('csvFileInput').click();
            });
        }
    }
}

/**
 * Phase 2: Show upload success state
 */
function showUploadSuccess(fileName) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = uploadArea?.querySelector('.upload-content');
    
    if (!uploadArea || !uploadContent) return;

    uploadContent.innerHTML = `
        <div class="upload-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <p class="upload-text success">File uploaded successfully!</p>
            <p class="upload-format">${fileName}</p>
        </div>
    `;
    uploadArea.classList.add('upload-success');
}

/**
 * Phase 3: Enhanced validation error display
 */
function showValidationErrors(errors) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadContent = uploadArea?.querySelector('.upload-content');
    
    if (!uploadArea || !uploadContent) return;

    // Categorize errors for better display
    const categorizedErrors = categorizeErrors(errors);
    
    // Generate error sections
    const errorSections = generateErrorSections(categorizedErrors);
    
    uploadContent.innerHTML = `
        <div class="upload-error">
            <div class="error-header">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4 class="error-title">CSV Validation Failed</h4>
                <p class="error-subtitle">Please fix the following issues and try again:</p>
            </div>
            
            <div class="error-details-enhanced">
                ${errorSections}
            </div>
            
            <div class="error-actions">
                <button class="btn btn-secondary btn-small" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
                <button class="btn btn-info btn-small" onclick="downloadSampleCSV()">
                    <i class="fas fa-download"></i> Download Sample
                </button>
            </div>
            
            <div class="error-help">
                <details class="help-accordion">
                    <summary><i class="fas fa-question-circle"></i> Need Help?</summary>
                    <div class="help-content">
                        <h5>Required CSV Format:</h5>
                        <ul>
                            <li><strong>Headers:</strong> questionId, questionText, type, options (optional)</li>
                            <li><strong>Question Types:</strong> text, likert, multiple-choice</li>
                            <li><strong>File Size:</strong> Maximum 1MB</li>
                            <li><strong>Question Limit:</strong> Maximum 20 questions</li>
                        </ul>
                        <h5>Example Row:</h5>
                        <code>Q1,How would you rate this course?,likert,</code>
                    </div>
                </details>
            </div>
        </div>
    `;
    
    uploadArea.classList.add('upload-error');
    
    // Reset file input
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Add download sample CSV functionality
    window.downloadSampleCSV = function() {
        const sampleCSV = csvValidator.getSampleCSV();
        const blob = new Blob([sampleCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-survey.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };
}

/**
 * Phase 3: Categorize errors by type for better display
 */
function categorizeErrors(errors) {
    const categories = {
        file: [],
        structure: [],
        content: [],
        validation: []
    };
    
    errors.forEach(error => {
        const errorLower = error.toLowerCase();
        
        if (errorLower.includes('file') || errorLower.includes('size') || errorLower.includes('csv')) {
            categories.file.push(error);
        } else if (errorLower.includes('header') || errorLower.includes('empty') || errorLower.includes('parsing')) {
            categories.structure.push(error);
        } else if (errorLower.includes('row') || errorLower.includes('question')) {
            categories.content.push(error);
        } else {
            categories.validation.push(error);
        }
    });
    
    return categories;
}

/**
 * Phase 3: Generate organized error sections
 */
function generateErrorSections(categorizedErrors) {
    let sections = '';
    
    const sectionConfig = {
        file: {
            title: 'File Issues',
            icon: 'fas fa-file-exclamation',
            color: 'error-file'
        },
        structure: {
            title: 'Structure Issues', 
            icon: 'fas fa-table',
            color: 'error-structure'
        },
        content: {
            title: 'Content Issues',
            icon: 'fas fa-edit',
            color: 'error-content'
        },
        validation: {
            title: 'Validation Issues',
            icon: 'fas fa-shield-alt',
            color: 'error-validation'
        }
    };
    
    Object.keys(categorizedErrors).forEach(category => {
        const errors = categorizedErrors[category];
        if (errors.length > 0) {
            const config = sectionConfig[category];
            sections += `
                <div class="error-section ${config.color}">
                    <div class="error-section-header">
                        <i class="${config.icon}"></i>
                        <span class="error-section-title">${config.title}</span>
                        <span class="error-count">${errors.length}</span>
                    </div>
                    <ul class="error-list-enhanced">
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    });
    
    return sections || '<div class="error-section"><p>Unknown validation errors occurred.</p></div>';
}

/**
 * Phase 2: Setup event listeners
 */
function setupEventListeners() {
    // Initialize user dropdown functionality
    initializeUserDropdown();
    
    // Back button functionality
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Back to success page from invitation section
    const backToSuccess = document.getElementById('backToSuccess');
    if (backToSuccess) {
        backToSuccess.addEventListener('click', function() {
            showStep(4); // Go back to success page (step 4)
        });
    }
    
    // Step navigation
    setupStepNavigation();
}

function setupStepNavigation() {
    // Step 1 navigation
    const nextStep1 = document.getElementById('nextStep1');
    if (nextStep1) {
        nextStep1.addEventListener('click', function() {
            if (!nextStep1.disabled) {
                showStep(2);
                generatePreviewTable();
            }
        });
    }
    
    // Phase 3: Step 2 navigation - CSV Preview buttons
    const replaceFile = document.getElementById('replaceFile');
    const backStep2 = document.getElementById('backStep2');
    const nextStep2 = document.getElementById('nextStep2');
    
    // Replace file button - goes back to Step 1 and resets upload
    if (replaceFile) {
        replaceFile.addEventListener('click', function() {
            console.log('Replace file clicked - returning to upload step');
            
            // Reset current survey data
            currentSurveyData = {
                questions: [],
                title: '',
                fileName: ''
            };
            
            // Reset upload area to initial state
            resetUploadArea();
            
            // Hide success message
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.style.display = 'none';
                successMessage.classList.remove('success-animate');
            }
            
            // Go back to step 1
            showStep(1);
            
            // Focus on upload area for better UX
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Back button for Step 2 - goes to Step 1
    if (backStep2) {
        backStep2.addEventListener('click', function() {
            console.log('Back from Step 2 to Step 1');
            showStep(1);
        });
    }
    
    // Next button for Step 2 - goes to Step 3 (Survey Setup)
    if (nextStep2) {
        nextStep2.addEventListener('click', function() {
            console.log('Proceeding to Step 3 - Survey Setup');
            
            // Validate that we have questions before proceeding
            if (!currentSurveyData.questions || currentSurveyData.questions.length === 0) {
                M.toast({
                    html: '<i class="fas fa-exclamation-triangle"></i> No questions found. Please upload a valid CSV file first.',
                    classes: 'error-toast',
                    displayLength: 4000
                });
                return;
            }
            
            // Show Step 3 and populate setup table
            showStep(3);
            populateSetupTable();
        });
    }
    
    // Step 3 navigation
    const backStep3 = document.getElementById('backStep3');
    const saveSurvey = document.getElementById('saveSurvey');
    const previewSurvey = document.getElementById('previewSurvey');
    
    if (backStep3) {
        backStep3.addEventListener('click', () => showStep(2));
    }
    
    if (saveSurvey) {
        saveSurvey.addEventListener('click', function() {
            console.log('Phase 4: Enhanced survey save functionality');
            enhancedSaveSurvey();
        });
    }
    
    if (previewSurvey) {
        previewSurvey.addEventListener('click', function() {
            console.log('Opening survey preview...');
            previewSurvey();
        });
    }
}

/**
 * Phase 3: Generate enhanced preview table with question types
 */
function generatePreviewTable() {
    const tableBody = document.getElementById('previewTableBody');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const previewTitle = document.querySelector('.preview-title');
    
    if (!tableBody) {
        console.error('Preview table body not found');
        return;
    }

    // Clear existing content
    tableBody.innerHTML = '';
    
    // Update preview title with question count
    if (previewTitle) {
        previewTitle.textContent = `Questions Preview (${currentSurveyData.questions.length} questions)`;
    }
    
    // Populate table with enhanced question data
    currentSurveyData.questions.forEach((question, index) => {
        const row = document.createElement('tr');
        row.className = 'preview-row';
        
        // Create type badge
        const typeBadge = getTypeBadge(question.type);
        
        // Create options display for multiple-choice
        const optionsDisplay = question.type === 'multiple-choice' && question.options 
            ? `<div class="question-options">Options: ${question.options.join(', ')}</div>`
            : '';
        
        row.innerHTML = `
            <td class="question-id-cell">
                <span class="question-number">#${index + 1}</span>
                <strong>${question.questionId}</strong>
            </td>
            <td class="question-content-cell">
                <div class="question-text">${question.questionText}</div>
                <div class="question-meta">
                    ${typeBadge}
                    ${optionsDisplay}
                </div>
            </td>
        `;
        
        // Add hover effect
        row.addEventListener('mouseenter', function() {
            this.classList.add('preview-row-hover');
        });
        
        row.addEventListener('mouseleave', function() {
            this.classList.remove('preview-row-hover');
        });
        
        tableBody.appendChild(row);
    });
    
    // Show success message with enhanced details
    if (successMessage && successText) {
        const fileName = currentSurveyData.fileName.replace('.csv', '');
        successText.innerHTML = `
            <i class="fas fa-check-circle success-icon"></i>
            Your Survey <strong>'${fileName}'</strong> uploaded successfully!
            <span class="success-details">${currentSurveyData.questions.length} questions processed</span>
        `;
        successMessage.style.display = 'flex';
        
        // Add animation
        setTimeout(() => {
            successMessage.classList.add('success-animate');
        }, 100);
    }
    
    // Add table statistics
    addTableStatistics();
    
    console.log('Enhanced preview table generated with', currentSurveyData.questions.length, 'questions');
}

/**
 * Phase 3: Create type badge for question types
 */
function getTypeBadge(type) {
    const badges = {
        'text': '<span class="type-badge type-text"><i class="fas fa-font"></i> Text</span>',
        'likert': '<span class="type-badge type-likert"><i class="fas fa-star"></i> Likert</span>',
        'multiple-choice': '<span class="type-badge type-multiple"><i class="fas fa-list"></i> Multiple Choice</span>'
    };
    
    return badges[type] || `<span class="type-badge type-unknown">${type}</span>`;
}

/**
 * Phase 3: Add table statistics below the preview
 */
function addTableStatistics() {
    const previewSection = document.querySelector('.preview-section');
    if (!previewSection) return;
    
    // Remove existing stats
    const existingStats = previewSection.querySelector('.table-statistics');
    if (existingStats) {
        existingStats.remove();
    }
    
    // Calculate statistics
    const questions = currentSurveyData.questions;
    const typeCount = {
        'text': questions.filter(q => q.type === 'text').length,
        'likert': questions.filter(q => q.type === 'likert').length,
        'multiple-choice': questions.filter(q => q.type === 'multiple-choice').length
    };
    
    // Create statistics element
    const statsElement = document.createElement('div');
    statsElement.className = 'table-statistics';
    statsElement.innerHTML = `
        <div class="stats-header">
            <h5><i class="fas fa-chart-pie"></i> Question Type Distribution</h5>
        </div>
        <div class="stats-content">
            <div class="stat-item">
                <span class="stat-label">Text Questions:</span>
                <span class="stat-value">${typeCount.text}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Likert Scale:</span>
                <span class="stat-value">${typeCount.likert}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Multiple Choice:</span>
                <span class="stat-value">${typeCount['multiple-choice']}</span>
            </div>
            <div class="stat-item stat-total">
                <span class="stat-label">Total Questions:</span>
                <span class="stat-value">${questions.length}</span>
            </div>
        </div>
    `;
    
    previewSection.appendChild(statsElement);
}

// Original Phase 3 populateSetupTable function is now enhanced in Phase 4 above

// Original Phase 3 setupQuestionActions function is now enhanced in Phase 4 above

/**
 * Phase 3: Enhanced reset upload area with memory of previous state
 */
function resetUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const nextButton = document.getElementById('nextStep1');
    
    if (uploadArea) {
        uploadArea.classList.remove('upload-success', 'upload-error');
    }
    
    if (nextButton) {
        // If we have questions, keep the button enabled (user going back from preview)
        nextButton.disabled = !(currentSurveyData.questions && currentSurveyData.questions.length > 0);
    }
    
    // Reset upload content but preserve file if we're just navigating back
    showUploadLoading(false);
    
    // If we have a file name, show it in the upload area
    if (currentSurveyData.fileName) {
        const uploadContent = uploadArea?.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.innerHTML = `
                <div class="upload-icon upload-success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <p class="upload-text upload-success-text">
                    File uploaded: <strong>${currentSurveyData.fileName}</strong>
                </p>
                <p class="upload-format">${currentSurveyData.questions.length} questions ready</p>
            `;
            uploadArea.classList.add('upload-success');
        }
    }
}

function showStep(stepNumber) {
    console.log(`Phase 5: Transitioning to step ${stepNumber} with authentication check`);
    
    // Phase 5: Authentication guard - check on every step transition
    if (!requireAuth()) {
        console.log('Authentication failed during step transition');
        return;
    }
    
    // Hide all steps
    const steps = document.querySelectorAll('.creation-step');
    steps.forEach(step => {
        step.style.display = 'none';
        step.classList.remove('active');
    });
    
    // Show selected step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block';
        targetStep.classList.add('active');
        console.log(`Successfully activated step ${stepNumber}`);
    } else {
        console.error(`Step ${stepNumber} element not found`);
    }
    
    // Update back button visibility
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.style.display = stepNumber > 1 ? 'block' : 'none';
    }
    
    // Update step indicator if it exists
    updateStepIndicator(stepNumber);
    
    console.log(`Phase 5: Successfully showing step ${stepNumber} with authentication verified`);
}

/**
 * Phase 3: Update step indicator (for better UX)
 */
function updateStepIndicator(currentStep) {
    // This could be enhanced in future phases to show progress
    const stepTitles = {
        1: 'Upload CSV',
        2: 'Preview Questions',
        3: 'Setup Survey',
        4: 'Complete',
        5: 'Invite Participants'
    };
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle && stepTitles[currentStep]) {
        pageTitle.textContent = `Create Survey - ${stepTitles[currentStep]}`;
    }
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Export functions for use in other modules
export { showStep, showLoading, currentSurveyData };

/**
 * PHASE 4: Survey Setup & Question Editing Implementation
 */

/**
 * Phase 4: Enhanced populate setup table with inline editing
 */
function populateSetupTable() {
    const setupTableBody = document.getElementById('setupTableBody');
    if (!setupTableBody) {
        console.error('Setup table body not found');
        return;
    }

    // Clear existing content
    setupTableBody.innerHTML = '';
    
    // Add survey title validation
    setupSurveyTitleValidation();
    
    // Populate table with questions for editing
    currentSurveyData.questions.forEach((question, index) => {
        const row = document.createElement('tr');
        row.className = 'setup-row';
        row.setAttribute('data-question-index', index);
        
        // Create enhanced type badge with editing capability
        const typeBadge = getEnhancedTypeBadge(question.type, index);
        
        // Create editable question text
        const questionTextHtml = createEditableQuestionText(question.questionText, index);
        
        // Create action buttons
        const actionButtons = createQuestionActionButtons(index);
        
        row.innerHTML = `
            <td class="setup-id-cell">
                <div class="question-identifier">
                    <span class="question-number">#${index + 1}</span>
                    <strong class="question-id">${question.questionId}</strong>
                </div>
            </td>
            <td class="setup-description-cell">
                <div class="question-content">
                    ${questionTextHtml}
                    <div class="question-meta">
                        ${typeBadge}
                        ${question.options ? `<div class="options-display" id="options-${index}">
                            <span class="options-label">Options:</span>
                            <div class="options-list">${createOptionsList(question.options, index)}</div>
                        </div>` : ''}
                    </div>
                </div>
            </td>
            <td class="setup-action-cell">
                ${actionButtons}
            </td>
        `;
        
        setupTableBody.appendChild(row);
    });
    
    // Setup question action handlers
    setupEnhancedQuestionActions();
    
    // Add question count display
    updateQuestionCount();
    
    console.log('Phase 4: Setup table populated with inline editing capabilities');
}

/**
 * Phase 4: Setup survey title validation
 */
function setupSurveyTitleValidation() {
    const titleInput = document.getElementById('surveyTitle');
    if (!titleInput) return;
    
    // Set default title based on filename
    if (!titleInput.value && currentSurveyData.fileName) {
        const defaultTitle = currentSurveyData.fileName.replace('.csv', '').replace(/[-_]/g, ' ');
        titleInput.value = defaultTitle.charAt(0).toUpperCase() + defaultTitle.slice(1);
        currentSurveyData.title = titleInput.value;
    }
    
    // Add real-time validation
    titleInput.addEventListener('input', function() {
        validateSurveyTitle(this.value);
        currentSurveyData.title = this.value;
    });
    
    titleInput.addEventListener('blur', function() {
        validateSurveyTitle(this.value);
    });
}

/**
 * Phase 4: Validate survey title
 */
function validateSurveyTitle(title) {
    const titleInput = document.getElementById('surveyTitle');
    const saveSurvey = document.getElementById('saveSurvey');
    
    // Remove existing validation classes
    titleInput.classList.remove('valid', 'invalid');
    
    // Remove existing helper text
    let existingHelper = titleInput.parentNode.querySelector('.helper-text');
    if (existingHelper) {
        existingHelper.remove();
    }
    
    if (!title || title.trim().length === 0) {
        titleInput.classList.add('invalid');
        addHelperText(titleInput, 'Survey title is required', 'error');
        if (saveSurvey) saveSurvey.disabled = true;
        return false;
    }
    
    if (title.trim().length < 3) {
        titleInput.classList.add('invalid');
        addHelperText(titleInput, 'Title must be at least 3 characters long', 'error');
        if (saveSurvey) saveSurvey.disabled = true;
        return false;
    }
    
    if (title.trim().length > 100) {
        titleInput.classList.add('invalid');
        addHelperText(titleInput, 'Title must be less than 100 characters', 'error');
        if (saveSurvey) saveSurvey.disabled = true;
        return false;
    }
    
    // Valid title
    titleInput.classList.add('valid');
    addHelperText(titleInput, 'Great title!', 'success');
    if (saveSurvey) saveSurvey.disabled = false;
    return true;
}

/**
 * Phase 4: Add helper text to input fields
 */
function addHelperText(input, text, type) {
    const helperText = document.createElement('span');
    helperText.className = `helper-text ${type}`;
    helperText.textContent = text;
    input.parentNode.appendChild(helperText);
}

/**
 * Phase 4: Create enhanced type badge with editing capability
 */
function getEnhancedTypeBadge(type, questionIndex) {
    const badgeConfig = {
        'text': {
            class: 'type-text',
            icon: 'fas fa-font',
            label: 'Text Response',
            color: '#10b981'
        },
        'likert': {
            class: 'type-likert', 
            icon: 'fas fa-star',
            label: 'Likert Scale',
            color: '#f59e0b'
        },
        'multiple-choice': {
            class: 'type-multiple',
            icon: 'fas fa-list-ul',
            label: 'Multiple Choice',
            color: '#3b82f6'
        }
    };
    
    const config = badgeConfig[type] || {
        class: 'type-unknown',
        icon: 'fas fa-question',
        label: type,
        color: '#6b7280'
    };
    
    return `
        <div class="type-badge-container">
            <span class="type-badge ${config.class}" style="background-color: ${config.color}">
                <i class="${config.icon}"></i>
                <span class="type-label">${config.label}</span>
            </span>
            <button class="type-edit-btn" data-index="${questionIndex}" title="Change question type">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
}

/**
 * Phase 4: Create editable question text
 */
function createEditableQuestionText(questionText, index) {
    return `
        <div class="editable-question" data-index="${index}">
            <div class="question-display" id="question-display-${index}">
                <span class="question-text">${questionText}</span>
                <button class="edit-trigger" onclick="enableQuestionEdit(${index})" title="Click to edit">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="question-edit" id="question-edit-${index}" style="display: none;">
                <textarea 
                    class="question-textarea" 
                    id="question-textarea-${index}"
                    rows="2"
                    maxlength="500"
                    placeholder="Enter question text..."
                >${questionText}</textarea>
                <div class="edit-actions">
                    <button class="btn-small btn-save" onclick="saveQuestionEdit(${index})">
                        <i class="fas fa-check"></i> Save
                    </button>
                    <button class="btn-small btn-cancel" onclick="cancelQuestionEdit(${index})">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
                <div class="character-count">
                    <span id="char-count-${index}">0</span>/500 characters
                </div>
            </div>
        </div>
    `;
}

/**
 * Phase 4: Create options list for multiple choice questions
 */
function createOptionsList(options, questionIndex) {
    return options.map((option, optionIndex) => `
        <div class="option-item" data-option-index="${optionIndex}">
            <span class="option-text">${option}</span>
            <button class="option-edit-btn" onclick="editOption(${questionIndex}, ${optionIndex})" title="Edit option">
                <i class="fas fa-edit"></i>
            </button>
            <button class="option-delete-btn" onclick="deleteOption(${questionIndex}, ${optionIndex})" title="Delete option">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('') + `
        <button class="add-option-btn" onclick="addNewOption(${questionIndex})" title="Add new option">
            <i class="fas fa-plus"></i> Add Option
        </button>
    `;
}

/**
 * Phase 4: Create action buttons for questions
 */
function createQuestionActionButtons(index) {
    return `
        <div class="action-buttons">
            <button class="btn-icon duplicate-question" data-index="${index}" title="Duplicate Question">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn-icon move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                <i class="fas fa-arrow-up"></i>
            </button>
            <button class="btn-icon move-down" data-index="${index}" title="Move Down" ${index === currentSurveyData.questions.length - 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-down"></i>
            </button>
            <button class="btn-icon delete-question" data-index="${index}" title="Delete Question">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

/**
 * Phase 4: Setup enhanced question actions
 */
function setupEnhancedQuestionActions() {
    // Duplicate question buttons
    document.querySelectorAll('.duplicate-question').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            duplicateQuestion(index);
        });
    });
    
    // Move up buttons
    document.querySelectorAll('.move-up').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            moveQuestion(index, 'up');
        });
    });
    
    // Move down buttons
    document.querySelectorAll('.move-down').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            moveQuestion(index, 'down');
        });
    });
    
    // Delete question buttons
    document.querySelectorAll('.delete-question').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            confirmDeleteQuestion(index);
        });
    });
    
    // Type edit buttons
    document.querySelectorAll('.type-edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showTypeEditor(index);
        });
    });
}

/**
 * Phase 4: Enable question text editing
 */
window.enableQuestionEdit = function(index) {
    const displayDiv = document.getElementById(`question-display-${index}`);
    const editDiv = document.getElementById(`question-edit-${index}`);
    const textarea = document.getElementById(`question-textarea-${index}`);
    const charCount = document.getElementById(`char-count-${index}`);
    
    if (displayDiv && editDiv && textarea) {
        displayDiv.style.display = 'none';
        editDiv.style.display = 'block';
        textarea.focus();
        
        // Update character count
        updateCharacterCount(index);
        
        // Add character count listener
        textarea.addEventListener('input', () => updateCharacterCount(index));
    }
};

/**
 * Phase 4: Save question edit
 */
window.saveQuestionEdit = function(index) {
    const textarea = document.getElementById(`question-textarea-${index}`);
    const displayDiv = document.getElementById(`question-display-${index}`);
    const editDiv = document.getElementById(`question-edit-${index}`);
    
    if (!textarea || !displayDiv || !editDiv) return;
    
    const newText = textarea.value.trim();
    
    if (!newText) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Question text cannot be empty',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    if (newText.length > 500) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Question text must be 500 characters or less',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    // Update the question in our data
    currentSurveyData.questions[index].questionText = newText;
    
    // Update the display
    const questionTextSpan = displayDiv.querySelector('.question-text');
    if (questionTextSpan) {
        questionTextSpan.textContent = newText;
    }
    
    // Switch back to display mode
    displayDiv.style.display = 'block';
    editDiv.style.display = 'none';
    
    // Show success message
    M.toast({
        html: '<i class="fas fa-check"></i> Question updated successfully',
        classes: 'success-toast',
        displayLength: 2000
    });
    
    console.log('Question updated:', index, newText);
};

/**
 * Phase 4: Cancel question edit
 */
window.cancelQuestionEdit = function(index) {
    const textarea = document.getElementById(`question-textarea-${index}`);
    const displayDiv = document.getElementById(`question-display-${index}`);
    const editDiv = document.getElementById(`question-edit-${index}`);
    
    if (textarea && displayDiv && editDiv) {
        // Reset textarea to original value
        textarea.value = currentSurveyData.questions[index].questionText;
        
        // Switch back to display mode
        displayDiv.style.display = 'block';
        editDiv.style.display = 'none';
    }
};

/**
 * Phase 4: Update character count
 */
function updateCharacterCount(index) {
    const textarea = document.getElementById(`question-textarea-${index}`);
    const charCount = document.getElementById(`char-count-${index}`);
    
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = count;
        charCount.className = count > 450 ? 'char-warning' : '';
    }
}

/**
 * Phase 4: Duplicate question
 */
function duplicateQuestion(index) {
    if (currentSurveyData.questions.length >= 20) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Maximum 20 questions allowed',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    const originalQuestion = currentSurveyData.questions[index];
    const newQuestion = {
        ...originalQuestion,
        questionId: generateUniqueQuestionId(),
        questionText: originalQuestion.questionText + ' (Copy)'
    };
    
    // Insert after the original question
    currentSurveyData.questions.splice(index + 1, 0, newQuestion);
    
    // Refresh the table
    populateSetupTable();
    
    M.toast({
        html: '<i class="fas fa-copy"></i> Question duplicated successfully',
        classes: 'success-toast',
        displayLength: 2000
    });
}

/**
 * Phase 4: Move question up or down
 */
function moveQuestion(index, direction) {
    const questions = currentSurveyData.questions;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    // Swap questions
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    
    // Refresh the table
    populateSetupTable();
    
    M.toast({
        html: `<i class="fas fa-arrow-${direction}"></i> Question moved ${direction}`,
        classes: 'success-toast',
        displayLength: 1500
    });
}

/**
 * Phase 4: Confirm delete question
 */
function confirmDeleteQuestion(index) {
    if (currentSurveyData.questions.length <= 1) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Cannot delete the last question',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    const question = currentSurveyData.questions[index];
    const confirmMessage = `Are you sure you want to delete this question?\n\n"${question.questionText}"`;
    
    if (confirm(confirmMessage)) {
        currentSurveyData.questions.splice(index, 1);
        populateSetupTable();
        
        M.toast({
            html: '<i class="fas fa-trash"></i> Question deleted successfully',
            classes: 'success-toast',
            displayLength: 2000
        });
    }
}

/**
 * Phase 4: Generate unique question ID
 */
function generateUniqueQuestionId() {
    const existingIds = currentSurveyData.questions.map(q => q.questionId);
    let counter = 1;
    let newId;
    
    do {
        newId = `Q${counter}`;
        counter++;
    } while (existingIds.includes(newId));
    
    return newId;
}

/**
 * Phase 4: Update question count display
 */
function updateQuestionCount() {
    const setupTitle = document.querySelector('.setup-title');
    if (setupTitle) {
        setupTitle.textContent = `Setup Survey (${currentSurveyData.questions.length} questions)`;
    }
}

/**
 * Phase 4: Show type editor modal
 */
function showTypeEditor(index) {
    const question = currentSurveyData.questions[index];
    const modalHtml = `
        <div class="type-editor-modal" id="typeEditorModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h4>Change Question Type</h4>
                    <button class="modal-close" onclick="closeTypeEditor()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="question-preview">"${question.questionText}"</p>
                    <div class="type-options">
                        <label class="type-option ${question.type === 'text' ? 'selected' : ''}">
                            <input type="radio" name="questionType" value="text" ${question.type === 'text' ? 'checked' : ''}>
                            <div class="type-card">
                                <i class="fas fa-font"></i>
                                <h5>Text Response</h5>
                                <p>Open-ended text input</p>
                            </div>
                        </label>
                        <label class="type-option ${question.type === 'likert' ? 'selected' : ''}">
                            <input type="radio" name="questionType" value="likert" ${question.type === 'likert' ? 'checked' : ''}>
                            <div class="type-card">
                                <i class="fas fa-star"></i>
                                <h5>Likert Scale</h5>
                                <p>1-5 rating scale</p>
                            </div>
                        </label>
                        <label class="type-option ${question.type === 'multiple-choice' ? 'selected' : ''}">
                            <input type="radio" name="questionType" value="multiple-choice" ${question.type === 'multiple-choice' ? 'checked' : ''}>
                            <div class="type-card">
                                <i class="fas fa-list-ul"></i>
                                <h5>Multiple Choice</h5>
                                <p>Select from predefined options</p>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeTypeEditor()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveQuestionType(${index})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('typeEditorModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Setup radio button change handlers
    const radioButtons = document.querySelectorAll('input[name="questionType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.type-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.type-option').classList.add('selected');
        });
    });
}

/**
 * Phase 4: Close type editor modal
 */
window.closeTypeEditor = function() {
    const modal = document.getElementById('typeEditorModal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Phase 4: Save question type change
 */
window.saveQuestionType = function(index) {
    const selectedType = document.querySelector('input[name="questionType"]:checked');
    if (!selectedType) return;
    
    const newType = selectedType.value;
    const oldType = currentSurveyData.questions[index].type;
    
    if (newType === oldType) {
        closeTypeEditor();
        return;
    }
    
    // Update question type
    currentSurveyData.questions[index].type = newType;
    
    // Handle options for multiple choice
    if (newType === 'multiple-choice' && !currentSurveyData.questions[index].options) {
        currentSurveyData.questions[index].options = ['Option 1', 'Option 2', 'Option 3'];
    } else if (newType !== 'multiple-choice') {
        delete currentSurveyData.questions[index].options;
    }
    
    // Refresh the table
    populateSetupTable();
    closeTypeEditor();
    
    M.toast({
        html: `<i class="fas fa-check"></i> Question type changed to ${newType}`,
        classes: 'success-toast',
        displayLength: 2000
    });
};

/**
 * Phase 4: Enhanced Survey Preview functionality
 */
window.previewSurvey = function() {
    if (!validateSurveyBeforePreview()) {
        return;
    }
    
    const surveyData = {
        title: currentSurveyData.title,
        questions: currentSurveyData.questions
    };
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    previewWindow.document.write(generateSurveyPreviewHTML(surveyData));
    previewWindow.document.close();
};

/**
 * Phase 4: Validate survey before preview/save
 */
function validateSurveyBeforePreview() {
    const titleInput = document.getElementById('surveyTitle');
    
    // Validate title
    if (!titleInput || !titleInput.value.trim()) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Please enter a survey title',
            classes: 'error-toast',
            displayLength: 3000
        });
        titleInput?.focus();
        return false;
    }
    
    if (titleInput.value.trim().length < 3) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Survey title must be at least 3 characters',
            classes: 'error-toast',
            displayLength: 3000
        });
        titleInput.focus();
        return false;
    }
    
    // Validate questions
    if (!currentSurveyData.questions || currentSurveyData.questions.length === 0) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Please add at least one question',
            classes: 'error-toast',
            displayLength: 3000
        });
        return false;
    }
    
    // Check for empty question texts
    const emptyQuestions = currentSurveyData.questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length > 0) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Please fill in all question texts',
            classes: 'error-toast',
            displayLength: 3000
        });
        return false;
    }
    
    // Update title in current data
    currentSurveyData.title = titleInput.value.trim();
    
    return true;
}

/**
 * Phase 4: Generate survey preview HTML
 */
function generateSurveyPreviewHTML(surveyData) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Survey Preview - ${surveyData.title}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
            <style>
                body {
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                .survey-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    padding: 32px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .survey-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 8px;
                }
                .survey-subtitle {
                    color: #64748b;
                    margin-bottom: 32px;
                }
                .question-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #4285f4;
                }
                .question-number {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                .question-text {
                    font-size: 16px;
                    font-weight: 500;
                    color: #1e293b;
                    margin-bottom: 16px;
                    line-height: 1.5;
                }
                .question-type {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    color: white;
                    margin-bottom: 16px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .type-text { background-color: #10b981; }
                .type-likert { background-color: #f59e0b; }
                .type-multiple-choice { background-color: #3b82f6; }
                .response-area {
                    margin-top: 12px;
                }
                .text-input {
                    width: 100%;
                    min-height: 100px;
                    padding: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    resize: vertical;
                }
                .likert-scale {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 16px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .likert-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }
                .likert-option input[type="radio"] {
                    margin: 0;
                }
                .likert-label {
                    font-size: 12px;
                    color: #64748b;
                    text-align: center;
                }
                .choice-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    background: white;
                    padding: 16px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .choice-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px;
                    border-radius: 4px;
                }
                .choice-option:hover {
                    background: #f8fafc;
                }
                .choice-option input[type="radio"] {
                    margin: 0;
                }
                .preview-header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                }
                .preview-badge {
                    background: #3b82f6;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                    display: inline-block;
                }
                .question-count {
                    color: #64748b;
                    font-size: 14px;
                    margin-top: 32px;
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="survey-container">
                <div class="preview-header">
                    <div class="preview-badge">Survey Preview</div>
                    <h1 class="survey-title">${surveyData.title}</h1>
                    <p class="survey-subtitle">This is how your survey will appear to participants</p>
                </div>
                
                ${surveyData.questions.map((question, index) => {
                    let responseHTML = '';
                    
                    switch(question.type) {
                        case 'text':
                            responseHTML = '<textarea class="text-input" placeholder="Type your response here..." disabled></textarea>';
                            break;
                        case 'likert':
                            responseHTML = `
                                <div class="likert-scale">
                                    <div class="likert-option">
                                        <input type="radio" name="q${index}" value="1" disabled>
                                        <span class="likert-label">Strongly Disagree</span>
                                    </div>
                                    <div class="likert-option">
                                        <input type="radio" name="q${index}" value="2" disabled>
                                        <span class="likert-label">Disagree</span>
                                    </div>
                                    <div class="likert-option">
                                        <input type="radio" name="q${index}" value="3" disabled>
                                        <span class="likert-label">Neutral</span>
                                    </div>
                                    <div class="likert-option">
                                        <input type="radio" name="q${index}" value="4" disabled>
                                        <span class="likert-label">Agree</span>
                                    </div>
                                    <div class="likert-option">
                                        <input type="radio" name="q${index}" value="5" disabled>
                                        <span class="likert-label">Strongly Agree</span>
                                    </div>
                                </div>
                            `;
                            break;
                        case 'multiple-choice':
                            const options = question.options || ['Option 1', 'Option 2', 'Option 3'];
                            responseHTML = `
                                <div class="choice-options">
                                    ${options.map((option, optIndex) => `
                                        <div class="choice-option">
                                            <input type="radio" name="q${index}" value="${optIndex}" disabled>
                                            <label>${option}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                            break;
                    }
                    
                    return `
                        <div class="question-card">
                            <div class="question-number">Question ${index + 1} of ${surveyData.questions.length}</div>
                            <div class="question-text">${question.questionText}</div>
                            <span class="question-type type-${question.type}">${question.type.replace('-', ' ')}</span>
                            <div class="response-area">
                                ${responseHTML}
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <div class="question-count">
                    Total Questions: ${surveyData.questions.length} | 
                    Estimated Time: ${Math.ceil(surveyData.questions.length * 0.5)} minutes
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Phase 4: Option Management Functions for Multiple Choice Questions
 */

/**
 * Edit an option for multiple choice questions
 */
window.editOption = function(questionIndex, optionIndex) {
    const question = currentSurveyData.questions[questionIndex];
    if (!question || !question.options) return;
    
    const currentOption = question.options[optionIndex];
    const newOption = prompt('Edit option:', currentOption);
    
    if (newOption !== null && newOption.trim() !== '') {
        if (newOption.trim() !== currentOption) {
            question.options[optionIndex] = newOption.trim();
            updateOptionsDisplay(questionIndex);
            
            M.toast({
                html: '<i class="fas fa-edit"></i> Option updated successfully',
                classes: 'success-toast',
                displayLength: 2000
            });
        }
    }
};

/**
 * Delete an option for multiple choice questions
 */
window.deleteOption = function(questionIndex, optionIndex) {
    const question = currentSurveyData.questions[questionIndex];
    if (!question || !question.options) return;
    
    if (question.options.length <= 2) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Multiple choice questions must have at least 2 options',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    const optionText = question.options[optionIndex];
    if (confirm(`Delete option: "${optionText}"?`)) {
        question.options.splice(optionIndex, 1);
        updateOptionsDisplay(questionIndex);
        
        M.toast({
            html: '<i class="fas fa-trash"></i> Option deleted successfully',
            classes: 'success-toast',
            displayLength: 2000
        });
    }
};

/**
 * Add a new option for multiple choice questions
 */
window.addNewOption = function(questionIndex) {
    const question = currentSurveyData.questions[questionIndex];
    if (!question || !question.options) return;
    
    if (question.options.length >= 10) {
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Maximum 10 options allowed per question',
            classes: 'error-toast',
            displayLength: 3000
        });
        return;
    }
    
    const newOption = prompt('Enter new option:');
    if (newOption !== null && newOption.trim() !== '') {
        question.options.push(newOption.trim());
        updateOptionsDisplay(questionIndex);
        
        M.toast({
            html: '<i class="fas fa-plus"></i> Option added successfully',
            classes: 'success-toast',
            displayLength: 2000
        });
    }
};

/**
 * Update the options display for a specific question
 */
function updateOptionsDisplay(questionIndex) {
    const optionsDisplay = document.getElementById(`options-${questionIndex}`);
    if (!optionsDisplay) return;
    
    const question = currentSurveyData.questions[questionIndex];
    if (!question || !question.options) return;
    
    const optionsList = optionsDisplay.querySelector('.options-list');
    if (optionsList) {
        optionsList.innerHTML = createOptionsList(question.options, questionIndex);
    }
}

/**
 * Phase 5: Enhanced save survey with API integration
 */
async function enhancedSaveSurvey() {
    console.log('Phase 5: Saving survey via API');
    
    // Comprehensive validation
    if (!validateSurveyBeforePreview()) {
        return;
    }
    
    // Additional validation for saving
    const titleInput = document.getElementById('surveyTitle');
    currentSurveyData.title = titleInput.value.trim();
    
    // Validate multiple choice questions have options
    const mcQuestions = currentSurveyData.questions.filter(q => q.type === 'multiple-choice');
    for (let question of mcQuestions) {
        if (!question.options || question.options.length < 2) {
            M.toast({
                html: `<i class="fas fa-exclamation-triangle"></i> Multiple choice question "${question.questionText}" needs at least 2 options`,
                classes: 'error-toast',
                displayLength: 4000
            });
            return;
        }
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        // Phase 5: Submit survey to backend API
        const result = await submitSurvey();
        
        if (result.success) {
            // Success - show step 4 and update with real survey data
            console.log('Survey creation successful:', result);
            console.log('Survey data:', result.data);
            showLoading(false);
            showStep(4);
            console.log('sgdhjasgdhjsagdjhasdg',result.data.survey)
            updateSuccessPage(result.data.survey);
            
            M.toast({
                html: '<i class="fas fa-check-circle"></i> Survey created successfully!',
                classes: 'success-toast',
                displayLength: 3000
            });
            
            console.log('Survey created successfully:', result.data.survey);
        } else {
            // Handle API errors
            console.log('Survey creation failed:', result);
            showLoading(false);
            handleSurveyCreationError(result);
        }
        
    } catch (error) {
        showLoading(false);
        console.error('Survey creation error:', error);
        
        M.toast({
            html: '<i class="fas fa-exclamation-triangle"></i> Failed to create survey. Please try again.',
            classes: 'error-toast',
            displayLength: 4000
        });
    }
}

/**
 * Phase 5: Submit survey data to backend API
 */
async function submitSurvey() {
    // Check authentication before submitting
    if (!requireAuth()) {
        return { success: false, error: 'Authentication required' };
    }
    
    // Prepare survey data for API
    const surveyData = {
        title: currentSurveyData.title,
        csvData: currentSurveyData.questions.map(question => ({
            questionId: question.questionId,
            questionText: question.questionText,
            type: question.type,
            options: question.options ? question.options.join(';') : ''
        }))
    };
    
    console.log('Submitting survey data:', surveyData);
    
    // Call API to create survey
    const result = await createSurvey(surveyData);


    console.log('Survey created successfully: ...................', result);
    return result;
}

/**
 * Phase 5: Handle survey creation errors with user-friendly messages
 */
function handleSurveyCreationError(result) {
    let errorMessage = 'Failed to create survey. Please try again.';
    
    // Handle specific error cases based on status code
    if (result.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        setTimeout(() => {
            window.location.href = '../auth/signin.html';
        }, 2000);
    } else if (result.status === 400 && result.data?.error) {
        errorMessage = result.data.error;
    } else if (result.status === 413) {
        errorMessage = 'Survey data is too large. Please reduce the number of questions.';
    } else if (result.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
    } else if (result.error) {
        errorMessage = result.error;
    }
    
    M.toast({
        html: `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`,
        classes: 'error-toast',
        displayLength: 4000
    });
    
    console.error('Survey creation failed:', result);
}

/**
 * Phase 5: Update success page with real survey details from API response
 */
function updateSuccessPage(surveyData = null) {
    const surveyId = document.getElementById('surveyId');
    const creationDate = document.getElementById('creationDate');

    if (surveyId) {
        if (surveyData && surveyData.id) {
            // Use real survey ID from API response
            console.log('Full survey ID from API:', surveyData.id);
            console.log('Survey ID length:', surveyData.id.length);
            surveyId.textContent = surveyData.id.substring(0, 8).toUpperCase();
            // Store full ID in data attribute for API calls
            surveyId.setAttribute('data-full-id', surveyData.id);
            console.log('Stored data-full-id:', surveyId.getAttribute('data-full-id'));
        } else {
            // Fallback to demo ID
            const demoId = Math.random().toString(36).substr(2, 9).toUpperCase();
            surveyId.textContent = demoId;
            // For demo, we can't make real API calls, so store the demo ID
            surveyId.setAttribute('data-full-id', demoId);
            console.log('Using demo ID:', demoId);
        }
    }
    
    if (creationDate) {
        if (surveyData && surveyData.createdAt) {
            // Use real creation date from API response
            const date = new Date(surveyData.createdAt);
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            };
            creationDate.textContent = date.toLocaleDateString('en-US', options);
        } else {
            // Fallback to current date
            const now = new Date();
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            };
            creationDate.textContent = now.toLocaleDateString('en-US', options);
        }
    }
    
    // Update success title to include survey name
    const successTitle = document.querySelector('.success-main-title');
    if (successTitle && currentSurveyData.title) {
        successTitle.textContent = `"${currentSurveyData.title}" Created Successfully!`;
    }
    
    // Store survey data for potential navigation
    if (surveyData) {
        currentSurveyData.savedSurvey = surveyData;
    }
    
    // Phase 6: Setup action buttons functionality
    setupSuccessPageActions(surveyData);
}

/**
 * Phase 6: Setup success page action buttons
 */
function setupSuccessPageActions(surveyData) {
    console.log('setupSuccessPageActions called with:', surveyData);
    
    // Invite Participants button
    const inviteBtn = document.getElementById('inviteParticipantsBtn');
    console.log('Found invite button:', inviteBtn);
    
    if (inviteBtn) {
        inviteBtn.onclick = function() {
            console.log('Invite button clicked!');
            handleInviteParticipants(surveyData);
        };
    } else {
        console.error('Invite button not found!');
    }
    
    // Return to Dashboard button
    const dashboardBtn = document.querySelector('.success-actions .btn:nth-child(2)');
    if (dashboardBtn) {
        dashboardBtn.onclick = function() {
            navigateToDashboard();
        };
    }
    
    // Create Another Survey button
    const createAnotherBtn = document.querySelector('.success-actions .btn:nth-child(3)');
    if (createAnotherBtn) {
        createAnotherBtn.onclick = function() {
            createAnotherSurvey();
        };
    }
}

/**
 * Phase 6: Handle invite participants action
 */
function handleInviteParticipants(surveyData) {
    console.log('handleInviteParticipants called with:', surveyData);
    console.log('currentSurveyData.savedSurvey:', currentSurveyData.savedSurvey);
    
    // Try to get survey data from parameter or fallback to saved survey data
    let surveyInfo = surveyData;
    if (!surveyInfo || !surveyInfo._id) {
        surveyInfo = currentSurveyData.savedSurvey;
    }
    
    // If still no survey data, try to get it from current survey data
    if (!surveyInfo || !surveyInfo._id) {
        // Create a mock survey ID from current survey data for demo purposes
        if (currentSurveyData.title) {
            surveyInfo = {
                _id: 'demo-survey-' + Date.now(),
                title: currentSurveyData.title
            };
            console.log('Using demo survey data:', surveyInfo);
        } else {
            // Last resort - create a generic survey for demo
            surveyInfo = {
                _id: 'demo-survey-' + Date.now(),
                title: 'Survey'
            };
            console.log('Using generic demo survey data:', surveyInfo);
        }
    }
    
    // Store survey ID for invitation process
    sessionStorage.setItem('surveyForInvitation', surveyInfo._id);
    
    // Show the invitation section (step5)
    showStep(5);
    
    // Initialize invitation functionality after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (typeof InvitationApp !== 'undefined') {
            window.invitationApp = new InvitationApp();
        }
    }, 100);
    
    // Show success message
    M.toast({
        html: '<i class="fas fa-envelope"></i> Ready to send invitations!',
        classes: 'success-toast',
        displayLength: 3000
    });
    
    console.log('Showing invitation section for survey:', surveyInfo._id);
}

/**
 * Phase 6: Navigate to dashboard with success message
 */
function navigateToDashboard() {
    // Store success message for dashboard
    sessionStorage.setItem('dashboardMessage', JSON.stringify({
        type: 'success',
        message: `Survey "${currentSurveyData.title}" was created successfully!`,
        timestamp: Date.now()
    }));
    
    // Navigate to dashboard
    window.location.href = 'index.html';
}

/**
 * Phase 6: Reset form and create another survey
 */
function createAnotherSurvey() {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to create another survey? This will reset the current form.')) {
        return;
    }
    
    // Reset global state
    currentSurveyData = {
        questions: [],
        title: '',
        fileName: ''
    };
    
    // Reset all form steps
    resetSurveyCreationFlow();
    
    // Show success message
    M.toast({
        html: '<i class="fas fa-refresh"></i> Ready to create a new survey!',
        classes: 'success-toast',
        displayLength: 2000
    });
}

/**
 * Phase 6: Reset the entire survey creation flow
 */
function resetSurveyCreationFlow() {
    // Hide all steps
    document.querySelectorAll('.creation-step').forEach(step => {
        step.style.display = 'none';
        step.classList.remove('active');
    });
    
    // Show step 1
    const step1 = document.getElementById('step1');
    if (step1) {
        step1.style.display = 'block';
        step1.classList.add('active');
    }
    
    // Reset upload area
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.remove('uploaded');
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h4>Drag and drop your CSV file here</h4>
                <p>or <span class="upload-link">click to browse</span></p>
                <small>Supported format: CSV (up to 1MB)</small>
            </div>
            <input type="file" id="fileInput" accept=".csv" style="display: none;">
        `;
    }
    
    // Clear all other form data
    const surveyTitleInput = document.getElementById('surveyTitle');
    if (surveyTitleInput) {
        surveyTitleInput.value = '';
    }
    
    // Clear preview tables
    const previewContainer = document.getElementById('csvPreview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    const questionsContainer = document.getElementById('questionsTableContainer');
    if (questionsContainer) {
        questionsContainer.innerHTML = '';
    }
    
    // Re-initialize the upload functionality
    setupFileUpload();
    
    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = 'Create Surveys';
    }
    
    // Hide back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.style.display = 'none';
    }
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

/**
 * Handle logout functionality
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

// Make handleLogout globally available
window.handleLogout = handleLogout;

// ...existing code...
