import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FiTrendingUp, FiTrendingDown, FiGlobe, FiActivity, FiDollarSign, FiZap, FiBookOpen, FiBriefcase, FiTarget, FiStar, FiPlus, FiX, FiSave, FiSearch } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import toast from 'react-hot-toast';

// --- STİL & ANİMASYON ---
const marqueeStyle = `
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-scroll {
  display: flex;
  width: max-content;
  animation: scroll 60s linear infinite;
}
.animate-scroll:hover {
  animation-play-state: paused;
}
/* Modal Animasyonu */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
`;

// --- MOCK DATA (SADELEŞTİRİLMİŞ - 7 ADET) ---
const MOCK_STOCKS = [
    { id: 'thyao', symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Ulaşım', price: 285.50, change: 1.25, marketCap: '390B ₺', sparkline: [280, 282, 279, 281, 284, 283, 285.5] },
    { id: 'tuprs', symbol: 'TUPRS', name: 'Tüpraş', sector: 'Enerji', price: 168.40, change: 0.90, marketCap: '320B ₺', sparkline: [160, 162, 165, 164, 166, 167, 168.4] },
    { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', sector: 'Teknoloji', price: 175.80, change: -0.45, marketCap: '2.8T $', sparkline: [178, 177, 176, 175, 176, 175, 175.8] },
    { id: 'sasa', symbol: 'SASA', name: 'SASA Polyester', sector: 'Kimya', price: 38.40, change: 2.10, marketCap: '200B ₺', sparkline: [36, 36.5, 37, 36.8, 37.5, 38, 38.4] },
    { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Otomotiv', price: 210.30, change: 3.50, marketCap: '700B $', sparkline: [200, 202, 205, 204, 208, 209, 210.3] },
    { id: 'garan', symbol: 'GARAN', name: 'Garanti BBVA', sector: 'Finans', price: 68.20, change: -1.10, marketCap: '280B ₺', sparkline: [70, 69.5, 69, 68.8, 69, 68.5, 68.2] },
    { id: 'eregl', symbol: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'Sanayi', price: 42.10, change: 0.80, marketCap: '145B ₺', sparkline: [41, 41.2, 41.5, 41.3, 41.8, 42, 42.1] },
];

const MarketPage = () => {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crypto'); 
  const [marketSentiment] = useState(Math.floor(Math.random() * (80 - 40 + 1)) + 40);
  
  // MODAL & FORM STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState(''); // Yeni Arama State'i

  // TAKİP LİSTESİ STATE
  const [watchlist, setWatchlist] = useState(() => {
      const saved = localStorage.getItem('userWatchlist');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('userWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (item) => {
      const exists = watchlist.find(w => w.id === item.id);
      if (exists) {
          setWatchlist(watchlist.filter(w => w.id !== item.id));
          toast.success(`${item.symbol || item.name} favorilerden çıkarıldı`);
      } else {
          setWatchlist([...watchlist, { ...item, type: activeTab === 'crypto' ? 'crypto' : 'stock' }]);
          toast.success(`${item.symbol || item.name} favorilere eklendi`);
      }
  };

  // OTOMATİK VARLIK BULMA VE EKLEME
  const handleAddAsset = (e) => {
      e.preventDefault();
      if(!searchSymbol) return toast.error(t('enter_symbol_error') || "Lütfen bir sembol girin.");

      const symbolUpper = searchSymbol.toUpperCase();

      // 1. Önce Hisselerde Ara
      const foundStock = MOCK_STOCKS.find(s => s.symbol === symbolUpper);
      if (foundStock) {
          if(watchlist.find(w => w.id === foundStock.id)) {
              toast.error(t('already_in_watchlist') || "Bu varlık zaten listenizde.");
          } else {
              setWatchlist([...watchlist, { ...foundStock, type: 'stock' }]);
              toast.success(`${foundStock.symbol} ${t('added_success') || "başarıyla eklendi!"}`);
              setIsModalOpen(false);
              setSearchSymbol('');
              setActiveTab('watchlist');
          }
          return;
      }

      // 2. Sonra Kriptolarda Ara (CoinGecko'dan gelen listede)
      if (marketData?.crypto) {
          const foundCrypto = marketData.crypto.find(c => c.symbol.toUpperCase() === symbolUpper || c.name.toUpperCase() === symbolUpper);
          if (foundCrypto) {
              if(watchlist.find(w => w.id === foundCrypto.id)) {
                  toast.error(t('already_in_watchlist') || "Bu varlık zaten listenizde.");
              } else {
                  setWatchlist([...watchlist, { ...foundCrypto, type: 'crypto' }]);
                  toast.success(`${foundCrypto.symbol.toUpperCase()} ${t('added_success') || "başarıyla eklendi!"}`);
                  setIsModalOpen(false);
                  setSearchSymbol('');
                  setActiveTab('watchlist');
              }
              return;
          }
      }

      // Bulunamazsa
      toast.error(t('asset_not_found') || "Varlık bulunamadı. Lütfen geçerli bir sembol (BTC, THYAO vb.) girin.");
  };

  const investmentQuotes = [
    { text: "Hisse senedi piyasası, sabırsızlardan sabırlılara para aktaran bir araçtır.", author: "Warren Buffett" },
    { text: "Anlamadığınız bir şeye asla yatırım yapmayın.", author: "Peter Lynch" },
    { text: "Başkaları açgözlü olduğunda kork, başkaları korktuğunda açgözlü ol.", author: "Warren Buffett" },
    { text: "Fiyat ödediğinizdir, değer ise aldığınızdır.", author: "Benjamin Graham" },
    { text: "Piyasalarla inatlaşmayın, trend sizin dostunuzdur.", author: "Borsa Atasözü" }
  ];

  const handleGetAdvice = () => {
    const randomQuote = investmentQuotes[Math.floor(Math.random() * investmentQuotes.length)];
    toast.custom((toastItem) => (
      <div className={`${toastItem.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-indigo-500/50 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="flex-1 w-0 p-5 relative z-10">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-1"><span className="text-2xl filter drop-shadow-md">💡</span></div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">{t('daily_tip')}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">"{randomQuote.text}"</p>
              <p className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 text-right tracking-wide">— {randomQuote.author}</p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const fetchMarket = async () => {
    try {
      const res = await api.get('/market');
      setMarketData(res.data);
    } catch (error) {
      console.error("Piyasa verisi alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculateGramGold = () => {
    if (!marketData?.rates?.TRY) return 0;
    const mockOns = 2650; 
    const usdTry = marketData.rates.TRY;
    return ((mockOns / 31.1035) * usdTry).toFixed(2);
  };

  const MiniChart = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    const chartData = data.map((val, i) => ({ i, val }));
    return (
      <div className="h-10 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} />
            <YAxis domain={['dataMin', 'dataMax']} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TickerContent = () => (
    <>
        <span className="flex items-center gap-2 text-green-400 font-bold mx-6"><FiTrendingUp /> BIST 100: <span className="text-gray-200">9,850.50</span></span>
        <span className="flex items-center gap-2 text-yellow-400 font-bold mx-6"><FiBriefcase /> Gram Altın: <span className="text-gray-200">{calculateGramGold()} ₺</span></span>
        <span className="flex items-center gap-2 text-green-500 font-bold mx-6"><FiDollarSign /> USD/TRY: <span className="text-gray-200">{marketData?.rates?.TRY?.toFixed(2)} ₺</span></span>
        <span className="flex items-center gap-2 text-blue-400 font-bold mx-6">€ EUR/TRY: <span className="text-gray-200">{(marketData?.rates?.TRY / marketData?.rates?.EUR)?.toFixed(2)} ₺</span></span>
        {marketData?.crypto?.[0] && <span className="flex items-center gap-2 text-orange-500 font-bold mx-6">₿ BTC: <span className="text-gray-200">${marketData.crypto[0].current_price.toLocaleString()}</span></span>}
        {MOCK_STOCKS.map(stock => (
             <span key={`ticker-${stock.id}`} className="flex items-center gap-2 font-bold mx-6">
                <span className={stock.change >= 0 ? "text-green-400" : "text-red-400"}>{stock.symbol}:</span>
                <span className="text-gray-200">{stock.price} ₺ <span className={`text-xs ml-1 ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>({stock.change}%)</span></span>
             </span>
        ))}
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300 font-sans">
      <style>{marqueeStyle}</style>
      <Sidebar />

      <div className="flex-1 overflow-y-auto flex flex-col">
        
        {/* ÜST KAYAN BANT */}
        <div className="bg-[#1E293B] dark:bg-black/80 backdrop-blur-md text-white h-12 overflow-hidden relative shadow-sm z-20 flex items-center border-b border-gray-700/50">
           <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#1E293B] dark:from-black to-transparent z-10"></div>
           <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#1E293B] dark:from-black to-transparent z-10"></div>
           <div className="animate-scroll whitespace-nowrap text-sm font-medium tracking-wide">
              <div className="flex items-center"><TickerContent /> <span className="text-gray-600 mx-4">|</span> <TickerContent /></div>
           </div>
        </div>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full relative">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none"><FiGlobe size={24} /></div>
                {t('market_center')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">{t('market_subtitle')}</p>
            </div>
            {marketData && (
                <div className="text-right hidden md:block bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">{t('last_updated')}</p>
                    <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{new Date(marketData.lastUpdated).toLocaleTimeString()}</p>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* SOL TARAF: VARLIK TABLOSU */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
                    
                    {/* TAB HEADER */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 flex-wrap">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveTab('crypto')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'crypto' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-gray-100 dark:ring-gray-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                <FiActivity /> {t('popular_crypto')}
                            </button>
                            <button onClick={() => setActiveTab('stocks')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'stocks' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-gray-100 dark:ring-gray-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                <FiBriefcase /> {t('popular_stocks')}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={() => setActiveTab('watchlist')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'watchlist' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shadow-sm ring-1 ring-yellow-200 dark:ring-yellow-700' : 'text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400'}`}>
                                <FiStar className={activeTab === 'watchlist' ? 'fill-current' : ''} /> {t('watchlist') || "Takip Listem"}
                            </button>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all dark:shadow-none"
                            >
                                <FiPlus /> {t('add_asset') || "Ekle"}
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                                    <th className="p-4 font-semibold w-10"></th> 
                                    <th className="p-4 font-semibold">{t('asset')}</th>
                                    <th className="p-4 font-semibold text-right">{t('price')}</th>
                                    <th className="p-4 font-semibold text-right">{t('change_24h')}</th>
                                    <th className="p-4 font-semibold text-right hidden md:table-cell">{t('trend_7d')}</th>
                                    <th className="p-4 font-semibold text-right hidden lg:table-cell">{t('market_cap')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-500">{t('loading')}</td></tr>
                                ) : activeTab === 'watchlist' ? (
                                    watchlist.length > 0 ? watchlist.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                            <td className="p-4">
                                                <button onClick={() => toggleWatchlist(item)} className="text-yellow-400 hover:text-yellow-500 transition-colors">
                                                    <FiStar className="fill-current" />
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-9 h-9 rounded-full shadow-sm" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800">
                                                            {item.symbol.substring(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-white">{item.symbol.toUpperCase()}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium text-gray-700 dark:text-gray-200">
                                                {item.current_price 
                                                    ? `$${item.current_price.toLocaleString()}` 
                                                    : item.currency === 'USD' 
                                                        ? `$${item.price.toLocaleString()}` 
                                                        : `${item.price.toLocaleString()} ₺`
                                                }
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? <FiTrendingUp className="mr-1"/> : <FiTrendingDown className="mr-1"/>}
                                                    {parseFloat(item.price_change_percentage_24h || item.change)?.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-4 hidden md:table-cell align-middle">
                                                <div className="flex justify-end opacity-80">
                                                    <MiniChart data={item.sparkline_in_7d?.price || item.sparkline} color={parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? '#10B981' : '#EF4444'} />
                                                </div>
                                            </td>
                                            <td className="p-4 text-right hidden lg:table-cell text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                {item.market_cap ? `$${(parseFloat(item.market_cap) / 1000000000).toFixed(2)}B` : item.marketCap || '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                                            <FiStar className="text-4xl text-gray-300" />
                                            <span>{t('watchlist_empty') || "Listeniz boş. Yıldız ikonuna veya 'Ekle' butonuna basarak ekleme yapabilirsiniz."}</span>
                                        </td></tr>
                                    )
                                ) : (
                                    (activeTab === 'crypto' ? marketData?.crypto : MOCK_STOCKS)?.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                            <td className="p-4">
                                                <button onClick={() => toggleWatchlist(item)} className="text-gray-300 hover:text-yellow-400 transition-colors">
                                                    <FiStar className={watchlist.some(w => w.id === item.id) ? "fill-current text-yellow-400" : ""} />
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-9 h-9 rounded-full shadow-sm" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800">
                                                            {item.symbol.substring(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-white">{item.symbol.toUpperCase()}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium text-gray-700 dark:text-gray-200">
                                                {item.current_price ? `$${item.current_price.toLocaleString()}` : `${item.price.toLocaleString()} ₺`}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? <FiTrendingUp className="mr-1"/> : <FiTrendingDown className="mr-1"/>}
                                                    {parseFloat(item.price_change_percentage_24h || item.change)?.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-4 hidden md:table-cell align-middle">
                                                <div className="flex justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <MiniChart data={item.sparkline_in_7d?.price || item.sparkline} color={parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? '#10B981' : '#EF4444'} />
                                                </div>
                                            </td>
                                            <td className="p-4 text-right hidden lg:table-cell text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                {item.market_cap ? `$${(parseFloat(item.market_cap) / 1000000000).toFixed(2)}B` : item.marketCap || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SAĞ TARAF: WIDGETLAR (Aynen Korundu) */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 text-lg"><FiDollarSign className="text-green-500" /> {t('currency_rates')}</h3>
                    {loading ? (<p className="text-sm text-gray-400 text-center">{t('loading')}</p>) : (
                        <div className="space-y-4">
                            {[{ code: 'USD', flag: '🇺🇸', name: 'Amerikan Doları' }, { code: 'EUR', flag: '🇪🇺', name: 'Avrupa Eurosu' }, { code: 'GBP', flag: '🇬🇧', name: 'İngiliz Sterlini' }].map((item) => {
                                const rate = item.code === 'USD' ? marketData?.rates?.TRY : (marketData?.rates?.TRY / marketData?.rates?.[item.code]);
                                return (
                                    <div key={item.code} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-3"><span className="text-2xl drop-shadow-sm">{item.flag}</span><div><p className="text-sm font-bold text-gray-800 dark:text-white">{item.code} / TRY</p><p className="text-xs text-gray-400">{item.name}</p></div></div><p className="text-base font-mono font-bold text-gray-800 dark:text-white">{rate?.toFixed(2)} ₺</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg"><FiTarget className="text-purple-500" /> {t('market_sentiment')}</h3>
                    <div className="flex flex-col items-center">
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full transition-all duration-1000 ${marketSentiment > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${marketSentiment}%` }}></div></div>
                        <div className="flex justify-between w-full text-xs font-bold text-gray-500 dark:text-gray-400"><span>{t('fear')}</span><span className={marketSentiment > 50 ? 'text-green-500' : 'text-red-500'}>{marketSentiment > 50 ? (t('greed')) : (t('fear'))} ({marketSentiment})</span><span>{t('greed')}</span></div>
                    </div>
                </div>
                <div onClick={handleGetAdvice} className="group relative overflow-hidden rounded-2xl p-5 cursor-pointer transform transition-all hover:-translate-y-1 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-200 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border dark:border-indigo-500/30 dark:shadow-indigo-500/20">
                    <div className="flex justify-between items-start relative z-10">
                        <div><h4 className="font-bold text-lg flex items-center gap-2 text-white dark:text-indigo-400 drop-shadow-sm"><FiZap className="text-yellow-300 dark:text-yellow-400 animate-pulse" /> {t('daily_tip')}</h4><p className="text-indigo-100 dark:text-gray-400 text-xs mt-1 opacity-90">{t('daily_tip_desc')}</p></div>
                        <div className="bg-white/20 dark:bg-indigo-500/10 p-2 rounded-lg group-hover:bg-white/30 dark:group-hover:bg-indigo-500/20 transition-colors text-white dark:text-indigo-300"><FiBookOpen size={20} /></div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- ADD ASSET MODAL (OTOMATİK BULUCU) --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in border border-gray-100 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('add_asset') || "Varlık Ekle"}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <FiX size={24} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleAddAsset} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('asset_symbol') || "Varlık Sembolü"}</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Örn: BTC, THYAO, AAPL" 
                                    value={searchSymbol}
                                    onChange={(e) => setSearchSymbol(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase"
                                />
                                <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * {t('asset_search_hint') || "Sadece listedeki popüler hisse ve kriptoları ekleyebilirsiniz."}
                            </p>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <FiPlus /> {t('add_to_list') || "Listeye Ekle"}
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default MarketPage;