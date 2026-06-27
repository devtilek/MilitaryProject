const Budget = require('../models/Budget');
const Category = require('../models/Category');

const createBudget = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.body.category,
      owner: req.user._id,
      type: 'expense'
    });

    if (!category) {
      return res.status(404).json({ message: 'Expense category not found' });
    }

    const budget = await Budget.create({ ...req.body, owner: req.user._id });
    res.status(201).json(await budget.populate('category', 'name color type'));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Budget already exists for this month and category' });
    }
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.month) filter.month = req.query.month;

    const budgets = await Budget.find(filter).populate('category', 'name color type').sort({ month: -1 });
    res.status(200).json(budgets);
  } catch (error) {
    next(error);
  }
};

module.exports = { createBudget, getBudgets };
