import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// 👇 Şifremi unuttum ekranı için FiArrowLeft ve FiCheckCircle eklendi
import { FiMail, FiLock, FiTrendingUp, FiMoon, FiSun, FiGlobe, FiPieChart, FiActivity, FiShield, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // 👇 YENİ: Şifremi Unuttum ekranını göstermek için State'ler
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetSubmitted, setIsResetSubmitted] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  // 👇 YENİ: Şifre Sıfırlama Formu Gönderimi
  const handleResetSubmit = (e) => {
    e.preventDefault();
    console.log("Şifre sıfırlama maili gönderilecek adres:", resetEmail);
    setIsResetSubmitted(true);
  };

  return (
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500 overflow-hidden font-sans">
      
      {/* ARKA PLAN AMBİYANS IŞIKLARI (BLOBS) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* SAĞ ÜST AYARLAR PANELİ */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 dark:border-gray-700/50 hover:shadow-md transition-all active:scale-95 text-gray-600 dark:text-amber-400"
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl p-1 shadow-sm border border-white/50 dark:border-gray-700/50">
             <button 
               onClick={() => changeLanguage('tr')}
               className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${i18n.language === 'tr' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
             >
               TR
             </button>
             <button 
               onClick={() => changeLanguage('en')}
               className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${i18n.language === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
             >
               EN
             </button>
        </div>
      </div>

      {/* SOL TARAF (İNFOGRAFİK / MOTİVASYON ALANI) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="max-w-md w-full space-y-8 relative">
          
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
               <span className="text-3xl leading-none">🐋</span>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">WhaleStreet</h1>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Paranı Yönetmenin <br/><span className="text-blue-600 dark:text-blue-400">En Akıllı Yolu.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Yatırımlarını tek bir yerden takip et, harcamalarını analiz et ve geleceğini güvence altına al.
            </p>
          </div>

          <div className="mt-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/60 dark:border-gray-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-green-500">
                <FiActivity size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bugün</p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">Portföy %2.4 Büyüdü <span className="text-green-500">🚀</span></h4>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-500 mt-8">
            <FiShield size={18} className="text-green-500" />
            <span>256-bit SSL şifreleme ile güvende</span>
          </div>

        </div>
      </div>

      {/* SAĞ TARAF (GİRİŞ VE ŞİFRE SIFIRLAMA FORMU) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
               <span className="text-2xl leading-none">🐋</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">WhaleStreet</h1>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
            
            {/* 👇 KOŞULLU RENDER: Şifremi Unuttum Ekranı mı, Giriş Ekranı mı? */}
            {!showForgotPassword ? (
              <>
                {/* --- NORMAL GİRİŞ EKRANI --- */}
                <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-800/50 text-center">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('login_title')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Hesabına giriş yap ve kontrolü eline al.</p>
                </div>

                <div className="p-8 sm:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">{t('email')}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                          <FiMail size={18} />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                          placeholder="ornek@mail.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">{t('password')}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                          <FiLock size={18} />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium tracking-widest"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer sr-only" 
                          />
                          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                            <svg className={`w-3 h-3 text-white pointer-events-none transition-transform duration-200 ${rememberMe ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">Beni Hatırla</span>
                      </label>

                      {/* 👇 YENİ: Şifremi Unuttum Butonu (State'i değiştirir) */}
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)} 
                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform active:scale-95"
                      >
                        {t('login_button')} <FiTrendingUp size={20} />
                      </button>
                    </div>
                  </form>

                  <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('dont_have_account')}{' '}
                    <Link to="/register" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline transition-all">
                      {t('register_button')}
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* --- ŞİFREMİ UNUTTUM EKRANI --- */}
                <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-800/50 text-center animate-fade-in-up">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-6">
                    <FiShield size={32} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Şifreni mi Unuttun?</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium px-2">
                    Endişelenme! E-posta adresini gir, sana şifreni sıfırlaman için bir bağlantı göndereceğiz.
                  </p>
                </div>

                <div className="p-8 sm:p-10">
                  {!isResetSubmitted ? (
                    <form onSubmit={handleResetSubmit} className="space-y-6 animate-fade-in-up">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">E-Posta Adresİ</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-gray-400">
                            <FiMail size={18} />
                          </div>
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                            placeholder="Kayıtlı e-posta adresin"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform active:scale-95"
                        >
                          Sıfırlama Bağlantısı Gönder
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Başarılı Gönderim Durumu */
                    <div className="text-center py-4 animate-fade-in-up">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                        <FiCheckCircle size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">E-Posta Gönderildi!</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{resetEmail}</span> adresine bir şifre sıfırlama bağlantısı gönderdik. Lütfen gelen kutunuzu kontrol edin.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 text-center text-sm font-medium">
                    <button 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setIsResetSubmitted(false);
                        setResetEmail('');
                      }} 
                      className="flex items-center justify-center gap-2 w-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-extrabold transition-all group"
                    >
                      <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Giriş Ekranına Dön
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;