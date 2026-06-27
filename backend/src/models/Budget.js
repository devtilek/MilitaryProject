const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    limit: { type: Number, required: true, min: 0 },
    alertPercent: { type: Number, min: 50, max: 100, default: 80 },
    notes: { type: String, trim: true, maxlength: 250 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
  },
  { timestamps: true }
);

budgetSchema.index({ owner: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
