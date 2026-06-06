import { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiPieChart, FiLogOut, FiTrendingUp, FiMoon, FiSun, FiGlobe, FiSettings, FiActivity, FiMessageSquare, FiMail, FiMenu, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Mobil menü durumu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // HATA ÇÖZÜMÜ: Sayfa değiştiğinde mobil menüyü kapat (Sadece açıksa kapatarak ESLint uyarısını önlüyoruz)
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-300 group";
    
    return isActive 
      ? `${baseClass} bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20` 
      : `${baseClass} text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white border border-transparent`;
  };

  return (
    <>
      {/* MOBİL HAMBURGER BUTONU */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-3 bg-white/90 backdrop-blur-md dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white active:scale-95 transition-transform"
      >
        <FiMenu size={24} />
      </button>

      {/* MOBİL ARKA PLAN KARARMASI */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* ANA SİDEBAR KONTEYNER */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0B1120] shadow-2xl md:shadow-none border-r border-gray-100 dark:border-gray-800/50 flex flex-col h-full transition-transform duration-300 ease-in-out transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* LOGO ALANI - GÜNCELLENDİ (WhaleStreet) */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo İkonu: Okyanus mavisi gradyan ve Balina Emojisi */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <span className="text-2xl leading-none">🐋</span>
            </div>
            <div>
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight leading-none">WhaleStreet</h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pro Sürüm</span>
                </div>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white bg-gray-50 dark:bg-gray-800 rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>
        
        {/* MENÜ LİNKLERİ */}
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto scrollbar-hide">
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

        {/* FOOTER ALANI */}
        <div className="p-5 border-t border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-[#0B1120]/50">
          <Link to="/contact" className={`${getLinkClass('/contact')} mb-2`}>
            <FiMail size={20} /> {t('contact_us')}
          </Link>
          <Link to="/settings" className={`${getLinkClass('/settings')} mb-4 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm`}>
            <FiSettings size={20} /> {t('settings')}
          </Link>

          <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                  {darkMode ? <FiSun size={18} className="text-amber-500" /> : <FiMoon size={18} className="text-indigo-500" />}
              </button>
              <button 
                  onClick={() => changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
                  className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                  <FiGlobe size={18} className="text-blue-500" />
                  <span>{i18n.language.toUpperCase()}</span>
              </button>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-xl font-bold transition-colors border border-rose-100 dark:border-rose-500/20 active:scale-95"
          >
            <FiLogOut size={18} strokeWidth={2.5} /> {t('logout')}
          </button>

          {/* KURUMSAL İMZA ALANI - GÜNCELLENDİ (WhaleStreet) */}
          <div className="mt-5 text-center cursor-default select-none">
            <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              © 2026 WhaleStreet
            </p>
            <p className="text-[9px] font-medium text-gray-400/80 dark:text-gray-500/80 mt-0.5 tracking-wide">
              v1.0.4 Premium Edition
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;