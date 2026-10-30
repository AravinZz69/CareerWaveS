import { CourseRecord, JobRecord, ApplicationRecord, RoadmapRecord, UserProfile } from '../lib/supabase';

export const mockDefaultProfile: UserProfile = {
  id: 'usr_7f8a9b1c-34d2-4e9a-8b1c-9876543210ab',
  email: 'alex.vance@stanford.edu',
  full_name: 'Alex Vance',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  title: 'Software & AI Systems Engineer',
  bio: 'Software engineer passionate about building intelligent agents, scalable distributed systems, and modern web applications.',
  target_role: 'Generative AI Engineer',
  years_of_exp: 2,
  location: 'Bengaluru, Karnataka (Open to Remote)',
  skills: ['Python', 'TypeScript', 'PyTorch', 'LangChain', 'PostgreSQL', 'Docker'],
  role: 'user',
};

export const careerTracks = [
  {
    id: 'gen-ai',
    title: 'Generative AI',
    icon: 'Sparkles',
    color: '#6C3CE1',
    bgColor: '#F4F0FF',
    openRoles: '14,280+ Roles',
    avgSalary: '₹24,00,000',
    description: 'Master LLMs, RAG pipelines, fine-tuning, and production agentic workflows.',
    tag: 'Highest Demand'
  },
  {
    id: 'enterprise-ai',
    title: 'Enterprise AI',
    icon: 'Cpu',
    color: '#FF5B79',
    bgColor: '#FFF0F2',
    openRoles: '9,840+ Roles',
    avgSalary: '₹32,00,000',
    description: 'Scale AI models securely inside enterprise multi-tenant cloud architectures.',
    tag: 'High Growth'
  },
  {
    id: 'data-analytics',
    title: 'Data Analytics',
    icon: 'BarChart3',
    color: '#FFB547',
    bgColor: '#FFF7EB',
    openRoles: '22,100+ Roles',
    avgSalary: '₹16,50,000',
    description: 'Uncover actionable intelligence with SQL, dbt, Python, and executive dashboards.',
    tag: 'Bestseller'
  },
  {
    id: 'fintech',
    title: 'FinTech Systems',
    icon: 'TrendingUp',
    color: '#10B981',
    bgColor: '#ECFDF5',
    openRoles: '8,500+ Roles',
    avgSalary: '₹28,00,000',
    description: 'Build low-latency payment rails, fraud detection engines, and ledger architectures.',
    tag: 'Trending'
  },
  {
    id: 'it-services',
    title: 'IT & Cloud Services',
    icon: 'Cloud',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    openRoles: '19,300+ Roles',
    avgSalary: '₹18,00,000',
    description: 'Design resilient Kubernetes clusters, CI/CD automation, and DevSecOps pipelines.',
    tag: 'Stable'
  },
  {
    id: 'software',
    title: 'Software Engineering',
    icon: 'Code2',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    openRoles: '38,900+ Roles',
    avgSalary: '₹21,00,000',
    description: 'Modern web systems, microservices, system design, and distributed databases.',
    tag: 'Popular'
  }
];

export const featuredTools = [
  {
    id: 'ats-resume',
    title: 'ATS Resume Builder & Tailorer',
    badge: 'Bestseller',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    rating: 4.9,
    reviews: '18.4k',
    description: 'Scan your resume against any target job description. Get 95%+ ATS match score with 1-click semantic keyword alignment.',
    stats: '94% Interview Rate',
    icon: 'FileCheck',
    route: 'resume'
  },
  {
    id: 'job-finder',
    title: 'Smart Job Hunter & Match Engine',
    badge: 'Popular',
    badgeColor: 'bg-coral-light text-[#FF5B79] border-red-200',
    rating: 4.95,
    reviews: '24.1k',
    description: 'Live job matches scored against your active resume. Pinpoint roles that match your skill stack and salary expectations in ₹.',
    stats: '1,400+ Daily Openings',
    icon: 'SearchCheck',
    route: 'jobs'
  },
  {
    id: 'interview-prep',
    title: 'Live Spoken Voice Interviewer',
    badge: 'Trending',
    badgeColor: 'bg-amber-light text-amber-700 border-amber-200',
    rating: 4.88,
    reviews: '12.8k',
    description: 'Real-time spoken voice mock interviews with adaptive follow-ups, live audio waveform, and scored feedback reports.',
    stats: '3.2x Offer Success',
    icon: 'Mic',
    route: 'interviews'
  },
  {
    id: 'career-roadmap',
    title: 'Guided Career Track Roadmaps',
    badge: 'Highest Rated',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rating: 4.96,
    reviews: '31.2k',
    description: 'Step-by-step milestone curriculum from day 1 to senior promotions, curated by engineering leaders from top enterprises.',
    stats: '18 Comprehensive Paths',
    icon: 'Milestone',
    route: 'roadmap'
  },
  {
    id: 'portfolio-builder',
    title: 'Interactive Portfolio Generator',
    badge: 'Popular',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    rating: 4.85,
    reviews: '9.3k',
    description: 'Deploy a custom responsive portfolio showcasing your engineering projects, experience, and validated certificates.',
    stats: 'Instant Publishing',
    icon: 'LayoutTemplate',
    route: 'portfolio'
  },
  {
    id: 'linkedin-optimizer',
    title: 'LinkedIn Persona & Headline Studio',
    badge: 'Trending',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    rating: 4.89,
    reviews: '15.6k',
    description: 'Generate magnetic recruiter-attracting headlines, summaries, and experience bullet points proven to drive 5x recruiter InMails.',
    stats: '5x InMail Boost',
    icon: 'Share2',
    route: 'linkedin'
  }
];

export const mockCourses: CourseRecord[] = [
  {
    id: 'c1',
    title: 'Generative AI & LLM Systems Engineering: Zero to Production',
    instructor: 'Dr. Sarah Lin (Principal AI Researcher)',
    level: 'Intermediate to Advanced',
    duration_hours: 24.5,
    rating: 4.95,
    students_count: 18450,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    price: 0,
    enrolled: true,
    progress: 0
  },
  {
    id: 'c2',
    title: 'Enterprise Agentic Workflows with LangGraph & CrewAI',
    instructor: 'Marcus Chen (Staff Architect)',
    level: 'Advanced',
    duration_hours: 18.0,
    rating: 4.92,
    students_count: 12200,
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
    badge: 'Trending',
    price: 0,
    enrolled: true,
    progress: 0
  },
  {
    id: 'c3',
    title: 'Modern Full Stack Architecture & Vector Databases',
    instructor: 'Elena Rostova (Principal Systems Architect)',
    level: 'All Levels',
    duration_hours: 32.0,
    rating: 4.98,
    students_count: 29800,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    badge: 'Popular',
    price: 0,
    enrolled: false,
    progress: 0
  },
  {
    id: 'c4',
    title: 'Technical & Behavioral Interview Mastery (STAR Method)',
    instructor: 'David Kaplan (Senior Engineering Director)',
    level: 'Intermediate',
    duration_hours: 14.5,
    rating: 4.91,
    students_count: 24100,
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    price: 0,
    enrolled: false,
    progress: 0
  }
];

export const mockJobs: JobRecord[] = [
  {
    id: 'job-1',
    title: 'Senior AI Application Engineer',
    company: 'Razorpay',
    company_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka (Hybrid)',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: 2800000,
    salary_max: 4200000,
    description: 'Build developer-first generative AI assistants and intelligent workflow automation across core payment rails.',
    requirements: ['TypeScript', 'Python', 'LLM Prompt Engineering', 'RAG', 'Vector Search'],
    tags: ['Generative AI', 'FinTech', 'High Match', 'Remote Friendly'],
    match_score: 94,
    is_active: true,
    created_at: '2026-10-24'
  },
  {
    id: 'job-2',
    title: 'AI Full Stack Developer (Founding Team)',
    company: 'Sarvam AI Labs',
    company_logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Remote',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: 2200000,
    salary_max: 3400000,
    description: 'Design autonomous research and coding agents with human-in-the-loop interfaces.',
    requirements: ['TypeScript', 'PyTorch / LangChain', 'PostgreSQL', 'Distributed Systems'],
    tags: ['Autonomous Agents', 'Top Tier Mentorship', '92% Match'],
    match_score: 92,
    is_active: true,
    created_at: '2026-10-25'
  },
  {
    id: 'job-3',
    title: 'Machine Learning Solutions Architect',
    company: 'Databricks India',
    company_logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_min: 3500000,
    salary_max: 5200000,
    description: 'Empower enterprise customers to deploy custom LLMs and automated data pipelines using Lakehouse.',
    requirements: ['Python', 'Spark', 'MLflow', 'Cloud Infrastructure', 'Kubernetes'],
    tags: ['Data Platform', 'Enterprise AI', '88% Match'],
    match_score: 88,
    is_active: true,
    created_at: '2026-10-22'
  },
  {
    id: 'job-4',
    title: 'Associate Product Engineer',
    company: 'Postman',
    company_logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Remote',
    job_type: 'full-time',
    experience_level: 'entry',
    salary_min: 1800000,
    salary_max: 2600000,
    description: 'Craft frictionless developer experiences, API integrations, and low-latency runtime optimization.',
    requirements: ['TypeScript', 'Node.js', 'REST APIs', 'UI/UX Polish'],
    tags: ['Developer Tools', 'Full Stack', '94% Match'],
    match_score: 94,
    is_active: true,
    created_at: '2026-10-26'
  }
];

export const mockApplications: ApplicationRecord[] = [];

export const mockRoadmap: RoadmapRecord = {
  id: 'rdm-1',
  user_id: 'usr_7f8a9b1c',
  title: 'Generative AI & LLM Systems Career Track',
  category: 'Artificial Intelligence',
  description: 'From foundational neural architectures to agentic orchestration, evaluation frameworks, and scalable cloud deployment.',
  total_steps: 6,
  completed_steps: 0,
  milestones: [
    {
      id: 'm1',
      title: 'Python, Modern TypeScript & Vector Embeddings',
      duration: 'Week 1 - 2',
      completed: false,
      skills: ['NumPy', 'Embeddings API', 'Vector Stores', 'TypeScript Generics'],
      resourcesCount: 14
    },
    {
      id: 'm2',
      title: 'Advanced RAG, Semantic Caching & Hybrid Search',
      duration: 'Week 3 - 4',
      completed: false,
      skills: ['BM25 + Dense Re-ranking', 'Redis Vector', 'Document Chunking'],
      resourcesCount: 18
    },
    {
      id: 'm3',
      title: 'Autonomous Agents & Multi-Actor Orchestration',
      duration: 'Week 5 - 6',
      completed: false,
      skills: ['LangGraph', 'Tool Calling', 'State Machines', 'Human-in-the-Loop'],
      resourcesCount: 22
    },
    {
      id: 'm4',
      title: 'Model Evaluation, Evals & Guardrails',
      duration: 'Week 7 - 8',
      completed: false,
      skills: ['Ragas', 'DeepEval', 'Guardrails', 'Hallucination Tracking'],
      resourcesCount: 16
    }
  ]
};

export const mockProjects = [
  {
    id: 'prj-1',
    title: 'Enterprise Multi-Agent Customer Support Swarm',
    category: 'Generative AI',
    difficulty: 'Advanced',
    estimatedHours: 28,
    techStack: ['TypeScript', 'LangGraph', 'Python', 'PostgreSQL'],
    description: 'An autonomous multi-agent triage system that handles billing queries, code errors, and escalations with verifiable citations.',
    github: 'https://github.com/careerwave/agent-swarm-starter',
    demo: 'https://careerwave.in/projects/agent-swarm',
    outcomes: ['Multi-agent routing', 'Vector search with reranking', 'Role-based authorization']
  },
  {
    id: 'prj-2',
    title: 'Real-Time Financial Signal & Earnings Call Parser',
    category: 'FinTech & Analytics',
    difficulty: 'Intermediate',
    estimatedHours: 20,
    techStack: ['Python', 'FastAPI', 'TypeScript', 'PostgreSQL'],
    description: 'Transcribes quarterly earnings calls, generates executive sentiment trends, and tracks executive guidance revisions.',
    github: 'https://github.com/careerwave/fin-earnings-pulse',
    demo: 'https://careerwave.in/projects/fin-pulse',
    outcomes: ['Audio speech-to-text pipeline', 'Time-series sentiment graphs', 'Automated PDF executive briefs']
  },
  {
    id: 'prj-3',
    title: 'Interactive Developer Portfolio & Case Study Engine',
    category: 'Full Stack',
    difficulty: 'Intermediate',
    estimatedHours: 15,
    techStack: ['TypeScript', 'Node.js', 'CSS Grid', 'HTML5'],
    description: 'A bespoke developer portfolio with interactive code playgrounds, animated case studies, and automated PDF resume downloads.',
    github: 'https://github.com/careerwave/dev-portfolio-template',
    demo: 'https://careerwave.in/projects/portfolio',
    outcomes: ['Responsive UI/UX', 'Automated PDF resume export', 'Dynamic theme generator']
  }
];

export const mockInterviewQuestions = [
  {
    id: 'q1',
    category: 'System Design',
    question: 'How would you architect a low-latency, real-time RAG system handling 10,000 queries per second with semantic caching?',
    difficulty: 'Hard',
    keyConcepts: ['Vector Indexing (HNSW)', 'Semantic Cache (Redis)', 'Hybrid BM25 Re-ranking', 'Cold Start Mitigation']
  },
  {
    id: 'q2',
    category: 'Behavioral (STAR)',
    question: 'Tell me about a time when a production feature produced unexpected latency spikes. How did you diagnose and resolve it?',
    difficulty: 'Medium',
    keyConcepts: ['Root cause analysis', 'Fallback safety mechanisms', 'Stakeholder communication', 'Post-mortem action items']
  },
  {
    id: 'q3',
    category: 'Technical Architecture',
    question: 'Explain the difference between Full Fine-Tuning and LoRA (Low-Rank Adaptation). When would you choose one over the other?',
    difficulty: 'Medium',
    keyConcepts: ['Rank decomposition matrices', 'VRAM constraints', 'Catastrophic forgetting', 'Serving multiple adapters']
  }
];
