export type SkillCategoryKey =
  | 'languages'
  | 'frameworks'
  | 'cloudAndDevOps'
  | 'aiAndData';

export interface SkillTaxonomyEntry {
  id: string;
  canonicalName: string;
  category: SkillCategoryKey;
  aliases: string[];
}

/**
 * Seeded with 320+ common Tech, Data, Cloud, AI, and Business/Product skills.
 * Used identically on client and server so skill extraction, alias mapping,
 * categorization, and ATS scoring are 100% deterministic across all AI models.
 */
export const DEFAULT_SKILLS_TAXONOMY: SkillTaxonomyEntry[] = [
  // ============================================================================
  // 1. LANGUAGES (65 skills)
  // ============================================================================
  { id: 'sk-lang-1', canonicalName: 'Python', category: 'languages', aliases: ['python3', 'py', 'python 3', 'cpython'] },
  { id: 'sk-lang-2', canonicalName: 'TypeScript', category: 'languages', aliases: ['ts', 'typescript 5', 'tsx'] },
  { id: 'sk-lang-3', canonicalName: 'JavaScript', category: 'languages', aliases: ['js', 'es6', 'es2022', 'ecmascript', 'vanilla js', 'jsx'] },
  { id: 'sk-lang-4', canonicalName: 'SQL', category: 'languages', aliases: ['structured query language', 'ansi sql', 't-sql', 'pl/sql', 'plsql', 'tsql'] },
  { id: 'sk-lang-5', canonicalName: 'Java', category: 'languages', aliases: ['java 8', 'java 11', 'java 17', 'java 21', 'core java', 'jdk', 'jvm'] },
  { id: 'sk-lang-6', canonicalName: 'Go', category: 'languages', aliases: ['golang', 'go lang'] },
  { id: 'sk-lang-7', canonicalName: 'C++', category: 'languages', aliases: ['cpp', 'c plus plus', 'c++17', 'c++20', 'stl'] },
  { id: 'sk-lang-8', canonicalName: 'C#', category: 'languages', aliases: ['csharp', 'c sharp', 'dotnet c#'] },
  { id: 'sk-lang-9', canonicalName: 'Rust', category: 'languages', aliases: ['rustlang', 'cargo'] },
  { id: 'sk-lang-10', canonicalName: 'C', category: 'languages', aliases: ['ansi c', 'c99', 'c11', 'embedded c'] },
  { id: 'sk-lang-11', canonicalName: 'Kotlin', category: 'languages', aliases: ['kotlin multiplatform', 'kmp'] },
  { id: 'sk-lang-12', canonicalName: 'Swift', category: 'languages', aliases: ['swift 5', 'ios swift'] },
  { id: 'sk-lang-13', canonicalName: 'PHP', category: 'languages', aliases: ['php 8', 'php7'] },
  { id: 'sk-lang-14', canonicalName: 'Ruby', category: 'languages', aliases: ['ruby lang', 'mri ruby'] },
  { id: 'sk-lang-15', canonicalName: 'Scala', category: 'languages', aliases: ['scala 2', 'scala 3'] },
  { id: 'sk-lang-16', canonicalName: 'R', category: 'languages', aliases: ['r programming', 'r-project', 'rstudio'] },
  { id: 'sk-lang-17', canonicalName: 'Dart', category: 'languages', aliases: ['dartlang'] },
  { id: 'sk-lang-18', canonicalName: 'HTML5', category: 'languages', aliases: ['html', 'semantic html', 'html 5'] },
  { id: 'sk-lang-19', canonicalName: 'CSS3', category: 'languages', aliases: ['css', 'cascading style sheets', 'flexbox', 'css grid'] },
  { id: 'sk-lang-20', canonicalName: 'Bash', category: 'languages', aliases: ['shell scripting', 'sh', 'zsh', 'unix shell', 'bash scripting'] },
  { id: 'sk-lang-21', canonicalName: 'PowerShell', category: 'languages', aliases: ['pwsh', 'windows powershell'] },
  { id: 'sk-lang-22', canonicalName: 'MATLAB', category: 'languages', aliases: ['simulink'] },
  { id: 'sk-lang-23', canonicalName: 'Julia', category: 'languages', aliases: ['julialang'] },
  { id: 'sk-lang-24', canonicalName: 'Elixir', category: 'languages', aliases: ['erlang/otp', 'beam'] },
  { id: 'sk-lang-25', canonicalName: 'Haskell', category: 'languages', aliases: ['ghc'] },
  { id: 'sk-lang-26', canonicalName: 'Perl', category: 'languages', aliases: ['perl5'] },
  { id: 'sk-lang-27', canonicalName: 'Lua', category: 'languages', aliases: ['luajit'] },
  { id: 'sk-lang-28', canonicalName: 'Solidity', category: 'languages', aliases: ['evm solidity', 'smart contracts'] },
  { id: 'sk-lang-29', canonicalName: 'GraphQL', category: 'languages', aliases: ['gql', 'graphql schema'] },
  { id: 'sk-lang-30', canonicalName: 'Assembly', category: 'languages', aliases: ['x86 assembly', 'arm assembly', 'nasm'] },
  { id: 'sk-lang-31', canonicalName: 'Objective-C', category: 'languages', aliases: ['objc', 'objective c'] },
  { id: 'sk-lang-32', canonicalName: 'Groovy', category: 'languages', aliases: ['apache groovy'] },
  { id: 'sk-lang-33', canonicalName: 'Clojure', category: 'languages', aliases: ['clojurescript'] },
  { id: 'sk-lang-34', canonicalName: 'F#', category: 'languages', aliases: ['fsharp'] },
  { id: 'sk-lang-35', canonicalName: 'OCaml', category: 'languages', aliases: ['reasonml'] },
  { id: 'sk-lang-36', canonicalName: 'Verilog', category: 'languages', aliases: ['systemverilog', 'hdl'] },
  { id: 'sk-lang-37', canonicalName: 'VHDL', category: 'languages', aliases: ['fpga vhdl'] },
  { id: 'sk-lang-38', canonicalName: 'YAML', category: 'languages', aliases: ['yml'] },
  { id: 'sk-lang-39', canonicalName: 'JSON', category: 'languages', aliases: ['json schema', 'jsonl'] },
  { id: 'sk-lang-40', canonicalName: 'XML', category: 'languages', aliases: ['xslt', 'xpath'] },
  { id: 'sk-lang-41', canonicalName: 'Markdown', category: 'languages', aliases: ['mdx'] },
  { id: 'sk-lang-42', canonicalName: 'LaTeX', category: 'languages', aliases: ['tex', 'overleaf'] },
  { id: 'sk-lang-43', canonicalName: 'SAS', category: 'languages', aliases: ['sas programming'] },
  { id: 'sk-lang-44', canonicalName: 'COBOL', category: 'languages', aliases: ['mainframe cobol'] },
  { id: 'sk-lang-45', canonicalName: 'Fortran', category: 'languages', aliases: ['fortran 90'] },
  { id: 'sk-lang-46', canonicalName: 'Apex', category: 'languages', aliases: ['salesforce apex'] },
  { id: 'sk-lang-47', canonicalName: 'ABAP', category: 'languages', aliases: ['sap abap'] },
  { id: 'sk-lang-48', canonicalName: 'WebAssembly', category: 'languages', aliases: ['wasm'] },
  { id: 'sk-lang-49', canonicalName: 'Zig', category: 'languages', aliases: ['ziglang'] },
  { id: 'sk-lang-50', canonicalName: 'Prolog', category: 'languages', aliases: ['swi-prolog'] },
  { id: 'sk-lang-51', canonicalName: 'Scheme', category: 'languages', aliases: ['racket', 'lisp'] },
  { id: 'sk-lang-52', canonicalName: 'Ada', category: 'languages', aliases: ['spark ada'] },
  { id: 'sk-lang-53', canonicalName: 'Crystal', category: 'languages', aliases: ['crystal lang'] },
  { id: 'sk-lang-54', canonicalName: 'Nim', category: 'languages', aliases: ['nimlang'] },
  { id: 'sk-lang-55', canonicalName: 'Sass', category: 'languages', aliases: ['scss', 'less'] },
  { id: 'sk-lang-56', canonicalName: 'Cypher', category: 'languages', aliases: ['neo4j cypher'] },
  { id: 'sk-lang-57', canonicalName: 'SPARQL', category: 'languages', aliases: ['rdf sparql'] },
  { id: 'sk-lang-58', canonicalName: 'VB.NET', category: 'languages', aliases: ['vba', 'visual basic', 'excel vba'] },
  { id: 'sk-lang-59', canonicalName: 'Delphi', category: 'languages', aliases: ['object pascal', 'pascal'] },
  { id: 'sk-lang-60', canonicalName: 'Mojo', category: 'languages', aliases: ['modular mojo'] },
  { id: 'sk-lang-61', canonicalName: 'Move', category: 'languages', aliases: ['aptos move', 'sui move'] },
  { id: 'sk-lang-62', canonicalName: 'Cairo', category: 'languages', aliases: ['starknet cairo'] },
  { id: 'sk-lang-63', canonicalName: 'Hack', category: 'languages', aliases: ['hhvm'] },
  { id: 'sk-lang-64', canonicalName: 'Smalltalk', category: 'languages', aliases: ['pharo'] },
  { id: 'sk-lang-65', canonicalName: 'Tcl', category: 'languages', aliases: ['tcl/tk'] },

  // ============================================================================
  // 2. FRAMEWORKS, LIBRARIES & PRODUCT ARCHITECTURE (90 skills)
  // ============================================================================
  { id: 'sk-fw-1', canonicalName: 'React', category: 'frameworks', aliases: ['reactjs', 'react.js', 'react 18', 'react 19', 'react hooks'] },
  { id: 'sk-fw-2', canonicalName: 'Next.js', category: 'frameworks', aliases: ['nextjs', 'next', 'next.js app router'] },
  { id: 'sk-fw-3', canonicalName: 'Node.js', category: 'frameworks', aliases: ['nodejs', 'node', 'node.js runtime'] },
  { id: 'sk-fw-4', canonicalName: 'Express.js', category: 'frameworks', aliases: ['express', 'expressjs'] },
  { id: 'sk-fw-5', canonicalName: 'FastAPI', category: 'frameworks', aliases: ['fast api', 'python fastapi'] },
  { id: 'sk-fw-6', canonicalName: 'Django', category: 'frameworks', aliases: ['django rest framework', 'drf', 'python django'] },
  { id: 'sk-fw-7', canonicalName: 'Flask', category: 'frameworks', aliases: ['python flask'] },
  { id: 'sk-fw-8', canonicalName: 'Spring Boot', category: 'frameworks', aliases: ['spring', 'spring framework', 'spring mvc', 'spring security', 'java spring'] },
  { id: 'sk-fw-9', canonicalName: 'Angular', category: 'frameworks', aliases: ['angularjs', 'angular 17', 'angular2+'] },
  { id: 'sk-fw-10', canonicalName: 'Vue.js', category: 'frameworks', aliases: ['vue', 'vuejs', 'vue 3', 'pinia', 'vuex'] },
  { id: 'sk-fw-11', canonicalName: 'Nuxt.js', category: 'frameworks', aliases: ['nuxt', 'nuxt3'] },
  { id: 'sk-fw-12', canonicalName: 'Svelte', category: 'frameworks', aliases: ['sveltekit', 'svelte.js'] },
  { id: 'sk-fw-13', canonicalName: 'Tailwind CSS', category: 'frameworks', aliases: ['tailwind', 'tailwindcss'] },
  { id: 'sk-fw-14', canonicalName: 'NestJS', category: 'frameworks', aliases: ['nest', 'nest.js'] },
  { id: 'sk-fw-15', canonicalName: 'Redux', category: 'frameworks', aliases: ['redux toolkit', 'rtk', 'react-redux'] },
  { id: 'sk-fw-16', canonicalName: 'Zustand', category: 'frameworks', aliases: ['zustand state'] },
  { id: 'sk-fw-17', canonicalName: 'TanStack Query', category: 'frameworks', aliases: ['react query', 'react-query'] },
  { id: 'sk-fw-18', canonicalName: 'React Native', category: 'frameworks', aliases: ['expo', 'react-native'] },
  { id: 'sk-fw-19', canonicalName: 'Flutter', category: 'frameworks', aliases: ['flutter sdk'] },
  { id: 'sk-fw-20', canonicalName: '.NET Core', category: 'frameworks', aliases: ['.net', 'ASP.NET', 'asp.net core', 'dotnet', '.net 8', 'entity framework'] },
  { id: 'sk-fw-21', canonicalName: 'Ruby on Rails', category: 'frameworks', aliases: ['rails', 'ror'] },
  { id: 'sk-fw-22', canonicalName: 'Laravel', category: 'frameworks', aliases: ['php laravel'] },
  { id: 'sk-fw-23', canonicalName: 'Symfony', category: 'frameworks', aliases: ['php symfony'] },
  { id: 'sk-fw-24', canonicalName: 'Phoenix', category: 'frameworks', aliases: ['phoenix liveview', 'elixir phoenix'] },
  { id: 'sk-fw-25', canonicalName: 'Gin', category: 'frameworks', aliases: ['gin-gonic', 'go gin'] },
  { id: 'sk-fw-26', canonicalName: 'Fiber', category: 'frameworks', aliases: ['gofiber'] },
  { id: 'sk-fw-27', canonicalName: 'Actix Web', category: 'frameworks', aliases: ['actix', 'axum', 'tokio'] },
  { id: 'sk-fw-28', canonicalName: 'REST APIs', category: 'frameworks', aliases: ['rest', 'restful api', 'restful apis', 'restful services', 'openapi', 'swagger'] },
  { id: 'sk-fw-29', canonicalName: 'gRPC', category: 'frameworks', aliases: ['protobuf', 'protocol buffers'] },
  { id: 'sk-fw-30', canonicalName: 'WebSockets', category: 'frameworks', aliases: ['socket.io', 'websocket', 'ws', 'webrtc'] },
  { id: 'sk-fw-31', canonicalName: 'Microservices', category: 'frameworks', aliases: ['microservice architecture', 'service-oriented architecture', 'soa'] },
  { id: 'sk-fw-32', canonicalName: 'System Design', category: 'frameworks', aliases: ['distributed systems', 'high availability', 'scalability', 'low-latency systems'] },
  { id: 'sk-fw-33', canonicalName: 'Prisma', category: 'frameworks', aliases: ['prisma orm'] },
  { id: 'sk-fw-34', canonicalName: 'Drizzle ORM', category: 'frameworks', aliases: ['drizzle'] },
  { id: 'sk-fw-35', canonicalName: 'TypeORM', category: 'frameworks', aliases: ['sequelize', 'mongoose'] },
  { id: 'sk-fw-36', canonicalName: 'SQLAlchemy', category: 'frameworks', aliases: ['alembic', 'pydantic'] },
  { id: 'sk-fw-37', canonicalName: 'Hibernate', category: 'frameworks', aliases: ['jpa', 'java persistence api'] },
  { id: 'sk-fw-38', canonicalName: 'Jest', category: 'frameworks', aliases: ['unit testing', 'vitest', 'mocha', 'chai'] },
  { id: 'sk-fw-39', canonicalName: 'Playwright', category: 'frameworks', aliases: ['e2e testing', 'end-to-end testing'] },
  { id: 'sk-fw-40', canonicalName: 'Cypress', category: 'frameworks', aliases: ['cypress.io'] },
  { id: 'sk-fw-41', canonicalName: 'Selenium', category: 'frameworks', aliases: ['webdriver', 'appium'] },
  { id: 'sk-fw-42', canonicalName: 'Pytest', category: 'frameworks', aliases: ['python unittest'] },
  { id: 'sk-fw-43', canonicalName: 'JUnit', category: 'frameworks', aliases: ['junit5', 'mockito', 'testng'] },
  { id: 'sk-fw-44', canonicalName: 'Vite', category: 'frameworks', aliases: ['vitejs', 'rollup', 'esbuild'] },
  { id: 'sk-fw-45', canonicalName: 'Webpack', category: 'frameworks', aliases: ['babel', 'turbopack'] },
  { id: 'sk-fw-46', canonicalName: 'Three.js', category: 'frameworks', aliases: ['threejs', 'webgl', 'react three fiber'] },
  { id: 'sk-fw-47', canonicalName: 'D3.js', category: 'frameworks', aliases: ['d3', 'recharts', 'chart.js'] },
  { id: 'sk-fw-48', canonicalName: 'Framer Motion', category: 'frameworks', aliases: ['motion', 'gsap'] },
  { id: 'sk-fw-49', canonicalName: 'Radix UI', category: 'frameworks', aliases: ['shadcn/ui', 'shadcn', 'headless ui', 'material ui', 'mui', 'ant design', 'chakra ui'] },
  { id: 'sk-fw-50', canonicalName: 'Bootstrap', category: 'frameworks', aliases: ['bootstrap 5'] },
  { id: 'sk-fw-51', canonicalName: 'Storybook', category: 'frameworks', aliases: ['design systems', 'component library'] },
  { id: 'sk-fw-52', canonicalName: 'Electron', category: 'frameworks', aliases: ['tauri'] },
  { id: 'sk-fw-53', canonicalName: 'Qt', category: 'frameworks', aliases: ['pyqt', 'wxwidgets'] },
  { id: 'sk-fw-54', canonicalName: 'SwiftUI', category: 'frameworks', aliases: ['uikit', 'combine'] },
  { id: 'sk-fw-55', canonicalName: 'Jetpack Compose', category: 'frameworks', aliases: ['android sdk', 'android jetpack'] },
  { id: 'sk-fw-56', canonicalName: 'Unity', category: 'frameworks', aliases: ['unity3d', 'unreal engine'] },
  { id: 'sk-fw-57', canonicalName: 'Remix', category: 'frameworks', aliases: ['react router', 'react-router'] },
  { id: 'sk-fw-58', canonicalName: 'Astro', category: 'frameworks', aliases: ['astrojs', 'gatsby'] },
  { id: 'sk-fw-59', canonicalName: 'SolidJS', category: 'frameworks', aliases: ['qwik', 'preact'] },
  { id: 'sk-fw-60', canonicalName: 'tRPC', category: 'frameworks', aliases: ['apollo graphql', 'apollo client', 'apollo server'] },
  { id: 'sk-fw-61', canonicalName: 'RxJS', category: 'frameworks', aliases: ['reactive programming', 'ngrx'] },
  { id: 'sk-fw-62', canonicalName: 'Celery', category: 'frameworks', aliases: ['bullmq', 'sidekiq'] },
  { id: 'sk-fw-63', canonicalName: 'OAuth 2.0', category: 'frameworks', aliases: ['oauth', 'oidc', 'openid connect', 'jwt', 'saml', 'sso', 'nextauth', 'auth0', 'clerk'] },
  { id: 'sk-fw-64', canonicalName: 'Stripe API', category: 'frameworks', aliases: ['razorpay', 'payment gateways', 'fintech payments'] },
  { id: 'sk-fw-65', canonicalName: 'WebRTC', category: 'frameworks', aliases: ['livekit', 'media streaming'] },
  { id: 'sk-fw-66', canonicalName: 'Progressive Web Apps', category: 'frameworks', aliases: ['pwa', 'service workers', 'web workers'] },
  { id: 'sk-fw-67', canonicalName: 'Accessibility (WCAG)', category: 'frameworks', aliases: ['a11y', 'wcag', 'aria'] },
  { id: 'sk-fw-68', canonicalName: 'Object-Oriented Programming', category: 'frameworks', aliases: ['oop', 'solid principles', 'design patterns'] },
  { id: 'sk-fw-69', canonicalName: 'Data Structures & Algorithms', category: 'frameworks', aliases: ['dsa', 'data structures', 'algorithms'] },
  { id: 'sk-fw-70', canonicalName: 'Agile & Scrum', category: 'frameworks', aliases: ['agile', 'scrum', 'kanban', 'sprint planning', 'sdlc'] },
  { id: 'sk-fw-71', canonicalName: 'Product Management', category: 'frameworks', aliases: ['product strategy', 'prd', 'product roadmap', 'user stories', 'go-to-market', 'gtm'] },
  { id: 'sk-fw-72', canonicalName: 'UI/UX Design', category: 'frameworks', aliases: ['figma', 'wireframing', 'prototyping', 'user research', 'usability testing'] },
  { id: 'sk-fw-73', canonicalName: 'Technical Writing', category: 'frameworks', aliases: ['api documentation', 'system architecture docs', 'rfcs'] },
  { id: 'sk-fw-74', canonicalName: 'Code Review', category: 'frameworks', aliases: ['pair programming', 'mentoring', 'engineering leadership'] },
  { id: 'sk-fw-75', canonicalName: 'Event-Driven Architecture', category: 'frameworks', aliases: ['eda', 'cqrs', 'event sourcing', 'pub/sub'] },
  { id: 'sk-fw-76', canonicalName: 'Domain-Driven Design', category: 'frameworks', aliases: ['ddd', 'clean architecture', 'hexagonal architecture'] },
  { id: 'sk-fw-77', canonicalName: 'Test-Driven Development', category: 'frameworks', aliases: ['tdd', 'bdd', 'cucumber'] },
  { id: 'sk-fw-78', canonicalName: 'WordPress', category: 'frameworks', aliases: ['shopify', 'webflow', 'headless cms', 'strapi', 'contentful', 'sanity'] },
  { id: 'sk-fw-79', canonicalName: 'Fastify', category: 'frameworks', aliases: ['hono', 'koa'] },
  { id: 'sk-fw-80', canonicalName: 'Quarkus', category: 'frameworks', aliases: ['micronaut', 'jakarta ee'] },

  // ============================================================================
  // 3. CLOUD, DATABASES, INFRASTRUCTURE & DEVOPS (85 skills)
  // ============================================================================
  { id: 'sk-cloud-1', canonicalName: 'AWS', category: 'cloudAndDevOps', aliases: ['amazon web services', 'ec2', 's3', 'lambda', 'aws lambda', 'ecs', 'eks', 'rds', 'dynamodb', 'cloudfront', 'iam', 'sqs', 'sns'] },
  { id: 'sk-cloud-2', canonicalName: 'Google Cloud Platform', category: 'cloudAndDevOps', aliases: ['gcp', 'google cloud', 'cloud run', 'gke', 'bigquery', 'cloud sql', 'vertex ai'] },
  { id: 'sk-cloud-3', canonicalName: 'Microsoft Azure', category: 'cloudAndDevOps', aliases: ['azure', 'azure devops', 'aks', 'azure functions', 'cosmos db'] },
  { id: 'sk-cloud-4', canonicalName: 'Docker', category: 'cloudAndDevOps', aliases: ['docker compose', 'containerization', 'containers', 'dockerfile'] },
  { id: 'sk-cloud-5', canonicalName: 'Kubernetes', category: 'cloudAndDevOps', aliases: ['k8s', 'helm', 'kubectl', 'istio', 'service mesh'] },
  { id: 'sk-cloud-6', canonicalName: 'PostgreSQL', category: 'cloudAndDevOps', aliases: ['postgres', 'psql', 'pgvector', 'supabase'] },
  { id: 'sk-cloud-7', canonicalName: 'MySQL', category: 'cloudAndDevOps', aliases: ['mariadb', 'planetscale'] },
  { id: 'sk-cloud-8', canonicalName: 'MongoDB', category: 'cloudAndDevOps', aliases: ['mongo', 'nosql', 'mongodb atlas'] },
  { id: 'sk-cloud-9', canonicalName: 'Redis', category: 'cloudAndDevOps', aliases: ['redis cluster', 'redis cache', 'upstash', 'memcached'] },
  { id: 'sk-cloud-10', canonicalName: 'Terraform', category: 'cloudAndDevOps', aliases: ['iac', 'infrastructure as code', 'opentofu', 'pulumi', 'cloudformation'] },
  { id: 'sk-cloud-11', canonicalName: 'CI/CD', category: 'cloudAndDevOps', aliases: ['ci/cd pipelines', 'continuous integration', 'continuous deployment', 'continuous delivery'] },
  { id: 'sk-cloud-12', canonicalName: 'GitHub Actions', category: 'cloudAndDevOps', aliases: ['gitlab ci', 'circleci', 'bitbucket pipelines', 'travis ci'] },
  { id: 'sk-cloud-13', canonicalName: 'Jenkins', category: 'cloudAndDevOps', aliases: ['jenkins pipelines', 'groovy jenkins'] },
  { id: 'sk-cloud-14', canonicalName: 'Git', category: 'cloudAndDevOps', aliases: ['github', 'gitlab', 'bitbucket', 'version control'] },
  { id: 'sk-cloud-15', canonicalName: 'Linux', category: 'cloudAndDevOps', aliases: ['ubuntu', 'debian', 'rhel', 'centos', 'alpine linux', 'unix', 'posix'] },
  { id: 'sk-cloud-16', canonicalName: 'Nginx', category: 'cloudAndDevOps', aliases: ['reverse proxy', 'apache', 'caddy', 'haproxy', 'envoy', 'traefik'] },
  { id: 'sk-cloud-17', canonicalName: 'Apache Kafka', category: 'cloudAndDevOps', aliases: ['kafka', 'confluent', 'event streaming'] },
  { id: 'sk-cloud-18', canonicalName: 'RabbitMQ', category: 'cloudAndDevOps', aliases: ['amqp', 'message queues', 'activemq', 'nats'] },
  { id: 'sk-cloud-19', canonicalName: 'Elasticsearch', category: 'cloudAndDevOps', aliases: ['elk stack', 'opensearch', 'kibana', 'logstash', 'algolia'] },
  { id: 'sk-cloud-20', canonicalName: 'Prometheus', category: 'cloudAndDevOps', aliases: ['promql', 'alertmanager'] },
  { id: 'sk-cloud-21', canonicalName: 'Grafana', category: 'cloudAndDevOps', aliases: ['loki', 'tempo', 'dashboards & alerting'] },
  { id: 'sk-cloud-22', canonicalName: 'Datadog', category: 'cloudAndDevOps', aliases: ['new relic', 'dynatrace', 'sentry', 'splunk', 'apm'] },
  { id: 'sk-cloud-23', canonicalName: 'OpenTelemetry', category: 'cloudAndDevOps', aliases: ['distributed tracing', 'jaeger', 'zipkin', 'observability'] },
  { id: 'sk-cloud-24', canonicalName: 'Ansible', category: 'cloudAndDevOps', aliases: ['chef', 'puppet', 'saltstack', 'configuration management'] },
  { id: 'sk-cloud-25', canonicalName: 'ArgoCD', category: 'cloudAndDevOps', aliases: ['gitops', 'fluxcd'] },
  { id: 'sk-cloud-26', canonicalName: 'Firebase', category: 'cloudAndDevOps', aliases: ['firestore', 'firebase auth', 'cloud functions'] },
  { id: 'sk-cloud-27', canonicalName: 'Supabase', category: 'cloudAndDevOps', aliases: ['supabase auth', 'supabase edge functions', 'row level security', 'rls'] },
  { id: 'sk-cloud-28', canonicalName: 'SQLite', category: 'cloudAndDevOps', aliases: ['libsql', 'turso', 'duckdb'] },
  { id: 'sk-cloud-29', canonicalName: 'Apache Cassandra', category: 'cloudAndDevOps', aliases: ['cassandra', 'scylladb'] },
  { id: 'sk-cloud-30', canonicalName: 'ClickHouse', category: 'cloudAndDevOps', aliases: ['timescaledb', 'influxdb', 'time-series db'] },
  { id: 'sk-cloud-31', canonicalName: 'Neo4j', category: 'cloudAndDevOps', aliases: ['graph database', 'amazon neptune'] },
  { id: 'sk-cloud-32', canonicalName: 'Oracle Database', category: 'cloudAndDevOps', aliases: ['oracle db', 'sql server', 'ms sql', 'ibm db2'] },
  { id: 'sk-cloud-33', canonicalName: 'Snowflake', category: 'cloudAndDevOps', aliases: ['snowflake data cloud', 'data warehouse', 'amazon redshift'] },
  { id: 'sk-cloud-34', canonicalName: 'Databricks', category: 'cloudAndDevOps', aliases: ['delta lake', 'lakehouse'] },
  { id: 'sk-cloud-35', canonicalName: 'Cloudflare', category: 'cloudAndDevOps', aliases: ['cloudflare workers', 'cdn', 'edge computing', 'vercel', 'netlify'] },
  { id: 'sk-cloud-36', canonicalName: 'Cybersecurity', category: 'cloudAndDevOps', aliases: ['devsecops', 'owasp', 'penetration testing', 'vulnerability scanning', 'zero trust', 'soc2', 'iso 27001', 'gdpr'] },
  { id: 'sk-cloud-37', canonicalName: 'Networking', category: 'cloudAndDevOps', aliases: ['tcp/ip', 'dns', 'http/2', 'http/3', 'tls/ssl', 'vpc', 'load balancing', 'bgp'] },
  { id: 'sk-cloud-38', canonicalName: 'Serverless', category: 'cloudAndDevOps', aliases: ['serverless framework', 'aws sam', 'knative'] },
  { id: 'sk-cloud-39', canonicalName: 'Site Reliability Engineering', category: 'cloudAndDevOps', aliases: ['sre', 'slas', 'slos', 'slis', 'incident management', 'chaos engineering', 'pagerduty'] },
  { id: 'sk-cloud-40', canonicalName: 'HashiCorp Vault', category: 'cloudAndDevOps', aliases: ['secrets management', 'consul', 'nomad'] },
  { id: 'sk-cloud-41', canonicalName: 'SonarQube', category: 'cloudAndDevOps', aliases: ['sast', 'dast', 'snyk', 'trivy'] },
  { id: 'sk-cloud-42', canonicalName: 'Jira', category: 'cloudAndDevOps', aliases: ['confluence', 'linear', 'notion', 'asana', 'trello'] },

  // ============================================================================
  // 4. AI, LLM, DATA SCIENCE, ANALYTICS & BUSINESS INTELLIGENCE (85 skills)
  // ============================================================================
  { id: 'sk-ai-1', canonicalName: 'Machine Learning', category: 'aiAndData', aliases: ['ml', 'supervised learning', 'unsupervised learning', 'predictive modeling'] },
  { id: 'sk-ai-2', canonicalName: 'Deep Learning', category: 'aiAndData', aliases: ['dl', 'neural networks', 'cnn', 'rnn', 'lstm', 'transformers'] },
  { id: 'sk-ai-3', canonicalName: 'Generative AI', category: 'aiAndData', aliases: ['genai', 'gen ai', 'foundation models', 'multimodal ai'] },
  { id: 'sk-ai-4', canonicalName: 'Large Language Models', category: 'aiAndData', aliases: ['llm', 'llms', 'llm integration', 'gpt-4', 'claude', 'gemini', 'llama', 'mistral', 'openrouter'] },
  { id: 'sk-ai-5', canonicalName: 'RAG', category: 'aiAndData', aliases: ['retrieval-augmented generation', 'rag pipelines', 'rag architectures', 'hybrid search', 'semantic search'] },
  { id: 'sk-ai-6', canonicalName: 'LangChain', category: 'aiAndData', aliases: ['langchain.js', 'langsmith'] },
  { id: 'sk-ai-7', canonicalName: 'LangGraph', category: 'aiAndData', aliases: ['multi-agent systems', 'ai agents', 'autonomous agents', 'crewai', 'autogen', 'llamaindex'] },
  { id: 'sk-ai-8', canonicalName: 'PyTorch', category: 'aiAndData', aliases: ['torch', 'pytorch lightning'] },
  { id: 'sk-ai-9', canonicalName: 'TensorFlow', category: 'aiAndData', aliases: ['tf', 'keras', 'tflite'] },
  { id: 'sk-ai-10', canonicalName: 'Scikit-Learn', category: 'aiAndData', aliases: ['sklearn', 'xgboost', 'lightgbm', 'catboost'] },
  { id: 'sk-ai-11', canonicalName: 'Hugging Face', category: 'aiAndData', aliases: ['transformers library', 'diffusers', 'peft', 'lora', 'qlora', 'fine-tuning'] },
  { id: 'sk-ai-12', canonicalName: 'Vector Databases', category: 'aiAndData', aliases: ['vector search', 'hnsw', 'pinecone', 'weaviate', 'milvus', 'qdrant', 'chromadb', 'faiss', 'embeddings'] },
  { id: 'sk-ai-13', canonicalName: 'Prompt Engineering', category: 'aiAndData', aliases: ['few-shot prompting', 'chain-of-thought', 'structured outputs', 'function calling', 'tool calling', 'mcp'] },
  { id: 'sk-ai-14', canonicalName: 'LLM Evaluation', category: 'aiAndData', aliases: ['ragas', 'deepeval', 'evals', 'hallucination detection', 'guardrails'] },
  { id: 'sk-ai-15', canonicalName: 'Natural Language Processing', category: 'aiAndData', aliases: ['nlp', 'spacy', 'nltk', 'bert', 'tokenization', 'sentiment analysis', 'ner'] },
  { id: 'sk-ai-16', canonicalName: 'Computer Vision', category: 'aiAndData', aliases: ['cv', 'opencv', 'yolo', 'image segmentation', 'object detection', 'ocr', 'tesseract'] },
  { id: 'sk-ai-17', canonicalName: 'Speech & Voice AI', category: 'aiAndData', aliases: ['whisper', 'elevenlabs', 'tts', 'stt', 'asr', 'voice agents'] },
  { id: 'sk-ai-18', canonicalName: 'Pandas', category: 'aiAndData', aliases: ['polars', 'dataframes', 'data wrangling'] },
  { id: 'sk-ai-19', canonicalName: 'NumPy', category: 'aiAndData', aliases: ['scipy', 'scientific computing'] },
  { id: 'sk-ai-20', canonicalName: 'Apache Spark', category: 'aiAndData', aliases: ['pyspark', 'spark sql', 'big data'] },
  { id: 'sk-ai-21', canonicalName: 'Apache Airflow', category: 'aiAndData', aliases: ['airflow', 'dagster', 'prefect', 'data pipelines', 'etl', 'elt'] },
  { id: 'sk-ai-22', canonicalName: 'dbt', category: 'aiAndData', aliases: ['data build tool', 'analytics engineering', 'data modeling'] },
  { id: 'sk-ai-23', canonicalName: 'MLflow', category: 'aiAndData', aliases: ['mlops', 'weights & biases', 'wandb', 'kubeflow', 'dvc', 'model registry', 'model deployment'] },
  { id: 'sk-ai-24', canonicalName: 'ONNX', category: 'aiAndData', aliases: ['tensorrt', 'vllm', 'triton inference server', 'cuda', 'model quantization'] },
  { id: 'sk-ai-25', canonicalName: 'Tableau', category: 'aiAndData', aliases: ['tableau desktop', 'data visualization'] },
  { id: 'sk-ai-26', canonicalName: 'Power BI', category: 'aiAndData', aliases: ['dax', 'power query', 'microsoft power bi'] },
  { id: 'sk-ai-27', canonicalName: 'Looker', category: 'aiAndData', aliases: ['lookml', 'google looker studio', 'metabase', 'superset'] },
  { id: 'sk-ai-28', canonicalName: 'Data Analytics', category: 'aiAndData', aliases: ['business intelligence', 'bi', 'exploratory data analysis', 'eda', 'kpi reporting'] },
  { id: 'sk-ai-29', canonicalName: 'A/B Testing', category: 'aiAndData', aliases: ['experimentation', 'hypothesis testing', 'statistical inference', 'bayesian statistics', 'causal inference'] },
  { id: 'sk-ai-30', canonicalName: 'Time Series Forecasting', category: 'aiAndData', aliases: ['arima', 'prophet', 'quantitative analysis', 'econometrics'] },
  { id: 'sk-ai-31', canonicalName: 'Recommender Systems', category: 'aiAndData', aliases: ['collaborative filtering', 'personalization', 'ranking models'] },
  { id: 'sk-ai-32', canonicalName: 'Reinforcement Learning', category: 'aiAndData', aliases: ['rl', 'rlhf', 'dpo', 'ppo'] },
  { id: 'sk-ai-33', canonicalName: 'Jupyter', category: 'aiAndData', aliases: ['jupyter notebooks', 'google colab', 'matplotlib', 'seaborn', 'plotly'] },
  { id: 'sk-ai-34', canonicalName: 'Streamlit', category: 'aiAndData', aliases: ['gradio', 'dash'] },
  { id: 'sk-ai-35', canonicalName: 'Advanced Excel', category: 'aiAndData', aliases: ['pivot tables', 'financial modeling', 'google sheets'] },
  { id: 'sk-ai-36', canonicalName: 'Product Analytics', category: 'aiAndData', aliases: ['mixpanel', 'amplitude', 'posthog', 'google analytics', 'ga4', 'segment', 'funnel analysis', 'cohort analysis'] },
  { id: 'sk-ai-37', canonicalName: 'CRM & Revenue Ops', category: 'aiAndData', aliases: ['salesforce', 'hubspot', 'market research', 'financial analysis', 'stakeholder management', 'business strategy'] },
];

/**
 * Flatten and verify total skill tokens in taxonomy (canonical + aliases > 350+)
 */
export function getTaxonomyIndex(
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): Map<string, SkillTaxonomyEntry> {
  const map = new Map<string, SkillTaxonomyEntry>();
  for (const entry of customTaxonomy) {
    map.set(entry.canonicalName.toLowerCase().trim(), entry);
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase().trim(), entry);
    }
  }
  return map;
}

/**
 * Resolves a raw skill string to its canonical taxonomy entry if matched,
 * or returns a cleaned title-cased string if custom.
 */
export function resolveCanonicalSkill(
  rawSkill: string,
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): { canonicalName: string; category: SkillCategoryKey | null; matchedTaxonomy: boolean } {
  const cleaned = String(rawSkill || '')
    .replace(/^[•\-*+]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return { canonicalName: '', category: null, matchedTaxonomy: false };
  }

  const index = getTaxonomyIndex(customTaxonomy);
  const direct = index.get(cleaned.toLowerCase());
  if (direct) {
    return {
      canonicalName: direct.canonicalName,
      category: direct.category,
      matchedTaxonomy: true,
    };
  }

  // Strip parenthetical version notes e.g. "Python (3.11)" or "PostgreSQL (pgvector)"
  const parenMatch = cleaned.match(/^([^(]+)\(([^)]+)\)$/);
  if (parenMatch) {
    const outer = index.get(parenMatch[1].trim().toLowerCase());
    if (outer) {
      return {
        canonicalName: outer.canonicalName,
        category: outer.category,
        matchedTaxonomy: true,
      };
    }
  }

  return {
    canonicalName: cleaned,
    category: null,
    matchedTaxonomy: false,
  };
}

/**
 *Deterministically scans a raw text block (resume or job description) and returns
 * all canonical skills found in the text, sorted in a deterministic canonical order.
 */
export function extractTaxonomySkillsFromText(
  text: string,
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): SkillTaxonomyEntry[] {
  if (!text || !text.trim()) return [];
  const normalizedText = ` ${text.toLowerCase().replace(/[\r\n\t]+/g, ' ')} `;
  const found: SkillTaxonomyEntry[] = [];
  const seenIds = new Set<string>();

  for (const entry of customTaxonomy) {
    if (seenIds.has(entry.id)) continue;
    const candidates = [entry.canonicalName, ...entry.aliases];
    for (const term of candidates) {
      const lowerTerm = term.toLowerCase().trim();
      if (!lowerTerm) continue;
      // Short 1-2 character terms like "C", "R", "Go" require strict word boundaries
      const escaped = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex =
        lowerTerm.length <= 2
          ? new RegExp(`(?:^|[\\s,;()\\[\\]/|•])${escaped}(?:$|[\\s,;()\\[\\]/|•.])`, 'i')
          : new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');

      if (regex.test(normalizedText)) {
        found.push(entry);
        seenIds.add(entry.id);
        break;
      }
    }
  }

  return found;
}

/**
 * Deterministically normalizes, deduplicates, and categorizes a skill object or flat array
 * using the canonical taxonomy, optionally enriching with skills detected in raw resume text.
 */
export function normalizeSkillsWithTaxonomy(
  rawSkills: any,
  rawTextForReconciliation = '',
  customTaxonomy: SkillTaxonomyEntry[] = DEFAULT_SKILLS_TAXONOMY
): {
  languages: string[];
  frameworks: string[];
  cloudAndDevOps: string[];
  aiAndData: string[];
} {
  const buckets: Record<SkillCategoryKey, Set<string>> = {
    languages: new Set(),
    frameworks: new Set(),
    cloudAndDevOps: new Set(),
    aiAndData: new Set(),
  };

  const addRawItem = (item: string, fallbackCategory: SkillCategoryKey) => {
    const subItems = String(item || '')
      .split(/[,;\n•|]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sub of subItems) {
      const resolved = resolveCanonicalSkill(sub, customTaxonomy);
      if (!resolved.canonicalName) continue;
      const targetCat = resolved.category || fallbackCategory;
      buckets[targetCat].add(resolved.canonicalName);
    }
  };

  if (Array.isArray(rawSkills)) {
    for (const s of rawSkills) {
      addRawItem(String(s), 'frameworks');
    }
  } else if (rawSkills && typeof rawSkills === 'object') {
    for (const s of Array.isArray(rawSkills.languages) ? rawSkills.languages : []) {
      addRawItem(String(s), 'languages');
    }
    for (const s of Array.isArray(rawSkills.frameworks) ? rawSkills.frameworks : []) {
      addRawItem(String(s), 'frameworks');
    }
    for (const s of Array.isArray(rawSkills.cloudAndDevOps) ? rawSkills.cloudAndDevOps : []) {
      addRawItem(String(s), 'cloudAndDevOps');
    }
    for (const s of Array.isArray(rawSkills.aiAndData) ? rawSkills.aiAndData : []) {
      addRawItem(String(s), 'aiAndData');
    }
  }

  // Reconcile with deterministic taxonomy scan of raw text so Gemini and OpenRouter produce identical skill sets
  if (rawTextForReconciliation && rawTextForReconciliation.trim().length > 20) {
    const textDetected = extractTaxonomySkillsFromText(rawTextForReconciliation, customTaxonomy);
    for (const entry of textDetected) {
      buckets[entry.category].add(entry.canonicalName);
    }
  }

  // Sort alphabetically inside each category for 100% deterministic ordering across AI models
  return {
    languages: Array.from(buckets.languages).sort((a, b) => a.localeCompare(b)),
    frameworks: Array.from(buckets.frameworks).sort((a, b) => a.localeCompare(b)),
    cloudAndDevOps: Array.from(buckets.cloudAndDevOps).sort((a, b) => a.localeCompare(b)),
    aiAndData: Array.from(buckets.aiAndData).sort((a, b) => a.localeCompare(b)),
  };
}

const MONTH_MAP: Record<string, string> = {
  jan: 'Jan',
  january: 'Jan',
  '01': 'Jan',
  '1': 'Jan',
  feb: 'Feb',
  february: 'Feb',
  '02': 'Feb',
  '2': 'Feb',
  mar: 'Mar',
  march: 'Mar',
  '03': 'Mar',
  '3': 'Mar',
  apr: 'Apr',
  april: 'Apr',
  '04': 'Apr',
  '4': 'Apr',
  may: 'May',
  '05': 'May',
  '5': 'May',
  jun: 'Jun',
  june: 'Jun',
  '06': 'Jun',
  '6': 'Jun',
  jul: 'Jul',
  july: 'Jul',
  '07': 'Jul',
  '7': 'Jul',
  aug: 'Aug',
  august: 'Aug',
  '08': 'Aug',
  '8': 'Aug',
  sep: 'Sep',
  sept: 'Sep',
  september: 'Sep',
  '09': 'Sep',
  '9': 'Sep',
  oct: 'Oct',
  october: 'Oct',
  '10': 'Oct',
  nov: 'Nov',
  november: 'Nov',
  '11': 'Nov',
  dec: 'Dec',
  december: 'Dec',
  '12': 'Dec',
};

/**
 * Standardizes single date token into "MMM YYYY" or "YYYY" or "Present"
 */
export function standardizeSingleDate(token: string): string {
  const clean = String(token || '').trim();
  if (!clean) return '';
  if (/^(present|current|now|ongoing|till date|to date)$/i.test(clean)) {
    return 'Present';
  }
  // Match YYYY-MM or MM/YYYY
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoMatch) {
    const mon = MONTH_MAP[isoMatch[2]] || 'Jan';
    return `${mon} ${isoMatch[1]}`;
  }
  const slashMatch = clean.match(/^(\d{1,2})[-/](\d{4})$/);
  if (slashMatch) {
    const mon = MONTH_MAP[slashMatch[1]] || 'Jan';
    return `${mon} ${slashMatch[2]}`;
  }
  // Match Month YYYY
  const wordMatch = clean.match(/^([a-zA-Z]+)\.?\s*,?\s*(\d{4})$/);
  if (wordMatch) {
    const mon = MONTH_MAP[wordMatch[1].toLowerCase()];
    if (mon) return `${mon} ${wordMatch[2]}`;
  }
  // Match standalone 4-digit year
  const yearOnly = clean.match(/^(\d{4})$/);
  if (yearOnly) return yearOnly[1];

  return clean;
}

/**
 * Standardizes a date range string e.g. "01/2023 to current" -> "Jan 2023 - Present"
 */
export function standardizeDateRange(rawDuration: string): string {
  const clean = String(rawDuration || '')
    .replace(/[–—~]/g, '-')
    .replace(/\bto\b/gi, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';

  const parts = clean.split(/\s*-\s*/).filter(Boolean);
  if (parts.length === 2) {
    const start = standardizeSingleDate(parts[0]);
    const end = standardizeSingleDate(parts[1]);
    return `${start} - ${end}`;
  }
  return standardizeSingleDate(clean);
}
