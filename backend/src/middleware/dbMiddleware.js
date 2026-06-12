const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
  // If already connected, proceed
  if (mongoose.connection.readyState >= 1) {
    return next();
  }

  const DB = process.env.MONGO_URI;
  if (!DB) {
    return res.status(500).json({
      status: 'error',
      message: 'MONGO_URI environment variable is not defined.'
    });
  }

  try {
    console.log('[DB Middleware] Connecting to database...');
    // Connect and await
    await mongoose.connect(DB, {
      serverSelectionTimeoutMS: 5000 // Timeout connection attempts after 5 seconds
    });
    
    // Set bufferCommands to false to prevent future queries from hanging if connection drops
    mongoose.set('bufferCommands', false);
    
    console.log('[DB Middleware] Connection successful.');
    next();
  } catch (err) {
    console.error('[DB Middleware] Connection failed:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed. If you are accessing this from the live Vercel site, please make sure your MongoDB Atlas cluster whitelists "0.0.0.0/0" (Allow Access From Anywhere).',
      error: err.message
    });
  }
};
