import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLocation } from 'react-router-dom'; 
import Sidebar from '../components/Sidebar'; 
import { FiUser, FiLock, FiSettings, FiSun, FiGlobe, FiDollarSign, FiCheck, FiBell, FiTrash2, FiAlertTriangle, FiPieChart, FiEdit2, FiRefreshCw, FiX, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useContext(AuthContext); 
  const { currency, setCurrency } = useCurrency();
  const location = useLocation(); 
  
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState('');

  const [recurringTxs, setRecurringTxs] = useState([]);
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [newRecurringAmount, setNewRecurringAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(36.50);

  const defaultCategories = [
    { name: "Market", icon: "🛒" },
    { name: "Fatura", icon: "🧾" },
    { name: "Ulaşım", icon: "🚌" },
    { name: "Kira", icon: "🏠" },
    { name: "Eğlence", icon: "🎉" },
    { name: "Sağlık", icon: "🩺" },
    { name: "Eğitim", icon: "🎓" },
    { name: "Giyim", icon: "👕" },
    { name: "Elektronik", icon: "💻" },
    { name: "Diğer", icon: "📦" }
  ];

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
        const data = await response.json();
        if (data?.rates?.TRY) {
          setExchangeRate(data.rates.TRY);
        }
      } catch (error) {
        console.error("Kur çekilemedi", error);
      }
    };
    fetchRate();
  }, []);

  // ESLint Warning Fix: useCallback kullanılarak fetch fonksiyonları dependency array için güvenli hale getirildi.
  const fetchCategories = useCallback(async () => {
      try {
          const res = await api.get('/categories?type=expense');
          const dbCategories = res.data.categories;

          const mergedCategories = defaultCategories.map(defCat => {
              const found = dbCategories.find(dbCat => dbCat.name === defCat.name);
              if (found) {
                  return found; 
              } else {
                  return { ...defCat, budgetLimit: 0, _id: null }; 
              }
          });

          setCategories(mergedCategories);
      } catch (err) {
          console.error("Kategoriler yüklenemedi", err);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecurringTxs = useCallback(async () => {
      try {
          const res = await api.get('/transactions');
          const onlyRecurring = res.data.filter(tx => tx.isRecurring === true);
          setRecurringTxs(onlyRecurring);
      } catch (err) {
          console.error("Düzenli işlemler yüklenemedi", err);
      }
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
        fetchCategories();
    }
    if (activeTab === 'recurring') {
        fetchRecurringTxs();
    }
  }, [activeTab, fetchCategories, fetchRecurringTxs]);

  const handleSaveRecurringAmount = async (tx) => {
      try {
          let limitValue = parseFloat(newRecurringAmount);
          if (isNaN(limitValue) || limitValue <= 0) return toast.error(t('enter_limit'));

          if (currency === 'TRY') {
              limitValue = limitValue / exchangeRate;
          }

          await api.put(`/transactions/${tx._id}`, { amount: limitValue });
          toast.success(t('update_success'));
          setEditingRecurringId(null);
          fetchRecurringTxs();
      } catch (error) {
          toast.error(t('failed'));
          console.error(error);
      }
  };

  const handleStopRecurring = async (tx) => {
      if (!window.confirm(t('delete_confirm'))) return;
      try {
          await api.put(`/transactions/${tx._id}`, { isRecurring: false });
          toast.success(t('deleted'));
          fetchRecurringTxs(); 
      } catch(error) {
          toast.error(t('failed'));
      }
  };

  const handleSaveLimit = async (category) => {
      try {
          const limitValue = parseFloat(newLimit);
          if (isNaN(limitValue)) return;

          if (category._id) {
              await api.put(`/categories/${category._id}`, {
                  budgetLimit: limitValue
              });
          } else {
              await api.post('/categories', {
                  name: category.name,
                  type: 'expense',
                  icon: category.icon,
                  color: '#3B82F6',
                  budgetLimit: limitValue
              });
          }

          toast.success(t('update_success'));
          setEditingCategory(null);
          fetchCategories(); 
      } catch (error) {
          toast.error(t('failed'));
          console.error(error);
      }
  };

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast.success(t('light_mode'));
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast.success(t('dark_mode'));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/update', {
        name: formData.name,
        email: formData.email,
        password: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined
      });

      if (setUser) {
          setUser(res.data.user);
      }
      
      toast.success(t('update_success'));
      setFormData({ ...formData, currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || t('failed'));
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, icon: IconComponent, label }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all mb-2 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50 dark:shadow-none scale-[1.02]' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
      }`}
    >
      <IconComponent size={20} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white flex items-center gap-4">
              <div className="p-3 bg-blue-100/80 backdrop-blur-sm dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm">
                <FiSettings />
              </div>
              {t('settings')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 ml-16 font-medium">{t('settings_desc')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* AYARLAR MENÜSÜ */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-white/50 dark:border-gray-700 p-5 sticky top-6">
                <TabButton id="profile" icon={FiUser} label={t('profile')} />
                <TabButton id="categories" icon={FiPieChart} label={t('budget_limits')} /> 
                <TabButton id="recurring" icon={FiRefreshCw} label={t('recurring_transactions')} /> 
                <TabButton id="security" icon={FiLock} label={t('security')} />
                <TabButton id="preferences" icon={FiSettings} label={t('preferences')} />
                <TabButton id="notifications" icon={FiBell} label={t('notifications')} />
              </div>
            </div>

            {/* FORMLAR */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-white/50 dark:border-gray-700 p-8 md:p-10">
                
                {/* --- PROFİL TAB --- */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-8 animate-fadeIn">
                    <div className="border-b dark:border-gray-700/50 pb-5">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('profile')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('profile_desc')}</p>
                    </div>
                    
                    <div className="grid gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('name')}</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('email')}</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={loading} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200/50 dark:shadow-none transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FiCheck size={20} />} 
                        {loading ? t('updating') : t('save_changes')}
                      </button>
                    </div>
                  </form>
                )}

                {/* --- KATEGORİLER VE BÜTÇE TAB --- */}
                {activeTab === 'categories' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b dark:border-gray-700/50 pb-5 mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('category_budgets')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('category_budgets_desc')}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex flex-col p-5 bg-white dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-600 flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-500">
                                            {cat.icon || '📁'}
                                        </div>
                                        <span className="font-extrabold text-gray-800 dark:text-white text-lg">{t(cat.name)}</span>
                                    </div>

                                    <div className="mt-auto">
                                        {editingCategory === cat.name ? ( 
                                            <div className="flex items-center gap-2 animate-fadeIn w-full">
                                                <input 
                                                    type="number" 
                                                    autoFocus
                                                    className="flex-1 p-3 text-sm font-bold border border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl dark:bg-gray-800 dark:text-white dark:border-blue-500 outline-none"
                                                    placeholder={t('enter_limit')}
                                                    value={newLimit}
                                                    onChange={(e) => setNewLimit(e.target.value)}
                                                />
                                                <button onClick={() => handleSaveLimit(cat)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-none transition-transform active:scale-95">
                                                    <FiCheck size={18} />
                                                </button>
                                                <button onClick={() => setEditingCategory(null)} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 transition-transform active:scale-95">
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                                <span className={`text-base font-bold ${cat.budgetLimit > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {cat.budgetLimit > 0 ? `${cat.budgetLimit.toLocaleString()} ₺` : t('no_limit')}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        setEditingCategory(cat.name);
                                                        setNewLimit(cat.budgetLimit || '');
                                                    }}
                                                    className="p-2 text-blue-600 bg-white dark:bg-gray-700 shadow-sm rounded-lg hover:bg-blue-50 transition-colors border border-gray-100 dark:border-gray-600"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- DÜZENLİ İŞLEMLER (OTOMASYON) TABI --- */}
                {activeTab === 'recurring' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b dark:border-gray-700/50 pb-5 mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                                <FiRefreshCw className="text-blue-500 animate-spin-slow"/> {t('recurring_transactions')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('recurring_transactions_desc')}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {recurringTxs.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <FiRefreshCw size={32} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">{t('no_recurring_tx')}</p>
                                    <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto">{t('no_recurring_tx_desc')}</p>
                                </div>
                            ) : (
                                recurringTxs.map((tx) => {
                                    const displayAmount = currency === 'TRY' ? (tx.amount * exchangeRate) : tx.amount;
                                    const isIncome = tx.type === 'income';

                                    return (
                                        <div key={tx._id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all gap-4">
                                            
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                    {isIncome ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-gray-800 dark:text-white text-lg block">{tx.category}</span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md mt-1 inline-block">
                                                      {tx.description || t('untitled')} • {t('every_month')} <span className="font-bold text-gray-700 dark:text-gray-200">{tx.recurringDay}.</span> {t('day')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {editingRecurringId === tx._id ? (
                                                    <div className="flex items-center gap-2 animate-fadeIn bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                                        <input 
                                                            type="number" 
                                                            autoFocus
                                                            className="w-28 p-3 text-sm font-bold border border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl dark:bg-gray-800 dark:text-white dark:border-blue-500 outline-none text-right"
                                                            placeholder={t('amount')}
                                                            value={newRecurringAmount}
                                                            onChange={(e) => setNewRecurringAmount(e.target.value)}
                                                        />
                                                        <button onClick={() => handleSaveRecurringAmount(tx)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-none transition-transform active:scale-95" title={t('save_changes')}><FiCheck size={18} /></button>
                                                        <button onClick={() => setEditingRecurringId(null)} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 transition-transform active:scale-95" title={t('cancel')}><FiX size={18} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                        <span className={`text-xl font-black tracking-tight ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {isIncome ? '+' : '-'}{displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} {currency === 'TRY' ? '₺' : '$'}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                              onClick={() => { setEditingRecurringId(tx._id); setNewRecurringAmount((displayAmount).toFixed(2)); }} 
                                                              className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-transform active:scale-95" 
                                                            >
                                                              <FiEdit2 size={18} />
                                                            </button>
                                                            <button 
                                                              onClick={() => handleStopRecurring(tx)} 
                                                              className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 transition-transform active:scale-95" 
                                                              title={t('stop_automation')}
                                                            >
                                                              <FiX size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* --- GÜVENLİK TAB --- */}
                {activeTab === 'security' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-8 animate-fadeIn">
                    <div className="border-b dark:border-gray-700/50 pb-5 mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('security')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('security_desc')}</p>
                    </div>
                    
                    <div className="grid gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('current_password')}</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                          className="w-full p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-800 dark:text-white tracking-widest"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('new_password')}</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className="w-full p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-800 dark:text-white tracking-widest"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={loading} className="px-8 py-4 bg-gray-800 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-2xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50">
                        <FiLock /> {loading ? t('updating') : t('save_changes')}
                      </button>
                    </div>

                    {/* TEHLİKELİ BÖLGE */}
                    <div className="mt-12 p-6 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-3xl">
                        <h4 className="text-red-600 font-extrabold text-lg flex items-center gap-2"><FiAlertTriangle size={24} /> {t('danger_zone')}</h4>
                        <p className="text-sm text-red-500/80 mt-2 font-medium">{t('danger_zone_desc')}</p>
                        <button type="button" className="mt-5 px-6 py-3 border-2 border-red-200 dark:border-red-800/50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95">
                            {t('delete_account')}
                        </button>
                    </div>
                  </form>
                )}

                {/* --- TERCİHLER TAB --- */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b dark:border-gray-700/50 pb-5 mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('preferences')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('preferences_desc')}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white dark:bg-gray-700/30 rounded-3xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-orange-50 dark:bg-gray-600 rounded-2xl text-orange-500"><FiSun size={28} /></div>
                          <button onClick={toggleTheme} className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-500 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 text-gray-700 dark:text-white">{t('theme')}</button>
                        </div>
                        <h4 className="font-extrabold text-gray-800 dark:text-white text-lg mb-1">{t('theme')}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Karanlık / Aydınlık Mod</p>
                      </div>

                      <div className="p-6 bg-white dark:bg-gray-700/30 rounded-3xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-blue-50 dark:bg-gray-600 rounded-2xl text-blue-500"><FiGlobe size={28} /></div>
                          <div className="flex bg-gray-50 dark:bg-gray-600 rounded-xl p-1.5 border border-gray-200 dark:border-gray-500 shadow-inner">
                            <button onClick={() => i18n.changeLanguage('tr')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${i18n.language === 'tr' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>TR</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${i18n.language === 'en' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>EN</button>
                          </div>
                        </div>
                        <h4 className="font-extrabold text-gray-800 dark:text-white text-lg mb-1">{t('language')}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">TR / EN</p>
                      </div>

                      <div className="p-6 bg-white dark:bg-gray-700/30 rounded-3xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all group md:col-span-2">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="flex items-center gap-5">
                            <div className="p-4 bg-green-50 dark:bg-gray-600 rounded-2xl text-green-500"><FiDollarSign size={28} /></div>
                            <div>
                              <h4 className="font-extrabold text-gray-800 dark:text-white text-lg mb-1">{t('currency')}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Tüm portföy için varsayılan para birimi.</p>
                            </div>
                          </div>
                          <div className="flex bg-gray-50 dark:bg-gray-600 rounded-xl p-1.5 border border-gray-200 dark:border-gray-500 shadow-inner w-full md:w-auto">
                            <button onClick={() => setCurrency('TRY')} className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${currency === 'TRY' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>TRY (₺)</button>
                            <button onClick={() => setCurrency('USD')} className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>USD ($)</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- BİLDİRİMLER TAB --- */}
                {activeTab === 'notifications' && (
                   <div className="space-y-6 animate-fadeIn">
                      <div className="border-b dark:border-gray-700/50 pb-5 mb-6">
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('notification_prefs')}</h3>
                          <p className="text-gray-500 dark:text-gray-400">{t('notification_prefs_desc')}</p>
                      </div>
                      
                      <div className="space-y-4">
                          {['monthly_budget_summary', 'price_alarms', 'new_feature_announcements', 'security_alerts'].map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-5 bg-white dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 hover:border-blue-200 transition-colors">
                                  <span className="font-bold text-gray-700 dark:text-gray-200">{t(item)}</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" defaultChecked={index < 2} className="sr-only peer" />
                                      <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                  </label>
                              </div>
                          ))}
                      </div>
                   </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;