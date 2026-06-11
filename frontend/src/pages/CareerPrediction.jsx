import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import { 
  Loader2, AlertCircle, Award, Compass, RefreshCw, 
  MapPin, CheckCircle, ListPlus, ChevronDown, ChevronUp, BookOpen, Briefcase, DollarSign, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Progress from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton, { CardSkeleton } from '../components/ui/Skeleton';
import { getDemoResume, getDemoCareerPredictions } from '../services/demoData';

const CareerPrediction = () => {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState(preSelectedId);
  
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleDownloadPDF = () => {
    const element = document.querySelector('.max-w-5xl');
    if (!element) return;

    setExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;

    const actions = document.getElementById('career-actions-block');
    if (actions) actions.style.display = 'none';

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

      pdf.save(`Career_Predictions_Roadmap.pdf`);
      if (actions) actions.style.display = 'flex';
      setExporting(false);
    }).catch(err => {
      console.error(err);
      if (actions) actions.style.display = 'flex';
      setExporting(false);
    });
  };

  // Expand collapse tracking for role roadmap details
  const [expandedRoleIdx, setExpandedRoleIdx] = useState(0);

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

  // Fetch predictions when resume selection changes
  useEffect(() => {
    if (!selectedId) return;
    fetchCareers();
  }, [selectedId]);

  const fetchCareers = async (regenerate = false) => {
    setLoading(true);
    setError('');
    setPredictions(null);

    if (selectedId === 'demo') {
      setTimeout(() => {
        setPredictions(getDemoCareerPredictions());
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await API.post(`/resume/${selectedId}/careers`, { regenerate });
      setPredictions(res.data.data.recommended_roles || []);
    } catch (err) {
      console.error(err);
      setError('Failed to compute role forecasts. The AI service may be rate-limited or temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (!selectedId) return;
    fetchCareers(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fade-in text-theme-text">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-theme-border">
        <div>
          <h1 className="text-3xl font-semibold">
            AI Career Path Forecast
          </h1>
          <p className="text-theme-muted mt-1 text-sm">
            Discover roles that best align with your technical background and map out your upskilling journey.
          </p>
        </div>
        
        {/* Dropdown Selector & Refresh Action */}
        <div id="career-actions-block" className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider hidden sm:inline">
              Profile:
            </span>
            {fetchingList ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-theme-card/50 border border-theme-border rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-theme-primary" />
                <span className="text-xs text-theme-muted">Loading profiles...</span>
              </div>
            ) : (
              <select
                id="resume-select"
                className="w-full md:w-56 px-3 py-2 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all cursor-pointer"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.fileName}</option>
                ))}
              </select>
            )}
          </div>

          {selectedId && (
            <>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
                loading={loading}
                icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                className="px-3 py-2.5 h-full rounded-xl"
                title="Force re-generate prediction (clear cache)"
              >
                <span className="sr-only">Regenerate</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="primary"
                size="sm"
                disabled={exporting}
                icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                className="px-3 py-2.5 h-full rounded-xl"
              >
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div>
          <ErrorState 
            title="Forecast Generation Failed" 
            message={error} 
            onRetry={() => fetchCareers(false)} 
          />
        </div>
      )}

      {/* Main predictions section */}
      {!selectedId && !fetchingList ? (
        <div>
          <EmptyState 
            title="No Profile Selected" 
            description="Upload and analyze a resume first to allow the Career Copilot to generate customized role recommendations and roadmaps." 
            icon={<Briefcase className="w-10 h-10 text-theme-muted" />}
          />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <CardSkeleton />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton className="h-40" />
            <CardSkeleton className="h-40" />
            <CardSkeleton className="h-40" />
          </div>
        </div>
      ) : (
        predictions && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Summary Box */}
            {predictions.length > 0 && (
              <div>
                <Card 
                  className="sticky top-24 border-theme-border bg-theme-card"
                  header={
                    <div className="flex items-center gap-2 font-semibold text-sm text-theme-text">
                      <Award className="w-4 h-4 text-theme-primary" />
                      Top Career Match
                    </div>
                  }
                >
                  <div className="flex flex-col items-center text-center py-4 space-y-4">
                    <div className="p-4 rounded-full bg-theme-primary/10 text-theme-primary ring-8 ring-theme-primary/5">
                      <Compass className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold font-display text-theme-text leading-tight">
                        {predictions[0].role}
                      </h3>
                      <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mt-1">
                        Recommended Pathway
                      </p>
                    </div>

                    <Badge variant="primary" className="py-1 px-3">
                      {predictions[0].match_score} Match Score
                    </Badge>
                    
                    <div className="w-full border-t border-theme-border/50 pt-4 mt-2 text-sm text-left space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-theme-success" /> Salary Index
                        </span>
                        <strong className="text-theme-text font-semibold">{predictions[0].salary_range}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-theme-muted flex items-center gap-1.5">
                          <ListPlus className="w-4 h-4 text-theme-danger" /> Gap Analysis
                        </span>
                        <strong className="text-theme-danger font-semibold">
                          {predictions[0].missing_skills?.length || 0} Skills Needed
                        </strong>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Right Recommended Role Accordion list */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold font-display text-theme-text flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-theme-primary" /> Recommended Roles & Growth Blueprints
              </h2>
              
              <div>
                {predictions.map((pred, idx) => {
                  const isExpanded = expandedRoleIdx === idx;
                  const matchValue = parseInt(pred.match_score) || 0;
                  
                  return (
                    <div>
                      <Card
                        className={`overflow-hidden border-l-4 border-l-theme-primary border-theme-border bg-theme-card`}
                      >
                        {/* Header Row clickable */}
                        <div 
                          className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                          onClick={() => setExpandedRoleIdx(isExpanded ? -1 : idx)}
                        >
                          <div className="flex-1 space-y-2.5">
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="font-display font-extrabold text-base text-theme-text">
                                {pred.role}
                              </span>
                              <Badge variant={idx === 0 ? 'primary' : idx === 1 ? 'success' : 'info'}>
                                {pred.match_score} Match
                              </Badge>
                            </div>
                            
                            {/* Horizontal Progress */}
                            <Progress 
                              value={matchValue} 
                              variant={idx === 0 ? 'primary' : idx === 1 ? 'success' : 'info'}
                              height="h-2"
                            />
                          </div>

                          <div className="p-2 rounded-lg bg-theme-card-hover border border-theme-border/50 text-theme-muted hover:text-theme-text transition shrink-0">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Detail Expansion */}
                        
                          {isExpanded && (
                            <div
                              className="border-t border-theme-border bg-theme-card-hover"
                            >
                              <div className="p-5 space-y-6 text-sm">
                                
                                {/* Info grids */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-theme-card border border-theme-border/50">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                                      Estimated Salary Range
                                    </span>
                                    <strong className="text-theme-text text-base font-semibold">
                                      {pred.salary_range}
                                    </strong>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                                      Path Status
                                    </span>
                                    <strong className="text-theme-success text-base font-semibold flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4" /> Highly Viable
                                    </strong>
                                  </div>
                                </div>

                                {/* Skills matching analysis */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Matched */}
                                  <div className="space-y-3 p-4 rounded-xl border border-theme-success/15 bg-theme-success/5">
                                    <span className="font-bold text-xs text-theme-success uppercase tracking-wider flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4" /> Acquired Skills
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {pred.required_skills && pred.required_skills.filter(s => !pred.missing_skills?.includes(s)).map((skill, i) => (
                                        <Badge key={i} variant="success" className="rounded-lg">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {pred.required_skills && pred.required_skills.filter(s => !pred.missing_skills?.includes(s)).length === 0 && (
                                        <span className="text-theme-muted italic text-xs">No exact matches yet</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Missing / Upskill Areas */}
                                  <div className="space-y-3 p-4 rounded-xl border border-theme-danger/15 bg-theme-danger/5">
                                    <span className="font-bold text-xs text-theme-danger uppercase tracking-wider flex items-center gap-1.5">
                                      <ListPlus className="w-4 h-4" /> Priority Skill Gaps
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {pred.missing_skills && pred.missing_skills.map((skill, i) => (
                                        <Badge key={i} variant="danger" className="rounded-lg">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {(!pred.missing_skills || pred.missing_skills.length === 0) && (
                                        <span className="text-theme-success italic text-xs flex items-center gap-1">
                                          🎉 Perfect profile match!
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Career roadmap steps */}
                                <div className="space-y-4 pt-2 border-t border-theme-border/50">
                                  <span className="font-bold text-xs text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                                    <BookOpen className="w-4.5 h-4.5 text-theme-primary" /> Upskilling Learning Roadmap
                                  </span>
                                  
                                  <div className="relative pl-6 border-l border-theme-border space-y-6 py-2 ml-2">
                                    {pred.roadmap && pred.roadmap.map((step, sIdx) => (
                                      <div 
                                        key={sIdx} 
                                        className="relative"
                                      >
                                        <span className="absolute -left-[32px] top-0.5 w-5 h-5 rounded-full bg-theme-primary text-slate-50 flex items-center justify-center text-[10px] font-bold ring-4 ring-theme-card">
                                          {sIdx + 1}
                                        </span>
                                        <p className="text-theme-text font-medium leading-relaxed pl-1">
                                          {step}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
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
          </div>
        )
      )}

    </div>
  );
};

export default CareerPrediction;
