const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // 👈 اصلاح مسیر فایل .env

const mongoose = require('mongoose');
const Discount = require('../models/Discount');

const MONGO_URI = process.env.MONGO_URI;

async function addTestDiscount() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.\n');

        const discountData = {
            code: "test",
            discount_percent: 20,
            expiration_date: new Date("2026-08-03T23:59:59.000Z"), 
            is_active: true
        };

        // استفاده از findOneAndUpdate با upsert تا اگر از قبل بود آپدیت شود و اگر نبود اضافه شود
        const result = await Discount.findOneAndUpdate(
            { code: discountData.code },
            discountData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('✅ Discount code successfully added/updated:');
        console.log(result);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding discount code:', error);
        process.exit(1);
    }
}

addTestDiscount();