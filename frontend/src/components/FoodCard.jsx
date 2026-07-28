import React from 'react';
import { Plus } from 'lucide-react';

export default function FoodCard({ item, onAddToCart }) {
  const isAvailable = item.status && item.stock_quantity > 0;

  // فرمت سه رقمی قیمت به تومان
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* بخش تصویر و Badge */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={item.image_url || '/placeholder-food.jpg'}
          alt={item.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale opacity-60' : ''}`}
        />
        {!isAvailable && (
          <span className="absolute top-2 right-2 bg-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
            ناموجود
          </span>
        )}
      </div>

      {/* اطلاعات محصول */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base mb-1">{item.name}</h3>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">
            {item.description || 'توضیحاتی برای این محصول ثبت نشده است.'}
          </p>
        </div>

        {/* قیمت و دکمه خرید */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-slate-800 text-base">{formatPrice(item.price)}</span>
            <span className="text-[11px] text-gray-400">تومان</span>
          </div>

          <button
            onClick={() => onAddToCart(item)}
            disabled={!isAvailable}
            aria-label={`افزودن ${item.name} به سبد خرید`}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              isAvailable
                ? 'bg-[#FF6B00] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}