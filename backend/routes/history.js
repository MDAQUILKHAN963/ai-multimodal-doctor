const express = require('express');
const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/history?page=1&limit=10&search=&kind=
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search?.trim() || '';
    const kind   = req.query.kind  || '';
    const skip   = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (kind === 'xray' || kind === 'symptoms') filter.kind = kind;
    if (search) {
      filter.$or = [
        { label: { $regex: search, $options: 'i' } },
        { possibleConditions: { $elemMatch: { $regex: search, $options: 'i' } } },
        { 'input.text': { $regex: search, $options: 'i' } },
      ];
    }

    const [scans, total] = await Promise.all([
      Scan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Scan.countDocuments(filter),
    ]);

    res.json({ scans, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await Scan.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ deleted: result.deletedCount });
  } catch (e) {
    next(e);
  }
});

// Dashboard stats — MongoDB aggregation pipeline
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);

    const [conditionStats, totalXray, totalSymptoms, recent] = await Promise.all([
      Scan.aggregate([
        { $match: { userId: uid, kind: 'xray' } },
        { $group: { _id: '$label', count: { $sum: 1 } } },
        { $project: { _id: 0, label: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Scan.countDocuments({ userId: uid, kind: 'xray' }),
      Scan.countDocuments({ userId: uid, kind: 'symptoms' }),
      Scan.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({ conditionStats, totalXray, totalSymptoms, recent });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
