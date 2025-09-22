// PDF Generation Service
// Author: Huy
const puppeteer = require('puppeteer');
const { analyzeSurvey } = require('./analyticsService');
const dashboardService = require('./dashboardService');
const surveyService = require('./surveyService');
const invitationService = require('./invitationService');

class PDFService {
    constructor() {
        this.browser = null;
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Compile all analytics data for PDF generation
     */
    async compileAnalyticsData(surveyId, creatorId) {
        try {
            // Get survey details
            const survey = await surveyService.getSurveyById(surveyId, creatorId);
            
            // Get analytics data
            const analyticsData = await analyzeSurvey(surveyId, { topN: 15 });
            
            // Get dashboard data
            const dashboardData = await dashboardService.getSurveyDashboard(surveyId, creatorId);
            
            // Get invitation statistics
            const invitationStats = await invitationService.getInvitationStats(surveyId);
            
            // Compile comprehensive report data
            const reportData = {
                survey: {
                    id: survey.id,
                    title: survey.title,
                    creatorName: survey.creatorName,
                    status: survey.status,
                    createdAt: survey.createdAt,
                    questionCount: survey.questions.length,
                    questions: survey.questions
                },
                analytics: {
                    sentiment: analyticsData.overallSentiment,
                    keywords: analyticsData.topKeywords,
                    summary: analyticsData.summary,
                    details: analyticsData.details
                },
                statistics: {
                    responses: dashboardData.analysis.overallMetrics,
                    invitations: invitationStats,
                    questionAnalysis: dashboardData.analysis.questionAnalysis
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: survey.creatorName,
                    reportType: 'Survey Analytics Report'
                }
            };

            return reportData;
        } catch (error) {
            console.error('Error compiling analytics data:', error);
            throw new Error('Failed to compile analytics data: ' + error.message);
        }
    }

    /**
     * Generate HTML template for PDF
     */
    generateHTMLTemplate(data) {
        const { survey, analytics, statistics, metadata } = data;
        
        // Format dates
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        // Generate keywords table
        const keywordsTable = analytics.keywords.map(kw => 
            `<tr><td>${kw.term}</td><td>${kw.count}</td></tr>`
        ).join('');

        // Generate question analysis
        const questionAnalysisHTML = statistics.questionAnalysis.map(qa => `
            <div class="question-analysis">
                <h4>Question: ${qa.questionText}</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Response Count:</span>
                        <span class="stat-value">${qa.responseCount}</span>
                    </div>
                    ${qa.statistics ? `
                        <div class="stat-item">
                            <span class="stat-label">Average:</span>
                            <span class="stat-value">${qa.statistics.mean}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Median:</span>
                            <span class="stat-value">${qa.statistics.median}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Range:</span>
                            <span class="stat-value">${qa.statistics.min} - ${qa.statistics.max}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Survey Analytics Report - ${survey.title}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #007bff;
                    margin-bottom: 10px;
                }
                .metadata {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .metadata-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                .metadata-item {
                    display: flex;
                    justify-content: space-between;
                }
                .section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .stat-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    border-left: 4px solid #007bff;
                }
                .stat-number {
                    font-size: 2em;
                    font-weight: bold;
                    color: #007bff;
                }
                .stat-label {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 5px;
                }
                .sentiment-card {
                    background: ${analytics.sentiment.label === 'positive' ? '#d4edda' : 
                                 analytics.sentiment.label === 'negative' ? '#f8d7da' : '#fff3cd'};
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .sentiment-score {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: ${analytics.sentiment.label === 'positive' ? '#155724' : 
                             analytics.sentiment.label === 'negative' ? '#721c24' : '#856404'};
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #007bff;
                    color: white;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                .question-analysis {
                    background: #f8f9fa;
                    padding: 20px;
                    margin: 15px 0;
                    border-radius: 8px;
                    border-left: 4px solid #28a745;
                }
                .question-analysis h4 {
                    margin-top: 0;
                    color: #28a745;
                }
                .stat-item {
                    background: white;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                .summary-text {
                    background: #e9ecef;
                    padding: 20px;
                    border-radius: 8px;
                    font-style: italic;
                    border-left: 4px solid #6c757d;
                }
                @media print {
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Survey Analytics Report</h1>
                <h2>${survey.title}</h2>
            </div>

            <div class="metadata">
                <h3>Report Information</h3>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <strong>Survey ID:</strong>
                        <span>${survey.id}</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Created By:</strong>
                        <span>${survey.creatorName}</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Survey Created:</strong>
                        <span>${formatDate(survey.createdAt)}</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Report Generated:</strong>
                        <span>${formatDate(metadata.generatedAt)}</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Status:</strong>
                        <span>${survey.status.toUpperCase()}</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Questions:</strong>
                        <span>${survey.questionCount}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Overview Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${statistics.responses.totalResponses}</div>
                        <div class="stat-label">Total Responses</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${statistics.invitations.totalInvitations}</div>
                        <div class="stat-label">Invitations Sent</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${statistics.invitations.responseRate}%</div>
                        <div class="stat-label">Response Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Math.round(statistics.responses.avgCompletionTime / 60)}m</div>
                        <div class="stat-label">Avg. Completion Time</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Sentiment Analysis</h2>
                <div class="sentiment-card">
                    <h3>Overall Sentiment: <span class="sentiment-score">${analytics.sentiment.label.toUpperCase()}</span></h3>
                    <p><strong>Score:</strong> ${analytics.sentiment.score}</p>
                </div>
                <div class="summary-text">
                    <strong>Summary:</strong> ${analytics.summary}
                </div>
            </div>

            <div class="section page-break">
                <h2>Top Keywords</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Keyword</th>
                            <th>Frequency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${keywordsTable}
                    </tbody>
                </table>
            </div>

            ${statistics.questionAnalysis.length > 0 ? `
            <div class="section page-break">
                <h2>Question Analysis</h2>
                <p>Numerical analysis for questions with quantitative responses:</p>
                ${questionAnalysisHTML}
            </div>
            ` : ''}

            <div class="section page-break">
                <h2>Survey Questions</h2>
                <ol>
                    ${survey.questions.map(q => `
                        <li>
                            <strong>ID:</strong> ${q.questionId}<br>
                            <strong>Question:</strong> ${q.questionText}
                        </li>
                    `).join('')}
                </ol>
            </div>

            <div class="section">
                <h2>Report Details</h2>
                <p><strong>Analysis Period:</strong> All responses since survey creation</p>
                <p><strong>Data Quality:</strong> ${analytics.details.answersCount} valid responses analyzed</p>
                <p><strong>Generated:</strong> ${formatDate(metadata.generatedAt)}</p>
                <p><em>This report was automatically generated by the FeedbackLens Analytics System.</em></p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate PDF from survey data
     */
    async generateSurveyPDF(surveyId, creatorId) {
        let browser = null;
        try {
            // Compile all data
            const reportData = await this.compileAnalyticsData(surveyId, creatorId);
            
            // Generate HTML
            const html = this.generateHTMLTemplate(reportData);
            
            // Initialize browser
            browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Set content and generate PDF
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
                        <span>Survey Analytics Report - ${reportData.survey.title}</span>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
                        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}</span>
                    </div>
                `
            });

            await page.close();
            
            return {
                buffer: pdfBuffer,
                filename: `survey-analytics-${reportData.survey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`,
                survey: reportData.survey
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('PDF generation failed: ' + error.message);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Generate quick summary PDF (lighter version)
     */
    async generateQuickSummaryPDF(surveyId, creatorId) {
        try {
            const survey = await surveyService.getSurveyById(surveyId, creatorId);
            const stats = await invitationService.getInvitationStats(surveyId);
            const analytics = await analyzeSurvey(surveyId, { topN: 5 });

            const quickData = {
                survey,
                analytics: {
                    sentiment: analytics.overallSentiment,
                    keywords: analytics.topKeywords.slice(0, 5),
                    summary: analytics.summary
                },
                statistics: { invitations: stats },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    reportType: 'Quick Summary'
                }
            };

            const html = this.generateHTMLTemplate(quickData);
            
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' }
            });

            await page.close();
            await browser.close();
            
            return {
                buffer: pdfBuffer,
                filename: `survey-summary-${survey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`,
                survey
            };
            
        } catch (error) {
            console.error('Error generating quick summary PDF:', error);
            throw new Error('Quick summary PDF generation failed: ' + error.message);
        }
    }
}

module.exports = new PDFService();