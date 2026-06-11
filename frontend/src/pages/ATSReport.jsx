import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, 
  Mail, Phone, User, Compass, Briefcase, HelpCircle, FileText,
  Download, Award, TrendingUp, ShieldAlert, BadgeInfo, RefreshCw,
  Send, MessageSquare, Copy, Sparkles, PlusCircle, Check, ArrowRight,
  TrendingDown, Star, ChevronDown, ChevronUp, BookOpen, AlertCircle, Loader2
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import ATSGauge from '../components/ui/ATSGauge';
import Drawer from '../components/ui/Drawer';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { getDemoResume, getDemoInsights, getDemoComparisonData } from '../services/demoData';

const ATSReport = () => {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // New Upgrade States
  const [activeReportTab, setActiveReportTab] = useState('insights'); // insights, rewriter, chat, version
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showLowScoreExplanation, setShowLowScoreExplanation] = useState(false);

  // Version Comparison
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // AI Resume Rewriter
  const [selectedRewriteSection, setSelectedRewriteSection] = useState('summary');
  const [rewriteContentInput, setRewriteContentInput] = useState('');
  const [rewrittenContentOutput, setRewrittenContentOutput] = useState('');
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [copiedRewriteText, setCopiedRewriteText] = useState(false);

  // Resume Chat Assistant
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatMessagesList, setChatMessagesList] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatBottomRef = useRef(null);

  // Missing Skill Roadmaps
  const [selectedRoadmapSkill, setSelectedRoadmapSkill] = useState('');
  const [skillRoadmapData, setSkillRoadmapData] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  // Fetch all report details
  const fetchReportData = async (regenerate = false) => {
    setLoading(true);
    setError('');
    const isDemo = id === 'demo' || localStorage.getItem('demo_mode') === 'true';

    if (isDemo) {
      setTimeout(() => {
        const activeResume = getDemoResume();
        const activeInsights = getDemoInsights();
        const activeComparison = getDemoComparisonData();
        setResume(activeResume);
        setCareers(activeResume.parsedData?.skills?.slice(0, 2) || ["Software Engineer"]);
        setInsights(activeInsights);
        setComparisonData(activeComparison);
        
        const defaultTextMap = {
          summary: activeInsights.resume_summary?.professional_summary || '',
          experience: activeResume.parsedData?.experience?.join('\n') || '',
          projects: activeResume.parsedData?.projects?.join('\n') || '',
          skills: activeResume.parsedData?.skills?.join(', ') || ''
        };
        setRewriteContentInput(defaultTextMap[selectedRewriteSection] || '');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await API.get(`/resume/${id}`);
      setResume(res.data.data.resume);
      
      // Fetch career recommendations
      try {
        const careerRes = await API.post(`/resume/${id}/careers`, { regenerate });
        setCareers(careerRes.data.recommended_roles || careerRes.data.data?.recommended_roles || []);
      } catch (cErr) {
        console.error("Failed to load career recommendations:", cErr);
      }

      // Fetch AI resume insights
      fetchInsights(regenerate);

      // Fetch Version Comparison
      fetchComparison();
    } catch (err) {
      console.error(err);
      setError('Failed to fetch detailed resume analysis. Please verify backend connections.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async (regenerate = false) => {
    const isDemo = id === 'demo' || localStorage.getItem('demo_mode') === 'true';
    if (isDemo) {
      setInsights(getDemoInsights());
      return;
    }

    setLoadingInsights(true);
    try {
      const insightsRes = await API.get(`/resume/${id}/insights`, {
        params: { regenerate: regenerate }
      });
      setInsights(insightsRes.data.data);
      
      // Set default text for rewriter
      const defaultTextMap = {
        summary: insightsRes.data.data.resume_summary?.professional_summary || '',
        experience: resume?.parsedData?.experience?.join('\n') || '',
        projects: resume?.parsedData?.projects?.join('\n') || '',
        skills: resume?.parsedData?.skills?.join(', ') || ''
      };
      setRewriteContentInput(defaultTextMap[selectedRewriteSection]);
    } catch (iErr) {
      console.error("Failed to load AI insights:", iErr);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchComparison = async () => {
    const isDemo = id === 'demo' || localStorage.getItem('demo_mode') === 'true';
    if (isDemo) {
      setComparisonData(getDemoComparisonData());
      return;
    }

    setLoadingComparison(true);
    try {
      const compRes = await API.get(`/resume/${id}/version-compare`);
      setComparisonData(compRes.data.data);
    } catch (err) {
      console.error("Failed to load version comparison:", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    fetchReportData(false);
  }, [id]);

  // Set default rewriter content when section changes
  useEffect(() => {
    if (!insights) return;
    const defaultTextMap = {
      summary: insights.resume_summary?.professional_summary || '',
      experience: resume?.parsedData?.experience?.join('\n') || '',
      projects: resume?.parsedData?.projects?.join('\n') || '',
      skills: resume?.parsedData?.skills?.join(', ') || ''
    };
    setRewriteContentInput(defaultTextMap[selectedRewriteSection] || '');
    setRewrittenContentOutput('');
  }, [selectedRewriteSection, insights, resume]);

  // Chat scroll anchor
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessagesList]);

  // Submit chat assistant query
  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessageInput.trim() || loadingChat) return;

    const msg = chatMessageInput;
    setChatMessageInput('');
    setChatMessagesList(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setLoadingChat(true);

    try {
      const chatRes = await API.post(`/resume/${id}/chat`, { message: msg });
      setChatMessagesList(chatRes.data.data.messages || []);
    } catch (err) {
      console.error(err);
      setChatMessagesList(prev => [...prev, { role: 'assistant', content: 'Connection timeout. Failed to fetch response.', timestamp: new Date() }]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Submit rewriter query
  const handleRewriteSubmit = async () => {
    if (!rewriteContentInput.trim() || loadingRewrite) return;
    setLoadingRewrite(true);
    setRewrittenContentOutput('');
    setCopiedRewriteText(false);

    try {
      const rewRes = await API.post(`/resume/${id}/rewrite`, {
        section: selectedRewriteSection,
        content: rewriteContentInput
      });
      setRewrittenContentOutput(rewRes.data.data.rewritten_content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRewrite(false);
    }
  };

  // Fetch skill roadmap
  const handleFetchRoadmap = async (skillName) => {
    setSelectedRoadmapSkill(skillName);
    setSkillRoadmapData(null);
    setLoadingRoadmap(true);
    setRoadmapOpen(true);

    try {
      const roadRes = await API.get(`/resume/${id}/learning-roadmaps`, {
        params: { skill: skillName }
      });
      setSkillRoadmapData(roadRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  // PDF Export Trigger
  const handleDownloadPDF = () => {
    const element = document.getElementById('ats-report-root');
    if (!element) return;

    setExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; 
    const pageHeight = 295; 

    // Temporarily hide operations
    const actionsBlock = document.getElementById('report-actions-container');
    const navigationHeader = document.getElementById('report-header-nav');
    if (actionsBlock) actionsBlock.style.display = 'none';
    if (navigationHeader) navigationHeader.style.display = 'none';

    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ATS_Intelligence_Report_${resume.fileName || 'Analysis'}.pdf`);
      
      if (actionsBlock) actionsBlock.style.display = 'flex';
      if (navigationHeader) navigationHeader.style.display = 'flex';
      setExporting(false);
    }).catch(err => {
      console.error("PDF generation failed:", err);
      if (actionsBlock) actionsBlock.style.display = 'flex';
      if (navigationHeader) navigationHeader.style.display = 'flex';
      setExporting(false);
    });
  };

  const handleCopyRewrite = () => {
    if (!rewrittenContentOutput) return;
    navigator.clipboard.writeText(rewrittenContentOutput);
    setCopiedRewriteText(true);
    setTimeout(() => setCopiedRewriteText(false), 2000);
  };

  // Categorize missing keywords by impact
  const missingKeywords = useMemo(() => {
    if (!insights || !insights.ats_explanation?.missing_keywords) return [];
    return insights.ats_explanation.missing_keywords;
  }, [insights]);

  const highImpactSkills = useMemo(() => missingKeywords.slice(0, 3), [missingKeywords]);
  const mediumImpactSkills = useMemo(() => missingKeywords.slice(3, 6), [missingKeywords]);
  const lowImpactSkills = useMemo(() => missingKeywords.slice(6), [missingKeywords]);

  // Recharts radar configuration
  const radarData = useMemo(() => {
    if (!resume) return [];
    return [
      { subject: 'Skills', score: resume.skillsScore },
      { subject: 'Projects', score: resume.experienceScore },
      { subject: 'Experience', score: Math.max(30, resume.experienceScore - 10) },
      { subject: 'Education', score: resume.educationScore },
      { subject: 'Formatting', score: resume.formattingScore }
    ];
  }, [resume]);

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="flex justify-between items-center border-b border-theme-border pb-6">
          <div className="w-1/4 h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-40 h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CardSkeleton className="lg:col-span-1" />
          <CardSkeleton className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="py-12">
        <ErrorState
          title="Error Loading Report"
          message={error || "Could not retrieve the requested resume evaluation logs."}
          onRetry={() => fetchReportData(false)}
        />
      </div>
    );
  }

  return (
    <div id="ats-report-root" className="space-y-8 py-2 text-theme-text">
      
      {/* 1. Header Navigation Bar */}
      <div id="report-header-nav" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-theme-border pb-6 select-none">
        <div className="space-y-1">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-theme-text transition mb-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display leading-tight truncate max-w-lg">
            ATS Report: <span className="text-theme-primary">{resume.fileName}</span>
          </h1>
        </div>
        <div id="report-actions-container" className="flex items-center gap-3">
          <Button
            onClick={() => fetchReportData(true)}
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerate
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="primary"
            disabled={exporting}
            icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          >
            {exporting ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Metric Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Metric Card 1: Score Gauge & Growth Predictor */}
        <Card 
          className="flex flex-col items-center justify-center text-center lg:col-span-1"
          header={<span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">ATS Evaluation Score</span>}
        >
          <div className="py-4">
            <ATSGauge score={resume.atsScore} size="lg" showLabel={true} />
          </div>
          
          <div className="w-full border-t border-theme-border/50 pt-5 mt-4 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider font-display">Potential Score Growth</span>
              <span className="text-xs font-bold text-theme-success">+{Math.max(6, 98 - resume.atsScore)} Points Potential</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-theme-card-hover border border-theme-border">
                <span className="text-[10px] font-semibold text-theme-muted uppercase block mb-0.5">Current Score</span>
                <span className="text-base font-bold text-theme-text">{resume.atsScore}%</span>
              </div>
              <div className="p-3 rounded-lg bg-theme-card-hover border border-theme-border">
                <span className="text-[10px] font-semibold text-theme-muted uppercase block mb-0.5">Target Potential</span>
                <span className="text-base font-bold text-theme-success">{Math.min(98, resume.atsScore + 14)}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metric Card 2: Recruiter Simulation Verdict */}
        <Card 
          className="lg:col-span-2 flex flex-col justify-between"
          header={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Recruiter Evaluation & Verdict</span>
              <span className={`text-xs font-bold uppercase ${
                (resume?.atsScore || 70) >= 80 
                  ? "text-theme-success" 
                  : (resume?.atsScore || 70) >= 60 
                  ? "text-theme-warning" 
                  : "text-theme-danger"
              }`}>
                {(resume?.atsScore || 70) >= 80 
                  ? "Strong Candidate" 
                  : (resume?.atsScore || 70) >= 60 
                  ? "Shortlist" 
                  : "Needs Improvement"
                }
              </span>
            </div>
          }
        >
          {loadingInsights ? (
            <TableSkeleton rows={3} />
          ) : insights ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-theme-card-hover border border-theme-border text-xs leading-relaxed text-theme-text">
                <p className="font-semibold text-xs text-theme-primary uppercase tracking-wider mb-2">Executive Recommendation Summary</p>
                <p className="font-normal text-theme-text leading-relaxed">
                  {id === 'demo' ? (
                    "The candidate demonstrates strong software engineering capabilities, specifically in React and Docker. The multi-stage Docker configs showcase solid operational knowledge. We recommend shortlisting them for frontend roles immediately, with follow-up on TypeScript type safety."
                  ) : (
                    insights.recruiter_verdict?.overall_recommendation || 
                    insights.ats_explanation?.explanation || 
                    'Resume parsed successfully. Standard template guidelines match backend engineering qualifications.'
                  )}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-theme-border">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-theme-success mb-2">Key Strengths</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-theme-text font-normal">
                    {(insights.ats_explanation?.strengths || insights.strengths || []).map((str, idx) => (
                      <li key={idx} className="leading-relaxed">{str}</li>
                    ))}
                    {(insights.ats_explanation?.strengths || insights.strengths || []).length === 0 && (
                      <li className="text-theme-muted italic">No specific strengths highlighted yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-theme-danger mb-2">Key Weaknesses / Gaps</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-theme-text font-normal">
                    {(insights.ats_explanation?.weaknesses || insights.weaknesses || []).map((wk, idx) => (
                      <li key={idx} className="leading-relaxed">{wk}</li>
                    ))}
                    {(insights.ats_explanation?.weaknesses || insights.weaknesses || []).length === 0 && (
                      <li className="text-theme-muted italic">No critical weaknesses highlighted.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recruiter Verdict Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-theme-border">
                <div className="p-3 rounded-lg bg-theme-card-hover border border-theme-border text-center">
                  <span className="text-[10px] font-semibold text-theme-muted uppercase block">Hiring Probability</span>
                  <span className="text-base font-bold text-theme-success mt-1 block">
                    {id === 'demo' ? 92 : Math.min(100, (resume?.atsScore || 70) + 8)}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-theme-card-hover border border-theme-border text-center">
                  <span className="text-[10px] font-semibold text-theme-muted uppercase block">ATS Rating</span>
                  <span className="text-base font-bold text-theme-primary mt-1 block">
                    {((resume?.atsScore || 70) / 10).toFixed(1)} / 10
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-theme-card-hover border border-theme-border text-center">
                  <span className="text-[10px] font-semibold text-theme-muted uppercase block">Technical Readiness</span>
                  <span className="text-base font-bold text-theme-text mt-1 block">
                    {id === 'demo' ? 90 : Math.min(100, (resume?.atsScore || 70) + 5)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-theme-muted italic">Recruiter simulation is not loaded. Click Regenerate to fetch.</p>
          )}
        </Card>

      </div>

      {/* 3. Section Score Breakdown & Keywords Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Score Breakdown cards */}
        <div className="lg:col-span-1">
          <Card header={<span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">ATS Score Breakdown</span>}>
            <div className="space-y-4.5 py-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-theme-text">
                  <span>Skills Fit</span>
                  <span>{resume.skillsScore}/100</span>
                </div>
                <Progress value={resume.skillsScore} variant="primary" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-theme-text">
                  <span>Experience Fit</span>
                  <span>{resume.experienceScore}/100</span>
                </div>
                <Progress value={resume.experienceScore} variant="info" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-theme-text">
                  <span>Education Fit</span>
                  <span>{resume.educationScore}/100</span>
                </div>
                <Progress value={resume.educationScore} variant="success" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-theme-text">
                  <span>Formatting Checks</span>
                  <span>{resume.formattingScore}/100</span>
                </div>
                <Progress value={resume.formattingScore} variant="warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Missing Keywords priority cards */}
        <Card 
          className="lg:col-span-2"
          header={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Missing Skills Priority</span>
              <span className="text-[10px] text-theme-muted">Click skill to view learning plan</span>
            </div>
          }
        >
          {loadingInsights ? (
            <TableSkeleton rows={2} />
          ) : missingKeywords.length > 0 ? (
            <div className="space-y-5">
              
              {/* High Impact */}
              {highImpactSkills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-theme-danger uppercase tracking-wider block">High Impact (Boosts score significantly)</span>
                  <div className="flex flex-wrap gap-2">
                    {highImpactSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFetchRoadmap(skill)}
                        className="px-3 py-1.5 rounded-lg bg-theme-card-hover border border-theme-border text-theme-danger text-xs font-semibold transition hover:bg-theme-danger/5 cursor-pointer"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Impact */}
              {mediumImpactSkills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-theme-warning uppercase tracking-wider block">Medium Impact (Improves role alignments)</span>
                  <div className="flex flex-wrap gap-2">
                    {mediumImpactSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFetchRoadmap(skill)}
                        className="px-3 py-1.5 rounded-lg bg-theme-card-hover border border-theme-border text-theme-warning text-xs font-semibold transition hover:bg-theme-warning/5 cursor-pointer"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Impact */}
              {lowImpactSkills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-theme-primary uppercase tracking-wider block">Low Impact (Supplemental skill)</span>
                  <div className="flex flex-wrap gap-2">
                    {lowImpactSkills.map((skill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFetchRoadmap(skill)}
                        className="px-3 py-1.5 rounded-lg bg-theme-card-hover border border-theme-border text-theme-primary text-xs font-semibold transition hover:bg-theme-primary/5 cursor-pointer"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <EmptyState
              title="Perfect Skill Density!"
              description="No missing core skills detected. You have high alignment for your selected developer profile."
              icon={<CheckCircle className="w-8 h-8 text-theme-success" />}
            />
          )}
        </Card>

      </div>

      {/* 4. Tab Navigation Section (Insights, Rewriter, Chat, Compare) */}
      <div className="border-t border-theme-border pt-8 select-none">
        <div className="flex border-b border-theme-border overflow-x-auto gap-2">
          <button
            className={`px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${activeReportTab === 'insights' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
            onClick={() => setActiveReportTab('insights')}
          >
            Growth Strategy
          </button>
          <button
            className={`px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${activeReportTab === 'rewriter' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
            onClick={() => setActiveReportTab('rewriter')}
          >
            AI Resume Rewriter
          </button>
          <button
            className={`px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${activeReportTab === 'chat' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
            onClick={() => setActiveReportTab('chat')}
          >
            Insights Chatbot
          </button>
          <button
            className={`px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${activeReportTab === 'version' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-theme-muted hover:text-theme-text'}`}
            onClick={() => setActiveReportTab('version')}
          >
            Compare Versions
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-6">
          
          {/* TAB 1: INSIGHTS & RECOMMENDATIONS */}
          {activeReportTab === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loadingInsights ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : insights ? (
                <>
                  <Card header={<span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Score Growth Recommendations</span>}>
                    <div className="space-y-4">
                      {insights.growth_recommendations?.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-theme-border bg-theme-card/30">
                          <TrendingUp className="w-5 h-5 text-theme-primary shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-theme-text">{rec.skill || rec.recommendation_title}</span>
                              {rec.impact && (
                                <Badge 
                                  variant={
                                    rec.impact.toLowerCase() === 'high' || rec.impact.includes('+5')
                                      ? 'danger' 
                                      : rec.impact.toLowerCase() === 'medium' || rec.impact.includes('+4')
                                      ? 'warning' 
                                      : 'primary'
                                  } 
                                  className="text-[9px] py-0.5 px-1.5 rounded font-bold font-mono uppercase tracking-wider shrink-0"
                                >
                                  {rec.impact}
                                </Badge>
                              )}
                            </div>
                            <p className="text-theme-muted text-[11px] mt-1 leading-relaxed">{rec.reason || rec.recommendation_description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card header={<span className="text-xs font-bold text-theme-muted uppercase tracking-wider">LinkedIn Headline & Bio Suggestions</span>}>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-theme-border">
                        <span className="text-[10px] font-bold text-theme-primary uppercase block mb-1">LinkedIn Headline</span>
                        <p className="text-xs font-bold italic text-theme-text">"{insights.linkedin_summary?.linkedin_headline || 'Professional Developer'}"</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-theme-border">
                        <span className="text-[10px] font-bold text-theme-primary uppercase block mb-1.5">LinkedIn Summary / Bio</span>
                        <p className="text-xs text-theme-text leading-relaxed">{insights.linkedin_summary?.linkedin_summary || 'Experience building scalable web applications.'}</p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="col-span-2 text-center py-12 text-theme-muted italic">No growth recommendations found.</div>
              )}
            </div>
          )}

          {/* TAB 2: AI RESUME REWRITER (Before vs After) */}
          {activeReportTab === 'rewriter' && (
            <Card header={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Quantified Metrics Bullets Rewriter</span>
                <div className="flex flex-wrap gap-1.5">
                  {['summary', 'experience', 'projects', 'skills'].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedRewriteSection(sec)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${selectedRewriteSection === sec ? 'bg-theme-primary border-theme-primary text-white' : 'border-theme-border bg-theme-card text-theme-muted'}`}
                    >
                      {sec.charAt(0).toUpperCase() + sec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            }>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Before */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Before (Original Text)</span>
                  <textarea
                    value={rewriteContentInput}
                    onChange={(e) => setRewriteContentInput(e.target.value)}
                    placeholder="Type or paste experience bullet points here..."
                    rows={8}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-theme-border rounded-xl p-4 text-xs text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 font-mono"
                  />
                  <Button
                    onClick={handleRewriteSubmit}
                    variant="primary"
                    loading={loadingRewrite}
                    className="self-start mt-2"
                  >
                    Optimize achievements
                  </Button>
                </div>

                {/* Right: After */}
                <div className="flex flex-col gap-2 relative">
                  <span className="text-[10px] font-bold text-theme-success uppercase tracking-wider block">After (AI-Optimized achievements)</span>
                  
                  {loadingRewrite ? (
                    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-theme-border rounded-xl h-[178px] flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-theme-primary" />
                    </div>
                  ) : rewrittenContentOutput ? (
                    <div className="w-full bg-theme-success/5 border border-theme-success/20 rounded-xl p-4 text-xs text-theme-text font-mono h-[178px] overflow-y-auto leading-relaxed relative group">
                      <p className="whitespace-pre-line">{rewrittenContentOutput}</p>
                      
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                        <button
                          onClick={handleCopyRewrite}
                          className="p-1.5 rounded-lg bg-theme-card border border-theme-border text-theme-muted hover:text-theme-text transition"
                          title="Copy text"
                        >
                          {copiedRewriteText ? <Check className="w-4 h-4 text-theme-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-theme-border border-dashed rounded-xl h-[178px] flex items-center justify-center text-xs text-theme-muted italic">
                      Click 'Optimize achievements' to see improved metrics-driven versions.
                    </div>
                  )}

                  {rewrittenContentOutput && (
                    <div className="p-3 rounded-lg bg-theme-primary/5 border border-theme-primary/10 mt-2 text-[10px] text-theme-primary flex items-start gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Gemini rewrote the text to follow the Google XYZ formula: *Accomplished [X] as measured by [Y], by doing [Z]*</span>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          )}

          {/* TAB 3: INSIGHTS CHATBOT */}
          {activeReportTab === 'chat' && (
            <Card header={<span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Ask Career Coach questions about this resume</span>}>
              <div className="flex flex-col h-96 overflow-hidden border border-theme-border rounded-xl bg-theme-card/30 p-4">
                
                {/* Message logs */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 leading-normal text-xs">
                  {chatMessagesList.length === 0 && (
                    <div className="text-center py-12 text-theme-muted italic">
                      No message logs yet. Type below to ask specific queries like "Am I ready for placement?" or "Which project should I improve?"
                    </div>
                  )}
                  {chatMessagesList.map((m, idx) => (
                    <div
                      key={idx}
                      className="w-full space-y-1"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                        {m.role === 'user' ? 'You' : 'Career Coach'}
                      </div>
                      <div 
                        className={`p-3 rounded-xl border border-theme-border text-xs leading-normal ${m.role === 'user' ? 'bg-theme-card-hover text-theme-text' : 'bg-theme-card text-theme-text'}`}
                      >
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {loadingChat && (
                    <div className="w-full space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                        Career Coach
                      </div>
                      <div className="flex items-center gap-1 bg-theme-card border border-theme-border p-3 rounded-xl w-16">
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input block */}
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 border-t border-theme-border/50 pt-3">
                  <input
                    type="text"
                    value={chatMessageInput}
                    onChange={(e) => setChatMessageInput(e.target.value)}
                    placeholder="Ask about my ATS score improvements or missing skills..."
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-theme-border rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary/50"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={loadingChat}
                    icon={<Send className="w-3.5 h-3.5" />}
                    className="rounded-xl h-[36px]"
                  >
                    Send
                  </Button>
                </form>

              </div>
            </Card>
          )}

          {/* TAB 4: COMPARE VERSIONS */}
          {activeReportTab === 'version' && (
            <Card header={
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider font-display">Historical Scans Version Evolution</span>
                <Badge variant="primary">Version 1 vs Version 2</Badge>
              </div>
            }>
              {loadingComparison ? (
                <TableSkeleton rows={2} />
              ) : (
                <div className="space-y-6">
                  
                  {/* Side-by-Side Version Evolution View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Version 1 */}
                    <div className="p-5 rounded-2xl border border-theme-border bg-theme-card/20 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Version 1 (Initial Scan)</span>
                        <Badge variant="secondary">Original</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border">
                          <span className="text-[10px] font-bold text-theme-muted uppercase block">ATS Score</span>
                          <span className="text-2xl font-extrabold text-theme-muted mt-1 block">{comparisonData?.v1?.atsScore || 72}%</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border">
                          <span className="text-[10px] font-bold text-theme-muted uppercase block">Hiring Probability</span>
                          <span className="text-2xl font-extrabold text-theme-muted mt-1 block">{comparisonData?.v1?.hiringProbability || 48}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Baseline Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['JavaScript', 'HTML5', 'CSS3', 'Git', 'jQuery'].map((s, idx) => (
                            <Badge key={idx} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Version 2 */}
                    <div className="p-5 rounded-2xl border border-theme-primary/20 bg-theme-primary/5 space-y-4 ring-1 ring-theme-primary/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-theme-primary/10 rounded-bl-full flex items-center justify-center text-theme-primary">
                        <Sparkles className="w-4 h-4 mr-2 mb-2" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Version 2 (Optimized)</span>
                        <Badge variant="success">Active Version</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border">
                          <span className="text-[10px] font-bold text-theme-muted uppercase block">ATS Score</span>
                          <span className="text-2xl font-extrabold text-theme-success mt-1 block flex items-center gap-1.5 font-display">
                            {comparisonData?.v1?.atsScore || 72} <span className="text-xs text-theme-muted font-normal">→</span> {comparisonData?.v2?.atsScore || 85}%
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border">
                          <span className="text-[10px] font-bold text-theme-muted uppercase block">Hiring Probability</span>
                          <span className="text-2xl font-extrabold text-theme-primary mt-1 block flex items-center gap-1.5 font-display">
                            {comparisonData?.v1?.hiringProbability || 48} <span className="text-xs text-theme-muted font-normal">→</span> {comparisonData?.v2?.hiringProbability || 71}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Optimized Skills Catalog</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['React', 'Docker', 'AWS', 'JavaScript', 'HTML5', 'CSS3', 'Git'].map((s, idx) => (
                            <Badge key={idx} variant={['React', 'Docker', 'AWS'].includes(s) ? 'success' : 'secondary'}>{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Change Indicators */}
                  <Card className="p-5 border-theme-border/60 bg-theme-card/30" hoverEffect={false}>
                    <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-theme-primary" /> Visual Evolution Summary
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] text-theme-success uppercase tracking-wider block">Added Tech Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['React', 'Docker', 'AWS'].map((s, idx) => (
                            <Badge key={idx} variant="success" className="gap-1 rounded-lg">
                              + {s}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-[10px] text-theme-danger uppercase tracking-wider block">Removed / Legacy Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['jQuery'].map((s, idx) => (
                            <Badge key={idx} variant="danger" className="gap-1 rounded-lg">
                              - {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                </div>
              )}
            </Card>
          )}

        </div>
      </div>

      {/* 5. VISUAL ROADMAP DRAWER (Opens when clicking missing keywords) */}
      <Drawer
        isOpen={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-theme-primary" />
            <span className="font-display font-extrabold text-theme-text">Learning Roadmap</span>
          </div>
        }
        size="max-w-md"
      >
        {loadingRoadmap ? (
          <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
            <span className="font-semibold text-theme-muted text-xs">Compiling personalized Weekly learning plan for {selectedRoadmapSkill}...</span>
          </div>
        ) : skillRoadmapData ? (
          <div className="space-y-6 leading-relaxed text-xs">
            <div className="border-b border-theme-border pb-4 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-theme-primary uppercase">{selectedRoadmapSkill}</span>
              <span className="text-[10px] font-bold text-theme-muted uppercase">{skillRoadmapData.estimated_time || '2 Weeks'}</span>
            </div>

            {/* Weekly Sequence */}
            <div className="space-y-4">
              <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Weekly Learning Sequence</span>
              {skillRoadmapData.learning_sequence?.map((seq, i) => (
                <div key={i} className="p-4 rounded-xl border border-theme-border bg-theme-card/30 space-y-2">
                  <span className="font-bold text-[10px] text-theme-primary uppercase tracking-wider">{seq.week}</span>
                  <p className="text-theme-text font-medium leading-relaxed">{seq.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1 mt-1">
                    {seq.topics?.map((topic, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-theme-border text-[9px] text-theme-text font-semibold">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Projects & Resources */}
            <div className="space-y-4 border-t border-theme-border pt-4">
              <div className="space-y-2">
                <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Recommended Projects</span>
                <ul className="list-disc list-inside space-y-1 text-theme-muted font-medium">
                  {skillRoadmapData.intermediate_projects?.map((proj, idx) => (
                    <li key={idx}>{proj}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 pt-2">
                <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Suggested Credentials / Resources</span>
                <ul className="list-disc list-inside space-y-1 text-theme-muted font-medium">
                  {skillRoadmapData.beginner_resources?.map((res, idx) => (
                    <li key={idx}>{res}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        ) : (
          <p className="text-xs text-theme-muted italic">Could not compile roadmap details for this skill.</p>
        )}
      </Drawer>

    </div>
  );
};

export default ATSReport;
