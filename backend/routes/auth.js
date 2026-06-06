const express = require('express');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User   = require('../models/User');
const emailService = require('../services/email');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidators, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password }); // pre-save hook hashes password

    // Fire-and-forget welcome email
    emailService.sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', loginValidators, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase()?.trim();
    const user  = await User.findOne({ email });

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link was sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send real email (Ethereal in dev, real SMTP in prod)
    emailService.sendPasswordResetEmail(user, token).catch(() => {});

    res.json({
      message: 'If that email is registered, a reset link was sent.',
      // Expose token in non-production so devs can test without email
      ...(process.env.NODE_ENV !== 'production' && { resetToken: token }),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken:   req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Reset token is invalid or has expired' });

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    user.password             = password; // pre-save hook hashes it
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
