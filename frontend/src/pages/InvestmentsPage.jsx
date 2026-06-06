import { useState, useEffect, useMemo } from 'react';
import { getInvestments, addInvestment, deleteInvestment, updatePrice, updatePrices } from '../services/investmentService';
import Sidebar from '../components/Sidebar'; 
import { FiPlus, FiTrash, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiActivity, FiEdit3, FiX, FiSave, FiBriefcase, FiLayers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation(); 

  // exchangeRate state kaldırıldı — kur artık yalnızca CurrencyContext'ten geliyor
  const { currency: displayCurrency, setCurrency: setDisplayCurrency, usdToTry, refreshRates } = useCurrency();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [formData, setFormData] = useState({
    type: 'crypto',
    symbol: '',
    name: '',
    amount: '',
    buyPrice: '',
    currency: 'USD',
    buyDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // fetchExchangeRate kaldırıldı — Context üzerinden refreshRates çağrılıyor
    refreshRates();
    fetchInvestments(); 
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const data = await getInvestments();
      setInvestments(data.investments || []); 
    } catch (error) {
      console.error("Yatırımlar çekilemedi", error);
      toast.error(t('no_data')); 
    } finally {
      setLoading(false);
    }
  };

  const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const clean = String(value).replace(/[^0-9.-]+/g, ""); 
    const number = parseFloat(clean);
    return isNaN(number) ? 0 : number;
  };

  // Dashboard ile aynı usdToTry kullanılıyor — tutarsızlık yok
  const convertValue = (amount, sourceCurrency) => {
    const val = parseFloat(amount) || 0;
    if (sourceCurrency === displayCurrency) return val;

    if (displayCurrency === 'USD') {
      return val / usdToTry;
    } else {
      return val * usdToTry;
    }
  };

  const groupedInvestments = useMemo(() => {
    const groups = {};
    
    investments.forEach(inv => {
        const key = inv.symbol; 
        
        if (!groups[key]) {
            groups[key] = {
                ...inv,
                ids: [inv._id], 
                totalCost: inv.amount * inv.buyPrice 
            };
        } else {
            groups[key].amount += inv.amount;
            groups[key].totalCost += (inv.amount * inv.buyPrice);
            groups[key].ids.push(inv._id);
            groups[key].buyPrice = groups[key].totalCost / groups[key].amount;
            if(inv.currentPrice > 0) groups[key].currentPrice = inv.currentPrice;
        }
    });

    return Object.values(groups);
  }, [investments]);

  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    investments.forEach(inv => {
      const isSourceTRY = (inv.notes && inv.notes.includes('CURRENCY:TRY')) || inv.currency === 'TRY' || (inv.type === 'stock' && !inv.symbol.includes('USD'));
      const sourceCurr = isSourceTRY ? 'TRY' : 'USD';
      
      const amount = parseCurrency(inv.amount);
      const buyPrice = parseCurrency(inv.buyPrice);
      const currentPrice = parseCurrency(inv.currentPrice || buyPrice);

      let investedVal = amount * buyPrice;
      let currentVal = amount * currentPrice;

      totalInvested += convertValue(investedVal, sourceCurr);
      totalCurrent += convertValue(currentVal, sourceCurr);
    });

    const profitLoss = totalCurrent - totalInvested;
    const percentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue: totalCurrent,
      totalProfitLoss: profitLoss,
      totalProfitLossPercentage: percentage.toFixed(2)
    };
  }, [investments, displayCurrency, usdToTry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(t('loading'));
    try {
      let submitData = { ...formData };
      if (!submitData.notes) submitData.notes = `CURRENCY:${formData.currency}`;

      await addInvestment(submitData);
      toast.success(t('updated'), { id: toastId }); 
      fetchInvestments();
      setFormData({ ...formData, symbol: '', name: '', amount: '', buyPrice: '' });
    } catch (error) {
      toast.error(t('failed'), { id: toastId });
    }
  };

  const handleDeleteGroup = async (ids, symbol) => {
    if (window.confirm(t('delete_all_confirm'))) { 
      try {
        await Promise.all(ids.map(id => deleteInvestment(id)));
        toast.success(t('deleted')); 
        fetchInvestments();
      } catch (error) {
        toast.error("Hata");
      }
    }
  };

  const handleEditClick = (group) => {
      setEditingGroup({
          ...group,
          newAmount: group.amount,
          newBuyPrice: group.buyPrice
      });
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
      if(!editingGroup) return;
      
      const toastId = toast.loading(t('updating')); 
      try {
          await Promise.all(editingGroup.ids.map(id => deleteInvestment(id)));

          const newData = {
              type: editingGroup.type,
              symbol: editingGroup.symbol,
              name: editingGroup.name,
              amount: editingGroup.newAmount, 
              buyPrice: editingGroup.newBuyPrice, 
              currency: editingGroup.currency || 'USD',
              notes: editingGroup.notes || `Updated manually`,
              buyDate: new Date().toISOString()
          };

          await addInvestment(newData);
          
          toast.success(t('updated'), { id: toastId });
          setIsEditModalOpen(false);
          setEditingGroup(null);
          fetchInvestments();
      } catch (error) {
          console.error(error);
          toast.error(t('failed'), { id: toastId });
      }
  };
  
  const handleRefreshAll = async () => {
    const toastId = toast.loading(t('updating'));
    try {
        await updatePrices();
        await refreshRates(); // Kurları da Context üzerinden tazele
        toast.success(t('updated'), { id: toastId });
        fetchInvestments(); 
    } catch (error) {
        toast.error(t('failed'), { id: toastId });
    }
  };
  
  const handleUpdatePrice = async (id) => {
      const toastId = toast.loading(t('updating'));
      try {
          await updatePrice(id);
          toast.success(t('updated'), { id: toastId });
          fetchInvestments();
      } catch (error) {
          toast.error(t('failed'), { id: toastId });
      }
  };

  const currSym = displayCurrency === 'TRY' ? '₺' : '$';

  const getAmountLabel = (type) => {
      if(type === 'commodity') return `${t('amount')} (gr/ons)`;
      if(type === 'crypto') return `${t('amount')} (Coin/Token)`;
      return `${t('amount')} (Lot/Adet)`;
  };

  return (
    <div className="flex h-screen bg-[#F3F6F9] dark:bg-[#0B1120] transition-colors duration-300 font-sans selection:bg-indigo-500/30">
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="p-6 md:p-10 max-w-[1920px] mx-auto w-full relative"> 
          
          {/* HEADER ALANI */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-gray-900 dark:bg-white rounded-xl text-white dark:text-gray-900 shadow-md"><FiBriefcase size={22} strokeWidth={2.5}/></div>
                {t('investments')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('portfolio_summary')}</p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* Canlı kur kutucuğu — usdToTry Context'ten geliyor */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#151E2D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-gray-500 dark:text-gray-400">1 USD =</span>
                  <span className="text-gray-900 dark:text-white">{usdToTry.toFixed(2)} ₺</span>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800/90 p-1.5 rounded-xl flex items-center shadow-inner border border-transparent dark:border-gray-700/50">
                  <button onClick={() => setDisplayCurrency('TRY')} className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-300 ${displayCurrency === 'TRY' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>TRY</button>
                  <button onClick={() => setDisplayCurrency('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-300 ${displayCurrency === 'USD' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>USD</button>
              </div>

              <button 
                onClick={handleRefreshAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#151E2D] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-all font-bold text-sm border border-gray-200 dark:border-gray-800 shadow-sm group"
              >
                  <FiRefreshCw className="transition-transform duration-500 group-hover:rotate-180" />
                  {t('refresh_prices')}
              </button>
            </div>
          </div>

          {/* ÖZET KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative bg-white dark:bg-[#151E2D] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="flex items-start justify-between mb-2 mt-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_portfolio_value')}</span>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <FiDollarSign size={18} strokeWidth={2.5} />
                  </div>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{currSym}{summary.totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>

            <div className="relative bg-white dark:bg-[#151E2D] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <div className="flex items-start justify-between mb-2 mt-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_value')}</span>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <FiPieChart size={18} strokeWidth={2.5} />
                  </div>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{currSym}{summary.totalCurrentValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>

            <div className="relative bg-white dark:bg-[#151E2D] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className={`absolute top-0 left-0 w-full h-1 ${summary.totalProfitLoss >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className="flex items-start justify-between mb-2 mt-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_profit_loss')}</span>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <FiActivity size={18} strokeWidth={2.5} />
                  </div>
              </div>
              <div className="flex items-baseline gap-3">
                  <h3 className={`text-3xl font-extrabold tracking-tight ${summary.totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                  {summary.totalProfitLoss >= 0 ? '+' : ''}{summary.totalProfitLoss.toLocaleString(undefined, {minimumFractionDigits: 2})} {currSym}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${summary.totalProfitLoss >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50'}`}>
                      {summary.totalProfitLoss >= 0 ? <FiTrendingUp strokeWidth={3}/> : <FiTrendingDown strokeWidth={3}/>} {summary.totalProfitLossPercentage}%
                  </span>
              </div>
            </div>
          </div>

          {/* EKLEME FORMU */}
          <div className="bg-white dark:bg-[#151E2D] p-7 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <FiLayers className="text-gray-400" size={18} strokeWidth={2.5}/> 
                {t('add_investment')}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('investment_type')}</label>
                  <select 
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none transition-all text-sm font-medium cursor-pointer appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="crypto">Kripto Para</option>
                    <option value="stock">Hisse Senedi</option>
                    <option value="commodity">Altın / Emtia</option>
                  </select>
              </div>

              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('symbol')}</label>
                  <input type="text" placeholder="BTC, THYAO..." 
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none transition-all text-sm font-bold uppercase placeholder:normal-case placeholder:font-medium placeholder:text-gray-400"
                    value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
              </div>
              
              <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('asset_name')}</label>
                  <input type="text" placeholder="Örn: Bitcoin" 
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{getAmountLabel(formData.type)}</label>
                  <input type="number" placeholder="0.00" step="any"
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400"
                    value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              
              <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('buy_price')}</label>
                  <div className="flex gap-2">
                      <input type="number" placeholder="0.00" step="any"
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none transition-all text-sm font-bold placeholder:font-medium placeholder:text-gray-400"
                        value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} required />
                      
                      <select 
                        className="w-24 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 font-bold text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 outline-none cursor-pointer appearance-none text-center"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      >
                        <option value="USD">USD</option>
                        <option value="TRY">TRY</option>
                      </select>
                  </div>
              </div>
              
              <div className="md:col-span-12 flex justify-end mt-4 border-t border-gray-100 dark:border-gray-800 pt-5">
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 px-8 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
                    <FiPlus strokeWidth={2.5}/> {t('add_entry')}
                  </button>
              </div>
            </form>
          </div>

          {/* TABLO */}
          <div className="bg-white dark:bg-[#151E2D] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">{t('asset_name')}</th>
                    <th className="py-4 px-6">{t('amount')}</th>
                    <th className="py-4 px-6">{t('buy_price')}</th>
                    <th className="py-4 px-6">{t('current_price')}</th>
                    <th className="py-4 px-6">{t('profit_loss')}</th>
                    <th className="py-4 px-6 text-right">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {loading ? 
                    <tr><td colSpan="6" className="text-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div><span className="text-gray-400 font-medium">{t('loading')}</span></td></tr> : 
                    groupedInvestments.length === 0 ? 
                    <tr><td colSpan="6" className="text-center py-20 text-gray-400 flex flex-col items-center gap-3"><div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl">📭</div><span className="font-medium">{t('no_data')}</span></td></tr> :
                    groupedInvestments.map((inv) => {
                        const isSourceTRY = (inv.notes && inv.notes.includes('CURRENCY:TRY')) || inv.currency === 'TRY' || (inv.type === 'stock' && !inv.symbol.includes('USD'));
                        const sourceCurr = isSourceTRY ? 'TRY' : 'USD';
                        
                        const buyPriceConverted = convertValue(inv.buyPrice, sourceCurr);
                        const currentPriceConverted = convertValue(inv.currentPrice || inv.buyPrice, sourceCurr);

                        let badgeClass = "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
                        if(inv.type === 'crypto') badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50";
                        else if(inv.type === 'stock') badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
                        else if(inv.type === 'commodity') badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50";

                        const plPercent = inv.currentPrice ? (((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100) : 0;
                        const isProfit = plPercent >= 0;

                        return (
                        <tr key={inv.symbol} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                            <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${badgeClass}`}>
                                    <span className="font-bold text-[10px] tracking-widest">{inv.symbol.substring(0,3)}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 dark:text-white block text-sm">{inv.name}</span>
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">{inv.symbol} • {inv.type}</span>
                                </div>
                            </div>
                            </td>
                            <td className="py-4 px-6">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{inv.amount}</span>
                                <span className="text-[10px] font-medium text-gray-400 uppercase ml-1">{inv.type === 'commodity' ? 'gr' : ''}</span>
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                                {currSym}{buyPriceConverted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                                        {inv.currentPrice ? `${currSym}${currentPriceConverted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}` : '---'}
                                    </span>
                                    <button 
                                        onClick={() => handleUpdatePrice(inv.ids[0])} 
                                        title="Fiyatı Güncelle" 
                                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <FiRefreshCw size={12}/>
                                    </button>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                            {inv.buyPrice > 0 ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                                    isProfit ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'
                                }`}>
                                    {inv.currentPrice ? (
                                        <>
                                            {isProfit ? <FiTrendingUp className="mr-1" strokeWidth={2.5}/> : <FiTrendingDown className="mr-1" strokeWidth={2.5}/>}
                                            {isProfit ? '+' : ''}{plPercent.toFixed(2)}%
                                        </>
                                    ) : '-'}
                                </span>
                            ) : (
                                <span className="text-gray-300">-</span>
                            )}
                            </td>
                            <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => handleEditClick(inv)} 
                                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Düzenle"
                                    >
                                        <FiEdit3 size={16} />
                                    </button>

                                    <button 
                                        onClick={() => handleDeleteGroup(inv.ids, inv.symbol)} 
                                        className="text-gray-400 hover:text-rose-600 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Sil"
                                    >
                                        <FiTrash size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* DÜZENLEME MODALI */}
        {isEditModalOpen && editingGroup && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiEdit3 className="text-gray-500" /> Varlık Düzenle
                        </h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded-full transition-colors"><FiX size={18}/></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Seçili Varlık</label>
                            <div className="font-bold text-gray-900 dark:text-white text-base">{editingGroup.name} <span className="text-gray-500 text-sm ml-1">{editingGroup.symbol}</span></div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Yeni Toplam Miktar</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none font-bold transition-all"
                                value={editingGroup.newAmount}
                                onChange={(e) => setEditingGroup({...editingGroup, newAmount: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Ortalama Alış Fiyatı ({editingGroup.currency})</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 outline-none font-bold transition-all"
                                value={editingGroup.newBuyPrice}
                                onChange={(e) => setEditingGroup({...editingGroup, newBuyPrice: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">İptal</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <FiSave /> Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default InvestmentsPage;
