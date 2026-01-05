import { useState, useContext, useEffect, useCallback, useMemo } from 'react'; 
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext'; 
// Recharts bileşenleri
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiPieChart, FiActivity, FiRefreshCw, FiTrash2, FiAlertTriangle, FiArrowUpRight, FiArrowDownLeft, FiTarget, FiSettings, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; 
import AddTransactionModal from '../components/AddTransactionModal';
import SubscriptionsCard from '../components/SubscriptionsCard'; 
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const DEFAULT_RATE = 36.50; 
const EXPENSE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { currency, setCurrency } = useCurrency(); 
  const { t } = useTranslation();
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tab state'i: 'expense', 'investment' veya 'trend' olabilir
  const [activeTab, setActiveTab] = useState('expense'); 
  
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]); 
  const [categories, setCategories] = useState([]); 
  
  // Trend Analizi için State'ler
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState(6);

  const [loading, setLoading] = useState(true); 
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE); 

  const parseCurrency = useCallback((value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const clean = String(value).replace(/[^0-9.-]+/g, ""); 
    const number = parseFloat(clean);
    return isNaN(number) ? 0 : number;
  }, []);

  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
      const data = await response.json();
      if (data && data.rates && data.rates.TRY) {
        setExchangeRate(data.rates.TRY);
      }
    } catch (error) { console.error("Kur çekilemedi:", error); }
  }, []);

  const convertValue = useCallback((amount, sourceCurrency = 'USD') => {
    const val = parseFloat(amount) || 0;
    if (currency === 'USD') {
      if (sourceCurrency === 'TRY') return val / exchangeRate; 
      return val; 
    } else {
      if (sourceCurrency === 'USD') return val * exchangeRate; 
      return val; 
    }
  }, [currency, exchangeRate]);

  const currSym = currency === 'TRY' ? '₺' : '$';

  const getAssetColor = (type, symbol) => {
    const sym = symbol?.toUpperCase() || '';
    if (sym === 'BTC' || sym === 'BITCOIN') return '#F7931A';
    if (sym === 'ETH' || sym === 'ETHEREUM') return '#627EEA';
    if (sym.includes('ALTIN') || sym === 'GOLD' || sym === 'XAU') return '#FFD700';
    if (sym === 'AEFES') return '#1E3A8A';
    
    if (type === 'crypto') return '#8B5CF6';
    if (type === 'stock') return '#3B82F6';
    if (type === 'commodity') return '#F59E0B';
    
    return '#CBD5E1';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, investRes, catRes, historyRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/investments'),
        api.get('/categories?type=expense'),
        api.get('/transactions/analytics/history')
      ]);

      const transData = Array.isArray(transRes.data) ? transRes.data : [];
      let investData = [];
      if (investRes.data && Array.isArray(investRes.data.investments)) investData = investRes.data.investments;
      else if (Array.isArray(investRes.data)) investData = investRes.data;

      const sortedTransactions = transData.sort((a, b) => {
         const timeA = new Date(a.createdAt || a.date).getTime();
         const timeB = new Date(b.createdAt || b.date).getTime();
         if (timeA === timeB) return (b._id || '').localeCompare(a._id || '');
         return timeB - timeA; 
      });

      setTransactions(sortedTransactions);
      setInvestments(investData);
      setCategories(catRes.data.categories || []);
      setHistoryData(historyRes.data || []);

    } catch (error) { console.error("Veri çekilemedi:", error); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchExchangeRate();
    fetchData();
  }, [fetchData, fetchExchangeRate]);

  const refreshPrices = async () => {
    const toastId = toast.loading(t('updating'));
    try {
      await api.put('/investments/update-prices/all'); 
      await fetchExchangeRate();
      await fetchData(); 
      toast.success(t('updated'), { id: toastId });
    } catch (error) { toast.error(t('failed'), { id: toastId }); }
  };

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(tr => {
      const originalAmount = parseCurrency(tr.amount);
      const convertedAmount = convertValue(originalAmount, 'USD'); 
      if (tr.type === 'income') income += convertedAmount;
      else expense += convertedAmount;
    });
    return {
      totalBalance: income - expense, 
      totalIncome: income,
      totalExpense: expense
    };
  }, [transactions, convertValue, parseCurrency]); 

  const budgetAlert = useMemo(() => {
    if (stats.totalIncome === 0) return null;
    const ratio = (stats.totalExpense / stats.totalIncome) * 100;
    
    if (ratio >= 80) {
      return {
        show: true,
        percent: ratio.toFixed(0),
        status: ratio >= 100 ? 'danger' : 'warning'
      };
    }
    return { show: false };
  }, [stats]);

  // Çubuk Grafik Verisi Hazırlama
  const filteredHistoryData = useMemo(() => {
    const data = historyData.slice(-timeRange);
    return data.map(item => ({
       ...item,
       income: convertValue(item.income, 'USD'), 
       expense: convertValue(item.expense, 'USD')
    }));
  }, [historyData, timeRange, convertValue]);

  const expenseChartData = useMemo(() => {
    const expenseMap = {};
    let totalExpense = 0;

    transactions.filter(tr => tr.type === 'expense').forEach(tr => {
      const amount = convertValue(parseCurrency(tr.amount), 'USD'); 
      const category = tr.category || 'Diğer';
      
      if (expenseMap[category]) expenseMap[category] += amount;
      else expenseMap[category] = amount;
      
      totalExpense += amount;
    });

    return Object.keys(expenseMap).map((cat, index) => ({
      name: t(cat), 
      value: expenseMap[cat],
      share: totalExpense > 0 ? (expenseMap[cat] / totalExpense) * 100 : 0,
      color: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [transactions, convertValue, parseCurrency, t]); 

  const categoryBudgetStatus = useMemo(() => {
      if (!categories.length) return [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthExpenses = transactions.filter(tr => {
          const tDate = new Date(tr.date);
          return tr.type === 'expense' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });

      const expenseMap = {};
      currentMonthExpenses.forEach(tr => {
          const val = parseCurrency(tr.amount);
          const valConverted = convertValue(val, 'USD'); 
          expenseMap[tr.category] = (expenseMap[tr.category] || 0) + valConverted;
      });

      return categories
          .filter(cat => cat.budgetLimit > 0)
          .map(cat => {
              const spent = expenseMap[cat.name] || 0;
              let currentLimit = cat.budgetLimit;
              if (currency === 'USD') currentLimit = cat.budgetLimit / exchangeRate;

              const percent = Math.min((spent / currentLimit) * 100, 100);
              const rawPercent = (spent / currentLimit) * 100;
              
              return { ...cat, spent, displayLimit: currentLimit, percent, rawPercent };
          })
          .sort((a, b) => b.percent - a.percent);
  }, [categories, transactions, convertValue, parseCurrency, currency, exchangeRate]);

  const investmentChartData = useMemo(() => {
    if (!Array.isArray(investments) || investments.length === 0) return [];
    const groupedData = {};
    let totalPortfolioValue = 0;

    investments.forEach(inv => {
        const symbol = inv.symbol?.toUpperCase() || inv.name || 'BİLİNMİYOR';
        const currentPrice = parseCurrency(inv.currentPrice);
        const buyPrice = parseCurrency(inv.price || inv.buyPrice);
        const amount = parseCurrency(inv.amount);
        let basePrice = currentPrice > 0 ? currentPrice : buyPrice;
        
        const isTRYAsset = (inv.type === 'stock' && !inv.symbol?.includes('USD')) || inv.currency === 'TRY';
        const sourceCurrency = isTRYAsset ? 'TRY' : 'USD';
        const finalValue = convertValue(amount * basePrice, sourceCurrency);
        const color = getAssetColor(inv.type, symbol);

        if (groupedData[symbol]) {
            groupedData[symbol].value += finalValue;
        } else {
            groupedData[symbol] = {
                name: symbol,
                value: finalValue,
                color: color,
                type: inv.type,
                isLive: currentPrice > 0,
                sourceCurrency
            };
        }
        totalPortfolioValue += finalValue;
    });

    const items = Object.values(groupedData).filter(item => item.value > 0);
    return items.map(item => ({
        ...item,
        share: (item.value / totalPortfolioValue) * 100 
    })).sort((a, b) => b.value - a.value);
  }, [investments, convertValue, parseCurrency]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(t('deleted'));
      fetchData();
    } catch (error) { toast.error("İşlem silinemedi"); }
  };

  const handleDeleteAll = async () => {
    if (transactions.length === 0) return;
    if (!window.confirm(t('delete_all_confirm'))) return;
    const toastId = toast.loading("...");
    try {
        const deletePromises = transactions.map(tr => api.delete(`/transactions/${tr._id}`));
        await Promise.all(deletePromises);
        toast.success(t('cleared'), { id: toastId });
        fetchData();
    } catch (error) { toast.error("Hata", { id: toastId }); }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl text-xs z-50 min-w-[150px]">
          <p className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: data.color || data.fill}}></span>
              {data.name || data.label} 
          </p>
          <div className="space-y-1">
             <p className="text-gray-500 dark:text-gray-400 flex justify-between">
                <span>{t('total_value')}:</span> 
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currSym}{data.value ? data.value.toLocaleString(undefined, {minimumFractionDigits: 2}) : 0}
                </span>
             </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const filteredTransactions = transactions
    .filter(tr => transactionFilter === 'all' ? true : tr.type === transactionFilter)
    .slice(0, 10); 

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1920px] mx-auto"> 
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{t('welcome', { name: user?.name })} 👋</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('portfolio_summary')}</p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-semibold">
                  <FiActivity className="text-green-500" />
                  <span>1 USD = <span className="text-gray-900 dark:text-white">{exchangeRate.toFixed(2)} ₺</span></span>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex items-center shadow-sm">
                <button onClick={() => setCurrency('TRY')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${currency === 'TRY' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>₺ TRY</button>
                <button onClick={() => setCurrency('USD')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>$ USD</button>
              </div>
              <button onClick={refreshPrices} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center gap-2 hover:scale-105 transition-transform"><FiPlus size={18} /> <span className="hidden md:inline">{t('quick_add')}</span></button>
            </div>
          </div>

          {/* Budget Alert */}
          {budgetAlert?.show && (
             <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-pulse ${budgetAlert.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'}`}>
                <FiAlertTriangle size={24} className="shrink-0" />
                <div>
                   <h4 className="font-bold text-sm">{t('budget_alert_title')}</h4>
                   <p className="text-xs opacity-90">{t('budget_warning', { percent: budgetAlert.percent })}</p>
                </div>
             </div>
          )}

          {/* Stats Cards - EN ÜSTTE KALDI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900 dark:text-blue-300"><FiDollarSign size={20} /></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('net_cash_flow')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{currSym}{stats.totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-200 transition-all relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg dark:bg-green-900 dark:text-green-300"><FiTrendingUp size={20} /></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('total_income')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-green-600 dark:text-green-400">+{currSym}{stats.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-200 transition-all relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-red-50 dark:bg-red-900/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg dark:bg-red-900 dark:text-red-300"><FiTrendingDown size={20} /></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('total_expense')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-red-500 dark:text-red-400">-{currSym}{stats.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* SOL KOLON (Grafik) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col min-h-[420px]">
                 
                 {/* TAB MENÜSÜ - Trend buraya eklendi */}
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     {/* Başlık seçilen tab'a göre değişir */}
                     {activeTab === 'trend' ? (
                        <><FiActivity className="text-purple-500" /> Finansal Trendler</>
                     ) : activeTab === 'expense' ? (
                        <><span className="w-1 h-6 bg-green-500 rounded-full"></span> {t('expense_analysis')}</>
                     ) : (
                        <><span className="w-1 h-6 bg-blue-500 rounded-full"></span> {t('portfolio_distribution')}</>
                     )}
                   </h3>

                   <div className="flex items-center gap-2">
                       {/* Sadece Trend tabındaysa zaman filtresini göster */}
                       {activeTab === 'trend' && (
                           <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mr-2">
                                {[3, 6, 12].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setTimeRange(val)} 
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeRange === val ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        {val === 12 ? 'Yıl' : `${val} Ay`}
                                    </button>
                                ))}
                           </div>
                       )}

                       <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                         <button onClick={() => setActiveTab('expense')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('expenses')}</button>
                         <button onClick={() => setActiveTab('investment')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'investment' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('investments')}</button>
                         {/* Trend Butonu */}
                         <button onClick={() => setActiveTab('trend')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'trend' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Trend</button>
                       </div>
                   </div>
                 </div>

                 <div className="w-full h-[320px] relative">
                   {loading && <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
                   
                   <ResponsiveContainer width="100%" height="100%">
                     {/* TAB İÇERİĞİ: Ya Pasta Ya Çubuk */}
                     {activeTab === 'trend' ? (
                         <BarChart data={filteredHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'} />
                             <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(val) => `${currSym}${val}`} />
                             <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                             <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                             <Bar dataKey="income" name={t('income')} fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                             <Bar dataKey="expense" name={t('expense')} fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                         </BarChart>
                     ) : (
                         <PieChart>
                           <Pie 
                             data={activeTab === 'expense' ? expenseChartData : investmentChartData} 
                             cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value" labelLine={false} label={renderCustomizedLabel} 
                           >
                             {(activeTab === 'expense' ? expenseChartData : investmentChartData).map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke={document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'} strokeWidth={3} style={{ outline: 'none' }} />
                             ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                           <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={10} wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#9CA3AF', paddingTop: '20px'}} />
                         </PieChart>
                     )}
                   </ResponsiveContainer>

                   {/* Veri Yok Uyarısı */}
                   {!loading && (
                       (activeTab === 'trend' && filteredHistoryData.length === 0) ||
                       (activeTab === 'expense' && expenseChartData.length === 0) ||
                       (activeTab === 'investment' && investmentChartData.length === 0)
                   ) && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-white/90 dark:bg-gray-800/90 z-20">
                         <FiPieChart size={48} className="mb-4 text-gray-300 dark:text-gray-600"/>
                         <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">{t('no_data')}</p>
                         <button onClick={() => navigate(activeTab === 'investment' ? '/investments' : '/dashboard')} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"><FiPlus /> {t('add_entry')}</button>
                       </div>
                   )}
                 </div>
               </div>

               {/* Bütçe Listesi (Aynı kaldı) */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col max-h-[300px] overflow-y-auto scrollbar-hide">
                   <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                           <span className="w-1 h-6 bg-purple-500 rounded-full"></span> {t('budget_tracking_title')}
                       </h3>
                       <button onClick={() => navigate('/settings', { state: { tab: 'categories' } })} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1">
                           <FiSettings /> {categoryBudgetStatus.length > 0 ? t('manage') : t('settings')}
                       </button>
                   </div>
                   
                   {categoryBudgetStatus.length > 0 ? (
                       <div className="space-y-4">
                           {categoryBudgetStatus.map((cat, idx) => {
                               const percent = Math.round(cat.percent); 
                               const rawPercent = Math.round(cat.rawPercent || percent); 
                               let progressColor = 'bg-green-500';
                               if (rawPercent >= 100) progressColor = 'bg-red-600'; 
                               else if (rawPercent >= 80) progressColor = 'bg-orange-500';

                               return (
                                   <div key={idx} className="space-y-1">
                                           <div className="flex justify-between text-sm font-medium">
                                               <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                                   {cat.icon} {t(cat.name)} 
                                               </span>
                                               <span className={`${rawPercent >= 100 ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                   {cat.spent.toLocaleString(undefined, {maximumFractionDigits: 0})} / {cat.displayLimit.toLocaleString(undefined, {maximumFractionDigits: 0})} {currSym}
                                               </span>
                                           </div>
                                           <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                               <div className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${percent}%` }}></div>
                                           </div>
                                           <p className="text-[10px] text-right text-gray-400">
                                               %{rawPercent} {t('used')}
                                           </p>
                                   </div>
                               );
                           })}
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center py-6 text-center">
                           <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-full flex items-center justify-center mb-3">
                               <FiTarget size={24} />
                           </div>
                           <p className="text-gray-800 dark:text-gray-200 font-semibold mb-1">{t('no_budget_target')}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">{t('no_budget_target_desc')}</p>
                           <button onClick={() => navigate('/settings', { state: { tab: 'categories' } })} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-200/50 dark:shadow-none flex items-center gap-2">
                               <FiPlus /> {t('add_budget_limit')}
                           </button>
                       </div>
                   )}
               </div>
            </div>

            {/* SAĞ KOLON (Liste ve Abonelikler) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="h-[350px]">
                 <SubscriptionsCard />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex flex-col xl:flex-row justify-between items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 whitespace-nowrap">
                        <FiActivity className="text-purple-500" /> {t('recent_transactions')}
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setTransactionFilter('all')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${transactionFilter === 'all' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('all')}</button>
                        <button onClick={() => setTransactionFilter('income')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${transactionFilter === 'income' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-600'}`}>{t('income')}</button>
                        <button onClick={() => setTransactionFilter('expense')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${transactionFilter === 'expense' ? 'bg-white dark:bg-gray-600 shadow text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>{t('expense')}</button>
                    </div>
                    {transactions.length > 0 && (
                        <button onClick={handleDeleteAll} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Tüm Geçmişi Temizle"><FiTrash2 size={16} /></button>
                    )}
                </div>

                <div className="overflow-y-auto p-4 space-y-3 scrollbar-hide h-[400px]">
                  {filteredTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm">{t('no_data')}</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tr) => {
                      const displayAmount = convertValue(parseCurrency(tr.amount), 'USD'); 
                      const isIncome = tr.type === 'income';
                      return (
                        <div key={tr._id} className="group flex items-center justify-between p-3 hover:bg-white hover:shadow-md dark:hover:bg-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                {isIncome ? <FiArrowUpRight size={20} /> : <FiArrowDownLeft size={20} />}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{tr.description || 'İsimsiz'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(tr.category)}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                             <p className={`font-bold text-sm ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {isIncome ? '+' : '-'}{currSym}{displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                             </p>
                             <button onClick={() => handleDelete(tr._id)} className="text-[10px] text-gray-300 hover:text-red-500 transition-colors flex items-center justify-end w-full gap-1 mt-1 opacity-0 group-hover:opacity-100">
                                <FiTrash2 size={12} /> <span>Sil</span>
                             </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTransactionAdded={fetchData} />
    </div>
  );
};

export default Dashboard;