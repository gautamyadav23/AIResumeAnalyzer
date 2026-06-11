// Pre-generated sample data for the Try Demo Resume option (Demo Mode)

export const demoProfiles = {
  software_engineer: {
    resume: {
      _id: 'demo',
      fileName: 'Demo_Software_Engineer_Resume.pdf',
      status: 'analyzed',
      atsScore: 84,
      skillsScore: 82,
      educationScore: 85,
      experienceScore: 85,
      formattingScore: 90,
      createdAt: new Date().toISOString(),
      parsedData: {
        skills: ["React", "Node.js", "Express", "MongoDB", "AWS", "Docker", "JavaScript", "Git", "HTML5", "CSS3"],
        experience: [
          "Senior Frontend Architect at Career Corp (2023 - Present) - Led React and Docker containerization upgrades.",
          "Software Engineer at Dev Studio (2020 - 2023) - Built responsive layouts and integrated AWS services."
        ],
        projects: [
          "AI Resume Analyzer - Configured multi-container Docker deployments.",
          "SaaS Portfolio - Implemented AWS serverless endpoints."
        ]
      }
    },
    atsReport: {
      score: 84,
      atsScore: 84,
      fileName: 'Demo_Software_Engineer_Resume.pdf',
      parsedData: {
        skills: ["React", "Node.js", "Express", "MongoDB", "AWS", "Docker", "JavaScript", "Git", "HTML5", "CSS3"],
        experience: [
          "Senior Frontend Architect at Career Corp (2023 - Present) - Led React and Docker containerization upgrades.",
          "Software Engineer at Dev Studio (2020 - 2023) - Built responsive layouts and integrated AWS services."
        ],
        projects: [
          "AI Resume Analyzer - Configured multi-container Docker deployments.",
          "SaaS Portfolio - Implemented AWS serverless endpoints."
        ]
      },
      recruiterVerdict: {
        hiringProbability: 92,
        atsRating: 8.4,
        technicalReadiness: 90,
        communicationReadiness: 88,
        projectStrength: 85,
        resumeQuality: 88,
        verdictBadge: "Strong Candidate" // Strong Candidate, Shortlist, Needs Improvement
      }
    },
    insights: {
      resume_summary: {
        professional_summary: "Results-driven Software Engineer with 5+ years of experience specializing in React frontend architectures, containerized Docker deployments, and AWS infrastructure."
      },
      missing_skills: ["TypeScript", "GraphQL", "TailwindCSS"],
      prioritized_missing_skills: [
        { skill: "TypeScript", impact: "High", reason: "Fundamental for modern scalable React codebases." },
        { skill: "GraphQL", impact: "Medium", reason: "Requested in advanced enterprise data layer APIs." },
        { skill: "TailwindCSS", impact: "Low", reason: "Standard for fast visual utility styling." }
      ],
      growth_recommendations: [
        { skill: "TypeScript", impact: "High", reason: "Fundamental for modern scalable React codebases." },
        { skill: "GraphQL", impact: "Medium", reason: "Requested in advanced enterprise data layer APIs." },
        { skill: "TailwindCSS", impact: "Low", reason: "Standard for fast visual utility styling." }
      ],
      verdict: "Strong Match",
      strengths: ["Strong React core knowledge", "Demonstrated containerization experience with Docker", "AWS cloud integrations"],
      weaknesses: ["Lacks TypeScript static typing", "No GraphQL API consumption listed"],
      ats_explanation: {
        missing_keywords: ["TypeScript", "GraphQL", "TailwindCSS", "Redis", "CI/CD"],
        explanation: "The candidate demonstrates strong software engineering capabilities, specifically in React and Docker. The multi-stage Docker configs showcase solid operational knowledge. We recommend shortlisting them for frontend roles immediately, with follow-up on TypeScript type safety."
      }
    },
    comparisonData: {
      version_count: 2,
      initial_score: 72,
      score_difference: 13,
      added_skills: ["React", "Docker", "AWS"],
      removed_skills: ["jQuery", "SVN"],
      v1: {
        atsScore: 72,
        matchScore: 68,
        hiringProbability: 48,
        skills: ["JavaScript", "jQuery", "HTML", "CSS"]
      },
      v2: {
        atsScore: 85,
        matchScore: 82,
        hiringProbability: 71,
        skills: ["React", "JavaScript", "Docker", "AWS", "HTML", "CSS"]
      }
    },
    jobMatch: {
      match_percentage: 82,
      matching_skills: ["React", "JavaScript", "Docker", "AWS"],
      missing_skills: ["TypeScript", "GraphQL"],
      interview_probability: "High",
      resume_weaknesses: [
        "Lacks type safety indicators (TypeScript).",
        "Missing GraphQL client querying schemas."
      ],
      explanation: "The candidate exhibits strong compliance with core runtime requirements (React and Docker). Integrating TypeScript will elevate the fit to a near-perfect match."
    },
    careerPredictions: [
      {
        role: "Senior Frontend Engineer",
        match_score: "92%",
        salary_range: "$120,000 - $150,000",
        required_skills: ["React", "JavaScript", "TypeScript", "TailwindCSS", "Docker", "AWS"],
        missing_skills: ["TypeScript", "TailwindCSS"],
        roadmap: [
          "Learn TypeScript basics & complete React + TS online training",
          "Refactor existing React components to strict TS definitions",
          "Adopt Tailwind utility-first styling patterns in place of CSS modules",
          "Deploy optimized production TS builds via AWS Amplify"
        ]
      },
      {
        role: "Full Stack Engineer",
        match_score: "85%",
        salary_range: "$110,000 - $138,000",
        required_skills: ["React", "Node.js", "Express", "MongoDB", "Docker", "AWS"],
        missing_skills: ["Node.js", "Express", "MongoDB"],
        roadmap: [
          "Learn backend development with Node.js and Express",
          "Design and build secure RESTful API endpoints",
          "Connect and optimize queries using MongoDB database",
          "Containerize full-stack services utilizing Docker Compose"
        ]
      }
    ],
    interviewQuestions: {
      technical_questions: [
        {
          question: "Explain how React's Virtual DOM works.",
          answer: "React maintains an in-memory representation of the UI called the Virtual DOM. When state changes, it generates a new Virtual DOM tree, compares it with the previous one (reconciliation), and updates only the changed elements in the real browser DOM.",
          key_points: ["Virtual DOM", "Reconciliation", "Diffing Algorithm"],
          difficulty: "Medium",
          context: "React"
        },
        {
          question: "What is a multi-stage Docker build, and why is it useful?",
          answer: "Multi-stage builds allow you to use multiple FROM statements in a single Dockerfile. You can compile code in an initial environment (containing heavy tooling), then copy only the compiled static binaries or assets into a final, lightweight production runtime container. This drastically reduces the final image size.",
          key_points: ["Multi-stage build", "Image optimization", "Nginx static serving"],
          difficulty: "Hard",
          context: "Docker"
        }
      ],
      project_questions: [
        {
          project_name: "AI Resume Analyzer",
          categories: [
            {
              category: "System Design",
              questions: [
                {
                  question: "How did you design the backend API integration for spascing and text scraping?",
                  answer: "The backend is structured into a gateway tier (Node.js/Express) which handles authentication and route validation, and an AI service tier (FastAPI/spaCy/Gemini) that performs document parsing and score computations. This separation isolates heavy NLP processing from client session gateways.",
                  key_points: ["Microservice design", "API separation", "Process isolation"],
                  difficulty: "Medium",
                  context: "Architecture"
                }
              ]
            }
          ]
        }
      ],
      hr_questions: [
        {
          question: "Describe a time you solved a complex technical disagreement in a team.",
          answer: "In a previous project, we disagreed on using MongoDB vs SQL. Instead of arguing, I created a quick benchmark script matching our workload. The results showed MongoDB was 4x faster for our document queries, which aligned the team based on raw data.",
          key_points: ["Benchmarks", "Workload simulations", "Data-driven decisions"],
          difficulty: "Easy",
          context: "Conflict Resolution"
        }
      ],
      project_explainer: {
        architecture: "The AI Career Copilot utilizes a multi-container microservice layout. Node.js Express coordinates user sessions, resume uploads, and database states in MongoDB. Python FastAPI wraps spaCy for NLP entity analysis and communicates with Gemini for insights. Docker Compose orchestrates the service lifecycles.",
        system_design_questions: [
          {
            question: "How would you migrate the system to handle 10,000 resume uploads per hour?",
            answer: "I would decouple the upload request from the parsing process using an asynchronous task queue. Uploaded files would land in an S3 bucket, publishing an event to a RabbitMQ/AWS SQS queue. A pool of FastAPI parser workers would consume tasks, ensuring the client connection receives an instant ACK."
          }
        ],
        scalability_questions: [
          {
            question: "How would you cache recommendations to minimize Gemini LLM costs?",
            answer: "I would implement a Redis cache layer. The hash of the resume text combined with the job description would serve as the cache key. Any duplicate scans would resolve instantly from Redis, eliminating redundant, costly API roundtrips."
          }
        ],
        security_questions: [
          {
            question: "How do you protect the system from malicious script execution via PDF uploads?",
            answer: "We validate file magic numbers, verify mime-types, restrict size limits, and parse text in an isolated worker sandbox without executing document scripts. Sensitive personal data can also be scrubbed using PII filters before processing."
          }
        ],
        improvements: [
          "Introduce Redis cache for API responses.",
          "Add RabbitMQ queue for asynchronous parser workloads.",
          "Implement client-side chunked file upload handlers."
        ]
      }
    },
    analytics: {
      total_questions: 15,
      practiced_count: 8,
      saved_count: 3,
      readiness_trend: [
        { name: 'June 1', Score: 60 },
        { name: 'June 4', Score: 65 },
        { name: 'June 7', Score: 72 },
        { name: 'June 10', Score: 84 }
      ],
      topic_mastery: [
        { topic: 'React', value: 85 },
        { topic: 'Node.js', value: 80 },
        { topic: 'Express', value: 75 },
        { topic: 'MongoDB', value: 78 },
        { topic: 'AWS', value: 65 },
        { topic: 'Docker', value: 70 }
      ]
    }
  },
  data_analyst: {
    resume: {
      _id: 'demo',
      fileName: 'Demo_Data_Analyst_Resume.pdf',
      status: 'analyzed',
      atsScore: 78,
      skillsScore: 76,
      educationScore: 80,
      experienceScore: 82,
      formattingScore: 85,
      createdAt: new Date().toISOString(),
      parsedData: {
        skills: ["Python", "SQL", "Tableau", "PowerBI", "Excel", "Pandas", "NumPy", "Scikit-Learn", "Git", "Statistics"],
        experience: [
          "Data Analyst at Analytics Lab (2022 - Present) - Created automated ETL pipelines using Python and SQL.",
          "Junior Analyst at Market Insights (2020 - 2022) - Built Tableau scorecards and performed market cohort analysis."
        ],
        projects: [
          "Customer Churn Dashboard - Visualized retention metrics in Tableau.",
          "E-commerce Sales Forecaster - Engineered predictive regression models in Python."
        ]
      }
    },
    atsReport: {
      score: 78,
      atsScore: 78,
      fileName: 'Demo_Data_Analyst_Resume.pdf',
      parsedData: {
        skills: ["Python", "SQL", "Tableau", "PowerBI", "Excel", "Pandas", "NumPy", "Scikit-Learn", "Git", "Statistics"],
        experience: [
          "Data Analyst at Analytics Lab (2022 - Present) - Created automated ETL pipelines using Python and SQL.",
          "Junior Analyst at Market Insights (2020 - 2022) - Built Tableau scorecards and performed market cohort analysis."
        ],
        projects: [
          "Customer Churn Dashboard - Visualized retention metrics in Tableau.",
          "E-commerce Sales Forecaster - Engineered predictive regression models in Python."
        ]
      },
      recruiterVerdict: {
        hiringProbability: 82,
        atsRating: 7.8,
        technicalReadiness: 80,
        communicationReadiness: 85,
        projectStrength: 78,
        resumeQuality: 80,
        verdictBadge: "Hire"
      }
    },
    insights: {
      resume_summary: {
        professional_summary: "Analytical Data Analyst with 4+ years of experience in statistics, Python ETL pipelines, Tableau dashboard generation, and predictive regression analytics."
      },
      missing_skills: ["R", "Airflow", "Redshift"],
      prioritized_missing_skills: [
        { skill: "R", impact: "High", reason: "Required for academic level hypothesis tests." },
        { skill: "Airflow", impact: "Medium", reason: "Standard tool for scheduling pipeline workflows." },
        { skill: "Redshift", impact: "Low", reason: "Used for big-data cloud analytics warehouses." }
      ],
      growth_recommendations: [
        { skill: "R", impact: "High", reason: "Required for academic level hypothesis tests." },
        { skill: "Airflow", impact: "Medium", reason: "Standard tool for scheduling pipeline workflows." },
        { skill: "Redshift", impact: "Low", reason: "Used for big-data cloud analytics warehouses." }
      ],
      verdict: "Good Match",
      strengths: ["Strong Python scripting capabilities", "Excellent visual metrics configuration", "Solid SQL querying"],
      weaknesses: ["Lacks workflow orchestrators (Airflow)", "No big data cloud warehouse experience"],
      ats_explanation: {
        missing_keywords: ["R", "Airflow", "Redshift", "Snowflake", "Hive"],
        explanation: "The candidate shows comprehensive data parsing and querying skills. The Tableau models show excellent communication capabilities. To improve callbacks, they should adopt automated orchestrators like Airflow."
      }
    },
    comparisonData: {
      version_count: 2,
      initial_score: 65,
      score_difference: 13,
      added_skills: ["Python", "Pandas", "Tableau"],
      removed_skills: ["SAS"],
      v1: {
        atsScore: 65,
        matchScore: 60,
        hiringProbability: 42,
        skills: ["SQL", "Excel", "SAS"]
      },
      v2: {
        atsScore: 78,
        matchScore: 75,
        hiringProbability: 68,
        skills: ["Python", "SQL", "Tableau", "Excel", "Pandas", "NumPy"]
      }
    },
    jobMatch: {
      match_percentage: 75,
      matching_skills: ["Python", "SQL", "Tableau", "Pandas"],
      missing_skills: ["Airflow", "Redshift"],
      interview_probability: "Medium",
      resume_weaknesses: [
        "No structured ETL scheduler listed.",
        "Cloud-based warehouse solutions are missing."
      ],
      explanation: "The candidate matches the visual reporting and querying requirements perfectly. Adding Airflow pipelines will boost their eligibility significantly."
    },
    careerPredictions: [
      {
        role: "Data Analyst II",
        match_score: "88%",
        salary_range: "$85,000 - $105,000",
        required_skills: ["Python", "SQL", "Tableau", "Pandas", "Statistics", "Airflow"],
        missing_skills: ["Airflow"],
        roadmap: [
          "Complete Airflow setup & scheduling tutorials",
          "Automate active Python scraper scripts using Airflow DAGs",
          "Deploy datasets directly to database warehouses",
          "Configure dashboard tracking metrics"
        ]
      },
      {
        role: "Business Intelligence Engineer",
        match_score: "80%",
        salary_range: "$95,000 - $120,000",
        required_skills: ["SQL", "Tableau", "PowerBI", "Python", "Redshift", "dbt"],
        missing_skills: ["Redshift", "dbt"],
        roadmap: [
          "Learn data transformation using dbt (data build tool)",
          "Practice loading and querying AWS Redshift databases",
          "Build BI pipelines serving PowerBI dashboards",
          "Integrate analytics schema checks"
        ]
      }
    ],
    interviewQuestions: {
      technical_questions: [
        {
          question: "What is the difference between a LEFT JOIN and an INNER JOIN in SQL?",
          answer: "An INNER JOIN returns only the rows where there is a match in both tables based on the join condition. A LEFT JOIN returns all rows from the left table, along with matching rows from the right table. If there is no match, the right table columns contain NULL values.",
          key_points: ["Join conditions", "NULL propagation", "Match rules"],
          difficulty: "Easy",
          context: "SQL"
        },
        {
          question: "Explain how you handle missing data in a Pandas DataFrame.",
          answer: "Depending on the dataset, I can either remove rows with missing entries using `dropna()`, fill them with placeholders/aggregates (like mean, median, or mode) using `fillna()`, or use interpolation methods. For time-series, forward/backward fill is preferred.",
          key_points: ["dropna", "fillna", "Imputation", "Mean/Median/Mode"],
          difficulty: "Medium",
          context: "Pandas"
        }
      ],
      project_questions: [
        {
          project_name: "Customer Churn Dashboard",
          categories: [
            {
              category: "Business Analysis",
              questions: [
                {
                  question: "How did you define churn rate in your customer analysis project?",
                  answer: "Churn rate was defined as the percentage of active subscribers who terminated their monthly contract within a specific 30-day window. I calculated it by dividing the total churned users in that period by the total starting active users.",
                  key_points: ["Churn rate formula", "Time window", "Active users definitions"],
                  difficulty: "Medium",
                  context: "Metrics"
                }
              ]
            }
          ]
        }
      ],
      hr_questions: [
        {
          question: "How do you explain technical analytical findings to a non-technical manager?",
          answer: "I avoid jargon and focus on visual indicators (charts, trends). I translate metrics into business outcomes—focusing on revenue, customer savings, or pipeline time optimization instead of coefficient scores or raw statistics.",
          key_points: ["Simple language", "Business value", "Tableau visualizations"],
          difficulty: "Easy",
          context: "Communication"
        }
      ],
      project_explainer: {
        architecture: "The customer churn analyzer pipeline extracts subscriber details from database logs, runs statistical aggregations using Python (Pandas/NumPy), compiles prediction probabilities, and loads results into Tableau spreadsheets.",
        system_design_questions: [
          {
            question: "How would you automate a Tableau dashboard refresh to trigger daily?",
            answer: "I would set up a cron job or an Airflow DAG. The script would run daily to query database updates, execute the cleaning script, output a fresh CSV/database table, and publish it directly to Tableau Online using Tableau Hyper APIs."
          }
        ],
        scalability_questions: [
          {
            question: "How would you handle analyzing 100GB of log data in Python?",
            answer: "Pandas runs in-memory, so for 100GB datasets, I would migrate the processing to PySpark or Dask. This allows distributing the data frames across multiple CPU clusters, avoiding out-of-memory errors."
          }
        ],
        security_questions: [
          {
            question: "How do you handle personal subscriber data (PII) during analysis?",
            answer: "We obscure PII elements (names, emails, credit cards) before analysis using hash functions (e.g. SHA-256) or drop these columns entirely if they do not contribute to churn prediction algorithms."
          }
        ],
        improvements: [
          "Migrate local pipeline scripts to Airflow.",
          "Introduce Snowflake database query endpoints.",
          "Adopt Spark for big-data logs parsing."
        ]
      }
    },
    analytics: {
      total_questions: 10,
      practiced_count: 5,
      saved_count: 2,
      readiness_trend: [
        { name: 'June 1', Score: 55 },
        { name: 'June 4', Score: 60 },
        { name: 'June 7', Score: 68 },
        { name: 'June 10', Score: 78 }
      ],
      topic_mastery: [
        { topic: 'SQL', value: 85 },
        { topic: 'Python', value: 75 },
        { topic: 'Tableau', value: 80 },
        { topic: 'Statistics', value: 70 }
      ]
    }
  },
  ai_ml_engineer: {
    resume: {
      _id: 'demo',
      fileName: 'Demo_AI_ML_Engineer_Resume.pdf',
      status: 'analyzed',
      atsScore: 89,
      skillsScore: 88,
      educationScore: 90,
      experienceScore: 88,
      formattingScore: 90,
      createdAt: new Date().toISOString(),
      parsedData: {
        skills: ["PyTorch", "TensorFlow", "Python", "Docker", "Kubernetes", "AWS", "Scikit-Learn", "SQL", "MLOps", "HuggingFace"],
        experience: [
          "Machine Learning Engineer at AI Labs (2022 - Present) - Deployed computer vision models using PyTorch and Docker.",
          "ML Engineer at DeepTech (2020 - 2022) - Scaled NLP transformer pipelines using Kubernetes and AWS Sagemaker."
        ],
        projects: [
          "Transformer NLP Pipeline - Deployed HuggingFace BERT models on Kubernetes.",
          "MLOps Model registry - Configured automated model training and Docker builds."
        ]
      }
    },
    atsReport: {
      score: 89,
      atsScore: 89,
      fileName: 'Demo_AI_ML_Engineer_Resume.pdf',
      parsedData: {
        skills: ["PyTorch", "TensorFlow", "Python", "Docker", "Kubernetes", "AWS", "Scikit-Learn", "SQL", "MLOps", "HuggingFace"],
        experience: [
          "Machine Learning Engineer at AI Labs (2022 - Present) - Deployed computer vision models using PyTorch and Docker.",
          "ML Engineer at DeepTech (2020 - 2022) - Scaled NLP transformer pipelines using Kubernetes and AWS Sagemaker."
        ],
        projects: [
          "Transformer NLP Pipeline - Deployed HuggingFace BERT models on Kubernetes.",
          "MLOps Model registry - Configured automated model training and Docker builds."
        ]
      },
      recruiterVerdict: {
        hiringProbability: 95,
        atsRating: 8.9,
        technicalReadiness: 94,
        communicationReadiness: 82,
        projectStrength: 92,
        resumeQuality: 90,
        verdictBadge: "Strong Hire"
      }
    },
    insights: {
      resume_summary: {
        professional_summary: "Advanced Machine Learning Engineer with 5+ years of experience designing neural networks in PyTorch, establishing MLOps workflows, and scaling GPU containers on Kubernetes."
      },
      missing_skills: ["CUDA", "Triton", "TensorRT"],
      prioritized_missing_skills: [
        { skill: "CUDA", impact: "High", reason: "Critical for writing custom GPU kernels." },
        { skill: "Triton", impact: "Medium", reason: "Required for high-performance model serving endpoints." },
        { skill: "TensorRT", impact: "Low", reason: "Accelerates model inference latency rates." }
      ],
      growth_recommendations: [
        { skill: "CUDA", impact: "High", reason: "Critical for writing custom GPU kernels." },
        { skill: "Triton", impact: "Medium", reason: "Required for high-performance model serving endpoints." },
        { skill: "TensorRT", impact: "Low", reason: "Accelerates model inference latency rates." }
      ],
      verdict: "Strong Match",
      strengths: ["Expert PyTorch knowledge", "Demonstrated container orchestration using Kubernetes", "Comprehensive ML deployment pipelines"],
      weaknesses: ["Lacks low-level GPU optimizations (CUDA)", "No model serving acceleration listed (Triton)"],
      ats_explanation: {
        missing_keywords: ["CUDA", "Triton", "TensorRT", "C++", "MLflow"],
        explanation: "The candidate demonstrates exceptional machine learning foundations. Their Kubernetes containerization workflows are production-ready. Adding GPU compilation skills like CUDA will make them a top-tier candidate."
      }
    },
    comparisonData: {
      version_count: 2,
      initial_score: 75,
      score_difference: 14,
      added_skills: ["PyTorch", "MLOps", "Kubernetes"],
      removed_skills: ["Matplotlib"],
      v1: {
        atsScore: 75,
        matchScore: 70,
        hiringProbability: 55,
        skills: ["Python", "TensorFlow", "Scikit-Learn", "Matplotlib"]
      },
      v2: {
        atsScore: 89,
        matchScore: 87,
        hiringProbability: 82,
        skills: ["PyTorch", "TensorFlow", "Python", "Docker", "Kubernetes", "AWS", "MLOps"]
      }
    },
    jobMatch: {
      match_percentage: 89,
      matching_skills: ["PyTorch", "Python", "Docker", "Kubernetes", "AWS"],
      missing_skills: ["CUDA", "Triton"],
      interview_probability: "High",
      resume_weaknesses: [
        "Missing custom GPU acceleration code details.",
        "Lacks low-latency model inference servers."
      ],
      explanation: "The candidate exhibits strong compliance with core model deployment guidelines. Their model scaling credentials (Kubernetes) make them a premium fit."
    },
    careerPredictions: [
      {
        role: "Senior Machine Learning Engineer",
        match_score: "95%",
        salary_range: "$145,000 - $185,000",
        required_skills: ["PyTorch", "Python", "Kubernetes", "MLOps", "CUDA", "Triton"],
        missing_skills: ["CUDA", "Triton"],
        roadmap: [
          "Study custom CUDA programming and parallel computation",
          "Migrate serving layers to Nvidia Triton Inference Server",
          "Implement model quantization using TensorRT",
          "Deploy microservice containers on AWS EKS"
        ]
      },
      {
        role: "MLOps Architect",
        match_score: "90%",
        salary_range: "$150,000 - $190,000",
        required_skills: ["Docker", "Kubernetes", "MLOps", "AWS", "Jenkins", "Terraform"],
        missing_skills: ["Jenkins", "Terraform"],
        roadmap: [
          "Learn infrastructure as code patterns using Terraform",
          "Build CI/CD automation pipelines utilizing Jenkins and Github Actions",
          "Configure automated Kubernetes autoscalers",
          "Monitor GPU telemetry in Prometheus"
        ]
      }
    ],
    interviewQuestions: {
      technical_questions: [
        {
          question: "Explain the vanishing gradient problem in Deep Learning and how to mitigate it.",
          answer: "During backpropagation, gradients are multiplied repeatedly as you go back through layers. If active functions (like Sigmoid) squeeze outputs between 0 and 1, the gradients shrink exponentially, causing early layers to train very slowly. Mitigation includes using ReLU activations, batch normalization, residual connections (ResNet), and weight initialization.",
          key_points: ["Backpropagation multiplication", "Sigmoid limitations", "ReLU activation", "Residual connections"],
          difficulty: "Medium",
          context: "Deep Learning"
        },
        {
          question: "What is the difference between Data Parallelism and Model Parallelism in PyTorch?",
          answer: "Data Parallelism (DP/DDP) splits the batch across multiple GPUs, running the same model copy on each GPU, and averaging gradients during synchronization. Model Parallelism splits the model layers across different GPUs because the model itself is too large to fit in a single GPU's VRAM.",
          key_points: ["Batch splitting", "Layer splitting", "VRAM limits", "DDP communications"],
          difficulty: "Hard",
          context: "ML Engineering"
        }
      ],
      project_questions: [
        {
          project_name: "Transformer NLP Pipeline",
          categories: [
            {
              category: "Model Deployment",
              questions: [
                {
                  question: "How did you scale the transformer serving pipeline to handle load spikes?",
                  answer: "I deployed the BERT models on Kubernetes, configuring Horizontal Pod Autoscaling (HPA) based on GPU utilization. I also packaged the model in a Docker container, exposing endpoints via FastAPI and utilizing Redis to cache recurrent queries.",
                  key_points: ["HPA autoscaler", "GPU metric triggers", "FastAPI endpoints"],
                  difficulty: "Hard",
                  context: "Kubernetes"
                }
              ]
            }
          ]
        }
      ],
      hr_questions: [
        {
          question: "How do you align business objectives with experimental research goals?",
          answer: "I set strict KPI metrics early on. Instead of doing open-ended model tuning, I check target accuracies needed to improve the product. For example, I aim to reduce classification error by 5% because it increases click-through conversions by 2%. I align model improvements directly with business milestones.",
          key_points: ["KPI metrics alignment", "Product objectives", "Data-driven ROI"],
          difficulty: "Medium",
          context: "Stakeholder Alignment"
        }
      ],
      project_explainer: {
        architecture: "The BERT NLP pipeline extracts and cleans logs, routes queries through a tokenization layer, executes transformer inference on PyTorch models hosted in Docker, and returns semantic classifications.",
        system_design_questions: [
          {
            question: "How do you automate retraining of models when performance decays?",
            answer: "We set up an automated drift detection scheduler. When accuracy scores drop below 80%, a trigger fires a retraining script in Kubeflow, fetching fresh labels, executing training runs, and publishing a new tag to the MLflow registry."
          }
        ],
        scalability_questions: [
          {
            question: "How do you optimize LLM memory sizes during inference?",
            answer: "We apply quantization techniques—converting weights from FP32 to INT8 or FP16. We also adopt KV-caching and model compilation (e.g. `torch.compile`) to reduce execution latencies and memory bandwidth bottlenecks."
          }
        ],
        security_questions: [
          {
            question: "How do you prevent adversarial input attacks on classification layers?",
            answer: "We execute input validation checks, filter adversarial noise sequences, and perform adversarial training—injecting perturbed samples into retraining queues to make the network robust against visual or textual attacks."
          }
        ],
        improvements: [
          "Integrate Nvidia TensorRT compilation engines.",
          "Introduce Kubeflow automated workflow orchestration.",
          "Implement GPU-accelerated Triton inferencing endpoints."
        ]
      }
    },
    analytics: {
      total_questions: 20,
      practiced_count: 12,
      saved_count: 5,
      readiness_trend: [
        { name: 'June 1', Score: 70 },
        { name: 'June 4', Score: 75 },
        { name: 'June 7', Score: 80 },
        { name: 'June 10', Score: 89 }
      ],
      topic_mastery: [
        { topic: 'PyTorch', value: 92 },
        { topic: 'MLOps', value: 85 },
        { topic: 'Kubernetes', value: 80 },
        { topic: 'Python', value: 95 }
      ]
    }
  }
};

export const getActiveProfile = () => {
  const profile = localStorage.getItem('demo_profile') || 'software_engineer';
  return demoProfiles[profile] || demoProfiles.software_engineer;
};

// Legacy static variables mapped to getters for backward compatibility
export const getDemoResume = () => getActiveProfile().resume;
export const getDemoATSReport = () => getActiveProfile().atsReport;
export const getDemoInsights = () => getActiveProfile().insights;
export const getDemoComparisonData = () => getActiveProfile().comparisonData;
export const getDemoJobMatch = () => getActiveProfile().jobMatch;
export const getDemoCareerPredictions = () => getActiveProfile().careerPredictions;
export const getDemoInterviewQuestions = () => getActiveProfile().interviewQuestions;
export const getDemoAnalytics = () => getActiveProfile().analytics;

// Static exports for legacy references (defaulting to software_engineer)
export const demoResume = demoProfiles.software_engineer.resume;
export const demoATSReport = demoProfiles.software_engineer.atsReport;
export const demoInsights = demoProfiles.software_engineer.insights;
export const demoComparisonData = demoProfiles.software_engineer.comparisonData;
export const demoJobMatch = demoProfiles.software_engineer.jobMatch;
export const demoCareerPredictions = demoProfiles.software_engineer.careerPredictions;
export const demoInterviewQuestions = demoProfiles.software_engineer.interviewQuestions;
export const demoAnalytics = demoProfiles.software_engineer.analytics;
