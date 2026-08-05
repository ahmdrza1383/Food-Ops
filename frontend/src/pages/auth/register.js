import { fetchAPI } from '../../services/api.js';

const registerForm = document.getElementById('register-form');
const submitBtn = document.getElementById('submit-btn');
const messageBox = document.getElementById('message-box');

function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = `mb-4 p-3 rounded-3xl text-sm font-medium text-center ${type === 'success'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`;
  messageBox.classList.remove('hidden');
}

function hideMessage() {
  messageBox.classList.add('hidden');
}

function setButtonLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>در حال ثبت‌نام...</span>
    `;
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    submitBtn.innerHTML = `<span>ثبت‌نام در سامانه</span>`;
  }
}

function validateForm(fullname, phone_number, password) {
  if (!fullname.trim() || !phone_number.trim() || !password) {
    showMessage('لطفاً تمامی فیلدها را پر کنید.', 'error');
    return false;
  }

  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(phone_number.trim())) {
    showMessage('شماره موبایل وارد شده معتبر نیست (مثال: 09102189822).', 'error');
    return false;
  }

  if (password.length < 6) {
    showMessage('رمز عبور باید حداقل شامل ۶ کاراکتر باشد.', 'error');
    return false;
  }

  return true;
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const fullname = document.getElementById('fullname').value;
  const phone_number = document.getElementById('phone_number').value;
  const password = document.getElementById('password').value;

  if (!validateForm(fullname, phone_number, password)) {
    return;
  }

  const payload = {
    fullname: fullname.trim(),
    phone_number: phone_number.trim(),
    password: password
  };

  try {
    setButtonLoading(true);

    const response = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const token =
      response?.token || response?.data?.token || response?.accessToken;
    const user =
      response?.user || response?.data?.user || response?.data;

    if (token) {
      localStorage.setItem('token', token);
      if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      showMessage('ثبت‌نام با موفقیت انجام شد! در حال ورود به سایت...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      showMessage('حساب کاربری با موفقیت ایجاد شد! لطفاً وارد حساب خود شوید...', 'success');
      setTimeout(() => {
        window.location.href = '/src/pages/auth/login.html';
      }, 1800);
    }

  } catch (error) {
    const errorMessage =
      error?.message || 'خطایی در ثبت‌نام رخ داد. لطفاً مجدداً تلاش کنید.';
    showMessage(errorMessage, 'error');
  } finally {
    setButtonLoading(false);
  }
});