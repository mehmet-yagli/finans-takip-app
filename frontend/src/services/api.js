import axios from 'axios';

// 👇 DÜZELTME BURADA:
// Artık direkt Render adresine değil, öncelikle .env dosyasındaki (localhost) ayarına bakacak.
// Eğer .env dosyasını okuyamazsa bile, güvenlik önlemi olarak 'http://localhost:5000/api' adresini kullanacak.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log("Şu an bağlanılan API:", API_URL); // Bunu konsolda (F12) görebilirsin

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;