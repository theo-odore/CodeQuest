import express from 'express';
import crypto from 'crypto';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabase } from '../supabase.js';
import { authenticateToken, requireParticipant } from '../middleware/auth.js';
import { runCodeRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

function prepareExecutableCode(code, question, stdinVal = '') {
  let script = code + '\n\n';
  if (question && question.function_name) {
    const fnName = question.function_name;
    const matches = (code.match(new RegExp(`${fnName}\\s*\\(`, 'g')) || []).length;

    if (matches <= 1) {
      script += `
import sys, ast

_FN_NAME = "${fnName}"
if _FN_NAME in globals():
    _func = globals()[_FN_NAME]
    _stdin_str = """${stdinVal.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""".strip()
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
        print(f"Runner Error calling {_FN_NAME}: {_e}", file=sys.stderr)
`;
    }
  }
  return script;
}

function executeLocalPython(code, stdin = '') {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `codequest_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

    fs.writeFile(tmpFile, code, 'utf8', (err) => {
      if (err) {
        return resolve({ stdout: '', stderr: 'Failed to write code file: ' + err.message, exitCode: 1 });
      }

      const child = execFile('python', [tmpFile], { timeout: 5000, maxBuffer: 1024 * 1024 }, (execErr, stdout, stderr) => {
        fs.unlink(tmpFile, () => {});

        if (execErr && execErr.killed) {
          return resolve({ stdout: stdout || '', stderr: 'Time Limit Exceeded (5 seconds max)', exitCode: 1 });
        }

        resolve({
          stdout: stdout || '',
          stderr: stderr || (execErr && !stdout ? execErr.message : ''),
          exitCode: execErr ? (typeof execErr.code === 'number' ? execErr.code : 1) : 0,
        });
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  });
}

// POST /run-code
router.post('/', authenticateToken, requireParticipant, runCodeRateLimiter, async (req, res) => {
  try {
    const { question_id, code, language = 'python', stdin = '' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    let question = null;
    if (question_id) {
      const { data: qData } = await supabase
        .from('questions')
        .select('*, testCases:test_cases(*)')
        .eq('id', question_id)
        .maybeSingle();
      question = qData;
    }

    const testCases = (question && question.testCases && question.testCases.length > 0)
      ? question.testCases
      : [{ stdin, expected_output: '', is_hidden: false }];

    const results = [];
    let overallStdout = '';
    let overallStderr = '';
    let overallExitCode = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const tcInput = tc.stdin !== undefined ? tc.stdin : stdin;
      const codeToRun = prepareExecutableCode(code, question, tcInput);

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      try {
        const localResult = await executeLocalPython(codeToRun, tcInput);
        stdout = (localResult.stdout || '').trim();
        stderr = (localResult.stderr || '').trim();
        exitCode = localResult.exitCode;
      } catch (err) {
        stderr = err.message;
        exitCode = 1;
      }

      if (i === 0) {
        overallStdout = stdout;
        overallStderr = stderr;
        overallExitCode = exitCode;
      }

      const expectedStr = (tc.expected_output || '').trim();
      const isMatch = (exitCode === 0) && (!stderr) && (expectedStr === '' || stdout === expectedStr);

      results.push({
        index: i + 1,
        passed: isMatch,
        stdin: tc.is_hidden ? '[HIDDEN TEST CASE]' : tcInput,
        expected_output: tc.is_hidden ? '[HIDDEN TEST CASE]' : tc.expected_output,
        actual_output: tc.is_hidden ? (isMatch ? '[PASSED]' : '[FAILED]') : stdout,
        stderr,
        is_hidden: tc.is_hidden,
      });
    }

    if (question) {
      await supabase.from('run_logs').insert({
        id: crypto.randomUUID(),
        user_id: req.user.id,
        question_id: question.id,
        submitted_code: code,
        stdin,
        stdout: overallStdout,
        stderr: overallStderr,
      });
    }

    res.json({
      message: 'Code executed successfully',
      results,
      result: {
        stdout: overallStdout,
        stderr: overallStderr,
        exit_code: overallExitCode,
      },
    });
  } catch (error) {
    console.error('Run code route error:', error);
    res.status(500).json({ error: 'Failed to process code execution request' });
  }
});

export default router;
