-- ========================================================
-- CodeQuest Supabase PostgreSQL Schema & Seed Migration
-- Demo Question Bank (5 Easy, 5 Medium, 5 Hard)
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  college_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PARTICIPANT',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create QUESTIONS table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase TEXT NOT NULL, -- 'EASY', 'MEDIUM', 'HARD'
  type TEXT NOT NULL,  -- 'MCQ', 'OUTPUT_PREDICT', 'CODE_WRITE'
  text TEXT NOT NULL,
  code_snippet TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT,
  expected_output TEXT,
  points INT NOT NULL DEFAULT 10,
  created_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create SESSIONS table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  current_phase TEXT NOT NULL DEFAULT 'EASY',
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  auto_score INT NOT NULL DEFAULT 0,
  total_time_sec INT NOT NULL DEFAULT 0
);

-- 4. Create ATTEMPTS table
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  time_taken_sec INT NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create RUN_LOGS table
CREATE TABLE IF NOT EXISTS public.run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  submitted_code TEXT NOT NULL,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_phase ON public.questions(phase);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_q ON public.attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_leaderboard ON public.sessions(auto_score DESC, total_time_sec ASC, end_time ASC);

-- Disable RLS for REST API accessibility
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- SEED DATA (5 Easy, 5 Medium, 5 Hard from docx)
-- ========================================================

-- Insert Default Admin Account (password: admin123)
INSERT INTO public.users (id, name, email, college_id, role, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Admin',
  'admin@codequest.com',
  'ADMIN001',
  'ADMIN',
  '$2a$10$X7Xn0y/2hG1M7G1sF2cZ2u9F3fF4g5h6i7j8k9l0m1n2o3p4q5r6s'
) ON CONFLICT (email) DO NOTHING;

-- Insert Sample Participant Account (password: user123)
INSERT INTO public.users (id, name, email, college_id, role, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Participant',
  'user@codequest.com',
  'STUDENT001',
  'PARTICIPANT',
  '$2a$10$Y8Yo1z/3hH2N8H2tG3da3v0G4gG5h6i7j8k9l0m1n2o3p4q5r6s'
) ON CONFLICT (email) DO NOTHING;

-- Insert 15 Questions from CodeQuest_Question_Bank_Demo.docx
INSERT INTO public.questions (phase, type, text, code_snippet, option_a, option_b, option_c, option_d, correct_option, expected_output, points, created_by_admin_id)
VALUES
-- Phase 1 Easy (MCQ)
('EASY', 'MCQ', 'What is the output of print(type(5 / 2))?', 'print(type(5 / 2))', '<class ''int''>', '<class ''float''>', '<class ''double''>', 'Error', 'B', NULL, 10, '00000000-0000-0000-0000-000000000001'),
('EASY', 'MCQ', 'Which keyword is used to define a function in Python?', NULL, 'func', 'def', 'function', 'lambda', 'B', NULL, 10, '00000000-0000-0000-0000-000000000001'),
('EASY', 'MCQ', 'What does len([1, 2, 3]) return?', 'len([1, 2, 3])', '2', '3', '4', 'Error', 'B', NULL, 10, '00000000-0000-0000-0000-000000000001'),
('EASY', 'MCQ', 'Which data type is immutable in Python?', NULL, 'list', 'dict', 'tuple', 'set', 'C', NULL, 10, '00000000-0000-0000-0000-000000000001'),
('EASY', 'MCQ', 'What is the output of print(2 ** 3)?', 'print(2 ** 3)', '6', '8', '9', 'Error', 'B', NULL, 10, '00000000-0000-0000-0000-000000000001'),

-- Phase 2 Medium (Output Predict)
('MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'x = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)', NULL, NULL, NULL, NULL, NULL, '[1, 2, 3, 4]', 15, '00000000-0000-0000-0000-000000000001'),
('MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'def f(a, b=5):\n    return a + b\nprint(f(10))', NULL, NULL, NULL, NULL, NULL, '15', 15, '00000000-0000-0000-0000-000000000001'),
('MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 's = ''Parul''\nprint(s[::-1])', NULL, NULL, NULL, NULL, NULL, 'luraP', 15, '00000000-0000-0000-0000-000000000001'),
('MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'a = (1, 2, 3)\nb = (4, 5)\nprint(a + b)', NULL, NULL, NULL, NULL, NULL, '(1, 2, 3, 4, 5)', 15, '00000000-0000-0000-0000-000000000001'),
('MEDIUM', 'OUTPUT_PREDICT', 'Predict the output of the following code:', 'd = {''a'': 1, ''b'': 2}\nprint(list(d.keys()))', NULL, NULL, NULL, NULL, NULL, '[''a'', ''b'']', 15, '00000000-0000-0000-0000-000000000001'),

-- Phase 3 Hard (Code Write)
('HARD', 'CODE_WRITE', 'Q1. Reverse Words in a Sentence: Write a Python function reverse_words(s) that takes a sentence and returns it with the order of words reversed. Input: "CodeQuest is fun" -> Output: "fun is CodeQuest"', 'def reverse_words(s):\n    return '' ''.join(s.split()[::-1])\n\nprint(reverse_words(''CodeQuest is fun''))', NULL, NULL, NULL, NULL, NULL, NULL, 25, '00000000-0000-0000-0000-000000000001'),
('HARD', 'CODE_WRITE', 'Q2. Prime Checker: Write a function is_prime(n) that returns True if n is a prime number, else False. Handle n <= 1 correctly. Input: 7 -> Output: True', 'def is_prime(n):\n    if n <= 1:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(7))', NULL, NULL, NULL, NULL, NULL, NULL, 25, '00000000-0000-0000-0000-000000000001'),
('HARD', 'CODE_WRITE', 'Q3. FizzBuzz Variant: Write a function fizzbuzz(n) that returns a list of strings from 1 to n. Multiples of 3 -> ''Fizz'', multiples of 5 -> ''Buzz'', multiples of both -> ''FizzBuzz''. Input: 5 -> Output: [''1'', ''2'', ''Fizz'', ''4'', ''Buzz'']', 'def fizzbuzz(n):\n    res = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            res.append(''FizzBuzz'')\n        elif i % 3 == 0:\n            res.append(''Fizz'')\n        elif i % 5 == 0:\n            res.append(''Buzz'')\n        else:\n            res.append(str(i))\n    return res\n\nprint(fizzbuzz(5))', NULL, NULL, NULL, NULL, NULL, NULL, 25, '00000000-0000-0000-0000-000000000001'),
('HARD', 'CODE_WRITE', 'Q4. Duplicate Finder: Write a function find_duplicates(lst) that returns a list of elements that appear more than once in the input list, preserving first-seen order. Input: [1, 2, 2, 3, 4, 4, 4] -> Output: [2, 4]', 'def find_duplicates(lst):\n    seen = set()\n    dups = []\n    for x in lst:\n        if lst.count(x) > 1 and x not in dups:\n            dups.append(x)\n    return dups\n\nprint(find_duplicates([1, 2, 2, 3, 4, 4, 4]))', NULL, NULL, NULL, NULL, NULL, NULL, 25, '00000000-0000-0000-0000-000000000001'),
('HARD', 'CODE_WRITE', 'Q5. Palindrome Check: Write a function is_palindrome(s) that checks whether a string is a palindrome, ignoring case and spaces. Input: "Nurses run" -> Output: True', 'def is_palindrome(s):\n    clean = ''''.join(c.lower() for c in s if c.isalnum())\n    return clean == clean[::-1]\n\nprint(is_palindrome(''Nurses run''))', NULL, NULL, NULL, NULL, NULL, NULL, 25, '00000000-0000-0000-0000-000000000001');
