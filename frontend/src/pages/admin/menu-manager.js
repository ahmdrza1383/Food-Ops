import { fetchAPI } from '../../services/api.js';
import { formatPrice, showToast } from '../../utils/helpers.js';

// --- عناصر DOM ---
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');

const categoriesContainer = document.getElementById('categories-container');
const menuItemsGrid = document.getElementById('menu-items-grid');

const modal = document.getElementById('admin-modal');
const modalPanel = document.getElementById('modal-panel');
const modalTitle = document.getElementById('modal-title');
const closeModalBtn = document.getElementById('close-modal-btn');
const adminForm = document.getElementById('admin-form');

// فیلدهای فرم
const formId = document.getElementById('form-id');
const formType = document.getElementById('form-type');
const catName = document.getElementById('cat-name');
const catActive = document.getElementById('cat-active');
const menuName = document.getElementById('menu-name');
const menuDesc = document.getElementById('menu-desc');
const menuPrice = document.getElementById('menu-price');
const menuStock = document.getElementById('menu-stock');
const menuCategory = document.getElementById('menu-category');
const menuImage = document.getElementById('menu-image');
const menuImageFile = document.getElementById('menu-image-file');
const imagePreview = document.getElementById('image-preview');
const menuActive = document.getElementById('menu-active');
const categoryFields = document.getElementById('category-fields');
const menuFields = document.getElementById('menu-fields');

// --- تابع کمکی برای آدرس عکس (دیتابیس یا دیفالت) ---
function getImageUrl(url) {
    const defaultImage = '/food-sample.jpeg'; // عکس دیفالت پنل ادمین
    if (!url) return defaultImage; // اگر عکسی در دیتابیس نبود
    if (url.startsWith('http')) return url; // اگر آدرس کامل بود
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`; // اگر فایل روی سرور لوکال بود
}

// --- احراز هویت ---
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token) {
    window.location.href = '/src/pages/auth/login.html';
} else if (userStr) {
    try {
        const user = JSON.parse(userStr);
        userNameSpan.textContent = user.fullname || 'admin';
        const role = (user.roleName || '').toLowerCase();
        if (role !== 'admin') {
            window.location.href = '/';
        }
    } catch (e) { }
}

logoutBtn.addEventListener('click', () => {
    closeModal();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/src/pages/auth/login.html';
});

// --- مدیریت مودال ---
function openModal(title, type, data = null) {
    modalTitle.textContent = title;
    formType.value = type;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalPanel.classList.remove('scale-95');
    modalPanel.classList.add('scale-100');

    if (type === 'category') {
        categoryFields.classList.remove('hidden');
        menuFields.classList.add('hidden');
        formId.value = data?._id || data?.id || '';
        catName.value = data?.name || '';
        catActive.checked = data?.is_active !== false;
    } else if (type === 'menu') {
        categoryFields.classList.add('hidden');
        menuFields.classList.remove('hidden');
        formId.value = data?._id || data?.id || '';
        menuName.value = data?.name || '';
        menuDesc.value = data?.description || '';
        menuPrice.value = data?.price || '';
        menuStock.value = data?.stock_quantity || 10;
        
        const imageUrl = data?.image_url || '';
        menuImage.value = imageUrl;
        menuImageFile.value = '';

        if (imageUrl) {
            imagePreview.src = getImageUrl(imageUrl);
            imagePreview.classList.remove('hidden');
        } else {
            imagePreview.classList.add('hidden');
        }

        menuActive.checked = data?.status !== false;

        const categoryId = data?.category_id?._id || data?.category_id;
        if (categoryId) {
            menuCategory.value = categoryId;
        }
    }
}

function closeModal() {
    modalPanel.classList.remove('scale-100');
    modalPanel.classList.add('scale-95');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('pointer-events-none'), 300);
}

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

menuImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.classList.add('hidden');
    }
});

menuImage.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url && !menuImageFile.files[0]) {
        imagePreview.src = url;
        imagePreview.classList.remove('hidden');
    } else if (!url) {
        imagePreview.classList.add('hidden');
    }
});

// --- لود کردن اطلاعات ---
async function loadCategories() {
    try {
        const response = await fetchAPI('/categories');
        const categories = response.data?.categories || [];

        menuCategory.innerHTML = categories.map(cat => `
            <option value="${cat._id}">${cat.name}</option>
        `).join('');

        categoriesContainer.innerHTML = categories.map(cat => `
            <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                <span>${cat.name}</span>
                <button data-id="${cat._id}" class="edit-cat-btn text-amber-600 hover:text-amber-800 transition">✎</button>
                <button data-id="${cat._id}" class="delete-cat-btn text-rose-500 hover:text-rose-700 transition">✕</button>
            </div>
        `).join('');

        attachCategoryEvents();
    } catch (error) {
        showToast("خطا در لود دسته‌بندی‌ها", 'error');
    }
}

async function loadMenuItems() {
    try {
        const response = await fetchAPI('/menu-items');
        const items = response.data?.menuItems || [];

        menuItemsGrid.innerHTML = items.map(item => {
            const isActive = item.status !== false;
            
            // استفاده از تابع بررسی عکس دیتابیس یا دیفالت
            const finalImageUrl = getImageUrl(item.image_url);

            return `
                <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2 relative ${!isActive ? 'opacity-60 grayscale' : ''}">
                    <div class="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100">
                        <img 
                            src="${finalImageUrl}" 
                            class="w-full h-full object-cover transition duration-300 hover:scale-105" 
                            onerror="this.src='/food-sample.jpeg'" 
                        />
                    </div>
                    
                    <div>
                        <h4 class="font-bold text-sm text-slate-800">${item.name}</h4>
                        <p class="text-xs text-slate-500 truncate">${item.description || ''}</p>
                    </div>
                    <div class="flex items-center justify-between border-t pt-2 mt-1">
                        <span class="text-sm font-bold text-amber-600">${formatPrice(item.price)}</span>
                        <span class="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">موجودی: ${item.stock_quantity}</span>
                    </div>
                    <div class="flex justify-end gap-1 mt-1">
                        <button data-id="${item._id}" class="edit-menu-btn text-xs text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg">ویرایش</button>
                        <button data-id="${item._id}" class="delete-menu-btn text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg">حذف</button>
                    </div>
                </div>
            `;
        }).join('');

        attachMenuEvents();
    } catch (error) {
        console.error("خطا در لود منو", error);
    }
}

// --- رویدادهای دکمه‌ها (Add) ---
document.getElementById('add-category-btn').addEventListener('click', () => openModal('افزودن دسته‌بندی جدید', 'category'));
document.getElementById('add-menu-btn').addEventListener('click', async () => {
    await loadCategories();
    openModal('افزودن غذای جدید', 'menu');
});

// --- مدیریت Submit فرم ---
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = formType.value;
    const id = formId.value;
    const isEdit = !!id;

    let payload = {};
    let endpoint = '';
    let method = 'POST';

    if (type === 'category') {
        if (!catName.value.trim()) {
            showToast('لطفاً نام دسته‌بندی را وارد کنید.', 'error');
            catName.focus();
            return;
        }
        payload = { name: catName.value.trim(), is_active: catActive.checked };
        endpoint = '/categories';
        if (isEdit) { method = 'PATCH'; endpoint = `/categories/${id}`; }

    } else if (type === 'menu') {
        if (!menuName.value.trim()) {
            showToast('لطفاً نام غذا را وارد کنید.', 'error');
            menuName.focus();
            return;
        }
        if (!menuPrice.value || Number(menuPrice.value) <= 0) {
            showToast('لطفاً قیمت معتبر وارد کنید.', 'error');
            menuPrice.focus();
            return;
        }
        if (!menuCategory.value) {
            showToast('لطفاً یک دسته‌بندی انتخاب کنید.', 'error');
            menuCategory.focus();
            return;
        }

        const formData = new FormData();
        formData.append('name', menuName.value.trim());
        formData.append('description', menuDesc.value.trim());
        formData.append('price', Number(menuPrice.value));
        formData.append('stock_quantity', Number(menuStock.value));
        formData.append('category_id', menuCategory.value);
        formData.append('status', menuActive.checked);

        if (menuImageFile.files[0]) {
            formData.append('image', menuImageFile.files[0]);
        } else if (menuImage.value.trim()) {
            formData.append('image_url', menuImage.value.trim());
        }

        payload = formData;
        endpoint = '/menu-items';
        if (isEdit) { method = 'PATCH'; endpoint = `/menu-items/${id}`; }
    }

    try {
        await fetchAPI(endpoint, {
            method,
            body: payload,
            headers: type === 'menu' ? {} : undefined
        });
        closeModal();
        showToast('عملیات با موفقیت انجام شد.', 'success');
        loadCategories();
        loadMenuItems();
    } catch (error) {
        showToast(error.message || 'خطا در ذخیره اطلاعات.', 'error');
    }
});

function attachCategoryEvents() {
    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
                const res = await fetchAPI(`/categories/${id}`);
                const cat = res.data.category;
                openModal('ویرایش دسته‌بندی', 'category', cat);
            } catch (err) { showToast("خطا در دریافت اطلاعات", 'error'); }
        });
    });

    document.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
            const id = e.target.dataset.id;
            try {
                await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
                loadCategories();
            } catch (error) { showToast(error.message || 'خطا در حذف', 'error'); }
        });
    });
}

function attachMenuEvents() {
    document.querySelectorAll('.edit-menu-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
                const res = await fetchAPI(`/menu-items/${id}`);
                const item = res.data.menuItem;
                await loadCategories();
                openModal('ویرایش غذا', 'menu', item);
            } catch (err) { showToast("خطا در دریافت اطلاعات", 'error'); }
        });
    });

    document.querySelectorAll('.delete-menu-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('آیا از حذف این غذا اطمینان دارید؟')) return;
            const id = e.target.dataset.id;
            try {
                await fetchAPI(`/menu-items/${id}`, { method: 'DELETE' });
                loadMenuItems();
            } catch (error) { showToast(error.message || 'خطا در حذف', 'error'); }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadMenuItems();
});