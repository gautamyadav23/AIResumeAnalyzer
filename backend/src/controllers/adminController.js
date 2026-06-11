const User = require('../models/User');
const Resume = require('../models/Resume');

exports.getAdminStats = async (req, res) => {
  try {
    // 1) General metrics counts
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();

    // 2) Average ATS Score aggregation
    const avgScoreResult = await Resume.aggregate([
      { $match: { status: 'analyzed' } },
      { $group: { _id: null, avgScore: { $avg: '$atsScore' } } }
    ]);
    const averageATS = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // 3) Top Skills aggregation across all resumes
    const skillStats = await Resume.aggregate([
      { $match: { 'parsedData.skills': { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$parsedData.skills' },
      { $group: { _id: '$parsedData.skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    
    const popularSkills = skillStats.map(stat => ({
      skill: stat._id,
      count: stat.count
    }));

    // 4) Uploads over time (Last 7 Days Chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const uploadsHistory = await Resume.aggregate([
      { $match: { uploadDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for charting
    const uploadsTimeline = uploadsHistory.map(item => ({
      date: item._id,
      uploads: item.count
    }));

    // 5) Top career recommendations (Mock based on common skills aggregations or standard distributions)
    const topCareers = [
      { role: 'Full Stack Developer', count: Math.ceil(totalResumes * 0.4) },
      { role: 'Frontend Developer', count: Math.ceil(totalResumes * 0.25) },
      { role: 'Backend Developer', count: Math.ceil(totalResumes * 0.2) },
      { role: 'AI Engineer', count: Math.ceil(totalResumes * 0.1) },
      { role: 'Data Analyst', count: Math.ceil(totalResumes * 0.05) }
    ].slice(0, 4);

    // 6) Activity feed: recent resume uploads
    const recentActivity = await Resume.find()
      .populate('userId', 'name email')
      .sort({ uploadDate: -1 })
      .limit(6);

    const formattedActivity = recentActivity.map(activity => ({
      id: activity._id,
      fileName: activity.fileName,
      status: activity.status,
      atsScore: activity.atsScore,
      userName: activity.userId?.name || 'Anonymous User',
      userEmail: activity.userId?.email || 'N/A',
      date: activity.uploadDate
    }));

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalResumes,
          averageATS
        },
        popularSkills,
        topCareers,
        uploadsTimeline,
        recentActivity: formattedActivity
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to aggregate admin statistics.',
      error: err.message
    });
  }
};
