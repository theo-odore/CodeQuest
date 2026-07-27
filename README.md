# CodeQuest - Backend & Competition Platform

CodeQuest is a multi-phase quiz competition backend built with **Node.js/Express**, **PostgreSQL**, **Prisma ORM**, **JWT Authentication**, **Socket.io**, and **Automated Code Execution & Test-Case Auto-Grading**.

---

## Technical Features & Rules

1. **Server-Authoritative Timer**:
   - Total Quiz Duration: **59 Minutes (3540 seconds)** shared across all 3 phases.
   - Timer starts server-side the moment the participant starts the session (`status = IN_PROGRESS`).
   - Every request checks the remaining time against the server clock (`new Date()`).
   - If the timer reaches 0, the backend automatically finalizes and submits the session.

2. **Phase Gating**:
   - Fixed Order: `EASY` (Phase 1) → `MEDIUM` (Phase 2) → `HARD` (Phase 3).
   - Participants can only query and attempt questions matching their active session phase (`session.current_phase`).

3. **Automated Multi-Phase Grading & Partial Credit**:
   - **Phase 1 (MCQ)**: Instant exact option match (10 PTS).
   - **Phase 2 (Output Predict)**: Exact normalized output string match (15 PTS).
   - **Phase 3 (Hard Code Write)**: **Auto-Graded via Test Cases**!
     - Submissions are executed against 3-5 test cases (including hidden test cases).
     - Partial credit is calculated: `earned_points = Math.round(question.points * (test_cases_passed / total_test_cases))`.
   - Leaderboard Ranking: `ORDER BY auto_score DESC, total_time_sec ASC, end_time ASC`.

4. **Piston / Local Python Engine (Phase 3 Execution)**:
   - Endpoint: `POST /run-code` & `POST /attempts` (Phase 3).
   - Rate limited per user per question.
   - Executions are logged to `RunLog` and test case results returned.

5. **Real-time Admin Monitoring**:
   - Socket.io connection at `/admin/live`.
   - Streams live events (`SESSION_STARTED`, `PHASE_ADVANCED`, `ATTEMPT_SUBMITTED`, `SESSION_SUBMITTED`) to admins.

---

## ⚠️ Important Requirement for Admins: Fixed Function Signatures for Phase 3

When creating or modifying Phase 3 (`CODE_WRITE`) questions, **Admins MUST specify a fixed `function_name` and `function_signature`**:

### Example Admin Question Setup:
- **`function_name`**: `reverse_words`
- **`function_signature`**: `def reverse_words(sentence):`
- **Why this is mandatory**: The auto-grader programmatically imports and invokes `function_name` against hidden and visible test cases. Without a fixed signature, submitted code cannot be reliably invoked and graded automatically.

---

## Setup & Running Locally

### 1. Installation
```bash
npm install
```

### 2. Environment Variables (`.env`)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="codequest_super_secret_jwt_key_2026"
PORT=3000
PISTON_API_URL="https://emkc.org/api/v2/piston"
```

### 3. Database Migration & Seeding
```bash
# Push schema
npx prisma db push

# Seed database with initial Admin, Test User, 65 Questions & 32 Test Cases
npm run db:seed
```

### 4. Start Server
```bash
npm start
```
Open **`http://localhost:3000`** in your browser to access the competition platform.

---

## Seed Accounts

- **Admin Account**: `admin@codequest.com` / `admin123`
- **Participant Account**: `user@codequest.com` / `user123`
