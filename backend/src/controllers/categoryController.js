const Category = require('../models/Category');

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ ...req.body, owner: req.user._id });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Category already exists for this type' });
    }
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.type) filter.type = req.query.type;

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

module.exports = { createCategory, getCategories };
