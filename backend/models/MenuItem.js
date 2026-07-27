const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image_url: { type: String },
    status: { type: Boolean, default: true },
    stock_quantity: { type: Number, required: true, default: 0 },
    estimated_prep_time: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);