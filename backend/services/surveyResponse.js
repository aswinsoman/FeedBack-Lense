//Survey Response Service
//Author: Aswin

const Response = require('../models/Response');

// Function to save a survey response
async function saveSurveyResponse(data) {
  const response = new Response(data);
  try {
    await response.save();
    return response;
  } catch (error) {
    throw new Error('Error saving survey response: ' + error.message);
  }
}

module.exports = {
  saveSurveyResponse
};