import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar,
  Modal, 
  TextInput,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router'; 
import { useTheme } from '../../context/ThemeContext';


const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const DEFAULT_RATE = 45.55; 

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    greeting: 'GÜNAYDIN', quickAdd: 'Hızlı Ekle',
    netFlow: 'NET NAKİT AKIŞI', investments: 'Yatırımlar',
    totInc: 'TOPLAM GELİR', totExp: 'TOPLAM GİDER',
    analysis: 'Analiz', expenses: 'Harcamalar', invest: 'Yatırım', trend: 'Trend',
    month: 'Ay', year: '1 Yıl', waitingData: 'Veri bekleniyor...',
    budgetTrack: 'Bütçe Takibi (Bu Ay)', manage: 'Yönet', noBudget: 'Bütçe limiti ayarlanmamış.',
    subs: 'Abonelikler', totSubs: 'Aylık Toplam Üyelik', daysLeft: 'Kalan Gün', noSubs: 'Abonelik bulunmuyor.',
    recentTx: 'Son Hareketler', all: 'Tümü', income: 'Gelir', expense: 'Gider', noRecords: 'Kayıt bulunamadı.',
    whatToAdd: 'Ne eklemek istersin?', expMenu: 'Gider / Harcama', incMenu: 'Gelir (Maaş vb.)',
    newTx: 'Yeni İşlem Ekle', amount: 'TUTAR', category: 'KATEGORİ', date: 'TARİH', desc: 'AÇIKLAMA', descPlace: 'Örn: Açıklama giriniz...',
    recurring: 'Düzenli İşlem', recSub: 'Her ay otomatik olarak eklensin.', saveTx: 'İşlemi Kaydet',
    newSub: 'Yeni Abonelik Ekle', platName: 'Platform Adı (Örn: Netflix)', platPlace: 'Platform Adı', monthAmt: 'Aylık Tutar', addSub: 'Aboneliği Ekle',
    catSelect: 'Kategori Seçin',
    err: 'Hata', errAmtCat: 'Lütfen tutar ve kategori giriniz.', errSave: 'İşlem kaydedilemedi.',
    delTx: 'İşlemi Sil', delMsg: 'Silmek istediğinize emin misiniz?', cancel: 'İptal', del: 'Sil',
    errAdd: 'Eklenemedi.',
  },
  en: {
    greeting: 'GOOD MORNING', quickAdd: 'Quick Add',
    netFlow: 'NET CASH FLOW', investments: 'Investments',
    totInc: 'TOTAL INCOME', totExp: 'TOTAL EXPENSES',
    analysis: 'Analytics', expenses: 'Expenses', invest: 'Investment', trend: 'Trend',
    month: 'Mo', year: '1 Year', waitingData: 'Waiting for data...',
    budgetTrack: 'Budget Tracking (This Mo)', manage: 'Manage', noBudget: 'No budget limit set.',
    subs: 'Subscriptions', totSubs: 'Total Monthly Subs', daysLeft: 'Days Left', noSubs: 'No subscriptions found.',
    recentTx: 'Recent Transactions', all: 'All', income: 'Income', expense: 'Expense', noRecords: 'No records found.',
    whatToAdd: 'What do you want to add?', expMenu: 'Expense / Spending', incMenu: 'Income (Salary etc.)',
    newTx: 'Add New Transaction', amount: 'AMOUNT', category: 'CATEGORY', date: 'DATE', desc: 'DESCRIPTION', descPlace: 'Ex: Enter description...',
    recurring: 'Recurring Tx', recSub: 'Add automatically every month.', saveTx: 'Save Transaction',
    newSub: 'Add New Subscription', platName: 'Platform Name (Ex: Netflix)', platPlace: 'Platform Name', monthAmt: 'Monthly Amount', addSub: 'Add Subscription',
    catSelect: 'Select Category',
    err: 'Error', errAmtCat: 'Please enter amount and category.', errSave: 'Failed to save transaction.',
    delTx: 'Delete Transaction', delMsg: 'Are you sure you want to delete?', cancel: 'Cancel', del: 'Delete',
    errAdd: 'Failed to add.',
  }
};

export default function DashboardScreen() {
  const { theme, language } = useTheme(); 
  const isDark = theme === 'dark';
  const t = dict[language] || dict['tr'];
  const styles = getStyles(theme);
  
  const [activeChartTab, setActiveChartTab] = useState('Harcamalar');
  const [transactionFilter, setTransactionFilter] = useState('Tümü'); 
  const [activeCurrency, setActiveCurrency] = useState('TRY');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(6); 

  const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE);

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]); 
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState([]); 
  const [categoriesBudget, setCategoriesBudget] = useState([]); 
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState('');

  const [isQuickAddMenuVisible, setIsQuickAddMenuVisible] = useState(false); 
  const [isTransactionFormVisible, setIsTransactionFormVisible] = useState(false); 
  const [transactionType, setTransactionType] = useState('expense'); 
  const [isSubFormVisible, setIsSubFormVisible] = useState(false); 
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

  const [txAmount, setTxAmount] = useState('');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('Market'); 
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isRecurring, setIsRecurring] = useState(false); 

  const [subName, setSubName] = useState('');
  const [subPrice, setSubPrice] = useState('');

  const expenseCategories = ['Market', 'Fatura', 'Ulaşım', 'Kira', 'Eğlence', 'Sağlık', 'Eğitim', 'Giyim', 'Elektronik', 'Diğer'];
  const incomeCategories = ['Maaş', 'Yatırım', 'Freelance', 'Kira Geliri', 'Borsa/Kripto', 'Prim', 'Hediye', 'Satış', 'Diğer'];

  const getCategoryColor = (catName: string, index: number) => {
      const lower = catName?.toLowerCase() || '';
      if(lower.includes('kira')) return '#EF4444'; 
      if(lower.includes('market')) return '#F59E0B'; 
      if(lower.includes('abonelik')) return '#10B981'; 
      if(lower.includes('giyim')) return '#3B82F6'; 
      if(lower.includes('eğlence')) return '#8B5CF6'; 
      const fallback = ['#EC4899', '#14B8A6', '#F43F5E', '#6366F1'];
      return fallback[index % fallback.length];
  };

  const getAssetColor = (type: string, symbol: string) => {
    const sym = symbol?.toUpperCase() || '';
    if (sym === 'BTC' || sym === 'BITCOIN') return '#F7931A';
    if (sym === 'ETH' || sym === 'ETHEREUM') return '#627EEA';
    if (sym.includes('ALTIN') || sym === 'GOLD' || sym === 'XAU') return '#FFD700';
    if (type === 'crypto') return '#8B5CF6';
    if (type === 'stock') return '#3B82F6';
    return '#CBD5E1';
  };

  // 🟢 DÜZELTME: Web'deki "Akıllı Kur Çevrim" Motoru (Sıfır hata ile entegre edildi)
  const convertToDisplay = (amountDB: number, sourceCurrency = 'TRY') => {
      const val = Number(amountDB) || 0;
      const source = sourceCurrency?.toUpperCase() || 'TRY';

      // 1. İşlem birimi ile ekran birimi aynıysa HESAPLAMA YAPMA (80.000 TL Çözümü)[cite: 5]
      if (source === activeCurrency) {
          return val;
      }
      // 2. Çapraz kur çevrimi (Canlı exchangeRate state'ini kullanır)[cite: 5]
      if (activeCurrency === 'USD' && source === 'TRY') {
          return val / exchangeRate;
      }
      if (activeCurrency === 'TRY' && source === 'USD') {
          return val * exchangeRate;
      }
      return val;
  };

  // 🟢 DÜZELTME: CORS HATASI ÇÖZÜLDÜ. Artık Frankfurter yerine kendi backend'imizden kur çekiyor[cite: 5]
  const fetchExchangeRate = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/market`, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data && res.data.rates && res.data.rates.TRY) {
        setExchangeRate(res.data.rates.TRY);
        console.log("✅ Kur backend'den başarıyla güncellendi:", res.data.rates.TRY);
      }
    } catch { 
      console.log("⚠️ Backend'den kur alınamadı, varsayılan (45.19) kullanılacak."); 
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token'); 
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [transRes, investRes, histRes, catRes, subsRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`, config),
        axios.get(`${API_URL}/investments`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/transactions/analytics/history`, config),
        axios.get(`${API_URL}/categories?type=expense`, config).catch(() => ({ data: { categories: [] } })),
        axios.get(`${API_URL}/subscriptions`, config).catch(() => ({ data: [] }))
      ]);

      const data = transRes.data;
      
      const sortedTransactions = data.sort((a: any, b: any) => {
         const timeA = new Date(a.createdAt || a.date).getTime();
         const timeB = new Date(b.createdAt || b.date).getTime();
         if (timeA === timeB) return (b._id || '').localeCompare(a._id || '');
         return timeB - timeA; 
      });

      setRecentTransactions(sortedTransactions);
      
      let invData = [];
      if (investRes.data && Array.isArray(investRes.data.investments)) invData = investRes.data.investments;
      else if (Array.isArray(investRes.data)) invData = investRes.data;
      setInvestments(invData);

      setHistoryData(histRes.data || []);
      setCategoriesBudget(catRes.data.categories || []);

      const monthsSet = new Set<string>();
      sortedTransactions.forEach((tr: any) => {
          const d = new Date(tr.date);
          const mY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthsSet.add(mY);
      });
      const mArray = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); 
      setAvailableMonths(mArray);

      if (mArray.length > 0 && !selectedMonthYear) {
          setSelectedMonthYear(mArray[0]);
      } else if (mArray.length === 0) {
          const now = new Date();
          setSelectedMonthYear(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      }

      setSubscriptions(subsRes.data.subscriptions || subsRes.data || []);

    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate(); 
    fetchData();
  }, [fetchExchangeRate]); 

  const currentMonthTransactions = recentTransactions.filter((tr: any) => {
    if (!selectedMonthYear) return true;
    const d = new Date(tr.date);
    const trMonthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return trMonthYear === selectedMonthYear;
  });

  let totalInc = 0;
  let totalExpRaw = 0; 

  const expenseChartMap: any = {};
  
  currentMonthTransactions.forEach((tr: any) => {
      // 🟢 DÜZELTME: İşlemin veritabanındaki kuruna göre dinamik gösterim[cite: 5]
      const displayVal = convertToDisplay(tr.amount, tr.currency || 'TRY'); 
      if (tr.type === 'income') {
          totalInc += displayVal;
      } else if (tr.type === 'expense') {
          totalExpRaw += displayVal;
          expenseChartMap[tr.category || 'Diğer'] = (expenseChartMap[tr.category || 'Diğer'] || 0) + displayVal;
      }
  });

  let subsTotal = 0;
  subscriptions.forEach((sub: any) => { 
      const subPrice = convertToDisplay(Number(sub.price) || 0, sub.currency || 'TRY');
      subsTotal += subPrice;
      expenseChartMap['Abonelik'] = (expenseChartMap['Abonelik'] || 0) + subPrice;
  });

  const totalExpFinal = totalExpRaw + subsTotal; 
  const currentBalance = totalInc - totalExpFinal;

  let totalInv = 0;
  const investmentChartMap: any = {};

  investments.forEach((inv: any) => {
      const symbol = inv.symbol?.toUpperCase() || inv.name || 'DİĞER';
      const currentPrice = Number(inv.currentPrice) > 0 ? Number(inv.currentPrice) : Number(inv.price || inv.buyPrice);
      const amount = Number(inv.amount);
      const isTRYAsset = (inv.type === 'stock' && !inv.symbol?.includes('USD')) || inv.currency === 'TRY';
      
      const baseValue = amount * currentPrice;
      const sourceCurrency = isTRYAsset ? 'TRY' : 'USD';
      const displayVal = convertToDisplay(baseValue, sourceCurrency);

      totalInv += displayVal;

      if (investmentChartMap[symbol]) {
          investmentChartMap[symbol].value += displayVal;
      } else {
          investmentChartMap[symbol] = {
              name: symbol,
              value: displayVal,
              color: getAssetColor(inv.type, symbol)
          };
      }
  });

  const filteredTransactions = currentMonthTransactions.filter((t: any) => {
    if (transactionFilter === 'Tümü') return true;
    if (transactionFilter === 'Gelir') return t.type === 'income';
    if (transactionFilter === 'Gider') return t.type === 'expense';
    return true;
  });

  const displayMonth = (() => {
      if (!selectedMonthYear) return '...';
      const [year, month] = selectedMonthYear.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' });
  })();

  const changeMonth = (direction: string) => {
      const idx = availableMonths.indexOf(selectedMonthYear);
      if (idx === -1) return;
      if (direction === 'prev' && idx < availableMonths.length - 1) setSelectedMonthYear(availableMonths[idx + 1]);
      else if (direction === 'next' && idx > 0) setSelectedMonthYear(availableMonths[idx - 1]);
  };

  const expenseChartData = Object.keys(expenseChartMap)
      .map((key, index) => ({ name: key, value: expenseChartMap[key], color: getCategoryColor(key, index) }))
      .sort((a, b) => b.value - a.value).slice(0, 4);

  const investChartData = Object.values(investmentChartMap)
      .sort((a: any, b: any) => b.value - a.value).slice(0, 4);

  const activeChartData = activeChartTab === 'Harcamalar' ? expenseChartData : investChartData;
  const activeChartTotal = activeChartTab === 'Harcamalar' ? totalExpFinal : totalInv;

  const categoryBudgetStatus = categoriesBudget.filter((c:any) => c.budgetLimit > 0).map((cat:any) => {
      const spent = expenseChartMap[cat.name] || 0;
      const displayLimit = convertToDisplay(cat.budgetLimit, 'TRY'); // Limitleri TRY varsayıyoruz
      const percent = Math.min((spent / displayLimit) * 100, 100);
      return { ...cat, spent, limit: displayLimit, percent };
  }).sort((a:any, b:any) => b.percent - a.percent);

  const saveTransaction = async () => {
    if (!txAmount || !txCategory) {
      Alert.alert(t.err, t.errAmtCat);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const parsedAmount = parseFloat(txAmount.replace(',', '.'));

      // 🟢 DÜZELTME: Veritabanına tutarı bölmeden, ham haliyle ve aktif birimiyle kaydediyoruz[cite: 5]
      const newTxData = {
        type: transactionType, 
        category: txCategory,
        amount: parsedAmount,
        currency: activeCurrency, // "TRY" veya "USD" bilgisini gönderir[cite: 5]
        description: txTitle,
        date: txDate,
        isRecurring: isRecurring,
      };
      await axios.post(`${API_URL}/transactions`, newTxData, config);
      setIsTransactionFormVisible(false);
      setTxAmount(''); setTxTitle(''); setIsRecurring(false);
      fetchData(); 
    } catch (error) { Alert.alert(t.err, t.errSave); }
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(t.delTx, t.delMsg, [
        { text: t.cancel, style: "cancel" },
        { text: t.del, style: "destructive", onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API_URL}/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData(); 
        }}
    ]);
  };

  const addSubscription = async () => {
    if(!subName || !subPrice) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/subscriptions`, {
        name: subName,
        price: parseFloat(subPrice.replace(',', '.')),
        currency: activeCurrency, // Abonelik kurunu da backend'e bildiriyoruz[cite: 5]
        paymentDay: 15,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsSubFormVisible(false);
      setSubName(''); setSubPrice('');
      fetchData();
    } catch (error) { Alert.alert(t.err, t.errAdd); }
  };

  const openTransactionForm = (type: string) => {
    setIsQuickAddMenuVisible(false);
    setTransactionType(type);
    setTxCategory(type === 'income' ? 'Maaş' : 'Market');
    setTimeout(() => setIsTransactionFormVisible(true), 300);
  };

  const selectCategory = (cat: string) => {
    setTxCategory(cat);
    setIsCategoryPickerVisible(false);
  };

  const formatMoney = (val: number) => {
      return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSubIcon = (name: string) => {
      const n = name.toLowerCase();
      if(n.includes('netflix')) return <Text style={{color: '#E50914', fontSize: 24, fontWeight: '900', fontFamily: 'serif'}}>N</Text>;
      if(n.includes('youtube')) return <FontAwesome5 name="youtube" size={18} color="#FF0000" />;
      if(n.includes('spotify')) return <FontAwesome5 name="spotify" size={18} color="#1DB954" />;
      return <Text style={{color: 'white', fontSize: 18, fontWeight: '900'}}>{name.charAt(0)}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Text style={styles.userName}>Mehmet Yağlı</Text>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth('prev')} style={{padding: 8}}><Feather name="chevron-left" size={16} color={styles.placeholder.color} /></TouchableOpacity>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 4}}>
                <Feather name="calendar" size={14} color={styles.placeholder.color} />
                <Text style={styles.monthText}>{displayMonth}</Text>
              </View>
              <TouchableOpacity onPress={() => changeMonth('next')} style={{padding: 8}}><Feather name="chevron-right" size={16} color={styles.placeholder.color} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerRight}>
             <View style={styles.currencyToggle}>
                <TouchableOpacity onPress={() => setActiveCurrency('TRY')} style={[activeCurrency === 'TRY' ? styles.currencyBtnActive : styles.currencyBtn]}><Text style={activeCurrency === 'TRY' ? styles.currencyTextActive : styles.currencyText}>TRY</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveCurrency('USD')} style={[activeCurrency === 'USD' ? styles.currencyBtnActive : styles.currencyBtn]}><Text style={activeCurrency === 'USD' ? styles.currencyTextActive : styles.currencyText}>USD</Text></TouchableOpacity>
             </View>
             <TouchableOpacity style={styles.quickAddBtn} onPress={() => setIsQuickAddMenuVisible(true)}>
               <Feather name="plus" size={16} color={styles.quickAddText.color} /><Text style={styles.quickAddText}>{t.quickAdd}</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* --- ANA PORTFÖY KARTI --- */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardTitle}>{t.netFlow}</Text>
          <Text style={styles.mainCardAmount}>
             {activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(currentBalance)}
          </Text>
          <View style={styles.mainCardFooter}>
            <View style={styles.badge}><Feather name="trending-up" size={14} color="#10B981" /><Text style={styles.badgeText}>{t.investments}: {activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(totalInv)}</Text></View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => { fetchExchangeRate(); fetchData(); }}>
              {isLoading ? <ActivityIndicator size="small" color="#94A3B8" /> : <Feather name="refresh-cw" size={14} color="#94A3B8" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
             <Text style={styles.statLabel}>{t.totInc}</Text>
             <Text style={[styles.statAmount, { color: '#10B981' }]}>+{activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(totalInc)}</Text>
          </View>
          <View style={styles.statCard}>
             <Text style={styles.statLabel}>{t.totExp}</Text>
             <Text style={[styles.statAmount, { color: '#EF4444' }]}>-{activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(totalExpFinal)}</Text>
          </View>
        </View>

        {/* --- HARCAMA ANALİZİ & TREND KARTI --- */}
        <View style={styles.contentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.analysis}</Text>
          </View>
          
          <View style={styles.chartTabs}>
             <TouchableOpacity onPress={() => setActiveChartTab('Harcamalar')} style={activeChartTab === 'Harcamalar' ? styles.chartTabActive : styles.chartTab}><Text style={activeChartTab === 'Harcamalar' ? styles.chartTabTextActive : styles.chartTabText} numberOfLines={1}>{t.expenses}</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => setActiveChartTab('Yatırım')} style={activeChartTab === 'Yatırım' ? styles.chartTabActive : styles.chartTab}><Text style={activeChartTab === 'Yatırım' ? styles.chartTabTextActive : styles.chartTabText} numberOfLines={1}>{t.invest}</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => setActiveChartTab('Trend')} style={activeChartTab === 'Trend' ? styles.chartTabActive : styles.chartTab}><Text style={activeChartTab === 'Trend' ? styles.chartTabTextActive : styles.chartTabText} numberOfLines={1}>{t.trend}</Text></TouchableOpacity>
          </View>
          
          {activeChartTab === 'Trend' ? (
             <View style={{marginTop: 10}}>
                <View style={styles.timeRangeContainer}>
                   {[3, 6, 12].map(val => (
                      <TouchableOpacity key={val} onPress={() => setTimeRange(val)} style={[styles.timeRangeBtn, timeRange === val && styles.timeRangeBtnActive]}>
                         <Text style={[styles.timeRangeText, timeRange === val && styles.timeRangeTextActive]}>{val === 12 ? t.year : `${val} ${t.month}`}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
                <View style={styles.trendChart}>
                   {historyData.slice(-timeRange).map((data: any, index) => {
                      const maxVal = Math.max(...historyData.map((d:any) => Math.max(convertToDisplay(d.income, d.currency || 'TRY'), convertToDisplay(d.expense, d.currency || 'TRY')))) || 1;
                      const incHeight = Math.max((convertToDisplay(data.income, data.currency || 'TRY') / maxVal) * 100, 2); 
                      const expHeight = Math.max((convertToDisplay(data.expense, data.currency || 'TRY') / maxVal) * 100, 2);
                      const monthName = data.label.split(' ')[0].substring(0,3);

                      return (
                      <View key={index} style={styles.trendColumn}>
                         <View style={styles.trendBarsWrapper}>
                            <View style={[styles.trendBarItem, {height: `${incHeight}%`, backgroundColor: '#10B981'}]} />
                            <View style={[styles.trendBarItem, {height: `${expHeight}%`, backgroundColor: '#EF4444'}]} />
                         </View>
                         <Text style={styles.trendMonth}>{monthName}</Text>
                      </View>
                      );
                   })}
                   {historyData.length === 0 && <Text style={{color: styles.placeholder.color, textAlign: 'center', marginTop: 20}}>{t.waitingData}</Text>}
                </View>
             </View>
          ) : (
             <View style={{marginTop: 20}}>
                <View style={[styles.stackedBarContainer, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                   {activeChartData.length > 0 ? activeChartData.map((item:any, idx) => (
                      <View key={idx} style={[styles.stackedBarSlice, { width: `${(item.value / activeChartTotal) * 100}%`, backgroundColor: item.color }]} />
                   )) : <View style={[styles.stackedBarSlice, { width: '100%', backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />}
                </View>

                <View style={styles.chartLegend}>
                   {activeChartData.map((item:any, idx) => (
                      <View key={idx} style={styles.legendItem}>
                         <View style={[styles.legendDot, {backgroundColor: item.color}]}/>
                         <Text style={styles.legendText}>{item.name}</Text>
                      </View>
                   ))}
                </View>
             </View>
          )}
        </View>

        {/* --- BÜTÇE TAKİBİ (BU AY) --- */}
        <View style={styles.contentCard}>
           <View style={[styles.sectionHeader, { flexShrink: 1 }]}>
              <Text style={styles.sectionTitle}>{t.budgetTrack}</Text>
              <TouchableOpacity style={styles.manageBtn} onPress={() => router.push('/(tabs)/settings')}>
                  <Feather name="settings" size={14} color={styles.placeholder.color}/>
                  <Text style={{color: styles.placeholder.color, fontSize: 12, fontWeight: '600'}}>{t.manage}</Text>
              </TouchableOpacity>
           </View>
           
           <View style={{marginTop: 10}}>
             {categoryBudgetStatus.length > 0 ? (
                 categoryBudgetStatus.map((cat:any, idx) => {
                    const isDanger = cat.percent >= 100;
                    return (
                    <View key={idx} style={styles.budgetItem}>
                       <View style={styles.budgetTop}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                             <Text style={{fontSize: 16}}>{idx % 2 === 0 ? '🎉' : '🛍️'}</Text>
                             <Text style={styles.budgetName}>{cat.name}</Text>
                          </View>
                          <Text style={[styles.budgetValues, isDanger && {color: '#EF4444'}]}>{formatMoney(cat.spent)} / {formatMoney(cat.limit)} {activeCurrency === 'TRY' ? '₺' : '$'}</Text>
                       </View>
                       <View style={styles.budgetBarBg}>
                          <View style={[styles.budgetBarFill, {width: `${cat.percent}%`, backgroundColor: isDanger ? '#EF4444' : '#10B981'}]} />
                       </View>
                    </View>
                 )})
             ) : (
                 <Text style={{color: styles.placeholder.color, textAlign: 'center', marginVertical: 10}}>{t.noBudget}</Text>
             )}
           </View>
        </View>

        {/* --- YENİ: KAYDIRMALI (YATAY) ABONELİKLER KARTI --- */}
        <View style={[styles.contentCard, { paddingRight: 0 }]}>
          <View style={[styles.sectionHeader, { paddingRight: 20 }]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={styles.sectionTitle}>{t.subs}</Text>
              <View style={styles.subsBadge}><Text style={styles.subsBadgeText}>{subscriptions.length}</Text></View>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSubFormVisible(true)}><Feather name="plus" size={18} color={styles.iconBtnIcon.color} /></TouchableOpacity>
          </View>
          <Text style={[styles.subsTotalText, { paddingRight: 20 }]}>{t.totSubs}: {activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(subsTotal)}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
             {subscriptions.map((sub: any) => {
                const today = new Date().getDate();
                let daysLeft = sub.paymentDay - today;
                if (daysLeft < 0) daysLeft += 30;
                const percent = Math.max(5, 100 - (daysLeft * 3));

                return (
                  <View key={sub._id || sub.id} style={styles.horizontalSubCard}>
                     <View style={styles.subCardTop}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                           <View style={[styles.subIconWrapper, { backgroundColor: sub.name.toLowerCase().includes('netflix') ? '#FFEBEB' : (isDark ? '#F1F5F9' : '#334155') }]}>
                              {getSubIcon(sub.name)}
                           </View>
                           <View>
                              <Text style={styles.subName}>{sub.name}</Text>
                              <Text style={styles.subDate}>{sub.paymentDay}. GÜN</Text>
                           </View>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteTransaction(sub._id)}><Feather name="trash-2" size={14} color="#EF4444" /></TouchableOpacity>
                     </View>
                     
                     <Text style={styles.subPriceHorizontal}>
                        {activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(convertToDisplay(sub.price, sub.currency || 'TRY'))}
                     </Text>
                     
                     <View style={styles.subProgressHeader}>
                        <Text style={styles.subDaysLeft}>{daysLeft} {t.daysLeft}</Text>
                        <Text style={styles.subPercentText}>{percent}%</Text>
                     </View>
                     <View style={styles.subProgressBarBg}>
                        <View style={[styles.subProgressBarFill, {width: `${percent}%`, backgroundColor: '#EF4444'}]} />
                     </View>
                  </View>
                )
             })}
             {subscriptions.length === 0 && <Text style={{color: styles.placeholder.color, textAlign: 'center', marginTop: 10}}>{t.noSubs}</Text>}
          </ScrollView>
        </View>

        {/* --- SON HAREKETLER --- */}
        <View style={[styles.contentCard, {marginBottom: 40}]}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{t.recentTx}</Text></View>
          <View style={styles.filterTabs}>
            {[t.all, t.income, t.expense].map(tab => {
               const realFilter = tab === t.all ? 'Tümü' : (tab === t.income ? 'Gelir' : 'Gider');
               return (
                <TouchableOpacity key={tab} onPress={() => setTransactionFilter(realFilter)} style={transactionFilter === realFilter ? styles.filterBtnActive : styles.filterBtn}>
                  <Text style={transactionFilter === realFilter ? styles.filterTextActive : styles.filterText}>{tab}</Text>
                </TouchableOpacity>
               )
            })}
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.filter((t: any) => {
              if (transactionFilter === 'Tümü') return true;
              if (transactionFilter === 'Gelir') return t.type === 'income';
              if (transactionFilter === 'Gider') return t.type === 'expense';
              return true;
            }).map((item: any) => (
              <TouchableOpacity key={item._id || item.id} style={styles.transactionItem} onLongPress={() => handleDeleteTransaction(item._id)}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? (isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5') : (isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2') }]}>
                    <Feather name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} size={18} color={item.type === 'income' ? '#10B981' : '#EF4444'} />
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{item.description || item.category}</Text>
                    <Text style={styles.transactionCategory}>{item.category.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: item.type === 'income' ? '#10B981' : styles.textMain.color }]}>
                  {item.type === 'income' ? '+' : '-'}{activeCurrency === 'TRY' ? '₺' : '$'}{formatMoney(convertToDisplay(item.amount, item.currency || 'TRY'))}
                </Text>
              </TouchableOpacity>
            ))}
            {filteredTransactions.length === 0 && <Text style={{color: styles.placeholder.color, textAlign: 'center', paddingVertical: 20}}>{t.noRecords}</Text>}
          </View>
        </View>
      </ScrollView>

      {/* --- 1. MENÜ MODALI: HIZLI EKLE --- */}
      <Modal animationType="slide" transparent={true} visible={isQuickAddMenuVisible} onRequestClose={() => setIsQuickAddMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayFlex} activeOpacity={1} onPressOut={() => setIsQuickAddMenuVisible(false)}>
          <View style={styles.modalContentDark}>
            <View style={styles.modalHandle} /><Text style={styles.modalTitleDark}>{t.whatToAdd}</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOptionBtn} onPress={() => openTransactionForm('expense')}>
                <View style={[styles.modalIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}><Feather name="shopping-cart" size={24} color="#EF4444" /></View>
                <Text style={styles.modalOptionTextDark}>{t.expMenu}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOptionBtn} onPress={() => openTransactionForm('income')}>
                <View style={[styles.modalIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}><Feather name="dollar-sign" size={24} color="#10B981" /></View>
                <Text style={styles.modalOptionTextDark}>{t.incMenu}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- 2. GÖRSELDEKİ GELİŞMİŞ FORM MODALI --- */}
      <Modal animationType="slide" transparent={true} visible={isTransactionFormVisible} onRequestClose={() => setIsTransactionFormVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayFlex}>
            <View style={styles.formModalContentDark}>
               
               {isCategoryPickerVisible && (
                 <View style={styles.categoryPickerOverlayDark}>
                    <View style={styles.modalHeader}>
                       <Text style={styles.modalTitleDark}>{t.catSelect}</Text>
                       <TouchableOpacity onPress={() => setIsCategoryPickerVisible(false)}><Feather name="x" size={24} color={styles.placeholder.color} /></TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                       {(transactionType === 'expense' ? expenseCategories : incomeCategories).map((cat, index) => (
                          <TouchableOpacity key={index} style={[styles.categoryOptionDark, txCategory === cat && styles.categoryOptionActiveDark]} onPress={() => selectCategory(cat)}>
                            <Text style={[styles.categoryOptionTextDark, txCategory === cat && {color: '#60A5FA', fontWeight: 'bold'}]}>{cat}</Text>
                            {txCategory === cat && <Feather name="check" size={18} color="#60A5FA" />}
                          </TouchableOpacity>
                       ))}
                    </ScrollView>
                 </View>
               )}

               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitleDark}>{t.newTx}</Text>
                 <TouchableOpacity onPress={() => setIsTransactionFormVisible(false)}><Feather name="x" size={22} color={styles.placeholder.color} /></TouchableOpacity>
               </View>

               <View style={styles.formTabsContainerDark}>
                  <TouchableOpacity onPress={() => {setTransactionType('expense'); setTxCategory('Market');}} style={[styles.formTabBtnDark, transactionType === 'expense' && styles.formTabBtnActiveDark]}>
                     <Text style={[styles.formTabTxtDark, transactionType === 'expense' && {color: '#EF4444'}]}>{t.expMenu}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {setTransactionType('income'); setTxCategory('Maaş');}} style={[styles.formTabBtnDark, transactionType === 'income' && styles.formTabBtnActiveDark]}>
                     <Text style={[styles.formTabTxtDark, transactionType === 'income' && {color: '#10B981'}]}>{t.incMenu}</Text>
                  </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                   <View style={styles.inputGroup}>
                     <Text style={styles.inputLabelDark}>{t.amount}</Text>
                     <View style={styles.amountFieldDark}>
                       <TextInput style={styles.amountInputDark} placeholder="0.00" placeholderTextColor={styles.placeholder.color} keyboardType="numeric" value={txAmount} onChangeText={setTxAmount} />
                       <View style={styles.currencyBadgeDark}><Text style={styles.currencyBadgeTxtDark}>{activeCurrency === 'TRY' ? '₺ TRY' : '$ USD'}</Text></View>
                     </View>
                   </View>
                   <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabelDark}>{t.category}</Text>
                        <TouchableOpacity style={styles.dropdownFieldDark} onPress={() => setIsCategoryPickerVisible(true)}>
                           <Text style={styles.dropdownTxtDark}>{txCategory}</Text>
                           <Feather name="chevron-down" size={18} color={styles.placeholder.color}/>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabelDark}>{t.date}</Text>
                        <TextInput style={styles.dropdownFieldDark} placeholder="YYYY-AA-GG" placeholderTextColor={styles.placeholder.color} value={txDate} onChangeText={setTxDate} />
                      </View>
                   </View>
                   <View style={styles.inputGroup}>
                     <Text style={styles.inputLabelDark}>{t.desc}</Text>
                     <TextInput style={styles.textFieldDark} placeholder={t.descPlace} placeholderTextColor={styles.placeholder.color} value={txTitle} onChangeText={setTxTitle} />
                   </View>
                   <View style={styles.recurringBoxDark}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                         <View style={styles.recurringIconDark}><Feather name="refresh-cw" size={16} color="#60A5FA"/></View>
                         <View>
                            <Text style={styles.recurringTitleDark}>{t.recurring}</Text>
                            <Text style={styles.recurringSubDark}>{t.recSub}</Text>
                         </View>
                      </View>
                      <Switch trackColor={{ false: isDark ? "#334155" : "#E2E8F0", true: "#3B82F6" }} thumbColor={"#ffffff"} onValueChange={() => setIsRecurring(!isRecurring)} value={isRecurring} />
                   </View>
                   <TouchableOpacity style={[styles.saveBtn, { backgroundColor: transactionType === 'expense' ? '#DC2626' : '#059669' }]} onPress={saveTransaction}>
                     <Feather name="check" size={20} color="white" />
                     <Text style={styles.saveBtnText}>{t.saveTx}</Text>
                   </TouchableOpacity>
               </ScrollView>
            </View>
         </KeyboardAvoidingView>
      </Modal>

      {/* --- ABONELİK EKLEME MODALI --- */}
      <Modal animationType="fade" transparent={true} visible={isSubFormVisible} onRequestClose={() => setIsSubFormVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayFlex}>
            <View style={styles.formModalContentDark}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitleDark}>{t.newSub}</Text>
                 <TouchableOpacity onPress={() => setIsSubFormVisible(false)}><Feather name="x" size={24} color={styles.placeholder.color} /></TouchableOpacity>
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabelDark}>{t.platName}</Text>
                 <TextInput style={styles.textFieldDark} placeholder={t.platPlace} placeholderTextColor={styles.placeholder.color} value={subName} onChangeText={setSubName} />
               </View>
               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabelDark}>{t.monthAmt}</Text>
                 <TextInput style={styles.textFieldDark} placeholder="0.00" placeholderTextColor={styles.placeholder.color} keyboardType="numeric" value={subPrice} onChangeText={setSubPrice} />
               </View>
               <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#E50914', marginTop: 10 }]} onPress={addSubscription}>
                 <Text style={styles.saveBtnText}>{t.addSub}</Text>
               </TouchableOpacity>
            </View>
         </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// 🟢 DİNAMİK TEMA MOTORU (DARK & LIGHT)
// ==========================================
const getStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  const colors = {
      bg: isDark ? '#0F172A' : '#F1F5F9',
      cardBg: isDark ? '#1E293B' : '#FFFFFF', 
      innerCard: isDark ? '#0F172A' : '#F8FAFC', 
      textMain: isDark ? '#F8FAFC' : '#1E293B', 
      textSub: isDark ? '#94A3B8' : '#64748B', 
      border: isDark ? '#334155' : '#E2E8F0', 
      inputBg: isDark ? '#0F172A' : '#F8FAFC',
      modalBg: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.5)'
  };

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, paddingHorizontal: 16 },
    placeholder: { color: colors.textSub },
    textMain: { color: colors.textMain },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20, marginBottom: 24 },
    headerLeft: { flex: 1 },
    greeting: { color: '#3B82F6', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    userName: { color: colors.textMain, fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border },
    monthText: { color: colors.textMain, fontSize: 13, fontWeight: '600' },
    
    headerRight: { alignItems: 'flex-end', gap: 12 },
    currencyToggle: { flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: colors.border },
    currencyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    currencyBtnActive: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    currencyTextActive: { color: colors.textMain, fontSize: 11, fontWeight: 'bold' },
    currencyText: { color: colors.textSub, fontSize: 11, fontWeight: 'bold' },
    quickAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#F8FAFC' : '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
    quickAddText: { color: isDark ? '#0F172A' : '#F8FAFC', fontSize: 13, fontWeight: 'bold' },

    mainCard: { backgroundColor: '#2563EB', borderRadius: 24, padding: 24, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10, marginBottom: 16 },
    mainCardTitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    mainCardAmount: { color: '#ffffff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 24 },
    mainCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
    badgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
    refreshBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8 },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: colors.cardBg, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    statLabel: { color: colors.textSub, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    statAmount: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

    contentCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 1 }, 
    
    sectionTitle: { color: colors.textMain, fontSize: 18, fontWeight: '800', letterSpacing: -0.5, flexShrink: 1 },
    iconBtn: { backgroundColor: colors.border, padding: 6, borderRadius: 8 },
    iconBtnIcon: { color: colors.textMain },

    chartTabs: { flexDirection: 'row', backgroundColor: colors.innerCard, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: colors.border },
    chartTabActive: { backgroundColor: colors.border, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
    chartTab: { paddingVertical: 8, paddingHorizontal: 8, flex: 1, alignItems: 'center' },
    chartTabTextActive: { color: colors.textMain, fontSize: 12, fontWeight: 'bold' },
    chartTabText: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },
    
    timeRangeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    timeRangeBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    timeRangeBtnActive: { backgroundColor: colors.border, borderColor: isDark ? '#475569' : '#CBD5E1' },
    timeRangeText: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },
    timeRangeTextActive: { color: colors.textMain, fontSize: 12, fontWeight: 'bold' },
    trendChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingTop: 20 },
    trendColumn: { alignItems: 'center' },
    trendBarsWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120, marginBottom: 12 },
    trendBarItem: { width: 12, borderRadius: 4, minHeight: 4 },
    trendMonth: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },

    stackedBarContainer: { flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.border, width: '100%', marginBottom: 24 },
    stackedBarSlice: { height: '100%' },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: colors.textMain, fontSize: 13, fontWeight: '600' },

    manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.innerCard, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    budgetItem: { marginBottom: 18 },
    budgetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    budgetName: { color: colors.textMain, fontWeight: 'bold', fontSize: 14 },
    budgetValues: { color: colors.textSub, fontSize: 13, fontWeight: '700' },
    budgetBarBg: { height: 6, backgroundColor: colors.innerCard, borderRadius: 3, overflow: 'hidden' },
    budgetBarFill: { height: 6, borderRadius: 3 },

    subsBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    subsBadgeText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
    subsTotalText: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: 16 },
    
    horizontalSubCard: { backgroundColor: colors.innerCard, borderRadius: 16, padding: 16, width: 220, borderWidth: 1, borderColor: colors.border },
    subCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    subIconWrapper: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    subName: { color: colors.textMain, fontSize: 15, fontWeight: '800' },
    subDate: { color: colors.textSub, fontSize: 10, fontWeight: '700', marginTop: 2 },
    subPriceHorizontal: { color: colors.textMain, fontSize: 18, fontWeight: '900', marginBottom: 12 },
    subProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    subDaysLeft: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
    subPercentText: { color: colors.textSub, fontSize: 11, fontWeight: 'bold' },
    subProgressBarBg: { height: 6, backgroundColor: colors.cardBg, borderRadius: 3 },
    subProgressBarFill: { height: 6, borderRadius: 3 },

    filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterBtnActive: { backgroundColor: isDark ? '#F8FAFC' : '#1E293B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    filterBtn: { backgroundColor: colors.innerCard, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    filterTextActive: { color: isDark ? '#0F172A' : '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
    filterText: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },
    transactionsList: { gap: 4 },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    transactionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    transactionTitle: { color: colors.textMain, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    transactionCategory: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    transactionAmount: { fontSize: 15, fontWeight: '900' },

    modalOverlayFlex: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'flex-end' },
    modalContentDark: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: colors.border },
    modalHandle: { width: 40, height: 4, backgroundColor: isDark ? '#475569' : '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitleDark: { color: colors.textMain, fontSize: 20, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
    modalOptions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    modalOptionBtn: { alignItems: 'center' },
    modalIconBg: { width: 70, height: 70, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    modalOptionTextDark: { color: colors.textMain, fontSize: 13, fontWeight: '700' },
    
    formModalContentDark: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, height: '85%', position: 'relative', borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    
    formTabsContainerDark: { flexDirection: 'row', backgroundColor: colors.innerCard, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    formTabBtnDark: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    formTabBtnActiveDark: { backgroundColor: colors.border, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    formTabTxtDark: { color: colors.textSub, fontWeight: 'bold', fontSize: 13 },
    
    inputGroup: { marginBottom: 20 },
    rowInputs: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    halfInput: { flex: 1 },
    inputLabelDark: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    
    amountFieldDark: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingRight: 8 },
    amountInputDark: { flex: 1, color: colors.textMain, fontSize: 24, fontWeight: '900', padding: 16 },
    currencyBadgeDark: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    currencyBadgeTxtDark: { color: colors.textMain, fontWeight: '800', fontSize: 13 },

    dropdownFieldDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 12 },
    dropdownTxtDark: { color: colors.textMain, fontSize: 15, fontWeight: '600' },
    textFieldDark: { backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 12, color: colors.textMain, fontSize: 15, fontWeight: '500' },

    recurringBoxDark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.innerCard, borderWidth: 1, borderColor: '#1E3A8A', padding: 16, borderRadius: 12, marginBottom: 24 },
    recurringIconDark: { backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 10, borderRadius: 8 },
    recurringTitleDark: { color: '#60A5FA', fontWeight: 'bold', fontSize: 14 },
    recurringSubDark: { color: colors.textSub, fontSize: 11, marginTop: 2, fontWeight: '600' },
    
    saveBtn: { flexDirection: 'row', justifyContent: 'center', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    saveBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },

    categoryPickerOverlayDark: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.cardBg, zIndex: 100, borderRadius: 24, padding: 24 },
    categoryOptionDark: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    categoryOptionActiveDark: { backgroundColor: colors.innerCard, borderRadius: 10, paddingHorizontal: 12, borderBottomWidth: 0 },
    categoryOptionTextDark: { color: colors.textMain, fontSize: 15, fontWeight: '600' },
  });
};