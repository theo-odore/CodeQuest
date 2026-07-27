-- ========================================================
-- CodeQuest Complete Supabase PostgreSQL Schema & 65 Questions Seed
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  college_id TEXT NOT NULL,
  terminal_number TEXT,
  role TEXT NOT NULL DEFAULT 'PARTICIPANT',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns if table already existed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terminal_number TEXT;

-- 2. Create QUESTIONS table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  code_snippet TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT,
  expected_output TEXT,
  function_name TEXT,
  function_signature TEXT,
  points INT NOT NULL DEFAULT 10,
  created_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS function_name TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS function_signature TEXT;

-- 3. Create TEST_CASES table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  stdin TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  weight INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.test_cases ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Create SESSIONS table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  current_phase TEXT NOT NULL DEFAULT 'EASY',
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  auto_score INT NOT NULL DEFAULT 0,
  total_time_sec INT NOT NULL DEFAULT 0
);

-- 5. Create ATTEMPTS table
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  test_cases_passed INT NOT NULL DEFAULT 0,
  total_test_cases INT NOT NULL DEFAULT 0,
  time_taken_sec INT NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create RUN_LOGS table
CREATE TABLE IF NOT EXISTS public.run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  submitted_code TEXT NOT NULL,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_questions_phase ON public.questions(phase);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_q ON public.attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_leaderboard ON public.sessions(auto_score DESC, total_time_sec ASC, end_time ASC);

-- Disable RLS for REST API access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs DISABLE ROW LEVEL SECURITY;

-- Default Accounts
INSERT INTO public.users (id, name, email, college_id, role, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@codequest.com', 'ADMIN001', 'ADMIN', '$2a$10$X7Xn0y/2hG1M7G1sF2cZ2u9F3fF4g5h6i7j8k9l0m1n2o3p4q5r6s')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, name, email, college_id, role, password_hash)
VALUES ('00000000-0000-0000-0000-000000000002', 'Test Participant', 'user@codequest.com', '22CS001', 'PARTICIPANT', '$2a$10$Y8Yo1z/3hH2N8H2tG3da3v0G4gG5h6i7j8k9l0m1n2o3p4q5r6s')
ON CONFLICT (email) DO NOTHING;

-- Clear existing questions for clean seed
TRUNCATE TABLE public.test_cases CASCADE;
TRUNCATE TABLE public.questions CASCADE;

-- Seed Questions & Test Cases
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000001', 'EASY', 'MCQ', 'What is the output of print(type(5 / 2))?', NULL, '<class ''int''>', '<class ''float''>', '<class ''double''>', 'Error', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000002', 'EASY', 'MCQ', 'Which keyword is used to define a function in Python?', NULL, 'func', 'def', 'function', 'lambda', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000003', 'EASY', 'MCQ', 'What does len([1, 2, 3]) return?', NULL, '2', '3', '4', 'Error', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000004', 'EASY', 'MCQ', 'Which data type is immutable in Python?', NULL, 'list', 'dict', 'tuple', 'set', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000005', 'EASY', 'MCQ', 'What is the output of print(2 ** 3)?', NULL, '6', '8', '9', 'Error', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000006', 'EASY', 'MCQ', 'Which of the following is used to handle exceptions in Python?', NULL, 'catch', 'try / except', 'error / handle', 'if / else', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000007', 'EASY', 'MCQ', 'What does range(5) generate?', NULL, '1 to 5', '0 to 4', '0 to 5', '1 to 4', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000008', 'EASY', 'MCQ', 'Which symbol is used to write a single-line comment in Python?', NULL, '//', '<!-- -->', '#', '/* */', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000009', 'EASY', 'MCQ', 'What is the correct file extension for Python source files?', NULL, '.pt', '.python', '.py', '.pyt', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000010', 'EASY', 'MCQ', 'What does the append() method do?', NULL, 'Removes the last element from a list', 'Adds an element to the end of a list', 'Sorts the list', 'Reverses the list', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000011', 'EASY', 'MCQ', 'Which of the following is a mutable data type?', NULL, 'String', 'Tuple', 'List', 'Integer', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000012', 'EASY', 'MCQ', 'What is the output of print(bool(0))?', NULL, 'True', 'False', '0', 'Error', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000013', 'EASY', 'MCQ', 'Which operator is used for floor division?', NULL, '/', '//', '%', '**', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000014', 'EASY', 'MCQ', 'Inside a class method, what does the self keyword represent?', NULL, 'The class itself', 'The parent class', 'The current object (instance)', 'A global variable', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000015', 'EASY', 'MCQ', 'What is the output of print("Hello"[1])?', NULL, 'H', 'e', 'l', 'o', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000016', 'EASY', 'MCQ', 'Which function is used to take input from the user?', NULL, 'get()', 'scan()', 'input()', 'read()', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000017', 'EASY', 'MCQ', 'Which operator is used to compare two values for equality?', NULL, '=', '==', '!=', '<=', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000018', 'EASY', 'MCQ', 'Which Python data type stores unique values only?', NULL, 'List', 'Tuple', 'Set', 'Dictionary', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000019', 'EASY', 'MCQ', 'Which keyword immediately exits a loop?', NULL, 'stop', 'exit', 'break', 'continue', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000020', 'EASY', 'MCQ', 'Which keyword skips the current iteration of a loop and moves to the next one?', NULL, 'pass', 'continue', 'break', 'next', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000021', 'EASY', 'MCQ', 'What is the output of print(3 * "Hi")?', NULL, 'HiHiHi', 'Hi3', 'Error', '333', 'A', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000022', 'EASY', 'MCQ', 'Which built-in function returns the data type of an object?', NULL, 'class()', 'type()', 'typeof()', 'datatype()', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000023', 'EASY', 'MCQ', 'Which of the following creates an empty dictionary?', NULL, '[]', '{}', '()', 'set()', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000024', 'EASY', 'MCQ', 'Which keyword is used to define a class in Python?', NULL, 'object', 'class', 'struct', 'define', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000025', 'EASY', 'MCQ', 'Which function converts a string to an integer?', NULL, 'str()', 'float()', 'int()', 'chr()', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000026', 'EASY', 'MCQ', 'What is the output of print(type(True))?', NULL, '<class ''int''>', '<class ''bool''>', '<class ''str''>', '<class ''float''>', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000027', 'EASY', 'MCQ', 'Which built-in function returns the largest value in a list?', NULL, 'large()', 'max()', 'greatest()', 'top()', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000028', 'EASY', 'MCQ', 'What is the value of 10 % 3?', NULL, '3', '1', '0', '10', 'B', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000029', 'EASY', 'MCQ', 'Which of the following statements is used to return a value from a function?', NULL, 'print', 'output', 'return', 'yield', 'C', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000030', 'EASY', 'MCQ', 'Which built-in function returns a new sorted list without modifying the original list?', NULL, 'sort()', 'order()', 'arrange()', 'sorted()', 'D', NULL, NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000031', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'x = [1, 2, 3]
y = x
y.append(4)
print(x)', NULL, NULL, NULL, NULL, NULL, '[1, 2, 3, 4]', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000032', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'def add(a, b=5):
    return a + b

print(add(10))', NULL, NULL, NULL, NULL, NULL, '15', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000033', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'text = "CodeQuest"
print(text[::-1])', NULL, NULL, NULL, NULL, NULL, 'tseuQedoC', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000034', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'numbers = (1, 2, 3)
extra = (4, 5)

print(numbers + extra)', NULL, NULL, NULL, NULL, NULL, '(1, 2, 3, 4, 5)', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000035', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'student = {
    "name": "Alice",
    "age": 20
}

print(list(student.keys()))', NULL, NULL, NULL, NULL, NULL, '[''name'', ''age'']', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000036', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'for i in range(5):
    if i == 2:
        continue
    print(i)', NULL, NULL, NULL, NULL, NULL, '0
1
3
4', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000037', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'x = 5
y = x

x += 1

print(y)', NULL, NULL, NULL, NULL, NULL, '5', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000038', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'print(3 == 3.0)', NULL, NULL, NULL, NULL, NULL, 'True', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000039', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'def display():
    return

print(display())', NULL, NULL, NULL, NULL, NULL, 'None', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000040', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'print(" ".join(["Tech", "Spark"]))', NULL, NULL, NULL, NULL, NULL, 'Tech Spark', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000041', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'numbers = [10, 20, 30]

print(len(numbers))', NULL, NULL, NULL, NULL, NULL, '3', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000042', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'for i in range(1, 6):
    if i % 2 == 0:
        print(i)', NULL, NULL, NULL, NULL, NULL, '2
4', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000043', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'text = "Python"

print(text[2:5])', NULL, NULL, NULL, NULL, NULL, 'tho', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000044', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'numbers = [2, 4, 6]

numbers.insert(1, 10)

print(numbers)', NULL, NULL, NULL, NULL, NULL, '[2, 10, 4, 6]', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000045', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'a = [1, 2]
b = [3, 4]

print(a + b)', NULL, NULL, NULL, NULL, NULL, '[1, 2, 3, 4]', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000046', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'for letter in "AI":
    print(letter)', NULL, NULL, NULL, NULL, NULL, 'A
I', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000047', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'numbers = [1, 2, 3, 4]

print(sum(numbers))', NULL, NULL, NULL, NULL, NULL, '10', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000048', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'values = [5, 2, 8, 1]

values.sort()

print(values)', NULL, NULL, NULL, NULL, NULL, '[1, 2, 5, 8]', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000049', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'name = "Python"

print(name.upper())', NULL, NULL, NULL, NULL, NULL, 'PYTHON', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000050', 'MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'x = [1, 2, 3]

print(x * 2)', NULL, NULL, NULL, NULL, NULL, '[1, 2, 3, 1, 2, 3]', NULL, NULL, 10, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000051', 'HARD', 'CODE_WRITE', 'Reverse Words in a Sentence

Write a Python function `reverse_words(sentence)` that returns the sentence with the order of words reversed.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'reverse_words', 'def reverse_words(sentence):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000051', 'CodeQuest is fun', 'fun is CodeQuest', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000051', 'Hello World', 'World Hello', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000051', 'Python is an amazing programming language', 'language programming amazing an is Python', true, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000051', 'SingleWord', 'SingleWord', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000052', 'HARD', 'CODE_WRITE', 'Prime Number Checker

Write a function `is_prime(n)` that returns `True` if the given number is prime; otherwise return `False`.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'is_prime', 'def is_prime(n):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000052', '17', 'True', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000052', '4', 'False', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000052', '1', 'False', true, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000052', '2', 'True', true, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000052', '29', 'True', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000053', 'HARD', 'CODE_WRITE', 'Fibonacci Series

Write a program to print the first **N** Fibonacci numbers.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'fibonacci', 'def fibonacci(n):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000053', '7', '0 1 1 2 3 5 8', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000053', '1', '0', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000053', '5', '0 1 1 2 3', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000054', 'HARD', 'CODE_WRITE', 'Armstrong Number

Write a program to check whether a given number is an Armstrong Number.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'is_armstrong', 'def is_armstrong(n):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000054', '153', 'Armstrong Number', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000054', '123', 'Not Armstrong Number', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000054', '370', 'Armstrong Number', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000055', 'HARD', 'CODE_WRITE', 'Palindrome Checker

Write a function that checks whether a given string is a palindrome.

Ignore uppercase/lowercase letters.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'is_palindrome', 'def is_palindrome(s):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000055', 'Madam', 'Palindrome', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000055', 'Racecar', 'Palindrome', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000055', 'CodeQuest', 'Not Palindrome', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000056', 'HARD', 'CODE_WRITE', 'Count Vowels and Consonants

Write a program that counts the total number of vowels and consonants in a string.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'count_vowels_consonants', 'def count_vowels_consonants(s):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000056', 'Hello World', 'Vowels : 3 Consonants : 7', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000056', 'AEIOU', 'Vowels : 5 Consonants : 0', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000057', 'HARD', 'CODE_WRITE', 'Remove Duplicate Elements

Given a list of integers, remove duplicate values while preserving their original order.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'remove_duplicates', 'def remove_duplicates(lst):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000057', '1 2 2 3 4 4 5', '1 2 3 4 5', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000057', '10 10 20 30', '10 20 30', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000058', 'HARD', 'CODE_WRITE', 'Second Largest Number

Find the second largest **unique** element in a list.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'second_largest', 'def second_largest(lst):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000058', '4 7 7 2 1', '4', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000058', '10 20 30 40', '30', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000059', 'HARD', 'CODE_WRITE', 'Matrix Transpose

Write a program to find the transpose of a matrix.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'transpose_matrix', 'def transpose_matrix(matrix):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000059', '1 2
3 4', '1 3
2 4', false, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000060', 'HARD', 'CODE_WRITE', 'Word Frequency Counter

Given a sentence, print the frequency of every word.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'word_frequency', 'def word_frequency(sentence):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000060', 'python code python fun', 'python : 2
code : 1
fun : 1', false, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000061', 'HARD', 'CODE_WRITE', 'Valid Parentheses

Determine whether the given expression contains balanced parentheses.

Supported brackets:
```
()
{}
[]
```', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'is_valid_parentheses', 'def is_valid_parentheses(s):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000061', '{[()]}', 'Balanced', false, 1);
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000061', '[(])', 'Not Balanced', true, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000062', 'HARD', 'CODE_WRITE', 'Caesar Cipher

Encrypt a string using Caesar Cipher.

The user enters the text and the shift value.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'caesar_cipher', 'def caesar_cipher(text, shift):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000062', 'HELLO
3', 'KHOOR', false, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000063', 'HARD', 'CODE_WRITE', 'Longest Word in a Sentence

Find the longest word present in a sentence.

If multiple words have the same maximum length, print the first one.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'longest_word', 'def longest_word(sentence):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000063', 'Python programming is awesome', 'programming', false, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000064', 'HARD', 'CODE_WRITE', 'Anagram Checker

Write a program that checks whether two given strings are anagrams.

Ignore spaces and uppercase/lowercase differences.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'is_anagram', 'def is_anagram(s1, s2):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000064', 'listen
silent', 'Anagram', false, 1);
INSERT INTO public.questions (id, phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, function_name, function_signature, points, created_by_admin_id)
VALUES ('10000000-0000-0000-0000-000000000065', 'HARD', 'CODE_WRITE', 'Tic-Tac-Toe Winner

Given a completed **3 × 3** Tic-Tac-Toe board, determine the winner.

The board contains only:
```
X
O
.
```

`.` represents an empty cell.

Print:

- `X Wins`
- `O Wins`
- `Draw`', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'tictactoe_winner', 'def tictactoe_winner(board):', 20, '00000000-0000-0000-0000-000000000001');
INSERT INTO public.test_cases (id, question_id, stdin, expected_output, is_hidden, weight)
VALUES ('20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000065', 'X O X
O X O
O X X', 'X Wins', false, 1);
