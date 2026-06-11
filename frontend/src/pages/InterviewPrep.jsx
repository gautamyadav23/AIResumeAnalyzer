import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  Loader2, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Check, 
  Copy, Bookmark, BookmarkCheck, RefreshCw, Play, BarChart2,
  Layers, Globe, Server, Database, Shield, Cloud, Cpu, FlaskConical, Rocket,
  Link2, Award, TrendingUp, Calendar, PlayCircle, MessageSquare, BookOpen, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, AreaChart, Area, Legend
} from 'recharts';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton, { CardSkeleton } from '../components/ui/Skeleton';
import { getDemoResume, getDemoInterviewQuestions, getDemoAnalytics } from '../services/demoData';

const InterviewPrep = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState(preSelectedId);
  const [selectedCompany, setSelectedCompany] = useState('General');
  
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('tech'); // tech, project, hr, explainer, analytics

  // AI Project Explainer States
  const [selectedProject, setSelectedProject] = useState('');
  const [projectExplanation, setProjectExplanation] = useState(null);
  const [loadingExplainer, setLoadingExplainer] = useState(false);
  const [expandedExplainerQ, setExpandedExplainerQ] = useState({}); // { 'sec-qIdx': true }
  const [showExplainerAns, setShowExplainerAns] = useState({}); // { 'sec-qIdx': true }

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Accordion active toggles (independent maps)
  const [expandedTechMap, setExpandedTechMap] = useState({});
  const [expandedHRMap, setExpandedHRMap] = useState({});
  const [expandedProjectCategories, setExpandedProjectCategories] = useState({});
  const [expandedProjectQuestions, setExpandedProjectQuestions] = useState({});

  // Answers visibility map
  const [showAnswerMap, setShowAnswerMap] = useState({});

  // Local storage state lists for Practiced / Saved status
  const [practicedQuestions, setPracticedQuestions] = useState(() => {
    const cached = localStorage.getItem('interview_practiced');
    return cached ? JSON.parse(cached) : [];
  });
  const [savedQuestions, setSavedQuestions] = useState(() => {
    const cached = localStorage.getItem('interview_saved');
    return cached ? JSON.parse(cached) : [];
  });

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState(null);

  // Sync state lists to local storage
  useEffect(() => {
    localStorage.setItem('interview_practiced', JSON.stringify(practicedQuestions));
  }, [practicedQuestions]);

  useEffect(() => {
    localStorage.setItem('interview_saved', JSON.stringify(savedQuestions));
  }, [savedQuestions]);

  // Fetch analyzed resume list
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
        if (!selectedId && analyzed.length > 0) {
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
  }, [selectedId]);

  // Fetch questions when resume selection or company changes
  const fetchPrepQuestions = async (regenerate = false) => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setQuestions(null);
    setExpandedTechMap({});
    setExpandedHRMap({});
    setExpandedProjectCategories({});
    setExpandedProjectQuestions({});
    setShowAnswerMap({});

    if (selectedId === 'demo') {
      setTimeout(() => {
        setQuestions(getDemoInterviewQuestions());
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await API.post(`/resume/${selectedId}/prep`, { 
        company: selectedCompany,
        regenerate: regenerate
      });
      setQuestions(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate interview questions for this resume profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrepQuestions(false);
  }, [selectedId, selectedCompany]);

  // Auto-select first project for project explainer
  useEffect(() => {
    if (questions && questions.project_questions && questions.project_questions.length > 0) {
      setSelectedProject(questions.project_questions[0].project_name);
    } else if (questions) {
      setSelectedProject('AI-Powered Resume Analyzer');
    }
  }, [questions]);

  // Fetch Project Explainer when inputs change
  useEffect(() => {
    if (!selectedId || !selectedProject || activeTab !== 'explainer') return;

    const fetchExplainer = async () => {
      setLoadingExplainer(true);
      setProjectExplanation(null);
      setExpandedExplainerQ({});
      setShowExplainerAns({});

      if (selectedId === 'demo') {
        setTimeout(() => {
          setProjectExplanation(getDemoInterviewQuestions().project_explainer);
          setLoadingExplainer(false);
        }, 400);
        return;
      }

      try {
        const res = await API.get(`/resume/${selectedId}/project-explainer`, {
          params: { projectName: selectedProject }
        });
        setProjectExplanation(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExplainer(false);
      }
    };

    fetchExplainer();
  }, [selectedId, selectedProject, activeTab]);

  // Fetch Analytics when tab becomes active
  useEffect(() => {
    if (activeTab !== 'analytics') return;

    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);

      if (selectedId === 'demo') {
        setTimeout(() => {
          setAnalyticsData(getDemoAnalytics());
          setLoadingAnalytics(false);
        }, 400);
        return;
      }

      try {
        const res = await API.get('/interview/analytics');
        setAnalyticsData(res.data.data);
      } catch (err) {
        console.error('Failed to retrieve analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [activeTab, selectedId]);

  // Copy helper
  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Toggle mark practiced
  const togglePracticed = (qText) => {
    setPracticedQuestions(prev => 
      prev.includes(qText) ? prev.filter(q => q !== qText) : [...prev, qText]
    );
  };

  // Toggle save question
  const toggleSaved = (qText) => {
    setSavedQuestions(prev => 
      prev.includes(qText) ? prev.filter(q => q !== qText) : [...prev, qText]
    );
  };

  // Visibility togglers
  const toggleTechQuestion = (idx) => {
    setExpandedTechMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleHRQuestion = (idx) => {
    setExpandedHRMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleProjectCategory = (projIdx, catIdx) => {
    const key = `${projIdx}-${catIdx}`;
    setExpandedProjectCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleProjectQuestion = (projIdx, catIdx, qIdx) => {
    const key = `${projIdx}-${catIdx}-${qIdx}`;
    setExpandedProjectQuestions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAnswerVisibility = (key) => {
    setShowAnswerMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExplainerQ = (sec, idx) => {
    const key = `${sec}-${idx}`;
    setExpandedExplainerQ(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExplainerAns = (sec, idx) => {
    const key = `${sec}-${idx}`;
    setShowExplainerAns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegenerate = () => {
    fetchPrepQuestions(true);
  };

  const startMockInterview = () => {
    if (!selectedId) return;
    navigate(`/interview-mock?resumeId=${selectedId}&company=${selectedCompany}`);
  };

  const getDifficultyVariant = (diff) => {
    if (diff === 'Hard') return 'danger';
    if (diff === 'Medium') return 'warning';
    return 'success';
  };

  const getCategoryIcon = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('frontend')) return <Globe className="w-4 h-4" />;
    if (c.includes('backend')) return <Server className="w-4 h-4" />;
    if (c.includes('database')) return <Database className="w-4 h-4" />;
    if (c.includes('security')) return <Shield className="w-4 h-4" />;
    if (c.includes('deployment')) return <Rocket className="w-4 h-4" />;
    if (c.includes('api')) return <Link2 className="w-4 h-4" />;
    if (c.includes('architecture')) return <Layers className="w-4 h-4" />;
    return <Cpu className="w-4 h-4" />;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fade-in text-theme-text font-sans">
      
      {/* Top Header Card */}
      <Card 
        className="border-theme-border bg-theme-card"
        hoverEffect={false}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold">
              AI Interview Coach
            </h1>
            <p className="text-theme-muted text-sm leading-relaxed max-w-2xl">
              Equip yourself for upcoming technical rounds, situational HR assessments, and complex system design reviews customized directly to your resume achievements.
            </p>
          </div>
          
          <Button 
            onClick={startMockInterview}
            disabled={!selectedId}
            variant="primary"
            icon={<PlayCircle className="w-5 h-5" />}
            className="shrink-0 w-full md:w-auto text-slate-50"
          >
            Start Mock Interview
          </Button>
        </div>

        {/* Configuration Dropdowns bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-theme-border/60">
          {/* Resume Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="active-resume" className="text-xs font-bold text-theme-muted uppercase tracking-wider">
              Active Profile
            </label>
            {fetchingList ? (
              <div className="h-10 flex items-center px-3 rounded-xl border border-theme-border bg-theme-card/30">
                <Loader2 className="w-4 h-4 animate-spin text-theme-primary mr-2" />
                <span className="text-xs text-theme-muted">Fetching profile list...</span>
              </div>
            ) : (
              <select
                id="active-resume"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition cursor-pointer"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.fileName}</option>
                ))}
                {resumes.length === 0 && <option value="">No analyzed resume found</option>}
              </select>
            )}
          </div>

          {/* Company Pack Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-pack" className="text-xs font-bold text-theme-muted uppercase tracking-wider">
              Target Company Pack
            </label>
            <select
              id="company-pack"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition cursor-pointer"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="General">General Questions</option>
              <option value="Google">Google (DSA, Architecture, Scale)</option>
              <option value="Amazon">Amazon (Leadership Principles, System Design)</option>
              <option value="Microsoft">Microsoft (OOP, Data Structures, Azure)</option>
              <option value="TCS">TCS (Fundamentals, Core Engineering)</option>
              <option value="Infosys">Infosys (OOP, RDBMS, Logic)</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div>
          <ErrorState 
            title="Interview Generation Error" 
            message={error} 
            onRetry={() => fetchPrepQuestions(false)} 
          />
        </div>
      )}

      {/* Main Content Area */}
      {!selectedId && !fetchingList ? (
        <div>
          <EmptyState 
            title="No Resume Active" 
            description="Please upload and analyze a resume first to prepare interview question packs." 
            icon={<HelpCircle className="w-10 h-10 text-theme-muted" />}
          />
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="flex gap-2 p-1.5 bg-theme-card/60 border border-theme-border rounded-xl">
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-28 h-8" />
            <Skeleton className="w-28 h-8" />
          </div>
          <CardSkeleton className="h-44" />
          <CardSkeleton className="h-44" />
          <CardSkeleton className="h-44" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Tab Navigation header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-theme-border/60">
            <div className="flex p-1 rounded-xl bg-theme-card border border-theme-border overflow-x-auto gap-1 w-full sm:w-auto">
              {[
                { id: 'tech', label: 'Technical Pack' },
                { id: 'project', label: 'Project Deep-Dive' },
                { id: 'explainer', label: 'AI Explainer' },
                { id: 'hr', label: 'Situational & HR' },
                { id: 'analytics', label: 'Analytics Tracker', icon: <BarChart2 className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-theme-primary text-slate-50 shadow-md shadow-theme-primary/20'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-card-hover'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Refresh Cache action */}
            {activeTab !== 'analytics' && activeTab !== 'explainer' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                className="rounded-lg py-2 self-end sm:self-auto"
                title="Regenerate company question pack"
              >
                Regenerate Pack
              </Button>
            )}
          </div>

          {/* Tab Content 1: Technical Questions */}
          {activeTab === 'tech' && questions && (
            <div className="space-y-4">
              <div>
                {questions.technical_questions?.map((q, idx) => {
                  const key = `tech-${idx}`;
                  const isExpanded = !!expandedTechMap[idx];
                  const showAnswer = !!showAnswerMap[key];
                  const isPracticed = practicedQuestions.includes(q.question);
                  const isSaved = savedQuestions.includes(q.question);

                  return (
                    <div key={idx} className="mb-4">
                      <Card
                        className={`overflow-hidden border-l-4 border-l-theme-primary border-theme-border bg-theme-card`}
                      >
                        {/* Summary Header */}
                        <div 
                          className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                          onClick={() => toggleTechQuestion(idx)}
                        >
                          <div className="space-y-2.5 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="primary" className="rounded-lg">
                                {q.context || 'General'}
                              </Badge>
                              <Badge variant={getDifficultyVariant(q.difficulty)} className="rounded-lg">
                                {q.difficulty}
                              </Badge>
                              {isPracticed && (
                                <Badge variant="success" className="rounded-lg gap-1">
                                  <Check className="w-3 h-3" /> Practiced
                                </Badge>
                              )}
                              {isSaved && (
                                <Badge variant="info" className="rounded-lg">
                                  Saved
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-theme-text text-base leading-snug">
                              {q.question}
                            </h4>
                          </div>
                          
                          <div className="p-2 rounded-lg bg-theme-card-hover border border-theme-border/50 text-theme-muted hover:text-theme-text transition shrink-0 mt-0.5">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        
                          {isExpanded && (
                            <div
                              className="border-t border-theme-border bg-theme-card-hover"
                            >
                              <div className="p-5 space-y-6 text-sm">
                                
                                {/* Model Answer */}
                                
                                  {showAnswer && (
                                    <div
                                      className="p-4 rounded-xl bg-theme-primary/5 border border-theme-primary/15 leading-relaxed text-theme-text"
                                    >
                                      <h5 className="font-bold text-xs text-theme-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> Core Answer Blueprint:
                                      </h5>
                                      <p className="whitespace-pre-line text-sm text-theme-text/90 font-sans">{q.answer}</p>
                                    </div>
                                  )}

                                {/* Keywords checklist */}
                                <div className="space-y-2.5">
                                  <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider">
                                    Strategic Terms & Key Concepts to Mention
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {q.key_points?.map((pt, i) => (
                                      <Badge key={i} variant="secondary" className="rounded-lg">
                                        {pt}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Follow Ups */}
                                {q.follow_ups && q.follow_ups.length > 0 && (
                                  <div className="space-y-2.5 pt-4 border-t border-theme-border">
                                    <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-theme-primary" />
                                      Likely Follow-Up Questions
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-theme-muted leading-relaxed pl-1">
                                      {q.follow_ups.map((fu, i) => (
                                        <li key={i}>{fu}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Actions Pill Bar */}
                                <div className="flex items-center gap-2 border-t border-theme-border pt-4 flex-wrap">
                                  <Button
                                    onClick={() => toggleAnswerVisibility(key)}
                                    variant={showAnswer ? 'secondary' : 'primary'}
                                    size="sm"
                                    className={showAnswer ? 'text-slate-800 dark:text-slate-100' : 'text-slate-50'}
                                  >
                                    {showAnswer ? 'Hide Answer Key' : 'Reveal Answer Key'}
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleCopyText(q.answer, key)}
                                    variant="outline"
                                    size="sm"
                                    icon={copiedKey === key ? <Check className="w-4 h-4 text-theme-success" /> : <Copy className="w-4 h-4" />}
                                    title="Copy answer"
                                  >
                                    {copiedKey === key ? 'Copied' : 'Copy'}
                                  </Button>

                                  <Button
                                    onClick={() => togglePracticed(q.question)}
                                    variant={isPracticed ? 'success' : 'outline'}
                                    size="sm"
                                    icon={<Check className="w-4 h-4" />}
                                    title="Toggle practiced status"
                                    className={isPracticed ? 'text-slate-50' : ''}
                                  >
                                    {isPracticed ? 'Practiced' : 'Mark Practiced'}
                                  </Button>

                                  <Button
                                    onClick={() => toggleSaved(q.question)}
                                    variant="outline"
                                    size="sm"
                                    icon={isSaved ? <BookmarkCheck className="w-4 h-4 text-theme-primary" /> : <Bookmark className="w-4 h-4" />}
                                    title="Save question to bookmarks"
                                  >
                                    {isSaved ? 'Saved' : 'Save Bookmark'}
                                  </Button>
                                </div>

                              </div>
                            </div>
                          )}
                        
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content 2: Project Deep-Dive */}
          {activeTab === 'project' && questions && (
            <div className="space-y-6">
              {questions.project_questions?.map((projObj, projIdx) => (
                <div key={projIdx} className="space-y-4">
                  <h3 className="text-xl font-bold font-display text-theme-primary flex items-center gap-2 mt-2">
                    <FlaskConical className="w-5 h-5 text-theme-primary" />
                    {projObj.project_name}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {projObj.categories?.map((catObj, catIdx) => {
                      const catKey = `${projIdx}-${catIdx}`;
                      const isCatExpanded = !!expandedProjectCategories[catKey];
                      
                      return (
                        <Card 
                          key={catIdx} 
                          className="p-0 overflow-hidden"
                          hoverEffect={false}
                        >
                          {/* Category Accordion Header */}
                          <div
                            onClick={() => toggleProjectCategory(projIdx, catIdx)}
                            className="w-full p-4 flex items-center justify-between hover:bg-theme-card-hover transition cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary border border-theme-primary/10 shrink-0">
                                {getCategoryIcon(catObj.category)}
                              </div>
                              <span className="font-bold text-theme-text text-sm uppercase tracking-wider">
                                {catObj.category}
                              </span>
                            </div>
                            <div className="text-theme-muted p-1 rounded bg-theme-card-hover border border-theme-border/40">
                              {isCatExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                            </div>
                          </div>

                          {/* Category Expand Area */}
                          
                            {isCatExpanded && (
                              <div
                                className="border-t border-theme-border/60 bg-theme-card/10"
                              >
                                <div className="p-4 space-y-4">
                                  {catObj.questions?.map((q, qIdx) => {
                                    const qKey = `${projIdx}-${catIdx}-${qIdx}`;
                                    const isQExpanded = !!expandedProjectQuestions[qKey];
                                    const showAnswer = !!showAnswerMap[qKey];
                                    const isPracticed = practicedQuestions.includes(q.question);
                                    const isSaved = savedQuestions.includes(q.question);

                                    return (
                                      <div key={qIdx} className="p-4 rounded-xl border border-theme-border/60 bg-theme-card space-y-4">
                                        <div 
                                          className="flex items-start justify-between gap-4 cursor-pointer select-none" 
                                          onClick={() => toggleProjectQuestion(projIdx, catIdx, qIdx)}
                                        >
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Badge variant={getDifficultyVariant(q.difficulty)} className="rounded-lg">
                                                {q.difficulty}
                                              </Badge>
                                              {isPracticed && (
                                                <Badge variant="success" className="rounded-lg gap-1">
                                                  <Check className="w-3 h-3" /> Practiced
                                                </Badge>
                                              )}
                                            </div>
                                            <h4 className="font-semibold text-theme-text text-sm leading-snug mt-1">
                                              {q.question}
                                            </h4>
                                          </div>
                                          <button className="text-theme-muted hover:text-theme-text p-1 rounded bg-theme-card-hover border border-theme-border/50 shrink-0">
                                            {isQExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                          </button>
                                        </div>

                                          {isQExpanded && (
                                            <div
                                              className="space-y-4 text-xs font-sans leading-relaxed pt-3 border-t border-theme-border/50"
                                            >
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <Button
                                                  onClick={() => toggleAnswerVisibility(qKey)}
                                                  variant={showAnswer ? 'secondary' : 'primary'}
                                                  size="sm"
                                                  className={`py-1 px-3 text-[11px] ${showAnswer ? 'text-slate-800 dark:text-slate-100' : 'text-slate-50'}`}
                                                >
                                                  {showAnswer ? 'Hide Details' : 'Show Details'}
                                                </Button>
                                                
                                                <Button
                                                  onClick={() => handleCopyText(q.answer, qKey)}
                                                  variant="outline"
                                                  size="sm"
                                                  icon={copiedKey === qKey ? <Check className="w-3 h-3 text-theme-success" /> : <Copy className="w-3 h-3" />}
                                                  className="py-1 px-2.5 text-[11px]"
                                                >
                                                  {copiedKey === qKey ? 'Copied' : 'Copy'}
                                                </Button>

                                                <Button
                                                  onClick={() => togglePracticed(q.question)}
                                                  variant={isPracticed ? 'success' : 'outline'}
                                                  size="sm"
                                                  icon={<Check className="w-3 h-3" />}
                                                  className={`py-1 px-2.5 text-[11px] ${isPracticed ? 'text-slate-50' : ''}`}
                                                >
                                                  {isPracticed ? 'Practiced' : 'Mark Practiced'}
                                                </Button>

                                                <Button
                                                  onClick={() => toggleSaved(q.question)}
                                                  variant="outline"
                                                  size="sm"
                                                  icon={isSaved ? <BookmarkCheck className="w-3 h-3 text-theme-primary" /> : <Bookmark className="w-3 h-3" />}
                                                  className="py-1 px-2.5 text-[11px]"
                                                >
                                                  {isSaved ? 'Saved' : 'Save'}
                                                </Button>
                                              </div>

                                              {showAnswer && (
                                                <div className="p-3.5 rounded-lg bg-theme-primary/5 border border-theme-primary/10 text-theme-text/90 font-sans leading-relaxed">
                                                  <h5 className="font-bold text-[10px] text-theme-primary uppercase tracking-wider mb-1.5">
                                                    Architectural Response Blueprint:
                                                  </h5>
                                                  <p className="whitespace-pre-line">{q.answer}</p>
                                                </div>
                                              )}

                                              <div className="space-y-1.5">
                                                <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider">
                                                  Technical concepts & tools:
                                                </h5>
                                                <div className="flex flex-wrap gap-1">
                                                  {q.key_points?.map((pt, i) => (
                                                    <Badge key={i} variant="secondary" className="rounded-lg text-[10px]">
                                                      {pt}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>

                                              {q.follow_ups && q.follow_ups.length > 0 && (
                                                <div className="space-y-1.5 pt-3 border-t border-theme-border/50">
                                                  <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider">
                                                    Interviewer Follow-ups:
                                                  </h5>
                                                  <ul className="list-disc list-inside space-y-1 text-theme-muted pl-0.5">
                                                    {q.follow_ups.map((fu, i) => (
                                                      <li key={i}>{fu}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 3: AI Project Explainer */}
          {activeTab === 'explainer' && (
            <div className="space-y-6">
              <Card className="p-5 border-theme-primary/10" hoverEffect={false}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-display flex items-center gap-2 text-theme-primary">
                      <Sparkles className="w-5 h-5" /> Architectural Explainer Engine
                    </h3>
                    <p className="text-xs text-theme-muted max-w-lg">
                      Generate system design charts, architectural breakdowns, load requirements, and mitigation plans for any of your resume projects.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 max-w-full">
                    <label htmlFor="project-select" className="text-xs font-bold text-theme-muted uppercase tracking-wider whitespace-nowrap">
                      Target Project:
                    </label>
                    <select
                      id="project-select"
                      className="max-w-full px-3 py-2 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition cursor-pointer"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      {questions && questions.project_questions?.map((p, i) => (
                        <option key={i} value={p.project_name}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {loadingExplainer ? (
                <div className="p-12 text-center text-theme-muted border border-theme-border/60 bg-theme-card/30 rounded-3xl">
                  <Loader2 className="w-8 h-8 animate-spin text-theme-primary mx-auto mb-2" />
                  Generating system designs, database schemas, and scalability questions...
                </div>
              ) : projectExplanation ? (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Architecture Description */}
                  <Card 
                    glow 
                    className="border-theme-primary/10"
                    hoverEffect={false}
                    header={
                      <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
                        <Globe className="w-4 h-4" /> System Design & Architecture Overview
                      </div>
                    }
                  >
                    <p className="text-sm leading-relaxed text-theme-text/90 font-sans whitespace-pre-line">
                      {projectExplanation.architecture}
                    </p>
                  </Card>

                  {/* Question Categories blocks */}
                  {[
                    { title: 'System Design Interview Rounds', key: 'system_design_questions', icon: <Layers className="w-4.5 h-4.5 text-indigo-500" /> },
                    { title: 'Scalability, Load Balancing & Cache', key: 'scalability_questions', icon: <Rocket className="w-4.5 h-4.5 text-violet-500" /> },
                    { title: 'Security Safeguards & Vulnerabilities', key: 'security_questions', icon: <Shield className="w-4.5 h-4.5 text-emerald-500" /> }
                  ].map((sec) => (
                    <div key={sec.key} className="space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-theme-muted flex items-center gap-2 pl-1">
                        {sec.icon} {sec.title}
                      </h4>

                      <div className="space-y-3">
                        {projectExplanation[sec.key]?.map((q, qIdx) => {
                          const qKey = `${sec.key}-${qIdx}`;
                          const isExpanded = !!expandedExplainerQ[qKey];
                          const showAns = !!showExplainerAns[qKey];

                          return (
                            <Card key={qIdx} className="p-0 overflow-hidden" hoverEffect={!isExpanded}>
                              <div 
                                className="p-4 flex justify-between items-center gap-4 cursor-pointer hover:bg-theme-card-hover select-none"
                                onClick={() => toggleExplainerQ(sec.key, qIdx)}
                              >
                                <span className="font-semibold text-sm text-theme-text leading-snug">{q.question}</span>
                                <div className="p-1 rounded bg-theme-card-hover border border-theme-border/40 text-theme-muted shrink-0">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>

                              
                                {isExpanded && (
                                  <div
                                    className="px-4 pb-4 pt-2 border-t border-theme-border/50 bg-theme-card/10 text-xs"
                                  >
                                    <div className="flex items-center gap-2 mb-3 mt-1">
                                      <Button
                                        onClick={() => toggleExplainerAns(sec.key, qIdx)}
                                        variant={showAns ? 'secondary' : 'primary'}
                                        className={`py-1 px-2.5 text-[10px] ${showAns ? 'text-slate-800 dark:text-slate-100' : 'text-slate-50'}`}
                                      >
                                        {showAns ? 'Hide Explanation' : 'Reveal Explanation'}
                                      </Button>

                                      <Button
                                        onClick={() => handleCopyText(q.answer, qKey)}
                                        variant="outline"
                                        icon={copiedKey === qKey ? <Check className="w-3 h-3 text-theme-success" /> : <Copy className="w-3 h-3" />}
                                        className="py-1 px-2.5 text-[10px]"
                                      />
                                    </div>

                                    
                                      {showAns && (
                                        <div
                                          className="p-3.5 rounded-lg bg-theme-card border border-theme-border/60 leading-relaxed text-theme-text/90 font-sans"
                                        >
                                          {q.answer}
                                        </div>
                                      )}
                                    
                                  </div>
                                )}
                              
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Future Improvements Suggestions */}
                  <Card
                    glow
                    className="border-theme-warning/15 bg-gradient-to-r from-theme-warning/5 via-transparent to-transparent"
                    hoverEffect={false}
                    header={
                      <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-theme-warning">
                        <Sparkles className="w-4 h-4" /> Future Architectural & Scaling Recommendations
                      </div>
                    }
                  >
                    <ul className="list-disc list-inside text-sm text-theme-muted space-y-2 leading-relaxed">
                      {projectExplanation.improvements?.map((imp, idx) => (
                        <li key={idx} className="marker:text-theme-warning">{imp}</li>
                      ))}
                    </ul>
                  </Card>

                </div>
              ) : null}
            </div>
          )}

          {/* Tab Content 4: HR Questions */}
          {activeTab === 'hr' && questions && (
            <div className="space-y-4">
              <div>
                {questions.hr_questions?.map((q, idx) => {
                  const key = `hr-${idx}`;
                  const isExpanded = !!expandedHRMap[idx];
                  const showAnswer = !!showAnswerMap[key];
                  const isPracticed = practicedQuestions.includes(q.question);
                  const isSaved = savedQuestions.includes(q.question);

                  return (
                    <div key={idx} className="mb-4">
                      <Card
                        className={`overflow-hidden border-l-4 border-l-theme-primary border-theme-border bg-theme-card`}
                      >
                        {/* Question summary */}
                        <div 
                          className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                          onClick={() => toggleHRQuestion(idx)}
                        >
                          <div className="space-y-2.5 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="rounded-lg">
                                {q.context || 'Behavioral'}
                              </Badge>
                              <Badge variant={getDifficultyVariant(q.difficulty)} className="rounded-lg">
                                {q.difficulty}
                              </Badge>
                              {isPracticed && (
                                <Badge variant="success" className="rounded-lg gap-1">
                                  <Check className="w-3 h-3" /> Practiced
                                </Badge>
                              )}
                              {isSaved && (
                                <Badge variant="info" className="rounded-lg">
                                  Saved
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-theme-text text-base leading-snug">
                              {q.question}
                            </h4>
                          </div>
                          
                          <div className="p-2 rounded-lg bg-theme-card-hover border border-theme-border/50 text-theme-muted hover:text-theme-text transition shrink-0 mt-0.5">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Drop down body */}
                        
                          {isExpanded && (
                            <div
                              className="border-t border-theme-border bg-theme-card-hover"
                            >
                              <div className="p-5 space-y-6 text-sm">
                                
                                {/* Response Content */}
                                
                                  {showAnswer && (
                                    <div
                                      className="p-4 rounded-xl bg-theme-primary/5 border border-theme-primary/15 leading-relaxed text-theme-text"
                                    >
                                      <h5 className="font-bold text-xs text-theme-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" /> Model Answer (STAR Method):
                                      </h5>
                                      <p className="whitespace-pre-line text-sm text-theme-text/90 font-sans">{q.answer}</p>
                                    </div>
                                  )}

                                {/* Keywords */}
                                <div className="space-y-2.5">
                                  <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider">
                                    Behavioral Competencies & Buzzwords
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {q.key_points?.map((pt, i) => (
                                      <Badge key={i} variant="secondary" className="rounded-lg">
                                        {pt}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Follow Ups */}
                                {q.follow_ups && q.follow_ups.length > 0 && (
                                  <div className="space-y-2.5 pt-4 border-t border-theme-border">
                                    <h5 className="font-bold text-[10px] text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-theme-primary" />
                                      Behavioral Follow-Ups:
                                    </h5>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-theme-muted leading-relaxed pl-1">
                                      {q.follow_ups.map((fu, i) => (
                                        <li key={i}>{fu}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Actions Pill Bar */}
                                <div className="flex items-center gap-2 border-t border-theme-border pt-4 flex-wrap">
                                  <Button
                                    onClick={() => toggleAnswerVisibility(key)}
                                    variant={showAnswer ? 'secondary' : 'primary'}
                                    size="sm"
                                    className={showAnswer ? 'text-slate-800 dark:text-slate-100' : 'text-slate-50'}
                                  >
                                    {showAnswer ? 'Hide STAR response' : 'Show STAR response'}
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleCopyText(q.answer, key)}
                                    variant="outline"
                                    size="sm"
                                    icon={copiedKey === key ? <Check className="w-4 h-4 text-theme-success" /> : <Copy className="w-4 h-4" />}
                                    title="Copy response"
                                  >
                                    {copiedKey === key ? 'Copied' : 'Copy'}
                                  </Button>

                                  <Button
                                    onClick={() => togglePracticed(q.question)}
                                    variant={isPracticed ? 'success' : 'outline'}
                                    size="sm"
                                    icon={<Check className="w-4 h-4" />}
                                    title="Toggle practiced status"
                                    className={isPracticed ? 'text-slate-50' : ''}
                                  >
                                    {isPracticed ? 'Practiced' : 'Mark Practiced'}
                                  </Button>

                                  <Button
                                    onClick={() => toggleSaved(q.question)}
                                    variant="outline"
                                    size="sm"
                                    icon={isSaved ? <BookmarkCheck className="w-4 h-4 text-theme-primary" /> : <Bookmark className="w-4 h-4" />}
                                    title="Save response to bookmarks"
                                  >
                                    {isSaved ? 'Saved' : 'Save Bookmark'}
                                  </Button>
                                </div>

                              </div>
                            </div>
                          )}
                        
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content 5: Performance Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {loadingAnalytics ? (
                <div className="p-12 text-center text-theme-muted border border-theme-border/60 bg-theme-card/30 rounded-3xl">
                  <Loader2 className="w-8 h-8 animate-spin text-theme-primary mx-auto mb-2" />
                  Retrieving mock records, audio evaluations, and category metrics...
                </div>
              ) : analyticsData && analyticsData.totalInterviews > 0 ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Mock Runs', value: analyticsData.totalInterviews, color: 'text-theme-text' },
                      { label: 'Average Score', value: `${analyticsData.averageScore}/10`, color: 'text-theme-primary' },
                      { label: 'Best Mock Score', value: `${analyticsData.bestScore}/10`, color: 'text-theme-success' },
                      { label: 'Strongest Area', value: analyticsData.strongestArea, size: 'text-[11px] font-bold text-theme-success uppercase mt-1 block truncate', isString: true },
                      { label: 'Weakest Area', value: analyticsData.weakestArea, size: 'text-[11px] font-bold text-theme-danger uppercase mt-1 block truncate', isString: true }
                    ].map((kpi, kIdx) => (
                      <Card key={kIdx} className="p-4" hoverEffect={false}>
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                          {kpi.label}
                        </span>
                        {kpi.isString ? (
                          <span className={kpi.size} title={kpi.value}>{kpi.value}</span>
                        ) : (
                          <p className={`text-2xl font-black ${kpi.color} mt-1`}>
                            {kpi.value}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Trend History */}
                    <Card 
                      className="p-5"
                      hoverEffect={false}
                      header={
                        <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-theme-primary" /> Score Trend History
                        </h4>
                      }
                    >
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData.scoreHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                            <XAxis dataKey="date" stroke="rgb(var(--text-muted))" fontSize={10} />
                            <YAxis domain={[0, 10]} stroke="rgb(var(--text-muted))" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--color-border))', borderRadius: '12px', color: 'rgb(var(--text-main))' }} />
                            <Area type="monotone" dataKey="score" stroke="rgb(var(--color-primary))" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" name="Score" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Category Performance */}
                    <Card
                      className="p-5"
                      hoverEffect={false}
                      header={
                        <h4 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4 text-theme-primary" /> Category Breakdown
                        </h4>
                      }
                    >
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.categoryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                            <XAxis dataKey="category" stroke="rgb(var(--text-muted))" fontSize={10} />
                            <YAxis domain={[0, 10]} stroke="rgb(var(--text-muted))" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--color-border))', borderRadius: '12px', color: 'rgb(var(--text-main))' }} />
                            <Bar dataKey="score" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} name="Average Score" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No Analytics Data Yet"
                  description="Complete mock interview speech evaluation sessions inside the Interview Room to unlock progress trends and dashboard analytics graphs."
                  icon={<BarChart2 className="w-10 h-10 text-theme-muted" />}
                />
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default InterviewPrep;
