import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiMail, FiMapPin, FiPhone, FiSend, FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next'; // Çeviri için eklendi

const Contact = () => {
  const { t } = useTranslation(); // Çeviri hook'u
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast.error(t('fill_all_fields') || 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact', formData);
      toast.success(t('message_sent') || 'Mesajınız gönderildi! 🚀');
      setFormData({ subject: '', message: '' }); 
    } catch (error) {
      toast.error(t('failed') || 'Mesaj gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 font-sans transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FiMessageSquare className="text-blue-600" /> {t('contact_title') || 'Bize Ulaşın'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('contact_subtitle') || 'Sorularınız, önerileriniz veya destek için buradayız.'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sol Taraf: İletişim Bilgileri */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* E-POSTA KARTI */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <FiMail size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('email_support') || 'E-Posta'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">7/24 bize yazabilirsiniz.</p>
                <p className="text-blue-600 font-medium mt-2 break-all">destek@finanstakip.com</p>
              </div>

              {/* TELEFON KARTI */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center mb-4">
                  <FiPhone size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('phone') || 'Telefon'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hafta içi 09:00 - 18:00</p>
                {/* 👇 GÜNCELLEME: İstenilen Telefon Numarası */}
                <p className="text-green-600 font-medium mt-2">+90 (000) 000 00 00</p>
              </div>

              {/* ADRES KARTI */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <FiMapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('office') || 'Ofis'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Merkez Ofis</p>
                {/* 👇 GÜNCELLEME: İstenilen Adres */}
                <p className="text-purple-600 font-medium mt-2">Sivas Gürün Seyfi Saltoğlu Parkı</p>
              </div>
            </div>

            {/* Sağ Taraf: Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Mesaj Gönder</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('subject') || 'Konu'}</label>
                    <select 
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>{t('select_topic') || 'Bir konu seçin'}</option>
                      <option value="Destek">{t('tech_support') || 'Teknik Destek'}</option>
                      <option value="Öneri">{t('suggestion') || 'Öneri & İstek'}</option>
                      <option value="Hata">{t('bug_report') || 'Hata Bildirimi'}</option>
                      <option value="Diğer">{t('other') || 'Diğer'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('message') || 'Mesajınız'}</label>
                    <textarea 
                      name="message" 
                      rows="6"
                      placeholder={t('message_placeholder') || "Size nasıl yardımcı olabiliriz?"}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (t('sending') || 'Gönderiliyor...') : <><FiSend /> {t('send') || 'Gönder'}</>}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;