const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount_percent: { type: Number, required: true, min: 1, max: 100 },
    expiration_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Discount', DiscountSchema);