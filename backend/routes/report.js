const express = require('express');
const axios = require('axios');
const Scan = require('../models/Scan');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const ML = process.env.ML_SERVER_URL || 'http://localhost:8000';

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    // Fetch the scan from MongoDB (only the owner can download)
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    // Convert ObjectId fields to strings so FastAPI can serialise the dict
    const payload = {
      ...scan,
      _id: scan._id.toString(),
      userId: scan.userId.toString(),
      createdAt: scan.createdAt?.toISOString(),
      updatedAt: scan.updatedAt?.toISOString(),
    };

    // FastAPI generates the PDF and streams it back
    const response = await axios.post(`${ML}/report`, payload, {
      responseType: 'arraybuffer',
      timeout: 30_000,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ai-doctor-report-${req.params.id}.pdf"`
    );
    res.send(Buffer.from(response.data));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
