# FeedbackLense

A comprehensive survey creation and feedback management platform built with Node.js, Express, and MongoDB. FeedbackLense provides a complete solution for creating surveys via CSV upload, managing participant invitations, collecting responses, and analyzing feedback data with advanced analytics and professional PDF reporting.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Total E2E Tests** | 435+ comprehensive tests |
| **Browser Coverage** | 5 browsers (Chrome, Firefox, Safari, Mobile) |
| **Features Tested** | 4 critical features (F3, F5, F6, F8) |
| **Backend Tests** | Unit & Integration tests with Mocha/Chai |
| **API Endpoints** | 25+ RESTful endpoints |
| **Test Coverage** | 100% of acceptance criteria (22/22) |
| **Technologies** | 15+ modern technologies |
| **Documentation Files** | 20+ comprehensive guides |

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [CSV Format Requirements](#-csv-format-requirements)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Security Features](#-security-features)
- [User Interface](#-user-interface)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Support](#-support)
- [Future Enhancements](#-future-enhancements)

## ✨ Key Highlights
- 📈 **Advanced Analytics**:  Sentiment analysis and keyword extraction using Natural NLP, Statistical analysis, trends, and AI-generated summaries.

- 📊 **Professional PDF Reports**: Generate comprehensive analytics reports in seconds
- ⚡ **Real-time Updates**: Auto-refreshing dashboard with live response tracking (15s intervals)
- 🧪 **Comprehensive Testing**: 435+ E2E tests with Playwright across 5 browsers
- 🔒 **Enterprise Security**: JWT authentication, bcrypt encryption, and token-based access
- 📱 **Responsive Design**: Mobile-friendly Material Design interface
- 📤 **Bulk Operations**: CSV upload, bulk invitations, and batch response handling

## 🚀 Quick Start

Get FeedBack-Lense running in 5 minutes:

```bash
# 1. Clone and install
git clone <repository-url>
cd FeedBack-Lense
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cd backend
echo "MONGO_URI=mongodb://localhost:27017/feedbacklens
JWT_SECRET=your_secret_key_change_in_production
FRONTEND_URL=http://localhost:3000
PORT=5000" > .env

# 3. Start MongoDB
brew services start mongodb-community  # macOS
# OR: sudo systemctl start mongod       # Linux
# OR: net start MongoDB                 # Windows

# 4. Start servers (in separate terminals)
cd backend && npm start    # Terminal 1 - Backend at :5000
cd frontend && npm start   # Terminal 2 - Frontend at :3000

# 5. Open browser
open http://localhost:3000
```

**First Time Setup:**
1. Register a new account at `/auth/signup.html`
2. Login and access your dashboard
3. Create your first survey by uploading a CSV file
4. Send invitations and start collecting responses!

**Sample CSV** is included in the project root: `sample_survey_format.csv`

## 🚀 Features

### Survey Management
- **CSV-based Survey Creation**: Upload surveys via CSV files with support for multiple question types
- **Interactive Survey Builder**: Edit questions, customize types, and manage survey structure
- **Question Types Support**: 
  - Text responses
  - Likert scale (1-5 rating)
  - Multiple choice with custom options
- **Survey Preview**: Real-time preview of how surveys appear to participants
- **Survey Status Management**: Activate, deactivate, and manage survey lifecycle
- **Bulk Survey Creation**: Upload up to 20 questions per survey

### Invitation System
- **Email Invitations**: Send personalized invitations to participants
- **Bulk Invitations**: Support for multiple email addresses
- **Invitation Tracking**: Monitor sent, pending, and completed invitations
- **Secure Access**: Token-based survey access for participants
- **Invitation Status Management**: Track invitation delivery and response status

### Response Collection
- **Paginated Survey Taking**: User-friendly survey interface with pagination
- **Response Validation**: Ensure complete survey submissions
- **Real-time Data Collection**: Immediate response storage and processing
- **Completion Tracking**: Monitor response rates and completion statistics

### Advanced Analytics & Insights
- **Real-time Analytics Dashboard**: Auto-refreshing analytics every 15 seconds
- **AI-Powered Sentiment Analysis**: Natural Language Processing using the Natural library
  - Positive, Negative, and Neutral sentiment classification
  - Pattern-based sentiment analysis with PorterStemmer
  - Sentiment breakdown and distribution metrics
- **Keyword Extraction & Analysis**: 
  - Top 10 keywords automatically extracted from text responses
  - Intelligent stopword filtering
  - Stemming-based keyword normalization
- **Statistical Analysis**: Mean, median, mode, and standard deviation for numerical responses
- **AI-Generated Summaries**: Automatic narrative summaries of survey results
- **Response Trends**: Time-series analysis of response patterns
- **Visual Analytics**: Charts and graphs for data visualization
- **Recent Responses Tracking**: Monitor latest participant responses in real-time

### PDF Export & Reporting
- **Professional PDF Reports**: Generate comprehensive analytics reports
- **Two Report Formats**:
  - **Quick Summary**: 2-page essential statistics report
  - **Full Report**: 3+ page detailed analytics with visualizations
- **Report Contents**:
  - Survey metadata and statistics
  - Sentiment analysis results
  - Top keywords and frequency analysis
  - Response rate and completion times
  - Numerical question statistics
  - Complete question list and responses
- **Automated Generation**: Puppeteer-based PDF generation (3-10 seconds)
- **Download Management**: Direct file download with proper naming conventions
- **Preview Functionality**: Preview report data before generating PDF

### Dashboard & User Interface
- **User Dashboard**: Overview of created surveys, statistics, and recent activity
- **Survey Performance Metrics**: Response rates, completion times, and participant engagement
- **Activity Feed**: Real-time updates on survey responses and invitations
- **Search & Filter**: Find surveys quickly with search functionality
- **Responsive Design**: Mobile-friendly interface with Material Design

### Authentication & Security
- **JWT-based Authentication**: Secure user sessions with token expiration
- **Password Encryption**: bcrypt-based password hashing with salt rounds
- **Protected Routes**: Middleware-based route protection
- **User Management**: Registration, login, and profile management
- **Access Control**: Survey creator-only access to analytics and exports
- **Token-based Survey Access**: Secure invitation links with unique tokens

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcrypt for password hashing
- **File Handling**: Multer for CSV file uploads
- **Natural Language Processing**: Natural library for sentiment analysis and keyword extraction
- **PDF Generation**: Puppeteer for automated PDF report creation
- **Testing**: Mocha, Chai, Supertest (Backend), Playwright (E2E)

### Frontend
- **Framework**: Vanilla JavaScript with ES6 modules
- **UI Library**: Materialize CSS
- **Icons**: Font Awesome
- **CSV Processing**: Papa Parse library
- **Styling**: Custom CSS with Material Design principles
- **Real-time Updates**: Polling-based auto-refresh mechanism
- **Charts & Visualizations**: Dynamic data visualization components

### Advanced Analytics
- **NLP Engine**: Natural.js with PorterStemmer
- **Sentiment Analysis**: Pattern-based analyzer for English language
- **Tokenization**: WordTokenizer for text processing
- **Keyword Extraction**: Frequency-based with stemming normalization
- **Statistical Analysis**: Custom algorithms for mean, median, mode calculations

### Development Tools
- **Process Manager**: Nodemon for development
- **Environment**: dotenv for configuration
- **CORS**: Cross-origin resource sharing support
- **API Documentation**: RESTful API with comprehensive endpoints
- **E2E Testing**: Playwright with multi-browser support (Chrome, Firefox, Safari)
- **Test Coverage**: 435+ comprehensive E2E tests across 4 critical features

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FeedBack-Lense
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the backend directory with the following configuration:
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/feedbacklens
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
   JWT_EXPIRE=7d
   
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Frontend Configuration
   FRONTEND_URL=http://localhost:3000
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```
   
   **Important**: Change `JWT_SECRET` to a strong, random string in production!

5. **Start MongoDB**
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community
   
   # Or start manually
   mongod
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

6. **Start the application**
   
   **Option 1: Using separate terminals (Recommended for development)**
   
   Terminal 1 - Backend server:
   ```bash
   cd backend
   npm start
   # Server will run at http://localhost:5000
   ```
   
   Terminal 2 - Frontend server:
   ```bash
   cd frontend
   npm start
   # Server will run at http://localhost:3000
   ```
   
   **Option 2: Using process managers (Production)**
   ```bash
   # Using PM2
   pm2 start backend/server.js --name "feedbacklens-backend"
   pm2 start frontend/server.js --name "feedbacklens-frontend"
   ```

7. **Verify Installation**
   
   Open your browser and navigate to:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api/v1`
   
   You should see the application running!

8. **Optional: Seed Database**
   
   To populate the database with sample data:
   ```bash
   cd backend
   node seed_database.js
   ```

## 🔧 Configuration

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/feedbacklens` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `JWT_EXPIRE` | JWT token expiration time | `7d` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Backend server port | `5000` | No |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | No |

### Troubleshooting Installation

**MongoDB Connection Issues:**
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
sudo tail -f /var/log/mongodb/mongod.log      # Linux
```

**Port Already in Use:**
```bash
# Find process using port 5000 (backend)
lsof -i :5000
kill -9 <PID>

# Find process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>
```

**Module Not Found Errors:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get user profile

### Survey Management
- `POST /api/v1/surveys/create` - Create new survey via CSV upload
- `GET /api/v1/surveys/created` - Get user's created surveys
- `GET /api/v1/surveys/:surveyId` - Get survey details
- `PATCH /api/v1/surveys/:surveyId/status` - Update survey status (active/inactive)
- `DELETE /api/v1/surveys/:surveyId` - Delete survey

### Invitations
- `POST /api/v1/invitations/send` - Send survey invitations (bulk support)
- `GET /api/v1/invitations/received` - Get received invitations
- `GET /api/v1/surveys/:surveyId/invitations` - Get survey invitations status
- `PATCH /api/v1/invitations/:invitationId/status` - Update invitation status

### Analytics
- `GET /api/v1/analytics/:surveyId` - Get comprehensive survey analytics
- `GET /api/v1/analytics/:surveyId/sentiment` - Get sentiment analysis
- `GET /api/v1/analytics/:surveyId/keywords` - Get keyword analysis
- `GET /api/v1/analytics/:surveyId/statistics` - Get statistical summary
- `GET /api/v1/analytics/:surveyId/recent` - Get recent responses
- `GET /api/v1/analytics/:surveyId/trends` - Get response trends

### PDF Export
- `GET /api/v1/pdf/survey/:surveyId/info` - Check PDF availability and metadata
- `GET /api/v1/pdf/survey/:surveyId/preview` - Preview report data (JSON)
- `GET /api/v1/pdf/survey/:surveyId/download?format=quick|full` - Download PDF report
  - **Quick**: 2-page summary report
  - **Full**: 3+ page detailed report with visualizations

### Dashboard
- `GET /api/v1/dashboard/user/stats` - Get user dashboard statistics
- `GET /api/v1/dashboard/user/summary` - Get user summary with recent activity
- `GET /api/v1/dashboard/surveys` - Get all surveys with analytics

### Survey Access (Public)
- `GET /survey/:surveyId?token=xxx` - Access survey via invitation token
- `POST /api/v1/surveys/:surveyId/responses` - Submit survey response

## 📊 CSV Format Requirements

When creating surveys via CSV upload, use the following format:

```csv
questionId,questionText,type,options
Q1,"How satisfied are you with our service?",likert,
Q2,"Which features do you use most?",multiple-choice,"Feature A;Feature B;Feature C"
Q3,"Any additional comments?",text,
```

**Requirements:**
- Headers: `questionId`, `questionText`, `type`, `options`
- Maximum 20 questions per survey
- Supported types: `text`, `likert`, `multiple-choice`
- For multiple-choice: separate options with semicolons in the `options` column
- Question text maximum 500 characters

## 🏗 Architecture

### Backend Structure
```
backend/
├── controllers/          # Business logic handlers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── services/            # Business logic services
├── middleware/          # Custom middleware
└── tests/              # Test suites
```

### Frontend Structure
```
frontend/
├── public/             # HTML pages and assets
├── js/                 # JavaScript modules
│   ├── api/           # API communication
│   ├── auth/          # Authentication logic
│   ├── dashboard/     # Dashboard functionality
│   ├── survey/        # Survey creation and taking
│   └── lib/           # Utility functions
└── css/               # Stylesheets
```

## 🧪 Testing

### Backend Tests (Mocha, Chai, Supertest)

Run backend unit and integration tests:

```bash
cd backend
npm test                    # Run all backend tests
npm run test:auth           # Test authentication flows
npm run testSurveyResponse  # Test survey response flows
```

### End-to-End Tests (Playwright)

Comprehensive E2E test suite with **435+ tests** across **4 critical features**:

```bash
cd suong-ngo-tests

# Test individual features (recommended)
npm run test:f3        # F3: Survey Creation (95 tests)
npm run test:f5        # F5: Survey Taking (95 tests)
npm run test:f6        # F6: Analytics (125 tests)
npm run test:f8        # F8: PDF Export (85 tests)

# Browser-specific tests (faster)
npm run test:f3:chrome    # Run F3 on Chrome only
npm run test:chrome       # All tests on Chrome
npm run test:firefox      # All tests on Firefox
npm run test:safari       # All tests on Safari
npm run test:mobile       # All tests on mobile devices

# Debug modes
npm run test:f3:headed    # Run with visible browser
npm run test:f3:debug     # Run in step-by-step debug mode
```


### Test Metrics
- **Total Tests**: 435 comprehensive E2E tests
- **Browser Coverage**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Acceptance Criteria**: 100% coverage (22/22 ACs)
- **Test Categories**: Authentication, UI, API, Error Handling, Performance, Accessibility


## 🔐 Security Features

- **Authentication**: JWT-based secure authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Comprehensive data validation
- **File Upload Security**: Restricted file types and size limits
- **CORS Protection**: Configured cross-origin policies
- **Error Handling**: Secure error responses without sensitive data exposure

## 📱 User Interface

### Dashboard
- Clean, modern interface with Material Design principles
- Real-time statistics and charts with auto-refresh
- Responsive design for desktop, tablet, and mobile devices
- Intuitive navigation and user experience
- Activity feed with recent responses
- Search and filter functionality for surveys

### Survey Creation
- Step-by-step survey creation wizard
- Drag-and-drop CSV file upload with validation
- Real-time preview and error detection
- Inline question editing capabilities
- Question type customization (text, likert, multiple-choice)
- Survey status management interface

### Survey Taking
- Paginated question display for better UX
- Progress indicators showing completion percentage
- Responsive form controls optimized for all devices
- Completion validation before submission
- Anonymous response support
- Clean, distraction-free interface

### Analytics Dashboard
- Real-time auto-refreshing (every 15 seconds)
- Interactive charts and visualizations
- Sentiment analysis visualization (Positive/Negative/Neutral)
- Keyword cloud and frequency analysis
- Response trends and time-series data
- Recent responses feed
- AI-generated summary display
- PDF export buttons (Quick Summary & Full Report)

### Invitations Management
- Bulk email invitation interface
- Invitation status tracking (sent, pending, completed)
- Copy invitation link functionality
- Visual status indicators

## 👥 Use Cases

FeedBack-Lense is perfect for:

- **Educational Institutions**: Course evaluations, student feedback, teaching assessments
- **Corporate Teams**: Employee satisfaction surveys, team feedback, performance reviews
- **Researchers**: Academic research surveys, data collection, sentiment analysis
- **Product Managers**: User feedback, feature requests, customer satisfaction (NPS)
- **Event Organizers**: Post-event surveys, attendee feedback, experience analysis
- **HR Departments**: Employee engagement, exit interviews, onboarding feedback
- **Customer Success Teams**: Customer satisfaction tracking, support quality assessment
- **Market Research**: Consumer surveys, brand perception, market analysis


## 📄 License

This project is licensed under the ISC License.

- **Feature Documentation**:
  - `Feature3-Readme.md` - Survey creation feature documentation
  - `Feature6-Readme.md` - Analytics feature documentation
  - `Feature8-Readme.md` - PDF export feature documentation
  - `pdf-export.md` - PDF export API guide
  - `survey-dashboard.md` - Dashboard functionality guide
  - `survey-invitation.md` - Invitation system guide
  - `survey-response.md` - Response collection guide

### Test Directories

1. **`backend/tests/`** - Backend unit and integration tests
   - `e2e/auth.test.js` - Authentication flow tests
   - `e2e/survey-invitation.test.js` - Invitation system tests
   - `e2e/surveyResponse.test.js` - Response submission tests
   - `fixtures/test-survey.csv` - Test data fixtures

2. **`suong-ngo-tests/`** - Comprehensive Playwright E2E tests
   - 435+ tests across 4 critical features
   - Multi-browser testing (Chrome, Firefox, Safari, Mobile)
   - Detailed test reports and screenshots
   - `playwright.config.local.js` - Playwright configuration

3. **`movini-tests/`** - Additional feature tests
   - Authentication and invitation tests
   - Sample survey format fixtures


## 🚀 Future Enhancements

### Planned Features
- **Email Notification System**: Automated email reminders for incomplete surveys
- **Survey Templates**: Pre-built survey templates for common use cases
- **Custom Themes**: Customizable color schemes and branding for surveys
- **Advanced Question Types**: 
  - Matrix questions (grid-style)
  - Ranking questions
  - File upload questions
  - Date/time pickers
- **Data Export Options**:
  - CSV export of raw response data
  - Excel export with charts
  - JSON API export
- **Multi-language Support**: Internationalization for global reach
- **Survey Logic**: Conditional branching and skip logic
- **Collaboration**: Multiple users managing surveys together
- **Advanced Analytics**:
  - Cross-tabulation analysis
  - Cohort analysis
  - Custom date range filtering
- **Mobile App**: Native mobile applications for iOS and Android
- **Integration APIs**: Webhooks and third-party integrations (Slack, Teams, etc.)
- **Survey Scheduling**: Automatic survey activation/deactivation
- **Response Quotas**: Limit survey responses by count or date
