const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  monthlyIncomeGoal: user.monthlyIncomeGoal,
  currency: user.currency,
  preferredTheme: user.preferredTheme,
  createdAt: user.createdAt
});

const seedDefaultCategories = async (userId) => {
  const defaults = [
    { name: 'Salary', type: 'income', color: '#0f766e', description: 'Monthly salary and regular income' },
    { name: 'Food', type: 'expense', color: '#dc2626', description: 'Groceries, lunch and restaurants' },
    { name: 'Transport', type: 'expense', color: '#2563eb', description: 'Taxi, bus and fuel spending' },
    { name: 'Education', type: 'expense', color: '#7c3aed', description: 'Courses, books and learning tools' }
  ];

  await Category.insertMany(defaults.map((category) => ({ ...category, owner: userId })));
};

const register = async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create(req.body);
    await seedDefaultCategories(user._id);

    res.status(201).json({
      token: signToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      token: signToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
