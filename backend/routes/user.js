const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.put('/profile',
  requireAuth,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { name: req.body.name.trim() },
        { new: true, select: '-password -resetPasswordToken -resetPasswordExpires' }
      );
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

router.put('/password',
  requireAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const ok = await user.comparePassword(req.body.currentPassword);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

      user.password = req.body.newPassword; // pre-save hook hashes it
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
