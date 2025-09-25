## NKWATSA AI

You are a code generation system. Generate a minimal but functional Study Tutor web app that uses Sign In with Ethereum for login, role based access control, tool calling for assessments, and persistent progress with a clean dashboard. The bot is the engine that calls tools. Tutors define syllabus and checkpoints. Learners take quizzes. Benefits administrators gate trips and perks based on verifiable progress.

Objectives
1. Implement wallet login using SIWE with MetaMask. Create secure HttpOnly sessions bound to the wallet address. Include nonce and domain checks.
2. Implement roles and permissions for Learner, Tutor, Benefits Admin, System, and optional Platform Admin.
3. Implement tool calling endpoints that are idempotent via a required X Request Id on every write.
4. Implement a timed Readiness quiz that asks multiples of two questions. Passing rule is at least 8 of 10 correct within 180 seconds.
5. Persist attempts and progress to a relational store. Surface a dashboard that shows achievements and course progress.
6. Provide a proof stub for verifiable milestones. After a pass, create an attestation JSON and display its SHA256 hash. Buttons for EAS attestation and ERC 5192 badge are present but disabled.
7. Implement a benefits gate that issues a one time claim code when the readiness checkpoint is met.

Technology and project structure
1. Next.js with an app router. Typescript. React. Tailwind for quick UI.
2. Wagmi and viem on the client for connect and personal sign. Spruce siwe for message creation and verification on the server.
3. SQLite using better sqlite3 or Prisma. Choose either and keep it simple.
4. API routes under /api for all tools and for SIWE prepare and verify.

Database schema
Create the following tables exactly. Primary keys and unique constraints enforce idempotency and integrity.

users
wallet text primary key
display_name text
email text
created_at timestamp default current timestamp

user_roles
wallet text not null references users wallet on delete cascade
role text not null check role in LEARNER, TUTOR, BENEFITS_ADMIN, SYSTEM, PLATFORM_ADMIN
created_at timestamp default current timestamp
primary key wallet, role

courses
course_id text primary key
title text not null
syllabus_url text
version integer default 1
created_by text references users wallet
created_at timestamp default current timestamp

modules
course_id text references courses course_id on delete cascade
module_id text not null
passing_rule_json json not null
is_checkpoint boolean default false
primary key course_id, module_id

quizzes
quiz_id text primary key
course_id text not null
module_id text not null
expires_at timestamp

attempts
attempt_id text primary key
wallet text references users wallet
course_id text not null
module_id text not null
quiz_id text
score_raw integer not null
score_max integer not null
duration_s integer not null
passed boolean not null
created_at timestamp default current timestamp
request_id text unique

progress
wallet text references users wallet
course_id text
module_id text
latest_attempt_id text references attempts attempt_id
status text check status in NOT_STARTED, IN_PROGRESS, READY, BENEFIT_CLAIMED
passed_at timestamp
version integer default 1
primary key wallet, course_id, module_id

benefit_claims
claim_code text primary key
wallet text references users wallet
benefit_id text not null
created_at timestamp default current timestamp

Roles and RBAC
Define roles Learner, Tutor, Benefits Admin, System, Platform Admin. After SIWE verification, load roles for the wallet and issue a short lived session token that includes an array of roles. Implement a middleware requireRole that accepts a list of allowed roles and denies with a 403 when the caller lacks permission.

Idempotency middleware
All mutating endpoints must require X Request Id header. When the same id is seen again return the stored response. Build a simple idempotency store in the database or in memory keyed by the id. Use this wrapper for all tool routes.

Tool calling endpoints
Create the following endpoints with request and response bodies as shown. All return application json.

POST /api/tools/register_course
input request_id, course_id, title, syllabus_url, checkpoints array of module_id, passingRule, is_checkpoint
output ok true, version
allowed roles Tutor and Platform Admin

POST /api/tools/generate_quiz
input request_id, course_id, module_id, count, difficulty
output quiz_id, items array with id, stem, options or answer_format, expires_at
allowed roles System, Tutor, Platform Admin

POST /api/tools/score_attempt
input request_id, quiz_id, answers array of id and value, started_at, submitted_at
output attempt_id, score_raw, score_max, duration_s, passed
allowed roles Learner, System, Tutor, Platform Admin

POST /api/tools/update_progress
input request_id, learner_addr, course_id, module_id, attempt_id, score_raw, score_max, duration_s, passed
output progress_version and status which is IN_PROGRESS or READY
side effects persist attempt and progress and emit a minimal event log
allowed roles Learner, System, Platform Admin

POST /api/tools/issue_attestation stub
input request_id, learner_addr, course_id, module_id, score_pct, passed_at
output eas_uid or proof_hash in PoC
allowed roles System, Tutor, Platform Admin

POST /api/tools/mint_badge_sbt stub
input request_id, learner_addr, badge_id
output tx_hash and token_id or not implemented
allowed roles System, Tutor, Platform Admin

POST /api/tools/grant_benefit
input request_id, learner_addr, benefit_id
output claim_code
allowed roles Benefits Admin, System, Platform Admin

SIWE routes
GET or POST /api/siwe/prepare returns a SIWE message string with domain, uri, version 1, chainId, nonce, issuedAt
POST /api/siwe/verify accepts message and signature, verifies signature and nonce freshness, then sets an HttpOnly secure session cookie and returns the wallet address and roles

Quiz logic
Implement a page at route /quiz/ready that creates a 10 item quiz of multiples of two from numbers 1 to 30. Each item asks whether N is a multiple of two with Yes or No. The quiz has a 180 second countdown. On submit call score_attempt then update_progress.

Dashboard
Implement a protected route at /dashboard that requires a valid session. Show two cards.
Achievements shows the proof hash from the attestation stub and disabled buttons for EAS attestation and ERC 5192 badge minting.
Course Progress shows the latest attempt score, duration, attempts count, and a percent complete based on module status.

Benefits gate
Implement a protected route at /benefits/trip. If the progress status is READY issue a one time claim code and persist to benefit_claims. If not ready show a message to complete the readiness quiz.

Client side visibility rules
Learner sees Start Quiz, Resume, My Achievements, Claim Benefit
Tutor sees Create Course, Checkpoints, Question Banks, Analytics
Benefits Admin sees Validate Proof, Issue Claim Code, Redemptions
Platform Admin sees User Roles, System Health, Schemas

Seed data
Insert one Learner wallet, one Tutor wallet, one Benefits wallet, one System wallet with corresponding roles. Insert a course MATH101 with a readiness module set as a checkpoint with rule minScore eight and maxTime one hundred eighty.

Acceptance tests
1 Learner cannot call register_course and gets a forbidden response
2 Tutor can register a course and modules appear in the database
3 System can generate a quiz and Learner cannot call this endpoint directly
4 Learner can submit a quiz and update_progress moves status to READY when the rule is met
5 Benefits Admin can grant a benefit only when status is READY and receives a claim code

Non goals
No ERC 20 tokens in this version
No invasive proctoring
No external LRS integration

Deliverables
A Next.js project that builds and runs
All API routes defined above and returning the stated shapes
A working SIWE login flow with a session cookie and role loading
A working readiness quiz with persistence and a dashboard view
A benefits route that issues a claim code after the checkpoint is passed
A README that lists how to run the server and where to find routes and accounts for the seed data

Coding style
Typescript everywhere on the server and client
Small pure functions for scoring and rules
Clear error messages using json with an error field and the required_roles when denying
No dead code and no commented out blocks

Explain nothing in your output. Only emit code and configuration files for the project. Do not add comments outside code. 

