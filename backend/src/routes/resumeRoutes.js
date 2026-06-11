const express = require('express');
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

// Protect all routes under this router
router.use(authMiddleware.protect);

router.post('/upload', uploadMiddleware.single('file'), resumeController.uploadResume);
router.get('/history', resumeController.getResumeHistory);
router.post('/:id/match', resumeController.matchResume);
router.post('/:id/prep', resumeController.getInterviewQuestions);
router.post('/:id/careers', resumeController.getCareerPrediction);

// New AI endpoints
router.get('/:id/insights', resumeController.getResumeInsights);
router.post('/:id/chat', resumeController.chatWithResume);
router.post('/:id/job-analysis', resumeController.analyzeJobDescription);
router.get('/:id/learning-roadmaps', resumeController.getLearningRoadmap);
router.post('/:id/rewrite', resumeController.rewriteResume);
router.get('/:id/project-explainer', resumeController.explainProject);
router.get('/:id/version-compare', resumeController.getVersionComparison);

router.get('/:id', resumeController.getResumeById);

module.exports = router;
