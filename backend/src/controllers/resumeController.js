const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Resume = require('../models/Resume');
const InterviewQuestions = require('../models/InterviewQuestions');
const CareerRecommendations = require('../models/CareerRecommendations');
const ResumeInsights = require('../models/ResumeInsights');
const ResumeChats = require('../models/ResumeChats');
const JobAnalysis = require('../models/JobAnalysis');
const LearningRoadmaps = require('../models/LearningRoadmaps');

// Helper to determine the AI service URL
const getAIServiceUrl = () => {
  return process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
};

// Helper to send file to FastAPI parse service
const callFastAPIParser = async (filePath, originalName, mimeType) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), {
    filename: originalName,
    contentType: mimeType
  });

  const aiServiceUrl = getAIServiceUrl();
  const response = await axios.post(`${aiServiceUrl}/ai/parse`, formData, {
    headers: {
      ...formData.getHeaders()
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return response.data;
};

// Helper to call FastAPI scoring service
const callFastAPIScorer = async (extractedText) => {
  const aiServiceUrl = getAIServiceUrl();
  const response = await axios.post(`${aiServiceUrl}/ai/ats-score`, {
    resume_text: extractedText
  });

  return response.data;
};

// 1) Upload and Process Resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload a resume file!'
      });
    }

    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      status: 'uploaded'
    });

    let rawText = '';
    let parsedData = {};

    try {
      const parseResult = await callFastAPIParser(
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      );

      rawText = parseResult.raw_text || '';
      parsedData = parseResult.extracted_data || {};

      resume.extractedText = rawText;
      resume.parsedData = {
        name: parsedData.personal_info?.name || '',
        email: parsedData.personal_info?.email || '',
        phone: parsedData.personal_info?.phone || '',
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        certifications: parsedData.certifications || [],
        experience: parsedData.experience || []
      };
      resume.status = 'parsed';
      await resume.save();
    } catch (parseErr) {
      console.error('FastAPI Parse Error:', parseErr.message);
      let errMsg = 'Resume uploaded but AI parsing microservice failed to respond.';
      if (parseErr.response?.data?.detail) {
        errMsg = parseErr.response.data.detail;
      }
      
      // Delete invalid resume record from DB
      await Resume.findByIdAndDelete(resume._id);
      
      return res.status(parseErr.response?.status || 502).json({
        status: 'fail',
        message: errMsg,
        error: parseErr.message
      });
    }

    try {
      const scoreResult = await callFastAPIScorer(rawText);

      resume.atsScore = scoreResult.atsScore || 0;
      resume.skillsScore = scoreResult.skillsScore || 0;
      resume.educationScore = scoreResult.educationScore || 0;
      resume.experienceScore = scoreResult.experienceScore || 0;
      resume.formattingScore = scoreResult.formattingScore || 0;
      resume.status = 'analyzed';
      
      await resume.save();
    } catch (scoreErr) {
      console.error('FastAPI Scoring Error:', scoreErr.message);
      return res.status(201).json({
        status: 'success',
        message: 'Resume parsed successfully, but scoring analysis failed.',
        data: { resume }
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Resume uploaded, parsed, and analyzed successfully!',
      data: { resume }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during resume processing.',
      error: err.message
    });
  }
};

// 2) Get user's resume upload history
exports.getResumeHistory = async (req, res) => {
  try {
    const history = await Resume.find({ userId: req.user.id })
      .select('-extractedText')
      .sort({ uploadDate: -1 });

    res.status(200).json({
      status: 'success',
      results: history.length,
      data: { history }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// 3) Get details of a single resume by ID
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resume not found or access denied.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { resume }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// 4) Compare resume to job description (Deterministic search match)
exports.matchResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a job description to match!'
      });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        status: 'fail',
        message: 'Resume not found or access denied.'
      });
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/job-match`, {
      resume_text: resume.extractedText || 'No parsed text available',
      job_description: jobDescription
    });

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to run semantic job matching.',
      error: err.message
    });
  }
};

// 5) Retrieve generated interview questions (Cached)
exports.getInterviewQuestions = async (req, res) => {
  try {
    const { company, regenerate } = req.body;
    const resumeId = req.params.id;
    const selectedCompany = company || 'General';

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Cache check
    if (!regenerate) {
      const cached = await InterviewQuestions.findOne({ resumeId, company: selectedCompany });
      if (cached) {
        return res.status(200).json({
          status: 'success',
          data: cached.questions
        });
      }
    }

    // Call FastAPI
    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/interview-questions`, {
      skills: resume.parsedData?.skills || [],
      projects: resume.parsedData?.projects || [],
      experience: resume.parsedData?.experience || [],
      education: resume.parsedData?.education || [],
      company: selectedCompany
    }, { timeout: 60000 });

    // Save in Cache
    await InterviewQuestions.findOneAndUpdate(
      { resumeId, company: selectedCompany },
      { questions: response.data },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Interview Questions Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate interview questions.',
      error: err.message
    });
  }
};

// 6) Retrieve career prediction roles (Cached)
exports.getCareerPrediction = async (req, res) => {
  try {
    const { regenerate } = req.body;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Cache check
    if (!regenerate) {
      const cached = await CareerRecommendations.findOne({ resumeId });
      if (cached) {
        return res.status(200).json({
          status: 'success',
          data: { recommended_roles: cached.roles }
        });
      }
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/career-prediction`, {
      skills: resume.parsedData?.skills || [],
      experience: resume.parsedData?.experience || [],
      education: resume.parsedData?.education || []
    }, { timeout: 60000 });

    // Save in Cache
    await CareerRecommendations.findOneAndUpdate(
      { resumeId },
      { roles: response.data.recommended_roles },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Career Prediction Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to compute career forecasts.',
      error: err.message
    });
  }
};

// 7) Retrieve Resume Insights & Recruiter Verdict (Cached)
exports.getResumeInsights = async (req, res) => {
  try {
    const { regenerate } = req.query;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Cache Check
    if (regenerate !== 'true') {
      const cached = await ResumeInsights.findOne({ resumeId });
      if (cached) {
        return res.status(200).json({
          status: 'success',
          data: cached.insights
        });
      }
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/resume-insights`, {
      name: resume.parsedData?.name || 'Candidate',
      resume_text: resume.extractedText || '',
      skills: resume.parsedData?.skills || [],
      experience: resume.parsedData?.experience || [],
      projects: resume.parsedData?.projects || [],
      education: resume.parsedData?.education || [],
      ats_score: resume.atsScore || 0
    }, { timeout: 60000 });

    // Cache in DB
    await ResumeInsights.findOneAndUpdate(
      { resumeId },
      { insights: response.data },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Resume Insights Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve resume insights.',
      error: err.message
    });
  }
};

// 8) Resume Chat Assistant
exports.chatWithResume = async (req, res) => {
  try {
    const { message } = req.body;
    const resumeId = req.params.id;

    if (!message) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a message.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Fetch conversation history from cache
    let chatSession = await ResumeChats.findOne({ resumeId });
    if (!chatSession) {
      chatSession = await ResumeChats.create({ resumeId, messages: [] });
    }

    // Prepare history payload for FastAPI (limit to last 6 messages)
    const historyPayload = chatSession.messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/chat-resume`, {
      resume_text: resume.extractedText || '',
      history: historyPayload,
      message,
      ats_score: resume.atsScore || 0,
      skills: resume.parsedData?.skills || [],
      experience: resume.parsedData?.experience || [],
      projects: resume.parsedData?.projects || []
    }, { timeout: 60000 });

    // Append to conversation history in DB
    chatSession.messages.push({ role: 'user', content: message });
    chatSession.messages.push({ role: 'assistant', content: response.data.response });
    await chatSession.save();

    res.status(200).json({
      status: 'success',
      data: {
        response: response.data.response,
        messages: chatSession.messages
      }
    });
  } catch (err) {
    console.error('Resume Chat Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete chat assistant query.',
      error: err.message
    });
  }
};

// 9) Detailed Job Description analysis (Cached)
exports.analyzeJobDescription = async (req, res) => {
  const resumeId = req.params.id;
  const { jobDescription, regenerate } = req.body;
  
  console.log(`[Express] Entering analyzeJobDescription for resumeId: ${resumeId}, regenerate: ${regenerate}`);
  
  try {
    if (!jobDescription) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a job description.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Simple hash for cache key matching
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(jobDescription.trim()).digest('hex');

    if (!regenerate) {
      const cached = await JobAnalysis.findOne({ resumeId, jobDescriptionHash: hash });
      if (cached) {
        console.log('[Express] Found cached Job Description analysis in MongoDB.');
        return res.status(200).json({
          status: 'success',
          data: cached.analysis
        });
      }
    }

    const aiServiceUrl = getAIServiceUrl();
    const endpointUrl = `${aiServiceUrl}/ai/job-analysis`;
    const payload = {
      resume_text: resume.extractedText || '',
      job_description: jobDescription,
      skills: resume.parsedData?.skills || []
    };

    console.log(`[Express] Querying FastAPI endpoint: ${endpointUrl}`);
    console.log(`[Express] Request payload skills count: ${payload.skills.length}, text length: ${payload.resume_text.length}`);

    const response = await axios.post(endpointUrl, payload, { timeout: 60000 });

    console.log(`[Express] FastAPI responded with status: ${response.status}`);

    // Save in Cache
    await JobAnalysis.findOneAndUpdate(
      { resumeId, jobDescriptionHash: hash },
      { analysis: response.data },
      { upsert: true, new: true }
    );

    console.log('[Express] Saved Job Description analysis to cache successfully.');

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('[Express] Job Description Analysis Error details:');
    if (err.response) {
      console.error(`- Response Status: ${err.response.status}`);
      console.error('- Response Data:', err.response.data);
    } else {
      console.error(`- Message: ${err.message}`);
      console.error('- Stack Trace:', err.stack);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze job description.',
      error: err.message
    });
  }
};

// 10) Missing skill roadmap (Cached)
exports.getLearningRoadmap = async (req, res) => {
  try {
    const { skill, regenerate } = req.query;
    const resumeId = req.params.id;

    if (!skill) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a skill name.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    if (regenerate !== 'true') {
      const cached = await LearningRoadmaps.findOne({ resumeId, skill });
      if (cached) {
        return res.status(200).json({
          status: 'success',
          data: cached.roadmap
        });
      }
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/learning-roadmap`, {
      skill
    }, { timeout: 60000 });

    // Save in Cache
    await LearningRoadmaps.findOneAndUpdate(
      { resumeId, skill },
      { roadmap: response.data },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Learning Roadmap Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate learning roadmap.',
      error: err.message
    });
  }
};

// 11) AI Resume Rewriter
exports.rewriteResume = async (req, res) => {
  try {
    const { section, content } = req.body;
    const resumeId = req.params.id;

    if (!section || !content) {
      return res.status(400).json({ status: 'fail', message: 'Please provide section and content.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/rewrite-resume`, {
      section,
      content,
      skills: resume.parsedData?.skills || []
    }, { timeout: 60000 });

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Resume Rewriter Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to rewrite resume content.',
      error: err.message
    });
  }
};

// 12) AI Project Explainer
exports.explainProject = async (req, res) => {
  try {
    const { projectName } = req.query;
    const resumeId = req.params.id;

    if (!projectName) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a projectName.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    const aiServiceUrl = getAIServiceUrl();
    const response = await axios.post(`${aiServiceUrl}/ai/project-explainer`, {
      project_name: projectName,
      skills: resume.parsedData?.skills || []
    }, { timeout: 60000 });

    res.status(200).json({
      status: 'success',
      data: response.data
    });
  } catch (err) {
    console.error('Project Explainer Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to compile project explanation.',
      error: err.message
    });
  }
};

// 13) Version Comparison between uploads
exports.getVersionComparison = async (req, res) => {
  try {
    const resumeId = req.params.id;

    const currentResume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!currentResume) {
      return res.status(404).json({ status: 'fail', message: 'Resume not found.' });
    }

    // Get all analyzed resumes for this user in chronological order
    const history = await Resume.find({ userId: req.user.id, status: 'analyzed' })
      .sort({ uploadDate: 1 }); // oldest first

    const currentIdx = history.findIndex(r => r._id.toString() === resumeId);
    
    if (currentIdx <= 0) {
      // No previous version to compare to
      return res.status(200).json({
        status: 'success',
        data: {
          hasComparison: false,
          message: 'This is the first analyzed resume version. Upload another one to see comparisons!'
        }
      });
    }

    const previousResume = history[currentIdx - 1];

    // Compute diffs
    const scoreDiff = currentResume.atsScore - previousResume.atsScore;
    const currentSkills = currentResume.parsedData?.skills || [];
    const previousSkills = previousResume.parsedData?.skills || [];
    
    const addedSkills = currentSkills.filter(s => !previousSkills.includes(s));
    const removedSkills = previousSkills.filter(s => !currentSkills.includes(s));

    res.status(200).json({
      status: 'success',
      data: {
        hasComparison: true,
        currentVersion: {
          id: currentResume._id,
          fileName: currentResume.fileName,
          atsScore: currentResume.atsScore,
          uploadDate: currentResume.uploadDate
        },
        previousVersion: {
          id: previousResume._id,
          fileName: previousResume.fileName,
          atsScore: previousResume.atsScore,
          uploadDate: previousResume.uploadDate
        },
        comparison: {
          scoreDifference: scoreDiff,
          addedSkills,
          removedSkills
        }
      }
    });
  } catch (err) {
    console.error('Version Comparison Error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to compile version comparison reports.',
      error: err.message
    });
  }
};
