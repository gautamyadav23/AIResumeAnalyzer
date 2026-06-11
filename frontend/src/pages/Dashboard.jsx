import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  FileText, Upload, Brain, Briefcase, Award, ArrowUpRight, 
  Calendar, CheckCircle, Clock, FileWarning, Sparkles, AlertCircle, ArrowUp, Activity
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import ATSGauge from '../components/ui/ATSGauge';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { getDemoResume, getDemoAnalytics } from '../services/demoData';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const isDemo = localStorage.getItem('demo_mode') === 'true';
      if (isDemo) {
        setTimeout(() => {
          const activeResume = getDemoResume();
          const activeAnalytics = getDemoAnalytics();
          setHistory([activeResume]);
          setInterviews([
            { _id: 'demo-int-1', score: (activeAnalytics.topic_mastery[0]?.value / 10) || 8.4, date: new Date().toISOString() },
            { _id: 'demo-int-2', score: (activeAnalytics.topic_mastery[1]?.value / 10) || 8.0, date: new Date().toISOString() }
          ]);
          setLoading(false);
        }, 300);
        return;
      }
      try {
        const [resumeRes, interviewRes] = await Promise.all([
          API.get('/resume/history'),
          API.get('/interview/history')
        ]);
        setHistory(resumeRes.data.data.history || []);
        setInterviews(interviewRes.data.data.history || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
        setError('Could not load career intelligence metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute metrics based on historical uploads
  const totalResumes = history.length;
  const analyzedResumes = history.filter(r => r.status === 'analyzed');
  
  const latestResume = analyzedResumes.length > 0 ? analyzedResumes[0] : null;
  const latestScore = latestResume ? latestResume.atsScore : 0;
  const skillsScore = latestResume ? (latestResume.skillsScore || 80) : 0;
  
  // Best Match score or highest in history
  const maxScore = analyzedResumes.length > 0 
    ? Math.max(...analyzedResumes.map(r => r.atsScore)) 
    : 0;

  // Average Mock Interview Score out of 100
  const avgMockScoreRaw = interviews.length > 0
    ? interviews.reduce((acc, curr) => acc + curr.score, 0) / interviews.length
    : 7.0; // default to 7.0 (70%) if no interviews
  const interviewReadiness = Math.round(avgMockScoreRaw * 10); // convert 10-point scale to percentage

  // Hiring Readiness Score: Weighted average of ATS, Interview, and Skills
  const hiringReadinessScore = latestResume
    ? Math.round(latestScore * 0.4 + interviewReadiness * 0.4 + skillsScore * 0.2)
    : 0;

  // Placement Probability: Estimate based on ATS and interview performance
  const placementProbability = latestResume
    ? Math.min(98, Math.max(25, Math.round(latestScore * 0.5 + interviewReadiness * 0.5)))
    : 0;

  // 1) Skill Gap Radar Chart Data: Section scores breakdown
  const radarData = latestResume ? [
    { subject: 'Skills', score: latestResume.skillsScore || 80 },
    { subject: 'Education', score: latestResume.educationScore || 85 },
    { subject: 'Experience', score: latestResume.experienceScore || 85 },
    { subject: 'Formatting', score: latestResume.formattingScore || 90 },
  ] : [
    { subject: 'Skills', score: 0 },
    { subject: 'Education', score: 0 },
    { subject: 'Experience', score: 0 },
    { subject: 'Formatting', score: 0 },
  ];

  const isDemoMode = localStorage.getItem('demo_mode') === 'true';
  const trendData = isDemoMode
    ? getDemoAnalytics().readiness_trend
    : history.length > 0
      ? [...history]
          .filter(r => r.status === 'analyzed')
          .reverse() // chronologically ordered
          .map((r, idx) => ({
            name: `Scan #${idx + 1}`,
            Score: r.atsScore
          }))
      : [
          { name: 'Scan #1', Score: 65 },
          { name: 'Scan #2', Score: 78 },
          { name: 'Scan #3', Score: 85 }
        ];

  const handleEmptyStateSuggestion = (promptText) => {
    // Navigate to upload or trigger quickcopilot prompt simulation
    if (promptText.includes('Upload')) {
      navigate('/upload');
    } else if (promptText.includes('questions')) {
      navigate('/interview-prep');
    } else {
      // open copilot chat panel simulated (in Layout)
      const copilotBtn = document.querySelector('button[aria-label="Toggle AI Career Copilot drawer"]');
      if (copilotBtn) {
        copilotBtn.click();
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-theme-border pb-6">
          <div className="space-y-2 w-1/3">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ChartSkeleton className="lg:col-span-2" />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 text-theme-text">
      
      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-theme-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight flex items-center gap-2">
            Welcome Back, <span className="text-theme-primary">{user?.name}</span> 👋
          </h1>
          <p className="text-sm text-theme-muted mt-1.5 flex items-center gap-1.5 font-medium">
            <Activity className="w-4 h-4 text-theme-primary shrink-0" />
            {latestResume 
              ? `Your latest ATS score is ${latestScore}%. Highlighted key focus: Backend Development.`
              : "Let's kickstart your placement journey. Upload a resume to get custom AI insights."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <button
              onClick={() => {
                localStorage.removeItem('demo_mode');
                localStorage.removeItem('demo_profile');
                window.location.reload();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-warning/40 text-theme-warning bg-theme-warning/10 hover:bg-theme-warning/20 transition"
            >
              ✕ Exit Demo Mode
            </button>
          )}
          <Button
            onClick={() => navigate('/upload')}
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
          >
            Upload New Resume
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-theme-danger/10 border border-theme-danger/20 text-theme-danger flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {totalResumes === 0 ? (
        <div className="py-12 flex flex-col items-center">
          <EmptyState
            title="Your Copilot Workspace is Ready"
            description="Create your profile baseline. Upload a resume to scan formatting checks, map skill gaps, generate mock interviews, and predict career paths."
            icon={<FileText className="w-8 h-8" />}
            actionLabel="Upload Resume"
            onAction={() => navigate('/upload')}
            suggestions={[
              "Upload my first resume",
              "See ATS insights",
              "Generate interview questions",
              "Explore career paths"
            ]}
            onSuggestionClick={handleEmptyStateSuggestion}
          />
          <div className="mt-6">
            <Button
              onClick={() => {
                localStorage.setItem("demo_mode", "true");
                localStorage.setItem("demo_profile", "software_engineer");
                window.location.reload();
              }}
              variant="outline"
              className="px-6 py-2.5 rounded-xl border-theme-primary/30 text-theme-primary hover:bg-theme-primary/10 transition duration-300"
            >
              Try Demo Resume
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Career Intelligence KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1: Career Readiness */}
            <Card className="flex flex-col items-center justify-center text-center p-6">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-4">Career Readiness</span>
              <ATSGauge score={latestScore} size="sm" showLabel={true} />
              <span className="text-[10px] text-theme-muted mt-3">ATS alignment rate</span>
            </Card>

            {/* KPI 2: Interview Readiness */}
            <Card className="flex flex-col items-center justify-center text-center p-6">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-4">Interview Readiness</span>
              <ATSGauge score={interviewReadiness} size="sm" showLabel={true} />
              <span className="text-[10px] text-theme-muted mt-3">Q&A competency index</span>
            </Card>

            {/* KPI 3: Hiring Probability */}
            <Card className="flex flex-col items-center justify-center text-center p-6">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-4">Hiring Probability</span>
              <ATSGauge score={placementProbability} size="sm" showLabel={true} />
              <span className="text-[10px] text-theme-muted mt-3">Callback likelihood estimate</span>
            </Card>

            {/* KPI 4: Skill Gap Severity */}
            <Card className="flex flex-col items-center justify-center text-center p-6">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-4">Skill Gap Severity</span>
              <ATSGauge score={100 - skillsScore} size="sm" showLabel={true} invertColors={true} />
              <span className="text-[10px] text-theme-muted mt-3">Missing core requirements</span>
            </Card>

          </div>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart 1: Skill Gap Radar */}
            <Card 
              className="lg:col-span-1"
              header={
                <>
                  <h3 className="text-sm font-bold font-display text-theme-text uppercase tracking-wider">Skill Gap Radar</h3>
                  <span className="text-xs text-theme-muted">Resume Sections</span>
                </>
              }
            >
              <div className="h-64 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="80%" data={radarData}>
                    <PolarGrid stroke="rgb(var(--color-border))" strokeDasharray="3 3" opacity={0.3} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--text-muted))', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 9 }} />
                    <Radar 
                      name="Candidate" 
                      dataKey="score" 
                      stroke="rgb(var(--color-primary))" 
                      fill="rgb(var(--color-primary))" 
                      fillOpacity={0.25} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: ATS Trend Timeline */}
            <Card 
              className="lg:col-span-1"
              header={
                <>
                  <h3 className="text-sm font-bold font-display text-theme-text uppercase tracking-wider">ATS Score Timeline</h3>
                  <span className="text-xs text-theme-muted">Improvement Progress</span>
                </>
              }
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fill: 'rgb(var(--text-muted))', fontSize: 10, fontWeight: 500 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--text-muted))', fontSize: 10, fontWeight: 500 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', border: '1px solid rgb(var(--color-border))', borderRadius: '12px', fontSize: '11px', color: 'rgb(var(--text-main))' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Score" 
                      stroke="rgb(var(--color-primary))" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#scoreColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 3: Placement Probability Gauge Display */}
            <Card 
              className="lg:col-span-1"
              header={
                <>
                  <h3 className="text-sm font-bold font-display text-theme-text uppercase tracking-wider">Placement Outlook</h3>
                  <span className="text-xs text-theme-muted">Probability Rate</span>
                </>
              }
            >
              <div className="flex flex-col items-center justify-center space-y-4 py-3">
                <ATSGauge score={placementProbability} size="md" showLabel={true} />
                
                <div className="text-center text-xs text-theme-muted max-w-[210px] leading-relaxed mt-2 font-medium">
                  {placementProbability >= 75
                    ? "High probability of securing recruiter interviews. Keep refining metrics."
                    : placementProbability >= 55
                    ? "Moderate probability. We recommend practicing more mock answers."
                    : "Upload a revised resume with matching DevOps keywords to boost callbacks."}
                </div>
              </div>
            </Card>

          </div>

          {/* History List Catalog */}
          <Card 
            header={
              <div className="flex justify-between items-center w-full">
                <h3 className="text-sm font-bold font-display text-theme-text uppercase tracking-wider">Resume Evaluation Logs</h3>
                <Badge variant="secondary">{history.length} Scans</Badge>
              </div>
            }
          >
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border text-theme-muted text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Filename</th>
                      <th className="pb-3">Upload Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">ATS Score</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/40 text-xs font-medium">
                    {history.map((item) => (
                      <tr key={item._id} className="hover:bg-theme-card-hover/40 transition duration-150">
                        <td className="py-4 font-bold text-theme-text max-w-xs truncate">{item.fileName}</td>
                        <td className="py-4 text-theme-muted">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(item.uploadDate || item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          {item.status === 'analyzed' ? (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 shrink-0" /> Analyzed
                            </Badge>
                          ) : item.status === 'parsed' ? (
                            <Badge variant="info">
                              <Clock className="w-3 h-3 animate-spin shrink-0" /> Parsed
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock className="w-3 h-3 shrink-0" /> Uploaded
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 font-extrabold text-sm text-theme-text">
                          {item.status === 'analyzed' ? `${item.atsScore}%` : 'N/A'}
                        </td>
                        <td className="py-4 text-right">
                          {item.status === 'analyzed' ? (
                            <Link 
                              to={`/analysis/${item._id}`}
                              className="text-theme-primary hover:text-theme-primary-hover hover:underline transition font-bold inline-flex items-center gap-0.5"
                            >
                              Report <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-theme-muted text-[10px]">Processing...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}

    </div>
  );
};

export default Dashboard;
