// PDF Export Utility for Survey Analytics
// Author: F8 Implementation

import { downloadPDF, getPDFInfo, previewPDFData } from '../api/api.js';

class PDFExportManager {
    constructor() {
        this.isExporting = false;
        this.exportQueue = [];
    }

    /**
     * Export survey analytics as PDF
     * @param {string} surveyId - The survey ID
     * @param {string} format - Export format ('full' or 'quick')
     * @param {Object} options - Additional options
     */
    async exportSurveyPDF(surveyId, format = 'full', options = {}) {
        console.log('🔄 PDFExportManager: Starting export for survey:', surveyId, 'format:', format);
        
        if (this.isExporting) {
            console.warn('⚠️ PDF export already in progress');
            return { success: false, error: 'Export already in progress' };
        }

        if (!surveyId) {
            console.error('❌ No survey ID provided');
            return { success: false, error: 'Survey ID is required' };
        }

        this.isExporting = true;
        console.log('🔄 PDFExportManager: Export state set to true');
        
        try {
            // Show loading state
            this.showExportProgress('Preparing PDF export...');

            // Update progress
            this.updateExportProgress('Generating PDF report...');

            // Download the PDF directly
            console.log('📥 PDFExportManager: Starting PDF download...');
            const result = await downloadPDF(surveyId, format);
            console.log('📥 PDFExportManager: Download result:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to generate PDF');
            }

            // Update progress
            this.updateExportProgress('Downloading PDF...');

            // Trigger download
            this.downloadFile(result.blob, result.filename);

            // Show success message
            this.showExportSuccess(result.filename, result.size);

            return { 
                success: true, 
                filename: result.filename, 
                size: result.size 
            };

        } catch (error) {
            console.error('PDF export failed:', error);
            
            // Check if it's a browser connection issue
            let errorMessage = error.message;
            if (errorMessage.includes('browser') || errorMessage.includes('connection') || errorMessage.includes('disconnected')) {
                errorMessage = 'PDF generation service is temporarily unavailable. Please try again in a moment.';
            }
            
            // Create retry callback
            const retryCallback = () => {
                this.exportSurveyPDF(surveyId, format, options);
            };
            
            this.showExportError(errorMessage, retryCallback);
            return { success: false, error: errorMessage };
        } finally {
            this.isExporting = false;
            this.hideExportProgress();
        }
    }

    /**
     * Preview PDF data without downloading
     * @param {string} surveyId - The survey ID
     */
    async previewPDFData(surveyId) {
        try {
            const result = await previewPDFData(surveyId);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to preview PDF data');
            }
        } catch (error) {
            console.error('PDF preview failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Download file to user's device
     * @param {Blob} blob - File blob
     * @param {string} filename - Filename for download
     */
    downloadFile(blob, filename) {
        try {
            console.log('📁 PDFExportManager: Starting file download:', filename, 'Size:', blob.size);
            
            // Check browser compatibility
            if (!window.URL || !window.URL.createObjectURL) {
                throw new Error('Browser does not support file downloads');
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('✅ PDFExportManager: File download cleanup completed');
            }, 100);
            
            console.log('✅ PDFExportManager: File download initiated successfully');
        } catch (error) {
            console.error('❌ PDFExportManager: File download failed:', error);
            throw new Error('Failed to download file: ' + error.message);
        }
    }

    /**
     * Show export progress indicator
     * @param {string} message - Progress message
     */
    showExportProgress(message) {
        // Remove existing progress if any
        this.hideExportProgress();

        const progressHtml = `
            <div id="pdf-export-progress" class="pdf-export-progress">
                <div class="progress-content">
                    <div class="progress-spinner">
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
                    </div>
                    <div class="progress-text">
                        <div class="progress-message">${message}</div>
                        <div class="progress-subtitle">Please wait while we generate your PDF report...</div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', progressHtml);
    }

    /**
     * Update export progress message
     * @param {string} message - New progress message
     */
    updateExportProgress(message) {
        const progressElement = document.getElementById('pdf-export-progress');
        if (progressElement) {
            const messageElement = progressElement.querySelector('.progress-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    /**
     * Hide export progress indicator
     */
    hideExportProgress() {
        const progressElement = document.getElementById('pdf-export-progress');
        if (progressElement) {
            progressElement.remove();
        }
    }

    /**
     * Show export success message
     * @param {string} filename - Downloaded filename
     * @param {number} size - File size in bytes
     */
    showExportSuccess(filename, size) {
        const sizeText = this.formatFileSize(size);
        const message = `
            <div class="success-content">
                <i class="fas fa-check-circle success-icon"></i>
                <div class="success-text">
                    <div class="success-title">PDF Export Complete!</div>
                    <div class="success-details">
                        <strong>${filename}</strong><br>
                        <span class="file-size">${sizeText}</span>
                    </div>
                </div>
            </div>
        `;

        M.toast({
            html: message,
            classes: 'green',
            displayLength: 5000
        });
    }

    /**
     * Show export error message with retry option
     * @param {string} error - Error message
     * @param {Function} retryCallback - Callback for retry action
     */
    showExportError(error, retryCallback = null) {
        const retryButton = retryCallback ? 
            `<button class="btn-flat toast-action" onclick="retryPDFExport()" style="color: #fff; margin-left: 10px;">Retry</button>` : '';
        
        const message = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <div class="error-text">
                    <div class="error-title">PDF Export Failed</div>
                    <div class="error-details">${error}${retryButton}</div>
                </div>
            </div>
        `;

        // Store retry callback globally for the toast action
        if (retryCallback) {
            window.retryPDFExport = retryCallback;
        }

        M.toast({
            html: message,
            classes: 'red',
            displayLength: 8000
        });
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if export is currently in progress
     * @returns {boolean} Export status
     */
    isExportInProgress() {
        return this.isExporting;
    }
}

// Create singleton instance
const pdfExportManager = new PDFExportManager();

// Export functions for global access
export function exportSurveyPDF(surveyId, format = 'full', options = {}) {
    return pdfExportManager.exportSurveyPDF(surveyId, format, options);
}

export function previewPDF(surveyId) {
    return pdfExportManager.previewPDFData(surveyId);
}

export function isPDFExportInProgress() {
    return pdfExportManager.isExportInProgress();
}

// Expose to global scope
window.exportSurveyPDF = exportSurveyPDF;
window.previewPDF = previewPDF;
window.isPDFExportInProgress = isPDFExportInProgress;

export default pdfExportManager;
