import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { 
  AlertCircle, Compass, CheckCircle2, XCircle, 
  RefreshCw, Sparkles, AlertTriangle, ArrowRight, BookOpen, Clock, Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import ATSGauge from '../components/ui/ATSGauge';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { getDemoResume, getDemoJobMatch } from '../services/demoData';

const JobMatch = () => {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState(preSelectedId);
  const [jobDescription, setJobDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Fetch resume list for dropdown
  useEffect(() => {
    const fetchHistory = async () => {
      const isDemo = localStorage.getItem('demo_mode') === 'true';
      try {
        let list = [];
        if (!isDemo) {
          const res = await API.get('/resume/history');
          list = res.data.data.history || [];
        }
        const analyzed = list.filter(r => r.status === 'analyzed');
        if (isDemo) {
          analyzed.unshift(getDemoResume());
        }
        setResumes(analyzed);
        if (analyzed.length > 0) {
          setSelectedId(analyzed[0]._id);
        }
      } catch (err) {
        console.error(err);
        if (isDemo) {
          setResumes([getDemoResume()]);
          setSelectedId('demo');
        } else {
          setError('Failed to fetch resume catalog.');
        }
      } finally {
        setFetchingList(false);
      }
    };

    fetchHistory();
  }, []);

  const handleMatchSubmit = async (e, regenerate = false) => {
    if (e) e.preventDefault();
    
    if (!selectedId || !jobDescription.trim()) {
      setError('Please select a resume and paste a job description.');
      return;
    }

    setError('');
    setLoading(true);
    setResults(null);

    if (selectedId === 'demo') {
      setTimeout(() => {
        setResults(getDemoJobMatch());
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await API.post(`/resume/${selectedId}/job-analysis`, {
        jobDescription: jobDescription,
        regenerate: regenerate
      });

      setResults(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze resume and job description.');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityVariant = (prob) => {
    if (prob === 'High') return 'success';
    if (prob === 'Medium') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-8 py-2 text-theme-text">
      
      {/* Header */}
      <div className="border-b border-theme-border pb-6 select-none">
        <h1 className="text-3xl md:text-4xl font-extrabold font-display">AI Job Description Analyzer</h1>
        <p className="text-sm text-theme-muted mt-1.5 font-medium">Leverage Gemini intelligence to evaluate your resume against a target job role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Input form */}
        <div className="lg:col-span-1">
          <Card 
            header={<span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Analysis Settings</span>}
            className="h-fit sticky top-24"
          >
            <form onSubmit={(e) => handleMatchSubmit(e, false)} className="space-y-6">
              
              {/* Resume Dropdown */}
              <div className="space-y-2">
                <label htmlFor="resume-select" className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                  Select Resume Version
                </label>
                {fetchingList ? (
                  <div className="flex items-center gap-2 text-theme-muted text-xs py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-theme-primary" />
                    <span>Loading catalogs...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-xs text-theme-warning space-y-2 p-3 bg-theme-warning/5 rounded-xl border border-theme-warning/25">
                    <p>No analyzed resumes found.</p>
                    <Link to="/upload" className="text-theme-primary underline block font-semibold hover:text-theme-primary-hover">
                      Upload first
                    </Link>
                  </div>
                ) : (
                  <select
                    id="resume-select"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-theme-border bg-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-theme-primary/50 text-theme-text"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {resumes.map(r => (
                      <option key={r._id} value={r._id}>{r.fileName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Job description Box */}
              <div className="space-y-2">
                <label htmlFor="job-description" className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                  Paste Job Description
                </label>
                <textarea
                  id="job-description"
                  rows={8}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-theme-border bg-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-theme-primary/50 text-theme-text font-medium leading-relaxed"
                  placeholder="Paste the target job requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || resumes.length === 0}
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Analyze Match
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Output reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-theme-danger/10 border border-theme-danger/20 text-theme-danger flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!results && !loading && (
            <EmptyState
              title="Job Matching Diagnostic Workspace"
              description="Upload a job description to run a semantic check against your baseline resume. We will check keyword matches, missing criteria, and estimated callback rates."
              icon={<Compass className="w-8 h-8 text-theme-primary" />}
            />
          )}

          {loading && (
            <div className="space-y-6">
              <Card className="flex flex-col items-center justify-center p-12 text-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-theme-primary" />
                <div>
                  <h3 className="text-base font-bold font-display text-theme-text">Analyzing Requirements...</h3>
                  <p className="text-xs text-theme-muted mt-1 max-w-sm">Gemini is checking role compatibility, matching skill overlaps, and estimating callback probabilities...</p>
                </div>
              </Card>
              <CardSkeleton />
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Row: Left Match Score vs Right AI explanation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left: Score Gauge */}
                <Card 
                  className="md:col-span-1 flex flex-col items-center justify-center text-center py-6"
                  header={<span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Compatibility Fit</span>}
                >
                  <ATSGauge score={results.match_percentage} size="md" showLabel={false} />
                  
                  {/* Force cache refresh */}
                  <Button
                    onClick={() => handleMatchSubmit(null, true)}
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="mt-6"
                  >
                    Clear Cache
                  </Button>
                </Card>

                {/* Right: AI Explanation */}
                <Card 
                  className="md:col-span-2 flex flex-col justify-between"
                  header={
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-theme-primary" /> AI Match Explanation</span>
                      <Badge variant={getProbabilityVariant(results.interview_probability)}>
                        {results.interview_probability} Callback
                      </Badge>
                    </div>
                  }
                >
                  <p className="text-xs text-theme-text leading-relaxed italic border-l-2 border-theme-primary/45 pl-3 py-1 font-medium bg-theme-primary/5 rounded-r-lg">
                    "{results.explanation}"
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-theme-border/50 flex justify-between items-center text-[10px] text-theme-muted font-bold uppercase tracking-wider">
                    <span>Interview Call Odds</span>
                    <span className={results.interview_probability === 'High' ? 'text-theme-success' : 'text-theme-warning'}>{results.interview_probability} Chance</span>
                  </div>
                </Card>

              </div>

              {/* Bottom: Skills & Weaknesses breakdown */}
              <div className="space-y-6">
                
                {/* Weaknesses Card */}
                {results.resume_weaknesses && results.resume_weaknesses.length > 0 && (
                  <Card header={<span className="text-xs font-bold text-theme-warning uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-theme-warning" /> Skill Gap & Resume Weaknesses</span>}>
                    <ul className="list-disc list-inside text-xs text-theme-text space-y-1.5 font-medium leading-relaxed">
                      {results.resume_weaknesses.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Skills split grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Matched Skills */}
                  <Card header={<span className="text-xs font-bold text-theme-success uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-theme-success" /> Matched Skills ({results.matching_skills?.length || 0})</span>}>
                    <div className="flex flex-wrap gap-1.5">
                      {results.matching_skills && results.matching_skills.length > 0 ? (
                        results.matching_skills.map((skill, idx) => (
                          <Badge key={idx} variant="success">{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-theme-muted text-xs italic">No matched skills detected.</span>
                      )}
                    </div>
                  </Card>

                  {/* Missing Skills */}
                  <Card header={<span className="text-xs font-bold text-theme-danger uppercase tracking-wider flex items-center gap-1.5"><XCircle className="w-4 h-4 text-theme-danger" /> Missing Skills ({results.missing_skills?.length || 0})</span>}>
                    <div className="flex flex-wrap gap-1.5">
                      {results.missing_skills && results.missing_skills.length > 0 ? (
                        results.missing_skills.map((skill, idx) => (
                          <Badge key={idx} variant="danger">{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-theme-success text-xs italic font-bold">Perfect match! No missing skills.</span>
                      )}
                    </div>
                  </Card>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default JobMatch;
