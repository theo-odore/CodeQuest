import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Normalizes stdout and expected_output for flexible matching
 * (Strips leading/trailing whitespace, converts \r\n to \n, normalizes spaces)
 */
export function normalizeOutput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .toLowerCase();
}

/**
 * Runs python code locally with input & timeout protection
 */
function runPythonScript(scriptContent, stdin = '', timeoutMs = 5000) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `grade_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

    fs.writeFile(tmpFile, scriptContent, 'utf8', (err) => {
      if (err) {
        return resolve({ stdout: '', stderr: 'Failed to write test runner file: ' + err.message, exitCode: 1, timedOut: false });
      }

      const child = execFile('python', [tmpFile], { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (execErr, stdout, stderr) => {
        fs.unlink(tmpFile, () => {});

        if (execErr && execErr.killed) {
          return resolve({ stdout: stdout || '', stderr: 'Time Limit Exceeded (5 seconds max)', exitCode: 124, timedOut: true });
        }

        resolve({
          stdout: stdout || '',
          stderr: stderr || (execErr && !stdout ? execErr.message : ''),
          exitCode: execErr ? (typeof execErr.code === 'number' ? execErr.code : 1) : 0,
          timedOut: false
        });
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  });
}

/**
 * Main Auto-Grader for Phase 3 Code Write Questions
 * 
 * @param {string} submittedCode - The Python code submitted by participant
 * @param {object} question - Question record from database (with function_name, points)
 * @param {Array} testCases - List of TestCase records (stdin, expected_output, is_hidden)
 * @returns {object} Grading details { test_cases_passed, total_test_cases, earned_points, is_correct, details }
 */
export async function gradeCodeWrite(submittedCode, question, testCases = []) {
  if (!testCases || testCases.length === 0) {
    return {
      test_cases_passed: 0,
      total_test_cases: 0,
      earned_points: 0,
      is_correct: false,
      message: 'No test cases available for this question'
    };
  }

  const fnName = question.function_name;
  let test_cases_passed = 0;
  const total_test_cases = testCases.length;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const stdinVal = tc.stdin || '';
    const expectedNorm = normalizeOutput(tc.expected_output);

    // Build python script wrapping submitted code
    let scriptToRun = submittedCode + '\n\n';

    if (fnName) {
      // Append smart invocation runner for function_name
      scriptToRun += `
import sys, ast

_FN_NAME = "${fnName}"
if _FN_NAME in globals():
    _func = globals()[_FN_NAME]
    _stdin_str = """${stdinVal.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""".strip()
    
    # Run function if not already outputting
    try:
        if _stdin_str:
            _lines = [l.strip() for l in _stdin_str.splitlines() if l.strip()]
            _args = []
            for _l in _lines:
                try:
                    _args.append(ast.literal_eval(_l))
                except Exception:
                    _args.append(_l)
            
            if len(_args) == 1:
                _res = _func(_args[0])
            else:
                _res = _func(*_args)
        else:
            _res = _func()
            
        if _res is not None:
            if isinstance(_res, (list, tuple)):
                print(" ".join(map(str, _res)))
            else:
                print(_res)
    except Exception as _e:
        print(f"__RUNNER_ERR__: {_e}", file=sys.stderr)
`;
    }

    const execResult = await runPythonScript(scriptToRun, stdinVal, 5000);
    const actualNorm = normalizeOutput(execResult.stdout);

    let passed = false;
    let failureReason = null;

    if (execResult.timedOut) {
      failureReason = 'Time Limit Exceeded (5s)';
    } else if (execResult.stderr && execResult.stderr.includes('SyntaxError')) {
      failureReason = 'Syntax Error in submitted code';
    } else if (execResult.stderr && execResult.stderr.includes(`Function '${fnName}' is not defined`)) {
      failureReason = `Required function '${fnName}' was not defined`;
    } else if (actualNorm === expectedNorm && actualNorm.length > 0) {
      passed = true;
    } else {
      failureReason = `Output mismatch (Expected: "${tc.expected_output}", Got: "${execResult.stdout.trim()}")`;
    }

    if (passed) {
      test_cases_passed++;
    }

    results.push({
      test_case_id: tc.id,
      stdin: tc.stdin,
      expected_output: tc.is_hidden ? '[HIDDEN]' : tc.expected_output,
      actual_output: execResult.stdout.trim(),
      is_hidden: tc.is_hidden,
      passed,
      failure_reason: passed ? null : failureReason
    });
  }

  // Calculate Partial Credit
  const passRatio = test_cases_passed / total_test_cases;
  const maxPoints = question.points || 25;
  const earned_points = Math.round(maxPoints * passRatio);
  const is_correct = test_cases_passed === total_test_cases;

  return {
    test_cases_passed,
    total_test_cases,
    earned_points,
    is_correct,
    results
  };
}
