// Usage: node scripts/seedDemoData.js

try {
  require('dotenv').config();
} catch (e) {
  console.log('Note: dotenv not found, using environment variables directly');
}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Survey = require('./models/Survey');
const Invitation = require('./models/Invitation');
const Response = require('./models/Response');

const surveyService = require('./services/surveyService');
const invitationService = require('./services/invitationService');

async function clearDatabase() {
  console.log('🧹 Clearing existing demo data...');
  await User.deleteMany({});
  await Survey.deleteMany({});
  await Invitation.deleteMany({});
  await Response.deleteMany({});
  console.log('Database cleared');
}

async function createUsers() {
  console.log('👥 Creating user accounts...');
  
  const users = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@company.com',
      password: 'password123',
      role: 'main_creator'
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@company.com', 
      password: 'password123',
      role: 'respondent'
    },
    {
      name: 'Emma Williams',
      email: 'emma.williams@company.com',
      password: 'password123',
      role: 'respondent'
    },
    {
      name: 'James Rodriguez',
      email: 'james.rodriguez@company.com',
      password: 'password123',
      role: 'respondent'
    },
    {
      name: 'Lisa Thompson',
      email: 'lisa.thompson@company.com',
      password: 'password123',
      role: 'respondent'
    },
    {
      name: 'David Park',
      email: 'david.park@company.com',
      password: 'password123',
      role: 'survey_creator'
    }
  ];

  const createdUsers = [];
  
  for (const userData of users) {
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password 
    });
    
    createdUsers.push({
      ...user.toObject(),
      role: userData.role,
      plainPassword: userData.password
    });
    
    console.log(`   ✓ Created ${userData.name} (${userData.email})`);
  }
  
  return createdUsers;
}

async function createMainSurvey(creatorId) {
  console.log('Creating main survey with 10 mixed questions...');
  
  const surveyData = {
    title: 'Employee Engagement & Workplace Satisfaction Survey 2024',
    creatorId,
    csvData: [
      {
        questionId: 'Q001',
        questionText: 'Rate your overall job satisfaction on a scale of 1-10'
      },
      {
        questionId: 'Q002', 
        questionText: 'How many years have you been with the company?'
      },
      {
        questionId: 'Q003',
        questionText: 'Which department do you work in?'
      },
      {
        questionId: 'Q004',
        questionText: 'Describe what you enjoy most about your current role'
      },
      {
        questionId: 'Q005',
        questionText: 'How would you rate work-life balance? (Poor/Fair/Good/Excellent)'
      },
      {
        questionId: 'Q006',
        questionText: 'What is your preferred working arrangement? (Remote/Hybrid/Office)'
      },
      {
        questionId: 'Q007',
        questionText: 'Rate the effectiveness of your direct manager (1-10)'
      },
      {
        questionId: 'Q008',
        questionText: 'What skills would you like to develop further?'
      },
      {
        questionId: 'Q009',
        questionText: 'How likely are you to recommend this company as a great place to work? (0-10)'
      },
      {
        questionId: 'Q010',
        questionText: 'Share any additional feedback or suggestions for improvement'
      }
    ],
    originalFilename: 'employee_engagement_survey.csv'
  };

  const survey = await surveyService.createSurvey(surveyData);
  console.log(`   ✓ Created survey: "${survey.title}"`);
  
  return survey;
}

async function createSecondSurvey(creatorId) {
  console.log('Creating second survey - Professional Development...');
  
  const surveyData = {
    title: 'Professional Development & Career Growth Survey',
    creatorId,
    csvData: [
      {
        questionId: 'PD01',
        questionText: 'How satisfied are you with your career progression? (1-10)'
      },
      {
        questionId: 'PD02', 
        questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)'
      },
      {
        questionId: 'PD03',
        questionText: 'What is your primary career goal for the next 2 years?'
      },
      {
        questionId: 'PD04',
        questionText: 'Rate the quality of mentorship available (1-10)'
      },
      {
        questionId: 'PD05',
        questionText: 'Which area would you like more training in?'
      },
      {
        questionId: 'PD06',
        questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)'
      },
      {
        questionId: 'PD07',
        questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)'
      },
      {
        questionId: 'PD08',
        questionText: 'What would make you feel more valued in your role?'
      }
    ],
    originalFilename: 'professional_development_survey.csv'
  };

  const survey = await surveyService.createSurvey(surveyData);
  console.log(`   ✓ Created survey: "${survey.title}"`);
  
  return survey;
}

async function sendInvitations(survey, creator, respondents) {
  console.log('Sending invitations...');
  
  const userEmails = respondents.map(user => user.email);
  
  const result = await invitationService.sendInvitations({
    surveyId: survey.id,
    creatorId: creator._id,
    userEmails
  });
  
  console.log(`   ✓ Sent ${result.summary.successful} invitations`);
  result.results.forEach(r => {
    if (r.success) {
      console.log(`     - ${r.email}: ${r.inviteLink}`);
    }
  });
  
  return result;
}

async function createResponses(survey, respondents, invitations) {
  console.log('Creating survey responses...');
  
  // Create responses for first 4 respondents (4/5 as requested)
  const responsesToCreate = respondents.slice(0, 4);
  
  // Create dates spread across the last 7 days
  const now = new Date();
  const dates = [
    new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 
    new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),  
    new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 
    new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)  
  ];
  
  const sampleResponses = [
    // Michael Chen's responses (POSITIVE)
    {
      responses: [
        { questionId: 'Q001', questionText: 'Rate your overall job satisfaction on a scale of 1-10', answer: '8' },
        { questionId: 'Q002', questionText: 'How many years have you been with the company?', answer: '3' },
        { questionId: 'Q003', questionText: 'Which department do you work in?', answer: 'Engineering' },
        { questionId: 'Q004', questionText: 'Describe what you enjoy most about your current role', answer: 'I love solving complex technical challenges and working with a great team' },
        { questionId: 'Q005', questionText: 'How would you rate work-life balance? (Poor/Fair/Good/Excellent)', answer: 'Good' },
        { questionId: 'Q006', questionText: 'What is your preferred working arrangement? (Remote/Hybrid/Office)', answer: 'Hybrid' },
        { questionId: 'Q007', questionText: 'Rate the effectiveness of your direct manager (1-10)', answer: '9' },
        { questionId: 'Q008', questionText: 'What skills would you like to develop further?', answer: 'Machine learning and cloud architecture' },
        { questionId: 'Q009', questionText: 'How likely are you to recommend this company as a great place to work? (0-10)', answer: '8' },
        { questionId: 'Q010', questionText: 'Share any additional feedback or suggestions for improvement', answer: 'More learning and development opportunities would be great' }
      ],
      completionTime: 420, // 7 minutes
      submittedAt: dates[0]
    },
    // Emma Williams's responses (VERY POSITIVE)
    {
      responses: [
        { questionId: 'Q001', questionText: 'Rate your overall job satisfaction on a scale of 1-10', answer: '9' },
        { questionId: 'Q002', questionText: 'How many years have you been with the company?', answer: '2' },
        { questionId: 'Q003', questionText: 'Which department do you work in?', answer: 'Marketing' },
        { questionId: 'Q004', questionText: 'Describe what you enjoy most about your current role', answer: 'Creative campaigns and collaborating with diverse teams across the organization' },
        { questionId: 'Q005', questionText: 'How would you rate work-life balance? (Poor/Fair/Good/Excellent)', answer: 'Excellent' },
        { questionId: 'Q006', questionText: 'What is your preferred working arrangement? (Remote/Hybrid/Office)', answer: 'Hybrid' },
        { questionId: 'Q007', questionText: 'Rate the effectiveness of your direct manager (1-10)', answer: '10' },
        { questionId: 'Q008', questionText: 'What skills would you like to develop further?', answer: 'Data analytics and digital marketing automation' },
        { questionId: 'Q009', questionText: 'How likely are you to recommend this company as a great place to work? (0-10)', answer: '9' },
        { questionId: 'Q010', questionText: 'Share any additional feedback or suggestions for improvement', answer: 'Keep up the excellent work! Maybe add more team building activities' }
      ],
      completionTime: 380, // 6.3 minutes
      submittedAt: dates[1]
    },
    // James Rodriguez's responses (NEGATIVE/DISSATISFIED)
    {
      responses: [
        { questionId: 'Q001', questionText: 'Rate your overall job satisfaction on a scale of 1-10', answer: '4' },
        { questionId: 'Q002', questionText: 'How many years have you been with the company?', answer: '5' },
        { questionId: 'Q003', questionText: 'Which department do you work in?', answer: 'Sales' },
        { questionId: 'Q004', questionText: 'Describe what you enjoy most about your current role', answer: 'Not much honestly, the targets are unrealistic and pressure is constant' },
        { questionId: 'Q005', questionText: 'How would you rate work-life balance? (Poor/Fair/Good/Excellent)', answer: 'Poor' },
        { questionId: 'Q006', questionText: 'What is your preferred working arrangement? (Remote/Hybrid/Office)', answer: 'Office' },
        { questionId: 'Q007', questionText: 'Rate the effectiveness of your direct manager (1-10)', answer: '3' },
        { questionId: 'Q008', questionText: 'What skills would you like to develop further?', answer: 'Stress management and finding a better job' },
        { questionId: 'Q009', questionText: 'How likely are you to recommend this company as a great place to work? (0-10)', answer: '2' },
        { questionId: 'Q010', questionText: 'Share any additional feedback or suggestions for improvement', answer: 'The workload is unbearable and management is terrible. Seriously considering leaving' }
      ],
      completionTime: 180, // 3 minutes (rushed through)
      submittedAt: dates[2]
    },
    // Lisa Thompson's responses (NEUTRAL/MIXED)
    {
      responses: [
        { questionId: 'Q001', questionText: 'Rate your overall job satisfaction on a scale of 1-10', answer: '6' },
        { questionId: 'Q002', questionText: 'How many years have you been with the company?', answer: '1' },
        { questionId: 'Q003', questionText: 'Which department do you work in?', answer: 'HR' },
        { questionId: 'Q004', questionText: 'Describe what you enjoy most about your current role', answer: 'Helping employees but the bureaucracy is frustrating' },
        { questionId: 'Q005', questionText: 'How would you rate work-life balance? (Poor/Fair/Good/Excellent)', answer: 'Fair' },
        { questionId: 'Q006', questionText: 'What is your preferred working arrangement? (Remote/Hybrid/Office)', answer: 'Remote' },
        { questionId: 'Q007', questionText: 'Rate the effectiveness of your direct manager (1-10)', answer: '5' },
        { questionId: 'Q008', questionText: 'What skills would you like to develop further?', answer: 'Process improvement and change management' },
        { questionId: 'Q009', questionText: 'How likely are you to recommend this company as a great place to work? (0-10)', answer: '5' },
        { questionId: 'Q010', questionText: 'Share any additional feedback or suggestions for improvement', answer: 'Too much red tape and slow decision making. Some good people but systems need work' }
      ],
      completionTime: 450, // 7.5 minutes
      submittedAt: dates[3]
    }
  ];

  // Get invitations to match with responses
  const allInvitations = await Invitation.find({ surveyId: survey.id });
  
  for (let i = 0; i < responsesToCreate.length; i++) {
    const respondent = responsesToCreate[i];
    const responseData = sampleResponses[i];
    const invitation = allInvitations.find(inv => inv.userId.toString() === respondent._id.toString());
    
    if (invitation) {
      const response = await Response.create({
        surveyId: survey.id,
        respondentId: respondent._id,
        invitationId: invitation._id,
        responses: responseData.responses,
        completionTime: responseData.completionTime,
        submittedAt: responseData.submittedAt
      });
      
      // Mark invitation as completed with the correct date
      invitation.status = 'completed';
      invitation.completedAt = responseData.submittedAt;
      await invitation.save();
      
      console.log(`   ✓ Created response for ${respondent.name} (${responseData.submittedAt.toDateString()})`);
    }
  }
}

async function createSecondSurveyResponses(survey, respondents, surveyCreator) {
  console.log('Creating responses for second survey...');
  
  // Create responses for ALL 5 respondents (100% response rate)
  const responsesToCreate = [...respondents, surveyCreator];
  
  // Create dates spread across the last 3 days
  const now = new Date();
  const dates = [
    new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago  
    new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    new Date(now.getTime() - 12 * 60 * 60 * 1000),     // 12 hours ago
    new Date(now.getTime() - 2 * 60 * 60 * 1000)       // 2 hours ago
  ];
  
  const sampleResponses = [
    // Michael Chen's responses
    {
      responses: [
        { questionId: 'PD01', questionText: 'How satisfied are you with your career progression? (1-10)', answer: '7' },
        { questionId: 'PD02', questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)', answer: 'Somewhat' },
        { questionId: 'PD03', questionText: 'What is your primary career goal for the next 2 years?', answer: 'Move into a senior engineering role and lead a team' },
        { questionId: 'PD04', questionText: 'Rate the quality of mentorship available (1-10)', answer: '8' },
        { questionId: 'PD05', questionText: 'Which area would you like more training in?', answer: 'Leadership and team management' },
        { questionId: 'PD06', questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)', answer: 'Yes' },
        { questionId: 'PD07', questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)', answer: 'Weekly' },
        { questionId: 'PD08', questionText: 'What would make you feel more valued in your role?', answer: 'More recognition for technical contributions and clearer promotion path' }
      ],
      completionTime: 360,
      submittedAt: dates[0]
    },
    // Emma Williams's responses
    {
      responses: [
        { questionId: 'PD01', questionText: 'How satisfied are you with your career progression? (1-10)', answer: '8' },
        { questionId: 'PD02', questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)', answer: 'Yes' },
        { questionId: 'PD03', questionText: 'What is your primary career goal for the next 2 years?', answer: 'Become marketing director and expand my strategic influence' },
        { questionId: 'PD04', questionText: 'Rate the quality of mentorship available (1-10)', answer: '9' },
        { questionId: 'PD05', questionText: 'Which area would you like more training in?', answer: 'Executive leadership and business strategy' },
        { questionId: 'PD06', questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)', answer: 'Yes' },
        { questionId: 'PD07', questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)', answer: 'Weekly' },
        { questionId: 'PD08', questionText: 'What would make you feel more valued in your role?', answer: 'Already feel valued, but more budget for innovative projects would be amazing' }
      ],
      completionTime: 330,
      submittedAt: dates[1]
    },
    // James Rodriguez's responses
    {
      responses: [
        { questionId: 'PD01', questionText: 'How satisfied are you with your career progression? (1-10)', answer: '3' },
        { questionId: 'PD02', questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)', answer: 'No' },
        { questionId: 'PD03', questionText: 'What is your primary career goal for the next 2 years?', answer: 'Find a new job with better work-life balance' },
        { questionId: 'PD04', questionText: 'Rate the quality of mentorship available (1-10)', answer: '2' },
        { questionId: 'PD05', questionText: 'Which area would you like more training in?', answer: 'None here - looking externally' },
        { questionId: 'PD06', questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)', answer: 'No' },
        { questionId: 'PD07', questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)', answer: 'Rarely' },
        { questionId: 'PD08', questionText: 'What would make you feel more valued in your role?', answer: 'At this point, nothing. The damage is done and I am actively job hunting' }
      ],
      completionTime: 240,
      submittedAt: dates[2]
    },
    // Lisa Thompson's responses
    {
      responses: [
        { questionId: 'PD01', questionText: 'How satisfied are you with your career progression? (1-10)', answer: '5' },
        { questionId: 'PD02', questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)', answer: 'Somewhat' },
        { questionId: 'PD03', questionText: 'What is your primary career goal for the next 2 years?', answer: 'Develop expertise in organizational development' },
        { questionId: 'PD04', questionText: 'Rate the quality of mentorship available (1-10)', answer: '4' },
        { questionId: 'PD05', questionText: 'Which area would you like more training in?', answer: 'Change management and HR analytics' },
        { questionId: 'PD06', questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)', answer: 'Partially' },
        { questionId: 'PD07', questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)', answer: 'Monthly' },
        { questionId: 'PD08', questionText: 'What would make you feel more valued in your role?', answer: 'More autonomy to make decisions and implement changes' }
      ],
      completionTime: 420,
      submittedAt: dates[3]
    },
    // David Park's responses
    {
      responses: [
        { questionId: 'PD01', questionText: 'How satisfied are you with your career progression? (1-10)', answer: '7' },
        { questionId: 'PD02', questionText: 'Have you received adequate training opportunities this year? (Yes/No/Somewhat)', answer: 'Yes' },
        { questionId: 'PD03', questionText: 'What is your primary career goal for the next 2 years?', answer: 'Transition into a product management role' },
        { questionId: 'PD04', questionText: 'Rate the quality of mentorship available (1-10)', answer: '7' },
        { questionId: 'PD05', questionText: 'Which area would you like more training in?', answer: 'Product strategy and user research methods' },
        { questionId: 'PD06', questionText: 'Do you feel your skills are being utilized effectively? (Yes/No/Partially)', answer: 'Yes' },
        { questionId: 'PD07', questionText: 'How often do you receive constructive feedback? (Daily/Weekly/Monthly/Rarely)', answer: 'Weekly' },
        { questionId: 'PD08', questionText: 'What would make you feel more valued in your role?', answer: 'More opportunities to lead cross-functional initiatives' }
      ],
      completionTime: 390,
      submittedAt: dates[4]
    }
  ];

  // Get invitations to match with responses
  const allInvitations = await Invitation.find({ surveyId: survey.id });
  
  for (let i = 0; i < responsesToCreate.length; i++) {
    const respondent = responsesToCreate[i];
    const responseData = sampleResponses[i];
    const invitation = allInvitations.find(inv => inv.userId.toString() === respondent._id.toString());
    
    if (invitation) {
      const response = await Response.create({
        surveyId: survey.id,
        respondentId: respondent._id,
        invitationId: invitation._id,
        responses: responseData.responses,
        completionTime: responseData.completionTime,
        submittedAt: responseData.submittedAt
      });
      
      // Mark invitation as completed with the correct date
      invitation.status = 'completed';
      invitation.completedAt = responseData.submittedAt;
      await invitation.save();
      
      console.log(`   ✓ Created response for ${respondent.name} (${responseData.submittedAt.toDateString()})`);
    }
  }
}

async function createReverseSurvey(creator, mainCreator) {
  console.log('Creating reverse survey...');
  
  const reverseSurveyData = {
    title: 'Quick Team Feedback Survey',
    creatorId: creator._id,
    csvData: [
      {
        questionId: 'QR01',
        questionText: 'How would you rate team communication this quarter?'
      },
      {
        questionId: 'QR02', 
        questionText: 'What tools or resources would help improve your productivity?'
      },
      {
        questionId: 'QR03',
        questionText: 'Rate the clarity of project requirements (1-10)'
      }
    ],
    originalFilename: 'team_feedback_survey.csv'
  };

  const reverseSurvey = await surveyService.createSurvey(reverseSurveyData);
  console.log(`   ✓ Created reverse survey: "${reverseSurvey.title}"`);
  
  // Send invitation back to main creator
  const reverseInvitation = await invitationService.sendInvitations({
    surveyId: reverseSurvey.id,
    creatorId: creator._id,
    userEmails: [mainCreator.email]
  });
  
  console.log(`   ✓ Sent invitation back to ${mainCreator.name}`);
  
  return { reverseSurvey, reverseInvitation };
}

async function printSummary(users, mainSurvey, secondSurvey, reverseSurvey) {
  console.log('\n🎉 Demo data creation completed!\n');
  
  console.log('   Summary:');
  console.log(`   Users created: ${users.length}`);
  console.log(`   Main survey: "${mainSurvey.title}" (${mainSurvey.questionCount} questions)`);
  console.log(`   Second survey: "${secondSurvey.title}" (${secondSurvey.questionCount} questions)`);
  console.log(`   Reverse survey: "${reverseSurvey.title}"`);
  console.log(`   Total invitations sent: 5 + 5 + 1 reverse = 11`);
  console.log(`   Total responses created: 4 (survey 1) + 5 (survey 2) = 9`);
  
  console.log('\n👤 Test Accounts:');
  users.forEach(user => {
    console.log(`   ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.plainPassword}`);
    console.log(`   Role: ${user.role}`);
    console.log('   ---');
  });
  
}

async function seedDemoData() {
  try {
    console.log('  Starting demo data seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('  Connected to MongoDB\n');
    
    // Clear existing data
    await clearDatabase();
    
    // Create users
    const users = await createUsers();
    const mainCreator = users.find(u => u.role === 'main_creator');
    const respondents = users.filter(u => u.role === 'respondent');
    const surveyCreator = users.find(u => u.role === 'survey_creator');
    
    // Create main survey
    const mainSurvey = await createMainSurvey(mainCreator._id);
    
    // Send invitations for main survey
    await sendInvitations(mainSurvey, mainCreator, [...respondents, surveyCreator]);
    
    // Create responses for main survey (4/5)
    await createResponses(mainSurvey, respondents, []);
    
    // Create second survey from Sarah
    const secondSurvey = await createSecondSurvey(mainCreator._id);
    
    // Send invitations for second survey
    await sendInvitations(secondSurvey, mainCreator, [...respondents, surveyCreator]);
    
    // Create responses for second survey (5/5 - 100% response rate)
    await createSecondSurveyResponses(secondSurvey, respondents, surveyCreator);
    
    // Create reverse survey and invitation
    const { reverseSurvey } = await createReverseSurvey(surveyCreator, mainCreator);
    
    // Print summary
    await printSummary(users, mainSurvey, secondSurvey, reverseSurvey);
    
  } catch (error) {
    console.error(' Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };