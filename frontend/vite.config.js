// frontend/vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                login: resolve(__dirname, 'src/pages/auth/login.html'),
                register: resolve(__dirname, 'src/pages/auth/register.html'),
                checkout: resolve(__dirname, 'src/pages/customer/checkout.html'),
                myOrders: resolve(__dirname, 'src/pages/customer/my-orders.html'),
                kitchen: resolve(__dirname, 'src/pages/kitchen/dashboard.html'),
                delivery: resolve(__dirname, 'src/pages/delivery/dashboard.html'),
                adminMenu: resolve(__dirname, 'src/pages/admin/menu-manager.html'),
                adminReports: resolve(__dirname, 'src/pages/admin/reports.html'),
            },
        },
    },
});