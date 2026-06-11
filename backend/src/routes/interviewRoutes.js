const express = require('express');
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes under this namespace
router.use(authMiddleware.protect);

router.post('/evaluate', interviewController.evaluateAnswer);
router.post('/save', interviewController.saveInterviewHistory);
router.get('/history', interviewController.getInterviewHistory);
router.get('/analytics', interviewController.getInterviewAnalytics);

module.exports = router;
