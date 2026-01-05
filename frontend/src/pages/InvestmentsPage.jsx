import { useState, useEffect, useMemo } from 'react';
import { getInvestments, addInvestment, deleteInvestment, updatePrice, updatePrices } from '../services/investmentService';
import Sidebar from '../components/Sidebar'; 
import { FiPlus, FiTrash, FiRefreshCw, FiTrendingUp, FiDollarSign, FiPieChart, FiActivity, FiEdit3, FiX, FiSave } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // 👈 YENİ: Çeviri kütüphanesi

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Çeviri kancası
  const { t } = useTranslation(); 

  // Global state
  const { currency: displayCurrency, setCurrency: setDisplayCurrency } = useCurrency();
  
  // Not: Her sayfa kendi kurunu taze çekmeye devam etsin
  const [exchangeRate, setExchangeRate] = useState(36.50);

  // Düzenleme Modalı State'leri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Form Verileri
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
    const fetchExchangeRate = async () => {
        try {
            const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
            const data = await response.json();
            if (data && data.rates && data.rates.TRY) {
                setExchangeRate(data.rates.TRY);
            }
        } catch (error) {
            console.error("Kur çekilemedi, varsayılan kullanılıyor:", error);
        }
    };

    fetchExchangeRate();
    fetchInvestments(); 
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const data = await getInvestments();
      setInvestments(data.investments || []); 
    } catch (error) {
      console.error("Yatırımlar çekilemedi", error);
      toast.error(t('no_data')); // Çeviri
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

  const convertValue = (amount, sourceCurrency) => {
    const val = parseFloat(amount) || 0;
    if (sourceCurrency === displayCurrency) return val;

    if (displayCurrency === 'USD') {
      return val / exchangeRate;
    } else {
      return val * exchangeRate;
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
  }, [investments, displayCurrency, exchangeRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(t('loading'));
    try {
      let submitData = { ...formData };
      if (!submitData.notes) submitData.notes = `CURRENCY:${formData.currency}`;

      await addInvestment(submitData);
      toast.success(t('updated'), { id: toastId }); // "Güncellendi/Eklendi"
      fetchInvestments();
      setFormData({ ...formData, symbol: '', name: '', amount: '', buyPrice: '' });
    } catch (error) {
      toast.error(t('failed'), { id: toastId });
    }
  };

  const handleDeleteGroup = async (ids, symbol) => {
    if (window.confirm(t('delete_all_confirm'))) { // Çeviri
      try {
        await Promise.all(ids.map(id => deleteInvestment(id)));
        toast.success(t('deleted')); // Çeviri
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
      
      const toastId = toast.loading(t('updating')); // Çeviri
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

  // Dinamik Label Belirleme (Çeviriye uygun)
  const getAmountLabel = (type) => {
      if(type === 'commodity') return `${t('amount')} (gr)`;
      if(type === 'crypto') return `${t('amount')} (Coin/Token)`;
      return `${t('amount')} (Lot/Adet)`;
  };

  return (
    // 👇 GÜNCELLEME: Ana Arka Plan Dark Mode Uyumlu
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative">
        <div className="p-8 max-w-[1600px] mx-auto"> 
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              {/* 👇 Çeviri & Dark Mode Text */}
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{t('investments')}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('portfolio_summary')}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-semibold">
                  <FiActivity className="text-green-500" />
                  <span>1 USD = <span className="text-gray-900 dark:text-white">{exchangeRate.toFixed(2)} ₺</span></span>
              </div>

              <button 
                onClick={handleRefreshAll}
                // 👇 Buton renkleri dark moda uyarlandı
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-semibold text-sm border border-indigo-100 dark:border-indigo-800 shadow-sm"
              >
                  <FiRefreshCw className="animate-none hover:animate-spin" />
                  {t('refresh_prices')} {/* 👈 BURASI DÜZELTİLDİ */}
              </button>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex items-center shadow-sm">
                  <button 
                  onClick={() => setDisplayCurrency('TRY')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${displayCurrency === 'TRY' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                  ₺ TRY
                  </button>
                  <button 
                  onClick={() => setDisplayCurrency('USD')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${displayCurrency === 'USD' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                  $ USD
                  </button>
              </div>
            </div>
          </div>

          {/* ÖZET KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Kartlar için dark mode: bg-white dark:bg-gray-800, border-gray-700 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><FiDollarSign size={24} /></div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('total_portfolio_value')} ({displayCurrency})</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{currSym}{summary.totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><FiPieChart size={24} /></div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('total_value')} ({displayCurrency})</p>
                    <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{currSym}{summary.totalCurrentValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all ${summary.totalProfitLoss >= 0 ? 'hover:border-green-200' : 'hover:border-red-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${summary.totalProfitLoss >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                    <FiTrendingUp size={24} className={summary.totalProfitLoss < 0 ? "rotate-180" : ""} />
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{t('total_profit_loss')}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.totalProfitLoss >= 0 ? '+' : ''}{summary.totalProfitLoss.toLocaleString(undefined, {minimumFractionDigits: 2})} {currSym}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${summary.totalProfitLoss >= 0 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                            %{summary.totalProfitLossPercentage}
                        </span>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* EKLEME FORMU */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
            <h2 className="text-lg font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-4">
                <span className="bg-gray-900 dark:bg-gray-700 text-white p-1.5 rounded-lg"><FiPlus size={16}/></span> 
                {t('add_investment')}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block pl-1">{t('investment_type')}</label>
                  <select 
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="crypto">🪙 {t('crypto')}</option>
                    <option value="stock">📈 {t('stock')}</option>
                    <option value="commodity">🥇 {t('gold')}/Emtia</option>
                  </select>
              </div>

              <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block pl-1">{t('symbol')}</label>
                  <input type="text" placeholder="BTC, AAPL" 
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-bold uppercase placeholder-gray-400"
                    value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
              </div>
              
              <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block pl-1">{t('asset_name')}</label>
                  <input type="text" placeholder={t('asset_name')} 
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block pl-1">{getAmountLabel(formData.type)}</label>
                  <input type="number" placeholder="0.00" step="any"
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                    value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              
              <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block pl-1">{t('buy_price')}</label>
                  <div className="flex gap-2">
                      <input type="number" placeholder="0.00" step="any"
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                        value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} required />
                      
                      <select 
                        className="w-24 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 font-bold text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      >
                        <option value="USD">$ USD</option>
                        <option value="TRY">₺ TRY</option>
                      </select>
                  </div>
              </div>
              
              <div className="md:col-span-12 flex justify-end mt-2">
                  <button type="submit" className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-gray-200 dark:shadow-none transform hover:scale-105 active:scale-95 flex items-center gap-2">
                    <FiPlus /> {t('add_entry')}
                  </button>
              </div>
            </form>
          </div>

          {/* TABLO */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                    <tr className="text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <th className="py-4 px-6">{t('asset_name')}</th>
                    <th className="py-4 px-6">{t('amount')}</th>
                    <th className="py-4 px-6">{t('buy_price')}</th>
                    <th className="py-4 px-6">{t('current_price')}</th>
                    <th className="py-4 px-6">{t('profit_loss')}</th>
                    <th className="py-4 px-6 text-center">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {loading ? 
                    <tr><td colSpan="6" className="text-center py-12 text-gray-400 animate-pulse">{t('loading')}</td></tr> : 
                    groupedInvestments.length === 0 ? 
                    <tr><td colSpan="6" className="text-center py-12 text-gray-400 flex flex-col items-center gap-2"><span className="text-2xl">📭</span>{t('no_data')}</td></tr> :
                    groupedInvestments.map((inv) => {
                        const isSourceTRY = (inv.notes && inv.notes.includes('CURRENCY:TRY')) || inv.currency === 'TRY' || (inv.type === 'stock' && !inv.symbol.includes('USD'));
                        const sourceCurr = isSourceTRY ? 'TRY' : 'USD';
                        
                        const buyPriceConverted = convertValue(inv.buyPrice, sourceCurr);
                        const currentPriceConverted = convertValue(inv.currentPrice || inv.buyPrice, sourceCurr);

                        let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
                        if(inv.type === 'crypto') badgeClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
                        else if(inv.type === 'stock') badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                        else if(inv.type === 'commodity') badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

                        return (
                        <tr key={inv.symbol} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                            <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center">
                                <span className={`font-bold text-xs px-2.5 py-1 rounded-lg mr-3 ${badgeClass}`}>
                                    {inv.symbol}
                                </span>
                                <div>
                                    <span className="font-semibold text-gray-900 dark:text-white block text-sm">{inv.name}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">{inv.type}</span>
                                </div>
                            </div>
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300 text-sm">
                                {inv.amount} <span className="text-[10px] text-gray-400">{inv.type === 'commodity' ? 'gr' : ''}</span>
                            </td>
                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">{currSym}{buyPriceConverted.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {inv.currentPrice ? `${currSym}${currentPriceConverted.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '---'}
                                    </span>
                                    <button 
                                        onClick={() => handleUpdatePrice(inv.ids[0])} 
                                        title="Fiyatı Güncelle" 
                                        className="text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <FiRefreshCw size={14}/>
                                    </button>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                            {inv.buyPrice > 0 ? (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    inv.currentPrice > inv.buyPrice ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                    inv.currentPrice < inv.buyPrice ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {inv.currentPrice ? (
                                        <>
                                            {inv.currentPrice > inv.buyPrice ? '+' : ''}
                                            {(((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100).toFixed(2)}%
                                        </>
                                    ) : '-'}
                                </span>
                            ) : (
                                <span className="text-gray-300">-</span>
                            )}
                            </td>
                            <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleEditClick(inv)} 
                                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Düzenle"
                                    >
                                        <FiEdit3 size={16} />
                                    </button>

                                    <button 
                                        onClick={() => handleDeleteGroup(inv.ids, inv.symbol)} 
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
            <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                {/* Modal Arka Planı Dark Mode Uyumlu */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700 animation-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><FiEdit3 /></span>
                            Varlık Düzenle
                        </h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FiX size={24}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Varlık</label>
                            <div className="font-bold text-gray-800 dark:text-white text-lg">{editingGroup.name} <span className="text-gray-400 text-sm">({editingGroup.symbol})</span></div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Yeni Toplam Miktar</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                value={editingGroup.newAmount}
                                onChange={(e) => setEditingGroup({...editingGroup, newAmount: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Ortalama Alış Fiyatı ({editingGroup.currency})</label>
                            <input 
                                type="number" 
                                step="any"
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                value={editingGroup.newBuyPrice}
                                onChange={(e) => setEditingGroup({...editingGroup, newBuyPrice: parseFloat(e.target.value)})}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">İptal</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
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