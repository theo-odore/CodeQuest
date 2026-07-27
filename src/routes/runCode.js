import express from 'express';
import axios from 'axios';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { prisma } from '../db.js';
import { authenticateToken, requireParticipant } from '../middleware/auth.js';
import { runCodeRateLimiter } from '../middleware/rateLimit.js';
import { getOrUpdateSessionState } from '../services/timerService.js';

const router = express.Router();
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

/**
 * Wraps submitted code so that if participant defines a function (e.g. def reverse_words(s):)
 * but didn't write an explicit print call, it automatically calls the function with stdin.
 */
function prepareExecutableCode(code, question, stdinVal = '') {
  let script = code + '\n\n';
  if (question && question.function_name) {
    const fnName = question.function_name;
    const matches = (code.match(new RegExp(`${fnName}\\s*\\(`, 'g')) || []).length;

    // If only defined once (i.e., 'def fnName(') or not called explicitly, append runner call
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

/**
 * Fallback executor: Runs Python code locally using child_process with timeout & stdin support
 */
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

    if (!question_id || !code) {
      return res.status(400).json({ error: 'question_id and code are required' });
    }

    const question = await prisma.question.findUnique({ where: { id: question_id } });

    // Prepare executable code with function wrapper if needed
    const codeToRun = prepareExecutableCode(code, question, stdin);

    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let executionSource = 'Piston API';

    // Attempt 1: Piston API
    try {
      const pistonResponse = await axios.post(`${PISTON_API_URL}/execute`, {
        language: language.toLowerCase(),
        version: '*',
        files: [{ content: codeToRun }],
        stdin: stdin,
      }, { timeout: 4000 });

      const runData = pistonResponse.data?.run || {};
      if (runData.stderr && runData.stderr.includes('whitelist only')) {
        throw new Error('Piston whitelist restricted');
      }

      stdout = runData.stdout || '';
      stderr = runData.stderr || '';
      exitCode = runData.code !== undefined ? runData.code : 0;
    } catch (pistonError) {
      // Fallback 2: Execute locally using system Python
      console.log('⚡ Piston API unavailable or restricted. Falling back to local Python engine...');
      executionSource = 'Local Engine';

      const localResult = await executeLocalPython(codeToRun, stdin);
      stdout = localResult.stdout;
      stderr = localResult.stderr;
      exitCode = localResult.exitCode;
    }

    // Record execution in RunLog
    let runLogId = null;
    if (question) {
      const runLog = await prisma.runLog.create({
        data: {
          user_id: req.user.id,
          question_id,
          submitted_code: code,
          stdin,
          stdout,
          stderr,
        },
      });
      runLogId = runLog.id;
    }

    res.json({
      message: `Code executed successfully via ${executionSource}`,
      execution_source: executionSource,
      run_log_id: runLogId,
      runs_left: req.runsLeft,
      result: {
        stdout,
        stderr,
        exit_code: exitCode,
      },
    });
  } catch (error) {
    console.error('Run code route error:', error);
    res.status(500).json({ error: 'Failed to process code execution request' });
  }
});

export default router;
