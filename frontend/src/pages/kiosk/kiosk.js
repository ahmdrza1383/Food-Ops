import { fetchAPI } from '../../services/api.js';

const preparingContainer = document.getElementById('preparing-container');
const readyContainer = document.getElementById('ready-container');
const clockElement = document.getElementById('clock');

/**
 * آپدیت کردن ساعت گوشه تصویر به صورت زنده
 */
setInterval(() => {
  const now = new Date();
  clockElement.textContent = now.toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}, 1000);

/**
 * دریافت لیست سفارش‌ها از روت عمومی کیوسک
 */
async function fetchKioskOrders() {
  try {
    const response = await fetchAPI('/orders/kiosk', { 
      method: 'GET' 
    });
    
    if (response && response.status === 'success') {
      // گرفتن دو آرایه مجزا دقیقاً مطابق با چیزی که بک‌اند می‌فرستد
      const preparingOrders = response.data?.preparing_orders || [];
      const readyOrders = response.data?.ready_orders || [];
      
      renderKiosk(preparingOrders, readyOrders);
    }
  } catch (error) {
    console.error('خطا در دریافت اطلاعات کیوسک:', error);
  }
}

/**
 * رندر کردن شماره سفارش‌ها روی مانیتور
 */
function renderKiosk(preparingOrders, readyOrders) {
  // رندر ستون در حال آماده‌سازی (تم آبی)
  if (preparingOrders.length === 0) {
    preparingContainer.innerHTML = '';
  } else {
    preparingContainer.innerHTML = preparingOrders.map(order => `
      <div class="bg-blue-500/10 border-2 border-blue-500/30 rounded-3xl flex items-center justify-center py-8 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
        <span class="text-6xl font-black text-blue-400">${order.daily_order_number || '---'}</span>
      </div>
    `).join('');
  }

  // رندر ستون آماده تحویل (تم سبز با افکت نبض برای جلب توجه)
  if (readyOrders.length === 0) {
    readyContainer.innerHTML = '';
  } else {
    readyContainer.innerHTML = readyOrders.map(order => `
      <div class="bg-emerald-500/20 border-2 border-emerald-500 rounded-3xl flex items-center justify-center py-8 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-pulse transition-all">
        <span class="text-7xl font-black text-emerald-400">${order.daily_order_number || '---'}</span>
      </div>
    `).join('');
  }
}

// 1. دریافت اطلاعات در لحظه باز شدن صفحه
fetchKioskOrders();

// 2. اجرای روش Polling: درخواست به سرور هر ۵ ثانیه یک‌بار
setInterval(fetchKioskOrders, 5000);