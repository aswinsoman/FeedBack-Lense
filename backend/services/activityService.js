const Activity = require('../models/Activity');

exports.logActivity = async ({ userId, surveyId, type, message }) => {
  return Activity.create({ userId, surveyId, type, message });
};

// Paginated activity feed for a user
exports.getActivityFeed = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const activities = await Activity.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Activity.countDocuments({ userId });
  return {
    activities,
    page,
    totalPages: Math.ceil(total / limit),
    total
  };
};

exports.getSurveyActivityFeed = async (surveyId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const activities = await Activity.find({ surveyId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await Activity.countDocuments({ surveyId });
  return {
    activities,
    page,
    totalPages: Math.ceil(total / limit),
    total
  };
};