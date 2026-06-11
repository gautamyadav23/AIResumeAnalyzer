import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const UploadResume = () => {
  const [file, setFile] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  
  // Pipeline tracking states
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Uploading, 2: Parsing, 3: Scoring, 4: Complete
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      setError('Unsupported file type. Please upload PDF, DOC, or DOCX formats.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select a file to process.');
      return;
    }

    setError('');
    setUploading(true);
    setStep(1); // Uploading phase

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 2: Parsing starts shortly after
      setTimeout(() => setStep(2), 1000);

      // Step 3: Scoring starts shortly after
      setTimeout(() => setStep(3), 3000);

      const res = await API.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setStep(4); // Completed
      
      const resumeId = res.data.data.resume._id;
      // Redirect to detailed analysis report
      setTimeout(() => {
        navigate(`/analysis/${resumeId}`);
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred during resume analysis.');
      setUploading(false);
      setStep(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleTriggerDemo = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_profile', 'software_engineer');
    localStorage.setItem('demo_resume_id', 'demo');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-4xl font-extrabold font-display">Resume Scanner</h1>
        <p className="text-slate-500 max-w-sm mx-auto">Upload your resume to check parsing capability and calculate ATS alignment.</p>
      </div>

      <div className="space-y-6">
        
        {/* Upload Container Panel */}
        {!uploading ? (
          <>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`relative p-10 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center min-h-[300px] cursor-pointer transition duration-350 ${
                dragActive 
                  ? 'border-theme-primary bg-theme-primary/5' 
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-theme-card'
              }`}
            >
              {/* The hidden input file element */}
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                className="hidden"
                onChange={handleChange}
                accept=".pdf,.docx,.doc"
              />
              
              <div className="p-4 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
                <Upload className="w-8 h-8" />
              </div>

              <label 
                htmlFor="file-upload" 
                className="cursor-pointer space-y-1 block"
                onClick={(e) => e.stopPropagation()} // Prevent double triggers
              >
                <span className="font-display font-semibold text-lg hover:text-brand-500 transition">
                  {file ? file.name : 'Choose a file or drag here'}
                </span>
                <p className="text-sm text-slate-400 font-sans">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, or DOC up to 5MB'}
                </p>
              </label>

              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop click from triggering the file picker again
                    handleUploadSubmit();
                  }}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold duration-200"
                >
                  Analyze File
                </button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-theme-border/50 mt-4 text-center">
              <span className="text-xs text-slate-400 font-medium">Want to explore with pre-generated sample data?</span>
              <button
                type="button"
                onClick={handleTriggerDemo}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-theme-primary text-white hover:bg-theme-primary-hover transition duration-200"
              >
                Try Demo Resume
              </button>
            </div>
          </>
        ) : (
          /* Processing Pipeline status step list */
          <div className="p-8 rounded-3xl border border-theme-border bg-theme-card space-y-8">
            <h3 className="text-xl font-bold font-display text-center">Parsing Document File</h3>
            
            <div className="space-y-6">
              
              {/* Step 1: Uploading */}
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${step >= 1 ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>
                  {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Uploading document file</h4>
                  <p className="text-xs text-slate-500">Sending to backend uploads cache...</p>
                </div>
              </div>

              {/* Step 2: NLP Parsing */}
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${step >= 2 ? (step > 2 ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400') : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>
                  {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : step === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className={step >= 2 ? '' : 'opacity-40'}>
                  <h4 className="font-semibold text-sm">AI Entity Extraction</h4>
                  <p className="text-xs text-slate-500">FastAPI processing text blocks via spaCy...</p>
                </div>
              </div>

              {/* Step 3: ATS Score Calculation */}
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${step >= 3 ? (step > 3 ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400') : 'bg-slate-100 text-slate-400 dark:bg-slate-900'}`}>
                  {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : step === 3 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className={step >= 3 ? '' : 'opacity-40'}>
                  <h4 className="font-semibold text-sm">Calibrating ATS metrics</h4>
                  <p className="text-xs text-slate-500">Checking density, formats, and actions verbs...</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Error Notification Cards */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-red-600 dark:text-red-400 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Analysis Failed</span>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Clock icon declaration for pipeline loader fallback
const Clock = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default UploadResume;
