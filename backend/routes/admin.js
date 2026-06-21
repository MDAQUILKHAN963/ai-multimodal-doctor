const express = require('express');
const User = require('../models/User');
const Scan = require('../models/Scan');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/scans — all scans with user info
router.get('/scans', requireAdmin, async (req, res, next) => {
  try {
    const scans = await Scan.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(scans);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/users/:id — delete user + all their scans
router.delete('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await Promise.all([
      User.deleteOne({ _id: req.params.id }),
      Scan.deleteMany({ userId: req.params.id }),
    ]);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
