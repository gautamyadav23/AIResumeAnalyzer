import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Shield, Brain, Star, FileCheck, Layers } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const features = [
    {
      title: "ATS Compatibility Scan",
      desc: "Instant evaluation of resume formatting, section structure, and keyword parsing density.",
      icon: FileCheck
    },
    {
      title: "Semantic Job Matcher",
      desc: "Uses Sentence Transformer embeddings to check contextual compatibility with target jobs.",
      icon: Layers
    },
    {
      title: "AI Suggestion Engine",
      desc: "Provides actionable feedback on grammatical bugs, action verbs, and missing sections.",
      icon: Brain
    }
  ];

  return (
    <div className="space-y-24 py-8 animate-fade-in text-theme-text">
      
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-4 mt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-theme-primary/10 text-theme-primary mb-6 border border-theme-primary/20">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Powered by spaCy & Sentence Transformers</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.15] mb-6 text-theme-text">
          Resume Optimization <br />For the Modern Job Market
        </h1>
        
        <p className="text-lg md:text-xl text-theme-muted max-w-2xl mb-10 leading-relaxed font-sans">
          Stop getting filtered out by applicant tracking bots. Upload your resume, run semantic matches against job descriptions, and prep with AI-customized questions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition duration-200 font-medium"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition duration-200 font-medium"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center px-8 py-4 border border-theme-border rounded-xl hover:bg-theme-card-hover transition duration-200 font-medium"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Value Propositions Features grid */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center font-display mb-12">Core Optimization Modules</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index} 
                className="p-8 rounded-2xl border border-theme-border bg-theme-card hover:bg-theme-card-hover transition duration-200"
              >
                <div className="p-3 w-fit rounded-xl bg-theme-primary/10 text-theme-primary mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-theme-text">{feat.title}</h3>
                <p className="text-theme-muted font-sans leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Seal Banner */}
      <section className="max-w-5xl mx-auto px-4 py-12 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-theme-border flex flex-col md:flex-row items-center gap-8 justify-between">
        <div className="space-y-3 max-w-md">
          <h3 className="text-2xl font-bold font-display">Ready to land more interviews?</h3>
          <p className="text-theme-muted font-sans">Check your score, patch missing skills, and build a resume that actually gets noticed by hiring managers.</p>
        </div>
        <Link
          to={isAuthenticated ? "/upload" : "/register"}
          className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition duration-200 text-center"
        >
          Check My Score Now
        </Link>
      </section>

    </div>
  );
};

export default Landing;
