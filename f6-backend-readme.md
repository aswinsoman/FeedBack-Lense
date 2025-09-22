F6 backend documentation

Features implemented - Keyword analysis API, Timeseries API which gives average completion time, Polling API to check if survey response has been updated if so when did it got updated.

End point 1 (Keyword analysis) : localhost:4000/api/v1/analytics/survey/:surveyId/analysis
Eg : localhost:4000/api/v1/analytics/survey/68c782a852a442ebb2fa9352/analysis
Sample Response : 
{
	"success": true,
	"surveyId": "68c782a852a442ebb2fa9352",
	"analysis": {
		"topKeywords": [
			{
				"term": "online",
				"stem": "onlin",
				"count": 5
			},
			{
				"term": "very",
				"stem": "veri",
				"count": 4
			},
			{
				"term": "more",
				"stem": "more",
				"count": 4
			},
			{
				"term": "good",
				"stem": "good",
				"count": 3
			},
			{
				"term": "pace",
				"stem": "pace",
				"count": 3
			},
			{
				"term": "modules",
				"stem": "modul",
				"count": 3
			},
			{
				"term": "likely",
				"stem": "like",
				"count": 3
			},
			{
				"term": "sessions",
				"stem": "session",
				"count": 3
			},
			{
				"term": "especially",
				"stem": "especi",
				"count": 2
			},
			{
				"term": "learn",
				"stem": "learn",
				"count": 2
			},
			{
				"term": "well",
				"stem": "well",
				"count": 2
			},
			{
				"term": "excellent",
				"stem": "excel",
				"count": 2
			},
			{
				"term": "expectations",
				"stem": "expect",
				"count": 2
			},
			{
				"term": "real",
				"stem": "real",
				"count": 2
			},
			{
				"term": "world",
				"stem": "world",
				"count": 2
			},
			{
				"term": "helped",
				"stem": "help",
				"count": 2
			},
			{
				"term": "part",
				"stem": "part",
				"count": 2
			},
			{
				"term": "already",
				"stem": "alreadi",
				"count": 2
			},
			{
				"term": "colleagues",
				"stem": "colleagu",
				"count": 2
			},
			{
				"term": "instructor",
				"stem": "instructor",
				"count": 2
			}
		],
		"overallSentiment": {
			"score": 0.132,
			"label": "neutral"
		},
		"details": {
			"answersCount": 30,
			"tokens": 149
		},
		"summary": "Overall sentiment: neutral (score 0.13). Top keywords: online, very, more, good, pace. Based on 30 answers."
	}
}

End point 2 (Timeseries) : http://localhost:4000/api/v1/analytics/survey/:surveyId/timeseries?interval=day&tz=Australia/Sydney&start=:date as per mongo format
Eg : http://localhost:4000/api/v1/analytics/survey/68c782a852a442ebb2fa9352/timeseries?interval=day&tz=Australia/Sydney&start=2025-09-01T00:00:00Z
Sample Response:
{
	"success": true,
	"surveyId": "68c782a852a442ebb2fa9352",
	"interval": "day",
	"timezone": "Australia/Sydney",
	"data": [
		{
			"responseCount": 6,
			"periodStart": "2025-09-15T14:00:00.000Z",
			"avgCompletionTime": 371.6666666666667
		}
	]
}

End point 3 (Poll api) : localhost:4000/api/v1/analytics/survey/:surveyId/poll
eg: localhost:4000/api/v1/analytics/survey/68c782a852a442ebb2fa9352/poll
Sample Response:
{
	"updated": true,
	"lastResponseAt": "2025-09-16T06:58:59.146Z"
}