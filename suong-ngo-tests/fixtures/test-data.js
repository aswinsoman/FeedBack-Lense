/**
 * Test Data Fixtures
 * Mock data for e2e tests across all features
 */

/**
 * Mock user data
 */
const mockUsers = {
  creator: {
    email: 'Aswin2@gmail.com',
    password: 'Feedbacklense@1234',
    name: 'John Doe',
    role: 'creator'
  },
  recipient: {
    email: 'Suongngo11@gmail.com',
    password: 'Feedbacklense@1234',
    name: 'Jane Smith',
    role: 'recipient'
  },
  admin: {
    email: 'thithungo@gmail.com',
    password: 'Feedbacklense@1234',
    name: 'Admin User',
    role: 'admin'
  }
};

/**
 * Mock survey data
 */
const mockSurveys = {
  basic: {
    id: '507f1f77bcf86cd799439011',
    title: 'Customer Satisfaction Survey',
    description: 'A comprehensive survey about customer satisfaction',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    responseCount: 42,
    questions: [
      {
        questionId: 'Q1',
        questionText: 'How satisfied are you with our service?',
        type: 'text'
      },
      {
        questionId: 'Q2',
        questionText: 'Rate our customer support',
        type: 'likert'
      },
      {
        questionId: 'Q3',
        questionText: 'Which feature do you use most?',
        type: 'multiple-choice',
        options: ['Feature A', 'Feature B', 'Feature C']
      }
    ]
  },
  withMultipleTypes: {
    id: '507f1f77bcf86cd799439012',
    title: 'Mixed Question Types Survey',
    description: 'Survey with various question types',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    responseCount: 25,
    questions: [
      {
        questionId: 'Q1',
        questionText: 'Please provide your feedback',
        type: 'text'
      },
      {
        questionId: 'Q2',
        questionText: 'How likely are you to recommend us?',
        type: 'likert'
      },
      {
        questionId: 'Q3',
        questionText: 'What is your preferred contact method?',
        type: 'multiple-choice',
        options: ['Email', 'Phone', 'SMS']
      }
    ]
  },
  completed: {
    id: '507f1f77bcf86cd799439013',
    title: 'Product Feedback Survey',
    description: 'Survey about product feedback',
    status: 'completed',
    createdAt: '2024-01-10T10:00:00Z',
    endDate: '2024-01-20T23:59:59Z',
    responseCount: 28
  }
};

/**
 * Mock analytics data
 */
const mockAnalyticsData = {
  basic: {
    stats: {
      totalAnswers: 42,
      averageTime: 150,
      completionRate: 85
    },
    overallSentiment: {
      label: 'Positive',
      score: 0.75
    },
    sentimentDistribution: {
      positive: 25,
      neutral: 12,
      negative: 5
    },
    topKeywords: [
      { term: 'excellent', count: 15 },
      { term: 'satisfied', count: 12 },
      { term: 'helpful', count: 10 },
      { term: 'professional', count: 8 },
      { term: 'quick', count: 7 },
      { term: 'friendly', count: 6 },
      { term: 'efficient', count: 5 },
      { term: 'reliable', count: 4 },
      { term: 'responsive', count: 3 },
      { term: 'quality', count: 2 }
    ],
    summary: 'Overall customer satisfaction is high with 85% completion rate. Key themes include excellent service quality and professional staff interactions.'
  },
  timeSeries: [
    { periodStart: '2024-01-15T00:00:00Z', responseCount: 5, avgCompletionTime: 120 },
    { periodStart: '2024-01-16T00:00:00Z', responseCount: 8, avgCompletionTime: 135 },
    { periodStart: '2024-01-17T00:00:00Z', responseCount: 12, avgCompletionTime: 150 },
    { periodStart: '2024-01-18T00:00:00Z', responseCount: 7, avgCompletionTime: 140 },
    { periodStart: '2024-01-19T00:00:00Z', responseCount: 10, avgCompletionTime: 160 }
  ],
  questionScores: [
    { questionId: 'Q1', score: 4.2 },
    { questionId: 'Q2', score: 3.8 },
    { questionId: 'Q3', score: 4.5 },
    { questionId: 'Q4', score: 4.0 }
  ],
  recentResponses: [
    {
      submittedAt: '2024-01-19T14:30:00Z',
      sentiment: { label: 'positive', score: 0.8 },
      completionTime: 120,
      respondent: { email: 'user1@example.com' },
      satisfactionLevel: 'Very Satisfied',
      status: 'Completed'
    },
    {
      submittedAt: '2024-01-19T13:15:00Z',
      sentiment: { label: 'neutral', score: 0.2 },
      completionTime: 180,
      respondent: { email: 'user2@example.com' },
      satisfactionLevel: 'Neutral',
      status: 'Completed'
    }
  ]
};

/**
 * Mock CSV data
 */
const mockCsvData = {
  valid: `Question ID,Question Text,Question Type,Options
Q1,How satisfied are you with our service?,text,
Q2,Rate our customer support,likert,
Q3,Which feature do you use most?,multiple-choice,"Feature A,Feature B,Feature C"
Q4,Any additional comments?,text,`,
  
  invalidHeaders: `ID,Text,Type
Q1,How satisfied are you with our service?,text`,
  
  invalidTypes: `Question ID,Question Text,Question Type,Options
Q1,How satisfied are you with our service?,invalid-type,
Q2,Rate our customer support,likert,`,
  
  empty: `Question ID,Question Text,Question Type,Options`,
  
  tooManyColumns: `Question ID,Question Text,Question Type,Options,Extra Column
Q1,How satisfied are you with our service?,text,,
Q2,Rate our customer support,likert,,`
};

/**
 * Mock response data
 */
const mockResponses = {
  valid: {
    surveyId: '507f1f77bcf86cd799439011',
    responses: {
      'Q1': 'This is my response to the text question',
      'Q2': '4',
      'Q3': 'Feature A'
    },
    completionTime: 120,
    submittedAt: '2024-01-19T14:30:00Z'
  },
  incomplete: {
    surveyId: '507f1f77bcf86cd799439011',
    responses: {
      'Q1': 'Only answering text question'
      // Missing Q2 and Q3
    }
  }
};

/**
 * Mock PDF export data
 */
const mockPdfData = {
  success: {
    success: true,
    data: {
      pdfUrl: '/api/v1/analytics/507f1f77bcf86cd799439011/export/pdf',
      filename: 'survey-analytics-507f1f77bcf86cd799439011.pdf',
      generatedAt: '2024-01-19T14:30:00Z'
    }
  },
  error: {
    success: false,
    error: 'PDF generation failed'
  }
};

/**
 * Mock API responses
 */
const mockApiResponses = {
  auth: {
    login: {
      success: true,
      data: {
        token: 'mock-auth-token-123',
        user: mockUsers.creator
      }
    },
    logout: {
      success: true,
      message: 'Logged out successfully'
    }
  },
  surveys: {
    list: {
      success: true,
      data: {
        surveys: Object.values(mockSurveys)
      }
    },
    create: {
      success: true,
      data: {
        survey: mockSurveys.basic
      }
    },
    get: {
      success: true,
      data: {
        survey: mockSurveys.basic
      }
    }
  },
  analytics: {
    get: {
      success: true,
      data: mockAnalyticsData.basic
    },
    timeSeries: {
      success: true,
      data: mockAnalyticsData.timeSeries
    },
    poll: {
      success: true,
      data: { updated: false }
    }
  },
  responses: {
    submit: {
      success: true,
      data: {
        responseId: '507f1f77bcf86cd799439012',
        submittedAt: new Date().toISOString()
      }
    }
  }
};

/**
 * Error responses
 */
const mockErrorResponses = {
  notFound: {
    success: false,
    error: 'Resource not found'
  },
  unauthorized: {
    success: false,
    error: 'Unauthorized access'
  },
  validationError: {
    success: false,
    error: 'Validation failed',
    details: ['Invalid question type', 'Missing required field']
  },
  serverError: {
    success: false,
    error: 'Internal server error'
  }
};

module.exports = {
  mockUsers,
  mockSurveys,
  mockAnalyticsData,
  mockCsvData,
  mockResponses,
  mockPdfData,
  mockApiResponses,
  mockErrorResponses
};
