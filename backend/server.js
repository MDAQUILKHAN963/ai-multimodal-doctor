require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const socketService = require('./services/socket');
const emailService  = require('./services/email');

const authRoutes    = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');
const reportRoutes  = require('./routes/report');
const userRoutes    = require('./routes/user');
const adminRoutes   = require('./routes/admin');

const app        = express();
const httpServer = http.createServer(app);
const PORT       = process.env.PORT || 5000;

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    version: '0.3.0',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/report',  reportRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/admin',   adminRoutes);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

async function start() {
  // Init socket.io before starting to listen
  socketService.init(httpServer);

  // Init email transporter (creates Ethereal test account in dev if no SMTP configured)
  await emailService.init();

  const uri = process.env.MONGO_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('[mongo] connected');
    } catch (e) {
      console.warn('[mongo] connection failed — running without DB:', e.message);
    }
  } else {
    console.warn('[mongo] MONGO_URI not set — running without DB');
  }

  httpServer.listen(PORT, () => {
    console.log(`[backend] listening on http://localhost:${PORT}`);
  });
}

start();
