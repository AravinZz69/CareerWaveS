export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  textContent: string;
  videoUrl?: string; // YouTube or Vimeo embed
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseQuiz {
  id: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface DetailedCourse {
  id: string;
  title: string;
  instructor: string;
  instructorTitle: string;
  category: 'Generative AI' | 'Full Stack' | 'Cloud & Systems' | 'FinTech' | 'Data Analytics' | 'Interview Prep';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration_hours: number;
  rating: number;
  students_count: number;
  thumbnail: string;
  badge: 'Bestseller' | 'Popular' | 'Trending' | 'Highest Rated' | 'New';
  enrolled?: boolean;
  progress?: number;
  description: string;
  overview: string[];
  modules: {
    id: string;
    title: string;
    lessons: CourseLesson[];
  }[];
  quiz: CourseQuiz;
}

export const sample12Courses: DetailedCourse[] = [
  {
    id: 'course-1',
    title: 'Generative AI & LLM Systems: Zero to Production',
    instructor: 'Dr. Sarah Lin',
    instructorTitle: 'Former Staff AI Engineer, Google Brain',
    category: 'Generative AI',
    level: 'Advanced',
    duration_hours: 24.5,
    rating: 4.96,
    students_count: 18450,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    enrolled: true,
    progress: 80,
    description: 'Master production LLM system design, chunking strategies, dense embeddings, hybrid search, and latency optimization.',
    overview: [
      'Architect low-latency RAG with semantic Redis cache and pgvector.',
      'Implement context compression, rerankers, and citation attribution.',
      'Deploy continuous evaluation benchmarks with DeepEval and Ragas.'
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Foundational Embeddings & Vector Stores',
        lessons: [
          {
            id: 'l1',
            title: 'Vector Embeddings, Cosine Distance & HNSW Fundamentals',
            duration: '22 min',
            videoUrl: 'https://www.youtube.com/embed/QdDoFfkVkcw',
            textContent: 'Understanding the mechanics of multi-dimensional vector space. High-Dimensional embeddings represent semantic concepts where cosine similarity measures proximity. HNSW creates small-world hierarchical graphs with logarithmic search complexity.',
            completed: true,
          },
          {
            id: 'l2',
            title: 'Configuring Postgres pgvector with Custom ef_construction',
            duration: '35 min',
            videoUrl: 'https://www.youtube.com/embed/Yhww_KWxQhs',
            textContent: 'Optimizing pgvector indexing in PostgreSQL. The m parameter dictates bidirectional links per node while ef_construction tunes graph quality during index building.',
            completed: true,
          },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Advanced Retrieval & Semantic Caching',
        lessons: [
          {
            id: 'l3',
            title: 'Tiered Semantic Caching with Redis & Hash Matching',
            duration: '28 min',
            videoUrl: 'https://www.youtube.com/embed/5p248yoa3oE',
            textContent: 'Exact matching queries against MD5 hashes saves 99% of computation. When queries diverge slightly, semantic vector distance matching bridges paraphrased intent.',
            completed: true,
          },
          {
            id: 'l4',
            title: 'Re-ranking with Cross-Encoders and BM25 Hybrid Pipelines',
            duration: '40 min',
            videoUrl: 'https://www.youtube.com/embed/h02ftmcHKGo',
            textContent: 'Combining lexical BM25 keyword matching with dense embedding retrieval through reciprocal rank fusion (RRF) ensures high recall for technical identifiers and conceptual semantics alike.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Generative AI Systems Certification Exam',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is the primary advantage of HNSW (Hierarchical Navigable Small World) over IVF-Flat vector indexing?',
          options: [
            'HNSW guarantees zero memory usage.',
            'HNSW provides sub-linear logarithmic query retrieval time with high recall under concurrent load.',
            'HNSW eliminates the need for vector embeddings.',
            'HNSW operates purely on lexical keyword matching.'
          ],
          correctIndex: 1,
          explanation: 'HNSW uses multi-layer graphs to navigate down to nearest neighbors in O(log N) time with superior recall trade-offs.'
        },
        {
          id: 'q2',
          question: 'Why combine BM25 lexical search with dense vector embeddings in a hybrid search pipeline?',
          options: [
            'To reduce server RAM by 80%.',
            'To capture exact alphanumeric codes, SKUs, and IDs while preserving semantic similarity.',
            'Because vector embeddings cannot handle English text.',
            'To prevent PostgreSQL from running VACUUM.'
          ],
          correctIndex: 1,
          explanation: 'Dense embeddings often struggle with exact serial numbers, error codes, and niche keywords, which BM25 excels at retrieving.'
        },
        {
          id: 'q3',
          question: 'In tiered semantic caching, what should trigger a cache invalidation?',
          options: [
            'Every time a user logs in.',
            'Underlying document updates or changes in vector knowledge store embeddings.',
            'Only when the database restarts.',
            'Whenever an HTTP GET request fails.'
          ],
          correctIndex: 1,
          explanation: 'When knowledge base documents are modified, stale cached answers must be evicted to prevent serving hallucinated or obsolete answers.'
        }
      ]
    }
  },
  {
    id: 'course-2',
    title: 'Enterprise Multi-Actor Agentic Workflows with LangGraph',
    instructor: 'Marcus Chen',
    instructorTitle: 'Staff Architect, Autonomous Systems',
    category: 'Generative AI',
    level: 'Advanced',
    duration_hours: 18.0,
    rating: 4.93,
    students_count: 12200,
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
    badge: 'Trending',
    enrolled: true,
    progress: 35,
    description: 'Build robust cyclic state machines, multi-agent swarms, tool calling guards, and human-in-the-loop escalation workflows.',
    overview: [
      'Implement cyclic execution graphs with LangGraph state channels.',
      'Enforce JSON Schema validation with Pydantic and Zod.',
      'Deploy human-in-the-loop authorization gates for sensitive actions.'
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: State Machines & Cyclic Agent Graphs',
        lessons: [
          {
            id: 'l1',
            title: 'Graph State Channels and Reducers',
            duration: '25 min',
            videoUrl: 'https://www.youtube.com/embed/sal78ACtGTc',
            textContent: 'Moving beyond naive linear chains to stateful graph execution. State channels aggregate inputs from multiple nodes while reducers merge state updates reliably.',
            completed: true,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-2',
      title: 'Agentic Workflows Certification Quiz',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is the main role of a checkpoint in LangGraph multi-agent execution?',
          options: [
            'To format text into Markdown.',
            'To persist graph state at each step, enabling rollback, replay, and human-in-the-loop approval.',
            'To increase the temperature of the model.',
            'To compile TypeScript to WebAssembly.'
          ],
          correctIndex: 1,
          explanation: 'Checkpoints allow persisting exact graph state so execution can be paused for manual review or resumed after network failure.'
        }
      ]
    }
  },
  {
    id: 'course-3',
    title: 'React 19, TypeScript & Web Streams Architecture',
    instructor: 'Elena Rostova',
    instructorTitle: 'Principal Frontend Architect',
    category: 'Full Stack',
    level: 'All Levels',
    duration_hours: 32.0,
    rating: 4.98,
    students_count: 29800,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    badge: 'Popular',
    enrolled: false,
    progress: 0,
    description: 'Master React 19 actions, useOptimistic, server components, and streaming AI responses with zero UI stutter.',
    overview: [
      'Handle streaming token responses using the Web Streams API.',
      'Leverage React 19 useActionState and useTransition for snappy state.',
      'Implement accessible, design-system-first Tailwind CSS components.'
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: React 19 State & Actions',
        lessons: [
          {
            id: 'l1',
            title: 'Actions, Form Submissions & useActionState',
            duration: '30 min',
            videoUrl: 'https://www.youtube.com/embed/81uWl8Kk7_0',
            textContent: 'React 19 elevates form handling with built-in action state, pending indicators, and automatic rollback on error.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-3',
      title: 'React 19 & Streams Assessment',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'How does useOptimistic improve perceived user experience during mutations?',
          options: [
            'It downloads assets before the page loads.',
            'It immediately renders the expected state locally while asynchronous network validation completes.',
            'It disables all error boundaries.',
            'It minifies CSS bundles.'
          ],
          correctIndex: 1,
          explanation: 'Optimistic UI updates display instant feedback and automatically roll back if the server mutation fails.'
        }
      ]
    }
  },
  {
    id: 'course-4',
    title: 'Vector Databases, pgvector & Low-Latency Retrieval',
    instructor: 'Dr. Tariq Vance',
    instructorTitle: 'Database Research Lead',
    category: 'Generative AI',
    level: 'Intermediate',
    duration_hours: 16.5,
    rating: 4.91,
    students_count: 14100,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    enrolled: false,
    progress: 0,
    description: 'Deep dive into high-performance vector search: indexing trade-offs, disk-based vector storage, and pgvector tuning.',
    overview: ['pgvector index tuning', 'Quantization (Product & Scalar)', 'Concurrent QPS benchmarking'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Index Mechanics',
        lessons: [
          {
            id: 'l1',
            title: 'IVF-Flat vs HNSW: Memory and Recall Deep Dive',
            duration: '26 min',
            textContent: 'Examine when to choose inverted file clustering versus hierarchical navigable small world graphs.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-4',
      title: 'Vector Databases Quiz',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is Scalar Quantization in vector database systems?',
          options: [
            'Compressing 32-bit floating point vector elements into 8-bit integers to reduce memory by 75%.',
            'Deleting all vectors below 0.',
            'Sorting strings alphabetically.',
            'Re-indexing on every write.'
          ],
          correctIndex: 0,
          explanation: 'Scalar Quantization compresses float32 values into int8, drastically reducing RAM footprints while preserving high recall.'
        }
      ]
    }
  },
  {
    id: 'course-5',
    title: 'Fine-Tuning, LoRA & Model Distillation Masterclass',
    instructor: 'Aria Montgomery',
    instructorTitle: 'Principal Applied Scientist',
    category: 'Generative AI',
    level: 'Advanced',
    duration_hours: 22.0,
    rating: 4.95,
    students_count: 9800,
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    badge: 'Trending',
    enrolled: false,
    progress: 0,
    description: 'PEFT, LoRA, QLoRA, synthetic dataset curation, and knowledge distillation for domain-specific models.',
    overview: ['Rank decomposition matrices', 'QLoRA 4-bit quantization', 'vLLM multi-adapter serving'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Parameter-Efficient Fine-Tuning',
        lessons: [
          {
            id: 'l1',
            title: 'Low-Rank Adaptation (LoRA) Mathematical Principles',
            duration: '34 min',
            textContent: 'Decomposing weight matrices into low-rank representations allows training less than 1% of total model parameters.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-5',
      title: 'Fine-Tuning & LoRA Assessment',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'Why does LoRA allow serving multiple custom domain models from a single GPU?',
          options: [
            'Because the base model weights remain static in VRAM while lightweight adapter weights are swapped dynamically per tenant.',
            'Because LoRA turns off the GPU cooling fan.',
            'Because LoRA deletes the attention layers.',
            'Because LoRA uses CPU only.'
          ],
          correctIndex: 0,
          explanation: 'Keeping the frozen base model in VRAM and loading small 20MB adapter weights enables massive multi-tenant density.'
        }
      ]
    }
  },
  {
    id: 'course-6',
    title: 'Distributed Systems & Microservices with Go and Python',
    instructor: 'Vikram Joshi',
    instructorTitle: 'Distributed Systems Tech Lead',
    category: 'Cloud & Systems',
    level: 'Intermediate',
    duration_hours: 26.0,
    rating: 4.89,
    students_count: 15300,
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    badge: 'Popular',
    enrolled: false,
    progress: 0,
    description: 'Raft consensus, event-driven messaging with Kafka, gRPC protocol buffers, and circuit breakers.',
    overview: ['gRPC & Protobuf', 'Kafka streaming', 'Distributed tracing with OpenTelemetry'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: High-Performance RPC',
        lessons: [
          {
            id: 'l1',
            title: 'HTTP/2 Streaming with gRPC',
            duration: '30 min',
            textContent: 'Multiplexing multiple requests over a single TCP connection with binary serialization.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-6',
      title: 'Distributed Systems Quiz',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What problem does the Circuit Breaker pattern solve in microservices?',
          options: [
            'It formats JSON payload strings.',
            'It prevents cascading service failures when a downstream dependency is slow or unreachable.',
            'It encrypts passwords in transit.',
            'It replaces Docker containers.'
          ],
          correctIndex: 1,
          explanation: 'Circuit breakers fail fast when error thresholds are crossed, protecting downstream services from being overwhelmed.'
        }
      ]
    }
  },
  {
    id: 'course-7',
    title: 'FinTech Payment Rails, Risk AI & Ledger Systems',
    instructor: 'Claire Dupont',
    instructorTitle: 'Former VP of Core Payments',
    category: 'FinTech',
    level: 'Advanced',
    duration_hours: 20.0,
    rating: 4.94,
    students_count: 8700,
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    badge: 'Trending',
    enrolled: false,
    progress: 0,
    description: 'Double-entry immutable ledgers, real-time fraud scoring with machine learning, and idempotent webhook processing.',
    overview: ['Idempotency keys', 'Double-entry bookkeeping', 'Real-time transaction anomaly detection'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Core Ledger Architectures',
        lessons: [
          {
            id: 'l1',
            title: 'Immutable Ledgers & Idempotent API Design',
            duration: '28 min',
            textContent: 'Guaranteeing exactly-once processing using database uniqueness constraints and cryptographic hashing.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-7',
      title: 'FinTech Rails Certification',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'Why are idempotency keys critical for payment APIs?',
          options: [
            'To prevent customers from being billed twice if network retries occur.',
            'To speed up font rendering.',
            'To generate marketing coupons.',
            'To compress images.'
          ],
          correctIndex: 0,
          explanation: 'Idempotency keys ensure repeated POST requests with the same key execute the charge exactly once.'
        }
      ]
    }
  },
  {
    id: 'course-8',
    title: 'Enterprise Cloud Security, Supabase RLS & DevSecOps',
    instructor: 'Nathaniel Cole',
    instructorTitle: 'Chief Security Officer',
    category: 'Cloud & Systems',
    level: 'Intermediate',
    duration_hours: 15.0,
    rating: 4.92,
    students_count: 11400,
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    badge: 'Highest Rated',
    enrolled: false,
    progress: 0,
    description: 'Postgres Row Level Security (RLS), security-definer RBAC, JWT verification, and automated vulnerability scanning.',
    overview: ['Zero-trust database architecture', 'PostgreSQL RLS optimization', 'IAM least-privilege principles'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: PostgreSQL Row Level Security',
        lessons: [
          {
            id: 'l1',
            title: 'Hardening Databases with Row Level Security',
            duration: '25 min',
            textContent: 'How RLS evaluates security policies inside the database query engine before rows touch application memory.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-8',
      title: 'Cloud Security & RLS Exam',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is the security advantage of a SECURITY DEFINER function in PostgreSQL?',
          options: [
            'It runs with the privileges of the function owner rather than the calling user, allowing strict privilege elevation.',
            'It runs faster in RAM.',
            'It generates SSL certificates automatically.',
            'It disables all foreign keys.'
          ],
          correctIndex: 0,
          explanation: 'SECURITY DEFINER lets users query protected data strictly through safe, validated programmatic paths.'
        }
      ]
    }
  },
  {
    id: 'course-9',
    title: 'Data Analytics, dbt & Modern SQL Intelligence',
    instructor: 'Jessica Morales',
    instructorTitle: 'Head of Data Science',
    category: 'Data Analytics',
    level: 'Beginner',
    duration_hours: 19.5,
    rating: 4.90,
    students_count: 22100,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    enrolled: false,
    progress: 0,
    description: 'Master advanced SQL window functions, dimensional modeling, dbt transformation pipelines, and executive dashboards.',
    overview: ['Window functions (ROW_NUMBER, LEAD, LAG)', 'dbt incremental models', 'Data warehouse schema optimization'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Advanced Analytical SQL',
        lessons: [
          {
            id: 'l1',
            title: 'Mastering Window Functions & Partitioning',
            duration: '32 min',
            textContent: 'Calculating running totals, percentiles, and multi-period cohort retention with zero subquery overhead.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-9',
      title: 'Data Analytics Certification',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'In SQL, what is the difference between RANK() and DENSE_RANK()?',
          options: [
            'DENSE_RANK() does not skip rank values when ties occur, whereas RANK() leaves gaps.',
            'RANK() only works with strings.',
            'DENSE_RANK() deletes duplicates.',
            'They are identical aliases.'
          ],
          correctIndex: 0,
          explanation: 'DENSE_RANK() produces contiguous sequences (1, 2, 2, 3), whereas RANK() skips values following ties (1, 2, 2, 4).'
        }
      ]
    }
  },
  {
    id: 'course-10',
    title: 'FAANG Technical & Behavioral Interview Mastery (STAR)',
    instructor: 'David Kaplan',
    instructorTitle: 'Former Senior Director of Engineering',
    category: 'Interview Prep',
    level: 'All Levels',
    duration_hours: 14.5,
    rating: 4.97,
    students_count: 24100,
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    badge: 'Bestseller',
    enrolled: false,
    progress: 0,
    description: 'Master system design tradeoffs, algorithmic problem solving, executive presence, and STAR behavioral rubrics.',
    overview: ['System design back-of-the-envelope estimation', 'STAR storytelling formulation', 'Salary negotiation tactics'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: The STAR Framework',
        lessons: [
          {
            id: 'l1',
            title: 'Structuring High-Impact STAR Stories with Measurable Results',
            duration: '22 min',
            textContent: 'Every behavioral question tests your decision-making under ambiguity. Focus 50% of your time on Actions and verifiable Results.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-10',
      title: 'Interview Mastery Assessment',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'In the STAR framework, which component should occupy the largest share of your answer?',
          options: [
            'Situation (setting the scene)',
            'Action (the specific technical steps and decisions you personally drove)',
            'Task (what you were asked to do)',
            'Complaining about previous management'
          ],
          correctIndex: 1,
          explanation: 'Interviewers look for your specific actions, architectural decisions, and agency in resolving challenges.'
        }
      ]
    }
  },
  {
    id: 'course-11',
    title: 'Autonomous Robotics & Multi-Modal Vision AI',
    instructor: 'Dr. Kenji Sato',
    instructorTitle: 'Director of Perception Research',
    category: 'Generative AI',
    level: 'Advanced',
    duration_hours: 28.0,
    rating: 4.92,
    students_count: 6400,
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80',
    badge: 'New',
    enrolled: false,
    progress: 0,
    description: 'Vision-Language-Action (VLA) models, real-time object segmentation, sensor fusion, and spatial robotics control.',
    overview: ['Multi-modal tokenization', 'Zero-shot segmentation with SAM 2', 'Real-time spatial perception'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Multi-Modal Perception',
        lessons: [
          {
            id: 'l1',
            title: 'Vision Foundation Models & Patch Embeddings',
            duration: '35 min',
            textContent: 'Splitting images into patch tokens and projecting them into joint embedding spaces with text tokens.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-11',
      title: 'Robotics & Vision Exam',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'How do Vision Transformers (ViT) process image inputs?',
          options: [
            'By dividing images into non-overlapping patches and projecting them into linear vector tokens.',
            'By converting all pixels to grayscale.',
            'By running audio filters.',
            'By calculating SHA256 hashes.'
          ],
          correctIndex: 0,
          explanation: 'ViT splits an image into 16x16 pixel patches, treating them analogously to word tokens in an NLP transformer.'
        }
      ]
    }
  },
  {
    id: 'course-12',
    title: 'Production Kubernetes, Helm & Cloud Observability',
    instructor: 'Sophie Dubois',
    instructorTitle: 'Principal SRE',
    category: 'Cloud & Systems',
    level: 'Intermediate',
    duration_hours: 21.0,
    rating: 4.90,
    students_count: 13900,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    badge: 'Popular',
    enrolled: false,
    progress: 0,
    description: 'Kubernetes operators, zero-downtime rolling updates, Prometheus metrics, and automated disaster recovery.',
    overview: ['Helm chart orchestration', 'Horizontal Pod Autoscaling', 'Zero-downtime deployment strategies'],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Kubernetes Cluster Orchestration',
        lessons: [
          {
            id: 'l1',
            title: 'Deployments, Services & Ingress Controllers',
            duration: '28 min',
            textContent: 'Configuring ingress rules, health check probes, and zero-downtime rolling upgrades across multi-zone nodes.',
            completed: false,
          },
        ],
      },
    ],
    quiz: {
      id: 'quiz-12',
      title: 'Kubernetes & SRE Exam',
      passingScore: 75,
      questions: [
        {
          id: 'q1',
          question: 'What is the role of a Readiness Probe in Kubernetes?',
          options: [
            'It checks if the application is ready to accept incoming network traffic before routing requests to the pod.',
            'It deletes the pod immediately.',
            'It restarts the worker node.',
            'It changes the pod IP address.'
          ],
          correctIndex: 0,
          explanation: 'Readiness probes ensure traffic is only routed to pods that have completed initialization and warming.'
        }
      ]
    }
  }
];
