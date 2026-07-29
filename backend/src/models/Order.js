const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit_price: { type: Number, required: true }
    }],
    total_price: { type: Number, required: true },
    discount_code_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    final_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['registered', 'preparing', 'ready_for_delivery', 'delivered', 'canceled'],
        default: 'registered' // باگ املایی (حرف بزرگ) اصلاح شد
    },
    estimated_ready_time: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);