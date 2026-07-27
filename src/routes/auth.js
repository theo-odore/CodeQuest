import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'codequest_super_secret_jwt_key_2026';

// POST /auth/register
router.post('/register', writeRateLimiter, async (req, res) => {
  try {
    const { name, email, college_id, password, role } = req.body;

    if (!name || !email || !college_id || !password) {
      return res.status(400).json({ error: 'Name, email, college_id, and password are required' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'PARTICIPANT';
    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error: createErr } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        college_id,
        role: assignedRole,
        password_hash,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college_id: user.college_id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /auth/login
router.post('/login', writeRateLimiter, async (req, res) => {
  try {
    const { enrollment_number, college_id, email, terminal_number, password, role } = req.body;
    const identifier = enrollment_number || college_id || email;

    if (!identifier) {
      return res.status(400).json({ error: 'Enrollment Number or Email is required' });
    }

    // Admin login path
    if (role === 'admin' || (email && password && !terminal_number)) {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},college_id.eq.${identifier}`)
        .maybeSingle();

      if (!user) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      if (user.role === 'ADMIN' && password) {
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid admin password' });
        }
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id, terminal_number: user.terminal_number },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          college_id: user.college_id,
          terminal_number: user.terminal_number,
          role: user.role,
        },
      });
    }

    // Student / Participant login path (with terminal_number)
    const termNum = terminal_number || req.body.terminal || 'T-01';
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .or(`college_id.eq.${identifier},email.eq.${identifier}`)
      .maybeSingle();

    if (user) {
      const { data: updatedUser, error: updateErr } = await supabase
        .from('users')
        .update({ terminal_number: termNum })
        .eq('id', user.id)
        .select()
        .single();
      
      if (!updateErr && updatedUser) user = updatedUser;
    } else {
      const defaultHash = await bcrypt.hash('user123', 10);
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          name: `Student (${identifier})`,
          email: `${identifier.toLowerCase()}@codequest.local`,
          college_id: identifier,
          terminal_number: termNum,
          role: 'PARTICIPANT',
          password_hash: defaultHash,
        })
        .select()
        .single();

      if (createErr) throw createErr;
      user = newUser;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id, terminal_number: user.terminal_number },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Student login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college_id: user.college_id,
        enrollment_number: user.college_id,
        terminal_number: user.terminal_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

export default router;
