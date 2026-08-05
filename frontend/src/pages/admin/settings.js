import { fetchAPI } from '../../services/api.js';
import { showToast } from '../../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('settings-form');
    const openingTimeInput = document.getElementById('opening_time');
    const closingTimeInput = document.getElementById('closing_time');
    const isAcceptingOrdersInput = document.getElementById('is_accepting_orders');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.getElementById('user-name');

    // --- احراز هویت مشابه بقیه صفحات ادمین ---
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) {
        window.location.href = '/src/pages/auth/login.html';
        return;
    } else if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userNameSpan.textContent = user.fullname || 'ادمین';
            const role = (user.roleName || '').toLowerCase();
            if (role !== 'admin') {
                window.location.href = '/';
                return;
            }
        } catch (e) { }
    }

    // --- دریافت و نمایش ساعت کاری و وضعیت قبلی سیستم ---
    async function loadCurrentSettings() {
        try {
            const response = await fetchAPI('/admin/settings/working-hours');
            
            // با توجه به اینکه بک‌اند آبجکت data را می‌فرستد
            const settings = response.data || response; 

            if (settings) {
                if (settings.opening_time) openingTimeInput.value = settings.opening_time;
                if (settings.closing_time) closingTimeInput.value = settings.closing_time;
                if (typeof settings.is_accepting_orders !== 'undefined') {
                    isAcceptingOrdersInput.checked = settings.is_accepting_orders;
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showToast(error.message || 'خطا در دریافت اطلاعات ساعت کاری قبلی.', 'error');
        }
    }

    // اجرای تابع لود تنظیمات در ابتدا
    loadCurrentSettings();

    // دکمه خروج
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/src/pages/auth/login.html';
    });

    // رویداد سابمیت فرم برای آپدیت تنظیمات
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const opening_time = openingTimeInput.value;
        const closing_time = closingTimeInput.value;
        const is_accepting_orders = isAcceptingOrdersInput.checked;

        try {
            await fetchAPI('/admin/settings/working-hours', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    opening_time,
                    closing_time,
                    is_accepting_orders
                })
            });

            showToast('تنظیمات سیستم با موفقیت ذخیره شد.', 'success');
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || 'خطا در ذخیره تنظیمات.', 'error');
        }
    });
});