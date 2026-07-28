import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formData, setFormData] = useState({ fullname: '', phone_number: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // اعتبارسنجی فرمت شماره موبایل ایران
  const isValidIranianPhone = (phone) => /^09\d{9}$/.test(phone);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // اعتبارسنجی فرانت‌اند
    if (!isValidIranianPhone(formData.phone_number)) {
      setError('شماره موبایل وارد شده معتبر نیست (مثال: 09121234567)');
      return;
    }

    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (!isLoginTab && !formData.fullname.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطایی در ارتباط با سرور رخ داد.');
      }

      // ذخیره توکن و اتمام احراز هویت
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* هدر مدال */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-4">
            <button
              onClick={() => { setIsLoginTab(true); setError(''); }}
              className={`pb-1 text-sm font-semibold transition-colors border-b-2 ${isLoginTab ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400'}`}
            >
              ورود
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setError(''); }}
              className={`pb-1 text-sm font-semibold transition-colors border-b-2 ${!isLoginTab ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400'}`}
            >
              ثبت‌نام مشتری
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                placeholder="مثال: علی رضایی"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">شماره همراه</label>
            <input
              type="tel"
              required
              dir="ltr"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="09120000000"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">رمز عبور</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#FF6B00] hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : isLoginTab ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
          </button>
        </form>

      </div>
    </div>
  );
}