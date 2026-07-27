const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// فراخوانی مدل‌ها از پوشه models
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const OrderLog = require('../models/OrderLog');
const Discount = require('../models/Discount');
const SystemSetting = require('../models/SystemSetting');

const MONGO_URI = 'mongodb://admin:password@localhost:27017/foodops?authSource=admin';

async function seedDatabase() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully to foodops database.\n');

        // --- قدم اول: اضافه کردن نقش‌های پیش‌فرض (Roles) ---
        const existingRoles = await Role.countDocuments();
        if (existingRoles === 0) {
            console.log('Seeding Roles...');
            await Role.insertMany([
                { name: 'Admin', permissions: ['all'] },
                { name: 'Kitchen Staff', permissions: ['view_kitchen_queue', 'update_order_status'] },
                { name: 'Cashier', permissions: ['view_ready_orders', 'deliver_orders'] },
                { name: 'Customer', permissions: ['create_order', 'view_own_orders', 'cancel_own_order'] }
            ]);
            console.log('Default system roles added successfully.');
        } else {
            console.log('Roles already exist in database. skipping...');
        }

        // --- قدم دوم: اضافه کردن کاربران پیش‌فرض (Users) ---
        const existingUsers = await User.countDocuments();
        if (existingUsers === 0) {
            console.log('Seeding Users...');

            const adminRole = await Role.findOne({ name: 'Admin' });
            const kitchenRole = await Role.findOne({ name: 'Kitchen Staff' });
            const cashierRole = await Role.findOne({ name: 'Cashier' });
            const customerRole = await Role.findOne({ name: 'Customer' });

            // هش کردن رمز عبور پیش‌فرض با 10 دور Salt
            const hashedPassword = await bcrypt.hash('password123', 10);

            await User.insertMany([
                { fullname: 'Kamran Rostami', phone_number: '09120000001', password: hashedPassword, role_id: adminRole._id },

                { fullname: 'Babak Rahimi', phone_number: '09120000002', password: hashedPassword, role_id: kitchenRole._id },
                { fullname: 'Sina Mehdizadeh', phone_number: '09120000003', password: hashedPassword, role_id: kitchenRole._id },
                { fullname: 'Farhad Kiani', phone_number: '09120000004', password: hashedPassword, role_id: kitchenRole._id },

                { fullname: 'Shirin Golzar', phone_number: '09120000005', password: hashedPassword, role_id: cashierRole._id },
                { fullname: 'Nima Karimi', phone_number: '09120000006', password: hashedPassword, role_id: cashierRole._id },

                { fullname: 'Ali Rezaee', phone_number: '09120000007', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Maryam Ahmadi', phone_number: '09120000008', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Reza Mohammadi', phone_number: '09120000009', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Sara Karimi', phone_number: '09120000010', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Omid Mousavi', phone_number: '09120000011', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Negar Ghasemi', phone_number: '09120000012', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Hossein Hosseini', phone_number: '09120000013', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Zahra Kazemi', phone_number: '09120000014', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Mehdi Nouri', phone_number: '09120000015', password: hashedPassword, role_id: customerRole._id },
                { fullname: 'Fatemeh Jafari', phone_number: '09120000016', password: hashedPassword, role_id: customerRole._id }
            ]);
            console.log('Default users added successfully.');
        } else {
            console.log('Users already exist in database. skipping...');
        }

        // --- قدم سوم: اضافه کردن دسته‌بندی‌ها (Categories) ---
        const existingCategories = await Category.countDocuments();
        if (existingCategories === 0) {
            console.log('Seeding Categories...');
            await Category.insertMany([
                { name: 'Fast Food & Pizza', is_active: true },
                { name: 'Traditional Dishes', is_active: true },
                { name: 'Burgers & Sandwiches', is_active: true },
                { name: 'Appetizers & Sides', is_active: true },
                { name: 'Beverages', is_active: true },
                { name: 'Salads & Desserts', is_active: true }
            ]);
            console.log('Default categories added successfully.');
        } else {
            console.log('Categories already exist in database. skipping...');
        }

        // --- قدم چهارم: اضافه کردن آیتم‌های منو (MenuItems) ---
        const existingMenuItems = await MenuItem.countDocuments();
        if (existingMenuItems === 0) {
            console.log('Seeding Menu Items...');

            const fastFoodCat = await Category.findOne({ name: 'Fast Food & Pizza' });
            const traditionalCat = await Category.findOne({ name: 'Traditional Dishes' });
            const burgerCat = await Category.findOne({ name: 'Burgers & Sandwiches' });
            const appetizerCat = await Category.findOne({ name: 'Appetizers & Sides' });
            const beverageCat = await Category.findOne({ name: 'Beverages' });
            const saladCat = await Category.findOne({ name: 'Salads & Desserts' });

            await MenuItem.insertMany([
                { name: 'Special Pizza', price: 280000, stock_quantity: 50, category_id: fastFoodCat._id, is_available: true, image: '' },
                { name: 'Pepperoni Pizza', price: 260000, stock_quantity: 50, category_id: fastFoodCat._id, is_available: true, image: '' },
                { name: 'Meat and Mushroom Pizza', price: 290000, stock_quantity: 50, category_id: fastFoodCat._id, is_available: true, image: '' },

                { name: 'Koobideh Kebab', price: 320000, stock_quantity: 50, category_id: traditionalCat._id, is_available: true, image: '' },
                { name: 'Joojeh Kebab', price: 270000, stock_quantity: 50, category_id: traditionalCat._id, is_available: true, image: '' },
                { name: 'Ghormeh Sabzi', price: 220000, stock_quantity: 50, category_id: traditionalCat._id, is_available: true, image: '' },
                { name: 'Gheymeh Stew', price: 210000, stock_quantity: 50, category_id: traditionalCat._id, is_available: true, image: '' },

                { name: 'Special Burger', price: 230000, stock_quantity: 50, category_id: burgerCat._id, is_available: true, image: '' },
                { name: 'Oven-Baked Ham Sandwich', price: 190000, stock_quantity: 50, category_id: burgerCat._id, is_available: true, image: '' },

                { name: 'French Fries', price: 90000, stock_quantity: 100, category_id: appetizerCat._id, is_available: true, image: '' },
                { name: 'Garlic Bread', price: 110000, stock_quantity: 100, category_id: appetizerCat._id, is_available: true, image: '' },

                { name: 'Soda', price: 30000, stock_quantity: 150, category_id: beverageCat._id, is_available: true, image: '' },
                { name: 'Persian Doogh', price: 35000, stock_quantity: 150, category_id: beverageCat._id, is_available: true, image: '' },
                { name: 'Mineral Water', price: 15000, stock_quantity: 200, category_id: beverageCat._id, is_available: true, image: '' },

                { name: 'Caesar Salad', price: 180000, stock_quantity: 40, category_id: saladCat._id, is_available: true, image: '' },
                { name: 'Shirazi Salad', price: 70000, stock_quantity: 60, category_id: saladCat._id, is_available: true, image: '' }
            ]);
            console.log('Default menu items added successfully.');

        } else {
            console.log('Menu items already exist in database. skipping...');
        }

        // --- قدم پنجم: اضافه کردن سفارش‌های اولیه (Orders) با نام فیلدهای اصلاح‌شده ---
        const existingOrders = await Order.countDocuments();
        if (existingOrders === 0) {
            console.log('Seeding Orders...');

            const allUsers = await User.find();
            const userMap = {};
            allUsers.forEach(u => userMap[u.fullname] = u._id);

            const allMenuItems = await MenuItem.find();
            const menuMap = {};
            allMenuItems.forEach(m => menuMap[m.name] = { id: m._id, price: m.price });

            const staticOrders = [
                { customer: 'Ali Rezaee', status: 'delivered', date: '2026-07-20T13:15:00', items: [{ name: 'Special Pizza', qty: 1 }, { name: 'Soda', qty: 2 }] },
                { customer: 'Ali Rezaee', status: 'delivered', date: '2026-07-21T20:30:00', items: [{ name: 'Special Burger', qty: 2 }, { name: 'French Fries', qty: 1 }, { name: 'Persian Doogh', qty: 2 }] },
                { customer: 'Ali Rezaee', status: 'canceled', date: '2026-07-22T14:00:00', items: [{ name: 'Koobideh Kebab', qty: 1 }] },

                { customer: 'Maryam Ahmadi', status: 'delivered', date: '2026-07-20T14:20:00', items: [{ name: 'Joojeh Kebab', qty: 2 }, { name: 'Shirazi Salad', qty: 2 }, { name: 'Persian Doogh', qty: 2 }] },
                { customer: 'Maryam Ahmadi', status: 'canceled', date: '2026-07-22T19:20:00', items: [{ name: 'Caesar Salad', qty: 2 }, { name: 'Mineral Water', qty: 2 }] },
                { customer: 'Maryam Ahmadi', status: 'delivered', date: '2026-07-23T19:45:00', items: [{ name: 'Pepperoni Pizza', qty: 1 }, { name: 'Garlic Bread', qty: 1 }, { name: 'Soda', qty: 1 }] },

                { customer: 'Reza Mohammadi', status: 'delivered', date: '2026-07-21T12:30:00', items: [{ name: 'Ghormeh Sabzi', qty: 1 }, { name: 'Mineral Water', qty: 1 }] },
                { customer: 'Reza Mohammadi', status: 'canceled', date: '2026-07-24T21:10:00', items: [{ name: 'Meat and Mushroom Pizza', qty: 2 }, { name: 'Soda', qty: 2 }] },

                { customer: 'Sara Karimi', status: 'delivered', date: '2026-07-20T15:00:00', items: [{ name: 'Caesar Salad', qty: 1 }, { name: 'Mineral Water', qty: 1 }] },
                { customer: 'Sara Karimi', status: 'delivered', date: '2026-07-22T13:40:00', items: [{ name: 'Oven-Baked Ham Sandwich', qty: 1 }, { name: 'French Fries', qty: 1 }, { name: 'Soda', qty: 1 }] },
                { customer: 'Sara Karimi', status: 'canceled', date: '2026-07-24T13:10:00', items: [{ name: 'Pepperoni Pizza', qty: 1 }, { name: 'Garlic Bread', qty: 1 }] },
                { customer: 'Sara Karimi', status: 'delivered', date: '2026-07-25T20:00:00', items: [{ name: 'Special Burger', qty: 1 }, { name: 'Soda', qty: 1 }] },

                { customer: 'Omid Mousavi', status: 'delivered', date: '2026-07-21T21:30:00', items: [{ name: 'Pepperoni Pizza', qty: 2 }, { name: 'Garlic Bread', qty: 1 }] },
                { customer: 'Omid Mousavi', status: 'delivered', date: '2026-07-24T14:15:00', items: [{ name: 'Gheymeh Stew', qty: 1 }, { name: 'Shirazi Salad', qty: 1 }, { name: 'Persian Doogh', qty: 1 }] },

                { customer: 'Negar Ghasemi', status: 'delivered', date: '2026-07-20T19:00:00', items: [{ name: 'Koobideh Kebab', qty: 2 }, { name: 'Persian Doogh', qty: 2 }] },
                { customer: 'Negar Ghasemi', status: 'canceled', date: '2026-07-23T13:20:00', items: [{ name: 'Special Pizza', qty: 1 }] },

                { customer: 'Hossein Hosseini', status: 'canceled', date: '2026-07-21T21:00:00', items: [{ name: 'Special Burger', qty: 2 }, { name: 'Soda', qty: 2 }] },
                { customer: 'Hossein Hosseini', status: 'delivered', date: '2026-07-22T20:45:00', items: [{ name: 'Meat and Mushroom Pizza', qty: 1 }, { name: 'French Fries', qty: 1 }, { name: 'Soda', qty: 2 }] },
                { customer: 'Hossein Hosseini', status: 'delivered', date: '2026-07-25T15:30:00', items: [{ name: 'Joojeh Kebab', qty: 1 }, { name: 'Mineral Water', qty: 1 }] },

                { customer: 'Zahra Kazemi', status: 'delivered', date: '2026-07-21T13:50:00', items: [{ name: 'Special Burger', qty: 2 }, { name: 'Caesar Salad', qty: 1 }] },
                { customer: 'Zahra Kazemi', status: 'delivered', date: '2026-07-24T19:15:00', items: [{ name: 'Ghormeh Sabzi', qty: 2 }, { name: 'Shirazi Salad', qty: 2 }] },
                { customer: 'Zahra Kazemi', status: 'canceled', date: '2026-07-25T20:15:00', items: [{ name: 'Oven-Baked Ham Sandwich', qty: 1 }, { name: 'French Fries', qty: 1 }] },

                { customer: 'Mehdi Nouri', status: 'delivered', date: '2026-07-20T21:00:00', items: [{ name: 'Oven-Baked Ham Sandwich', qty: 2 }, { name: 'Soda', qty: 2 }] },
                { customer: 'Mehdi Nouri', status: 'canceled', date: '2026-07-23T20:10:00', items: [{ name: 'Koobideh Kebab', qty: 3 }, { name: 'Persian Doogh', qty: 3 }] },

                { customer: 'Fatemeh Jafari', status: 'delivered', date: '2026-07-22T14:30:00', items: [{ name: 'Pepperoni Pizza', qty: 1 }, { name: 'Special Pizza', qty: 1 }, { name: 'Soda', qty: 2 }] },
                { customer: 'Fatemeh Jafari', status: 'canceled', date: '2026-07-23T15:45:00', items: [{ name: 'Joojeh Kebab', qty: 1 }, { name: 'Shirazi Salad', qty: 1 }] },
                { customer: 'Fatemeh Jafari', status: 'delivered', date: '2026-07-25T13:00:00', items: [{ name: 'Gheymeh Stew', qty: 2 }, { name: 'Mineral Water', qty: 2 }] }
            ];

            const ordersToInsert = staticOrders.map(order => {
                let totalPrice = 0;
                const items = order.items.map(item => {
                    const menuItem = menuMap[item.name];
                    const itemTotal = menuItem.price * item.qty;
                    totalPrice += itemTotal;
                    return {
                        menu_item_id: menuItem.id,
                        quantity: item.qty,
                        unit_price: menuItem.price // اصلاح شد: منطبق با نام unit_price در Schema
                    };
                });

                const orderDate = new Date(order.date);

                return {
                    customer_id: userMap[order.customer],
                    items: items,
                    total_price: totalPrice,              // اصلاح شد: منطبق با نام total_price در Schema
                    final_price: totalPrice,              // اضافه شد: منطبق با فیلد اجباری final_price در Schema
                    status: order.status,
                    createdAt: orderDate,
                    updatedAt: orderDate
                };
            });

            await Order.insertMany(ordersToInsert);
            console.log('Default orders added successfully.');
        } else {
            console.log('Orders already exist in database. skipping...');
        }

        // --- قدم ششم: اضافه کردن لاگ‌های سفارش (Order Logs) با تطابق کامل با اکشن‌ها ---
        const existingLogs = await OrderLog.countDocuments();
        if (existingLogs === 0) {
            console.log('Seeding Order Logs statically...');

            const allUsers = await User.find();
            const userMap = {};
            allUsers.forEach(u => userMap[u.fullname] = u._id);

            const allOrders = await Order.find();
            const orderMap = {};
            allOrders.forEach(o => {
                const dateKey = new Date(o.createdAt).toISOString();
                orderMap[`${o.customer_id}_${dateKey}`] = o._id;
            });

            const getOrderId = (customerName, dateStr) => {
                const userId = userMap[customerName];
                const dateKey = new Date(dateStr).toISOString();
                return orderMap[`${userId}_${dateKey}`];
            };

            const staffNameMapping = {
                'Kitchen Staff 1': 'Babak Rahimi',
                'Kitchen Staff 2': 'Sina Mehdizadeh',
                'Kitchen Staff 3': 'Farhad Kiani',
                'Cashier 1': 'Shirin Golzar',
                'Cashier 2': 'Nima Karimi'
            };

            const staticLogs = [
                { customer: 'Ali Rezaee', orderDate: '2026-07-20T13:15:00', old_status: null, new_status: 'registered', changed_by: 'Ali Rezaee', action_type: 'ORDER_CREATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-20T13:15:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-20T13:15:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-20T13:15:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Ali Rezaee', orderDate: '2026-07-21T20:30:00', old_status: null, new_status: 'registered', changed_by: 'Ali Rezaee', action_type: 'ORDER_CREATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-21T20:30:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-21T20:30:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-21T20:30:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Ali Rezaee', orderDate: '2026-07-22T14:00:00', old_status: null, new_status: 'registered', changed_by: 'Ali Rezaee', action_type: 'ORDER_CREATED' },
                { customer: 'Ali Rezaee', orderDate: '2026-07-22T14:00:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Ali Rezaee', action_type: 'ORDER_CANCELED' },

                { customer: 'Maryam Ahmadi', orderDate: '2026-07-20T14:20:00', old_status: null, new_status: 'registered', changed_by: 'Maryam Ahmadi', action_type: 'ORDER_CREATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-20T14:20:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-20T14:20:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-20T14:20:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Maryam Ahmadi', orderDate: '2026-07-22T19:20:00', old_status: null, new_status: 'registered', changed_by: 'Maryam Ahmadi', action_type: 'ORDER_CREATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-22T19:20:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Maryam Ahmadi', action_type: 'ORDER_CANCELED' },

                { customer: 'Maryam Ahmadi', orderDate: '2026-07-23T19:45:00', old_status: null, new_status: 'registered', changed_by: 'Maryam Ahmadi', action_type: 'ORDER_CREATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-23T19:45:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-23T19:45:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Maryam Ahmadi', orderDate: '2026-07-23T19:45:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Reza Mohammadi', orderDate: '2026-07-21T12:30:00', old_status: null, new_status: 'registered', changed_by: 'Reza Mohammadi', action_type: 'ORDER_CREATED' },
                { customer: 'Reza Mohammadi', orderDate: '2026-07-21T12:30:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Reza Mohammadi', orderDate: '2026-07-21T12:30:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Reza Mohammadi', orderDate: '2026-07-21T12:30:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Reza Mohammadi', orderDate: '2026-07-24T21:10:00', old_status: null, new_status: 'registered', changed_by: 'Reza Mohammadi', action_type: 'ORDER_CREATED' },
                { customer: 'Reza Mohammadi', orderDate: '2026-07-24T21:10:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Reza Mohammadi', action_type: 'ORDER_CANCELED' },

                { customer: 'Sara Karimi', orderDate: '2026-07-20T15:00:00', old_status: null, new_status: 'registered', changed_by: 'Sara Karimi', action_type: 'ORDER_CREATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-20T15:00:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-20T15:00:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-20T15:00:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Sara Karimi', orderDate: '2026-07-22T13:40:00', old_status: null, new_status: 'registered', changed_by: 'Sara Karimi', action_type: 'ORDER_CREATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-22T13:40:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-22T13:40:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-22T13:40:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Sara Karimi', orderDate: '2026-07-24T13:10:00', old_status: null, new_status: 'registered', changed_by: 'Sara Karimi', action_type: 'ORDER_CREATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-24T13:10:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Sara Karimi', action_type: 'ORDER_CANCELED' },

                { customer: 'Sara Karimi', orderDate: '2026-07-25T20:00:00', old_status: null, new_status: 'registered', changed_by: 'Sara Karimi', action_type: 'ORDER_CREATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-25T20:00:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-25T20:00:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Sara Karimi', orderDate: '2026-07-25T20:00:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Omid Mousavi', orderDate: '2026-07-21T21:30:00', old_status: null, new_status: 'registered', changed_by: 'Omid Mousavi', action_type: 'ORDER_CREATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-21T21:30:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-21T21:30:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-21T21:30:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Omid Mousavi', orderDate: '2026-07-24T14:15:00', old_status: null, new_status: 'registered', changed_by: 'Omid Mousavi', action_type: 'ORDER_CREATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-24T14:15:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-24T14:15:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Omid Mousavi', orderDate: '2026-07-24T14:15:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Negar Ghasemi', orderDate: '2026-07-20T19:00:00', old_status: null, new_status: 'registered', changed_by: 'Negar Ghasemi', action_type: 'ORDER_CREATED' },
                { customer: 'Negar Ghasemi', orderDate: '2026-07-20T19:00:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Negar Ghasemi', orderDate: '2026-07-20T19:00:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Negar Ghasemi', orderDate: '2026-07-20T19:00:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Negar Ghasemi', orderDate: '2026-07-23T13:20:00', old_status: null, new_status: 'registered', changed_by: 'Negar Ghasemi', action_type: 'ORDER_CREATED' },
                { customer: 'Negar Ghasemi', orderDate: '2026-07-23T13:20:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Negar Ghasemi', action_type: 'ORDER_CANCELED' },

                { customer: 'Hossein Hosseini', orderDate: '2026-07-21T21:00:00', old_status: null, new_status: 'registered', changed_by: 'Hossein Hosseini', action_type: 'ORDER_CREATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-21T21:00:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Hossein Hosseini', action_type: 'ORDER_CANCELED' },

                { customer: 'Hossein Hosseini', orderDate: '2026-07-22T20:45:00', old_status: null, new_status: 'registered', changed_by: 'Hossein Hosseini', action_type: 'ORDER_CREATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-22T20:45:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-22T20:45:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-22T20:45:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Hossein Hosseini', orderDate: '2026-07-25T15:30:00', old_status: null, new_status: 'registered', changed_by: 'Hossein Hosseini', action_type: 'ORDER_CREATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-25T15:30:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-25T15:30:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Hossein Hosseini', orderDate: '2026-07-25T15:30:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Zahra Kazemi', orderDate: '2026-07-21T13:50:00', old_status: null, new_status: 'registered', changed_by: 'Zahra Kazemi', action_type: 'ORDER_CREATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-21T13:50:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-21T13:50:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-21T13:50:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Zahra Kazemi', orderDate: '2026-07-24T19:15:00', old_status: null, new_status: 'registered', changed_by: 'Zahra Kazemi', action_type: 'ORDER_CREATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-24T19:15:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-24T19:15:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-24T19:15:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Zahra Kazemi', orderDate: '2026-07-25T20:15:00', old_status: null, new_status: 'registered', changed_by: 'Zahra Kazemi', action_type: 'ORDER_CREATED' },
                { customer: 'Zahra Kazemi', orderDate: '2026-07-25T20:15:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Zahra Kazemi', action_type: 'ORDER_CANCELED' },

                { customer: 'Mehdi Nouri', orderDate: '2026-07-20T21:00:00', old_status: null, new_status: 'registered', changed_by: 'Mehdi Nouri', action_type: 'ORDER_CREATED' },
                { customer: 'Mehdi Nouri', orderDate: '2026-07-20T21:00:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Mehdi Nouri', orderDate: '2026-07-20T21:00:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Mehdi Nouri', orderDate: '2026-07-20T21:00:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' },

                { customer: 'Mehdi Nouri', orderDate: '2026-07-23T20:10:00', old_status: null, new_status: 'registered', changed_by: 'Mehdi Nouri', action_type: 'ORDER_CREATED' },
                { customer: 'Mehdi Nouri', orderDate: '2026-07-23T20:10:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Mehdi Nouri', action_type: 'ORDER_CANCELED' },

                { customer: 'Fatemeh Jafari', orderDate: '2026-07-22T14:30:00', old_status: null, new_status: 'registered', changed_by: 'Fatemeh Jafari', action_type: 'ORDER_CREATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-22T14:30:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-22T14:30:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 1', action_type: 'STATUS_UPDATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-22T14:30:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 2', action_type: 'ORDER_DELIVERED' },

                { customer: 'Fatemeh Jafari', orderDate: '2026-07-23T15:45:00', old_status: null, new_status: 'registered', changed_by: 'Fatemeh Jafari', action_type: 'ORDER_CREATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-23T15:45:00', old_status: 'registered', new_status: 'canceled', changed_by: 'Fatemeh Jafari', action_type: 'ORDER_CANCELED' },

                { customer: 'Fatemeh Jafari', orderDate: '2026-07-25T13:00:00', old_status: null, new_status: 'registered', changed_by: 'Fatemeh Jafari', action_type: 'ORDER_CREATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-25T13:00:00', old_status: 'registered', new_status: 'preparing', changed_by: 'Kitchen Staff 3', action_type: 'STATUS_UPDATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-25T13:00:00', old_status: 'preparing', new_status: 'ready_for_delivery', changed_by: 'Kitchen Staff 2', action_type: 'STATUS_UPDATED' },
                { customer: 'Fatemeh Jafari', orderDate: '2026-07-25T13:00:00', old_status: 'ready_for_delivery', new_status: 'delivered', changed_by: 'Cashier 1', action_type: 'ORDER_DELIVERED' }
            ];

            const logsToInsert = staticLogs.map(log => {
                const realName = staffNameMapping[log.changed_by] || log.changed_by;
                return {
                    order_id: getOrderId(log.customer, log.orderDate),
                    old_status: log.old_status,
                    new_status: log.new_status,
                    changed_by: userMap[realName],
                    action_type: log.action_type // اضافه شد: منطبق با فیلد اجباری action_type در Schema
                };
            });

            await OrderLog.insertMany(logsToInsert);
            console.log('Default order logs added successfully.');
        } else {
            console.log('Order logs already exist in database. skipping...');
        }
        
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedDatabase();