const BASE_URL = 'http://localhost:3000/api';

export async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/src/pages/auth/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || 'خطایی در ارتباط با سرور رخ داد');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}