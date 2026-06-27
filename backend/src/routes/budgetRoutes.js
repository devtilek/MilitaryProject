const express = require('express');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { budgetSchema } = require('../validation/financeValidation');
const { createBudget, getBudgets } = require('../controllers/budgetController');

const router = express.Router();

router.route('/').post(protect, validate(budgetSchema), createBudget).get(protect, getBudgets);

module.exports = router;
