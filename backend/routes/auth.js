import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import db from '../config/database.js';

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.create({ name, email, password });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Error in signup:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await User.validatePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Error in signin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    db.run(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry.toISOString(), user.id],
      async (err) => {
        if (err) {
          console.error('Error storing reset token:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Send password reset email
        const emailResult = await sendPasswordResetEmail(email, resetToken);
        
        if (emailResult.success) {
          console.log(`✅ Password reset email sent to ${email}`);
          res.json({ 
            message: 'If an account with that email exists, a password reset link has been sent.',
            // Only show token in development for testing
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
          });
        } else {
          console.error(`❌ Failed to send email to ${email}:`, emailResult.error);
          res.status(500).json({ 
            error: 'Failed to send password reset email. Please try again later.' 
          });
        }
      }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find user with valid reset token
    db.get(
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
      [token, new Date().toISOString()],
      async (err, user) => {
        if (err) {
          console.error('Error finding user with reset token:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        db.run(
          'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              console.error('Error updating password:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Password has been reset successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
