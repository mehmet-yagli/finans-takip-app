import api from './api'; // Mevcut axios instance'ını kullanıyoruz

const chatWithAI = async (message) => {
  try {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

const aiService = {
  chatWithAI,
};

export default aiService;