import { fetchAPI } from './services/api.js';
import { formatPrice, showToast } from './utils/helpers.js';

let allMenuItems = [];
let categories = [];
let selectedCategoryId = null;
let searchQuery = '';
let cart = JSON.parse(localStorage.getItem('foodops_cart')) || [];

const menuGrid = document.getElementById('menu-grid');
const categoriesList = document.getElementById('categories-list');
const searchInput = document.getElementById('search-input');
const userMenu = document.getElementById('user-menu');

const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartPanel = document.getElementById('cart-panel');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadge = document.getElementById('cart-count');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const applyDiscountBtn = document.getElementById('apply-discount-btn');
const discountInput = document.getElementById('discount-input');
const discountRow = document.getElementById('discount-row');
const cartDiscountEl = document.getElementById('cart-discount');
let currentDiscount = null;

const foodModal = document.getElementById('food-modal');
const foodModalBackdrop = document.getElementById('food-modal-backdrop');
const foodModalContent = document.getElementById('food-modal-content');
const foodModalPanel = document.getElementById('food-modal-panel');

function getImageUrl(url) {
  const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
  if (!url) return defaultImage;
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
}

async function init() {
  setupUserHeader();
  setupCartDrawer();
  setupSearch();
  renderCart();

  await Promise.all([loadCategories(), loadMenuItems()]);
}

function setupUserHeader() {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user) {
    userMenu.innerHTML = `
            <div class="flex items-center gap-3">
                <a href="/src/pages/customer/my-orders.html" class="text-sm font-medium text-gray-700 hover:text-primary transition">
                   📋 سفارشات من
                </a>
                <span class="text-xs bg-orange-100 text-primary px-3 py-1.5 rounded-xl font-bold">
                    ${user.fullname}
                </span>
                <button id="logout-btn" class="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition">
                  <i class="fa-solid fa-arrow-right-from-bracket ml-1"></i> خروج
                </button>
            </div>
        `;

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('foodops_cart');
      showToast('با موفقیت خارج شدید');
      setTimeout(() => window.location.reload(), 1000);
    });
  }
}

async function loadCategories() {
  try {
    const response = await fetchAPI('/categories');
    categories = response.data?.categories || [];
    renderCategories();
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی‌ها:', error);
  }
}

function renderCategories() {
  categoriesList.innerHTML = `
        <button data-id="all" class="category-btn px-5 py-2.5 rounded-xl ${selectedCategoryId === null ? 'bg-primary text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'} font-medium text-sm whitespace-nowrap shadow-sm transition">
            همه غذاها
        </button>
    `;

  categories.forEach(cat => {
    if (!cat.is_active) return;
    const button = document.createElement('button');
    button.dataset.id = cat._id;
    button.className = `category-btn px-5 py-2.5 rounded-xl ${selectedCategoryId === cat._id ? 'bg-primary text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'} font-medium text-sm whitespace-nowrap shadow-sm transition`;
    button.textContent = cat.name;
    categoriesList.appendChild(button);
  });

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catId = e.target.dataset.id;
      selectedCategoryId = catId === 'all' ? null : catId;
      renderCategories();
      renderMenuItems();
    });
  });
}

async function loadMenuItems() {
  menuGrid.innerHTML = getSkeletonLoader();
  try {
    const response = await fetchAPI('/menu-items');
    allMenuItems = response.data?.menuItems || [];
    renderMenuItems();
  } catch (error) {
    menuGrid.innerHTML = `<div class="col-span-full text-center text-rose-500 py-10">خطا در دریافت منوی غذاها. لطفاً از اتصال سرور مطمئن شوید.</div>`;
  }
}

function renderMenuItems() {
  const filteredItems = allMenuItems.filter(item => {
    const category = categories.find(c => c._id === (item.category_id?._id || item.category_id));
    const isCategoryActive = !category || category.is_active;

    const matchesCategory = !selectedCategoryId || (item.category_id && (item.category_id._id === selectedCategoryId || item.category_id === selectedCategoryId));
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

    return isCategoryActive && matchesCategory && matchesSearch;
  });

  if (filteredItems.length === 0) {
    menuGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <span class="text-4xl block mb-2">🔍</span>
                <p>هیچ غذایی یافت نشد!</p>
            </div>
        `;
    return;
  }

  menuGrid.innerHTML = filteredItems.map(item => {
    const isOutOfStock = !item.status || item.stock_quantity <= 0;
    const finalImageUrl = getImageUrl(item.image_url);

    return `
            <div 
                data-id="${item._id}"
                class="food-card bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group cursor-pointer ${isOutOfStock ? 'opacity-60 bg-gray-50' : ''}"
            >
                <div class="relative h-44 overflow-hidden bg-gray-100">
                    <img src="${finalImageUrl}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 ${isOutOfStock ? 'grayscale' : ''}" />
                    ${isOutOfStock ? `<span class="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">ناموجود</span>` : ''}
                </div>
                
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="font-bold text-gray-800 text-lg mb-1">${item.name}</h3>
                    <p class="text-gray-500 text-xs line-clamp-2 mb-4 flex-grow">${item.description || 'توضیحاتی برای این غذا ثبت نشده است.'}</p>
                    
                    <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span class="font-extrabold text-slate-800 text-sm md:text-base">${formatPrice(item.price)}</span>
                        
                        <button 
                            data-id="${item._id}"
                            class="add-to-cart-btn px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1 ${isOutOfStock
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-orange-50 text-primary hover:bg-primary hover:text-white'
      }"
                            ${isOutOfStock ? 'disabled' : ''}
                        >
                            <span>+</span>
                            <span>افزودن</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }).join('');

  document.querySelectorAll('.food-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn')) return;
      const itemId = card.dataset.id;
      openFoodModal(itemId);
    });
  });

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = e.currentTarget.dataset.id;
      addToCart(itemId);
    });
  });
}

function openFoodModal(itemId) {
  const item = allMenuItems.find(i => i._id === itemId);
  if (!item) return;

  const isOutOfStock = !item.status || item.stock_quantity <= 0;
  const finalImageUrl = getImageUrl(item.image_url);

  foodModalContent.innerHTML = `
    <div class="relative h-60 bg-gray-100">
      <img src="${finalImageUrl}" alt="${item.name}" class="w-full h-full object-cover" />
      <button id="close-food-modal-btn" class="absolute top-4 left-4 bg-white/80 hover:bg-white text-gray-700 w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-md transition">✕</button>
      ${isOutOfStock ? `<span class="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">ناموجود</span>` : ''}
    </div>

    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-black text-slate-800">${item.name}</h2>
        <span class="text-lg font-extrabold text-primary">${formatPrice(item.price)}</span>
      </div>

      <div class="flex items-center gap-4 text-xs font-semibold text-gray-500 bg-gray-50 p-3 rounded-2xl">
        <span>⏱️ زمان پخت: ${item.estimated_prep_time || 15} دقیقه</span>
        <span>📦 موجودی: ${isOutOfStock ? '۰' : `${item.stock_quantity} عدد`}</span>
      </div>

      <div>
        <h4 class="text-xs font-bold text-gray-400 uppercase mb-1">توضیحات غذا</h4>
        <p class="text-gray-600 text-sm leading-relaxed">${item.description || 'توضیحات تکمیلی برای این غذا ثبت نشده است.'}</p>
      </div>

      <div class="pt-4 border-t">
        <button 
          id="modal-add-to-cart-btn"
          class="w-full py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg ${isOutOfStock
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-primary text-white hover:bg-primary-hover shadow-orange-500/20'
    }"
          ${isOutOfStock ? 'disabled' : ''}
        >
          <span>+ افزودن به سبد خرید</span>
        </button>
      </div>
    </div>
  `;

  foodModal.classList.remove('opacity-0', 'pointer-events-none');
  foodModalPanel.classList.remove('scale-95');
  foodModalPanel.classList.add('scale-100');

  document.getElementById('close-food-modal-btn')?.addEventListener('click', closeFoodModal);

  document.getElementById('modal-add-to-cart-btn')?.addEventListener('click', () => {
    addToCart(itemId);
    closeFoodModal();
  });
}

function closeFoodModal() {
  foodModalPanel.classList.remove('scale-100');
  foodModalPanel.classList.add('scale-95');
  foodModal.classList.add('opacity-0');
  setTimeout(() => {
    foodModal.classList.add('pointer-events-none');
  }, 300);
}

foodModalBackdrop?.addEventListener('click', closeFoodModal);

function addToCart(itemId) {
  const item = allMenuItems.find(i => i._id === itemId);
  if (!item) return;

  const existingIndex = cart.findIndex(c => c.id === itemId);

  if (existingIndex > -1) {
    if (cart[existingIndex].quantity < item.stock_quantity) {
      cart[existingIndex].quantity += 1;
      showToast(`تعداد ${item.name} افزایش یافت`);
    } else {
      showToast('حداکثر موجودی این غذا انتخاب شده است', 'error');
      return;
    }
  } else {
    cart.push({
      id: item._id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: 1,
      maxStock: item.stock_quantity
    });
    showToast(`${item.name} به سبد خرید اضافه شد`);
  }
  saveCart();
  renderCart();
}

function updateQuantity(itemId, delta) {
  const itemIndex = cart.findIndex(c => c.id === itemId);
  if (itemIndex === -1) return;

  const cartItem = cart[itemIndex];

  if (delta > 0) {
    if (cartItem.quantity >= cartItem.maxStock) {
      showToast('حداکثر موجودی این غذا انتخاب شده است', 'error');
      return;
    }
  }

  cartItem.quantity += delta;

  if (cartItem.quantity <= 0) {
    cart.splice(itemIndex, 1);
  }

  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('foodops_cart', JSON.stringify(cart));
}

if (applyDiscountBtn) {
  applyDiscountBtn.addEventListener('click', async () => {
    const code = discountInput.value.trim();
    if (!code) {
      showToast('لطفاً کد تخفیف را وارد کنید', 'error');
      return;
    }
    try {
      const response = await fetchAPI('/orders/validate-discount', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      currentDiscount = {
        code: response.data.code,
        percent: response.data.discount_percent
      };
      showToast(`تخفیف ٪${currentDiscount.percent} با موفقیت اعمال شد`, 'success');
      renderCart();
    } catch (error) {
      showToast(error.message || 'کد تخفیف نامعتبر است', 'error');
      currentDiscount = null;
      renderCart();
    }
  });
}

function renderCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.textContent = new Intl.NumberFormat('fa-IR').format(totalCount);

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
            <div class="text-center py-16 text-gray-400 flex flex-col items-center">
                <span class="text-5xl mb-3">🛒</span>
                <p class="font-medium text-sm">سبد خرید شما خالی است</p>
            </div>
        `;
    cartSubtotalEl.textContent = '۰ تومان';
    cartTotalEl.textContent = '۰ تومان';
    if (discountRow) discountRow.classList.add('hidden');
    currentDiscount = null;
    if (discountInput) discountInput.value = '';
    return;
  }

  let subtotal = 0;

  cartItemsContainer.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    const finalImageUrl = getImageUrl(item.image_url);

    return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3">
                    <img src="${finalImageUrl}" class="w-12 h-12 rounded-xl object-cover" />
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                        <span class="text-xs text-gray-500">${formatPrice(item.price)}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border">
                    <button data-id="${item.id}" data-action="decrease" class="cart-qty-btn text-gray-500 hover:text-rose-500 font-bold w-6 h-6 flex items-center justify-center">-</button>
                    <span class="text-xs font-bold w-4 text-center">${new Intl.NumberFormat('fa-IR').format(item.quantity)}</span>
                    <button data-id="${item.id}" data-action="increase" class="cart-qty-btn text-gray-500 hover:text-emerald-500 font-bold w-6 h-6 flex items-center justify-center">+</button>
                </div>
            </div>
        `;
  }).join('');

  cartSubtotalEl.textContent = formatPrice(subtotal);

  let finalPrice = subtotal;

  if (currentDiscount) {
    const discountAmount = (subtotal * currentDiscount.percent) / 100;
    finalPrice = subtotal - discountAmount;
    if (discountRow) {
      discountRow.classList.remove('hidden');
      cartDiscountEl.textContent = formatPrice(discountAmount);
    }
  } else {
    if (discountRow) discountRow.classList.add('hidden');
  }

  cartTotalEl.textContent = formatPrice(finalPrice);

  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      updateQuantity(id, action === 'increase' ? 1 : -1);
    });
  });
}

checkoutBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error');
    setTimeout(() => window.location.href = '/src/pages/auth/login.html', 1500);
    return;
  }
  if (cart.length === 0) {
    showToast('سبد خرید شما خالی است', 'error');
    return;
  }

  const orderPayload = {
    items: cart.map(item => ({
      menu_item_id: item.id,
      quantity: item.quantity
    })),
    discount_code: currentDiscount ? currentDiscount.code : null
  };

  try {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'در حال ثبت...';
    await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
    showToast('سفارش شما با موفقیت ثبت شد 🎉');

    cart = [];
    currentDiscount = null;
    if (discountInput) discountInput.value = '';

    saveCart();
    renderCart();
    toggleCartDrawer(false);

    setTimeout(() => window.location.href = '/src/pages/customer/my-orders.html', 1500);
  } catch (error) {
    showToast(error.message || 'خطا در ثبت سفارش', 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'ثبت نهایی سفارش';
  }
});

function setupCartDrawer() {
  cartBtn?.addEventListener('click', () => toggleCartDrawer(true));
  closeCartBtn?.addEventListener('click', () => toggleCartDrawer(false));
  cartBackdrop?.addEventListener('click', () => toggleCartDrawer(false));
}

function toggleCartDrawer(open) {
  if (open) {
    cartDrawer.classList.remove('opacity-0', 'pointer-events-none');
    cartPanel.classList.remove('-translate-x-full');
    cartPanel.classList.add('translate-x-0');
  } else {
    cartPanel.classList.remove('translate-x-0');
    cartPanel.classList.add('-translate-x-full');
    cartDrawer.classList.add('opacity-0');
    setTimeout(() => cartDrawer.classList.add('pointer-events-none'), 300);
  }
}

function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderMenuItems();
  });
}

function getSkeletonLoader() {
  return Array(6).fill(0).map(() => `
        <div class="bg-white rounded-2xl p-4 border animate-pulse space-y-4">
            <div class="bg-gray-200 h-40 rounded-xl"></div>
            <div class="bg-gray-200 h-4 w-3/4 rounded-lg"></div>
            <div class="bg-gray-200 h-3 w-full rounded-lg"></div>
            <div class="flex justify-between items-center pt-2">
                <div class="bg-gray-200 h-5 w-20 rounded-lg"></div>
                <div class="bg-gray-200 h-8 w-24 rounded-xl"></div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', init);