const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const OrderLog = require('../models/OrderLog');
const Discount = require('../models/Discount');
const SystemSetting = require('../models/SystemSetting');

const MONGO_URI = process.env.MONGO_URI;

async function initializeDatabase() {
    try {
        console.log('Connecting to the database...');
        await mongoose.connect(MONGO_URI);
        console.log('Successfully connected to the database.');

        console.log('Creating collections...');

        await Role.createCollection();
        await User.createCollection();
        await Category.createCollection();
        await MenuItem.createCollection();
        await Order.createCollection();
        await OrderLog.createCollection();
        await Discount.createCollection();
        await SystemSetting.createCollection();

        console.log('All 8 collections have been successfully created in the database!');
        console.log('Operation completed. Exiting...');
        process.exit(0);

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();