require('dotenv').config({ path: '.env.test' });

const { spawn } = require('child_process');

async function runTests() {
  console.log('Starting E2E Tests\n');
  
  const testProcess = spawn('npx', ['mocha', 'tests/e2e/*.test.js', '--timeout', '30000'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'test' }
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\nAll tests passed!');
    } else {
      console.log('\nSome tests failed');
      process.exit(code);
    }
  });
}

// Quick health check function
async function smokeTest() {
    const request = require('supertest');
    
    try {
      console.log('Running health check...');
      
      // Import app directly (now it's exported)
      const app = require('../server');
      
      const response = await request(app).get('/api/v1/health');
      if (response.status === 200) {
        console.log('Health check passed');
        console.log('Response:', response.body);
        return true;
      } else {
        console.log('Health check failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.log('Health check failed:', error.message);
      return false;
    }
  }

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'smoke':
      smokeTest();
      break;
    case 'full':
    default:
      runTests();
      break;
  }
}

module.exports = { runTests, smokeTest };