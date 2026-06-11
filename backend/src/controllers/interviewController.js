const axios = require('axios');
const InterviewHistory = require('../models/InterviewHistory');

// Helper to determine the AI service URL
const getAIServiceUrl = () => {
  return process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
};

// 1) Evaluate single question response via FastAPI
exports.evaluateAnswer = async (req, res) => {
  try {
    const { question, user_answer, expected_answer, difficulty } = req.body;

    if (!question || !user_answer || !expected_answer) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide question, user_answer, and expected_answer!'
      });
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/evaluate-answer`, {
      question,
      user_answer,
      expected_answer,
      difficulty: difficulty || 'Medium'
    });

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('FastAPI Evaluation Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to evaluate answer via AI Service.',
      error: err.message
    });
  }
};

// 2) Save completed mock interview session
exports.saveInterviewHistory = async (req, res) => {
  try {
    const {
      company,
      interviewType,
      score,
      categoryScores,
      weakAreas,
      strengths,
      recommendations
    } = req.body;

    if (!company || score === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide company and score!'
      });
    }

    const history = await InterviewHistory.create({
      userId: req.user.id,
      company,
      interviewType: interviewType || 'text',
      score,
      categoryScores: categoryScores || { technical: 0, projects: 0, hr: 0, communication: 0 },
      weakAreas: weakAreas || [],
      strengths: strengths || [],
      recommendations: recommendations || []
    });

    res.status(201).json({
      status: 'success',
      data: {
        history
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to save interview history.',
      error: err.message
    });
  }
};

// 3) Get history of mock interviews for active user
exports.getInterviewHistory = async (req, res) => {
  try {
    const history = await InterviewHistory.find({ userId: req.user.id })
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      results: history.length,
      data: {
        history
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve interview history.',
      error: err.message
    });
  }
};

// 4) Fetch aggregated analytics dashboards
exports.getInterviewAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await InterviewHistory.find({ userId }).sort({ date: 1 });

    if (history.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          totalInterviews: 0,
          averageScore: 0,
          bestScore: 0,
          weakestArea: 'N/A',
          strongestArea: 'N/A',
          scoreHistory: [],
          categoryPerformance: [],
          companyPerformance: [],
          weeklyProgress: []
        }
      });
    }

    // Calculations
    const totalInterviews = history.length;
    let totalScore = 0;
    let bestScore = 0;

    const catSums = { technical: 0, projects: 0, hr: 0, communication: 0 };
    const compScores = {}; // { 'Google': { sum: 0, count: 0 } }
    const weeklyData = {}; // { 'Week-X': { sum: 0, count: 0 } }

    history.forEach(session => {
      totalScore += session.score;
      if (session.score > bestScore) {
        bestScore = session.score;
      }

      // Categories
      catSums.technical += session.categoryScores?.technical || 0;
      catSums.projects += session.categoryScores?.projects || 0;
      catSums.hr += session.categoryScores?.hr || 0;
      catSums.communication += session.categoryScores?.communication || 0;

      // Companies
      const comp = session.company;
      if (!compScores[comp]) compScores[comp] = { sum: 0, count: 0 };
      compScores[comp].sum += session.score;
      compScores[comp].count += 1;

      // Weekly (simple grouping by locale date string or week number)
      const d = new Date(session.date);
      const weekKey = `W${Math.ceil(d.getDate() / 7)} - ${d.toLocaleString('default', { month: 'short' })}`;
      if (!weeklyData[weekKey]) weeklyData[weekKey] = { sum: 0, count: 0 };
      weeklyData[weekKey].sum += session.score;
      weeklyData[weekKey].count += 1;
    });

    const averageScore = Number((totalScore / totalInterviews).toFixed(1));

    // Calculate Category Averages
    const categoryPerformance = [
      { category: 'Technical', score: Number((catSums.technical / totalInterviews).toFixed(1)) },
      { category: 'Projects', score: Number((catSums.projects / totalInterviews).toFixed(1)) },
      { category: 'HR', score: Number((catSums.hr / totalInterviews).toFixed(1)) },
      { category: 'Communication', score: Number((catSums.communication / totalInterviews).toFixed(1)) }
    ];

    // Determine Strongest and Weakest Areas
    let strongestArea = categoryPerformance[0].category;
    let weakestArea = categoryPerformance[0].category;
    let maxCatScore = categoryPerformance[0].score;
    let minCatScore = categoryPerformance[0].score;

    categoryPerformance.forEach(cat => {
      if (cat.score > maxCatScore) {
        maxCatScore = cat.score;
        strongestArea = cat.category;
      }
      if (cat.score < minCatScore) {
        minCatScore = cat.score;
        weakestArea = cat.category;
      }
    });

    // Score History Trend Array
    const scoreHistory = history.map((session, idx) => ({
      index: idx + 1,
      date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: session.score,
      company: session.company
    }));

    // Company Performance Array
    const companyPerformance = Object.keys(compScores).map(name => ({
      company: name,
      score: Number((compScores[name].sum / compScores[name].count).toFixed(1))
    }));

    // Weekly Progress Trend Array
    const weeklyProgress = Object.keys(weeklyData).map(week => ({
      week,
      score: Number((weeklyData[week].sum / weeklyData[week].count).toFixed(1))
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalInterviews,
        averageScore,
        bestScore,
        weakestArea,
        strongestArea,
        scoreHistory,
        categoryPerformance,
        companyPerformance,
        weeklyProgress
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to compile interview analytics.',
      error: err.message
    });
  }
};
