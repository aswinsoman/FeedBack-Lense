// PDF Export Routes
// Author: Huy
const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');

// All PDF routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/pdf/survey/:surveyId/info
 * Get PDF generation information without creating the PDF
 * Query params: none
 * Returns: PDF generation capabilities and metadata
 */
router.get('/survey/:surveyId/info', pdfController.getPDFInfo);

/**
 * GET /api/v1/pdf/survey/:surveyId/preview
 * Preview the data that would be included in the PDF
 * Query params: none
 * Returns: JSON preview of report data
 */
router.get('/survey/:surveyId/preview', pdfController.previewPDFData);

/**
 * GET /api/v1/pdf/survey/:surveyId/download
 * Generate and download PDF report
 * Query params:
 *   - format: 'full' (default) or 'quick'
 * Returns: PDF file download
 */
router.get('/survey/:surveyId/download', pdfController.generateFullReport);


module.exports = router;