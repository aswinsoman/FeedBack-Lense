# PDF Export API - Frontend Integration Guide

## Overview
Generate and download analytics reports as PDF files for surveys.

## API Endpoints

### 1. Check PDF Availability
```
GET /api/v1/pdf/survey/{surveyId}/info
```
**Purpose:** Check if PDF can be generated and get metadata  
**Response:** Survey info, response count, available formats

### 2. Preview Report Data
```
GET /api/v1/pdf/survey/{surveyId}/preview
```
**Purpose:** Preview analytics data without generating PDF  
**Response:** JSON summary of what will be in the report

### 3. Download PDF Report
```
GET /api/v1/pdf/survey/{surveyId}/download?format={full|quick}
```
**Purpose:** Generate and download PDF file  
**Response:** PDF file download  
**Formats:**
- `full` - Complete report (3+ pages)
- `quick` - Summary report (2 pages)

## Frontend Implementation

### Basic Download Function
```javascript
const downloadPDF = async (surveyId, format = 'quick') => {
  try {
    const response = await fetch(`/api/v1/pdf/survey/${surveyId}/download?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-report-${surveyId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('PDF generation failed');
    }
  } catch (error) {
    console.error('PDF download error:', error);
    // Show user error message
  }
};
```

### Check Availability Before Download
```javascript
const checkPDFAvailability = async (surveyId) => {
  const response = await fetch(`/api/v1/pdf/survey/${surveyId}/info`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  return data.pdfInfo.canGeneratePDF;
};
```

## Report Content

**Full Report includes:**
- Survey metadata and statistics
- Sentiment analysis (Positive/Negative/Neutral)
- Top keywords from responses
- Response rate and completion times
- Numerical question statistics (averages, ranges)
- Complete question list

**Quick Report includes:**
- Essential statistics only
- Top 5 keywords
- Basic sentiment analysis
- 2-page summary

## Error Handling

| Status | Error | Action |
|--------|-------|--------|
| 400 | Invalid survey ID | Validate surveyId format |
| 403 | Access denied | User is not survey creator |
| 404 | Survey not found | Survey doesn't exist |
| 422 | No responses | Need at least 1 response for PDF |
| 500 | Generation failed | Show retry option |

## UI Recommendations

### PDF Download Button
```jsx
const PDFDownloadButton = ({ surveyId, disabled }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDownload = async (format) => {
    setLoading(true);
    try {
      await downloadPDF(surveyId, format);
    } catch (error) {
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleDownload('quick')} disabled={disabled || loading}>
        {loading ? 'Generating...' : 'Quick Summary'}
      </button>
      <button onClick={() => handleDownload('full')} disabled={disabled || loading}>
        {loading ? 'Generating...' : 'Full Report'}
      </button>
    </div>
  );
};
```

### Prerequisites Check
```javascript
// Only show PDF options if:
// 1. User owns the survey
// 2. Survey has at least 1 response
// 3. Survey is not deleted

const canDownloadPDF = (survey, responses, currentUser) => {
  return survey.creatorId === currentUser.id && 
         responses.length > 0 && 
         survey.status !== 'deleted';
};
```

## Notes

- PDF generation takes 3-10 seconds
- Requires authentication (survey creator only)
- File naming: `survey-{type}-{title}-{timestamp}.pdf`
- Surveys need responses for meaningful analytics
- Both formats include privacy-safe aggregated data only