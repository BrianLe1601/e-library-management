'use strict';
require('dotenv').config();
require('./config/db');
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');
const startCronJobs = require('./utils/cronJobs');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes   = require('./routes/authRoutes');    
const bookRoutes   = require('./routes/bookRoutes');    
const borrowRoutes = require('./routes/borrowRoutes');  
const adminRoutes  = require('./routes/adminRoutes');   
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes   = require('./routes/userRoutes');

// ── Middleware imports ────────────────────────────────────────────────────────
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ─────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL 
].filter(Boolean); 

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}]  ${req.method}  ${req.originalUrl}`);
    next();
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);         
app.use('/api/books', bookRoutes);    
app.use('/api/borrows', borrowRoutes); 
app.use('/api/admin', adminRoutes);   
app.use('/api/reviews', reviewRoutes); 
app.use('/api/users', userRoutes);

// ── Error handlers (phải đặt CUỐI) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// Khởi động các tác vụ chạy ngầm
startCronJobs();

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`E-Library API  →  http://localhost:${PORT}`);
  console.log(`ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;