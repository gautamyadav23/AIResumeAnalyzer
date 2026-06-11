import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  Loader2, AlertCircle, HelpCircle, ChevronRight, Mic, MicOff, 
  Send, Clock, Award, BookOpen, CheckCircle2, Sparkles, ArrowRight, ListChecks, Play, Download
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
import { getDemoResume, getDemoInterviewQuestions } from '../services/demoData';

const MockInterview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedId = searchParams.get('resumeId') || '';
  const preSelectedCompany = searchParams.get('company') || 'General';

  // State controllers
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState(preSelectedId);
  const [selectedCompany, setSelectedCompany] = useState(preSelectedCompany);
  const [interviewType, setInterviewType] = useState('text'); // text, voice
  
  // Game states: setup, active, feedback, completed
  const [gameState, setGameState] = useState('setup'); 
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timer, setTimer] = useState(60);
  
  // Evaluation States
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Dynamic metrics accumulated
  const [answersList, setAnswersList] = useState([]); // [{ question, answer, score, strengths, missing_points, feedback, expected_answer, category }]
  const [error, setError] = useState('');

  // Speech Recognition ref and states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Timer Ref
  const timerRef = useRef(null);

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

  // Handle active countdown timer
  useEffect(() => {
    if (gameState !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setUserAnswer(prev => prev + transcript);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Setup interview questions
  const startInterview = async () => {
    if (!selectedId) {
      setError('Please select a resume profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let data = null;
      if (selectedId === 'demo') {
        data = getDemoInterviewQuestions();
      } else {
        const res = await API.post(`/resume/${selectedId}/prep`, { company: selectedCompany, regenerate: true });
        data = res.data.data;
      }
      
      // Select 5 structured questions
      // Q1: Tech, Q2: Project (first cat), Q3: Project (second cat), Q4: HR, Q5: Tech/HR
      const techQ = data.technical_questions || [];
      const projQ = data.project_questions || [];
      const hrQ = data.hr_questions || [];
      
      const sessionQuestions = [];
      
      // Pull Q1: Technical
      if (techQ.length > 0) {
        sessionQuestions.push({ ...techQ[0], category: 'Technical' });
      }
      
      // Pull Q2: Project Category 1
      if (projQ.length > 0 && projQ[0].categories?.length > 0) {
        const cat = projObjQuestion(projQ[0].categories, 0);
        if (cat) sessionQuestions.push({ ...cat, category: 'Projects' });
      }

      // Pull Q3: Project Category 2
      if (projQ.length > 0 && projQ[0].categories?.length > 1) {
        const cat = projObjQuestion(projQ[0].categories, 1);
        if (cat) sessionQuestions.push({ ...cat, category: 'Projects' });
      } else if (techQ.length > 1) {
        sessionQuestions.push({ ...techQ[1], category: 'Technical' });
      }

      // Pull Q4: HR
      if (hrQ.length > 0) {
        sessionQuestions.push({ ...hrQ[0], category: 'HR' });
      }

      // Pull Q5: HR or Technical
      if (hrQ.length > 1) {
        sessionQuestions.push({ ...hrQ[1], category: 'Communication' });
      } else if (techQ.length > 2) {
        sessionQuestions.push({ ...techQ[2], category: 'Communication' });
      }

      if (sessionQuestions.length === 0) {
        throw new Error('No interview questions available for this profile.');
      }

      setQuestions(sessionQuestions);
      setCurrentIdx(0);
      setUserAnswer('');
      setAnswersList([]);
      setGameState('active');
    } catch (err) {
      console.error(err);
      setError('Failed to load questions. Please check server connections.');
    } finally {
      setLoading(false);
    }
  };

  const projObjQuestion = (categories, catIndex) => {
    if (categories && categories[catIndex]) {
      const questions = categories[catIndex].questions;
      if (questions && questions.length > 0) {
        return {
          ...questions[0],
          context: `${categories[catIndex].category} (${categories[catIndex].questions[0].context})`
        };
      }
    }
    return null;
  };

  // Helper to trigger auto-submit on timeout
  const handleAutoSubmit = () => {
    submitAnswer("Timeout. No answer provided in time.");
  };

  // Submit User Answer for evaluation
  const submitAnswer = async (forcedAnswer = null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const answer = forcedAnswer || userAnswer || "No response provided.";
    const currentQ = questions[currentIdx];

    setLoadingEvaluation(true);
    setError('');

    if (selectedId === 'demo') {
      setTimeout(() => {
        let score = 8.4;
        if (currentQ.category === 'Technical') score = 8.7;
        else if (currentQ.category === 'Projects') score = 8.5;
        else if (currentQ.category === 'HR') score = 8.4;
        else if (currentQ.category === 'Communication') score = 8.1;

        if (answer === "Question skipped by user." || answer === "Timeout. No answer provided in time.") {
          score = 3.0;
        }

        const evalData = {
          score: score,
          strengths: [`Good grasp of ${currentQ.context || currentQ.category || 'skills'}.`, "Structured explanation style."],
          missing_points: ["Could expand on specific optimization metrics.", "Mention scale challenges."],
          feedback: `Solid attempt. To improve, structure your answer using the STAR method.`
        };

        setCurrentEvaluation(evalData);
        
        const answerObj = {
          question: currentQ.question,
          answer: answer,
          score: evalData.score,
          strengths: evalData.strengths,
          missing_points: evalData.missing_points,
          feedback: evalData.feedback,
          expected_answer: currentQ.answer,
          category: currentQ.category
        };

        setAnswersList(prev => [...prev, answerObj]);
        setGameState('feedback');
        setLoadingEvaluation(false);
      }, 800);
      return;
    }

    try {
      const res = await API.post('/interview/evaluate', {
        question: currentQ.question,
        user_answer: answer,
        expected_answer: currentQ.answer,
        difficulty: currentQ.difficulty
      });

      const evalData = res.data.data;
      setCurrentEvaluation(evalData);
      
      // Save to active lists
      const answerObj = {
        question: currentQ.question,
        answer: answer,
        score: evalData.score,
        strengths: evalData.strengths,
        missing_points: evalData.missing_points,
        feedback: evalData.feedback,
        expected_answer: currentQ.answer,
        category: currentQ.category
      };

      setAnswersList(prev => [...prev, answerObj]);
      setGameState('feedback');
    } catch (err) {
      console.error(err);
      setError('Evaluation failed. Skipping to next question.');
      // Handle failure by adding placeholder evaluation
      const failObj = {
        question: currentQ.question,
        answer: answer,
        score: 4,
        strengths: ["Answer submitted successfully."],
        missing_points: ["AI evaluation timeout occurred."],
        feedback: "Could not fetch detailed feedback.",
        expected_answer: currentQ.answer,
        category: currentQ.category
      };
      setAnswersList(prev => [...prev, failObj]);
      setCurrentEvaluation(failObj);
      setGameState('feedback');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setUserAnswer('');
      setCurrentIdx(prev => prev + 1);
      setGameState('active');
    } else {
      finishInterview();
    }
  };

  const skipQuestion = () => {
    submitAnswer("Question skipped by user.");
  };

  // Finalize interview and persist session
  const finishInterview = async () => {
    setLoading(true);
    setError('');

    // Compute metrics
    const overallScore = Number((answersList.reduce((acc, curr) => acc + curr.score, 0) / answersList.length).toFixed(1));
    
    // Calculate category scores
    const categorySums = { Technical: { sum: 0, count: 0 }, Projects: { sum: 0, count: 0 }, HR: { sum: 0, count: 0 }, Communication: { sum: 0, count: 0 } };
    const weakAreas = [];
    const strengths = [];
    const recommendations = [];

    answersList.forEach(ans => {
      const cat = ans.category;
      if (categorySums[cat]) {
        categorySums[cat].sum += ans.score;
        categorySums[cat].count += 1;
      }
      
      // Extract strengths & weaknesses
      if (ans.strengths && ans.strengths.length > 0) {
        strengths.push(ans.strengths[0]);
      }
      if (ans.missing_points && ans.missing_points.length > 0) {
        weakAreas.push(ans.missing_points[0]);
      }
    });

    const categoryScores = {
      technical: categorySums.Technical.count > 0 ? Number((categorySums.Technical.sum / categorySums.Technical.count).toFixed(1)) : overallScore,
      projects: categorySums.Projects.count > 0 ? Number((categorySums.Projects.sum / categorySums.Projects.count).toFixed(1)) : overallScore,
      hr: categorySums.HR.count > 0 ? Number((categorySums.HR.sum / categorySums.HR.count).toFixed(1)) : overallScore,
      communication: categorySums.Communication.count > 0 ? Number((categorySums.Communication.sum / categorySums.Communication.count).toFixed(1)) : overallScore
    };

    // Formulate learning recommendations based on weaknesses
    weakAreas.forEach(weak => {
      if (weak.toLowerCase().includes('jwt') || weak.toLowerCase().includes('token')) {
        recommendations.push('Study JWT Token validation life cycles');
      }
      if (weak.toLowerCase().includes('mongo') || weak.toLowerCase().includes('index')) {
        recommendations.push('Practice MongoDB indexing query planners');
      }
      if (weak.toLowerCase().includes('architecture') || weak.toLowerCase().includes('scale')) {
        recommendations.push('Learn microservice scaling architectural patterns');
      }
    });

    // Fallbacks if empty
    if (recommendations.length === 0) {
      recommendations.push('Practice advanced coding and OOP design principles');
      recommendations.push('Review cloud deployment container configs (Docker)');
    }
    if (weakAreas.length === 0) {
      weakAreas.push('No major weaknesses detected. Keep refining advanced topics.');
    }
    if (strengths.length === 0) {
      strengths.push('Demonstrated generic software fundamentals.');
    }

    if (selectedId === 'demo') {
      setTimeout(() => {
        setGameState('completed');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      await API.post('/interview/save', {
        company: selectedCompany,
        interviewType: interviewType,
        score: overallScore,
        categoryScores,
        weakAreas: weakAreas.slice(0, 3),
        strengths: strengths.slice(0, 3),
        recommendations: recommendations.slice(0, 3)
      });
      setGameState('completed');
    } catch (err) {
      console.error('Failed to save interview history:', err);
      setError('Interview finished but could not save results to cloud database.');
      setGameState('completed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreVariant = (sc) => {
    if (sc >= 8.0) return 'success';
    if (sc >= 6.0) return 'warning';
    return 'danger';
  };

  const handleExportPDF = () => {
    const element = document.getElementById('mock-interview-report-root');
    if (!element) return;

    setExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;

    // Hide actions
    const actions = document.getElementById('mock-interview-actions-container');
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

      pdf.save(`Mock_Interview_Report_${selectedCompany}.pdf`);

      if (actions) actions.style.display = 'flex';
      setExporting(false);
    }).catch(err => {
      console.error(err);
      if (actions) actions.style.display = 'flex';
      setExporting(false);
    });
  };

  const getScoreColorClass = (sc) => {
    if (sc >= 8.0) return 'text-theme-success';
    if (sc >= 6.0) return 'text-theme-warning';
    return 'text-theme-danger';
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 font-sans text-theme-text">
      
      {/* 1. SETUP PHASE */}
      {gameState === 'setup' && (
        <Card 
          hoverEffect={false}
          className="p-8 md:p-10 border-theme-border max-w-2xl mx-auto space-y-8 animate-fade-in bg-theme-card"
        >
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <div className="p-4 rounded-full bg-theme-primary/10 text-theme-primary w-fit mx-auto ring-8 ring-theme-primary/5 mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-semibold">
              Enter Interview Room
            </h1>
            <p className="text-theme-muted text-sm max-w-md mx-auto">
              Simulate placement rounds with our AI evaluator. Select a resume profile and choose your response medium to begin.
            </p>
          </div>

          {error && (
            <div>
              <ErrorState 
                title="Lobby Setup Failed" 
                message={error} 
              />
            </div>
          )}

          <div className="space-y-5 max-w-md mx-auto">
            {/* Resume Selection */}
            <div className="space-y-1.5">
              <label htmlFor="setup-resume" className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                Select Resume Profile
              </label>
              {fetchingList ? (
                <div className="h-11 flex items-center justify-center rounded-xl border border-theme-border bg-theme-card/50">
                  <Loader2 className="w-5 h-5 animate-spin text-theme-primary" />
                </div>
              ) : (
                <select
                  id="setup-resume"
                  className="w-full px-3.5 py-3 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition cursor-pointer"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.fileName}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Company Select */}
            <div className="space-y-1.5">
              <label htmlFor="setup-company" className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                Target Employer
              </label>
              <select
                id="setup-company"
                className="w-full px-3.5 py-3 text-sm rounded-xl border border-theme-border bg-theme-card text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition cursor-pointer"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="General">General Technology Industry</option>
                <option value="Google">Google (Alphabet)</option>
                <option value="Amazon">Amazon (AWS)</option>
                <option value="Microsoft">Microsoft (Azure)</option>
                <option value="Meta">Meta (Facebook)</option>
                <option value="Netflix">Netflix</option>
                <option value="TCS">Tata Consultancy Services (TCS)</option>
                <option value="Infosys">Infosys</option>
                <option value="Wipro">Wipro</option>
                <option value="Accenture">Accenture</option>
                <option value="Capgemini">Capgemini</option>
              </select>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">
                Choose Response Medium
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setInterviewType('text')}
                  className={`p-4 rounded-xl border font-semibold text-sm transition-all flex flex-col items-center gap-2 ${
                    interviewType === 'text' 
                      ? 'border-theme-primary bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/25' 
                      : 'border-theme-border bg-theme-card hover:bg-theme-card-hover text-theme-muted'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  <span>Text Mode (Type)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewType('voice')}
                  className={`p-4 rounded-xl border font-semibold text-sm transition-all flex flex-col items-center gap-2 ${
                    interviewType === 'voice' 
                      ? 'border-theme-primary bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/25' 
                      : 'border-theme-border bg-theme-card hover:bg-theme-card-hover text-theme-muted'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>Voice Mode (Speak)</span>
                </button>
              </div>
            </div>

            <Button
              onClick={startInterview}
              disabled={loading || !selectedId}
              variant="primary"
              loading={loading}
              className="w-full py-3.5 mt-6 text-slate-50 font-bold"
            >
              Enter Interview Room
            </Button>
          </div>
        </Card>
      )}

      {/* 2. ACTIVE INTERVIEW ROOM */}
      {gameState === 'active' && questions.length > 0 && (
        <Card 
          hoverEffect={false}
          className="border-theme-border max-w-2xl mx-auto space-y-6 animate-fade-in bg-theme-card relative overflow-hidden"
        >
          {/* Header Row info */}
          <div className="flex justify-between items-center gap-4 pb-4 border-b border-theme-border/60">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider block">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <p className="text-xs text-theme-muted font-sans">
                Topic: <strong className="text-theme-text font-semibold">{questions[currentIdx].category}</strong>
              </p>
            </div>
            
            {/* Timer Badge */}
            <Badge variant={timer < 15 ? 'danger' : 'secondary'} className="px-3.5 py-1.5 font-mono text-sm gap-1.5 rounded-xl">
              <Clock className={`w-4 h-4 ${timer < 15 ? 'animate-pulse' : ''}`} />
              <span>{timer}s</span>
            </Badge>
          </div>

          {/* Progress gauge */}
          <Progress 
            value={((currentIdx + 1) / questions.length) * 100} 
            height="h-2" 
            variant="primary" 
          />

          {/* Question Text Prompt */}
          <div className="py-2 space-y-2">
            <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Interviewer Prompt:
            </span>
            <p className="text-lg font-bold font-display text-theme-text leading-snug">
              {questions[currentIdx].question}
            </p>
          </div>

          {/* User Input Area */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
              Your Answer Response:
            </span>
            
            {interviewType === 'voice' ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center py-6 gap-4 border border-theme-border/50 bg-theme-card/30 rounded-2xl relative">
                  
                  {/* Simple Voice Status Indicator */}
                  <div className="h-10 flex items-center justify-center w-full">
                    {isListening ? (
                      <span className="text-xs text-theme-success font-semibold flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-theme-success" /> Listening...
                      </span>
                    ) : (
                      <span className="text-xs text-theme-muted">Microphone Idle</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition border shadow-lg duration-150 ${
                      isListening 
                        ? 'bg-theme-danger text-white border-theme-danger/30' 
                        : 'bg-theme-primary text-white border-theme-primary/30'
                    }`}
                  >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                </div>
                
                <div className="p-4 rounded-xl border border-theme-border bg-theme-card/30 min-h-[110px] text-sm leading-relaxed text-theme-text/90">
                  {userAnswer ? (
                    <p className="font-medium font-sans">{userAnswer}</p>
                  ) : (
                    <p className="text-theme-muted italic text-center pt-8 text-xs">
                      {isListening ? "Listening... start speaking to transcribe your speech answer." : "Click the button above and speak your response clearly."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                className="w-full p-4 rounded-xl border border-theme-border bg-theme-card/30 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 text-sm leading-relaxed transition-all"
                rows={6}
                placeholder="Structure your response. Be detailed and mention relevant frameworks, key tools, and architectural tradeoffs..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
            )}
          </div>

          {/* Action buttons footer */}
          <div className="flex justify-between items-center gap-4 pt-4 border-t border-theme-border/60">
            <Button
              onClick={skipQuestion}
              disabled={loadingEvaluation}
              variant="outline"
              size="sm"
            >
              Skip Question
            </Button>

            <Button
              onClick={() => submitAnswer()}
              disabled={loadingEvaluation || (!userAnswer.trim() && interviewType === 'text')}
              variant="primary"
              size="sm"
              loading={loadingEvaluation}
              className="text-slate-50 font-bold"
            >
              Submit Answer
            </Button>
          </div>

        </Card>
      )}

      {/* 3. INTERMEDIARY FEEDBACK SCREEN */}
      {gameState === 'feedback' && currentEvaluation && (
        <Card 
          hoverEffect={false}
          className="border-theme-border max-w-2xl mx-auto space-y-6 bg-theme-card animate-fade-in"
        >
          
          <div className="flex justify-between items-center gap-4 border-b border-theme-border/60 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-theme-text">Question Insights</h2>
              <p className="text-xs text-theme-muted mt-0.5">Evaluation for question {currentIdx + 1} of {questions.length}</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Points Earned</span>
              <Badge variant={getScoreVariant(currentEvaluation.score)} className="text-sm px-3.5 py-1.5 rounded-xl font-black mt-1 font-mono">
                {currentEvaluation.score} / 10
              </Badge>
            </div>
          </div>

          {/* Strengths & Weaknesses grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-theme-success/15 bg-theme-success/5 space-y-2">
              <span className="text-[10px] font-bold text-theme-success uppercase tracking-wider block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Core Strengths
              </span>
              <ul className="list-disc list-inside text-xs text-theme-success/90 space-y-1.5 leading-relaxed font-medium">
                {currentEvaluation.strengths?.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
                {(!currentEvaluation.strengths || currentEvaluation.strengths.length === 0) && (
                  <li>Demonstrated baseline developer skills.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-theme-danger/15 bg-theme-danger/5 space-y-2">
              <span className="text-[10px] font-bold text-theme-danger uppercase tracking-wider block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Gaps & Missing Terms
              </span>
              <ul className="list-disc list-inside text-xs text-theme-danger/90 space-y-1.5 leading-relaxed font-medium">
                {currentEvaluation.missing_points?.map((wp, i) => (
                  <li key={i}>{wp}</li>
                ))}
                {(!currentEvaluation.missing_points || currentEvaluation.missing_points.length === 0) && (
                  <li>Perfect score, no missing technical terms.</li>
                )}
              </ul>
            </div>
          </div>

          {/* AI Coach Feedback paragraph */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card/30 space-y-2">
            <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Coaching Advice:
            </span>
            <p className="text-sm leading-relaxed text-theme-text/90 font-sans">
              {currentEvaluation.feedback}
            </p>
          </div>

          {/* Model Answer comparison */}
          <div className="p-4 rounded-xl border border-theme-primary/15 bg-theme-primary/5 space-y-2">
            <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider block flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-theme-primary" /> Recommended Answer Pattern:
            </span>
            <p className="text-xs leading-relaxed text-theme-muted whitespace-pre-line font-sans">
              {questions[currentIdx].answer}
            </p>
          </div>

          {/* Proceed button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleNext}
              variant="primary"
              icon={<ChevronRight className="w-4 h-4" />}
              className="text-slate-50 font-bold px-5 py-2.5"
            >
              {currentIdx < questions.length - 1 ? 'Next Question' : 'Compile Evaluation'}
            </Button>
          </div>

        </Card>
      )}

      {/* 4. COMPLETED PLACEMENT REPORT */}
      {gameState === 'completed' && (
        <Card 
          id="mock-interview-report-root"
          hoverEffect={false}
          className="p-8 md:p-10 border-theme-border space-y-8 bg-theme-card animate-fade-in"
        >
          {/* Certificate Header */}
          <div className="text-center space-y-3 border-b border-theme-border/60 pb-6">
            <div className="p-4 rounded-full bg-theme-success/10 text-theme-success w-fit mx-auto ring-8 ring-theme-success/5 mb-1">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-semibold">
              Placement Evaluation Report
            </h1>
            <p className="text-theme-muted text-sm font-medium">
              Real-time simulated round for target pack: <strong className="text-theme-text font-bold">{selectedCompany}</strong>
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-theme-warning/10 border border-theme-warning/20 text-theme-warning text-sm font-sans">
              {error}
            </div>
          )}

          {/* Score details grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
            
            {/* Overall score gauge card */}
            <Card className="p-6 text-center space-y-3 bg-theme-card/40 border-theme-border/60" hoverEffect={false}>
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                Overall Assessment Score
              </span>
              <p className="text-6xl font-black text-theme-primary leading-none mt-1">
                {Number((answersList.reduce((acc, curr) => acc + curr.score, 0) / answersList.length).toFixed(1))}
                <span className="text-xl text-theme-muted font-normal ml-0.5">/10</span>
              </p>
              <Badge variant="primary" className="py-1 px-3 mt-2">
                Evaluated by Gemini 1.5 Pro
              </Badge>
              <p className="text-xs text-theme-muted pt-1">
                Calculated across {answersList.length} customized technical scenarios.
              </p>
            </Card>

            {/* Category breakdown progress bars */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-theme-text uppercase tracking-wider block pl-0.5">
                Competency Scores
              </span>
              
              {['Technical', 'Projects', 'HR', 'Communication'].map(cat => {
                const list = answersList.filter(a => a.category === cat);
                const avg = list.length > 0 ? Number((list.reduce((acc, c) => acc + c.score, 0) / list.length).toFixed(1)) : 7.5;
                
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-theme-text">{cat} Focus</span>
                      <strong className={getScoreColorClass(avg)}>{avg} / 10</strong>
                    </div>
                    <Progress 
                      value={avg * 10} 
                      height="h-2" 
                      variant={getScoreVariant(avg)} 
                    />
                  </div>
                );
              })}
            </div>

          </div>

          {/* Strengths & Weak Areas lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-theme-border/60">
            
            {/* Strengths */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-theme-success uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Strong Answers
              </h3>
              <div className="space-y-3">
                {answersList.filter(a => a.score >= 7.0).map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-theme-success/15 bg-theme-success/5 text-xs">
                    <strong className="text-theme-text font-semibold text-sm leading-snug">{ans.question}</strong>
                    <p className="mt-1.5 text-theme-muted font-sans font-medium">{ans.strengths?.[0] || 'Correct concept mapping and terms.'}</p>
                  </div>
                ))}
                {answersList.filter(a => a.score >= 7.0).length === 0 && (
                  <p className="text-xs text-theme-muted italic pl-1">No high-scoring responses compiled.</p>
                )}
              </div>
            </div>

            {/* Weak Areas */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-theme-danger uppercase tracking-wider flex items-center gap-1.5">
                <ListChecks className="w-4 h-4" /> Areas Requiring Revision
              </h3>
              <div className="space-y-3">
                {answersList.filter(a => a.score < 7.0).map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-theme-danger/15 bg-theme-danger/5 text-xs">
                    <strong className="text-theme-text font-semibold text-sm leading-snug">{ans.question}</strong>
                    <p className="mt-1.5 text-theme-muted font-sans font-medium">{ans.missing_points?.[0] || 'Missing core technical definitions or parameters.'}</p>
                  </div>
                ))}
                {answersList.filter(a => a.score < 7.0).length === 0 && (
                  <p className="text-xs text-theme-success italic pl-1">🎉 Perfect score profile! All answers scored above 7.0.</p>
                )}
              </div>
            </div>
          </div>

          {/* Learning recommendations card */}
          <Card 
            className="p-6 border-theme-border bg-theme-card" 
            hoverEffect={false}
          >
            <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider flex items-center gap-2 mb-4">
              <BookOpen className="w-4.5 h-4.5" /> Upskilling Roadmap & Target Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
              <div className="space-y-2">
                <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Revision Topics</span>
                <ul className="list-disc list-inside space-y-1.5 text-theme-text/80 leading-relaxed font-medium">
                  {answersList.some(a => a.missing_points?.some(m => m.toLowerCase().includes('jwt') || m.toLowerCase().includes('token'))) && <li>JWT Security Headers & Lifecycles</li>}
                  {answersList.some(a => a.missing_points?.some(m => m.toLowerCase().includes('mongo') || m.toLowerCase().includes('index'))) && <li>MongoDB Index Optimization plans</li>}
                  <li>Asynchronous queues (Celery/Redis)</li>
                  <li>Docker container specs & configurations</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Recommended Projects</span>
                <ul className="list-disc list-inside space-y-1.5 text-theme-text/80 leading-relaxed font-medium">
                  <li>API Gateway with Decoupled Routing</li>
                  <li>Client-Server Token validation proxy</li>
                  <li>In-memory cache layer implementation</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[10px] text-theme-muted uppercase tracking-wider block">Recommended Credentials</span>
                <ul className="list-disc list-inside space-y-1.5 text-theme-text/80 leading-relaxed font-medium">
                  {selectedCompany === 'Google' || selectedCompany === 'Amazon' ? (
                    <>
                      <li>AWS Certified Developer Associate</li>
                      <li>Google Cloud Associate Developer</li>
                    </>
                  ) : (
                    <>
                      <li>AWS Certified Cloud Practitioner</li>
                      <li>Azure Fundamentals (AZ-900)</li>
                    </>
                  )}
                  <li>MongoDB Certified Professional</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div id="mock-interview-actions-container" className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Button
              onClick={() => { setGameState('setup'); }}
              variant="outline"
              className="py-3 px-6 w-full sm:w-auto"
            >
              Practice Again
            </Button>
            
            <Button
              onClick={handleExportPDF}
              variant="primary"
              disabled={exporting}
              icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              className="py-3 px-6 w-full sm:w-auto text-slate-50 font-bold"
            >
              {exporting ? 'Generating Report...' : 'Export PDF Report'}
            </Button>

            <Button
              onClick={() => navigate('/interview-prep')}
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
              className="py-3 px-6 w-full sm:w-auto text-slate-50 font-bold"
            >
              Back to Prep Dashboard
            </Button>
          </div>

        </Card>
      )}

    </div>
  );
};

export default MockInterview;
