const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const SystemSetting = require('../models/SystemSetting');

const MONGO_URI = process.env.MONGO_URI;

async function addSystemSettings() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.\n');

        await SystemSetting.deleteMany({});


        const newSetting = await SystemSetting.create({
            opening_time: "08:00",
            closing_time: "22:00",
            is_accepting_orders: true
        });
        console.log('✅ System settings successfully created:');
        console.log(newSetting);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding system settings:', error);
        process.exit(1);
    }
}

addSystemSettings();