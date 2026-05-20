import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// درخواست اینترسپتور برای اضافه کردن توکن
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// برای آپلود فایل (multipart) از هدر پیش‌فرض خارج می‌شویم و در هر درخواست جدا تنظیم می‌کنیم
export default api;