'use strict';

const express    = require('express');
const router     = express.Router();
const { body, param } = require('express-validator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate }                = require('../middlewares/validateMiddleware');
const borrowCtrl                  = require('../controllers/borrowController');

router.use(authenticate);

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  validate,
];

// ── User ────────────────────────────────────────────────────────────────────
router.post('/',
  [body('book_id').isInt({ min: 1 }).withMessage('book_id must be a positive integer'), validate],
  borrowCtrl.createBorrow
);

router.get('/my-books',  borrowCtrl.getMyBooks);
router.get('/history', authorize('user'), borrowCtrl.getHistory);

// QUAN TRỌNG: các route cố định phải đặt TRƯỚC /:id
// Thứ tự: /extend/:id, /request-return/:id, /return/:id, /pay-fine/:id, /lost/:id
router.post ('/extend/:id',         validateId, borrowCtrl.extendBorrow);
router.patch('/request-return/:id', validateId, borrowCtrl.requestReturn);

// ── Employee / Admin ────────────────────────────────────────────────────────
router.patch('/return/:id',   authorize('employee','admin'), validateId, borrowCtrl.returnBook);
// router.patch('/pay-fine/:id', authorize('employee','admin'), validateId, borrowCtrl.payFine);
router.patch('/lost/:id',     authorize('employee','admin'), validateId, borrowCtrl.markLost);

// ── Generic ─────────────────────────────────────────────────────────────────
router.get('/:id',            validateId, borrowCtrl.getBorrowById);

module.exports = router;