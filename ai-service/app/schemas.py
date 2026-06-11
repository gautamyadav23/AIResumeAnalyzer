from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# 1) ATS Score Schemas
class ATSScoreRequest(BaseModel):
    resume_text: str

class ATSScoreResponse(BaseModel):
    atsScore: int
    skillsScore: int
    educationScore: int
    experienceScore: int
    formattingScore: int

# 2) Job Description Match Schemas (Deterministic)
class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

class JobMatchResponse(BaseModel):
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]

# 3) Job Analysis Schemas (Gemini-powered matching insights)
class JobAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    skills: List[str]

class JobAnalysisResponse(BaseModel):
    match_percentage: float
    missing_skills: List[str]
    matching_skills: List[str]
    interview_probability: str
    resume_weaknesses: List[str]
    explanation: str

# 4) Enhanced Interview Question Schemas
class QuestionItem(BaseModel):
    category: str
    difficulty: str
    question: str
    answer: str
    key_points: List[str]
    follow_ups: List[str]
    context: Optional[str] = None

class CategoryItem(BaseModel):
    category: str
    questions: List[QuestionItem]

class ProjectQuestionsItem(BaseModel):
    project_name: str
    categories: List[CategoryItem]

class InterviewQuestionsRequest(BaseModel):
    skills: List[str]
    projects: List[str]
    experience: List[str]
    education: Optional[List[Dict[str, Any]]] = []
    company: Optional[str] = "General"

class InterviewQuestionsResponse(BaseModel):
    technical_questions: List[QuestionItem]
    project_questions: List[ProjectQuestionsItem]
    hr_questions: List[QuestionItem]

class AnswerEvaluationRequest(BaseModel):
    question: str
    user_answer: str
    expected_answer: str
    difficulty: str

class AnswerEvaluationResponse(BaseModel):
    score: float
    strengths: List[str]
    missing_points: List[str]
    improved_answer: str
    feedback: str

# 5) Career Prediction Schemas
class CareerPredictionItem(BaseModel):
    role: str
    match_score: str
    roadmap: List[str]
    salary_range: str
    required_skills: List[str]
    missing_skills: List[str]
    confidence: float # Keep for backward compatibility


class CareerPredictionRequest(BaseModel):
    skills: List[str]
    experience: List[str]
    education: List[Dict[str, Any]]

class CareerPredictionResponse(BaseModel):
    recommended_roles: List[CareerPredictionItem]

# Summary Schemas
class SummaryRequest(BaseModel):
    name: str
    skills: List[str]
    education: List[Dict[str, Any]]
    experience: List[str]
    projects: List[str]

class SummaryResponse(BaseModel):
    summary: str


# 6) Resume Insights & Recruiter Verdict Schemas
class RecruiterVerdict(BaseModel):
    recruiter_rating: float  # e.g., 8.5
    ats_rating: float        # e.g., 7.2
    technical_readiness: float # e.g., 8.0
    placement_readiness: str # e.g., "75%"
    hiring_probability: str  # e.g., "68%"
    top_concerns: List[str]
    suggested_improvements: List[str]
    final_recommendation: str

class ATSScoreExplanation(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    missing_keywords: List[str]
    experience_gaps: List[str]
    project_gaps: List[str]
    explanation: str

class ATSGrowthRecommendation(BaseModel):
    skill: str
    impact: str # e.g., "+5%"
    reason: str

class ResumeSummaryGeneration(BaseModel):
    professional_summary: str
    linkedin_about: str
    headline: str

class ResumeInsightsRequest(BaseModel):
    name: str
    resume_text: str
    skills: List[str]
    experience: List[str]
    projects: List[str]
    education: List[Dict[str, Any]]
    ats_score: int

class ResumeInsightsResponse(BaseModel):
    recruiter_verdict: RecruiterVerdict
    ats_explanation: ATSScoreExplanation
    growth_recommendations: List[ATSGrowthRecommendation]
    resume_summary: ResumeSummaryGeneration

# 7) Resume Chat schemas
class ChatResumeRequest(BaseModel):
    resume_text: str
    history: List[Dict[str, str]]
    message: str
    ats_score: int
    skills: List[str]
    experience: List[str]
    projects: List[str]

class ChatResumeResponse(BaseModel):
    response: str

# 8) Skill Roadmap schemas
class SkillRoadmapRequest(BaseModel):
    skill: str

class SkillRoadmapResponse(BaseModel):
    skill: str
    learning_sequence: List[Dict[str, Any]]
    recommended_topics: List[str]
    estimated_time: str
    beginner_resources: List[str]
    intermediate_projects: List[str]
    advanced_projects: List[str]

# 9) Resume Rewriter schemas
class RewriteResumeRequest(BaseModel):
    section: str
    content: str
    skills: List[str]

class RewriteResumeResponse(BaseModel):
    rewritten_content: str

# 10) Project Explainer schemas
class ProjectExplainerRequest(BaseModel):
    project_name: str
    skills: List[str]

class ProjectExplainerResponse(BaseModel):
    project_name: str
    architecture: str
    interview_questions: List[Dict[str, Any]]
    system_design_questions: List[Dict[str, Any]]
    scalability_questions: List[Dict[str, Any]]
    security_questions: List[Dict[str, Any]]
    improvements: List[str]
