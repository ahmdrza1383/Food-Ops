import { fetchAPI } from '../../services/api.js';

// عناصر DOM
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorBox = document.getElementById('error-box');
const ordersContainer = document.getElementById('orders-container');
const actionMessage = document.getElementById('action-message');

// تغییر رنگ "آماده تحویل" به بنفش متمایز (Purple) و حفظ رنگ‌های دیگر
const STATUS_CONFIG = {
  registered: {
    title: 'ثبت‌ شده',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    cardBg: 'bg-amber-50/40 border-amber-200'
  },
  preparing: {
    title: 'در حال آماده سازی',
    classes: 'bg-blue-100 text-blue-800 border-blue-300',
    cardBg: 'bg-blue-50/40 border-blue-200'
  },
  ready_for_delivery: {
    title: 'آماده تحویل',
    classes: 'bg-purple-100 text-purple-800 border-purple-300',
    cardBg: 'bg-purple-50/40 border-purple-200'
  },
  delivered: {
    title: 'تحویل شده',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardBg: 'bg-emerald-50/40 border-emerald-200'
  },
  canceled: {
    title: 'لغو شده',
    classes: 'bg-rose-100 text-rose-800 border-rose-300',
    cardBg: 'bg-rose-50/40 border-rose-200'
  }
};

/**
 * بررسی دسترسی و توکن کاربر
 */
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/src/pages/auth/login.html';
    return null;
  }
  return token;
}

/**
 * نمایش پیام عملیات (لغو سفارش)
 */
function showActionMessage(text, type = 'success') {
  actionMessage.textContent = text;
  actionMessage.className = `mb-6 p-4 rounded-xl text-sm font-medium text-center transition ${
    type === 'success'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-rose-50 text-rose-700 border border-rose-200'
  }`;
  actionMessage.classList.remove('hidden');

  setTimeout(() => {
    actionMessage.classList.add('hidden');
  }, 4000);
}

/**
 * فرمت کردن تاریخ میلادی به تاریخ و ساعت خوانای فارسی
 */
function formatPersianDate(dateString) {
  if (!dateString) return '---';
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('fa-IR', options);
}

/**
 * فرمت کردن قیمت به تومان
 */
function formatPrice(price = 0) {
  return Number(price || 0).toLocaleString('fa-IR') + ' تومان';
}

/**
 * محاسبه زمان تقریبی آماده‌سازی: Max(prep_time) + 5
 * برای وضعیت‌های delivered و canceled نمایش داده نمی‌شود.
 */
function getEstimatedPrepTime(order) {
  const status = order.status;

  if (status === 'delivered' || status === 'canceled') {
    return null;
  }

  const items = order.items || [];
  if (!items.length) return null;

  const maxPrepTime = Math.max(
    ...items.map(item => item.menu_item_id?.prep_time || 15)
  );

  const totalEstimatedTime = maxPrepTime + 5;
  return `${totalEstimatedTime} دقیقه`;
}

/**
 * ساخت HTML یک کارت سفارش
 */
function createOrderCard(order) {
  const statusInfo =
    STATUS_CONFIG[order.status] || {
      title: order.status || 'نامشخص',
      classes: 'bg-slate-100 text-slate-800 border-slate-300',
      cardBg: 'bg-white border-slate-200'
    };

  const prepTimeText = getEstimatedPrepTime(order);

  const itemsHTML = (order.items || [])
    .map(item => {
      const foodName = item.menu_item_id?.name || 'آیتم غذایی';
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const totalPrice = unitPrice * quantity;

      return `
        <div class="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0 text-sm">
          <div class="flex items-center gap-2">
            <span class="font-bold text-amber-600 bg-white px-2 py-0.5 rounded-lg text-xs shadow-xs border border-slate-200/60">× ${quantity}</span>
            <span class="font-medium text-slate-700">${foodName}</span>
          </div>
          <span class="text-slate-600 font-semibold">${formatPrice(totalPrice)}</span>
        </div>
      `;
    })
    .join('');

  const cancelButtonHTML =
    order.status === 'registered'
      ? `
        <button
          type="button"
          data-id="${order._id}"
          class="cancel-order-btn px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <span>لغو سفارش</span>
        </button>
      `
      : '';

  return `
    <div class="rounded-2xl border p-6 shadow-sm hover:shadow-md transition ${statusInfo.cardBg}">
      
      <!-- هدر کارت سفارش -->
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.classes}">
            ${statusInfo.title}
          </span>
        </div>

        ${
          prepTimeText
            ? `
        <div class="text-xs md:text-sm">
          <span class="text-slate-400 ml-1">زمان تقریبی آماده‌سازی:</span>
          <span class="font-bold text-amber-600">${prepTimeText}</span>
        </div>
        `
            : ''
        }
      </div>

      <!-- تاریخ ثبت سفارش -->
      <div class="bg-white/70 border border-slate-200/60 p-3 rounded-xl mb-4 text-xs text-slate-600 font-medium">
        <span class="text-slate-400 ml-1">تاریخ و زمان ثبت:</span>
        <span>${formatPersianDate(order.createdAt)}</span>
      </div>

      <!-- ریزسفارش‌ها -->
      <div class="mb-4">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ریز سفارش‌ها</h4>
        <div class="bg-white/80 rounded-xl p-3 border border-slate-200/60">
          ${itemsHTML}
        </div>
      </div>

      <!-- فوتر کارت: جمع کل سفارش + دکمه لغو در وضعیت registered -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-slate-200/80">
        <div>
          <span class="text-sm font-bold text-slate-800 ml-2">مبلغ کل سفارش:</span>
          <span class="text-lg font-black text-amber-600">${formatPrice(order.final_price || order.total_price)}</span>
        </div>
        ${cancelButtonHTML}
      </div>

    </div>
  `;
}

/**
 * ارسال درخواست لغو سفارش با متد PATCH
 */
async function handleCancelOrder(orderId, buttonElement) {
  const token = checkAuth();
  if (!token) return;

  if (!confirm('آیا از لغو این سفارش اطمینان دارید؟')) {
    return;
  }

  try {
    buttonElement.disabled = true;
    buttonElement.classList.add('opacity-50', 'cursor-not-allowed');
    buttonElement.textContent = 'در حال لغو...';

    await fetchAPI(`/orders/${orderId}/cancel`, {
      method: 'PATCH'
    });

    showActionMessage('سفارش شما با موفقیت لغو شد.', 'success');
    await loadOrders();
  } catch (error) {
    buttonElement.disabled = false;
    buttonElement.classList.remove('opacity-50', 'cursor-not-allowed');
    buttonElement.textContent = 'لغو سفارش';
    showActionMessage(error?.message || 'خطایی در لغو سفارش رخ داد.', 'error');
  }
}

/**
 * دریافت لیست سفارش‌ها از سرور
 */
async function loadOrders() {
  const token = checkAuth();
  if (!token) return;

  try {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorBox.classList.add('hidden');

    const response = await fetchAPI('/orders/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      }
    });

    const rawOrders =
      response?.orders ||
      response?.data?.orders ||
      response?.data ||
      response;

    const orders = Array.isArray(rawOrders) ? rawOrders : [];

    loadingState.classList.add('hidden');

    if (orders.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    ordersContainer.innerHTML = orders.map(order => createOrderCard(order)).join('');

  } catch (error) {
    loadingState.classList.add('hidden');
    errorBox.textContent = error?.message || 'خطایی در دریافت لیست سفارش‌ها رخ داد.';
    errorBox.classList.remove('hidden');
  }
}

ordersContainer.addEventListener('click', (e) => {
  const cancelBtn = e.target.closest('.cancel-order-btn');
  if (cancelBtn) {
    const orderId = cancelBtn.getAttribute('data-id');
    handleCancelOrder(orderId, cancelBtn);
  }
});

document.addEventListener('DOMContentLoaded', loadOrders);