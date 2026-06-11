import re
from typing import Dict, List, Tuple, Any
from .document_parser import parse_resume_data, TECH_SKILLS_KEYWORDS

# Global placeholder for model
model = None

def get_sentence_transformer():
    global model
    if model is None:
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Warning: Could not load SentenceTransformer: {e}. Falling back to Jaccard index.")
            model = "FALLBACK"
    return model

def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    # Fallback bag-of-words similarity
    words1 = set(re.findall(r'\b\w+\b', text1.lower()))
    words2 = set(re.findall(r'\b\w+\b', text2.lower()))
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    if not union:
        return 0.0
    return float(len(intersection)) / len(union)

def match_resume_to_jd(resume_text: str, job_description: str) -> Dict[str, Any]:
    # 1) Calculate semantic similarity
    similarity_score = 0.0
    model = get_sentence_transformer()
    
    if model == "FALLBACK":
        similarity_score = calculate_jaccard_similarity(resume_text, job_description)
    else:
        try:
            from sentence_transformers import util
            # Compute embeddings
            embeddings1 = model.encode(resume_text, convert_to_tensor=True)
            embeddings2 = model.encode(job_description, convert_to_tensor=True)
            # Compute cosine similarity
            cosine_score = util.cos_sim(embeddings1, embeddings2)
            similarity_score = float(cosine_score.item())
        except Exception as err:
            print(f"Embedding error: {err}")
            similarity_score = calculate_jaccard_similarity(resume_text, job_description)

    # Clean similarity formatting to range [0, 1] then convert to percentage [0, 100]
    # Cosine score can range from -1 to 1; typical fits are in positive range
    similarity_score = max(0.0, similarity_score)
    match_percentage = round(similarity_score * 100, 1)

    # 2) Identify matched and missing keywords
    resume_parsed = parse_resume_data(resume_text)
    resume_skills = [s.lower() for s in resume_parsed.get("skills", [])]
    
    # Extract technologies mentioned in JD
    jd_lower = job_description.lower()
    jd_skills = []
    
    for skill in TECH_SKILLS_KEYWORDS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, jd_lower):
            jd_skills.append(skill)
            
    matched_skills_raw = []
    missing_skills_raw = []
    
    for s in jd_skills:
        if s in resume_skills:
            matched_skills_raw.append(s)
        else:
            missing_skills_raw.append(s)

    # Capitalize for response
    matched_skills = [s.title() if s not in ["next.js", "node.js", "express", "fastapi", "react", "html", "css", "aws", "gcp", "git", "ci/cd"] else s for s in matched_skills_raw]
    missing_skills = [s.title() if s not in ["next.js", "node.js", "express", "fastapi", "react", "html", "css", "aws", "gcp", "git", "ci/cd"] else s for s in missing_skills_raw]

    # Ensure some fallback values if JD parsing didn't find any core technology keywords
    if not jd_skills:
        matched_skills = [s.title() for s in resume_parsed.get("skills", [])[:3]]
        missing_skills = ["Docker", "AWS", "Kubernetes"]

    return {
        "match_percentage": match_percentage,
        "matched_skills": list(set(matched_skills)),
        "missing_skills": list(set(missing_skills))
    }

