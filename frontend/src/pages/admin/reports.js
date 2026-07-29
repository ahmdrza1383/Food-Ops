import { fetchAPI } from '../../services/api.js';
import { formatPrice, showToast } from '../../utils/helpers.js';

// --- عناصر DOM ---
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const daysSelect = document.getElementById('days-select');

// --- احراز هویت ---
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token) {
    window.location.href = '/src/pages/auth/login.html';
} else if (userStr) {
    try {
        const user = JSON.parse(userStr);
        userNameSpan.textContent = user.fullname || 'admin';
        if ((user.roleName || '').toLowerCase() !== 'admin') {
            window.location.href = '/';
        }
    } catch (e) { }
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/src/pages/auth/login.html';
});

// --- فرمت‌کننده تاریخ برای نمودار (میلادی به شمسی) ---
function formatDateForLabel(dateString) {
    // چون تاریخ از بک‌اند به صورت YYYY-MM-DD می‌آید، اختلاف ساعت ایجاد نشود:
    const parts = dateString.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
}

// --- ۱. بارگذاری آمار کلی و نمودار ---
async function loadDailyReport(days = 7) {
    try {
        const response = await fetchAPI(`/admin/reports/daily?days=${days}`);
        const data = response.data;

        // آپدیت کارت‌های آمار (بر اساس `data.summary`)
        document.getElementById('stat-orders').textContent = data.summary.total_orders.toLocaleString('fa-IR');
        document.getElementById('stat-revenue').textContent = formatPrice(data.summary.total_revenue);
        document.getElementById('stat-avg-order').textContent = formatPrice(data.summary.average_order_value);
        document.getElementById('stat-avg-daily').textContent = formatPrice(data.summary.average_daily_revenue);

        // آماده‌سازی داده برای نمودار (بر اساس `data.daily_reports`)
        const dailyReports = data.daily_reports;
        const labels = dailyReports.map(item => formatDateForLabel(item.date));
        const revenues = dailyReports.map(item => item.total_sales);

        // رسم نمودار با Chart.js
        const ctx = document.getElementById('salesChart').getContext('2d');

        // اگر نموداری قبلاً وجود داشت، آن را پاک کنید (برای تغییر بازه زمانی)
        if (window.mySalesChart) {
            window.mySalesChart.destroy();
        }

        window.mySalesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'درآمد روزانه (تومان)',
                    data: revenues,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString('fa-IR');
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        showToast('خطا در دریافت اطلاعات آماری', 'error');
    }
}

// --- ۲. بارگذاری لیست پرفروش‌ترین آیتم‌ها ---
async function loadTopItems(limit = 10) {
    try {
        // ارسال پارامتر limit که در بک‌اند شما هندل می‌شود
        const response = await fetchAPI(`/admin/reports/items?limit=${limit}`);
        const data = response.data;
        const items = data.top_items || [];

        document.getElementById('top-items-count').textContent = `(تعداد ${items.length} آیتم)`;

        const container = document.getElementById('top-items-container');
        if (items.length === 0) {
            container.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">هنوز سفارشی ثبت نشده است.</p>`;
            return;
        }

        container.innerHTML = items.map((item, index) => `
            <div class="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white transition">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        #${index + 1}
                    </div>
                    <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'}" class="w-10 h-10 rounded-lg object-cover" />
                    <div>
                        <h4 class="font-bold text-sm text-slate-800">${item.name}</h4>
                        <span class="text-[10px] text-slate-400">${item.category_name || 'دسته‌بندی نشده'}</span>
                    </div>
                </div>
                <div class="text-left text-xs font-medium">
                    <span class="block text-slate-500">${item.total_quantity_sold} عدد فروخته شده</span>
                    <span class="block text-emerald-600 font-bold">${formatPrice(item.total_revenue)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        showToast('خطا در دریافت لیست پرفروش‌ترین‌ها', 'error');
    }
}

// --- ۳. مدیریت تغییر بازه زمانی در Dropdown ---
daysSelect.addEventListener('change', (e) => {
    const selectedDays = parseInt(e.target.value);
    loadDailyReport(selectedDays);
});

// --- اجرای اولیه ---
document.addEventListener('DOMContentLoaded', () => {
    loadDailyReport(7); // پیش‌فرض ۷ روز اخیر
    loadTopItems(10);   // پیش‌فرض ۱۰ آیتم برتر
});