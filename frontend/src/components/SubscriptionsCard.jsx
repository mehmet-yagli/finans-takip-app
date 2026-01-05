import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSubscriptions, addSubscription, deleteSubscription } from '../services/subscriptionService';
import AddSubscriptionModal from './AddSubscriptionModal';
// 👇 DEĞİŞİKLİK: lucide-react yerine react-icons kullanıldı
import { FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi'; 
import toast from 'react-hot-toast';

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
      toast.success(t('register_success'));
      fetchSubs();
    } catch (error) {
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
  const totalCost = subscriptions.reduce((acc, sub) => acc + sub.price, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      {/* Başlık ve Ekle Butonu */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {t('subscriptions')}
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {subscriptions.length}
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('total_monthly_subscription')}: <span className="font-bold text-gray-800 dark:text-gray-200">{totalCost.toFixed(2)} ₺</span>
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-4">{t('loading')}</p>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <FiCalendar size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('no_data')}</p>
          </div>
        ) : (
          subscriptions.map((sub) => {
            const daysLeft = getDaysLeft(sub.paymentDay);
            const isUrgent = daysLeft <= 3; 

            return (
              <div key={sub._id} className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                
                <div className="flex items-center gap-3">
                  {/* Gün Rozeti */}
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                    isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    <span>{sub.paymentDay}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{sub.name}</h4>
                    <p className={`text-xs ${isUrgent ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {daysLeft === 0 ? t('today') : `${daysLeft} ${t('days_left')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                    {sub.price} {sub.currency}
                  </span>
                  <button 
                    onClick={() => handleDelete(sub._id)}
                    className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <FiTrash2 size={16} />
                  </button>
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