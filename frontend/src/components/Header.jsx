import React from 'react';
import { ShoppingBag, User, LogIn, UtensilsCrossed } from 'lucide-react';

export default function Header({ user, cartCount, onOpenCart, onOpenAuth }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* برند و لوگو */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Food<span className="text-[#FF6B00]">Ops</span></span>
            <span className="block text-[10px] text-gray-400 font-normal -mt-1">سفارش آنلاین غذا</span>
          </div>
        </div>

        {/* دکمه‌های پروفایل و سبد خرید */}
        <div className="flex items-center gap-3">
          
          {/* وضعیت کاربر */}
          {user ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-700">
              <User className="w-4 h-4 text-[#FF6B00]" />
              <span className="hidden sm:inline">{user.fullname}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors"
            >
              <LogIn className="w-4 h-4 text-[#FF6B00]" />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}

          {/* آیکون شناور سبد خرید */}
          <button
            onClick={onOpenCart}
            aria-label="سبد خرید"
            className="relative p-2.5 bg-orange-50 hover:bg-orange-100 text-[#FF6B00] rounded-xl transition-all active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}