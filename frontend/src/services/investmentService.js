import axios from 'axios';

// Backend adresini dinamik alalım (Render veya Localhost)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token'ı (Kimlik Kartı) her isteğe ekleyen yardımcı fonksiyon
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// 1. Tüm Yatırımları Getir
export const getInvestments = async () => {
  const response = await axios.get(`${API_URL}/investments`, getAuthHeader());
  return response.data;
};

// 2. Yeni Yatırım Ekle
export const addInvestment = async (investmentData) => {
  const response = await axios.post(`${API_URL}/investments`, investmentData, getAuthHeader());
  return response.data;
};

// 3. Yatırım Sil
export const deleteInvestment = async (id) => {
  const response = await axios.delete(`${API_URL}/investments/${id}`, getAuthHeader());
  return response.data;
};

// 4. Tek Bir Fiyatı Güncelle (Hata veren kısım buydu, eklendi ✅)
export const updatePrice = async (id) => {
  const response = await axios.put(`${API_URL}/investments/${id}/update-price`, {}, getAuthHeader());
  return response.data;
};

// 5. Tüm Fiyatları Güncelle (Toplu işlem için)
export const updatePrices = async () => {
  const response = await axios.put(`${API_URL}/investments/update-prices/all`, {}, getAuthHeader());
  return response.data;
};