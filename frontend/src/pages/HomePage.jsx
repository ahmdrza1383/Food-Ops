import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import FoodCard from '../components/FoodCard';
import AuthModal from '../components/AuthModal';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // دریافت اطلاعات از دیتابیس/بک‌اند
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, itemsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu-items')
        ]);
        
        const catData = await catRes.json();
        const itemsData = await itemsRes.json();

        if (catData.status === 'success') setCategories(catData.data.categories);
        if (itemsData.status === 'success') setMenuItems(itemsData.data.menuItems);
      } catch (err) {
        console.error('خطا در دریافت منو:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, item]);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category_id?._id === selectedCategory)
    : menuItems;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-['Vazirmatn']">
      
      {/* هدر */}
      <Header
        user={user}
        cartCount={cart.length}
        onOpenCart={() => alert('کشوی سبد خرید باز می‌شود')}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* نوار دسته‌بندی‌ها */}
      <CategoryBar
        categories={categories}
        activeCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* محتوای اصلی / کارت‌های منو */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          // Skeleton Loader (مطابق مستندات UI)
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-xl p-4 h-72 animate-pulse flex flex-col justify-between">
                <div className="bg-gray-200 h-36 rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                <div className="bg-gray-200 h-8 rounded-xl mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item._id} item={item} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}

      </main>

      {/* مدال لاگین و ثبت‌نام */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />

    </div>
  );
}