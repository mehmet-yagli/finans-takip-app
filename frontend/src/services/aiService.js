import axios from 'axios';

// Kendi Wi-Fi ağında test edeceğin zaman 'localhost' yerine bilgisayarının yerel IP adresini (IPv4) yazmalısın.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const chatWithAI = async (message) => { 
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(`${API_URL}/ai/chat`, 
      { message }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Web AI Service Error:", error);
    throw error;
  }
};

export default { chatWithAI };