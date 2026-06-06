import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FiTrendingUp, FiTrendingDown, FiGlobe, FiActivity, FiDollarSign, FiZap, FiBookOpen, FiBriefcase, FiTarget, FiStar, FiPlus, FiX, FiSearch } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import toast from 'react-hot-toast';

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
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

const MarketPage = () => {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crypto'); 
  const [marketSentiment] = useState(Math.floor(Math.random() * (80 - 40 + 1)) + 40);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState('');

  const [watchlist, setWatchlist] = useState(() => {
      const saved = localStorage.getItem('userWatchlist');
      return saved ? JSON.parse(saved) : [];
  });

  const [liveWatchlist, setLiveWatchlist] = useState([]);

  useEffect(() => {
      localStorage.setItem('userWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
      if (!watchlist || watchlist.length === 0) {
          setLiveWatchlist([]);
          return;
      }

      // 🚀 MOCK VERİSİ KALDIRILDI, SADECE CANLI VERİ
      const liveStocksData = marketData?.stocks || [];

      const updatedWatchlist = watchlist.map(savedItem => {
          if (savedItem.type === 'stock') {
              const liveStock = liveStocksData.find(s => s.id === savedItem.id);
              return liveStock ? { ...liveStock, type: 'stock' } : savedItem;
          } else if (savedItem.type === 'crypto' && marketData?.crypto) {
              const liveCrypto = marketData.crypto.find(c => c.id === savedItem.id);
              return liveCrypto ? { ...liveCrypto, type: 'crypto' } : savedItem;
          }
          return savedItem;
      });

      setLiveWatchlist(updatedWatchlist);
  }, [watchlist, marketData]);

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

  const handleAddAsset = (e) => {
      e.preventDefault();
      if(!searchSymbol) return toast.error(t('enter_symbol_error') || "Lütfen bir sembol girin.");

      const symbolUpper = searchSymbol.toUpperCase();
      const liveStocksData = marketData?.stocks || [];

      const foundStock = liveStocksData.find(s => s.symbol.toUpperCase() === symbolUpper);
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

      toast.error(t('asset_not_found') || "Varlık bulunamadı. Lütfen geçerli bir sembol girin.");
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
      <div className={`${toastItem.visible ? 'animate-fade-in' : 'opacity-0 scale-95'} max-w-md w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-blue-500/30 rounded-2xl pointer-events-auto flex relative overflow-hidden transition-all duration-300`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="flex-1 w-0 p-5 relative z-10">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-1"><span className="text-2xl filter drop-shadow-md">🐋</span></div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">{t('daily_tip')}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">"{randomQuote.text}"</p>
              <p className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 text-right tracking-wide">— {randomQuote.author}</p>
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
      <div className="h-10 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <YAxis domain={['dataMin', 'dataMax']} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TickerContent = () => {
    const topCryptos = marketData?.crypto?.slice(0, 5) || [];
    const liveStocksData = marketData?.stocks || []; // 🚀 Mock kaldırıldı
    
    return (
      <>
          <span className="flex items-center gap-2 text-emerald-400 font-bold mx-6"><FiTrendingUp /> BIST 100: <span className="text-gray-200">9,850.50</span></span>
          <span className="flex items-center gap-2 text-amber-400 font-bold mx-6"><FiBriefcase /> Gram Altın: <span className="text-gray-200">{calculateGramGold()} ₺</span></span>
          <span className="flex items-center gap-2 text-emerald-500 font-bold mx-6"><FiDollarSign /> USD/TRY: <span className="text-gray-200">{marketData?.rates?.TRY?.toFixed(2)} ₺</span></span>
          <span className="flex items-center gap-2 text-blue-400 font-bold mx-6">€ EUR/TRY: <span className="text-gray-200">{(marketData?.rates?.TRY / marketData?.rates?.EUR)?.toFixed(2)} ₺</span></span>
          
          {topCryptos.map(c => (
              <span key={`ticker-c-${c.id}`} className="flex items-center gap-2 font-bold mx-6">
                  <span className={c.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-rose-400"}>{c.symbol.toUpperCase()}:</span>
                  <span className="text-gray-200">${c.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})} <span className={`text-xs ml-1 ${c.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>({c.price_change_percentage_24h?.toFixed(2)}%)</span></span>
              </span>
          ))}

          {liveStocksData.map(stock => (
              <span key={`ticker-${stock.id}`} className="flex items-center gap-2 font-bold mx-6">
                  <span className={stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}>{stock.symbol}:</span>
                  <span className="text-gray-200">
                      {stock.price.toLocaleString(undefined, {minimumFractionDigits: 2})} {stock.currency === 'TRY' ? '₺' : '$'}
                      <span className={`text-xs ml-1 ${stock.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>({stock.change}%)</span>
                  </span>
              </span>
          ))}
      </>
    );
  };

  const getActiveTabData = () => {
      if (activeTab === 'crypto') return marketData?.crypto || [];
      return marketData?.stocks || [];
  }

  const currentDataList = getActiveTabData();

  return (
    <div className="flex h-screen bg-[#F3F6F9] dark:bg-[#0B1120] transition-colors duration-300 font-sans selection:bg-blue-500/30">
      <style>{marqueeStyle}</style>
      <Sidebar />

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col relative">
        
        <div className="sticky top-0 z-50 bg-[#0f172a]/90 dark:bg-black/90 backdrop-blur-xl text-white h-12 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.1)] flex items-center border-b border-gray-800/50">
           <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0f172a] dark:from-black to-transparent z-10 pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0f172a] dark:from-black to-transparent z-10 pointer-events-none"></div>
           
           <div className="animate-scroll whitespace-nowrap text-[13px] font-medium tracking-wide">
              <div className="flex items-center"><TickerContent /> <span className="text-gray-600 dark:text-gray-800 mx-4">|</span> <TickerContent /></div>
           </div>
        </div>

        <div className="p-6 md:p-10 max-w-[1920px] mx-auto w-full relative z-0">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30"><FiGlobe size={24} strokeWidth={2.5}/></div>
                {t('market_center')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('market_subtitle')}</p>
            </div>
            {marketData && (
                <div className="text-right hidden md:flex items-center gap-3 bg-white dark:bg-gray-800/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-700/50 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{t('last_updated')}</p>
                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200 leading-none">{new Date(marketData.lastUpdated).toLocaleTimeString()}</p>
                    </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 flex flex-col h-[600px]">
                    
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                        <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-2xl backdrop-blur-md w-full sm:w-auto">
                            <button onClick={() => setActiveTab('crypto')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'crypto' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                <FiActivity /> <span className="hidden sm:inline">{t('popular_crypto')}</span><span className="sm:hidden">Kripto</span>
                            </button>
                            <button onClick={() => setActiveTab('stocks')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'stocks' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                <FiBriefcase /> <span className="hidden sm:inline">{t('popular_stocks')}</span><span className="sm:hidden">Hisse</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button onClick={() => setActiveTab('watchlist')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border ${activeTab === 'watchlist' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700'}`}>
                                <FiStar className={activeTab === 'watchlist' ? 'fill-current' : ''} size={16} /> <span className="hidden sm:inline">{t('watchlist')}</span>
                            </button>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 border-none"
                            >
                                <FiPlus size={18} /> <span className="hidden sm:inline">{t('add_asset')}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-auto flex-1 scrollbar-hide relative rounded-b-3xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-xs font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/95 dark:bg-[#151E2D]/95 backdrop-blur-md shadow-sm">
                                    <th className="p-5 w-12 text-center"></th> 
                                    <th className="p-5">{t('asset')}</th>
                                    <th className="p-5 text-right">{t('price')}</th>
                                    <th className="p-5 text-right">{t('change_24h')}</th>
                                    <th className="p-5 text-right hidden md:table-cell">{t('trend_7d')}</th>
                                    <th className="p-5 text-right hidden lg:table-cell">{t('market_cap')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-800/50">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-16 text-center text-gray-400 font-bold"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>Yükleniyor...</td></tr>
                                ) : activeTab === 'watchlist' ? (
                                    liveWatchlist.length > 0 ? liveWatchlist.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="p-5 text-center">
                                                <button onClick={() => toggleWatchlist(item)} className="text-amber-400 hover:scale-110 transition-transform">
                                                    <FiStar className="fill-current" size={18} />
                                                </button>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full shadow-sm bg-white p-0.5" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800/50">
                                                            {item.symbol.substring(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 dark:text-white tracking-tight">{item.symbol.toUpperCase()}</p>
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-extrabold text-gray-900 dark:text-gray-200">
                                                {item.current_price 
                                                    ? `$${item.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}` 
                                                    : item.currency === 'USD' 
                                                        ? `$${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                                                        : `${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺`
                                                }
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                                    {parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? <FiTrendingUp className="mr-1" strokeWidth={3}/> : <FiTrendingDown className="mr-1" strokeWidth={3}/>}
                                                    {parseFloat(item.price_change_percentage_24h || item.change)?.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-5 hidden md:table-cell align-middle">
                                                <div className="flex justify-end">
                                                    <MiniChart data={item.sparkline_in_7d?.price || item.sparkline} color={parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? '#10B981' : '#F43F5E'} />
                                                </div>
                                            </td>
                                            <td className="p-5 text-right hidden lg:table-cell text-gray-500 dark:text-gray-400 font-bold text-xs tracking-wider">
                                                {item.market_cap ? `$${(parseFloat(item.market_cap) / 1000000000).toFixed(2)}B` : item.marketCap ? (typeof item.marketCap === 'number' ? `${(item.marketCap / 1e9).toFixed(2)}B ${item.currency==='TRY'?'₺':'$'}` : item.marketCap) : '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="p-16 text-center text-gray-400 flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center"><FiStar className="text-2xl text-gray-300 dark:text-gray-600" /></div>
                                            <span className="font-bold">{t('watchlist_empty') || "Listeniz boş."}</span>
                                            <span className="text-xs">Yıldız ikonuna veya 'Ekle' butonuna basarak ekleme yapabilirsiniz.</span>
                                        </td></tr>
                                    )
                                ) : (
                                    currentDataList.length > 0 ? (
                                        currentDataList.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <td className="p-5 text-center">
                                                    <button onClick={() => toggleWatchlist(item)} className="text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:scale-110 transition-all">
                                                        <FiStar className={watchlist.some(w => w.id === item.id) ? "fill-current text-amber-400" : ""} size={18} />
                                                    </button>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full shadow-sm bg-white p-0.5" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800/50">
                                                                {item.symbol.substring(0, 2)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-extrabold text-gray-900 dark:text-white tracking-tight">{item.symbol.toUpperCase()}</p>
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right font-extrabold text-gray-900 dark:text-gray-200">
                                                    {item.current_price ? `$${item.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}` : `${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})} ${item.currency === 'TRY' ? '₺' : '$'}`}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                                        {parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? <FiTrendingUp className="mr-1" strokeWidth={3}/> : <FiTrendingDown className="mr-1" strokeWidth={3}/>}
                                                        {parseFloat(item.price_change_percentage_24h || item.change)?.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="p-5 hidden md:table-cell align-middle">
                                                    <div className="flex justify-end">
                                                        <MiniChart data={item.sparkline_in_7d?.price || item.sparkline} color={parseFloat(item.price_change_percentage_24h || item.change) >= 0 ? '#10B981' : '#F43F5E'} />
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right hidden lg:table-cell text-gray-500 dark:text-gray-400 font-bold text-xs tracking-wider">
                                                    {item.market_cap ? `$${(parseFloat(item.market_cap) / 1000000000).toFixed(2)}B` : item.marketCap ? (typeof item.marketCap === 'number' ? `${(item.marketCap / 1e9).toFixed(2)}B ${item.currency==='TRY'?'₺':'$'}` : item.marketCap) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-16 text-center text-gray-500 dark:text-gray-400 font-medium">Canlı veriler çekiliyor, lütfen bekleyin...</td></tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                
                <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 p-8">
                    <h3 className="font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg tracking-tight">
                        <div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div> {t('currency_rates')}
                    </h3>
                    {loading ? (<div className="animate-pulse flex flex-col gap-4"><div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div><div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div></div>) : (
                        <div className="space-y-4">
                            {[{ code: 'USD', flag: '🇺🇸', name: 'Amerikan Doları' }, { code: 'EUR', flag: '🇪🇺', name: 'Avrupa Eurosu' }, { code: 'GBP', flag: '🇬🇧', name: 'İngiliz Sterlini' }].map((item) => {
                                const rate = item.code === 'USD' ? marketData?.rates?.TRY : (marketData?.rates?.TRY / marketData?.rates?.[item.code]);
                                return (
                                    <div key={item.code} className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl drop-shadow-sm">{item.flag}</span>
                                            <div>
                                                <p className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">{item.code} <span className="text-gray-400 font-medium">/ TRY</span></p>
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{item.name}</p>
                                            </div>
                                        </div>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">{rate?.toFixed(2)} <span className="text-gray-500">₺</span></p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 p-8">
                    <h3 className="font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg tracking-tight">
                         <div className="w-2.5 h-6 bg-purple-500 rounded-full"></div> {t('market_sentiment')}
                    </h3>
                    <div className="flex flex-col items-center">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden mb-3 shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${marketSentiment > 50 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`} style={{ width: `${marketSentiment}%` }}></div>
                        </div>
                        <div className="flex justify-between w-full text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                            <span>{t('fear')}</span>
                            <span className={marketSentiment > 50 ? 'text-emerald-500' : 'text-rose-500'}>{marketSentiment > 50 ? (t('greed')) : (t('fear'))} ({marketSentiment})</span>
                            <span>{t('greed')}</span>
                        </div>
                    </div>
                </div>

                <div onClick={handleGetAdvice} className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h4 className="font-extrabold text-xl flex items-center gap-2 tracking-tight">
                                <span className="text-2xl leading-none">🐋</span> {t('daily_tip')}
                            </h4>
                            <p className="text-blue-100 text-sm mt-2 font-medium opacity-90">{t('daily_tip_desc')}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                            <FiBookOpen size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

            </div>
          </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                           <span className="text-blue-500"><FiPlus size={22} strokeWidth={3} /></span> {t('add_asset') || "Varlık Ekle"}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <FiX size={20} strokeWidth={3} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleAddAsset} className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('asset_symbol') || "Varlık Sembolü"}</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder="Örn: BTC, THYAO, AAPL" 
                                    value={searchSymbol}
                                    onChange={(e) => setSearchSymbol(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase placeholder:normal-case placeholder:font-medium"
                                />
                                <FiSearch className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            </div>
                            <p className="text-xs font-medium text-gray-500 mt-3 flex items-start gap-1">
                                <span className="text-blue-500 font-bold">*</span> Sadece popüler hisse ve kriptoları ekleyebilirsiniz.
                            </p>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 border-none"
                        >
                            <FiPlus size={20} strokeWidth={3}/> {t('add_to_list') || "Listeye Ekle"}
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