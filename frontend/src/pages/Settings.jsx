import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLocation } from 'react-router-dom'; // 👇 YENİ: Yönlendirme parametresini yakalamak için
import Sidebar from '../components/Sidebar'; 
import { FiUser, FiLock, FiSettings, FiSave, FiMoon, FiSun, FiGlobe, FiDollarSign, FiCheck, FiBell, FiTrash2, FiAlertTriangle, FiList, FiPieChart, FiEdit2 } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useContext(AuthContext); 
  const { currency, setCurrency } = useCurrency();
  const location = useLocation(); // 👇 YENİ
  
  // Varsayılan sekme kontrolü (Dashboard'dan geldiyse orayı aç)
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [loading, setLoading] = useState(false);

  // --- Kategori Yönetimi State ---
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState('');

  // 👇 YENİ: Varsayılan Kategoriler Listesi (Veritabanında yoksa bunları göster)
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
    if (activeTab === 'categories') {
        fetchCategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
      try {
          const res = await api.get('/categories?type=expense');
          const dbCategories = res.data.categories;

          // 👇 KRİTİK GÜNCELLEME: DB'deki kategorilerle varsayılanları birleştir
          const mergedCategories = defaultCategories.map(defCat => {
              // Veritabanında bu isimde kategori var mı?
              const found = dbCategories.find(dbCat => dbCat.name === defCat.name);
              if (found) {
                  return found; // Varsa DB'dekini kullan (Limiti vardır)
              } else {
                  return { ...defCat, budgetLimit: 0, _id: null }; // Yoksa varsayılanı kullan (Henüz ID'si yok)
              }
          });

          setCategories(mergedCategories);
      } catch (error) {
          console.error("Kategoriler yüklenemedi", error);
      }
  };

  const handleSaveLimit = async (category) => {
      try {
          const limitValue = parseFloat(newLimit);
          if (isNaN(limitValue)) return;

          if (category._id) {
              // 1. Durum: Kategori ZATEN VAR (Update - PUT)
              await api.put(`/categories/${category._id}`, {
                  budgetLimit: limitValue
              });
          } else {
              // 2. Durum: Kategori YOK (Create - POST)
              await api.post('/categories', {
                  name: category.name,
                  type: 'expense',
                  icon: category.icon,
                  color: '#3B82F6',
                  budgetLimit: limitValue
              });
          }

          toast.success(`${category.name} limiti güncellendi!`);
          setEditingCategory(null);
          fetchCategories(); // Listeyi yenile
      } catch (error) {
          toast.error("İşlem başarısız.");
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

  const TabButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={18} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                <FiSettings />
              </div>
              {t('settings')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 ml-14">Hesap ayarlarınızı ve tercihlerinizi buradan yönetin.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* AYARLAR MENÜSÜ */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-4">
                <TabButton id="profile" icon={FiUser} label={t('profile')} />
                <TabButton id="categories" icon={FiPieChart} label="Bütçe Limitleri" /> 
                <TabButton id="security" icon={FiLock} label={t('security')} />
                <TabButton id="preferences" icon={FiSettings} label={t('preferences')} />
                <TabButton id="notifications" icon={FiBell} label="Bildirimler" />
              </div>
            </div>

            {/* FORMLAR */}
            <div className="lg:col-span-9">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                
                {/* --- PROFİL TAB --- */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fadeIn">
                    <div className="border-b dark:border-gray-700 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t('profile')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Kişisel bilgilerinizi güncelleyin.</p>
                    </div>
                    
                    <div className="grid gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('name')}</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full p-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('email')}</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full p-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={loading} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200/50 dark:shadow-none transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FiCheck size={20} />} 
                        {loading ? t('updating') : t('save_changes')}
                      </button>
                    </div>
                  </form>
                )}

                {/* --- KATEGORİLER VE BÜTÇE TAB --- */}
                {activeTab === 'categories' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b dark:border-gray-700 pb-4 mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Kategori Bütçeleri</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Harcama kategorileriniz için aylık limit belirleyin. %80'e ulaştığınızda sizi uyaralım.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all">
                                    {/* SOL TARAF */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-500">
                                            {cat.icon || '📁'}
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white text-base">{cat.name}</span>
                                    </div>

                                    {/* SAĞ TARAF */}
                                    <div className="flex items-center gap-3">
                                        {editingCategory === cat.name ? ( // ID yerine isim kontrolü yapıyoruz çünkü ID henüz olmayabilir
                                            <div className="flex items-center gap-2 animate-fadeIn">
                                                <input 
                                                    type="number" 
                                                    autoFocus
                                                    className="w-24 p-2 text-sm border border-blue-300 focus:ring-2 focus:ring-blue-200 rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-500 outline-none text-right"
                                                    placeholder="0"
                                                    value={newLimit}
                                                    onChange={(e) => setNewLimit(e.target.value)}
                                                />
                                                <button 
                                                    onClick={() => handleSaveLimit(cat)}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm"
                                                    title="Kaydet"
                                                >
                                                    <FiCheck size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setEditingCategory(null)}
                                                    className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                                                    title="İptal"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-bold ${cat.budgetLimit > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {cat.budgetLimit > 0 ? `${cat.budgetLimit.toLocaleString()} ₺` : 'Limit Yok'}
                                                </span>
                                                
                                                <button 
                                                    onClick={() => {
                                                        setEditingCategory(cat.name);
                                                        setNewLimit(cat.budgetLimit || '');
                                                    }}
                                                    className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="Bütçeyi Düzenle"
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

                {/* --- GÜVENLİK TAB --- */}
                {activeTab === 'security' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fadeIn">
                    <div className="border-b dark:border-gray-700 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t('security')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hesap güvenliğinizi yönetin.</p>
                    </div>
                    
                    <div className="grid gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('current_password')}</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                          className="w-full p-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('new_password')}</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className="w-full p-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={loading} className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200/50 dark:shadow-none transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50">
                        <FiLock /> {loading ? t('updating') : 'Şifreyi Güncelle'}
                      </button>
                    </div>

                    {/* TEHLİKELİ BÖLGE */}
                    <div className="mt-10 p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl">
                        <h4 className="text-red-600 font-bold flex items-center gap-2"><FiAlertTriangle /> Tehlikeli Bölge</h4>
                        <p className="text-sm text-red-500 mt-1">Hesabınızı silmek geri alınamaz bir işlemdir. Lütfen dikkatli olun.</p>
                        <button type="button" className="mt-4 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                            Hesabımı Sil
                        </button>
                    </div>
                  </form>
                )}

                {/* --- TERCİHLER TAB --- */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b dark:border-gray-700 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t('preferences')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Görünüm ve dil ayarları.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white dark:bg-gray-600 rounded-xl shadow-sm text-orange-500"><FiSun size={24} /></div>
                          <button onClick={toggleTheme} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition text-gray-700 dark:text-white">{t('theme')} Değiştir</button>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-white mb-1">{t('theme')}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Karanlık / Aydınlık Mod</p>
                      </div>

                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white dark:bg-gray-600 rounded-xl shadow-sm text-blue-500"><FiGlobe size={24} /></div>
                          <div className="flex bg-white dark:bg-gray-600 rounded-lg p-1 border border-gray-200 dark:border-gray-500 shadow-sm">
                            <button onClick={() => i18n.changeLanguage('tr')} className={`px-3 py-1 rounded text-xs font-bold transition ${i18n.language === 'tr' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>TR</button>
                            <button onClick={() => i18n.changeLanguage('en')} className={`px-3 py-1 rounded text-xs font-bold transition ${i18n.language === 'en' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>EN</button>
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-white mb-1">{t('language')}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">TR / EN</p>
                      </div>

                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all group md:col-span-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-gray-600 rounded-xl shadow-sm text-green-500"><FiDollarSign size={24} /></div>
                            <div>
                              <h4 className="font-bold text-gray-800 dark:text-white mb-1">{t('currency')}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Varsayılan görüntüleme birimi.</p>
                            </div>
                          </div>
                          <div className="flex bg-white dark:bg-gray-600 rounded-lg p-1 border border-gray-200 dark:border-gray-500 shadow-sm">
                            <button onClick={() => setCurrency('TRY')} className={`px-4 py-2 rounded text-xs font-bold transition ${currency === 'TRY' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>TRY (₺)</button>
                            <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded text-xs font-bold transition ${currency === 'USD' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>USD ($)</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- BİLDİRİMLER TAB --- */}
                {activeTab === 'notifications' && (
                   <div className="space-y-6 animate-fadeIn">
                      <div className="border-b dark:border-gray-700 pb-4 mb-4">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Bildirim Tercihleri</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Hangi konularda bildirim almak istediğinizi seçin.</p>
                      </div>
                      
                      <div className="space-y-4">
                          {['Aylık Bütçe Özeti', 'Fiyat Alarmları', 'Yeni Özellik Duyuruları', 'Güvenlik Uyarıları'].map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                                  <span className="font-medium text-gray-700 dark:text-gray-200">{item}</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" defaultChecked={index < 2} className="sr-only peer" />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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