const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// فراخوانی مدل‌ها
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const OrderLog = require('../models/OrderLog');
const Discount = require('../models/Discount');
const SystemSetting = require('../models/SystemSetting');
const DailyCounter = require('../models/DailyCounter');

const MONGO_URI = process.env.MONGO_URI;

async function seedFullDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.\n');


        // پاک کردن دیتابیس شامل تنظیمات سیستم و شمارنده روزانه
        await Promise.all([
            Role.deleteMany({}),
            User.deleteMany({}),
            Category.deleteMany({}),
            MenuItem.deleteMany({}),
            Order.deleteMany({}),
            OrderLog.deleteMany({}),
            Discount.deleteMany({}),
            SystemSetting.deleteMany({}),
            DailyCounter.deleteMany({})
        ]);
        console.log('Database cleared.\n');


        // ==========================================
        // ایجاد تنظیمات سیستم
        // ==========================================
        console.log('Creating System Settings...');
        const newSetting = await SystemSetting.create({
            opening_time: "08:00",
            closing_time: "22:00",
            is_accepting_orders: true
        });
        console.log('✅ System settings successfully created.\n');


        console.log('Creating Roles...');
        const roles = await Role.insertMany([
            { name: 'Admin', permissions: ['all'] },
            { name: 'Kitchen Staff', permissions: ['view_orders', 'update_status'] },
            { name: 'Cashier', permissions: ['view_ready_orders', 'deliver'] },
            { name: 'Customer', permissions: ['create_order', 'view_own', 'cancel_own'] }
        ]);
        const roleMap = {};
        roles.forEach(r => { roleMap[r.name] = r._id; });
        console.log('Roles created.\n');


        console.log('Creating Users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = await User.insertMany([
            // ادمین
            { fullname: 'مدیر سیستم', phone_number: '09121111111', password: hashedPassword, role_id: roleMap.Admin },
            // آشپزخانه
            { fullname: 'احمد رضایی', phone_number: '09122222222', password: hashedPassword, role_id: roleMap['Kitchen Staff'] },
            { fullname: 'محمد کریمی', phone_number: '09123333333', password: hashedPassword, role_id: roleMap['Kitchen Staff'] },
            { fullname: 'سعید محمدی', phone_number: '09124444444', password: hashedPassword, role_id: roleMap['Kitchen Staff'] },
            // صندوق‌دار / تحویل
            { fullname: 'نرگس حسینی', phone_number: '09125555555', password: hashedPassword, role_id: roleMap.Cashier },
            { fullname: 'پریسا احمدی', phone_number: '09126666666', password: hashedPassword, role_id: roleMap.Cashier },
            // مشتریان
            { fullname: 'امیر حسین زاده', phone_number: '09127777777', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'زهرا موسوی', phone_number: '09128888888', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'رضا نصیری', phone_number: '09129999999', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'سارا جعفری', phone_number: '09121010101', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'مهدی قاسمی', phone_number: '09121121212', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'فاطمه رحیمی', phone_number: '09121232323', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'حسن عباسی', phone_number: '09121343434', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'مریم کاظمی', phone_number: '09121454545', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'علی شریفی', phone_number: '09121565656', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'نازنین نوری', phone_number: '09121676767', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'پویا جمالی', phone_number: '09121787878', password: hashedPassword, role_id: roleMap.Customer },
            { fullname: 'گلناز حیدری', phone_number: '09121898989', password: hashedPassword, role_id: roleMap.Customer }
        ]);
        const userMap = {};
        users.forEach(u => { userMap[u.fullname] = u._id; });
        console.log(`✅ ${users.length} users created.\n`);

        console.log('📂 Creating Categories...');
        const categories = await Category.insertMany([
            { name: 'غذاهای ایرانی', is_active: true },
            { name: 'پیتزا و فست‌فود', is_active: true },
            { name: 'برگر و ساندویچ', is_active: true },
            { name: 'پیش‌غذا و مخلفات', is_active: true },
            { name: 'سالادها', is_active: true },
            { name: 'نوشیدنی‌ها', is_active: true },
            { name: 'دسرها', is_active: true }
        ]);
        const catMap = {};
        categories.forEach(c => { catMap[c.name] = c._id; });
        console.log('✅ Categories created.\n');

        console.log('Creating Menu Items...');
        const menuItems = await MenuItem.insertMany([
            // غذاهای ایرانی
            { category_id: catMap['غذاهای ایرانی'], name: 'کباب کوبیده', description: '۲ سیخ کباب کوبیده با برنج زعفرانی و گوجه', price: 320000, stock_quantity: 50, status: true, estimated_prep_time: 25 },
            { category_id: catMap['غذاهای ایرانی'], name: 'کباب برگ', description: '۲ سیخ کباب برگ با برنج و کباب', price: 450000, stock_quantity: 30, status: true, estimated_prep_time: 30 },
            { category_id: catMap['غذاهای ایرانی'], name: 'جوجه کباب', description: 'یک ربع جوجه کباب با زعفران و برنج', price: 280000, stock_quantity: 40, status: true, estimated_prep_time: 20 },
            { category_id: catMap['غذاهای ایرانی'], name: 'قرمه سبزی', description: 'خورش قرمه سبزی با گوشت و لوبیا چیتی', price: 220000, stock_quantity: 35, status: true, estimated_prep_time: 20 },
            { category_id: catMap['غذاهای ایرانی'], name: 'فسنجان', description: 'خورش فسنجان با مرغ و گردو', price: 250000, stock_quantity: 25, status: true, estimated_prep_time: 25 },
            { category_id: catMap['غذاهای ایرانی'], name: 'ته چین مرغ', description: 'ته چین با برنج و مرغ و زعفران', price: 270000, stock_quantity: 20, status: true, estimated_prep_time: 35 },

            // پیتزا و فست‌فود
            { category_id: catMap['پیتزا و فست‌فود'], name: 'پیتزا مخصوص', description: 'پیتزا با سس مخصوص و پنیر موزارلا', price: 290000, stock_quantity: 50, status: true, estimated_prep_time: 20 },
            { category_id: catMap['پیتزا و فست‌فود'], name: 'پیتزا پپرونی', description: 'پیتزا با سس گوجه و پپرونی', price: 260000, stock_quantity: 45, status: true, estimated_prep_time: 20 },
            { category_id: catMap['پیتزا و فست‌فود'], name: 'پیتزا مخلوط', description: 'پیتزا با گوشت و قارچ و فلفل دلمه‌ای', price: 310000, stock_quantity: 40, status: true, estimated_prep_time: 22 },
            { category_id: catMap['پیتزا و فست‌فود'], name: 'پیتزا مرغ', description: 'پیتزا با تکه‌های مرغ و سس سفید', price: 270000, stock_quantity: 30, status: true, estimated_prep_time: 20 },
            { category_id: catMap['پیتزا و فست‌فود'], name: 'پیتزا سبزیجات', description: 'پیتزا با فلفل دلمه‌ای و گوجه و قارچ', price: 230000, stock_quantity: 35, status: true, estimated_prep_time: 18 },

            // برگر و ساندویچ
            { category_id: catMap['برگر و ساندویچ'], name: 'برگر مخصوص', description: 'برگر ۱۸۰ گرمی با پنیر و سس مخصوص', price: 240000, stock_quantity: 60, status: true, estimated_prep_time: 15 },
            { category_id: catMap['برگر و ساندویچ'], name: 'برگر مرغ', description: 'برگر مرغ با کاهو و سس سفید', price: 190000, stock_quantity: 50, status: true, estimated_prep_time: 15 },
            { category_id: catMap['برگر و ساندویچ'], name: 'ساندویچ کوبیده', description: 'ساندویچ کباب کوبیده با سبزیجات', price: 170000, stock_quantity: 40, status: true, estimated_prep_time: 12 },
            { category_id: catMap['برگر و ساندویچ'], name: 'ساندویچ ژامبون', description: 'ساندویچ ژامبون و پنیر گودا', price: 150000, stock_quantity: 45, status: true, estimated_prep_time: 10 },

            // پیش‌غذا و مخلفات
            { category_id: catMap['پیش‌غذا و مخلفات'], name: 'سیب‌زمینی سرخ‌کرده', description: 'سیب‌زمینی سرخ‌کرده با سس', price: 90000, stock_quantity: 100, status: true, estimated_prep_time: 10 },
            { category_id: catMap['پیش‌غذا و مخلفات'], name: 'نان سیر', description: 'نان تست با سیر و کره', price: 80000, stock_quantity: 80, status: true, estimated_prep_time: 8 },
            { category_id: catMap['پیش‌غذا و مخلفات'], name: 'چیز استیک', description: 'چیز استیک با پنیر و سس مخصوص', price: 140000, stock_quantity: 40, status: true, estimated_prep_time: 12 },
            { category_id: catMap['پیش‌غذا و مخلفات'], name: 'سالاد سزار', description: 'سالاد سزار با مرغ و نان', price: 180000, stock_quantity: 30, status: true, estimated_prep_time: 10 },

            // نوشیدنی‌ها
            { category_id: catMap['نوشیدنی‌ها'], name: 'نوشابه', description: 'نوشابه ۳۰۰ میلی‌لیتری', price: 25000, stock_quantity: 200, status: true, estimated_prep_time: 1 },
            { category_id: catMap['نوشیدنی‌ها'], name: 'دوغ', description: 'دوغ محلی گازدار', price: 30000, stock_quantity: 150, status: true, estimated_prep_time: 1 },
            { category_id: catMap['نوشیدنی‌ها'], name: 'آب معدنی', description: 'آب معدنی ۵۰۰ میلی‌لیتری', price: 15000, stock_quantity: 250, status: true, estimated_prep_time: 1 },
            { category_id: catMap['نوشیدنی‌ها'], name: 'چای', description: 'چای سیاه فرنگی', price: 20000, stock_quantity: 100, status: true, estimated_prep_time: 5 },
            { category_id: catMap['نوشیدنی‌ها'], name: 'قهوه', description: 'قهوه ترک یا اسپرسو', price: 45000, stock_quantity: 60, status: true, estimated_prep_time: 8 },

            // دسرها
            { category_id: catMap['دسرها'], name: 'کیک شکلاتی', description: 'برش کیک شکلاتی با پودر قند', price: 110000, stock_quantity: 30, status: true, estimated_prep_time: 5 },
            { category_id: catMap['دسرها'], name: 'بستنی', description: 'بستنی وانیلی/شکلاتی', price: 50000, stock_quantity: 60, status: true, estimated_prep_time: 1 },
            { category_id: catMap['دسرها'], name: 'شیرینی زعفرانی', description: 'شیرینی زعفرانی با خلال پسته', price: 75000, stock_quantity: 25, status: true, estimated_prep_time: 3 }
        ]);
        const menuMap = {};
        menuItems.forEach(m => { menuMap[m.name] = { id: m._id, price: m.price }; });
        console.log(`✅ ${menuItems.length} menu items created.\n`);


        console.log('🎫 Creating Discount Codes...');
        const discounts = await Discount.insertMany([
            { code: 'FIRST10', discount_percent: 10, expiration_date: new Date('2027-01-01'), is_active: true },
            { code: 'FOOD20', discount_percent: 20, expiration_date: new Date('2027-06-01'), is_active: true },
            { code: 'WELCOME', discount_percent: 15, expiration_date: new Date('2026-12-31'), is_active: true },
            { code: 'HOLIDAY', discount_percent: 25, expiration_date: new Date('2026-10-01'), is_active: false },
            { code: "TESTCODE", discount_percent: 20, expiration_date: new Date("2026-08-03"), is_active: true}
        ]);
        const discountMap = {};
        discounts.forEach(d => { discountMap[d.code] = d._id; });
        console.log('Discount codes created.\n');


        console.log('Creating Orders...');
        const getOrderItems = (itemNames) => {
            return itemNames.map(name => {
                const item = menuMap[name];
                return {
                    menu_item_id: item.id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    unit_price: item.price
                };
            });
        };

        const calcTotal = (items) => items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
        const applyDiscount = (total, code) => {
            if (!code) return total;
            const discount = discounts.find(d => d.code === code);
            if (!discount || !discount.is_active) return total;
            const percent = discount.discount_percent / 100;
            return Math.round(total * (1 - percent));
        };

        const getRandomItem = (list) => list[Math.floor(Math.random() * list.length)];
        const getAllCustomers = () => {
            const customers = users.filter(u => u.role_id.toString() === roleMap.Customer.toString());
            return customers.map(u => ({ name: u.fullname, id: u._id }));
        };
        const customersList = getAllCustomers();

        const kitchenStaff = users.filter(u => u.role_id.toString() === roleMap['Kitchen Staff'].toString());
        const deliveryStaff = users.filter(u => u.role_id.toString() === roleMap.Cashier.toString());

        const baseDate = new Date('2026-07-20T10:00:00');
        const oneDay = 24 * 60 * 60 * 1000;

        const orderData = [];

        const generateOrder = (customer, dateOffset, items, status, discountCode = null) => {
            const createdAt = new Date(baseDate.getTime() + dateOffset * oneDay + Math.random() * 8 * 60 * 60 * 1000);
            const totalPrice = calcTotal(items);
            const finalPrice = applyDiscount(totalPrice, discountCode);
            const discountId = discountCode ? discountMap[discountCode] : null;
            return {
                customer_id: customer.id,
                items: items,
                total_price: totalPrice,
                final_price: finalPrice,
                discount_code_id: discountId,
                status: status,
                createdAt: createdAt,
                updatedAt: createdAt
            };
        };

        const allItemNames = Object.keys(menuMap);
        const getRandomItems = (count = 2) => {
            const shuffled = allItemNames.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        for (let i = 0; i < 60; i++) {
            const customer = getRandomItem(customersList);
            const dateOffset = Math.floor(Math.random() * 15) + 1;
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const itemNames = getRandomItems(itemCount);
            const items = getOrderItems(itemNames);
            const statuses = ['registered', 'preparing', 'ready_for_delivery', 'delivered', 'canceled'];

            let status;
            const rnd = Math.random();
            if (rnd < 0.4) status = 'delivered';
            else if (rnd < 0.6) status = 'ready_for_delivery';
            else if (rnd < 0.75) status = 'preparing';
            else if (rnd < 0.9) status = 'registered';
            else status = 'canceled';

            const discountCode = Math.random() > 0.8 ? getRandomItem(['FIRST10', 'FOOD20', 'WELCOME']) : null;
            const order = generateOrder(customer, dateOffset, items, status, discountCode);
            orderData.push(order);
        }

        const insertedOrders = await Order.insertMany(orderData);
        console.log(`✅ ${insertedOrders.length} orders created.\n`);


        // ==========================================
        // تخصیص شماره سفارش روزانه برای سفارش‌های سید شده
        // ==========================================
        console.log('--- Generating Daily Order Numbers ---');
        // سفارش‌ها را بر اساس زمان ساخت مرتب می‌کنیم تا ترتیب شماره‌ها منطقی باشد
        const sortedOrders = await Order.find().sort({ createdAt: 1 });
        
        for (const order of sortedOrders) {
            const dateObj = new Date(order.createdAt);
            const dateStr = dateObj.toISOString().split('T')[0];

            const counter = await DailyCounter.findOneAndUpdate(
                { date: dateStr },
                { $inc: { seq: 1 } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            order.daily_order_number = counter.seq;
            await order.save();
        }
        console.log('✅ Daily order numbers successfully updated for all orders.\n');


        console.log('📝 Creating Order Logs...');
        const logs = [];
        const allOrders = await Order.find().populate('customer_id');

        const getStatusOrder = (status) => {
            const orderMap = { registered: 1, preparing: 2, ready_for_delivery: 3, delivered: 4, canceled: 5 };
            return orderMap[status] || 0;
        };

        for (const order of allOrders) {
            const customerId = order.customer_id._id;
            const orderStatus = order.status;
            const statusHistory = ['registered', 'preparing', 'ready_for_delivery', 'delivered', 'canceled'];

            let path = [];
            if (orderStatus === 'canceled') {
                path = ['registered', 'canceled'];
            } else {
                const idx = statusHistory.indexOf(orderStatus);
                if (idx > 0) {
                    for (let i = 0; i <= idx; i++) {
                        path.push(statusHistory[i]);
                    }
                } else {
                    path.push('registered');
                }
            }

            let oldStatus = null;
            for (let i = 0; i < path.length; i++) {
                const newStatus = path[i];
                let changedBy;
                if (newStatus === 'registered') {
                    changedBy = customerId;
                } else if (['preparing', 'ready_for_delivery'].includes(newStatus)) {
                    changedBy = getRandomItem(kitchenStaff)._id;
                } else if (newStatus === 'delivered') {
                    changedBy = getRandomItem(deliveryStaff)._id;
                } else if (newStatus === 'canceled') {
                    changedBy = customerId;
                }

                let actionType;
                if (newStatus === 'registered') actionType = 'ORDER_CREATED';
                else if (newStatus === 'canceled' && oldStatus === 'registered') actionType = 'ORDER_CANCELED';
                else if (newStatus === 'delivered') actionType = 'ORDER_DELIVERED';
                else actionType = 'STATUS_UPDATED';

                const logTime = new Date(order.createdAt.getTime() + i * 5 * 60 * 1000);

                logs.push({
                    order_id: order._id,
                    old_status: oldStatus,
                    new_status: newStatus,
                    changed_by: changedBy,
                    action_type: actionType,
                    createdAt: logTime
                });
                oldStatus = newStatus;
            }
        }

        await OrderLog.insertMany(logs);
        console.log(`✅ ${logs.length} order logs created.\n`);

        console.log('Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedFullDatabase();