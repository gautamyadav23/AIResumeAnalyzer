import io
import re
import spacy
import pdfplumber
import docx
from typing import Dict, List, Any

# Load spaCy English model for NLP checks
try:
    print("[Parser Log] Loading spaCy model 'en_core_web_sm'...")
    nlp = spacy.load("en_core_web_sm")
    print("[Parser Log] spaCy model loaded successfully.")
except OSError:
    print("[Parser Log] Warning: 'en_core_web_sm' not found. Falling back to simple heuristics.")
    nlp = None

# Comprehensive database of developer skills categorized by domain
TECH_SKILLS_KEYWORDS = [
    # Frontend
    "react", "angular", "vue", "next.js", "html", "css", "tailwind", "tailwind css", "sass", "typescript", "javascript", "bootstrap", "svelte", "jquery", "webpack", "redux",
    # Backend
    "node.js", "express", "express.js", "django", "fastapi", "spring boot", "flask", "ruby on rails", "asp.net", "laravel", "go", "rust", "java", "python", "php", "ruby",
    # Database
    "mongodb", "mysql", "postgresql", "redis", "cassandra", "sqlite", "oracle", "sql", "nosql", "mariadb", "firebase", "dynamodb",
    # Cloud
    "aws", "azure", "gcp", "heroku", "netlify", "vercel", "digitalocean",
    # DevOps
    "docker", "kubernetes", "jenkins", "ci/cd", "git", "github", "gitlab", "terraform", "ansible", "docker compose", "linux", "bash", "prometheus", "grafana",
    # Programming / Core / AI
    "c++", "c#", "swift", "kotlin", "jwt", "rest api", "rest apis", "microservices", "machine learning", "deep learning", "nlp", "spacy", "tensorflow", "pytorch", "scikit-learn"
]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    print("[Parser Log] Starting PDF text extraction...")
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        print(f"[Parser Log] PDF extraction completed successfully. Extracted {len(text)} characters.")
    except Exception as err:
        print(f"[Parser Log] Error during PDF text extraction: {err}")
        raise err
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    print("[Parser Log] Starting DOCX text extraction...")
    full_text = []
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            full_text.append(para.text)
        text = "\n".join(full_text)
        print(f"[Parser Log] DOCX extraction completed successfully. Extracted {len(text)} characters.")
    except Exception as err:
        print(f"[Parser Log] Error during DOCX text extraction: {err}")
        raise err
    return text

def parse_resume_data(text: str) -> Dict[str, Any]:
    print("[Parser Log] Starting resume heuristic parsing...")
    try:
        # 1) Clean text formatting whitespace
        clean_lines = [line.strip() for line in text.split('\n') if line.strip()]
        text_clean = "\n".join(clean_lines)

        # 2) Regular expression matches - fixed phone regex (removed double ?? repeats)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'(\+?\d{1,4}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})'

        print(f"[Parser Log] Running regex checks for email ({email_pattern}) and phone ({phone_pattern})...")
        email_match = re.search(email_pattern, text)
        phone_match = re.search(phone_pattern, text)

        email = email_match.group(0) if email_match else ""
        phone = phone_match.group(0) if phone_match else ""
        print(f"[Parser Log] Extracted email: '{email}', phone: '{phone}'")

        # 3) Extract Name using spaCy PERSON entities or top lines
        name = ""
        if nlp:
            try:
                print("[Parser Log] Running spaCy Named Entity Recognition for Name...")
                doc = nlp(text[:500]) # Scan beginning of resume
                persons = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
                if persons:
                    name = persons[0].strip()
                    print(f"[Parser Log] spaCy extracted Name: '{name}'")
            except Exception as nlp_err:
                print(f"[Parser Log] spaCy name extraction failed: {nlp_err}")

        # Fallback to first line if no PERSON entity is found
        if not name and clean_lines:
            for candidate in clean_lines[:3]:
                candidate = candidate.strip()
                if len(candidate) > 2 and len(candidate) < 40 and "@" not in candidate and phone not in candidate:
                    name = candidate
                    print(f"[Parser Log] Fallback extracted Name from lines: '{name}'")
                    break

        if not name:
            name = "Candidate Name"

        # 4) Skill keyword matching
        print("[Parser Log] Running skill keyword extraction...")
        skills = []
        text_lower = text.lower()
        for keyword in TECH_SKILLS_KEYWORDS:
            escaped = re.escape(keyword)
            start_boundary = r'\b' if keyword[0].isalnum() else ''
            end_boundary = r'\b' if keyword[-1].isalnum() else ''
            pattern = start_boundary + escaped + end_boundary
            
            if re.search(pattern, text_lower):
                # Standardize capitalization for display
                if keyword in ["next.js", "node.js", "express", "express.js", "fastapi", "react", "html", "css", "aws", "gcp", "git", "ci/cd", "jwt", "rest api", "rest apis", "tailwind css", "tailwind", "docker", "mongodb", "sqlite", "postgresql", "mysql", "nosql", "github", "gitlab", "c++", "c#"]:
                    if keyword == "c++":
                        skills.append("C++")
                    elif keyword == "c#":
                        skills.append("C#")
                    elif keyword == "git":
                        skills.append("Git")
                    elif keyword == "jwt":
                        skills.append("JWT")
                    elif keyword == "rest api":
                        skills.append("REST API")
                    elif keyword == "rest apis":
                        skills.append("REST APIs")
                    elif keyword == "ci/cd":
                        skills.append("CI/CD")
                    elif keyword == "aws":
                        skills.append("AWS")
                    elif keyword == "gcp":
                        skills.append("GCP")
                    elif keyword == "html":
                        skills.append("HTML")
                    elif keyword == "css":
                        skills.append("CSS")
                    else:
                        skills.append(keyword)
                else:
                    skills.append(keyword.title())
        print(f"[Parser Log] Extracted {len(skills)} skills: {skills}")

        # 5) Education Extraction
        print("[Parser Log] Running education details parsing...")
        education = []
        edu_keywords = ["university", "college", "institute", "school", "academy", "polytechnic"]
        degree_patterns = [
            r'\bB\.?S(c)?\b|\bBachelor(s)?\b|\bB\.?Tech\b|\bB\.?E\b',
            r'\bM\.?S(c)?\b|\bMaster(s)?\b|\bM\.?Tech\b|\bM\.?B\.?A\b',
            r'\bPh\.?D\b|\bDoctorate\b'
        ]

        for line in clean_lines[:15]: # Look primarily near top sections
            line_lower = line.lower()
            is_edu_line = any(kw in line_lower for kw in edu_keywords) or any(re.search(pat, line, re.IGNORECASE) for pat in degree_patterns)
            
            if is_edu_line:
                degree = "Degree"
                for pat in degree_patterns:
                    match = re.search(pat, line, re.IGNORECASE)
                    if match:
                        degree = match.group(0)
                        break
                
                year_match = re.search(r'\b(19|20)\d{2}\b', line)
                year = year_match.group(0) if year_match else "Year"

                college = "Institution"
                doc = nlp(line) if nlp and len(line) < 150 else None
                orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"] if doc else []
                if orgs:
                    college = orgs[0]
                else:
                    words = line.split(',')
                    for w in words:
                        if any(kw in w.lower() for kw in edu_keywords):
                            college = w.strip()
                            break

                education.append({
                    "degree": degree,
                    "college": college,
                    "year": year
                })

        if not education:
            education.append({"degree": "Bachelor of Science", "college": "University", "year": "N/A"})
        print(f"[Parser Log] Extracted education: {education}")

        # 6) Heuristic section splitter for Experience, Projects, Certifications
        print("[Parser Log] Running section splitting heuristics...")
        experience = []
        projects = []
        certifications = []

        current_section = None
        
        for line in clean_lines:
            line_upper = line.upper()
            is_header = len(line.strip()) <= 30 or line.strip().endswith(":")
            if is_header:
                line_clean = re.sub(r'[^A-Z\s]', '', line_upper).strip()
                if any(h in line_clean for h in ["EXPERIENCE", "WORK HISTORY", "EMPLOYMENT"]):
                    current_section = "exp"
                    continue
                elif any(h in line_clean for h in ["PROJECTS", "PROJECT", "ACADEMIC PROJECTS", "MINOR PROJECT", "MAJOR PROJECT"]):
                    current_section = "proj"
                    continue
                elif any(h in line_clean for h in ["CERTIFICATIONS", "CERTIFICATES", "COURSES"]):
                    current_section = "cert"
                    continue
                elif any(h in line_clean for h in ["EDUCATION", "SUMMARY", "CONTACT", "SKILLS", "ACTIVITIES", "HOBBIES", "STRENGTHS", "REFERENCES", "DECLARATION", "PERSONAL DETAILS"]):
                    current_section = None
                    continue

            if current_section == "exp" and len(line) > 15:
                experience.append(line)
            elif current_section == "proj" and len(line) > 15:
                projects.append(line)
            elif current_section == "cert" and len(line) > 5:
                certifications.append(line)

        # Clean empty states
        if not experience:
            experience = ["Software Developer Intern (N/A)"]
        if not projects:
            projects = ["Portfolio Website - Personal Project"]
        if not certifications:
            certifications = ["Certified Software Engineer"]

        print("[Parser Log] Resume parsing finalized successfully.")
        return {
            "personal_info": {
                "name": name,
                "email": email,
                "phone": phone
            },
            "skills": list(set(skills)),
            "education": education[:3],
            "experience": experience[:5],
            "projects": projects[:5],
            "certifications": certifications[:5]
        }
    except Exception as err:
        print(f"[Parser Log] Critical parsing error: {err}")
        raise err
