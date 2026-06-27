const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');

const getProfile = async (req, res, next) => {
  try {
    const [summary] = await Transaction.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totals = await Transaction.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const [categoryCount, budgetCount] = await Promise.all([
      Category.countDocuments({ owner: req.user._id }),
      Budget.countDocuments({ owner: req.user._id })
    ]);

    const stats = totals[0] || { income: 0, expenses: 0, transactionCount: 0 };

    res.status(200).json({
      user: req.user,
      stats: {
        income: stats.income,
        expenses: stats.expenses,
        balance: stats.income - stats.expenses,
        transactionCount: stats.transactionCount,
        categoryCount,
        budgetCount,
        primaryType: summary?._id || 'none'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile };
