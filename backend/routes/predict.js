const express = require('express');
const multer  = require('multer');
const axios   = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');

const Scan    = require('../models/Scan');
const { requireAuth }  = require('../middleware/auth');
const { emitToUser }   = require('../services/socket');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ML = process.env.ML_SERVER_URL || 'http://localhost:8000';

router.post('/xray', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required' });

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'xray.png',
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(`${ML}/predict/xray`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    let scanId = null;
    if (mongoose.connection.readyState === 1) {
      const scan = await Scan.create({
        userId: req.user.id,
        kind: 'xray',
        label: data.label,
        confidence: data.confidence,
        classes: data.classes,
        heatmapBase64: data.heatmap_base64,
        geminiExplanation: data.gemini_explanation || null,
      });
      scanId = scan._id.toString();
    }

    // Notify the user's connected tabs/devices in real time
    emitToUser(req.user.id, 'scan:complete', {
      scanId,
      kind: 'xray',
      label: data.label,
      confidence: Math.round((data.confidence || 0) * 100),
      message: `X-ray analysis complete — ${data.label || 'result ready'}`,
      emergency: false,
    });

    res.json({ ...data, scanId });
  } catch (e) {
    next(e);
  }
});

router.post('/symptoms', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const { data } = await axios.post(`${ML}/analyze/symptoms`, { text });

    if (mongoose.connection.readyState === 1) {
      await Scan.create({
        userId: req.user.id,
        kind: 'symptoms',
        input: { text },
        entities: data.entities,
        possibleConditions: data.possible_conditions,
        emergency: {
          isEmergency: data.emergency?.is_emergency,
          triggers: data.emergency?.triggers,
          message: data.emergency?.message,
        },
      });
    }

    const isEmergency = data.emergency?.is_emergency || false;
    const topCondition = data.possible_conditions?.[0] || 'result ready';

    // Real-time notification — emergency scans get a different message
    emitToUser(req.user.id, 'scan:complete', {
      kind: 'symptoms',
      label: topCondition,
      message: isEmergency
        ? `🚨 Emergency symptoms detected — seek immediate care`
        : `Symptom check complete — ${topCondition}`,
      emergency: isEmergency,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
