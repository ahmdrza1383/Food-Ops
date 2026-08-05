import { fetchAPI } from '../../services/api.js';
import { showToast } from '../../utils/helpers.js';

const logoutBtn = document.getElementById('logout-btn');
const tableBody = document.getElementById('discounts-table-body');
const emptyState = document.getElementById('empty-state');
const modal = document.getElementById('discount-modal');
const modalPanel = document.getElementById('modal-panel');
const closeModalBtn = document.getElementById('close-modal-btn');
const addBtn = document.getElementById('add-discount-btn');
const form = document.getElementById('discount-form');

jalaliDatepicker.startWatch({
    minDate: "today",
    time: false,
    hideAfterChange: true
});

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/src/pages/auth/login.html';
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/src/pages/auth/login.html';
});

function openModal() {
    form.reset();
    document.getElementById('discount-active').checked = true;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalPanel.classList.remove('scale-95');
    modalPanel.classList.add('scale-100');
}

function closeModal() {
    modalPanel.classList.remove('scale-100');
    modalPanel.classList.add('scale-95');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('pointer-events-none'), 300);
}

addBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

async function loadDiscounts() {
    try {
        const response = await fetchAPI('/admin/discounts');
        const discounts = response.data?.discounts || [];

        if (discounts.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        tableBody.innerHTML = discounts.map(discount => {
            const expireDate = new Date(discount.expiration_date).toLocaleDateString('fa-IR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const statusBadge = discount.is_active 
                ? `<button data-id="${discount._id}" data-status="true" class="toggle-status-btn bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 transition" title="کلیک برای غیرفعال کردن">فعال</button>`
                : `<button data-id="${discount._id}" data-status="false" class="toggle-status-btn bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 transition" title="کلیک برای فعال کردن">غیرفعال</button>`;

            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-6 py-4 font-black text-amber-600 dir-ltr text-center">${discount.code}</td>
                    <td class="px-6 py-4 font-bold text-slate-700 text-center">٪${discount.discount_percent}</td>
                    <td class="px-6 py-4 text-slate-600 font-medium text-center">${expireDate}</td>
                    <td class="px-6 py-4 text-center">${statusBadge}</td>
                    <td class="px-6 py-4 text-center">
                        <button data-id="${discount._id}" class="delete-btn text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition" title="حذف کد">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        attachDeleteEvents();
        attachToggleEvents();
    } catch (error) {
        showToast('خطا در دریافت کدهای تخفیف', 'error');
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('discount-code').value.trim().toUpperCase();
    const percent = parseInt(document.getElementById('discount-percent').value);
    const expireJalali = document.getElementById('discount-expire').value;
    const isActive = document.getElementById('discount-active').checked;

    if (!code || !percent || !expireJalali) {
        showToast('لطفا تمامی فیلدها را پر کنید.', 'error');
        return;
    }

    const [jYear, jMonth, jDay] = expireJalali.split('/').map(Number);
    const gregorian = jalaali.toGregorian(jYear, jMonth, jDay);
    const expireIsoDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd, 23, 59, 59).toISOString();

    const payload = {
        code: code,
        discount_percent: percent,
        expiration_date: expireIsoDate,
        is_active: isActive
    };

    try {
        await fetchAPI('/admin/discounts', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        showToast('کد تخفیف با موفقیت ایجاد شد.', 'success');
        closeModal();
        loadDiscounts();
    } catch (error) {
        showToast(error.message || 'خطا در ایجاد کد تخفیف', 'error');
    }
});

function attachToggleEvents() {
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const currentStatus = e.currentTarget.getAttribute('data-status') === 'true';
            
            try {
                await fetchAPI(`/admin/discounts/${id}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ is_active: !currentStatus })
                });
                
                showToast('وضعیت کد تخفیف بروزرسانی شد.', 'success');
                loadDiscounts();
            } catch (error) {
                showToast(error.message || 'خطا در تغییر وضعیت کد تخفیف', 'error');
            }
        });
    });
}

function attachDeleteEvents() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('آیا از حذف این کد تخفیف اطمینان دارید؟')) return;
            
            const id = e.currentTarget.getAttribute('data-id');
            try {
                await fetchAPI(`/admin/discounts/${id}`, {
                    method: 'DELETE'
                });
                showToast('کد تخفیف حذف شد.', 'success');
                loadDiscounts();
            } catch (error) {
                showToast(error.message || 'خطا در حذف کد تخفیف', 'error');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', loadDiscounts);