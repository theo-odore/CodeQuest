import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Demo test cases definitions for Phase 3 questions
const DEFAULT_TEST_CASES = {
  "reverse_words": [
    { stdin: "CodeQuest is fun", expected_output: "fun is CodeQuest", is_hidden: false },
    { stdin: "Hello World", expected_output: "World Hello", is_hidden: false },
    { stdin: "Python is an amazing programming language", expected_output: "language programming amazing an is Python", is_hidden: true },
    { stdin: "SingleWord", expected_output: "SingleWord", is_hidden: true }
  ],
  "is_prime": [
    { stdin: "17", expected_output: "True", is_hidden: false },
    { stdin: "4", expected_output: "False", is_hidden: false },
    { stdin: "1", expected_output: "False", is_hidden: true },
    { stdin: "2", expected_output: "True", is_hidden: true },
    { stdin: "29", expected_output: "True", is_hidden: true }
  ],
  "fibonacci": [
    { stdin: "7", expected_output: "0 1 1 2 3 5 8", is_hidden: false },
    { stdin: "1", expected_output: "0", is_hidden: false },
    { stdin: "5", expected_output: "0 1 1 2 3", is_hidden: true }
  ],
  "is_armstrong": [
    { stdin: "153", expected_output: "Armstrong Number", is_hidden: false },
    { stdin: "123", expected_output: "Not Armstrong Number", is_hidden: false },
    { stdin: "370", expected_output: "Armstrong Number", is_hidden: true }
  ],
  "is_palindrome": [
    { stdin: "Madam", expected_output: "Palindrome", is_hidden: false },
    { stdin: "Racecar", expected_output: "Palindrome", is_hidden: false },
    { stdin: "CodeQuest", expected_output: "Not Palindrome", is_hidden: true }
  ],
  "count_vowels_consonants": [
    { stdin: "Hello World", expected_output: "Vowels : 3 Consonants : 7", is_hidden: false },
    { stdin: "AEIOU", expected_output: "Vowels : 5 Consonants : 0", is_hidden: true }
  ],
  "remove_duplicates": [
    { stdin: "1 2 2 3 4 4 5", expected_output: "1 2 3 4 5", is_hidden: false },
    { stdin: "10 10 20 30", expected_output: "10 20 30", is_hidden: true }
  ],
  "second_largest": [
    { stdin: "4 7 7 2 1", expected_output: "4", is_hidden: false },
    { stdin: "10 20 30 40", expected_output: "30", is_hidden: true }
  ],
  "transpose_matrix": [
    { stdin: "1 2\n3 4", expected_output: "1 3\n2 4", is_hidden: false }
  ],
  "word_frequency": [
    { stdin: "python code python fun", expected_output: "python : 2\ncode : 1\nfun : 1", is_hidden: false }
  ],
  "is_valid_parentheses": [
    { stdin: "{[()]}", expected_output: "Balanced", is_hidden: false },
    { stdin: "[(])", expected_output: "Not Balanced", is_hidden: true }
  ],
  "caesar_cipher": [
    { stdin: "HELLO\n3", expected_output: "KHOOR", is_hidden: false }
  ],
  "longest_word": [
    { stdin: "Python programming is awesome", expected_output: "programming", is_hidden: false }
  ],
  "is_anagram": [
    { stdin: "listen\nsilent", expected_output: "Anagram", is_hidden: false }
  ],
  "tictactoe_winner": [
    { stdin: "X O X\nO X O\nO X X", expected_output: "X Wins", is_hidden: false }
  ]
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codequest.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@codequest.com',
      college_id: 'ADMIN001',
      role: 'ADMIN',
      password_hash: adminPasswordHash,
    },
  });

  // Create sample participant
  const userPasswordHash = await bcrypt.hash('user123', 10);
  const participant = await prisma.user.upsert({
    where: { email: 'user@codequest.com' },
    update: {
      college_id: '22CS001',
    },
    create: {
      name: 'Test Participant',
      email: 'user@codequest.com',
      college_id: '22CS001',
      role: 'PARTICIPANT',
      password_hash: userPasswordHash,
    },
  });

  // Read questions seed file
  const questionsPath = path.join(__dirname, 'questions_seed.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

  // Clear existing questions to avoid duplicates on re-seed
  await prisma.question.deleteMany({});
  console.log('🧹 Cleaned existing question bank.');

  let seededCount = 0;
  let testCasesCount = 0;

  for (const q of questionsData) {
    // Map function_name for Phase 3 questions if not explicitly in JSON
    let fnName = q.function_name || null;
    let fnSig = q.function_signature || null;

    if (q.phase === 'HARD' && !fnName) {
      if (q.text.includes('Reverse Words')) { fnName = 'reverse_words'; fnSig = 'def reverse_words(sentence):'; }
      else if (q.text.includes('Prime')) { fnName = 'is_prime'; fnSig = 'def is_prime(n):'; }
      else if (q.text.includes('Fibonacci')) { fnName = 'fibonacci'; fnSig = 'def fibonacci(n):'; }
      else if (q.text.includes('Armstrong')) { fnName = 'is_armstrong'; fnSig = 'def is_armstrong(n):'; }
      else if (q.text.includes('Palindrome')) { fnName = 'is_palindrome'; fnSig = 'def is_palindrome(s):'; }
      else if (q.text.includes('Vowels')) { fnName = 'count_vowels_consonants'; fnSig = 'def count_vowels_consonants(s):'; }
      else if (q.text.includes('Duplicate')) { fnName = 'remove_duplicates'; fnSig = 'def remove_duplicates(lst):'; }
      else if (q.text.includes('Second Largest')) { fnName = 'second_largest'; fnSig = 'def second_largest(lst):'; }
      else if (q.text.includes('Matrix Transpose')) { fnName = 'transpose_matrix'; fnSig = 'def transpose_matrix(matrix):'; }
      else if (q.text.includes('Word Frequency')) { fnName = 'word_frequency'; fnSig = 'def word_frequency(sentence):'; }
      else if (q.text.includes('Parentheses')) { fnName = 'is_valid_parentheses'; fnSig = 'def is_valid_parentheses(s):'; }
      else if (q.text.includes('Caesar')) { fnName = 'caesar_cipher'; fnSig = 'def caesar_cipher(text, shift):'; }
      else if (q.text.includes('Longest Word')) { fnName = 'longest_word'; fnSig = 'def longest_word(sentence):'; }
      else if (q.text.includes('Anagram')) { fnName = 'is_anagram'; fnSig = 'def is_anagram(s1, s2):'; }
      else if (q.text.includes('Tic-Tac-Toe')) { fnName = 'tictactoe_winner'; fnSig = 'def tictactoe_winner(board):'; }
    }

    const createdQ = await prisma.question.create({
      data: {
        phase: q.phase,
        type: q.type,
        text: q.text,
        code_snippet: q.code_snippet,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        expected_output: q.expected_output,
        function_name: fnName,
        function_signature: fnSig,
        points: q.points,
        created_by_admin_id: admin.id,
      },
    });
    seededCount++;

    // Seed test cases for Phase 3
    if (fnName && DEFAULT_TEST_CASES[fnName]) {
      const tcList = DEFAULT_TEST_CASES[fnName];
      for (const tc of tcList) {
        await prisma.testCase.create({
          data: {
            question_id: createdQ.id,
            stdin: tc.stdin,
            expected_output: tc.expected_output,
            is_hidden: tc.is_hidden,
            weight: 1
          }
        });
        testCasesCount++;
      }
    }
  }

  console.log(`✅ Successfully seeded ${seededCount} questions and ${testCasesCount} test cases into database!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
