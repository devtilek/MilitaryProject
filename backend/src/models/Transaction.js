const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    date: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank-transfer', 'mobile'],
      default: 'card'
    },
    note: { type: String, trim: true, maxlength: 600 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
  },
  { timestamps: true }
);

transactionSchema.index({ title: 'text', note: 'text' });
transactionSchema.index({ owner: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
