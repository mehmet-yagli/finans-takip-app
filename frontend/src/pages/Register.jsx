import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// 👇 YENİ: İkonlar güncellendi
import { FiUser, FiMail, FiLock, FiTrendingUp, FiMoon, FiSun, FiGlobe } from 'react-icons/fi';
import { useTranslation } from 'react-i18next'; // 👈 YENİ

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // 👈 YENİ

  // 👇 YENİ: Dark Mode State (Diğer sayfalarla senkronize olması için localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // 👇 YENİ: Dil Değiştirme
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    // 👇 GÜNCELLEME: Arka plan dark moda uyarlandı
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 p-4">
      
      {/* 👇 YENİ: Sağ Üst Ayarlar Paneli */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {/* Tema Butonu */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-yellow-400"
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>

        {/* Dil Butonları */}
        <div className="flex bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
             <button 
               onClick={() => changeLanguage('tr')}
               className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${i18n.language === 'tr' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-300 hover:text-purple-600'}`}
             >
               TR
             </button>
             <button 
               onClick={() => changeLanguage('en')}
               className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${i18n.language === 'en' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-300 hover:text-purple-600'}`}
             >
               EN
             </button>
        </div>
      </div>

      {/* Kart */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700 transition-colors duration-300">
        
        {/* Header - Farklı renk (Mor) ve Dark Mode uyumu */}
        <div className="bg-purple-600 dark:bg-purple-900 p-8 text-center transition-colors">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
            <FiTrendingUp className="text-3xl text-white" />
          </div>
          {/* 👇 Metinler Çevrildi */}
          <h2 className="text-3xl font-bold text-white mb-2">{t('register_title')}</h2>
          <p className="text-purple-100">Finansal takibe hemen başla.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* İsim Soyisim Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('name')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400 dark:text-gray-500" />
                </div>
                {/* 👇 Inputlar dark moda uyarlandı */}
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>

            {/* Şifre Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {t('register_button')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('already_have_account')}{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold hover:underline">
              {t('login_button')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;