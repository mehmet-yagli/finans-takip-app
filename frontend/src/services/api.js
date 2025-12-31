import axios from 'axios';

// Backend'in çalıştığı adres (Server.js'de 5000 portunu ayarlamıştık)
const API_URL = 'https://finans-takip-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekten önce çalışacak "Interceptor" (Araya giren bekçi)
// Eğer localStorage'da token varsa, onu otomatik olarak isteğe ekler.
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