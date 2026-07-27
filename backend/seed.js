const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // یا bcryptjs

const MONGO_URI = 'mongodb://admin:password@localhost:27017/foodops?authSource=admin';


const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    phone_number: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

const MenuItemSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image_url: { type: String }, // ذخیره به صورت آدرس نسبی
    status: { type: Boolean, default: true },
    stock_quantity: { type: Number, required: true, default: 0 },
    estimated_prep_time: { type: Number, default: 15 }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total_amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'in_kitchen', 'ready', 'delivered', 'cancelled'], default: 'pending' },
    table_number: { type: Number }
}, { timestamps: true });

const OrderLogSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    old_status: { type: String },
    new_status: { type: String, required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const DiscountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    percentage: { type: Number, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

const SystemSettingSchema = new mongoose.Schema({
    setting_key: { type: String, required: true, unique: true },
    setting_value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);
const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Order = mongoose.model('Order', OrderSchema);
const OrderLog = mongoose.model('OrderLog', OrderLogSchema);
const Discount = mongoose.model('Discount', DiscountSchema);
const SystemSetting = mongoose.model('SystemSetting', SystemSettingSchema);

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

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedDatabase();