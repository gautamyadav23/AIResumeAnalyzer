import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { 
  Menu, X, Sun, Moon, Bell, User, LogOut, Search, Brain, 
  Upload, FileText, Briefcase, Award, Shield, MessageSquare, 
  Terminal, Sparkles, Send, CornerDownLeft, ChevronLeft, ChevronRight, HelpCircle, Download
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import Button from './ui/Button';
import Card from './ui/Card';
import Drawer from './ui/Drawer';
import Badge from './ui/Badge';
import Modal from './ui/Modal';
import { getDemoResume, getDemoInsights, getDemoInterviewQuestions } from '../services/demoData';

const Layout = ({ children }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Navigation Shell States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Floating Dropdown States
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);



  // Floating AI Copilot Widget States
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState(() => {
    const cached = localStorage.getItem('copilot_chat_history');
    return cached ? JSON.parse(cached) : [
      { role: 'assistant', content: "Hi! I'm your AI Career Copilot. Ask me anything about your resume, career directions, or practice some mock questions." }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [latestResumeId, setLatestResumeId] = useState(null);

  const copilotEndRef = useRef(null);


  // PWA Install State & Event Listeners
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch latest resume to provide context for AI Copilot
  useEffect(() => {
    if (isAuthenticated) {
      const fetchHistory = async () => {
        if (localStorage.getItem('demo_mode') === 'true') {
          setLatestResumeId('demo');
          return;
        }
        try {
          const res = await API.get('/resume/history');
          const list = res.data.data.history || [];
          const analyzed = list.filter(r => r.status === 'analyzed');
          if (analyzed.length > 0) {
            setLatestResumeId(analyzed[0]._id);
          }
        } catch (err) {
          if (localStorage.getItem('demo_mode') === 'true') {
            setLatestResumeId('demo');
          } else {
            console.error('[Copilot Context] Failed to fetch latest resume:', err.message);
          }
        }
      };
      fetchHistory();
    }
  }, [isAuthenticated, location.pathname]);

  // Sync Copilot History to LocalStorage
  useEffect(() => {
    localStorage.setItem('copilot_chat_history', JSON.stringify(copilotHistory));
    // Auto Scroll
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotHistory, copilotOpen]);



  // Command Palette Items
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FileText className="w-4 h-4" />, keywords: 'status, score, resumes, list' },
    { name: 'Upload Resume', path: '/upload', icon: <Upload className="w-4 h-4" />, keywords: 'new, scan, file, parse' },
    { name: 'ATS Report', path: latestResumeId ? `/analysis/${latestResumeId}` : '/upload', icon: <FileText className="w-4 h-4" />, keywords: 'score, format, scan, report, history' },
    { name: 'Job Match', path: '/job-match', icon: <Briefcase className="w-4 h-4" />, keywords: 'jd, description, score, matching' },
    { name: 'Interview Prep', path: '/interview-prep', icon: <Brain className="w-4 h-4" />, keywords: 'qa, study, technical, hr, questions' },
    { name: 'Mock Interview', path: '/interview-mock', icon: <Terminal className="w-4 h-4" />, keywords: 'practice, test, timer, audio' },
    { name: 'Career Prediction', path: '/career-recommend', icon: <Award className="w-4 h-4" />, keywords: 'roadmap, forecast, roles' },
    { name: 'Profile', path: '/profile', icon: <User className="w-4 h-4" />, keywords: 'account, user, stats, achievements' },
  ];



  // Copilot Suggested Prompts
  const suggestedPrompts = [
    "Am I ready for placement?",
    "Explain my ATS strengths",
    "How do I improve my score?",
    "Generate 3 coding questions"
  ];

  const handleCopilotSend = async (messageText) => {
    const text = messageText || chatInput;
    if (!text.trim()) return;

    setCopilotHistory(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setIsTyping(true);

    try {
      let aiResponse = "";
      const isDemo = localStorage.getItem('demo_mode') === 'true' || latestResumeId === 'demo';
      
      if (isDemo) {
        // Mock offline response for Demo Mode
        await new Promise(resolve => setTimeout(resolve, 800)); // typing delay simulator
        const query = text.toLowerCase();
        const activeResume = getDemoResume();
        const activeInsights = getDemoInsights();
        const skillsList = activeResume.parsedData?.skills?.slice(0, 4).join(', ') || 'core skills';
        const missingList = activeInsights.missing_skills?.join(', ') || 'none';
        
        if (query.includes('ats') || query.includes('score') || query.includes('strength')) {
          aiResponse = `Your demo resume has a strong ATS score of ${activeResume.atsScore}%! Proven strengths include: ${activeInsights.strengths?.slice(0, 2).join(', ')}. Areas to improve: Lacks ${missingList}.`;
        } else if (query.includes('improve') || query.includes('weakness') || query.includes('gap')) {
          aiResponse = `To optimize your demo profile: 1. Upsell your skills in ${missingList}. 2. Quantify achievements for your listed projects. 3. Study roadmaps to bridge critical target role requirements.`;
        } else if (query.includes('coding') || query.includes('question') || query.includes('practice')) {
          const qObj = getDemoInterviewQuestions().technical_questions[0];
          aiResponse = `Certainly! Here is a technical question for you:\n\n**Question:** ${qObj.question}\n\n**Brief Answer:** ${qObj.answer}`;
        } else {
          aiResponse = `As your AI Career Copilot, I've analyzed your demo resume (${activeResume.fileName}). It highlights solid foundations in ${skillsList}. Ask me about ATS scores, skill gaps, or mock interview questions!`;
        }
      } else if (latestResumeId) {
        // Call backend resume chat API
        const res = await API.post(`/resume/${latestResumeId}/chat`, {
          message: text,
          history: copilotHistory.slice(-6).map(m => ({ role: m.role, content: m.content }))
        });
        aiResponse = res.data.data.response;
      } else {
        // General AI Response fallback
        aiResponse = "I don't have a parsed resume context to read. Please upload a resume first so I can analyze your skills and give custom advice!";
      }

      setCopilotHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error('[Copilot Chat Error]:', err.message);
      // Hardcoded local fallbacks
      let fallbackText = "I'm having trouble connecting to the backend. Please check if the FastAPI microservice is running on port 8000.";
      if (text.toLowerCase().includes('ats') || text.toLowerCase().includes('score')) {
        fallbackText = "Your ATS Score is calculated deterministically based on skills density, experience formatting, and strong action verbs. Ensure you quantify your metrics (e.g. 'Reduced load time by 30%') to hit 90+!";
      } else if (text.toLowerCase().includes('placement') || text.toLowerCase().includes('ready')) {
        fallbackText = "Based on your current profile, you have solid core skills, but you can strengthen your placement odds by matching project-specific architecture patterns and taking 2-3 mock interviews.";
      } else if (text.toLowerCase().includes('coding') || text.toLowerCase().includes('question')) {
        fallbackText = "Sure! Here is a mock question:\n\n**Question:** How do you reverse a linked list in-place?\n\n**Expected Answer:** Use three pointers (`prev`, `curr`, `next`) to iteratively swap nodes in a single O(N) pass with O(1) space.";
      }
      setCopilotHistory(prev => [...prev, { role: 'assistant', content: fallbackText }]);
    } finally {
      setIsTyping(false);
    }
  };



  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLogoutClick = () => {
    setProfileOpen(false);
    logout();
  };

  if (!isAuthenticated) {
    return <>{children}</>; // Render auth screen directly (no global Layout wrapper)
  }

  return (
    <div className="min-h-screen flex bg-theme-bg text-theme-text transition-colors duration-300">
      
      {/* 1. SIDEBAR (Desktop) */}
      <aside 
        className={`hidden md:flex flex-col border-r border-theme-border bg-theme-card/35 backdrop-blur-lg transition-all duration-300 relative z-30 select-none ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-theme-border">
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-xl tracking-tight shrink-0 bg-gradient-to-r from-theme-primary to-indigo-400 bg-clip-text text-transparent">
            <Brain className="w-8 h-8 text-theme-primary shrink-0 animate-pulse-subtle" />
            {!sidebarCollapsed && <span>ResumePulse</span>}
          </Link>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-theme-muted hover:bg-theme-card-hover hover:text-theme-text transition"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.path === '/upload' && location.pathname.startsWith('/analysis'));
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${isActive ? 'bg-theme-primary/10 text-theme-primary' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card-hover'}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.name}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-theme-primary" />
                )}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${location.pathname === '/admin' ? 'bg-brand-500/10 text-brand-400' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card-hover'}`}
            >
              <Shield className="w-4 h-4 shrink-0 text-brand-500" />
              {!sidebarCollapsed && <span>Admin Console</span>}
            </Link>
          )}
        </nav>

        {/* Footer info / user profile summary */}
        <div className="p-4 border-t border-theme-border bg-theme-card/10 text-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-theme-primary/20 text-theme-primary flex items-center justify-center font-bold font-display uppercase border border-theme-primary/20 shrink-0">
              {user?.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-theme-text truncate leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] text-theme-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP FRAME */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative">
        
        {/* TOPBAR HEADER */}
        <header className="h-16 border-b border-theme-border bg-theme-bg/60 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-theme-card border border-theme-border hover:bg-theme-card-hover text-theme-text"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title indicator */}
            <span className="font-semibold text-xs text-theme-muted capitalize hidden sm:inline-block bg-theme-card/40 px-3 py-1.5 rounded-lg border border-theme-border">
              {location.pathname.replace('/', ' / ').replace('-', ' ').trim() || 'home'}
            </span>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-3 relative">
            
            {showInstallBtn && (
              <Button
                onClick={handleInstallClick}
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5 text-theme-primary" />}
                className="text-theme-primary border-theme-primary/30 hover:bg-theme-primary/10 rounded-xl text-xs font-semibold py-1.5 px-3 mr-1 shrink-0 flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}
            
            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                className="p-2 rounded-lg hover:bg-theme-card-hover text-theme-muted hover:text-theme-text transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-theme-danger animate-pulse" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-theme-border bg-theme-card shadow-2xl p-4 z-40 space-y-3">
                  <div className="flex justify-between items-center border-b border-theme-border pb-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-theme-text">Updates Hub</span>
                    <button className="text-[10px] font-bold text-theme-primary hover:underline">Clear all</button>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="p-2.5 rounded-lg bg-theme-primary/5 border border-theme-primary/10">
                      <p className="font-semibold text-theme-text flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-theme-primary shrink-0" /> AI Coach Readiness Upgraded</p>
                      <p className="text-theme-muted mt-1 text-[11px]">mock evaluation engines are fully loaded in the pre section.</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-theme-border">
                      <p className="font-semibold text-theme-text">Resume Analysis Complete</p>
                      <p className="text-theme-muted mt-1 text-[11px]">UpdatedFinal.pdf was processed with ATS Score 72%.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                className="w-9 h-9 rounded-full bg-theme-primary/20 text-theme-primary flex items-center justify-center font-bold font-display uppercase border border-theme-primary/20 hover:border-theme-primary/45 transition select-none cursor-pointer"
              >
                {user?.name.charAt(0)}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden z-40 font-semibold text-xs">
                  <div className="p-4 bg-theme-card/30 border-b border-theme-border flex flex-col gap-1">
                    <p className="text-theme-text font-bold leading-none">{user?.name}</p>
                    <p className="text-theme-muted text-[10px] leading-none mt-1">{user?.email}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-theme-card-hover text-theme-text">
                      <User className="w-4 h-4 text-theme-muted" /> My Profile
                    </Link>
                    <button onClick={handleLogoutClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-theme-danger/10 text-theme-danger text-left">
                      <LogOut className="w-4 h-4 shrink-0 text-theme-danger" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* RENDER PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div>
            {children}
          </div>
        </main>
      </div>

      {/* 3. PERSISTENT FLOATING AI COPILOT BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setCopilotOpen(true)}
          className="w-14 h-14 rounded-full bg-theme-primary hover:bg-theme-primary-hover text-slate-50 flex items-center justify-center shadow-lg border border-theme-border/25 relative transition-all duration-150"
          aria-label="Toggle AI Career Copilot drawer"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-theme-success border-2 border-theme-bg" />
        </button>
      </div>

      {/* AI COPILOT DRAWER (Sliding panel on the right) */}
      <Drawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-theme-primary" />
            <span className="font-display font-extrabold text-theme-text bg-gradient-to-r from-theme-primary to-indigo-400 bg-clip-text text-transparent">AI Career Copilot</span>
          </div>
        }
        size="max-w-md"
      >
        <div className="flex flex-col h-full overflow-hidden relative pb-14">
          
          {/* Conversation messages */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4 leading-relaxed text-xs">
            {copilotHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className="w-full space-y-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                  {msg.role === 'user' ? 'You' : 'Copilot'}
                </div>
                <div 
                  className={`p-3.5 rounded-xl border border-theme-border text-xs leading-normal ${msg.role === 'user' ? 'bg-theme-card-hover text-theme-text' : 'bg-theme-card text-theme-text'}`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-theme-border text-theme-muted flex items-center justify-center font-bold text-[10px]">
                  AI
                </div>
                <div className="flex items-center gap-1 bg-theme-card border border-theme-border p-3 rounded-2xl rounded-tl-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={copilotEndRef} />
          </div>

          {/* Chat input form */}
          <div className="absolute bottom-0 left-0 right-0 bg-theme-card border-t border-theme-border pt-3">
            {/* Suggested prompts */}
            {copilotHistory.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopilotSend(p)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-text transition duration-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCopilotSend()}
                placeholder="Ask Copilot..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-theme-border rounded-xl px-4 py-2.5 text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary/50"
              />
              <Button
                onClick={() => handleCopilotSend()}
                variant="primary"
                size="sm"
                icon={<Send className="w-3.5 h-3.5" />}
                className="rounded-xl h-[36px]"
              >
                Send
              </Button>
            </div>
          </div>

        </div>
      </Drawer>



      {/* 5. MOBILE MENU DRAWER OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/60"
            />
            {/* Navigation drawer */}
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-theme-card border-r border-theme-border flex flex-col p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="font-display font-extrabold text-lg text-theme-primary">Navigation</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-theme-muted hover:bg-theme-card-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 font-semibold text-xs">
                {menuItems.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${location.pathname === item.path ? 'bg-theme-primary/10 text-theme-primary font-bold' : 'text-theme-muted hover:text-theme-text hover:bg-theme-card-hover'}`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-500 hover:bg-theme-card-hover"
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-danger hover:bg-theme-danger/10 text-left font-bold"
                >
                  <LogOut className="w-4 h-4 text-theme-danger shrink-0" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default Layout;
