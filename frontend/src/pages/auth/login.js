import { fetchAPI } from '../../services/api.js';

const loginForm = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const messageBox = document.getElementById('message-box');
const phoneInput = document.getElementById('phone_number');
const passwordInput = document.getElementById('password');

function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = `mb-6 p-4 rounded-3xl text-xs font-bold text-center transition block ${type === 'success'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
    }`;
  messageBox.classList.remove('hidden');
}

function hideMessageOnInput() {
  if (!messageBox.classList.contains('hidden')) {
    messageBox.classList.add('hidden');
  }
}

phoneInput.addEventListener('input', hideMessageOnInput);
passwordInput.addEventListener('input', hideMessageOnInput);

function redirectByRole(roleName) {
  const normalizedRole = String(roleName || 'customer').toLowerCase().trim();

  switch (normalizedRole) {
    case 'admin':
      window.location.href = '/src/pages/admin/menu-manager.html';
      break;
    case 'kitchen staff':
      window.location.href = '/src/pages/kitchen/dashboard.html';
      break;
    case 'cashier':
      window.location.href = '/src/pages/cashier/dashboard.html';
      break;
    case 'customer':
    default:
      window.location.href = '/';
      break;
  }
}

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

  submitBtn.disabled = true;
  submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
  submitBtn.innerHTML = '<span>در حال بررسی...</span>';

  const response = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone_number, password })
  }).catch(err => {
    return { success: false, message: 'خطا در ارتباط با سرور!' };
  });

  if (response && response.success === false) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    submitBtn.innerHTML = '<span>ورود به سیستم</span>';

    showMessage(response.message || 'اطلاعات وارد شده اشتباه است.', 'error');

    passwordInput.select();

  } else {
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
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      submitBtn.innerHTML = '<span>ورود به سیستم</span>';

      showMessage('خطایی در پردازش اطلاعات رخ داد.', 'error');
    }
  }

  return false;
});