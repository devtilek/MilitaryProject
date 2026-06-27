const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

const ensureCategory = async (categoryId, ownerId, type) => {
  return Category.findOne({ _id: categoryId, owner: ownerId, type });
};

const createTransaction = async (req, res, next) => {
  try {
    const category = await ensureCategory(req.body.category, req.user._id, req.body.type);
    if (!category) {
      return res.status(404).json({ message: 'Category not found for this transaction type' });
    }

    const transaction = await Transaction.create({ ...req.body, owner: req.user._id });
    res.status(201).json(await transaction.populate('category', 'name color type'));
  } catch (error) {
    next(error);
  }
};

const buildQuery = (req) => {
  const query = { owner: req.user._id };

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { note: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  if (req.query.type) query.type = req.query.type;
  if (req.query.category) query.category = req.query.category;
  if (req.query.paymentMethod) query.paymentMethod = req.query.paymentMethod;
  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) query.date.$gte = new Date(req.query.from);
    if (req.query.to) query.date.$lte = new Date(req.query.to);
  }

  return query;
};

const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const query = buildQuery(req);

    const [transactions, total, totals] = await Promise.all([
      Transaction.find(query).populate('category', 'name color type').sort({ date: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const income = totals.find((item) => item._id === 'income')?.total || 0;
    const expenses = totals.find((item) => item._id === 'expense')?.total || 0;

    res.status(200).json({
      data: transactions,
      summary: { income, expenses, balance: income - expenses },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const category = await ensureCategory(req.body.category, req.user._id, req.body.type);
    if (!category) {
      return res.status(404).json({ message: 'Category not found for this transaction type' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name color type');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json(transaction);
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTransaction, getTransactions, updateTransaction, deleteTransaction };
