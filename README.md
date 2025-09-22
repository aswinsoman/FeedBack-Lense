# FeedBack-Lense

A comprehensive survey creation and feedback management platform built with Node.js, Express, and MongoDB. FeedBack-Lense provides a complete solution for creating surveys via CSV upload, managing participant invitations, collecting responses, and analyzing feedback data.

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

### Invitation System
- **Email Invitations**: Send personalized invitations to participants
- **Bulk Invitations**: Support for multiple email addresses
- **Invitation Tracking**: Monitor sent, pending, and completed invitations
- **Secure Access**: Token-based survey access for participants

### Response Collection
- **Paginated Survey Taking**: User-friendly survey interface with pagination
- **Response Validation**: Ensure complete survey submissions
- **Real-time Data Collection**: Immediate response storage and processing
- **Completion Tracking**: Monitor response rates and completion statistics

### Dashboard & Analytics
- **User Dashboard**: Overview of created surveys, statistics, and recent activity
- **Response Analytics**: Statistical analysis of numerical responses (mean, median, mode)
- **Real-time Updates**: Auto-refreshing dashboard with latest data
- **Survey Performance Metrics**: Response rates, completion times, and participant engagement

### Authentication & Security
- **JWT-based Authentication**: Secure user sessions
- **Password Encryption**: bcrypt-based password hashing
- **Protected Routes**: Middleware-based route protection
- **User Management**: Registration, login, and profile management

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcrypt for password hashing
- **File Handling**: Multer for CSV file uploads
- **Testing**: Mocha, Chai, and Supertest

### Frontend
- **Framework**: Vanilla JavaScript with ES6 modules
- **UI Library**: Materialize CSS
- **Icons**: Font Awesome
- **CSV Processing**: Papa Parse library
- **Styling**: Custom CSS with Material Design principles

### Development Tools
- **Process Manager**: Nodemon for development
- **Environment**: dotenv for configuration
- **CORS**: Cross-origin resource sharing support
- **API Documentation**: RESTful API with comprehensive endpoints

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
   
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/feedbacklens
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   PORT=4000
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Start the application**
   
   Backend server:
   ```bash
   cd backend
   npm start
   ```
   
   Frontend server:
   ```bash
   cd frontend
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get user profile

### Survey Management
- `POST /api/v1/surveys/create` - Create new survey
- `GET /api/v1/surveys/created` - Get user's surveys
- `GET /api/v1/surveys/:surveyId` - Get survey details
- `PATCH /api/v1/surveys/:surveyId/status` - Update survey status

### Invitations
- `POST /api/v1/invitations/send` - Send survey invitations
- `GET /api/v1/invitations/received` - Get received invitations
- `GET /api/v1/surveys/:surveyId/invitations` - Get survey invitations

### Dashboard
- `GET /api/v1/dashboard/user/stats` - Get user dashboard statistics
- `GET /api/v1/dashboard/user/summary` - Get user summary data

### Survey Access (Public)
- `GET /survey/:surveyId?token=xxx` - Access survey via invitation token

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

Run the comprehensive test suite:

```bash
cd backend
npm test
```

The test suite includes:
- Unit tests for controllers and services
- Integration tests for API endpoints
- End-to-end workflow testing
- Survey creation and invitation flow testing

## 🔐 Security Features

- **Authentication**: JWT-based secure authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Comprehensive data validation
- **File Upload Security**: Restricted file types and size limits
- **CORS Protection**: Configured cross-origin policies
- **Error Handling**: Secure error responses without sensitive data exposure

## 📱 User Interface

### Dashboard
- Clean, modern interface with Material Design
- Real-time statistics and charts
- Responsive design for all devices
- Intuitive navigation and user experience

### Survey Creation
- Step-by-step survey creation wizard
- Drag-and-drop CSV file upload
- Real-time preview and validation
- Inline question editing capabilities

### Survey Taking
- Paginated question display
- Progress indicators
- Responsive form controls
- Completion validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation in the `/documentation` folder
- Review API examples in the markdown files
- Examine test files for usage patterns

## 🚀 Future Enhancements

- Advanced analytics and reporting
- Survey templates and themes
- Email notification system
- Export functionality for responses
- Advanced question types (matrix, ranking)
- Multi-language support 
