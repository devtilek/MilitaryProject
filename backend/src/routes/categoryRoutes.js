const express = require('express');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { categorySchema } = require('../validation/financeValidation');
const { createCategory, getCategories } = require('../controllers/categoryController');

const router = express.Router();

router.route('/').post(protect, validate(categorySchema), createCategory).get(protect, getCategories);

module.exports = router;
