import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  User, Mail, Shield, Calendar, LogOut, Award, Target, Compass, 
  TrendingUp, Lock, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    hasUploaded: false,
    hasHighScore: false,
    hasPracticed: false,
    hasMockRun: false,
    resumeCount: 0,
    practiceCount: 0,
    bestMockScore: 0
  });

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      try {
        // Fetch resume history
        const resumeRes = await API.get('/resume/history');
        const historyList = resumeRes.data.data.history || [];
        const hasUploaded = historyList.length > 0;
        const hasHighScore = historyList.some(r => r.atsScore >= 80);
        
        // Fetch interview analytics
        let hasMockRun = false;
        let bestMockScore = 0;
        try {
          const analyticsRes = await API.get('/interview/analytics');
          const analyticsData = analyticsRes.data.data;
          hasMockRun = analyticsData && analyticsData.totalInterviews > 0;
          bestMockScore = analyticsData ? analyticsData.bestScore : 0;
        } catch (err) {
          console.warn('Analytics unavailable for user profile.');
        }

        // Fetch local storage checklist
        const practiced = localStorage.getItem('interview_practiced');
        const practiceCount = practiced ? JSON.parse(practiced).length : 0;
        const hasPracticed = practiceCount > 0;

        setStats({
          hasUploaded,
          hasHighScore,
          hasPracticed,
          hasMockRun,
          resumeCount: historyList.length,
          practiceCount,
          bestMockScore
        });
      } catch (err) {
        console.error('Error compiling profile achievements:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadProfileData();
  }, [user]);

  if (!user) return null;

  // Achievement Badge Definitions
  const achievements = [
    {
      id: 'ats_master',
      title: 'ATS Master',
      desc: 'Achieved an ATS score of 80% or above on any resume profile.',
      icon: <Award className="w-6 h-6" />,
      unlocked: stats.hasHighScore,
      progress: stats.hasHighScore ? 'Completed' : 'Score < 80% needed'
    },
    {
      id: 'interview_ready',
      title: 'Interview Ready',
      desc: 'Marked at least one technical or HR question as practiced.',
      icon: <Target className="w-6 h-6" />,
      unlocked: stats.hasPracticed,
      progress: `${stats.practiceCount} questions practiced`
    },
    {
      id: 'career_explorer',
      title: 'Career Explorer',
      desc: 'Uploaded and analyzed at least one resume to find career paths.',
      icon: <Compass className="w-6 h-6" />,
      unlocked: stats.hasUploaded,
      progress: `${stats.resumeCount} profile uploaded`
    },
    {
      id: 'consistent_improver',
      title: 'Consistent Improver',
      desc: 'Successfully finished at least one mock interview evaluation.',
      icon: <TrendingUp className="w-6 h-6" />,
      unlocked: stats.hasMockRun,
      progress: stats.hasMockRun ? `Best score: ${stats.bestMockScore}/10` : 'No runs completed'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in text-theme-text font-sans">
      
      {/* Title Header */}
      <div className="border-b border-theme-border/60 pb-6">
        <h1 className="text-3xl font-semibold">
          User Settings & Profile
        </h1>
        <p className="text-theme-muted text-sm mt-1">
          Manage your account credentials, view platform statistics, and track unlocked career achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card 
            hoverEffect={false}
            className="border-theme-border bg-theme-card"
          >
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-theme-primary text-slate-50 flex items-center justify-center text-4xl font-semibold ring-4 ring-theme-primary/10">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-theme-text">{user.name}</h3>
                <Badge variant="primary" className="text-[10px] rounded-lg">
                  {user.role} Account
                </Badge>
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-4 text-xs pt-4 border-t border-theme-border/60">
              
              <div className="flex justify-between items-center py-1.5">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </span>
                <span className="font-semibold text-theme-text">{user.name}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </span>
                <span className="font-semibold text-theme-text truncate max-w-[150px]" title={user.email}>
                  {user.email}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Access Role
                </span>
                <span className="font-bold uppercase tracking-wider text-theme-primary">{user.role}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date Joined
                </span>
                <span className="font-semibold text-theme-text">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
              </div>

            </div>

            {/* Logout Trigger */}
            <div className="pt-6 mt-4 border-t border-theme-border/60 flex justify-end">
              <Button
                onClick={logout}
                variant="danger"
                size="sm"
                icon={<LogOut className="w-4 h-4" />}
                className="w-full text-white font-bold"
              >
                Log Out
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Achievements & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card 
            hoverEffect={false}
            header={
              <div className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
                <Sparkles className="w-4 h-4" /> Career Platform Achievements
              </div>
            }
          >
            {loadingStats ? (
              <div className="space-y-4 py-8">
                <div className="flex items-center justify-center gap-2 text-theme-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-theme-primary" />
                  <span>Loading unlocked achievements...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-xl border relative flex items-start gap-4 ${
                      ach.unlocked 
                        ? 'border-theme-primary/20 bg-theme-primary/5' 
                        : 'border-theme-border bg-theme-card/30 opacity-60'
                    }`}
                  >
                    {/* Icon badge */}
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      ach.unlocked 
                        ? 'bg-theme-primary/10 text-theme-primary border-theme-primary/20 shadow-md' 
                        : 'bg-theme-card border-theme-border text-theme-muted'
                    }`}>
                      {ach.unlocked ? ach.icon : <Lock className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="font-semibold text-sm text-theme-text truncate">{ach.title}</h4>
                        {ach.unlocked && (
                          <Badge variant="success" className="text-[9px] rounded px-1.5 py-0.5">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-theme-muted leading-relaxed">
                        {ach.desc}
                      </p>
                      
                      <span className="text-[10px] font-bold text-theme-primary block pt-0.5">
                        {ach.progress}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Statistics Overview */}
          <Card 
            hoverEffect={false}
            header={
              <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
                <TrendingUp className="w-4 h-4" /> Platform Usage Statistics
              </div>
            }
          >
            {loadingStats ? (
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl border border-theme-border bg-theme-card/30">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Resumes</span>
                  <strong className="text-2xl font-black text-theme-text block mt-1">{stats.resumeCount}</strong>
                </div>
                
                <div className="p-4 rounded-xl border border-theme-border bg-theme-card/30">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Practiced</span>
                  <strong className="text-2xl font-black text-theme-text block mt-1">{stats.practiceCount}</strong>
                </div>

                <div className="p-4 rounded-xl border border-theme-border bg-theme-card/30">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Max Mock</span>
                  <strong className="text-2xl font-black text-theme-primary block mt-1">{stats.bestMockScore ? `${stats.bestMockScore}/10` : '-'}</strong>
                </div>
              </div>
            )}
          </Card>

        </div>

      </div>

    </div>
  );
};

export default Profile;
