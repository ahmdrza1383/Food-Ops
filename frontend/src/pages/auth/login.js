import { fetchAPI } from '../../services/api.js';

const loginForm = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const messageBox = document.getElementById('message-box');
const phoneInput = document.getElementById('phone_number');
const passwordInput = document.getElementById('password');

/**
 * نمایش پیام در باکس اعلان
 */
function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = `mb-6 p-4 rounded-3xl text-xs font-bold text-center transition block ${type === 'success'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
    }`;
  messageBox.classList.remove('hidden');
}

/**
 * پنهان کردن باکس پیام با شروع تایپ کاربر
 */
function hideMessageOnInput() {
  if (!messageBox.classList.contains('hidden')) {
    messageBox.classList.add('hidden');
  }
}

phoneInput.addEventListener('input', hideMessageOnInput);
passwordInput.addEventListener('input', hideMessageOnInput);

/**
 * مسیریابی کاربر بر اساس فیلد نام نقش (منطبق با ساختار جدید نقش‌ها)
 */
function redirectByRole(roleName) {
  const normalizedRole = String(roleName || 'customer').toLowerCase().trim();

  switch (normalizedRole) {
    case 'admin':
      window.location.href = '/src/pages/admin/dashboard.html';
      break;
    case 'kitchen staff':
      window.location.href = '/src/pages/kitchen/orders.html';
      break;
    case 'cashier':
      window.location.href = '/src/pages/cashier/orders.html';
      break;
    case 'customer':
    default:
      window.location.href = '/';
      break;
  }
}

/**
 * مدیریت رویداد ارسال فرم ورود
 */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageBox.classList.add('hidden');

  const phone_number = phoneInput.value.trim();
  const password = passwordInput.value;

  if (!phone_number || !password) {
    showMessage('لطفاً شماره موبایل و رمز عبور خود را وارد کنید.', 'error');
    return false;
  }

  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(phone_number.trim())) {
    showMessage('شماره موبایل وارد شده معتبر نیست.', 'error');
    return false;
  }

  // تغییر ظاهر دکمه
  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
  submitBtn.innerHTML = '<span>در حال بررسی...</span>';

  // ارسال درخواست API
  const response = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone_number, password })
  }).catch(err => {
    return { success: false, message: 'خطا در ارتباط با سرور!' };
  });

  // ----------------------------------------------------------------
  // ۱. بررسی ارور منطقی از سمت بک‌اند (success: false)
  // ----------------------------------------------------------------
  if (response && response.success === false) {

    // بازگرداندن دکمه به حالت اولیه
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    submitBtn.innerHTML = '<span>ورود به سیستم</span>';

    // نمایش پیام خطا (که روی صفحه می‌مونه تا کاربر اصلاح کنه)
    showMessage(response.message || 'اطلاعات وارد شده اشتباه است.', 'error');

    // انتخاب فیلد رمز عبور برای اصلاح سریع‌تر
    passwordInput.select();

  } else {
    // ----------------------------------------------------------------
    // ۲. در صورت موفقیت: استفاده از try/catch برای بقیه پردازش‌ها
    // ----------------------------------------------------------------
    try {
      const token = response.token;
      if (!token) throw new Error('توکنی دریافت نشد!');

      localStorage.setItem('token', token);

      let userData = response.data || {};
      let roleName = 'Customer';

      if (userData.role_id && typeof userData.role_id === 'object' && userData.role_id.name) {
        roleName = userData.role_id.name;
      } else {
        const meResponse = await fetchAPI('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          }
        });
        if (meResponse?.data?.role_id?.name) {
          roleName = meResponse.data.role_id.name;
          userData = meResponse.data;
        }
      }

      localStorage.setItem('user', JSON.stringify({
        ...userData,
        roleName: roleName
      }));

      showMessage('ورود موفقیت‌آمیز! در حال انتقال...', 'success');

      setTimeout(() => {
        redirectByRole(roleName);
      }, 1000);

    } catch (error) {
      // Catch برای خطاهای پیش‌بینی‌نشده در بخش else
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      submitBtn.innerHTML = '<span>ورود به سیستم</span>';

      showMessage('خطایی در پردازش اطلاعات رخ داد.', 'error');
    }
  }

  return false;
});