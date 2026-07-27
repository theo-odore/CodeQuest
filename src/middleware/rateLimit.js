import rateLimit from 'express-rate-limit';

// Rate limiter for general write endpoints (register, attempts, session actions)
export const writeRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Custom rate-limiting map for /run-code per (userId + questionId)
const runCodeTracker = new Map();
const MAX_RUNS_PER_QUESTION = 10;

export function runCodeRateLimiter(req, res, next) {
  const userId = req.user?.id;
  const questionId = req.body?.question_id;

  if (!userId || !questionId) {
    return res.status(400).json({ error: 'User ID and Question ID required' });
  }

  const key = `${userId}:${questionId}`;
  const currentCount = runCodeTracker.get(key) || 0;

  if (currentCount >= MAX_RUNS_PER_QUESTION) {
    return res.status(429).json({
      error: `Rate limit exceeded. Maximum ${MAX_RUNS_PER_QUESTION} code runs allowed per question.`,
      runs_left: 0,
    });
  }

  runCodeTracker.set(key, currentCount + 1);
  req.runCodeCount = currentCount + 1;
  req.runsLeft = MAX_RUNS_PER_QUESTION - (currentCount + 1);
  next();
}
