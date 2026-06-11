import re
from typing import Dict
from .document_parser import parse_resume_data

# Common strong action verbs for experience checking
ACTION_VERBS = [
    "designed", "developed", "engineered", "implemented", "managed", "led", "architected",
    "optimized", "improved", "increased", "decreased", "spearheaded", "built", "created"
]

def calculate_ats_score(resume_text: str) -> Dict[str, int]:
    # 1) Parse the data to get structure
    parsed = parse_resume_data(resume_text)
    
    # 2) Calculate Skills Score (out of 100)
    # Based on count of tech skills matching developer list (aiming for 5-15 skills)
    skills_count = len(parsed.get("skills", []))
    if skills_count == 0:
        skills_score = 20
    elif 1 <= skills_count <= 4:
        skills_score = 60
    elif 5 <= skills_count <= 12:
        skills_score = 90
    else: # 13+ is excellent density
        skills_score = 100

    # 3) Calculate Education Score (out of 100)
    # Check if education entries have valid degrees, colleges, and years
    edu_list = parsed.get("education", [])
    if not edu_list or (len(edu_list) == 1 and edu_list[0].get("year") == "N/A"):
        education_score = 30
    else:
        # Check completeness of the first item
        first_edu = edu_list[0]
        completeness = 0
        if first_edu.get("degree") != "Degree": completeness += 40
        if first_edu.get("college") != "Institution": completeness += 40
        if first_edu.get("year") != "Year": completeness += 20
        education_score = max(50, completeness)

    # 4) Calculate Experience Score (out of 100)
    # Check number of experience items and presence of action verbs
    exp_list = parsed.get("experience", [])
    exp_text_block = " ".join(exp_list).lower()
    
    verb_hits = sum(1 for verb in ACTION_VERBS if verb in exp_text_block)
    
    if not exp_list or (len(exp_list) == 1 and "N/A" in exp_list[0]):
        experience_score = 30
    else:
        # Score based on verb count and list size
        base = min(80, len(exp_list) * 20) # 4+ items is 80 points
        bonus = min(20, verb_hits * 5) # 4+ strong verbs gets 20 bonus points
        experience_score = base + bonus

    # 5) Calculate Formatting Score (out of 100)
    # Checks contact completeness, section headers separation, and clean length
    formatting_score = 100
    
    # Email and phone check
    personal = parsed.get("personal_info", {})
    if not personal.get("email"):
        formatting_score -= 20
    if not personal.get("phone"):
        formatting_score -= 20
        
    # Check text lengths (too long/short)
    word_count = len(resume_text.split())
    if word_count < 100 or word_count > 1500:
        formatting_score -= 15
        
    # Check if headers are present
    headers_detected = 0
    text_upper = resume_text.upper()
    for header in ["EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"]:
        if header in text_upper:
            headers_detected += 1
            
    formatting_score -= (4 - headers_detected) * 10
    formatting_score = max(40, formatting_score)

    # 6) Calculate Overall Weighted ATS Score (out of 100)
    # Weights: Experience (40%), Skills (30%), Education (15%), Formatting (15%)
    ats_score = int(
        (experience_score * 0.40) +
        (skills_score * 0.30) +
        (education_score * 0.15) +
        (formatting_score * 0.15)
    )

    return {
        "atsScore": ats_score,
        "skillsScore": skills_score,
        "educationScore": education_score,
        "experienceScore": experience_score,
        "formattingScore": formatting_score
    }
