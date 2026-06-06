import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSubscriptions, addSubscription, deleteSubscription } from '../services/subscriptionService';
import AddSubscriptionModal from './AddSubscriptionModal';
// 👇 EKSİKSİZ İKONLAR (Yeni marka ikonları eklendi)
import { FiPlus, FiTrash2, FiCalendar, FiYoutube, FiMusic, FiPlayCircle, FiMonitor } from 'react-icons/fi'; 
import toast from 'react-hot-toast';

// YENİ: Abonelik markalarına özel stil ve ikon tanımlayıcı
const getBrandStyling = (name) => {
    if (!name) return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: <FiMonitor size={20} /> };
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return { bg: 'bg-[#E50914]/10', text: 'text-[#E50914]', icon: <span className="font-black font-serif text-xl leading-none">N</span> };
    if (lower.includes('spotify')) return { bg: 'bg-[#1DB954]/10', text: 'text-[#1DB954]', icon: <FiMusic size={20} /> };
    if (lower.includes('youtube')) return { bg: 'bg-[#FF0000]/10', text: 'text-[#FF0000]', icon: <FiYoutube size={20} /> };
    if (lower.includes('prime') || lower.includes('amazon')) return { bg: 'bg-[#00A8E1]/10', text: 'text-[#00A8E1]', icon: <FiPlayCircle size={20} /> };
    if (lower.includes('apple') || lower.includes('icloud')) return { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-900 dark:text-white', icon: <span className="text-xl leading-none"></span> };
    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: <FiMonitor size={20} /> }; 
};

const SubscriptionsCard = () => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verileri Çek
  const fetchSubs = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  // Yeni Ekleme
  const handleAdd = async (formData) => {
    try {
      await addSubscription(formData);
      toast.success(t('register_success') || 'Başarıyla eklendi!');
      fetchSubs();
    } catch (error) {
      // HATA ÇÖZÜMÜ: ESLint uyarılarını önlemek için error değişkenini konsolda kullanıyoruz
      console.error("Abonelik eklenirken hata oluştu:", error);
      toast.error(t('failed'));
    }
  };

  // Silme
  const handleDelete = async (id) => {
    if (window.confirm(t('delete_confirm'))) {
      try {
        await deleteSubscription(id);
        toast.success(t('deleted'));
        fetchSubs();
      } catch (error) {
        // HATA ÇÖZÜMÜ: ESLint uyarılarını önlemek için error değişkenini konsolda kullanıyoruz
        console.error("Abonelik silinirken hata oluştu:", error);
        toast.error(t('failed'));
      }
    }
  };

  // Kalan Gün Hesaplama
  const getDaysLeft = (day) => {
    const today = new Date();
    const currentDay = today.getDate();
    if (day >= currentDay) {
      return day - currentDay;
    } else {
      // Bir sonraki ay
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return (daysInMonth - currentDay) + parseInt(day);
    }
  };

  // Toplam Maliyet Hesapla
  const totalCost = subscriptions.reduce((acc, sub) => acc + parseFloat(sub.price || 0), 0);

  return (
    // YENİ UI: Dashboard'un genel Premium stiliyle eşleştirildi (Border, shadow, bg)
    <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden">
      
      {/* Başlık ve Ekle Butonu */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/10">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            {t('subscriptions')}
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg dark:bg-blue-900/40 dark:text-blue-400 font-bold">
              {subscriptions.length}
            </span>
          </h3>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('total_monthly_subscription')}: <span className="font-extrabold text-gray-900 dark:text-white">{totalCost.toFixed(2)} ₺</span>
          </p>
        </div>
        
        {/* Yuvarlak yeni nesil aksiyon butonu */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          <FiPlus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-3"></div>
             <p className="text-sm font-bold">{t('loading')}</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                <FiCalendar size={24} className="opacity-50" />
            </div>
            <p className="text-sm font-bold">{t('no_data')}</p>
          </div>
        ) : (
          subscriptions.map((sub) => {
            const daysLeft = getDaysLeft(sub.paymentDay);
            const isUrgent = daysLeft <= 3; 

            // YENİ: Progress Bar Hesaplaması (% kaçı doldu)
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const progressPercent = Math.max(0, Math.min(100, 100 - ((daysLeft / daysInMonth) * 100)));
            const barColor = isUrgent ? 'bg-rose-500' : 'bg-blue-500'; // Yaklaşınca kırmızı olur

            // Marka Stili
            const brandStyle = getBrandStyling(sub.name);

            return (
              <div key={sub._id} className="group relative flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm">
                
                {/* Üst Kısım: İkon, İsim ve Fiyat */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Apple Tarzı İkon Kutusu */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${brandStyle.bg} ${brandStyle.text}`}>
                            {brandStyle.icon}
                        </div>
                        <div>
                            <h4 className="font-extrabold text-gray-900 dark:text-white text-sm capitalize tracking-tight">{sub.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{sub.paymentDay}. Gün Ödemesi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                            {sub.price} {sub.currency}
                        </span>
                        
                        {/* Sil Butonu (Sadece Hover durumunda çıkar) */}
                        <button 
                            onClick={() => handleDelete(sub._id)}
                            className="absolute right-4 text-gray-300 hover:text-rose-500 bg-white dark:bg-gray-800 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-gray-100 dark:border-gray-700"
                            title="Sil"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Alt Kısım: Kalan Gün Yazısı ve Progress Bar */}
                <div className="mt-1">
                    <div className="flex justify-between items-end mb-1.5">
                        <p className={`text-[11px] font-bold tracking-wide ${isUrgent ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}>
                            {daysLeft === 0 ? t('today') : `${daysLeft} ${t('days_left')}`}
                        </p>
                        <span className="text-[10px] font-semibold text-gray-400">{Math.round(progressPercent)}%</span>
                    </div>
                    {/* Çubuk (Bar) */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      <AddSubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAdd} 
      />
    </div>
  );
};

export default SubscriptionsCard;