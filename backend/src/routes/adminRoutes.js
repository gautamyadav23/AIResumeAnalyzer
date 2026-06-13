const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Route Guard: Protect and restrict all routes to Admin role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.get('/stats', adminController.getAdminStats);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
