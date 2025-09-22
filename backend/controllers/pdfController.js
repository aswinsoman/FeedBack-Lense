// PDF Export Controller
// Author: Huy
const pdfService = require('../services/pdfService');
const surveyService = require('../services/surveyService');

class PDFController {
    
    /**
     * Generate and download full analytics PDF report
     */
    async generateFullReport(req, res) {
        try {
            const { surveyId } = req.params;
            const userId = req.userId;
            const { format = 'full' } = req.query;

            // Validate survey ID format
            if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ error: 'Invalid survey ID format' });
            }

            // Verify survey ownership first
            try {
                await surveyService.getSurveyById(surveyId, userId);
            } catch (error) {
                if (error.code === 'SURVEY_NOT_FOUND') {
                    return res.status(404).json({ error: 'Survey not found' });
                }
                if (error.code === 'ACCESS_DENIED') {
                    return res.status(403).json({ error: 'Access denied: not survey creator' });
                }
                throw error;
            }

            console.log(`Generating ${format} PDF report for survey ${surveyId} by user ${userId}`);

            // Generate PDF based on format
            let pdfResult;
            if (format === 'quick') {
                pdfResult = await pdfService.generateQuickSummaryPDF(surveyId, userId);
            } else {
                pdfResult = await pdfService.generateSurveyPDF(surveyId, userId);
            }

            // Set appropriate headers for file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
            res.setHeader('Content-Length', pdfResult.buffer.length);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            // Send the PDF buffer
            return res.send(pdfResult.buffer);

        } catch (error) {
            console.error('PDF generation error:', error);
            
            // Handle specific PDF generation errors
            if (error.message.includes('PDF generation failed')) {
                return res.status(500).json({ 
                    error: 'Failed to generate PDF report',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (error.message.includes('Failed to compile analytics data')) {
                return res.status(500).json({ 
                    error: 'Unable to compile analytics data for report',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            // Generic error response
            return res.status(500).json({ 
                error: 'Internal server error during PDF generation',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Get PDF generation status/info without generating
     */
    async getPDFInfo(req, res) {
        try {
            const { surveyId } = req.params;
            const userId = req.userId;

            // Validate survey ID format
            if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ error: 'Invalid survey ID format' });
            }

            // Verify survey access
            const survey = await surveyService.getSurveyById(surveyId, userId);
            
            // Get basic analytics data to check if report is possible
            const { analyzeSurvey } = require('../services/analyticsService');
            const analytics = await analyzeSurvey(surveyId, { topN: 1 });

            const pdfInfo = {
                surveyId: survey.id,
                surveyTitle: survey.title,
                canGeneratePDF: true,
                estimatedSize: 'Small', // Could be calculated based on response count
                responseCount: analytics.details.answersCount,
                lastUpdated: survey.updatedAt,
                availableFormats: [
                    {
                        format: 'full',
                        description: 'Complete analytics report with all charts and data',
                        estimatedPages: Math.max(3, Math.ceil(analytics.details.answersCount / 50))
                    },
                    {
                        format: 'quick',
                        description: 'Summary report with key insights',
                        estimatedPages: 2
                    }
                ]
            };

            // Check if there's enough data for meaningful report
            if (analytics.details.answersCount === 0) {
                pdfInfo.canGeneratePDF = false;
                pdfInfo.reason = 'No responses available for analysis';
            }

            return res.json({
                success: true,
                pdfInfo
            });

        } catch (error) {
            console.error('PDF info error:', error);
            
            if (error.code === 'SURVEY_NOT_FOUND') {
                return res.status(404).json({ error: 'Survey not found' });
            }
            if (error.code === 'ACCESS_DENIED') {
                return res.status(403).json({ error: 'Access denied: not survey creator' });
            }
            
            return res.status(500).json({ error: 'Failed to get PDF information' });
        }
    }

    /**
     * Preview PDF data without generating the actual PDF
     */
    async previewPDFData(req, res) {
        try {
            const { surveyId } = req.params;
            const userId = req.userId;

            // Validate survey ID format
            if (!surveyId || !surveyId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ error: 'Invalid survey ID format' });
            }

            // Get compiled data that would be used for PDF
            const reportData = await pdfService.compileAnalyticsData(surveyId, userId);

            // Return preview data (without actually generating PDF)
            const previewData = {
                survey: {
                    title: reportData.survey.title,
                    questionCount: reportData.survey.questionCount,
                    status: reportData.survey.status,
                    createdAt: reportData.survey.createdAt
                },
                analytics: {
                    sentimentLabel: reportData.analytics.sentiment.label,
                    sentimentScore: reportData.analytics.sentiment.score,
                    topKeywords: reportData.analytics.keywords.slice(0, 5),
                    summary: reportData.analytics.summary
                },
                statistics: {
                    totalResponses: reportData.statistics.responses.totalResponses,
                    avgCompletionTime: reportData.statistics.responses.avgCompletionTime,
                    responseRate: reportData.statistics.invitations.responseRate,
                    numericalQuestionsCount: reportData.statistics.questionAnalysis.length
                },
                metadata: reportData.metadata
            };

            return res.json({
                success: true,
                preview: previewData
            });

        } catch (error) {
            console.error('PDF preview error:', error);
            
            if (error.code === 'SURVEY_NOT_FOUND') {
                return res.status(404).json({ error: 'Survey not found' });
            }
            if (error.code === 'ACCESS_DENIED') {
                return res.status(403).json({ error: 'Access denied: not survey creator' });
            }
            
            return res.status(500).json({ error: 'Failed to generate PDF preview' });
        }
    }
}

module.exports = new PDFController();