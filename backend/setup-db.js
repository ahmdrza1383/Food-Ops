const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://admin:password@127.0.0.1:27017/foodops?authSource=admin';


const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    phone_number: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Must be hashed with bcrypt before saving
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
    image_url: { type: String },
    status: { type: Boolean, default: true },
    stock_quantity: { type: Number, required: true, default: 0 },
    estimated_prep_time: { type: Number, default: 15 } // Time in minutes
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    total_price: { type: Number, required: true },
    discount_code_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    final_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Registered', 'Preparing', 'Ready for Delivery', 'Delivered', 'Canceled'],
        default: 'Registered'
    },
    estimated_ready_time: { type: Date }
}, { timestamps: true });

const OrderLogSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    old_status: { type: String },
    new_status: { type: String, required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action_type: { type: String, required: true }
}, { timestamps: true, updatedAt: false }); // Only creation date is needed

const DiscountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount_percent: { type: Number, required: true, min: 1, max: 100 },
    expiration_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

const SystemSettingSchema = new mongoose.Schema({
    opening_time: { type: String, default: "08:00" },
    closing_time: { type: String, default: "23:00" },
    is_accepting_orders: { type: Boolean, default: true }
}, { timestamps: true });


const Role = mongoose.model('Role', RoleSchema);
const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Order = mongoose.model('Order', OrderSchema);
const OrderLog = mongoose.model('OrderLog', OrderLogSchema);
const Discount = mongoose.model('Discount', DiscountSchema);
const SystemSetting = mongoose.model('SystemSetting', SystemSettingSchema);


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

        const existingRoles = await Role.countDocuments();
        if (existingRoles === 0) {
            console.log('Creating default roles...');
            await Role.insertMany([
                { name: 'Admin', permissions: ['all'] },
                { name: 'Kitchen Staff', permissions: ['view_kitchen_queue', 'update_order_status'] },
                { name: 'Cashier', permissions: ['view_ready_orders', 'deliver_orders'] },
                { name: 'Customer', permissions: ['create_order', 'view_own_orders', 'cancel_own_order'] }
            ]);
            console.log('Default system roles added.');
        }

        console.log('Operation completed. Exiting...');
        process.exit(0);

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();