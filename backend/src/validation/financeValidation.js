const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  type: Joi.string().valid('income', 'expense').required(),
  color: Joi.string().pattern(/^#([0-9a-fA-F]{6})$/).default('#0f766e'),
  description: Joi.string().trim().max(200).allow('')
});

const transactionSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('income', 'expense').required(),
  date: Joi.date().iso().required(),
  paymentMethod: Joi.string().valid('cash', 'card', 'bank-transfer', 'mobile').default('card'),
  note: Joi.string().trim().max(600).allow(''),
  category: Joi.string().hex().length(24).required()
});

const budgetSchema = Joi.object({
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  limit: Joi.number().min(0).precision(2).required(),
  alertPercent: Joi.number().min(50).max(100).default(80),
  notes: Joi.string().trim().max(250).allow(''),
  category: Joi.string().hex().length(24).required()
});

module.exports = { categorySchema, transactionSchema, budgetSchema };
