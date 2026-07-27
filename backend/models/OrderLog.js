const mongoose = require('mongoose');

const OrderLogSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    old_status: { type: String },
    new_status: { type: String, required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action_type: { type: String, required: true }
}, { timestamps: true, updatedAt: false });

module.exports = mongoose.model('OrderLog', OrderLogSchema);