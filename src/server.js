import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import sessionRouter from './routes/session.js';
import questionsRouter from './routes/questions.js';
import attemptsRouter from './routes/attempts.js';
import runCodeRouter from './routes/runCode.js';
import adminRouter from './routes/admin.js';
import { initWebSocket } from './websocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);
app.use('/questions', questionsRouter);
app.use('/attempts', attemptsRouter);
app.use('/run-code', runCodeRouter);
app.use('/admin', adminRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CodeQuest Quiz Competition API',
    timestamp: new Date().toISOString(),
  });
});

// Fallback to index.html for mock UI
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 CodeQuest Backend running on http://localhost:${PORT}`);
  console.log(`📡 Realtime WebSocket server listening for /admin/live monitoring`);
});
