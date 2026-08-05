import { fetchAPI } from '../../services/api.js';
import { formatPrice } from '../../utils/helpers.js';

const ordersContainer = document.getElementById('orders-container');
const messageContainer = document.getElementById('message-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');

let allOrders = [];
let currentFilter = 'all';

// تنظیمات رنگ‌ها و وضعیت‌ها دقیقاً مطابق صفحه سفارشات من
const STATUS_CONFIG = {
  registered: {
    title: 'ثبت شده',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    cardBg: 'bg-amber-50/40 border-amber-200'
  },
  preparing: {
    title: 'در حال آماده‌سازی',
    classes: 'bg-blue-100 text-blue-800 border-blue-300',
    cardBg: 'bg-blue-50/40 border-blue-200'
  }
};

// بررسی احراز هویت
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token) {
  window.location.href = '/src/pages/auth/login.html';
} else if (userStr) {
  try {
    const user = JSON.parse(userStr);
    userNameSpan.textContent = user.fullname || 'پرسنل آشپزخانه';
  } catch (e) {}
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/src/pages/auth/login.html';
});

/**
 * دریافت لیست سفارشات از سرور
 */
async function loadKitchenOrders() {
  messageContainer.textContent = 'در حال بارگذاری سفارشات...';
  messageContainer.classList.remove('hidden');
  ordersContainer.innerHTML = '';

  try {
    const response = await fetchAPI('/kitchen/orders');
    
    if (response && response.status === 'success') {
      allOrders = response.data?.orders || [];
      
      // مرتب‌سازی بر اساس زمان: قدیمی‌ترین بالا (صعودی / FIFO)
      allOrders.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      renderOrders();
    } else {
      messageContainer.textContent = response.message || 'خطا در دریافت سفارشات.';
    }
  } catch (error) {
    messageContainer.textContent = 'خطا در ارتباط با سرور!';
  }
}

/**
 * رندر کارت‌ها بر اساس فیلتر انتخاب شده
 */
function renderOrders() {
  let filtered = allOrders;

  if (currentFilter !== 'all') {
    filtered = allOrders.filter(o => {
      const status = (o.status || '').trim();
      return status === currentFilter;
    });
  }

  if (filtered.length === 0) {
    messageContainer.textContent = 'هیچ سفارشی در این وضعیت وجود ندارد.';
    messageContainer.classList.remove('hidden');
    ordersContainer.innerHTML = '';
    return;
  }

  messageContainer.classList.add('hidden');
  ordersContainer.innerHTML = '';

  filtered.forEach(order => {
    const card = createOrderCard(order);
    ordersContainer.appendChild(card);
  });
}

function createOrderCard(order) {
  const card = document.createElement('div');
  
  const status = order.status || 'registered';
  const statusInfo = STATUS_CONFIG[status] || {
    title: 'ثبت شده',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    cardBg: 'bg-white border-slate-200'
  };

  card.className = `rounded-2xl border p-6 shadow-sm hover:shadow-md transition ${statusInfo.cardBg}`;

  const customerName = order.customer_id?.fullname || 'مشتری';
  const customerPhone = order.customer_id?.phone_number || '';
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'نامشخص';
  
  const orderId = order._id;
  // 👈 دریافت شماره سفارش روزانه با مقدار جایگزین
  const orderNumber = order.daily_order_number || '---';

  let actionButtonHtml = '';
  if (status === 'registered') {
    actionButtonHtml = `
      <button data-id="${orderId}" data-action="start" class="update-status-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-amber-500/20 flex items-center gap-1.5">
        <span>شروع آماده‌سازی</span> <i class="fa-solid fa-arrow-left"></i>
      </button>
    `;
  } else if (status === 'preparing') {
    actionButtonHtml = `
      <button data-id="${orderId}" data-action="ready" class="update-status-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5">
        <span>آماده تحویل</span> <i class="fa-solid fa-check"></i>
      </button>
    `;
  }

  let itemsHtml = '';
  const items = order.items || [];
  items.forEach(item => {
    const foodName = item.menu_item_id?.name || 'غذای نامشخص';
    const quantity = item.quantity || 1;
    const unitPrice = item.unit_price || 0;
    const totalPrice = unitPrice * quantity;
    
    itemsHtml += `
      <div class="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0 text-sm">
        <div class="flex items-center gap-2">
          <span class="font-bold text-amber-600 bg-white px-2 py-0.5 rounded-lg text-xs shadow-xs border border-slate-200/60">${quantity} عدد</span>
          <span class="font-medium text-slate-700">${foodName}</span>
        </div>
        <span class="text-slate-600 font-semibold">${formatPrice(totalPrice)}</span>
      </div>
    `;
  });

  card.innerHTML = `
    <!-- هدر کارت سفارش -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
      <div class="flex items-center gap-2">
        <!-- 👈 نمایش درشت شماره سفارش برای آشپز -->
        <span class="text-xl font-black text-slate-800 ml-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
          #${orderNumber}
        </span>
        <span class="px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.classes}">
          ${statusInfo.title}
        </span>
        <span class="text-xs font-medium text-slate-500 mr-2"><i class="fa-regular fa-user ml-1"></i> ${customerName} ${customerPhone ? `(${customerPhone})` : ''}</span>
      </div>
      ${actionButtonHtml}
    </div>

    <!-- تاریخ ثبت سفارش -->
    <div class="bg-white/70 border border-slate-200/60 p-3 rounded-xl mb-4 text-xs text-slate-600 font-medium">
      <span class="text-slate-400 ml-1">تاریخ و زمان ثبت:</span>
      <span>${createdAt}</span>
    </div>

    <!-- ریزسفارش‌ها -->
    <div class="mb-4">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ریز سفارش‌ها</h4>
      <div class="bg-white/80 rounded-xl p-3 border border-slate-200/60">
        ${itemsHtml}
      </div>
    </div>

    <!-- مبلغ کل سفارش -->
    <div class="flex justify-between items-center pt-3 border-t border-slate-200/80">
      <span class="text-sm font-bold text-slate-800">مبلغ کل سفارش:</span>
      <span class="text-lg font-black text-amber-600">${formatPrice(order.total_price)}</span>
    </div>
  `;

  const btn = card.querySelector('.update-status-btn');
  if (btn) {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const action = e.currentTarget.getAttribute('data-action');
      
      btn.disabled = true;
      btn.textContent = 'در حال به‌روزرسانی...';

      const endpoint = action === 'start' ? `/orders/${id}/start` : `/orders/${id}/ready`;

      try {
        const res = await fetchAPI(endpoint, {
          method: 'PATCH'
        });

        if (res && res.status === 'success') {
          loadKitchenOrders();
        } else {
          alert(res.message || 'خطا در به‌روزرسانی وضعیت سفارش');
          btn.disabled = false;
          btn.textContent = action === 'start' ? 'شروع آماده‌سازی' : 'آماده تحویل';
        }
      } catch (err) {
        alert('خطا در ارتباط با سرور!');
        btn.disabled = false;
        btn.textContent = 'تلاش مجدد';
      }
    });
  }

  return card;
}

// مدیریت فیلتر تب‌ها
filterButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    filterButtons.forEach(btn => {
      btn.className = 'filter-btn px-5 py-2.5 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200';
    });
    e.currentTarget.className = 'filter-btn px-5 py-2.5 rounded-xl text-xs font-bold transition bg-amber-500 text-white shadow-md shadow-amber-500/20';

    currentFilter = e.currentTarget.getAttribute('data-filter');
    renderOrders();
  });
});

loadKitchenOrders();