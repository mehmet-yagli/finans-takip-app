import { useState, useContext, useEffect, useCallback, useMemo } from 'react'; 
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext'; 
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiPieChart, FiActivity, FiRefreshCw, FiTrash2, FiAlertTriangle, FiArrowUpRight, FiArrowDownLeft, FiTarget, FiSettings, FiCalendar, FiClock, FiYoutube, FiMusic, FiPlayCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; 
import AddTransactionModal from '../components/AddTransactionModal';
import SubscriptionsCard from '../components/SubscriptionsCard'; 
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const EXPENSE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E']; 

const getSubscriptionIcon = (name) => {
    if (!name) return null;
    const lowerName = String(name).toLowerCase();
    if (lowerName.includes('netflix')) return <span className="text-[#E50914] font-black font-serif text-lg leading-none">N</span>;
    if (lowerName.includes('spotify')) return <FiMusic className="text-[#1DB954]" size={16} />;
    if (lowerName.includes('youtube')) return <FiYoutube className="text-[#FF0000]" size={16} />;
    if (lowerName.includes('prime') || lowerName.includes('amazon')) return <FiPlayCircle className="text-[#00A8E1]" size={16} />;
    if (lowerName.includes('apple') || lowerName.includes('icloud')) return <span className="text-gray-800 dark:text-gray-200 text-lg leading-none"></span>;
    return null;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  // convertCurrency context'ten çekiliyor
  const { currency, setCurrency, usdToTry, refreshRates, convertCurrency } = useCurrency(); 
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expense'); 
  const [transactionFilter, setTransactionFilter] = useState('all');
  
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [subscriptions, setSubscriptions] = useState([]); 
  
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState(6);

  const [selectedMonthYear, setSelectedMonthYear] = useState(''); 
  const [availableMonths, setAvailableMonths] = useState([]); 

  const [loading, setLoading] = useState(true); 

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return t('good_morning') || 'Günaydın';
      if (hour < 18) return t('good_afternoon') || 'İyi Günler';
      return t('good_evening') || 'İyi Akşamlar';
  };

  const parseCurrency = useCallback((value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const clean = String(value).replace(/[^0-9.-]+/g, ""); 
    const number = parseFloat(clean);
    return isNaN(number) ? 0 : number;
  }, []);

  const currSym = currency === 'TRY' ? '₺' : '$';

  const getAssetColor = (type, symbol) => {
    const sym = symbol?.toUpperCase() || '';
    if (sym === 'BTC' || sym === 'BITCOIN') return '#F7931A';
    if (sym === 'ETH' || sym === 'ETHEREUM') return '#627EEA';
    if (sym.includes('ALTIN') || sym === 'GOLD' || sym === 'XAU') return '#FFD700';
    if (sym === 'AEFES') return '#1E3A8A';
    if (sym.includes('NETFLIX')) return '#E50914'; 
    if (sym.includes('SPOTIFY')) return '#1DB954';
    if (sym.includes('YOUTUBE')) return '#FF0000';
    if (sym.includes('PRIME')) return '#00A8E1';
    if (type === 'crypto') return '#8B5CF6';
    if (type === 'stock') return '#3B82F6';
    if (type === 'commodity') return '#F59E0B';
    return '#CBD5E1';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, investRes, catRes, historyRes, subsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/investments'),
        api.get('/categories?type=expense'),
        api.get('/transactions/analytics/history'),
        api.get('/subscriptions').catch(() => ({ data: [] })) 
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
      
      let subsData = subsRes?.data?.subscriptions || subsRes?.data || [];
      setSubscriptions(Array.isArray(subsData) ? subsData : []); 

      const monthsSet = new Set();
      sortedTransactions.forEach(tr => {
          const d = new Date(tr.date);
          const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthsSet.add(monthYear);
      });
      
      const monthsArray = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); 
      setAvailableMonths(monthsArray);

      if (!selectedMonthYear) {
          if (monthsArray.length > 0) {
              setSelectedMonthYear(monthsArray[0]); 
          } else {
              const now = new Date();
              setSelectedMonthYear(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
          }
      }

    } catch { console.error("Veri çekilemedi."); } 
    finally { setLoading(false); }
  }, [selectedMonthYear]);

  useEffect(() => {
    refreshRates();
    fetchData();
  }, [fetchData, refreshRates]);

  const refreshPrices = async () => {
    const toastId = toast.loading(t('updating'));
    try {
      await api.put('/investments/update-prices/all'); 
      await refreshRates(); 
      await fetchData(); 
      toast.success(t('updated'), { id: toastId });
    } catch { toast.error(t('failed'), { id: toastId }); }
  };

  const currentMonthTransactions = useMemo(() => {
      if (!selectedMonthYear) return transactions;
      return transactions.filter(tr => {
          const d = new Date(tr.date);
          const trMonthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return trMonthYear === selectedMonthYear;
      });
  }, [transactions, selectedMonthYear]);

  const totalMonthlySubscriptionCost = useMemo(() => {
     let total = 0;
     subscriptions.forEach(sub => {
         const val = parseCurrency(sub.price || sub.amount || sub.cost); 
         total += convertCurrency(val, sub.currency || 'TRY'); 
     });
     return total;
  }, [subscriptions, convertCurrency, parseCurrency]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    currentMonthTransactions.forEach(tr => {
      const originalAmount = parseCurrency(tr.amount);
      // HARDCODE 'USD' KALDIRILDI -> İşlemin kendi kurunu kullan, yoksa TRY kabul et
      const convertedAmount = convertCurrency(originalAmount, tr.currency || 'TRY'); 
      if (tr.type === 'income') income += convertedAmount;
      else expense += convertedAmount;
    });

    const finalExpense = expense + totalMonthlySubscriptionCost;

    return {
      totalBalance: income - finalExpense, 
      totalIncome: income,
      totalExpense: finalExpense
    };
  }, [currentMonthTransactions, convertCurrency, parseCurrency, totalMonthlySubscriptionCost]); 

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

  const filteredHistoryData = useMemo(() => {
    const data = historyData.slice(-timeRange);
    return data.map(item => ({
       ...item,
       income: convertCurrency(item.income, item.currency || 'TRY'), 
       expense: convertCurrency(item.expense, item.currency || 'TRY') 
    }));
  }, [historyData, timeRange, convertCurrency]);

  const expenseChartData = useMemo(() => {
    const expenseMap = {};
    let totalExpense = 0;

    currentMonthTransactions.filter(tr => tr.type === 'expense').forEach(tr => {
      const amount = convertCurrency(parseCurrency(tr.amount), tr.currency || 'TRY'); 
      const category = tr.category || 'Diğer';
      if (expenseMap[category]) expenseMap[category] += amount;
      else expenseMap[category] = amount;
      totalExpense += amount;
    });

    subscriptions.forEach(sub => {
        const subName = sub.platform || sub.name || sub.title || 'Abonelik';
        const val = parseCurrency(sub.price || sub.amount || sub.cost);
        const subVal = convertCurrency(val, sub.currency || 'TRY');
        if (subVal > 0) {
            const formattedName = subName.charAt(0).toUpperCase() + subName.slice(1).toLowerCase();
            if (expenseMap[formattedName]) expenseMap[formattedName] += subVal;
            else expenseMap[formattedName] = subVal;
            totalExpense += subVal;
        }
    });

    return Object.keys(expenseMap).map((cat, index) => ({
      name: t(cat) !== cat ? t(cat) : cat, 
      value: expenseMap[cat],
      share: totalExpense > 0 ? (expenseMap[cat] / totalExpense) * 100 : 0,
      color: getAssetColor('expense', cat) !== '#CBD5E1' ? getAssetColor('expense', cat) : EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions, convertCurrency, parseCurrency, t, subscriptions]); 

  const categoryBudgetStatus = useMemo(() => {
      if (!categories.length) return [];
      const expenseMap = {};
      currentMonthTransactions.filter(tr => tr.type === 'expense').forEach(tr => {
          const val = parseCurrency(tr.amount);
          const valConverted = convertCurrency(val, tr.currency || 'TRY'); 
          expenseMap[tr.category] = (expenseMap[tr.category] || 0) + valConverted;
      });

      return categories
          .filter(cat => cat.budgetLimit > 0)
          .map(cat => {
              const spent = expenseMap[cat.name] || 0;
              // Limit her zaman TRY kaydediliyor varsayımıyla Context'teki akıllı çeviriciyi kullandık
              const currentLimit = convertCurrency(cat.budgetLimit, 'TRY');

              const percent = Math.min((spent / currentLimit) * 100, 100);
              const rawPercent = (spent / currentLimit) * 100;
              return { ...cat, spent, displayLimit: currentLimit, percent, rawPercent };
          })
          .sort((a, b) => b.percent - a.percent);
  }, [categories, currentMonthTransactions, convertCurrency, parseCurrency]);

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
        
        const finalValue = convertCurrency(amount * basePrice, sourceCurrency);
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
  }, [investments, convertCurrency, parseCurrency]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(t('deleted'));
      fetchData();
    } catch { toast.error("İşlem silinemedi"); } 
  };

  const handleDeleteAll = async () => {
    if (currentMonthTransactions.length === 0) return;
    if (!window.confirm(t('delete_all_confirm'))) return;
    const toastId = toast.loading("...");
    try {
        const deletePromises = currentMonthTransactions.map(tr => api.delete(`/transactions/${tr._id}`));
        await Promise.all(deletePromises);
        toast.success(t('cleared'), { id: toastId });
        fetchData();
    } catch { toast.error("Hata", { id: toastId }); } 
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const itemName = data.name || data.label;
      const CustomIcon = activeTab === 'expense' ? getSubscriptionIcon(itemName) : null;

      return (
        <div className="bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl p-4 border border-gray-100 dark:border-gray-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-2xl text-sm z-50 min-w-[180px]">
          <div className="font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: data.color || data.fill}}></span>
              <span className="flex items-center gap-1.5">
                  {CustomIcon} {itemName}
              </span>
          </div>
          <div className="space-y-1">
             <p className="text-gray-500 dark:text-gray-400 flex justify-between gap-6">
                <span className="font-medium">{t('total_value')}:</span> 
                <span className="font-extrabold text-gray-900 dark:text-white">
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
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="800" style={{textShadow: '0px 2px 8px rgba(0,0,0,0.6)'}}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const filteredTransactions = currentMonthTransactions
    .filter(tr => transactionFilter === 'all' ? true : tr.type === transactionFilter);

  const formatMonthYear = (monthYearStr) => {
      if(!monthYearStr) return '';
      const [year, month] = monthYearStr.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B1121] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 selection:bg-blue-500/30">
      <Sidebar />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-6 md:p-10 max-w-[1920px] mx-auto space-y-8"> 
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                 <FiClock size={14} /> {getGreeting()}
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
                {user?.name}
                
                <div className="relative inline-flex items-center">
                    <FiCalendar className="absolute left-3 text-gray-400" size={16} />
                    <select 
                        value={selectedMonthYear} 
                        onChange={(e) => setSelectedMonthYear(e.target.value)}
                        className="pl-9 pr-8 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl appearance-none cursor-pointer border-none outline-none transition-colors"
                    >
                        {availableMonths.length === 0 && <option value="">Bu Ay</option>}
                        {availableMonths.map(my => (
                            <option key={my} value={my}>{formatMonthYear(my)}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </h2>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm text-sm font-semibold backdrop-blur-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-gray-500 dark:text-gray-400">USD</span>
                  <span className="text-gray-900 dark:text-white">{usdToTry.toFixed(2)} ₺</span>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-800/90 p-1 rounded-xl flex items-center shadow-inner">
                <button onClick={() => setCurrency('TRY')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${currency === 'TRY' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>TRY</button>
                <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${currency === 'USD' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>USD</button>
              </div>

              <button onClick={refreshPrices} className="p-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group">
                  <FiRefreshCw className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} />
              </button>
              
              <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform duration-200 active:scale-95">
                  <FiPlus size={18} /> <span className="hidden md:inline">{t('quick_add')}</span>
              </button>
            </div>
          </div>

          {budgetAlert?.show && (
             <div className={`p-4 rounded-2xl border flex items-center gap-4 backdrop-blur-xl shadow-sm ${budgetAlert.status === 'danger' ? 'bg-rose-50/90 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300' : 'bg-amber-50/90 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300'}`}>
                <div className={`p-2 rounded-xl ${budgetAlert.status === 'danger' ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                    <FiAlertTriangle size={20} />
                </div>
                <div>
                   <h4 className="font-bold text-sm">{t('budget_alert_title')}</h4>
                   <p className="text-xs font-medium mt-0.5 opacity-90">{t('budget_warning', { percent: budgetAlert.percent })}</p>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#151E2D] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <FiDollarSign size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('net_cash_flow')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{currSym}{stats.totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>

            <div className="bg-white dark:bg-[#151E2D] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <FiTrendingUp size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_income')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">+{currSym}{stats.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>

            <div className="bg-white dark:bg-[#151E2D] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
                        <FiTrendingDown size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_expense')}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-500 tracking-tight">-{currSym}{stats.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 flex flex-col gap-8">
               <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-800 p-8 flex flex-col min-h-[460px]">
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                   <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                     {activeTab === 'trend' ? (
                        <>Finansal Trendler</>
                     ) : activeTab === 'expense' ? (
                        <>{t('expense_analysis')}</>
                     ) : (
                        <>{t('portfolio_distribution')}</>
                     )}
                   </h3>

                   <div className="flex items-center gap-3">
                       {activeTab === 'trend' && (
                           <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
                                {[3, 6, 12].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setTimeRange(val)} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === val ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        {val === 12 ? 'Yıl' : `${val} Ay`}
                                    </button>
                                ))}
                           </div>
                       )}

                       <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
                         <button onClick={() => setActiveTab('expense')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t('expenses')}</button>
                         <button onClick={() => setActiveTab('investment')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'investment' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t('investments')}</button>
                         <button onClick={() => setActiveTab('trend')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'trend' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Trend</button>
                       </div>
                   </div>
                 </div>

                 <div className="w-full flex-1 relative min-h-[320px]">
                   {loading && <div className="absolute inset-0 z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div></div>}
                   
                   <ResponsiveContainer width="100%" height="100%">
                     {activeTab === 'trend' ? (
                         <BarChart data={filteredHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0'} />
                             <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} tickFormatter={(val) => `${currSym}${val}`} />
                             <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(148, 163, 184, 0.05)'}} />
                             <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}/>
                             <Bar dataKey="income" name={t('income')} fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                             <Bar dataKey="expense" name={t('expense')} fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
                         </BarChart>
                     ) : (
                         <PieChart>
                           <Pie 
                             data={activeTab === 'expense' ? expenseChartData : investmentChartData} 
                             cx="50%" cy="50%" innerRadius={90} outerRadius={130} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomizedLabel} 
                           >
                             {(activeTab === 'expense' ? expenseChartData : investmentChartData).map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke={document.documentElement.classList.contains('dark') ? '#151E2D' : '#ffffff'} strokeWidth={4} style={{ outline: 'none' }} />
                             ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                           <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={10} wrapperStyle={{fontSize: '13px', fontWeight: 600, color: '#64748B', paddingTop: '30px'}} />
                         </PieChart>
                     )}
                   </ResponsiveContainer>

                   {!loading && (
                       (activeTab === 'trend' && filteredHistoryData.length === 0) ||
                       (activeTab === 'expense' && expenseChartData.length === 0) ||
                       (activeTab === 'investment' && investmentChartData.length === 0)
                   ) && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                         <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4"><FiPieChart size={24}/></div>
                         <p className="font-bold mb-2">{t('no_data')}</p>
                       </div>
                   )}
                 </div>
               </div>

               <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-800 p-8 flex flex-col max-h-[350px] overflow-y-auto scrollbar-hide">
                   <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-[#151E2D] z-10 pb-2">
                       <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                           {t('budget_tracking_title')}
                       </h3>
                       <button onClick={() => navigate('/settings', { state: { tab: 'categories' } })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1.5">
                           <FiSettings size={14} /> {categoryBudgetStatus.length > 0 ? t('manage') : t('settings')}
                       </button>
                   </div>
                   
                   {categoryBudgetStatus.length > 0 ? (
                       <div className="space-y-6">
                           {categoryBudgetStatus.map((cat, idx) => {
                               const percent = Math.round(cat.percent); 
                               const rawPercent = Math.round(cat.rawPercent || percent); 
                               let progressColor = 'bg-emerald-500';
                               if (rawPercent >= 100) progressColor = 'bg-rose-500'; 
                               else if (rawPercent >= 80) progressColor = 'bg-amber-500';

                               return (
                                   <div key={idx} className="space-y-2 group">
                                       <div className="flex justify-between text-sm font-bold">
                                           <span className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                               <span className="text-lg opacity-80">{cat.icon}</span> {t(cat.name)} 
                                           </span>
                                           <span className={`${rawPercent >= 100 ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                               {cat.spent.toLocaleString(undefined, {maximumFractionDigits: 0})} / {cat.displayLimit.toLocaleString(undefined, {maximumFractionDigits: 0})} {currSym}
                                           </span>
                                       </div>
                                       <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                           <div className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`} style={{ width: `${percent}%` }}></div>
                                       </div>
                                   </div>
                               );
                           })}
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center py-6 text-center">
                           <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                               <FiTarget size={24} />
                           </div>
                           <p className="text-gray-900 dark:text-white font-bold mb-1">{t('no_budget_target')}</p>
                           <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">{t('no_budget_target_desc')}</p>
                           <button onClick={() => navigate('/settings', { state: { tab: 'categories' } })} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl transition-all flex items-center gap-2">
                               <FiPlus size={16} /> {t('add_budget_limit')}
                           </button>
                       </div>
                   )}
               </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-8">
              
              <div className="h-[350px]">
                 <SubscriptionsCard />
              </div>

              <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-800 flex flex-col flex-1 min-h-[350px] max-h-[460px]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {t('recent_transactions')}
                        </h3>
                        {currentMonthTransactions.length > 0 && (
                            <button onClick={handleDeleteAll} className="text-gray-400 hover:text-rose-500 transition-colors"><FiTrash2 size={16} /></button>
                        )}
                    </div>
                    
                    <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl w-full">
                        <button onClick={() => setTransactionFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${transactionFilter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{t('all')}</button>
                        <button onClick={() => setTransactionFilter('income')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${transactionFilter === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>{t('income')}</button>
                        <button onClick={() => setTransactionFilter('expense')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${transactionFilter === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>{t('expense')}</button>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 space-y-1.5 scrollbar-hide flex-1">
                  {filteredTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-2"><FiActivity size={18} className="opacity-50"/></div>
                        <p className="text-sm font-bold">{t('no_data')}</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tr) => {
                      // İşlemin kendi kurunu kullanarak dönüşüm yapıyoruz
                      const displayAmount = convertCurrency(parseCurrency(tr.amount), tr.currency || 'TRY'); 
                      const isIncome = tr.type === 'income';
                      return (
                        <div key={tr._id} className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                {isIncome ? <FiArrowUpRight size={18} strokeWidth={3} /> : <FiArrowDownLeft size={18} strokeWidth={3} />}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{tr.description || 'İsimsiz'}</p>
                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{t(tr.category)}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                             <p className={`font-extrabold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {isIncome ? '+' : '-'}{currSym}{displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                             </p>
                             <button onClick={() => handleDelete(tr._id)} className="text-[10px] font-bold text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100">
                                <FiTrash2 size={12} /> Sil
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