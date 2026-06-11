import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Import Context
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

// Direct imports for initial entry routes (Landing/Auth)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import PageSkeleton from './components/PageSkeleton';

// Lazy load heavy analytics and functional pages to optimize initial bundle size
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const UploadResume = React.lazy(() => import('./pages/UploadResume'));
const ATSReport = React.lazy(() => import('./pages/ATSReport'));
const JobMatch = React.lazy(() => import('./pages/JobMatch'));
const InterviewPrep = React.lazy(() => import('./pages/InterviewPrep'));
const MockInterview = React.lazy(() => import('./pages/MockInterview'));
const CareerPrediction = React.lazy(() => import('./pages/CareerPrediction'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
function AppContent() {
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Route Gates */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
          <Route path="/analysis/:id" element={<ProtectedRoute><ATSReport /></ProtectedRoute>} />
          <Route path="/job-match" element={<ProtectedRoute><JobMatch /></ProtectedRoute>} />
          <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
          <Route path="/interview-mock" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
          <Route path="/career-recommend" element={<ProtectedRoute><CareerPrediction /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Admin Protected Route Gate */}
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
