API endpoint to submit survey response => Post 

Sample POST request body : 

{
  "surveyId": "64c1f5d1f72a9e001f4d1234",
  "respondentId": "64c1f5d1f72a9e001f4d5678",
  "invitationId": "64c1f5d1f72a9e001f4d9876",
  "responses": [
    {
      "questionId": "Q1",
      "questionText": "How satisfied are you with our product?",
      "answer": "Very satisfied",
      "answeredAt": "2025-09-11T09:15:00.000Z"
    },
    {
      "questionId": "Q2",
      "questionText": "What improvements would you like to see?",
      "answer": "More customization options",
      "answeredAt": "2025-09-11T09:17:00.000Z"
    }
  ],
  "completionTime": 120
}

sample response : 

{
	"response": {
		"surveyId": "64c1f5d1f72a9e001f4d1234",
		"respondentId": "64c1f5d1f72a9e001f4d5678",
		"invitationId": "64c1f5d1f72a9e001f4d9876",
		"responses": [
			{
				"questionId": "Q1",
				"questionText": "How satisfied are you with our product?",
				"answer": "Very satisfied",
				"answeredAt": "2025-09-11T09:15:00.000Z",
				"_id": "68c213dd9647dd4b85650198"
			},
			{
				"questionId": "Q2",
				"questionText": "What improvements would you like to see?",
				"answer": "More customization options",
				"answeredAt": "2025-09-11T09:17:00.000Z",
				"_id": "68c213dd9647dd4b85650199"
			}
		],
		"completionTime": 120,
		"_id": "68c213dd9647dd4b85650197",
		"submittedAt": "2025-09-11T00:12:13.913Z",
		"__v": 0
	}
}