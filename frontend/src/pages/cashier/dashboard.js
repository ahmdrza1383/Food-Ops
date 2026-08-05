// frontend/src/pages/delivery/dashboard.js
import { fetchAPI } from '../../services/api.js';
import { formatPrice } from '../../utils/helpers.js'; 

const ordersContainer = document.getElementById('orders-container');
const messageContainer = document.getElementById('message-container');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const searchInput = document.getElementById('search-orders'); 

let cashierOrders = [];
let searchQuery = ''; 

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token) {
  window.location.href = '/src/pages/auth/login.html';
} else if (userStr) {
  try {
    const user = JSON.parse(userStr);
    userNameSpan.textContent = user.fullname || 'صندوق‌دار';
  } catch (e) {}
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/src/pages/auth/login.html';
});

/**
 * دریافت لیست سفارش‌های آماده تحویل از سرور
 */
async function loadCashierOrders() {
  messageContainer.textContent = 'در حال بارگذاری سفارشات...';
  messageContainer.classList.remove('hidden');
  ordersContainer.innerHTML = '';

  try {
    const response = await fetchAPI('/delivery/orders');
    
    if (response && response.status === 'success') {
      cashierOrders = response.data?.orders || [];
      
      // مرتب‌سازی بر اساس زمان: قدیمی‌ترین بالا (FIFO)
      cashierOrders.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

      renderOrders(); // با رندر کردن دوباره، جستجو هم اعمال می‌شود
    } else {
      messageContainer.textContent = response.message || 'خطا در دریافت سفارشات.';
    }
  } catch (error) {
    messageContainer.textContent = 'خطا در ارتباط با سرور!';
  }
}

/**
 * 👇 اضافه شدن رویداد جستجو
 */
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderOrders(); // با هر بار تایپ کاربر، لیست فیلتر و دوباره رندر می‌شود
});

/**
 * رندر کارت‌های سفارش صندوق‌داری با اعمال فیلتر جستجو
 */
function renderOrders() {
  // اعمال فیلتر روی لیست اصلی
  let filteredOrders = cashierOrders;

  if (searchQuery) {
    filteredOrders = cashierOrders.filter(order => {
      const phone = order.customer_id?.phone_number?.toLowerCase() || '';
      const id = order._id?.toLowerCase() || '';
      return id.includes(searchQuery) || phone.includes(searchQuery);
    });
  }

  // بررسی اینکه آیا لیست فیلتر شده خالی است یا خیر
  if (filteredOrders.length === 0) {
    messageContainer.textContent = searchQuery 
      ? 'هیچ سفارشی با این مشخصات یافت نشد.' 
      : 'هیچ سفارشی جهت تحویل وجود ندارد.';
    messageContainer.classList.remove('hidden');
    ordersContainer.innerHTML = '';
    return;
  }

  messageContainer.classList.add('hidden');
  ordersContainer.innerHTML = '';

  // اینجا به جای cashierOrders، از filteredOrders استفاده می‌کنیم
  filteredOrders.forEach(order => {
    const card = createOrderCard(order);
    ordersContainer.appendChild(card);
  });
}

function createOrderCard(order) {
  const card = document.createElement('div');
  
  const cardBg = 'bg-purple-50/40 border-purple-200';
  card.className = `rounded-2xl border p-6 shadow-sm hover:shadow-md transition ${cardBg}`;

  const statusTitle = 'آماده تحویل';
  const statusClasses = 'bg-purple-100 text-purple-800 border-purple-300';

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

  const actionButtonHtml = `
    <button data-id="${orderId}" class="deliver-btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-purple-600/20 flex items-center gap-1.5">
      <span>به مشتری تحویل داده شد</span> <i class="fa-solid fa-check-double"></i>
    </button>
  `;

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
          <span class="font-bold text-purple-600 bg-white px-2 py-0.5 rounded-lg text-xs shadow-xs border border-slate-200/60">${quantity} عدد</span>
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
        <span class="px-3 py-1.5 rounded-full text-xs font-bold border ${statusClasses}">
          ${statusTitle}
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
      <span class="text-lg font-black text-purple-600">${formatPrice(order.total_price)}</span>
    </div>
  `;

  const btn = card.querySelector('.deliver-btn');
  if (btn) {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      
      btn.disabled = true;
      btn.textContent = 'در حال ثبت تحویل...';

      try {
        const res = await fetchAPI(`/orders/${id}/deliver`, {
          method: 'PATCH'
        });

        if (res && res.status === 'success') {
          loadCashierOrders();
        } else {
          alert(res.message || 'خطا در ثبت تحویل سفارش');
          btn.disabled = false;
          btn.textContent = 'به مشتری تحویل داده شد';
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

loadCashierOrders();