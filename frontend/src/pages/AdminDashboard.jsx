import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  Users, FileText, BarChart2, Shield, Calendar, Loader2, AlertCircle, RefreshCw, Sparkles, TrendingUp
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton, { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/admin/stats');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve admin dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fade-in text-theme-text font-sans">
        {/* Header Loading */}
        <div className="flex justify-between items-center pb-6 border-b border-theme-border/60">
          <div className="space-y-2 w-1/3">
            <Skeleton variant="title" className="h-7 w-full" />
            <Skeleton variant="text" className="h-3.5 w-3/4" />
          </div>
        </div>

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Chart Skeleton */}
        <ChartSkeleton />
        
        {/* Split Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CardSkeleton className="h-64" />
          </div>
          <div className="lg:col-span-2">
            <CardSkeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto py-6 text-theme-text font-sans">
        <ErrorState 
          title="Administrative Access Error" 
          message={error || 'Could not verify admin credentials or connect to the system registry.'} 
          onRetry={fetchAdminStats}
        />
      </div>
    );
  }

  const { stats, popularSkills, topCareers, uploadsTimeline, recentActivity } = data;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fade-in text-theme-text font-sans">
      
      {/* Title Header */}
      <div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-theme-border/60"
      >
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2.5 text-theme-text">
            <Shield className="w-8 h-8 text-theme-primary shrink-0" />
            <span>Administrator Console</span>
          </h1>
          <p className="text-theme-muted mt-1 text-sm">
            Global aggregates, system usage timelines, document parsing logs, and target role forecasts.
          </p>
        </div>
        
        <Button
          onClick={fetchAdminStats}
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          className="self-end md:self-auto rounded-xl"
        >
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* KPI 1: Active Users */}
        <Card 
          className="border-theme-border"
          hoverEffect={false}
        >
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                Total Registered Users Scanned
              </span>
              <h2 className="text-4xl font-extrabold font-display text-theme-text leading-none mt-1">
                {stats.totalUsers}
              </h2>
            </div>
            <div className="p-3.5 rounded-xl bg-theme-primary/10 text-theme-primary border border-theme-primary/15 shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 2: Total Resumes */}
        <Card 
          className="border-theme-border"
          hoverEffect={false}
        >
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                Total Documents Parsed
              </span>
              <h2 className="text-4xl font-extrabold font-display text-theme-text leading-none mt-1">
                {stats.totalResumes}
              </h2>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 3: System Average ATS */}
        <Card 
          className="border-theme-border"
          hoverEffect={false}
        >
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">
                System Average ATS Score
              </span>
              <h2 className="text-4xl font-extrabold font-display text-theme-success leading-none mt-1">
                {stats.averageATS}%
              </h2>
            </div>
            <div className="p-3.5 rounded-xl bg-theme-success/10 text-theme-success border border-theme-success/15 shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

      </div>

      {/* Daily Uploads Analytics Graph */}
      <Card
        hoverEffect={false}
        header={
          <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
            <TrendingUp className="w-4 h-4" /> Daily Uploads & Parse Analytics
          </div>
        }
      >
        <div className="h-72">
          {uploadsTimeline.length === 0 ? (
            <div className="h-full flex items-center justify-center text-theme-muted text-sm italic">
              No document uploads detected in the last 7 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadsTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                <XAxis dataKey="date" tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgb(var(--color-border))', borderRadius: '12px', color: 'rgb(var(--text-main))' }} />
                <Area type="monotone" dataKey="uploads" stroke="rgb(var(--color-primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminUploads)" name="Document Uploads" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Split lists: aggregations vs recent activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Aggregates list */}
        <div className="lg:col-span-1">
          <Card 
            hoverEffect={false}
            className="h-full space-y-6"
            header={
              <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
                <Sparkles className="w-4 h-4" /> System Aggregates
              </div>
            }
          >
            {/* Top Skills Extracted */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider pl-0.5">
                Top Extracted Skills
              </h4>
              <div className="space-y-2">
                {popularSkills.length === 0 ? (
                  <span className="text-theme-muted text-xs italic pl-0.5">No skill metadata scanned.</span>
                ) : (
                  popularSkills.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-theme-border/30 last:border-0">
                      <Badge variant="secondary" className="rounded-lg text-xs font-semibold">
                        {s.skill}
                      </Badge>
                      <span className="text-xs text-theme-muted font-bold font-sans">
                        {s.count} {s.count === 1 ? 'resume' : 'resumes'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Roles predicted */}
            <div className="space-y-4 pt-4 border-t border-theme-border/60">
              <h4 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider pl-0.5">
                Frequent Career Path Forecasts
              </h4>
              <div className="space-y-2.5">
                {topCareers.length === 0 ? (
                  <span className="text-theme-muted text-xs italic pl-0.5 font-sans">No career paths forecasted.</span>
                ) : (
                  topCareers.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-theme-text">{c.role}</span>
                      <Badge variant="primary" className="rounded-lg px-2 text-[10px]">
                        {c.count} forecasts
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Transaction Logs Activity Feed */}
        <div className="lg:col-span-2">
          <Card 
            hoverEffect={false}
            className="h-full"
            header={
              <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-theme-primary">
                <FileText className="w-4 h-4" /> Global Activity Logs
              </div>
            }
          >
            <div className="space-y-4 divide-y divide-theme-border/40 max-h-[380px] overflow-y-auto pr-1">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-theme-muted text-sm italic font-sans">
                  No transactions registered in system logs.
                </div>
              ) : (
                recentActivity.map((act, idx) => (
                  <div 
                    key={act.id || idx}
                    className="pt-4 first:pt-0 flex items-center justify-between text-sm gap-4 animate-fade-in"
                  >
                    <div className="space-y-1 min-w-0 max-w-[70%]">
                      <h4 className="font-semibold truncate text-theme-text leading-snug" title={act.fileName}>
                        {act.fileName}
                      </h4>
                      <p className="text-xs text-theme-muted truncate font-sans">
                        {act.userName} • <span className="opacity-80">{act.userEmail}</span>
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold block ${act.atsScore > 0 ? 'text-theme-success' : 'text-theme-primary'}`}>
                        {act.atsScore > 0 ? `ATS: ${act.atsScore}%` : 'Scanned'}
                      </span>
                      <span className="text-[10px] text-theme-muted flex items-center gap-1 mt-1 justify-end font-sans">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
