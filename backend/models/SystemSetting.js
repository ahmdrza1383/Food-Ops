const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    opening_time: { type: String, default: "08:00" },
    closing_time: { type: String, default: "23:00" },
    is_accepting_orders: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);