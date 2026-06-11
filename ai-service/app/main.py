import os
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Import Schemas
from app.schemas import (
    ATSScoreRequest, ATSScoreResponse,
    JobMatchRequest, JobMatchResponse,
    InterviewQuestionsRequest, InterviewQuestionsResponse,
    CareerPredictionRequest, CareerPredictionResponse,
    SummaryRequest, SummaryResponse,
    AnswerEvaluationRequest, AnswerEvaluationResponse,
    JobAnalysisRequest, JobAnalysisResponse,
    SkillRoadmapRequest, SkillRoadmapResponse,
    RewriteResumeRequest, RewriteResumeResponse,
    ResumeInsightsRequest, ResumeInsightsResponse,
    ChatResumeRequest, ChatResumeResponse,
    ProjectExplainerRequest, ProjectExplainerResponse
)

# Import Services
from app.services.document_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_data
)
from app.services.ats_scorer import calculate_ats_score
from app.services.matcher import match_resume_to_jd
from app.services.generators import (
    generate_questions,
    predict_career_roles,
    generate_summary,
    evaluate_user_answer,
    generate_resume_insights,
    chat_resume,
    analyze_job_description,
    generate_skill_roadmap,
    rewrite_resume_content,
    explain_project_details
)

app = FastAPI(
    title="AI-Powered Resume Analyzer - NLP Microservice",
    description="Python FastAPI service handling document text extraction, ATS calculations, semantic matching, and AI recommendations.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Welcome Endpoint
@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI-Powered Resume Analyzer NLP Microservice is running smoothly.",
        "docs_url": "/docs",
        "health_url": "/health"
    }

# Health Check Endpoint
@app.get("/health")
def health_check():
    # Attempt to load model during health check to warm cache
    from app.services.matcher import get_sentence_transformer
    get_sentence_transformer()
    
    return {
        "status": "healthy",
        "service": "AI Microservice",
        "loaded_models": ["spacy:en_core_web_sm", "sentence-transformers:all-MiniLM-L6-v2"]
    }

# 1) Resume Text & Struct Parsing
@app.post("/ai/parse")
async def parse_resume(file: UploadFile = File(...)):
    filename = file.filename or "resume.pdf"
    ext = filename.split('.')[-1].lower()
    if ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOC, or DOCX.")
    
    try:
        file_bytes = await file.read()
        if ext == "pdf":
            raw_text = extract_text_from_pdf(file_bytes)
        else:
            try:
                raw_text = extract_text_from_docx(file_bytes)
            except Exception as docx_err:
                raise HTTPException(status_code=422, detail=f"Could not parse DOCX structure: {docx_err}")
        
        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="Parsed text is empty. The file may be image-only or password-protected.")

        extracted_data = parse_resume_data(raw_text)

        # Validate if the document is a professional resume
        email_exists = bool(extracted_data.get("personal_info", {}).get("email"))
        skills_exist = bool(extracted_data.get("skills"))
        
        headers = [
            "education", "experience", "skills", "projects", "work history", 
            "certifications", "employment", "career objective", "professional summary", 
            "academic projects", "technical skills", "summary"
        ]
        text_lower = raw_text.lower()
        has_headers = False
        for line in raw_text.split('\n'):
            line_clean = line.strip().lower()
            if len(line_clean) <= 30:
                line_alpha = re.sub(r'[^a-z\s]', '', line_clean).strip()
                if any(h == line_alpha or line_alpha.startswith(h) or line_alpha.endswith(h) for h in headers):
                    has_headers = True
                    break
        
        score = int(email_exists) + int(skills_exist) + int(has_headers)
        if score < 2:
            raise HTTPException(
                status_code=422,
                detail="This document does not appear to be a professional resume. Please upload a valid resume to get accurate feedback."
            )

        return {
            "filename": filename,
            "raw_text": raw_text,
            "extracted_data": extracted_data
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Document parsing error: {err}")

# 2) ATS Score Calculation (Deterministic)
@app.post("/ai/ats-score", response_model=ATSScoreResponse)
def get_ats_score(request: ATSScoreRequest):
    try:
        if not request.resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text cannot be empty.")
            
        scores = calculate_ats_score(request.resume_text)
        return scores
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"ATS scoring calculation error: {err}")

# 3) Job Description Matching (Deterministic)
@app.post("/ai/job-match", response_model=JobMatchResponse)
def get_job_match(request: JobMatchRequest):
    try:
        if not request.resume_text.strip() or not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Resume text and job description cannot be empty.")
            
        match_results = match_resume_to_jd(request.resume_text, request.job_description)
        return match_results
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Semantic matching execution error: {err}")

# 4) Interview Question Generator
@app.post("/ai/interview-questions", response_model=InterviewQuestionsResponse)
def get_interview_questions(request: InterviewQuestionsRequest):
    try:
        questions = generate_questions(
            skills=request.skills,
            projects=request.projects,
            experience=request.experience,
            education=request.education,
            company=request.company
        )
        return questions
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Interview question generation error: {err}")

# 5) Answer Evaluation Endpoint
@app.post("/ai/evaluate-answer", response_model=AnswerEvaluationResponse)
def evaluate_answer(request: AnswerEvaluationRequest):
    try:
        evaluation = evaluate_user_answer(
            question=request.question,
            user_answer=request.user_answer,
            expected_answer=request.expected_answer,
            difficulty=request.difficulty
        )
        return evaluation
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Answer evaluation error: {err}")

# 6) Career Role Prediction
@app.post("/ai/career-prediction", response_model=CareerPredictionResponse)
def get_career_prediction(request: CareerPredictionRequest):
    try:
        predictions = predict_career_roles(
            skills=request.skills,
            experience=request.experience,
            education=request.education
        )
        return {"recommended_roles": predictions}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Career prediction calculations error: {err}")

# 7) Professional Summary Generator
@app.post("/ai/resume-summary", response_model=SummaryResponse)
def get_resume_summary(request: SummaryRequest):
    try:
        summary_text = generate_summary(
            name=request.name,
            skills=request.skills,
            education=request.education,
            experience=request.experience,
            projects=request.projects
        )
        return {"summary": summary_text}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Summary generation error: {err}")

# 8) Resume Insights Explainer
@app.post("/ai/resume-insights", response_model=ResumeInsightsResponse)
def get_resume_insights_endpoint(request: ResumeInsightsRequest):
    try:
        insights = generate_resume_insights(
            name=request.name,
            resume_text=request.resume_text,
            skills=request.skills,
            experience=request.experience,
            projects=request.projects,
            education=request.education,
            ats_score=request.ats_score
        )
        return insights
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Resume insights compilation error: {err}")

# 9) Resume Chat Assistant
@app.post("/ai/chat-resume", response_model=ChatResumeResponse)
def post_chat_resume(request: ChatResumeRequest):
    try:
        response_text = chat_resume(
            resume_text=request.resume_text,
            history=request.history,
            message=request.message,
            ats_score=request.ats_score,
            skills=request.skills,
            experience=request.experience,
            projects=request.projects
        )
        return {"response": response_text}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Resume chat assistant error: {err}")

# 10) Job Description Analyzer
@app.post("/ai/job-analysis", response_model=JobAnalysisResponse)
def post_job_analysis(request: JobAnalysisRequest):
    print(f"[FastAPI] Entering /ai/job-analysis endpoint. Payload skills count: {len(request.skills)}")
    try:
        analysis = analyze_job_description(
            resume_text=request.resume_text,
            job_description=request.job_description,
            skills=request.skills
        )
        print(f"[FastAPI] Exiting /ai/job-analysis endpoint successfully. Match score: {analysis.get('match_percentage')}%")
        return analysis
    except Exception as err:
        print(f"[FastAPI] Error in /ai/job-analysis: {err}")
        raise HTTPException(status_code=500, detail=f"Job analysis error: {err}")


# 11) Skill Roadmap
@app.post("/ai/learning-roadmap", response_model=SkillRoadmapResponse)
def post_learning_roadmap(request: SkillRoadmapRequest):
    try:
        roadmap = generate_skill_roadmap(skill=request.skill)
        return roadmap
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Learning roadmap generation error: {err}")

# 12) Resume Rewriter
@app.post("/ai/rewrite-resume", response_model=RewriteResumeResponse)
def post_rewrite_resume(request: RewriteResumeRequest):
    try:
        rewritten = rewrite_resume_content(
            section=request.section,
            content=request.content,
            skills=request.skills
        )
        return {"rewritten_content": rewritten}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Resume rewriter error: {err}")

# 13) Project Explainer
@app.post("/ai/project-explainer", response_model=ProjectExplainerResponse)
def post_project_explainer(request: ProjectExplainerRequest):
    try:
        explanation = explain_project_details(
            project_name=request.project_name,
            skills=request.skills
        )
        return explanation
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Project explainer error: {err}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
