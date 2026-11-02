import assert from 'node:assert/strict';
import {
  computeGeneralAtsScore,
  computeJobMatchScore,
  extractJobRequirementsDeterministically,
  normalizeCanonicalResume,
} from '../atsScoringEngine.ts';
import { parseAndScoreResumeHighRecall } from '../resumeHighRecallParser.ts';

// ============================================================================
// PART 1: 3 FIXTURE RESUMES FOR UNIT TESTING THE SCORING ENGINE
// ============================================================================
const STRONG_FIXTURE = normalizeCanonicalResume(
  {
    contact: {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@iitb.ac.in',
      phone: '+91 98765 43210',
      location: 'Bengaluru, Karnataka, India',
      linkedin: 'linkedin.com/in/aaravsharma',
      github: 'github.com/aaravsharma',
    },
    summary:
      'Staff Software & AI Systems Engineer with 6+ years of experience architecting high-throughput distributed microservices, low-latency RAG pipelines, and cloud-native infrastructure on AWS and Kubernetes.',
    skills: {
      languages: ['Python', 'TypeScript', 'Go', 'SQL'],
      frameworks: ['React', 'Next.js', 'Node.js', 'FastAPI'],
      cloudAndDevOps: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
      aiAndData: ['Large Language Models', 'RAG', 'PyTorch', 'LangChain'],
    },
    experience: [
      {
        id: 'exp-1',
        company: 'Razorpay',
        role: 'Senior AI Systems Engineer',
        location: 'Bengaluru, India',
        duration: 'Jan 2022 - Present',
        bullets: [
          'Architected a real-time merchant dispute resolution RAG pipeline using Python, FastAPI, and PostgreSQL pgvector, reducing manual ticket triage by 48% across 120,000+ monthly cases.',
          'Engineered distributed Redis semantic caching and dynamic model routing, cutting P95 LLM inference latency from 2,100ms to 540ms while saving ₹18L/year in API compute.',
          'Spearheaded automated CI/CD observability and canary rollouts on Kubernetes clusters supporting 15,000 RPS with 99.98% uptime.',
        ],
      },
      {
        id: 'exp-2',
        company: 'Flipkart',
        role: 'Software Development Engineer II',
        location: 'Bengaluru, India',
        duration: 'Jul 2019 - Dec 2021',
        bullets: [
          'Built high-concurrency checkout microservices in Go and TypeScript handling 45,000+ peak orders per minute during Big Billion Days.',
          'Optimized PostgreSQL query execution plans and connection pooling, decreasing checkout database CPU utilization by 36%.',
        ],
      },
    ],
    projects: [
      {
        id: 'prj-1',
        title: 'OpenEval Multi-Agent Benchmark Suite',
        role: 'Creator',
        techStack: ['Python', 'TypeScript', 'FastAPI', 'Docker'],
        link: 'github.com/aaravsharma/openeval',
        bullets: [
          'Developed an open-source evaluation harness for tool-calling agents achieving 1,400+ GitHub stars and 94% test coverage.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Indian Institute of Technology Bombay',
        degree: 'B.Tech in Computer Science and Engineering',
        field: 'Computer Science',
        year: '2015 - 2019',
        gpa: '9.1/10',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Professional',
        issuer: 'Amazon Web Services',
        year: '2023',
      },
    ],
  },
  '',
  undefined,
  undefined,
  { preserveEmptyFields: true }
);

const AVERAGE_FIXTURE = normalizeCanonicalResume(
  {
    contact: {
      fullName: 'Rohan Verma',
      email: 'rohan.verma@gmail.com',
      phone: '',
      location: 'Pune, India',
      linkedin: '',
    },
    summary: 'I am a software developer working on web apps.',
    skills: {
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Node.js'],
      cloudAndDevOps: [],
      aiAndData: [],
    },
    experience: [
      {
        id: 'exp-1',
        company: 'Acme Web Studio',
        role: 'Junior Developer',
        location: 'Pune',
        duration: '2023 to current',
        bullets: [
          'I was responsible for working on frontend pages in React and fixing bugs.',
          'Helped with backend API endpoints and database tables.',
          'Built dashboard widgets.',
        ],
      },
    ],
    projects: [],
    education: [
      {
        id: 'edu-1',
        school: 'Pune Institute of Computer Technology',
        degree: 'B.E. Computer Engineering',
        field: 'Computer Engineering',
        year: '2019 - 2023',
        gpa: '',
      },
    ],
    certifications: [],
  },
  '',
  undefined,
  undefined,
  { preserveEmptyFields: true }
);

const NEARLY_EMPTY_FIXTURE = normalizeCanonicalResume(
  {
    contact: {
      fullName: 'Test User',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
    },
    summary: '',
    skills: {
      languages: [],
      frameworks: [],
      cloudAndDevOps: [],
      aiAndData: [],
    },
    experience: [],
    projects: [],
    education: [],
    certifications: [],
  },
  '',
  undefined,
  undefined,
  { preserveEmptyFields: true }
);

// ============================================================================
// PART 2: 3 REAL-WORLD MULTI-SECTION RESUMES (FRESHER, EXPERIENCED, TWO-PAGE)
// ============================================================================
const REAL_RESUME_1_FRESHER = `
PRIYA NAIR
priya.nair.cs@nitk.edu.in | +91 98450 11223 | Bengaluru, India
https://github.com/priyanair-cs

SUMMARY
Final-year Computer Science undergraduate at NIT Karnataka with hands-on experience building full-stack TypeScript applications, FastAPI microservices, and Retrieval-Augmented Generation (RAG) pipelines.

SKILLS
Languages: Python, TypeScript, JavaScript, SQL, C++
Frameworks: React, Next.js, Node.js, FastAPI, Tailwind CSS
Tools & Cloud: Docker, AWS, Git, PostgreSQL, Redis, Linux
AI & Data: LangChain, RAG, PyTorch, OpenAI API

EXPERIENCE
Software Engineering Intern | Postman | Bengaluru, India | May 2024 to Jul 2024
- Engineered an automated OpenAPI schema diffing microservice in TypeScript and Node.js, reducing breaking API change incidents by 42% for 18 internal teams.
- Worked on PostgreSQL indexing for workspace collection history queries across internal developer workspaces.
- Helped with building interactive React analytics components for workspace administrators.

PROJECTS
DocuPulse — Multi-Modal RAG Knowledge Assistant | Python, FastAPI, React, PostgreSQL, Docker | https://github.com/priyanair-cs/docupulse
- Architected a hybrid BM25 + pgvector semantic search pipeline indexing 50,000+ technical PDF chunks with 89% top-3 citation accuracy.
- Implemented streaming Server-Sent Events (SSE) responses and Redis query caching for faster document Q&A.

CodeArena — Real-Time Collaborative Coding Judge | TypeScript, Next.js, Node.js, Docker, Redis | https://github.com/priyanair-cs/codearena
- Built a sandboxed Docker code execution engine supporting Python, C++, and JavaScript submissions with sub-2s turnaround for 1,200+ campus contest participants.
- Designed WebSocket room synchronization for live pair-programming sessions.

FinSight UPI Expense Categorizer | Python, PyTorch, FastAPI, SQL
- Trained a lightweight DistilBERT transaction classifier achieving 93.4% F1-score across 14 Indian merchant categories.

EDUCATION
National Institute of Technology Karnataka (NITK Surathkal)
B.Tech in Computer Science and Engineering | 2021 - 2025 | CGPA: 8.94/10

CERTIFICATIONS
AWS Certified Cloud Practitioner — Amazon Web Services (2024)
`;

const REAL_RESUME_2_EXPERIENCED = `
VIKRAMADITYA RAO
vikram.rao@techmail.in | +91 99001 55667 | Hyderabad, Telangana, India
linkedin.com/in/vikramaditya-rao | github.com/vikramrao-eng

PROFESSIONAL SUMMARY
Senior Full-Stack & Cloud Engineer with 4.5 years of experience designing fault-tolerant fintech payment gateways, event-driven Kafka pipelines, and modern React/TypeScript web platforms serving 8M+ monthly active users.

TECHNICAL SKILLS
Programming: TypeScript, Python, Java, Go, SQL
Frontend & Backend: React, Next.js, Node.js, Express, Spring Boot, GraphQL, REST APIs
Cloud & DevOps: AWS, Docker, Kubernetes, Terraform, Kafka, PostgreSQL, Redis, GitHub Actions

WORK EXPERIENCE
Senior Software Engineer | PhonePe | Bengaluru, India | Apr 2023 - Present
- Architected an idempotent UPI recurring mandate settlement service in Go and Kafka processing 3.2M daily transactions with 99.99% reliability.
- Reduced merchant settlement reconciliation latency by 61% by migrating batch jobs to streaming PostgreSQL + Redis pipelines.
- Led a squad of 5 engineers to ship a real-time merchant dispute dashboard in React and TypeScript, decreasing support escalations by 29%.
- Hardened API gateway rate-limiting and JWT token rotation across microservices.

Software Engineer | Swiggy | Bengaluru, India | Jun 2021 to Mar 2023
- Engineered dynamic delivery-partner surge pricing APIs using Node.js, TypeScript, and Redis geospatial indices across 45 Indian cities.
- Optimized checkout GraphQL resolvers and payload serialization, improving mobile app cart load times by 340ms at P90.
- Automated Kubernetes horizontal pod autoscaling policies with Terraform, cutting off-peak AWS EC2 compute spend by 24%.

Associate Software Engineer | Zoho Corporation | Chennai, India | Jul 2020 - May 2021
- Developed multi-tenant CRM workflow automation triggers in Java and PostgreSQL handling 500,000+ daily webhook executions.
- Refactored legacy frontend tables into virtualized React components, eliminating browser frame drops on 10,000-row datasets.

PROJECTS
KubePulse Cost Analyzer | Go, React, TypeScript, Kubernetes
- Built a cluster resource right-sizing dashboard that flags idle pod requests and exports Terraform patches.

EDUCATION
Vellore Institute of Technology (VIT)
B.Tech in Information Technology | 2016 - 2020 | CGPA: 8.7/10

CERTIFICATIONS
Certified Kubernetes Application Developer (CKAD) — CNCF (2023)
AWS Certified Developer – Associate — Amazon Web Services (2022)
`;

const REAL_RESUME_3_TWO_PAGE_ARCHITECT = `
DR. SIDDHARTH MENON
siddharth.menon@architects.io | +91 98112 33445 | Mumbai, Maharashtra, India
linkedin.com/in/siddharthmenon-ai | github.com/smenon-arch | https://smenon.dev

EXECUTIVE SUMMARY
Principal AI & Distributed Systems Architect with 9+ years of experience leading multi-region cloud platforms, enterprise LLM inference infrastructure, and high-frequency financial data engines across India and APAC. Proven track record of scaling engineering organizations from 8 to 65+ engineers and delivering $12M+ in annualized infrastructure savings.

CORE COMPETENCIES & SKILLS
Languages: Python, Go, TypeScript, Rust, Java, SQL, Bash
Frameworks & APIs: FastAPI, Node.js, React, Next.js, gRPC, GraphQL, Spring Boot
Cloud & Infrastructure: AWS, GCP, Kubernetes, Docker, Terraform, Kafka, PostgreSQL, Redis, Prometheus, Grafana
AI & Machine Learning: Large Language Models, RAG, PyTorch, vLLM, LangChain, Vector Databases, MLflow

PROFESSIONAL EXPERIENCE
Principal AI Systems Architect | Jio Platforms | Mumbai, India | Jan 2023 - Present
- Architected a multi-tenant enterprise LLM gateway on Kubernetes and vLLM serving 18M+ daily requests across 11 Indic languages with P95 latency under 420ms.
- Spearheaded hybrid quantization and speculative decoding pipelines in PyTorch, increasing GPU token throughput by 2.8x across 128 NVIDIA A100 nodes.
- Designed a zero-trust PII redaction and audit logging mesh in Go and Kafka achieving 100% RBI & DPDP regulatory compliance.
- Mentored 45+ senior engineers and established architecture review boards across 6 product verticals.

Staff Distributed Systems Engineer | Ola Electric | Bengaluru, India | Mar 2020 - Dec 2022
- Engineered an IoT telemetry ingestion platform using Go, Kafka, and TimescaleDB/PostgreSQL processing 140,000 vehicle sensor events per second.
- Reduced cloud storage and egress costs by 38% ($1.4M/yr) by implementing adaptive delta compression and tiered S3 archival.
- Built real-time battery anomaly detection microservices in Python and FastAPI that predicted thermal faults 48 hours in advance with 96.2% precision.
- Led incident response and chaos engineering drills, improving platform availability from 99.5% to 99.96%.

Senior Software Engineer | Morgan Stanley | Mumbai, India | Aug 2017 - Feb 2020
- Developed low-latency equities order-routing microservices in Java and C++ executing 85,000 trades/sec with sub-3ms tick-to-trade latency.
- Automated regulatory trade reporting pipelines in Python and SQL, eliminating 120 hours/week of manual operations work.
- Migrated monolithic risk dashboards to React and TypeScript with real-time WebSocket streaming.

Software Engineer | ThoughtWorks | Pune, India | Jul 2015 - Jul 2017
- Delivered cloud-native microservices and CI/CD pipelines on AWS and Docker for 4 enterprise retail and banking clients.
- Championed test-driven development (TDD), raising automated test coverage from 45% to 91%.

KEY OPEN-SOURCE & ARCHITECTURE PROJECTS
IndicRAG-Bench — Enterprise Indic Retrieval Benchmark | Python, PyTorch, FastAPI | github.com/smenon-arch/indicrag
- Published a 25,000-query multilingual evaluation dataset and retrieval harness adopted by 30+ research labs.

VectorShard — Distributed pgvector Router | Go, PostgreSQL, Docker | github.com/smenon-arch/vectorshard
- Engineered a consistent-hashing proxy for sharded PostgreSQL vector tables supporting 50M+ embeddings with sub-15ms ANN recall.

EDUCATION
Indian Institute of Science (IISc), Bengaluru
M.Tech in Computer Science and Automation | 2013 - 2015 | CGPA: 9.4/10

College of Engineering, Pune (COEP)
B.Tech in Computer Engineering | 2009 - 2013 | CGPA: 8.8/10

CERTIFICATIONS
AWS Certified Solutions Architect – Professional — Amazon Web Services (2024)
Google Cloud Certified Fellow / Professional Cloud Architect — Google Cloud (2023)
Certified Kubernetes Administrator (CKA) — CNCF (2022)
`;

async function runTests() {
  console.log('=== 1. Running ATS Scoring Unit Tests on 3 Fixture Resumes ===');
  const strongScore = computeGeneralAtsScore(STRONG_FIXTURE, { rawExtractedLength: 2400 });
  const averageScore = computeGeneralAtsScore(AVERAGE_FIXTURE, { rawExtractedLength: 420 });
  const emptyScore = computeGeneralAtsScore(NEARLY_EMPTY_FIXTURE, { rawExtractedLength: 10 });

  console.log('Strong Fixture Score:', strongScore.totalScore, strongScore.categories);
  console.log('Average Fixture Score:', averageScore.totalScore, averageScore.categories);
  console.log(
    'Nearly Empty Fixture Score:',
    emptyScore.totalScore,
    'cannotScoreReason:',
    emptyScore.cannotScoreReason
  );

  assert.ok(strongScore.totalScore >= 85, `Expected strong resume >= 85, got ${strongScore.totalScore}`);
  assert.ok(
    averageScore.totalScore >= 35 && averageScore.totalScore <= 70,
    `Expected average resume between 35 and 70, got ${averageScore.totalScore}`
  );
  assert.equal(emptyScore.totalScore, 0, 'Expected nearly empty resume to have totalScore 0');
  assert.ok(
    Boolean(emptyScore.cannotScoreReason),
    'Expected nearly empty resume to return a non-empty cannotScoreReason'
  );
  assert.ok(
    strongScore.totalScore > averageScore.totalScore + 25,
    'Expected strong resume to score at least 25 points higher than average resume'
  );

  // Verify every deduction on averageScore has reason, pointsLost, and evidence
  for (const ded of averageScore.deductions) {
    assert.ok(ded.pointsLost > 0, `Deduction ${ded.id} must have pointsLost > 0`);
    assert.ok(ded.reason.length > 10, `Deduction ${ded.id} must have plain-English reason`);
    assert.ok(Boolean(ded.evidence), `Deduction ${ded.id} must include evidence quote/location`);
  }

  console.log('\n=== 2. Running High-Recall Parser & Scorer on 3 Real Resumes ===');
  const parsed1 = await parseAndScoreResumeHighRecall({
    rawText: REAL_RESUME_1_FRESHER,
    fileName: 'Priya_Nair_Fresher_NITK.pdf',
  });
  const parsed2 = await parseAndScoreResumeHighRecall({
    rawText: REAL_RESUME_2_EXPERIENCED,
    fileName: 'Vikramaditya_Rao_Senior_SWE.pdf',
  });
  const parsed3 = await parseAndScoreResumeHighRecall({
    rawText: REAL_RESUME_3_TWO_PAGE_ARCHITECT,
    fileName: 'Dr_Siddharth_Menon_Principal_Architect.pdf',
  });

  for (const [label, res] of [
    ['Resume 1 (Fresher with Projects)', parsed1],
    ['Resume 2 (Experienced Engineer)', parsed2],
    ['Resume 3 (Two-Page Principal Architect)', parsed3],
  ] as const) {
    console.log(`\n--- ${label} ---`);
    console.log('Contact:', res.resume.contact);
    console.log('Captured Counts:', res.capturedCounts);
    console.log('Total ATS Score:', res.generalScore.totalScore, '/ 100');
    console.log('Sub-scores:', {
      parsability: `${res.generalScore.categories.parsability.earned}/${res.generalScore.categories.parsability.max}`,
      structure: `${res.generalScore.categories.structure.earned}/${res.generalScore.categories.structure.max}`,
      contentQuality: `${res.generalScore.categories.contentQuality.earned}/${res.generalScore.categories.contentQuality.max}`,
      completeness: `${res.generalScore.categories.completeness.earned}/${res.generalScore.categories.completeness.max}`,
    });
    console.log(
      'Deductions:',
      res.generalScore.deductions.map((d) => `[-${d.pointsLost}] ${d.reason} | Evidence: ${d.evidence}`)
    );
  }

  assert.equal(parsed1.resume.contact.email, 'priya.nair.cs@nitk.edu.in');
  assert.ok(parsed1.capturedCounts.projects >= 3, 'Fresher resume must capture all 3 projects');
  assert.ok(parsed1.capturedCounts.experienceRoles >= 1, 'Fresher resume must capture internship');
  assert.ok(parsed1.capturedCounts.skills >= 10, 'Fresher resume must capture >= 10 skills');

  assert.equal(parsed2.resume.contact.email, 'vikram.rao@techmail.in');
  assert.equal(parsed2.capturedCounts.experienceRoles, 3, 'Experienced resume must capture all 3 companies');
  assert.ok(parsed2.capturedCounts.experienceBullets >= 8, 'Experienced resume must capture >= 8 bullets');
  assert.equal(parsed2.capturedCounts.certifications, 2, 'Experienced resume must capture 2 certifications');

  assert.equal(parsed3.resume.contact.email, 'siddharth.menon@architects.io');
  assert.equal(parsed3.capturedCounts.experienceRoles, 4, 'Two-page resume must capture all 4 companies');
  assert.ok(parsed3.capturedCounts.experienceBullets >= 12, 'Two-page resume must capture >= 12 bullets');
  assert.equal(parsed3.capturedCounts.education, 2, 'Two-page resume must capture M.Tech and B.Tech');
  assert.equal(parsed3.capturedCounts.certifications, 3, 'Two-page resume must capture all 3 certifications');

  // Test JD Match Scoring as well
  const jdReq = extractJobRequirementsDeterministically(
    'We are hiring a Senior Backend & AI Engineer with 4+ years of experience in Python, Go, TypeScript, Kubernetes, PostgreSQL, Redis, Kafka, and RAG.',
    'Senior AI Backend Engineer',
    'Razorpay'
  );
  const jdMatch2 = computeJobMatchScore(parsed2.resume, jdReq);
  console.log('\nJD Match Score for Resume 2:', jdMatch2.totalScore, '/ 100');
  assert.ok(jdMatch2.totalScore >= 60, 'Expected strong JD match for Resume 2');

  console.log('\nALL ATS SCORING & HIGH-RECALL PARSING TESTS PASSED.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
