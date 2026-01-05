import { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// İkonlar eksiksiz eklendi
import { FiPieChart, FiLogOut, FiTrendingUp, FiMoon, FiSun, FiGlobe, FiSettings, FiActivity, FiMessageSquare, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { t, i18n } = useTranslation();

  // Tema Durumu
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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinkClass = (path) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200";
    return location.pathname === path 
      ? `${baseClass} bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800` 
      : `${baseClass} text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 border border-transparent`;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 shadow-xl hidden md:flex flex-col h-full border-r border-gray-100 dark:border-gray-800 transition-colors duration-300 z-50 relative">
      
      {/* LOGO ALANI */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <FiPieChart size={22} />
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">FinansTakip</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pro Panel</span>
        </div>
      </div>
      
      {/* MENÜ LİNKLERİ (TEK LİSTE - BAŞLIKSIZ) */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          <FiPieChart size={20} /> {t('dashboard')}
        </Link>

        <Link to="/market" className={getLinkClass('/market')}>
          <FiActivity size={20} /> {t('market')}
        </Link>

        <Link to="/investments" className={getLinkClass('/investments')}>
          <FiTrendingUp size={20} /> {t('investments')}
        </Link>

        <Link to="/community" className={getLinkClass('/community')}>
          <FiMessageSquare size={20} /> {t('community')}
        </Link>

      </nav>

      {/* FOOTER ALANI (BİZE ULAŞIN + AYARLAR + ÇIKIŞ) */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        
        {/* 👇 YENİ KONUMU: Ayarların hemen üstünde */}
        <Link to="/contact" className={`${getLinkClass('/contact')} mb-2`}>
          <FiMail size={20} /> {t('contact_us')}
        </Link>

        <Link to="/settings" className={`${getLinkClass('/settings')} mb-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm`}>
          <FiSettings size={20} /> {t('settings')}
        </Link>

        <div className="grid grid-cols-2 gap-2 mb-3">
            {/* TEMA BUTONU */}
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                title={darkMode ? "Aydınlık Mod" : "Karanlık Mod"}
            >
                {darkMode ? <FiSun size={18} className="text-yellow-500" /> : <FiMoon size={18} className="text-gray-500" />}
            </button>

            {/* DİL BUTONU (TOGGLE) */}
            <button 
                onClick={() => changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
                <FiGlobe size={18} className="text-blue-500" />
                <span>{i18n.language === 'tr' ? 'TR' : 'EN'}</span>
            </button>
        </div>

        {/* ÇIKIŞ BUTONU */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors border border-red-100 dark:border-red-900/30"
        >
          <FiLogOut size={18} /> {t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;