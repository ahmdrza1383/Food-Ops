export function formatPrice(amount) {
    if (typeof amount !== 'number') return '۰ تومان';
    const formatted = new Intl.NumberFormat('fa-IR').format(amount);
    return `${formatted} تومان`;
}

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';

    toast.className = `fixed bottom-5 right-5 z-50 ${bgColor} text-white px-5 py-3 rounded-2xl shadow-xl font-medium text-sm transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '⚠️'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}