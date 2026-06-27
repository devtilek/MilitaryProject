const express = require('express');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { transactionSchema } = require('../validation/financeValidation');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

const router = express.Router();

router.route('/').post(protect, validate(transactionSchema), createTransaction).get(protect, getTransactions);
router
  .route('/:id')
  .put(protect, validateObjectId, validate(transactionSchema), updateTransaction)
  .delete(protect, validateObjectId, deleteTransaction);

module.exports = router;
