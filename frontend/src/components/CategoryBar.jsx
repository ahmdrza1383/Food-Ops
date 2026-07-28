import React from 'react';

export default function CategoryBar({ categories, activeCategoryId, onSelectCategory }) {
  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategoryId === null
                ? 'bg-[#FF6B00] text-white shadow-sm shadow-orange-500/20'
                : 'bg-gray-50 text-slate-600 hover:bg-gray-100'
            }`}
          >
            همه موارد
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategoryId === cat._id
                  ? 'bg-[#FF6B00] text-white shadow-sm shadow-orange-500/20'
                  : 'bg-gray-50 text-slate-600 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}