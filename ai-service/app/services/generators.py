import random
import re
import json
from typing import List, Dict, Any, Optional
from app.services.gemini_service import generate_gemini_response

def clean_project_names(projects: List[str]) -> List[str]:
    project_names = []
    for proj in projects:
        proj_clean = proj.strip()
        # Remove common bullets/prefixes like ➢, •, -, *, etc.
        proj_clean = re.sub(r'^[➢•\-\*\s]+', '', proj_clean).strip()
        
        # Check if it starts with Title: or Name:
        title_match = re.match(r'^(Title|Name|Project|Title\s*:\s*|Name\s*:\s*|Project\s*Name\s*:\s*)\s*(.*)', proj_clean, re.IGNORECASE)
        if title_match:
            name_part = title_match.group(2).strip()
            if len(name_part) > 3:
                project_names.append(name_part)
        elif "role:" not in proj_clean.lower() and "description:" not in proj_clean.lower() and "duration:" not in proj_clean.lower() and "technologies:" not in proj_clean.lower() and "tech stack:" not in proj_clean.lower() and len(proj_clean) > 5 and len(proj_clean) < 60:
            # Check for common action verbs that indicate a description line rather than a title
            action_verbs = ["built", "developed", "implemented", "created", "designed", "engineered", "worked", "managed", "integrated", "utilized", "used", "wrote"]
            first_word = proj_clean.split()[0].lower() if proj_clean.split() else ""
            if not any(v in first_word for v in action_verbs):
                project_names.append(proj_clean)

    # Deduplicate keeping order
    seen = set()
    deduped_names = []
    for name in project_names:
        if name.lower() not in seen:
            seen.add(name.lower())
            deduped_names.append(name)
            
    # Default fallback if empty
    if not deduped_names:
        deduped_names = ["AI-Powered Resume Analyzer"]
    return deduped_names


# =====================================================================
# Legacy/Fallback Structured Data Pools
# =====================================================================
TECH_QUESTIONS_POOL = [
    {
        "category": "Backend Development",
        "difficulty": "Medium",
        "question": "How does Node.js handle concurrency since it is single-threaded?",
        "answer": "Node.js utilizes an event-driven, non-blocking I/O model governed by the Event Loop. When an asynchronous operation (like reading a file or querying a database) is triggered, Node.js offloads the task to the system kernel or the Libuv thread pool. Once finished, a callback is queued in the task queue and executed on the single main thread when it becomes idle.",
        "key_points": ["Event Loop", "Non-blocking I/O", "Libuv Thread Pool", "Task Queue", "Single-threaded execution"],
        "follow_ups": ["What is the difference between setImmediate() and setTimeout()?", "How does the Libuv thread pool size affect performance?", "What happens if a CPU-bound operation blocks the main thread?"],
        "context": "Node.js"
    },
    {
        "category": "Frontend Development",
        "difficulty": "Medium",
        "question": "What is the Virtual DOM in React, and how does it optimize rendering?",
        "answer": "The Virtual DOM is a lightweight, in-memory representation of the real DOM. When state changes, React builds a new Virtual DOM tree, compares it with the previous one using a diffing algorithm (Reconciliation), and calculates the minimal set of changes required. It then batches these updates and applies them to the real DOM, avoiding expensive layout repaints.",
        "key_points": ["Virtual DOM", "Diffing Algorithm", "Reconciliation", "Batching DOM updates", "Repaint minimization"],
        "follow_ups": ["What is the time complexity of React's diffing algorithm?", "Why is using array index as a key prop discouraged?", "What is React Fiber?"],
        "context": "React"
    },
    {
        "category": "Database Configuration",
        "difficulty": "Hard",
        "question": "When would you prefer MongoDB over a traditional relational database (MySQL/PostgreSQL)?",
        "answer": "MongoDB is preferred when handling unstructured or semi-structured data (like nested resume files), when horizontal scalability (sharding) is required out-of-the-box, or when rapid prototyping calls for dynamic schema changes. Relational databases are better suited for applications requiring complex joins, strict ACID compliance, and multi-row transactional consistency.",
        "key_points": ["NoSQL Document model", "Schema flexibility", "ACID transactions", "Horizontal sharding", "Query patterns"],
        "follow_ups": ["How does MongoDB handle indexing for nested arrays?", "What is the CAP Theorem and where does MongoDB stand?", "What are document references vs embedded documents?"],
        "context": "MongoDB"
    },
    {
        "category": "API Design",
        "difficulty": "Medium",
        "question": "Explain the concept of RESTful APIs and how they operate.",
        "answer": "REST (Representational State Transfer) is an architectural style for building network APIs. It operates on resources identified by URIs, utilizing standard HTTP verbs (GET, POST, PUT, DELETE) to define actions. It is stateless (no client state saved on the server), supports cacheability, and typically formats payload data as JSON or XML.",
        "key_points": ["Statelessness", "HTTP Methods mapping", "Resource URIs", "Cache control headers", "JSON payloads"],
        "follow_ups": ["What is the difference between PUT and PATCH?", "Explain REST statelessness and how sessions are handled.", "What are idempotent HTTP methods?"],
        "context": "Web API"
    },
    {
        "category": "Security Engineering",
        "difficulty": "Hard",
        "question": "Explain the difference between JWT authentication and session-based authentication.",
        "answer": "JWT (JSON Web Token) authentication is stateless; the user session is stored on the client as a signed token, and the server validates the signature on each request. Session-based authentication is stateful; the session data is stored in a database or server memory, and only a session ID is sent to the client in a cookie.",
        "key_points": ["Stateless vs Stateful", "Token verification", "Cookie storage", "XSS/CSRF vectors", "Database overhead"],
        "follow_ups": ["Where is the safest place to store a JWT on the client side?", "How do you revoke a JWT before its expiration?", "What is a refresh token and how is it used?"],
        "context": "JWT"
    }
]

HR_QUESTIONS_POOL = [
    {
        "category": "Collaboration",
        "difficulty": "Easy",
        "question": "Tell us about a time you had to resolve a conflict within a development team.",
        "answer": "In my previous project, we had a debate over whether to use Redux or React Context. I scheduled a quick sync where both sides listed pros and cons. We decided to use Context for auth settings and Redux for cached resume logs. This structured approach resolved the conflict and kept us on schedule.",
        "key_points": ["Conflict resolution", "Active listening", "Compromise", "Structured meetings"],
        "follow_ups": ["What would you do if a teammate refused to compromise?", "How do you handle disagreement with a technical lead?"],
        "context": "Conflict Resolution"
    },
    {
        "category": "Problem Solving",
        "difficulty": "Medium",
        "question": "Describe a scenario where you faced a difficult technical challenge and how you solved it.",
        "answer": "During resume parsing, large PDF uploads crashed the service due to memory leaks. I profile-traced the file streams and found pdfplumber instances weren't closing. I wrapped the parser in context managers ('with' statements) and introduced garbage collection, reducing memory usage by 60%.",
        "key_points": ["Problem tracing", "Memory profiling", "Debugging", "Optimization outcomes"],
        "follow_ups": ["How do you approach a bug you have never seen before?", "What tools do you use for profiling memory in Python?"],
        "context": "Technical Challenge"
    },
    {
        "category": "Adaptability",
        "difficulty": "Easy",
        "question": "How do you handle shifting requirements or deadlines mid-sprint?",
        "answer": "I focus on open communication and immediate prioritization. If requirements change, I sync with the project lead to identify what must be deferred to accommodate the change. This prevents overload and ensures we still deliver quality deliverables.",
        "key_points": ["Priority adjustment", "Agile sprint alignment", "Communication", "Scope management"],
        "follow_ups": ["Can you give an example of when a deadline changed on you?", "How do you handle stress under pressure?"],
        "context": "Shifting Priorities"
    }
]

COMPANY_POOLS = {
    "Google": [
        {
            "category": "Data Structures & Algorithms",
            "difficulty": "Hard",
            "question": "How would you find the shortest path in a dynamic grid where blockages can appear and disappear in real-time?",
            "answer": "You can use an incremental pathfinding algorithm like D* Lite or Lifelong Planning A* (LPA*). These algorithms cache search states from previous search steps and update path solutions locally rather than recalculating the entire graph from scratch, saving significant computation time.",
            "key_points": ["D* Lite", "LPA*", "Incremental search", "Graph optimization", "Dynamic grid"],
            "follow_ups": ["What is the difference in complexity between standard A* and dynamic D* Lite?", "How do you handle multi-agent pathfinding on the same grid?"],
            "context": "Google DSA"
        },
        {
            "category": "System Design",
            "difficulty": "Hard",
            "question": "Design a globally distributed rate limiter that can handle 100,000 requests per second with sub-millisecond latency.",
            "answer": "I would use a Token Bucket or Sliding Window Log algorithm, caching rate limiting counters in a geo-replicated Redis Cluster. To achieve sub-millisecond latency, we can implement local in-memory caching at edge gateways (like Cloudflare Workers) with asynchronous background syncing to Redis, using token batches to avoid cross-region network roundtrips.",
            "key_points": ["Token Bucket", "Redis Cluster", "Edge Gateways", "Token batching", "Async syncing"],
            "follow_ups": ["How do you handle clock drift in a distributed system for rate limiting?", "What happens if the Redis cache suffers a partition failure?"],
            "context": "Google System Design"
        }
    ],
    "Amazon": [
        {
            "category": "Leadership Principles",
            "difficulty": "Medium",
            "question": "Describe a situation where you had to make a quick decision without complete information. What was the outcome?",
            "answer": "This relates to Amazon's 'Bias for Action'. During a resume parsing rollout, we faced intermittent API timeouts. Instead of waiting days for full load tests, I analyzed error frequencies, noticed a pattern with PDF streams, and immediately implemented a retry middleware with exponential backoff. This kept the app online, and we analyzed full logs later to implement a permanent pdfplumber fix.",
            "key_points": ["Bias for Action", "Calculated risk", "Telemetry tracking", "Mitigation strategies"],
            "follow_ups": ["How do you determine if a decision is reversible or irreversible?", "Would you make the same choice if data loss was a potential risk?"],
            "context": "Amazon Bias for Action"
        }
    ]
}

def generate_project_category_questions(project_name: str, skills: List[str]) -> List[Dict[str, Any]]:
    skills_lower = [s.lower() for s in skills]
    categories = []

    # Simple mapped stacks
    fe_tech = "React" if "react" in skills_lower else "Frontend UI"
    be_tech = "FastAPI & Python" if "fastapi" in skills_lower else "Node.js"
    db_tech = "MongoDB" if "mongodb" in skills_lower else "SQL Database"

    categories.append({
        "category": "Architecture",
        "questions": [
            {
                "category": "Architecture",
                "difficulty": "Medium",
                "question": f"Explain the end-to-end architecture of the '{project_name}' project.",
                "answer": f"The '{project_name}' follows a decoupled architecture. The frontend UI ({fe_tech}) is isolated from the backend API gateway ({be_tech}), which coordinates data access with the database ({db_tech}) and handles resource-intensive calculations asynchronously.",
                "key_points": ["Decoupled layers", "Frontend separation", "Backend API gateway", "Database abstraction"],
                "follow_ups": ["What are the main drawbacks of a decoupled architecture?", "How does client-server communication handle network interruptions?"],
                "context": project_name
            }
        ]
    })
    categories.append({
        "category": "Frontend",
        "questions": [
            {
                "category": "Frontend",
                "difficulty": "Medium",
                "question": f"Why did you choose {fe_tech} for building the client side of '{project_name}'?",
                "answer": f"We selected {fe_tech} because of its component-based model, virtual DOM reconciliation, and fast load speeds. This allowed us to build custom reusable widgets consistently.",
                "key_points": ["Component reuse", "Virtual DOM diffing", "Declarative rendering"],
                "follow_ups": ["What is the difference between props and state in React?"],
                "context": fe_tech
            }
        ]
    })
    categories.append({
        "category": "Backend",
        "questions": [
            {
                "category": "Backend",
                "difficulty": "Medium",
                "question": f"Explain the routing and controller layout of the {be_tech} backend in '{project_name}'.",
                "answer": f"The backend follows the Router-Controller pattern. Routes define the endpoints and register middleware (like token authentication), invoking controller functions that process parameters and query the database.",
                "key_points": ["Router-Controller pattern", "Middlewares", "Business controllers"],
                "follow_ups": ["Why is it important to keep routers thin and controllers thick?"],
                "context": be_tech
            }
        ]
    })
    return categories

# =====================================================================
# Gemini-powered Generators (with legacy fallbacks)
# =====================================================================

def generate_questions(skills: List[str], projects: List[str], experience: List[str], education: Optional[List[Dict[str, Any]]] = None, company: str = "General") -> Dict[str, Any]:
    import uuid
    cleaned_projects = clean_project_names(projects)
    prompt = f"""
    You are an expert placement technical interviewer. Based on the candidate's profile:
    Skills: {skills}
    Projects: {cleaned_projects}
    Experience: {experience}
    Education: {education or []}
    Target Company: {company}
    Randomization Seed: {uuid.uuid4().hex}
    
    Generate unique interview questions. Please vary the questions generated to cover different aspects of the technology stack and avoid repeating previously standard, introductory, or cliché definition questions (such as how Spring Boot auto-configuration works, how the Node.js event loop works, what is the Virtual DOM, etc.). Instead, pick specific advanced scenarios, edge cases, performance trade-offs, or integration challenges related to the candidate's skills.
    1. Generate 4 Technical questions. Make them aligned to target company requirements (e.g. Google -> DSA, System Design; Amazon -> Scalability, Leadership; TCS -> Fundamentals, Aptitude).
    2. Generate questions for each of the projects in the resume. Return a list of project items, each with 2 categories, and 1 question per category.
    3. Generate 3 HR/Situational questions.
    
    You must output a valid JSON matching this structure:
    {{
    "technical_questions": [
        {{
        "category": "string",
        "difficulty": "Easy|Medium|Hard",
        "question": "string",
        "answer": "string",
        "key_points": ["string"],
        "follow_ups": ["string"],
        "context": "string"
        }}
    ],
    "project_questions": [
        {{
        "project_name": "string",
        "categories": [
            {{
            "category": "Architecture|Frontend|Backend|Database|API Design|Security|Deployment|Scalability|Testing|Future Improvements",
            "questions": [
                {{
                "category": "string",
                "difficulty": "Easy|Medium|Hard",
                "question": "string",
                "answer": "string",
                "key_points": ["string"],
                "follow_ups": ["string"],
                "context": "string"
                }}
            ]
            }}
        ]
        }}
    ],
    "hr_questions": [
        {{
        "category": "string",
        "difficulty": "Easy|Medium|Hard",
        "question": "string",
        "answer": "string",
        "key_points": ["string"],
        "follow_ups": ["string"],
        "context": "string"
        }}
    ]
    }}
    """
    
    # Attempt Gemini
    res_text = generate_gemini_response(prompt, json_format=True, temperature=0.85)
    if res_text:
        try:
            cleaned_text = res_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = re.sub(r'^```(?:json)?\n?', '', cleaned_text)
                cleaned_text = re.sub(r'\n?```$', '', cleaned_text).strip()
            data = json.loads(cleaned_text)
            # Basic schema validation checks
            if "technical_questions" in data and "project_questions" in data and "hr_questions" in data:
                tech_qs = []
                for q in data.get("technical_questions", []):
                    tech_qs.append({
                        "category": str(q.get("category", "General")),
                        "difficulty": str(q.get("difficulty", "Medium")),
                        "question": str(q.get("question", "")),
                        "answer": str(q.get("answer", "")),
                        "key_points": [str(kp) for kp in q.get("key_points", [])],
                        "follow_ups": [str(fp) for fp in q.get("follow_ups", [])],
                        "context": str(q.get("context", "")) if q.get("context") else None
                    })
                data["technical_questions"] = tech_qs

                hr_qs = []
                for q in data.get("hr_questions", []):
                    hr_qs.append({
                        "category": str(q.get("category", "HR")),
                        "difficulty": str(q.get("difficulty", "Easy")),
                        "question": str(q.get("question", "")),
                        "answer": str(q.get("answer", "")),
                        "key_points": [str(kp) for kp in q.get("key_points", [])],
                        "follow_ups": [str(fp) for fp in q.get("follow_ups", [])],
                        "context": str(q.get("context", "")) if q.get("context") else None
                    })
                data["hr_questions"] = hr_qs

                proj_qs = []
                for p in data.get("project_questions", []):
                    categories = []
                    for cat in p.get("categories", []):
                        questions = []
                        for q in cat.get("questions", []):
                            questions.append({
                                "category": str(q.get("category", "General")),
                                "difficulty": str(q.get("difficulty", "Medium")),
                                "question": str(q.get("question", "")),
                                "answer": str(q.get("answer", "")),
                                "key_points": [str(kp) for kp in q.get("key_points", [])],
                                "follow_ups": [str(fp) for fp in q.get("follow_ups", [])],
                                "context": str(q.get("context", "")) if q.get("context") else None
                            })
                        categories.append({
                            "category": str(cat.get("category", "Architecture")),
                            "questions": questions
                        })
                    proj_qs.append({
                        "project_name": str(p.get("project_name", "")),
                        "categories": categories
                    })
                data["project_questions"] = proj_qs
                return data
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Interview Questions JSON: {e}")

    # Fallback Local Heuristics
    print("[Generators] Falling back to rule-based Interview Question pools.")
    tech_pool = COMPANY_POOLS.get(company, TECH_QUESTIONS_POOL)
    if company not in COMPANY_POOLS:
        skills_lower = [s.lower() for s in skills]
        matched = []
        for q in TECH_QUESTIONS_POOL:
            if q["context"].lower() in skills_lower or any(s in q["category"].lower() for s in skills_lower):
                matched.append(q)
        if len(matched) < 4:
            remaining = [q for q in TECH_QUESTIONS_POOL if q not in matched]
            matched.extend(remaining)
        tech_questions = random.sample(matched, min(len(matched), 4))
    else:
        pool_copy = list(tech_pool)
        if len(pool_copy) < 4:
            remaining = [q for q in TECH_QUESTIONS_POOL if q not in pool_copy]
            pool_copy.extend(remaining)
        tech_questions = random.sample(pool_copy, min(len(pool_copy), 4))

    project_questions = []
    for proj in cleaned_projects:
        project_questions.append({
            "project_name": proj,
            "categories": generate_project_category_questions(proj, skills)
        })

    hr_questions = random.sample(HR_QUESTIONS_POOL, min(len(HR_QUESTIONS_POOL), 3))
    return {
        "technical_questions": tech_questions,
        "project_questions": project_questions,
        "hr_questions": hr_questions
    }

def evaluate_user_answer(question: str, user_answer: str, expected_answer: str, difficulty: str) -> Dict[str, Any]:
    prompt = f"""
    You are an expert technical recruiter. Evaluate the candidate's answer for the following question.
    Question: {question}
    Expected Ideal Answer: {expected_answer}
    Candidate's Answer: {user_answer}
    Difficulty: {difficulty}
    
    Perform a complete assessment. Score the response out of 10. Identify strengths, missing key points, an improved/ideal drop-in replacement answer, and general feedback.
    
    You must output a valid JSON matching this structure:
    {{
    "score": 8.0,
    "strengths": ["string"],
    "missing_points": ["string"],
    "improved_answer": "string",
    "feedback": "string"
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "score" in data and "feedback" in data:
                data["score"] = float(data.get("score", 7.0))
                data["strengths"] = [str(x) for x in data.get("strengths", [])]
                data["missing_points"] = [str(x) for x in data.get("missing_points", [])]
                data["improved_answer"] = str(data.get("improved_answer", ""))
                data["feedback"] = str(data.get("feedback", ""))
                return data
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Evaluation JSON: {e}")

    # Fallback NLP Matching logic
    print("[Generators] Falling back to NLP-based Answer evaluation.")
    from app.services.matcher import get_sentence_transformer, calculate_jaccard_similarity
    model = get_sentence_transformer()
    
    similarity_score = 0.0
    if model == "FALLBACK":
        similarity_score = calculate_jaccard_similarity(user_answer, expected_answer)
    else:
        try:
            from sentence_transformers import util
            emb1 = model.encode(user_answer, convert_to_tensor=True)
            emb2 = model.encode(expected_answer, convert_to_tensor=True)
            similarity_score = float(util.cos_sim(emb1, emb2).item())
        except Exception:
            similarity_score = calculate_jaccard_similarity(user_answer, expected_answer)
            
    similarity_score = max(0.0, min(1.0, similarity_score))
    expected_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', expected_answer.lower()))
    user_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', user_answer.lower()))
    STOP_WORDS = {"with", "that", "this", "from", "they", "them", "have", "were", "been", "would", "should"}
    expected_keywords = [w for w in expected_words if w not in STOP_WORDS]
    matched_keywords = [w for w in expected_keywords if w in user_words]
    missing_keywords = [w for w in expected_keywords if w not in user_words]
    
    strengths = [f"Aligned with core concepts: {', '.join([w.title() for w in matched_keywords[:2]])}"] if matched_keywords else ["Demonstrated fundamental context."]
    missing_points = [f"Missed details regarding: {', '.join([w.title() for w in missing_keywords[:2]])}"] if missing_keywords else ["Cover details in full."]
    
    keyword_ratio = len(matched_keywords) / len(expected_keywords) if expected_keywords else 0.5
    raw_score = (similarity_score * 0.7 + keyword_ratio * 0.3) * 10
    score = min(10, max(1, round(raw_score)))
    
    return {
        "score": float(score),
        "strengths": strengths,
        "missing_points": missing_points,
        "improved_answer": expected_answer,
        "feedback": "Processed via semantic similarity matcher fallback."
    }

def predict_career_roles(skills: List[str], experience: List[str], education: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    prompt = f"""
    You are an AI Career Forecast advisor. Based on the candidate's technical profile:
    Skills: {skills}
    Experience: {experience}
    Education: {education}
    
    Predict the top 3 recommended career roles. For each role, provide:
    - Match score (percentage string, e.g. "82%")
    - Salary range in India (LPA string, e.g. "₹6-12 LPA")
    - List of required skills for this role
    - List of missing skills based on candidate's current skills
    - A week-by-week learning roadmap (minimum 3 steps)
    - A confidence float between 0.0 and 1.0 (for backward compatibility, e.g., 0.82)
    
    You must output a valid JSON matching this structure:
    {{
    "recommended_roles": [
        {{
        "role": "string",
        "match_score": "string",
        "roadmap": ["string"],
        "salary_range": "string",
        "required_skills": ["string"],
        "confidence": 0.82
        }}
    ]
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "recommended_roles" in data:
                roles = []
                for r in data.get("recommended_roles", []):
                    roles.append({
                        "role": str(r.get("role", "")),
                        "match_score": str(r.get("match_score", "70%")),
                        "roadmap": [str(x) for x in r.get("roadmap", [])],
                        "salary_range": str(r.get("salary_range", "₹6-12 LPA")),
                        "required_skills": [str(x) for x in r.get("required_skills", [])],
                        "missing_skills": [str(x) for x in r.get("missing_skills", [])],
                        "confidence": float(r.get("confidence", 0.7))
                    })
                return roles
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Career Prediction JSON: {e}")

    # Fallback weight-based predictions
    print("[Generators] Falling back to rule-based Career predictions.")
    skills_lower = [s.lower() for s in skills]
    role_weights = {
        "Frontend Engineer": ["react", "javascript", "html", "css", "tailwind", "typescript"],
        "Backend Engineer": ["node.js", "express.js", "python", "fastapi", "django", "rest api"],
        "Full Stack Engineer": ["react", "node.js", "express.js", "mongodb", "javascript"],
        "DevOps Engineer": ["docker", "kubernetes", "jenkins", "ci/cd", "aws", "git"]
    }
    
    predictions = []
    for role, keywords in role_weights.items():
        matched = [k for k in keywords if k in skills_lower or any(k in s for s in skills_lower)]
        match_count = len(matched)
        if len(keywords) > 0:
            base_confidence = match_count / len(keywords)
        else:
            base_confidence = 0.0
        confidence = min(0.95, max(0.1, base_confidence + 0.1))
        
        missing_skills = [k.title() for k in keywords if k not in matched]
        
        predictions.append({
            "role": role,
            "match_score": f"{int(confidence * 100)}%",
            "roadmap": [f"Deep dive into advanced {role} core features", f"Build 2 portfolio projects using {', '.join(keywords[:2])}", "Practice mock interview scenarios"],
            "salary_range": "₹4-10 LPA",
            "required_skills": [k.title() for k in keywords],
            "missing_skills": missing_skills,
            "confidence": float(round(confidence, 2))
        })
    predictions.sort(key=lambda x: x["confidence"], reverse=True)
    return predictions[:3]

def generate_summary(name: str, skills: List[str], education: List[Dict[str, Any]], experience: List[str], projects: List[str]) -> str:
    prompt = f"""
    Create a highly professional, quantified, active professional summary for a software developer.
    Name: {name}
    Skills: {skills}
    Education: {education}
    Experience: {experience}
    Projects: {projects}
    
    Ensure it is written in 3rd person, sounds extremely professional, and contains active verbs. Limit to 3 sentences.
    """
    res_text = generate_gemini_response(prompt)
    if res_text:
        return res_text.strip()
        
    # Fallback
    skills_chunk = ", ".join(skills[:5]) if skills else "Software Engineering"
    return f"Result-driven software developer proficient in {skills_chunk}. Demonstrates strong technical capabilities in designing scalable applications and solving complex coding challenges."

def generate_resume_insights(name: str, resume_text: str, skills: List[str], experience: List[str], projects: List[str], education: List[Dict[str, Any]], ats_score: int) -> Dict[str, Any]:
    prompt = f"""
    You are an expert recruiter and resume critic. Analyze the candidate's details:
    Name: {name}
    Skills: {skills}
    Experience: {experience}
    Projects: {projects}
    Education: {education}
    Current Deterministic ATS Score: {ats_score}%
    Resume Full Text: {resume_text[:2000]}
    
    Evaluate the profile and return structured insights:
    1. Recruiter Verdict:
    - Recruiter Rating (numeric out of 10, e.g., 8.5)
    - ATS Rating (numeric out of 10, e.g., 7.2)
    - Technical Readiness (numeric out of 10, e.g., 8.0)
    - Placement Readiness (percentage string, e.g., "75%")
    - Hiring Probability (percentage string, e.g., "68%")
    - Top Concerns (List of specific areas of concern on the resume)
    - Suggested Improvements (List of actionable tips)
    - Final Recommendation (recruiter's final hiring summary statement)
    2. ATS Score Explanation:
    - Strengths (Why the score is good in some areas)
    - Weaknesses (Where it lags)
    - Missing Keywords (Keywords missing that limit ATS pass rate)
    - Experience Gaps (Gaps in roles, projects or years)
    - Project Gaps (Lacking architectural depth or metrics)
    - Explanation (Human-readable explanation of why the current ATS score is {ats_score}%)
    3. ATS Growth Predictor:
    - Generate 3 skill/improvement recommendations, each with an expected score impact percentage (e.g. "+5%", "+4%", "+3%") and a short reason.
    4. Resume Summary Generation:
    - Professional Summary (quantified, active)
    - LinkedIn About Section (compelling about text)
    - Headline (catchy professional headline)
    
    You must output a valid JSON matching this structure:
    {{
    "recruiter_verdict": {{
        "recruiter_rating": 8.5,
        "ats_rating": 7.2,
        "technical_readiness": 8.0,
        "placement_readiness": "75%",
        "hiring_probability": "68%",
        "top_concerns": ["string"],
        "suggested_improvements": ["string"],
        "final_recommendation": "string"
    }},
    "ats_explanation": {{
        "strengths": ["string"],
        "weaknesses": ["string"],
        "missing_keywords": ["string"],
        "experience_gaps": ["string"],
        "project_gaps": ["string"],
        "explanation": "string"
    }},
    "growth_recommendations": [
        {{
        "skill": "string",
        "impact": "string",
        "reason": "string"
        }}
    ],
    "resume_summary": {{
        "professional_summary": "string",
        "linkedin_about": "string",
        "headline": "string"
    }}
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "recruiter_verdict" in data and "ats_explanation" in data:
                verdict = data["recruiter_verdict"]
                verdict["recruiter_rating"] = float(verdict.get("recruiter_rating", 8.0))
                verdict["ats_rating"] = float(verdict.get("ats_rating", 7.0))
                verdict["technical_readiness"] = float(verdict.get("technical_readiness", 8.0))
                verdict["placement_readiness"] = str(verdict.get("placement_readiness", "75%"))
                verdict["hiring_probability"] = str(verdict.get("hiring_probability", "68%"))
                
                verdict["top_concerns"] = [str(x) for x in verdict.get("top_concerns", [])]
                verdict["suggested_improvements"] = [str(x) for x in verdict.get("suggested_improvements", [])]
                verdict["final_recommendation"] = str(verdict.get("final_recommendation", ""))
                
                explanation = data["ats_explanation"]
                explanation["strengths"] = [str(x) for x in explanation.get("strengths", [])]
                explanation["weaknesses"] = [str(x) for x in explanation.get("weaknesses", [])]
                explanation["missing_keywords"] = [str(x) for x in explanation.get("missing_keywords", [])]
                explanation["experience_gaps"] = [str(x) for x in explanation.get("experience_gaps", [])]
                explanation["project_gaps"] = [str(x) for x in explanation.get("project_gaps", [])]
                explanation["explanation"] = str(explanation.get("explanation", ""))
                
                growth_recs = []
                for item in data.get("growth_recommendations", []):
                    growth_recs.append({
                        "skill": str(item.get("skill", "")),
                        "impact": str(item.get("impact", "")),
                        "reason": str(item.get("reason", ""))
                    })
                data["growth_recommendations"] = growth_recs
                
                summary = data.get("resume_summary", {})
                data["resume_summary"] = {
                    "professional_summary": str(summary.get("professional_summary", "")),
                    "linkedin_about": str(summary.get("linkedin_about", "")),
                    "headline": str(summary.get("headline", ""))
                }
                return data
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Resume Insights JSON: {e}")

    # Fallback Response
    print("[Generators] Falling back to heuristic Resume Insights generation.")
    missing_pool = ["Docker", "AWS", "CI/CD", "Kubernetes"]
    skills_lower = [s.lower() for s in skills]
    missing = [m for m in missing_pool if m.lower() not in skills_lower]
    
    return {
        "recruiter_verdict": {
            "recruiter_rating": 6.5,
            "ats_rating": round(float(ats_score) / 10.0, 1),
            "technical_readiness": 7.0,
            "placement_readiness": "60%",
            "hiring_probability": "55%",
            "top_concerns": ["Resume missing critical cloud deployment keywords.", "Quantifiable achievements are scarce in project descriptions."],
            "suggested_improvements": ["Include Docker or AWS in your technical skills.", "Quantify project outcomes with numerical metrics."],
            "final_recommendation": "The candidate has decent coding skills, but needs to optimize formatting and add devops tools to increase placement chances."
        },
        "ats_explanation": {
            "strengths": ["Clear formatting layout.", "Core programming languages are listed."],
            "weaknesses": ["Lacks cloud infrastructure references.", "No automated test suites mentioned."],
            "missing_keywords": missing,
            "experience_gaps": ["No official industry internship duration specified."],
            "project_gaps": ["Project details lack structural/architectural details."],
            "explanation": f"The resume scored {ats_score}% based on active experience action verbs and formatting completeness checks. Adding DevOps keywords and cloud certifications will boost this score."
        },
        "growth_recommendations": [
            {"skill": "Docker", "impact": "+5%", "reason": "Containerization skills are highly sought after by recruiters."},
            {"skill": "AWS Cloud", "impact": "+4%", "reason": "Cloud environment credentials increase interview callbacks."},
            {"skill": "CI/CD Pipelines", "impact": "+3%", "reason": "Automating test deployment demonstrates enterprise readiness."}
        ],
        "resume_summary": {
            "professional_summary": f"Result-driven software developer proficient in {', '.join(skills[:3])}. Experienced in building scalable web apps.",
            "linkedin_about": f"Hi! I am a passionate developer specializing in {', '.join(skills[:3])}. Check out my projects below!",
            "headline": f"Software Engineer | Developer skilled in {skills[0] if skills else 'Coding'}"
        }
    }

def chat_resume(resume_text: str, history: List[Dict[str, str]], message: str, ats_score: int, skills: List[str], experience: List[str], projects: List[str]) -> str:
    # Build conversation block
    history_str = ""
    for h in history:
        history_str += f"{h.get('role', 'user').title()}: {h.get('content', '')}\n"
        
    prompt = f"""
    You are ResumePulse Coach, an expert AI Career Assistant.
    You have full context of the candidate's resume:
    Resume Text: {resume_text[:2000]}
    Current ATS Score: {ats_score}%
    Skills: {skills}
    Experience: {experience}
    Projects: {projects}
    
    Here is the conversation history:
    {history_str}
    
    User message: {message}
    
    Provide a professional, conversational response guiding the user on how to improve, what skills to learn, whether they are ready for placement, and answers to their specific questions. Keep the response clean and action-oriented. Limit response to 4 sentences.
    """
    res_text = generate_gemini_response(prompt)
    if res_text:
        return res_text.strip()
    return "I am currently offline. Please set your GEMINI_API_KEY environment variable or try again later."

def analyze_job_description(resume_text: str, job_description: str, skills: List[str]) -> Dict[str, Any]:
    print(f"[Generators] Starting analyze_job_description. Input skills count: {len(skills)}")
    prompt = f"""
    You are an AI Job Matching Critic. Analyze the candidate's resume text and current skills against the Job Description.
    Candidate Skills: {skills}
    Resume Text: {resume_text[:2000]}
    Job Description: {job_description[:2000]}
    
    Compare the requirements and the profile. Return the semantic match %, matching skills, missing skills, estimated interview probability, resume weaknesses, and a detailed explanation of why the match is high/low.
    
    You must output a valid JSON matching this structure:
    {{
    "match_percentage": 75.0,
    "missing_skills": ["string"],
    "matching_skills": ["string"],
    "interview_probability": "High|Medium|Low",
    "resume_weaknesses": ["string"],
    "explanation": "string"
    }}
    """
    
    try:
        print("[Generators] Sending analyze_job_description request to Gemini...")
        res_text = generate_gemini_response(prompt, json_format=True)
        print(f"[Generators] Received response from Gemini: {res_text[:100] if res_text else 'None'}")
        
        if res_text:
            try:
                data = json.loads(res_text)
                if "match_percentage" in data and "explanation" in data:
                    pct = data["match_percentage"]
                    if isinstance(pct, str):
                        pct = float(pct.replace("%", "").strip())
                    else:
                        pct = float(pct)
                    data["match_percentage"] = pct
                    
                    data["missing_skills"] = [str(x) for x in data.get("missing_skills", [])]
                    data["matching_skills"] = [str(x) for x in data.get("matching_skills", [])]
                    data["resume_weaknesses"] = [str(x) for x in data.get("resume_weaknesses", [])]
                    data["interview_probability"] = str(data.get("interview_probability", "Medium"))
                    data["explanation"] = str(data.get("explanation", ""))
                    print(f"[Generators] Finished analyze_job_description (Gemini). Match: {data['match_percentage']}%")
                    return data
            except Exception as e:
                print(f"[Generators] Failed to parse Gemini JD Analysis JSON: {e}")
    except Exception as gemini_err:
        print(f"[Generators] Error calling Gemini in analyze_job_description: {gemini_err}")

    # Fallback semantic matching
    print("[Generators] Falling back to local semantic matching algorithm.")
    try:
        from app.services.matcher import match_resume_to_jd
        match_res = match_resume_to_jd(resume_text, job_description)
        
        fallback_res = {
            "match_percentage": match_res["match_percentage"],
            "missing_skills": match_res["missing_skills"],
            "matching_skills": match_res["matched_skills"],
            "interview_probability": "Medium" if match_res["match_percentage"] > 60 else "Low",
            "resume_weaknesses": ["Resume lacks direct experience keywords found in the job posting."],
            "explanation": f"Matched using fallback SentenceTransformers model. Identified a {match_res['match_percentage']}% match profile compatibility."
        }
        print(f"[Generators] Finished analyze_job_description (Fallback). Match: {fallback_res['match_percentage']}%")
        return fallback_res
    except Exception as fallback_err:
        print(f"[Generators] Critical fallback error: {fallback_err}")
        return {
            "match_percentage": 50.0,
            "missing_skills": ["Docker", "AWS"],
            "matching_skills": skills[:2] if skills else ["React"],
            "interview_probability": "Medium",
            "resume_weaknesses": ["General experience gap compared to JD requirements."],
            "explanation": "Absolute fallback analysis returned due to an internal nlp engine error."
        }

def generate_skill_roadmap(skill: str) -> Dict[str, Any]:
    prompt = f"""
    Generate a personalized week-by-week learning roadmap for the skill '{skill}'.
    Create a 2-week sequence, lists of recommended topics, estimated time, beginner learning resources, intermediate projects, and advanced projects.
    
    You must output a valid JSON matching this structure:
    {{
    "skill": "{skill}",
    "learning_sequence": [
        {{
        "week": "Week 1",
        "topics": ["string"],
        "description": "string"
        }},
        {{
        "week": "Week 2",
        "topics": ["string"],
        "description": "string"
        }}
    ],
    "recommended_topics": ["string"],
    "estimated_time": "string",
    "beginner_resources": ["string"],
    "intermediate_projects": ["string"],
    "advanced_projects": ["string"]
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "learning_sequence" in data:
                seqs = []
                for s in data.get("learning_sequence", []):
                    seqs.append({
                        "week": str(s.get("week", "Week 1")),
                        "topics": [str(x) for x in s.get("topics", [])],
                        "description": str(s.get("description", ""))
                    })
                data["learning_sequence"] = seqs
                data["skill"] = str(data.get("skill", skill))
                data["recommended_topics"] = [str(x) for x in data.get("recommended_topics", [])]
                data["estimated_time"] = str(data.get("estimated_time", "2 Weeks"))
                data["beginner_resources"] = [str(x) for x in data.get("beginner_resources", [])]
                data["intermediate_projects"] = [str(x) for x in data.get("intermediate_projects", [])]
                data["advanced_projects"] = [str(x) for x in data.get("advanced_projects", [])]
                return data
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Roadmap JSON: {e}")

    # Fallback
    print(f"[Generators] Falling back to static roadmap for skill '{skill}'.")
    return {
        "skill": skill,
        "learning_sequence": [
            {"week": "Week 1", "topics": [f"{skill} fundamentals", f"{skill} configuration"], "description": f"Understand core concepts of {skill} and set up local development environments."},
            {"week": "Week 2", "topics": [f"Advanced {skill} tools", f"{skill} integration"], "description": f"Build a small service utilizing {skill} and integrate it with your database."}
        ],
        "recommended_topics": [f"{skill} core syntax", "Integration APIs", "Testing"],
        "estimated_time": "2 Weeks",
        "beginner_resources": [f"Official {skill} Documentation", f"W3Schools {skill} Tutorial"],
        "intermediate_projects": [f"{skill} REST API server"],
        "advanced_projects": [f"Distributed microservice with {skill}"]
    }

def rewrite_resume_content(section: str, content: str, skills: List[str]) -> str:
    prompt = f"""
    You are a senior resume expert and ATS optimization specialist. Your job is to completely transform resume content into powerful, quantified, achievement-driven language.

    Section Type: {section}
    Original Content: {content}
    Candidate Skills: {skills}

    STRICT REWRITING RULES:
    1. Convert ALL vague phrases into specific, quantified achievements. Examples:
       - "worked on backend" -> "Architected and deployed RESTful Node.js APIs serving 10,000+ daily requests with 99.9% uptime"
       - "built a website" -> "Engineered a full-stack React web application with JWT authentication, reducing load time by 40%"
       - "helped with database" -> "Optimized MongoDB query pipelines, cutting average response latency from 800ms to 120ms"
    2. Start EVERY bullet or sentence with a STRONG action verb (Engineered, Architected, Spearheaded, Delivered, Optimized, Reduced, Increased, Designed, Implemented, Automated).
    3. Add SPECIFIC NUMBERS wherever possible (%, ms, users, requests, hours saved, team size).
    4. Naturally embed relevant keywords from skills: {skills}
    5. Keep the same general meaning but make it 2-3x more impressive and ATS-friendly.
    6. The rewritten content MUST be substantially different and better than the original.
    7. Do NOT just append words to the original - FULLY REWRITE it.

    You must output a valid JSON matching this structure:
    {{
    "rewritten_content": "string (the fully rewritten, improved content)"
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "rewritten_content" in data and data["rewritten_content"].strip():
                result = data["rewritten_content"].strip()
                # Reject if it's nearly identical to input
                if result.lower() != content.lower() and len(result) > len(content) * 0.5:
                    return result
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Rewrite JSON: {e}")

    # Improved fallback: apply meaningful transformations
    print("[Generators] Falling back to enhanced content transformer.")
    weak_phrases = {
        "worked on": "Engineered and deployed",
        "helped with": "Spearheaded development of",
        "did": "Delivered",
        "made": "Architected",
        "built": "Developed and optimized",
        "created": "Designed and implemented",
        "used": "Leveraged",
        "was responsible for": "Owned end-to-end",
        "responsible for": "Led and delivered",
    }
    improved = content
    for weak, strong in weak_phrases.items():
        improved = improved.replace(weak, strong)
    skills_str = ", ".join(skills[:3]) if skills else "modern technologies"
    return f"{improved} — utilizing {skills_str} to deliver measurable, scalable business impact."

def explain_project_details(project_name: str, skills: List[str]) -> Dict[str, Any]:
    prompt = f"""
    Explain the project details for placement preparation.
    Project Name: {project_name}
    Skills: {skills}
    
    Generate architectural explanations, interview questions, system design questions, scalability questions, security questions, and suggestions for improvement.
    
    You must output a valid JSON matching this structure:
    {{
    "project_name": "{project_name}",
    "architecture": "string",
    "interview_questions": [
        {{"question": "string", "answer": "string", "difficulty": "Easy|Medium|Hard"}}
    ],
    "system_design_questions": [
        {{"question": "string", "answer": "string", "difficulty": "Easy|Medium|Hard"}}
    ],
    "scalability_questions": [
        {{"question": "string", "answer": "string", "difficulty": "Easy|Medium|Hard"}}
    ],
    "security_questions": [
        {{"question": "string", "answer": "string", "difficulty": "Easy|Medium|Hard"}}
    ],
    "improvements": ["string"]
    }}
    """
    res_text = generate_gemini_response(prompt, json_format=True)
    if res_text:
        try:
            data = json.loads(res_text)
            if "architecture" in data and "interview_questions" in data:
                def clean_q_list(q_list):
                    res = []
                    for q in q_list:
                        res.append({
                            "question": str(q.get("question", "")),
                            "answer": str(q.get("answer", "")),
                            "difficulty": str(q.get("difficulty", "Medium"))
                        })
                    return res
                
                data["project_name"] = str(data.get("project_name", project_name))
                data["architecture"] = str(data.get("architecture", ""))
                data["interview_questions"] = clean_q_list(data.get("interview_questions", []))
                data["system_design_questions"] = clean_q_list(data.get("system_design_questions", []))
                data["scalability_questions"] = clean_q_list(data.get("scalability_questions", []))
                data["security_questions"] = clean_q_list(data.get("security_questions", []))
                data["improvements"] = [str(x) for x in data.get("improvements", [])]
                return data
        except Exception as e:
            print(f"[Generators] Failed to parse Gemini Project Explainer JSON: {e}")

    # Fallback
    print(f"[Generators] Falling back to static project explainer for '{project_name}'.")
    project_categories = generate_project_category_questions(project_name, skills)
    fallback_q = []
    for cat in project_categories:
        for q in cat["questions"]:
            fallback_q.append({
                "question": q["question"],
                "answer": q["answer"],
                "difficulty": q["difficulty"]
            })
            
    return {
        "project_name": project_name,
        "architecture": f"The project '{project_name}' is structured using a clean client-server split. The frontend communicates via REST APIs with the backend gateway, which handles business logic and acts as the database controller.",
        "interview_questions": fallback_q[:2],
        "system_design_questions": [
            {"question": f"How would you model the database relationships in '{project_name}' for scale?", "answer": "Use normalization to avoid redundancies and create compound indexes on foreign keys to optimize joins.", "difficulty": "Hard"}
        ],
        "scalability_questions": [
            {"question": "How would you handle a 10x traffic spike in this application?", "answer": "Implement horizontal scaling of stateless backend containers behind a Load Balancer and add a Redis cache layer.", "difficulty": "Hard"}
        ],
        "security_questions": [
            {"question": "How did you secure user credentials and API requests?", "answer": "Passwords are hashed using bcrypt, and routes are protected using stateless JWT authentication with token validation headers.", "difficulty": "Medium"}
        ],
        "improvements": ["Containerize the backend with Docker", "Implement automated unit testing suites", "Add a Redis caching layer to speed up API queries"]
    }
