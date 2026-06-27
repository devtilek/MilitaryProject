const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase and a number'
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  password: passwordRule,
  monthlyIncomeGoal: Joi.number().min(0).default(0),
  currency: Joi.string().valid('KZT', 'USD', 'EUR').default('KZT'),
  preferredTheme: Joi.string().valid('light', 'dark').default('light')
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
