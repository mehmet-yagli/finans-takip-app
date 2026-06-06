import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// 👇 İkonlara infografik için yenileri eklendi
import { FiUser, FiMail, FiLock, FiTrendingUp, FiMoon, FiSun, FiPieChart, FiUsers, FiShield } from 'react-icons/fi';
import { useTranslation } from 'react-i18next'; 

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 👇 YENİ: Kullanım Koşulları Onayı state'i eklendi
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); 

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 👇 YENİ: Kullanım Koşulları Onaylanmadıysa Uyarı Ver
    if (!acceptTerms) {
      alert('Kayıt olmak için kullanım koşullarını kabul etmelisiniz.');
      return;
    }

    const success = await register(name, email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    // GÜNCELLEME: Full ekran, iki kolonlu yapı. Mor/Pembe (Purple) ambiyans ışıkları
    <div className="relative min-h-screen flex bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500 overflow-hidden font-sans">
      
      {/* ARKA PLAN AMBİYANS IŞIKLARI (BLOBS) */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 dark:bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none"></div>

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
               className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${i18n.language === 'tr' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
             >
               TR
             </button>
             <button 
               onClick={() => changeLanguage('en')}
               className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${i18n.language === 'en' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
             >
               EN
             </button>
        </div>
      </div>

      {/* SOL TARAF (İNFOGRAFİK / MOTİVASYON ALANI) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="max-w-md w-full space-y-8 relative">
          
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/30">
              <span className="text-3xl leading-none">🐋</span>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">WhaleStreet</h1>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Bütçeni Kur,<br/><span className="text-purple-600 dark:text-purple-400">Geleceğini İnşa Et.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Finansal bağımsızlık bir tık uzağında. Kayıt ol ve hemen bugün paranı doğru yönetmeye başla.
            </p>
          </div>

          {/* Sahte Topluluk Motivasyon Kartı (Glassmorphism) */}
          <div className="mt-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/60 dark:border-gray-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-gradient-to-br from-purple-400/20 to-fuchsia-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex -space-x-4">
                <img className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 object-cover" src="https://i.pravatar.cc/150?img=32" alt="Kullanıcı" />
                <img className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 object-cover" src="https://i.pravatar.cc/150?img=12" alt="Kullanıcı" />
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  +10k
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mt-1">Büyük Bir Okyanus! 🌊</h4>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wide mt-0.5">Binlerce yatırımcıya katıl.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-500 mt-8">
            <FiShield size={18} className="text-purple-500" />
            <span>Verilerin asla üçüncü şahıslarla paylaşılmaz.</span>
          </div>

        </div>
      </div>

      {/* SAĞ TARAF (KAYIT FORMU) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          
          {/* Sadece mobilde görünen Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl leading-none">🐋</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">WhaleStreet</h1>
          </div>

          {/* Form Kartı */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
            
            <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-800/50 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('register_title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Saniyeler içinde hesabını oluştur.</p>
            </div>

            <div className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">{t('name')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-500 text-gray-400">
                      <FiUser size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">{t('email')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-500 text-gray-400">
                      <FiMail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                      placeholder="ornek@mail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">{t('password')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-500 text-gray-400">
                      <FiLock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-medium tracking-widest"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* 👇 YENİ: Kullanım Koşulları Checkbox'ı */}
                <div className="flex items-center mt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        required
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all flex items-center justify-center">
                        <svg className={`w-3 h-3 text-white pointer-events-none transition-transform duration-200 ${acceptTerms ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">
                      <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Kullanım Koşullarını</a> ve <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Gizlilik Politikasını</a> kabul ediyorum.
                    </span>
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform active:scale-95"
                  >
                    {t('register_button')} <FiUsers size={20} />
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('already_have_account')}{' '}
                <Link to="/login" className="text-purple-600 dark:text-purple-400 font-extrabold hover:underline transition-all">
                  {t('login_button')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;