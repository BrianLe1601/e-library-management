'use strict';
require('dotenv').config();
require('./config/db');
const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes   = require('./routes/authRoutes');    // TV1
const bookRoutes   = require('./routes/bookRoutes');    // TV2
const borrowRoutes = require('./routes/borrowRoutes');  // TV3
const adminRoutes  = require('./routes/adminRoutes');   // TV4

// ── Middleware imports ────────────────────────────────────────────────────────
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
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
app.use('/api', authRoutes);          // /api/auth/*  &  /api/users/*
app.use('/api/books', bookRoutes);    // /api/books/*
app.use('/api/borrow', borrowRoutes); // /api/borrow/*
app.use('/api/admin', adminRoutes);   // /api/admin/*

// ── Error handlers (phải đặt CUỐI) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`E-Library API  →  http://localhost:${PORT}`);
  console.log(`ENV: ${process.env.NODE_ENV || 'development'}`);
});


module.exports = app;
