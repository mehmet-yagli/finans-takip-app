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
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext'; 

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    pageTitle: 'Piyasa Merkezi', pageSub: 'Canlı kripto paralar, döviz kurları ve trendler.',
    loading: 'YÜKLENİYOR', live: 'CANLI',
    currencyTitle: 'Döviz Kurları (Canlı)', usd: 'AMERİKAN DOLARI', eur: 'AVRUPA EUROSU', gbp: 'İNGİLİZ STERLİNİ',
    sentiment: 'Piyasa Algısı', fear: 'KORKU', greed: 'AÇGÖZLÜLÜK',
    tipTitle: 'Günün İpucu', gotIt: 'Anladım',
    tabPop: 'Popüler', tabStock: 'Hisseler', tabWatch: 'Takip Listem',
    colAsset: 'VARLIK', colPrice: 'FİYAT', col24h: '24S',
    emptyWatch: 'Takip listeniz boş. Yukarıdan varlık ekleyebilirsiniz.', emptyGen: 'Gösterilecek varlık bulunamadı.',
    addWatchBtn: 'Sadece Takip Listeme Ekle', vol: 'Hacim',
    modalTitle: 'Takip Listeme Ekle', modalSub: 'Eklediğiniz bu varlık portföyünüze (bütçenize) değil, sadece piyasa takibiniz için "Takip Listem" sekmesine eklenecektir.',
    symLabel: 'SEMBOL (ÖRN: SOL, AVAX)', symPlace: 'Sembol...', nameLabel: 'VARLIK İSMİ (İsteğe Bağlı)', namePlace: 'Örn: Solana',
    addBtnTxt: 'Canlı Fiyatı Çek ve Ekle',
    errMissing: 'Eksik Bilgi', errMsg: 'Lütfen sembol ve isim giriniz.',
    tips: [
        "Piyasadaki dalgalanmaları fırsata çevirmek için uzun vadeli hedeflerinize odaklanın.",
        "Yatırımlarınızı çeşitlendirmek riskinizi azaltmanın en iyi yoludur.",
        "Düşüş trendlerinde panik satışı yapmak yerine, piyasayı analiz edin.",
        "Sadece kaybetmeyi göze alabileceğiniz miktarlarla riskli yatırımlar yapın.",
        "Temettü veren hisseler (THYAO, TUPRS), pasif gelir için harika bir seçenektir."
    ]
  },
  en: {
    pageTitle: 'Market Center', pageSub: 'Live cryptocurrencies, exchange rates and trends.',
    loading: 'LOADING', live: 'LIVE',
    currencyTitle: 'Exchange Rates (Live)', usd: 'US DOLLAR', eur: 'EURO', gbp: 'BRITISH POUND',
    sentiment: 'Market Sentiment', fear: 'FEAR', greed: 'GREED',
    tipTitle: 'Daily Tip', gotIt: 'Got It',
    tabPop: 'Popular', tabStock: 'Stocks', tabWatch: 'Watchlist',
    colAsset: 'ASSET', colPrice: 'PRICE', col24h: '24H',
    emptyWatch: 'Your watchlist is empty. Add assets from below.', emptyGen: 'No assets to display.',
    addWatchBtn: 'Add to Watchlist Only', vol: 'Cap',
    modalTitle: 'Add to Watchlist', modalSub: 'This asset will only be added to your "Watchlist" tab for market tracking, not to your budget portfolio.',
    symLabel: 'SYMBOL (EX: SOL, AVAX)', symPlace: 'Symbol...', nameLabel: 'ASSET NAME (Optional)', namePlace: 'Ex: Solana',
    addBtnTxt: 'Fetch Live Price & Add',
    errMissing: 'Missing Info', errMsg: 'Please enter a symbol and name.',
    tips: [
        "Focus on your long-term goals to turn market fluctuations into opportunities.",
        "Diversifying your investments is the best way to reduce risk.",
        "Instead of panic selling during downtrends, analyze the market.",
        "Make risky investments only with amounts you can afford to lose.",
        "Dividend-paying stocks are a great option for passive income."
    ]
  }
};

export default function MarketScreen() {
  const { theme, language } = useTheme(); 
  const t = dict[language] || dict['tr']; 
  const styles = getStyles(theme); 

  const [activeTab, setActiveTab] = useState('Kripto'); 
  const [isLoading, setIsLoading] = useState(true);

  // --- API VE VERİ STATE'LERİ ---
  const [marketData, setMarketData] = useState<any[]>([]); 
  const [customWatchlist, setCustomWatchlist] = useState<any[]>([]); 
  
  // Canlı Döviz Kurları
  const [exchangeRates, setExchangeRates] = useState({ USD: 43.96, EUR: 51.89, GBP: 59.22 }); 
  
  // Günün İpucu State'leri
  const [dailyTip, setDailyTip] = useState(t.tips[0]);
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);

  // --- ÖZEL VARLIK EKLEME MODALI STATE'LERİ ---
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [watchSymbol, setWatchSymbol] = useState('');
  const [watchName, setWatchName] = useState('');
  const [isAdding, setIsAdding] = useState(false); 

  // ==========================================
  // 🟢 1. API'DEN CANLI PİYASA & İPUCU ÇEKME (DÜZELTİLDİ)
  // ==========================================
  const fetchMarketData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(`${API_URL}/market`, config).catch(() => null);
      
      let hasValidData = false;

      // YENİ BACKEND YAPISINA UYGUN PARSER
      if (res && res.data && !res.data.error && (res.data.crypto || res.data.stocks)) {
         const { crypto, stocks, rates } = res.data;
         
         const formattedCrypto = (crypto || []).map((c: any) => ({
             id: c.id,
             name: c.name,
             symbol: c.symbol.toUpperCase(),
             price: `$${c.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`,
             change: `${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h?.toFixed(2)}%`,
             isUp: c.price_change_percentage_24h >= 0,
             cap: c.market_cap ? `$${(c.market_cap / 1e9).toFixed(2)}B` : '--',
             isFav: false,
             color: getAssetColor(c.symbol),
             type: 'crypto'
         }));

         const formattedStocks = (stocks || []).map((s: any) => ({
             id: s.id,
             name: s.name,
             symbol: s.symbol,
             price: `${s.price.toLocaleString(undefined, {minimumFractionDigits: 2})} ${s.currency === 'TRY' ? '₺' : '$'}`,
             change: `${s.change > 0 ? '+' : ''}${s.change?.toFixed(2)}%`,
             isUp: s.change >= 0,
             cap: s.marketCap ? (typeof s.marketCap === 'number' ? `${(s.marketCap / 1e9).toFixed(2)}B ${s.currency === 'TRY' ? '₺' : '$'}` : s.marketCap) : '--',
             isFav: false,
             color: getAssetColor(s.symbol),
             type: 'stock'
         }));

         if (formattedCrypto.length > 0 || formattedStocks.length > 0) {
             setMarketData([...formattedCrypto, ...formattedStocks]);
             hasValidData = true;
         }

         if (rates && rates.TRY) {
             setExchangeRates({
                 USD: rates.TRY,
                 EUR: rates.TRY / (rates.EUR || 1), // Çapraz kur
                 GBP: rates.TRY / (rates.GBP || 1)
             });
         }
      }
      
      if (!hasValidData) {
         // Fallback
         setMarketData([
            { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: '$65.935,00', change: '-1.77%', isUp: false, cap: '$1317.18B', isFav: false, color: '#F7931A', type: 'crypto' },
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: '$1.930,21', change: '-4.49%', isUp: false, cap: '$232.71B', isFav: false, color: '#627EEA', type: 'crypto' },
            { id: 'usdt', name: 'Tether', symbol: 'USDT', price: '$1,00', change: '0.00%', isUp: true, cap: '$183.58B', isFav: false, color: '#26A17B', type: 'crypto' },
            { id: 'bnb', name: 'BNB', symbol: 'BNB', price: '$615,34', change: '-2.04%', isUp: false, cap: '$83.83B', isFav: false, color: '#F3BA2F', type: 'crypto' },
            { id: 'xrp', name: 'XRP', symbol: 'XRP', price: '$1,36', change: '-2.90%', isUp: false, cap: '$83.01B', isFav: false, color: '#E2E8F0', type: 'crypto' }, 
            { id: 'thyao', name: 'Türk Hava Yolları', symbol: 'THYAO', price: '285,50 ₺', change: '+1.25%', isUp: true, cap: '390B ₺', isFav: true, color: '#DC2626', type: 'stock' },
            { id: 'tuprs', name: 'Tüpraş', symbol: 'TUPRS', price: '168,40 ₺', change: '+0.90%', isUp: true, cap: '320B ₺', isFav: true, color: '#F59E0B', type: 'stock' },
            { id: 'sasa', name: 'SASA Polyester', symbol: 'SASA', price: '38,40 ₺', change: '+2.10%', isUp: true, cap: '200B ₺', isFav: false, color: '#3B82F6', type: 'stock' },
            { id: 'garan', name: 'Garanti BBVA', symbol: 'GARAN', price: '68,20 ₺', change: '-1.10%', isUp: false, cap: '280B ₺', isFav: false, color: '#10B981', type: 'stock' },
            { id: 'aapl', name: 'Apple Inc.', symbol: 'AAPL', price: '$175,80', change: '-0.45%', isUp: false, cap: '$2.8T', isFav: false, color: '#A2AAAD', type: 'stock' },
            { id: 'tsla', name: 'Tesla Inc.', symbol: 'TSLA', price: '$210,30', change: '+3.50%', isUp: true, cap: '$700B', isFav: false, color: '#E82127', type: 'stock' },
         ]);
      }

      const savedWatchlist = await AsyncStorage.getItem('customWatchlist');
      if (savedWatchlist) setCustomWatchlist(JSON.parse(savedWatchlist));

    } catch (error) {
      console.log("Piyasa verisi çekilemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDailyTip = async () => {
      try {
          const token = await AsyncStorage.getItem('token');
          const res = await axios.get(`${API_URL}/ai/tip`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
          if (res && res.data && res.data.tip) {
              setDailyTip(res.data.tip);
          } else {
              setDailyTip(t.tips[Math.floor(Math.random() * t.tips.length)]);
          }
      } catch (e) { 
          setDailyTip(t.tips[Math.floor(Math.random() * t.tips.length)]);
      }
  };

  useEffect(() => {
    fetchMarketData();
    fetchDailyTip();
    
    const interval = setInterval(() => {
        fetchMarketData();
        fetchDailyTip(); 
    }, 300000); 
    
    return () => clearInterval(interval); 
  }, [fetchMarketData, language]); 

  // ==========================================
  // 🟢 2. ÖZEL TAKİP LİSTESİ İŞLEMLERİ 
  // ==========================================
  const toggleFavorite = (id: string) => {
    setMarketData(marketData.map(item => item.id === id ? { ...item, isFav: !item.isFav } : item));
  };

  const getCoinGeckoId = (symbol: string) => {
    const mapping: any = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'XRP': 'ripple', 
      'ADA': 'cardano', 'SOL': 'solana', 'DOT': 'polkadot', 'DOGE': 'dogecoin', 
      'AVAX': 'avalanche-2', 'MATIC': 'matic-network', 'TRX': 'tron', 'USDT': 'tether',
      'PEPE': 'pepe', 'SHIB': 'shiba-inu'
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  };

  const handleAddCustomWatchlist = async () => {
      if (!watchSymbol || !watchName) {
          Alert.alert(t.errMissing, t.errMsg);
          return;
      }
      
      setIsAdding(true);
      
      let fetchedPrice = 'Takipte...';
      let fetchedChange = '0.00%';
      let isUp = true;

      try {
          const existingItem = marketData.find(item => item.symbol.toUpperCase() === watchSymbol.toUpperCase());
          
          if (existingItem) {
              fetchedPrice = existingItem.price;
              fetchedChange = existingItem.change;
              isUp = existingItem.isUp;
          } else {
              const coinId = getCoinGeckoId(watchSymbol);
              const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`, { timeout: 5000 });
              
              if (res.data && res.data.length > 0) {
                  const coin = res.data[0];
                  fetchedPrice = `$${coin.current_price.toLocaleString()}`;
                  fetchedChange = `${coin.price_change_percentage_24h.toFixed(2)}%`;
                  isUp = coin.price_change_percentage_24h >= 0;
              }
          }
      } catch (error) { }

      const newItem = {
          id: `custom_${Date.now()}`,
          symbol: watchSymbol.toUpperCase(),
          name: watchName,
          price: fetchedPrice, 
          change: fetchedChange,
          isUp: isUp,
          cap: '--',
          isFav: true, 
          color: getAssetColor(watchSymbol),
          isCustom: true 
      };

      const newWatchlist = [...customWatchlist, newItem];
      setCustomWatchlist(newWatchlist);
      await AsyncStorage.setItem('customWatchlist', JSON.stringify(newWatchlist));

      setIsAddModalVisible(false);
      setWatchSymbol('');
      setWatchName('');
      setIsAdding(false);
      
      setActiveTab('Takip');
  };

  const handleDeleteCustomItem = async (id: string) => {
      const updatedList = customWatchlist.filter(item => item.id !== id);
      setCustomWatchlist(updatedList);
      await AsyncStorage.setItem('customWatchlist', JSON.stringify(updatedList));
  };

  // ==========================================
  // 🟢 3. GÖRÜNÜM & FİLTRELEME
  // ==========================================
  const getDisplayedData = () => {
      if (activeTab === 'Takip') {
          const mainFavs = marketData.filter(item => item.isFav);
          return [...mainFavs, ...customWatchlist];
      }
      
      return marketData.filter(item => {
          if (activeTab === 'Kripto') return item.type === 'crypto';
          if (activeTab === 'Hisse') return item.type === 'stock';
          return true;
      });
  };

  const displayedData = getDisplayedData();

  const getAssetColor = (symbol: string) => {
      const sym = symbol?.toUpperCase() || '';
      if (sym === 'BTC') return '#F7931A';
      if (sym === 'ETH') return '#627EEA';
      if (sym === 'USDT') return '#26A17B';
      if (sym === 'BNB') return '#F3BA2F';
      if (sym === 'SOL') return '#14F195';
      if (sym === 'THYAO') return '#DC2626';
      if (sym === 'TUPRS') return '#F59E0B';
      if (sym === 'SASA') return '#3B82F6';
      if (sym === 'GARAN') return '#10B981';
      if (sym === 'AAPL') return '#A2AAAD';
      if (sym === 'TSLA') return '#E82127';
      return '#3B82F6'; 
  };

  const renderIcon = (symbol: string, color: string) => {
    const sym = symbol?.toUpperCase() || '';
    if(sym === 'BTC') return <FontAwesome5 name="bitcoin" size={20} color={color} />;
    if(sym === 'ETH') return <MaterialCommunityIcons name="ethereum" size={22} color={color} />;
    if(sym === 'AAPL') return <FontAwesome5 name="apple" size={20} color={color} />;
    return <Text style={{color: color, fontWeight: '900', fontSize: 15}}>{sym.substring(0, 2)}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={styles.safeArea.backgroundColor} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4}}>
              <Feather name="globe" size={24} color="#3B82F6" />
              <Text style={styles.pageTitle}>{t.pageTitle}</Text>
            </View>
            <Text style={styles.pageSubtitle}>{t.pageSub}</Text>
          </View>
          <View style={styles.updateBadge}>
            {isLoading ? <ActivityIndicator size="small" color="#10B981" /> : <View style={styles.pulseDot} />}
            <Text style={styles.updateText}>{isLoading ? t.loading : t.live}</Text>
          </View>
        </View>

        {/* --- DÖVİZ KURLARI (YATAY SCROLL) --- */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>{t.currencyTitle}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            <View style={styles.currencyCard}>
              <View style={styles.currencyTop}>
                <View style={styles.currencyFlag}><Text style={{fontSize: 16}}>🇺🇸</Text></View>
                <Text style={styles.currencyName}>USD / TRY</Text>
              </View>
              <Text style={styles.currencyPrice}>{exchangeRates.USD.toFixed(2)} ₺</Text>
              <Text style={styles.currencySub}>{t.usd}</Text>
            </View>
            <View style={styles.currencyCard}>
              <View style={styles.currencyTop}>
                <View style={styles.currencyFlag}><Text style={{fontSize: 16}}>🇪🇺</Text></View>
                <Text style={styles.currencyName}>EUR / TRY</Text>
              </View>
              <Text style={styles.currencyPrice}>{exchangeRates.EUR.toFixed(2)} ₺</Text>
              <Text style={styles.currencySub}>{t.eur}</Text>
            </View>
            <View style={styles.currencyCard}>
              <View style={styles.currencyTop}>
                <View style={styles.currencyFlag}><Text style={{fontSize: 16}}>🇬🇧</Text></View>
                <Text style={styles.currencyName}>GBP / TRY</Text>
              </View>
              <Text style={styles.currencyPrice}>{exchangeRates.GBP.toFixed(2)} ₺</Text>
              <Text style={styles.currencySub}>{t.gbp}</Text>
            </View>
          </ScrollView>
        </View>

        {/* --- PİYASA ALGISI & GÜNÜN İPUCU --- */}
        <View style={styles.widgetsRow}>
          <View style={styles.sentimentCard}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Text style={styles.widgetTitle}>{t.sentiment}</Text>
                <Feather name="bar-chart-2" size={16} color={styles.placeholder.color} />
             </View>
             <View style={styles.sentimentBarBg}>
                <View style={[styles.sentimentBarFill, { width: '79%', backgroundColor: '#10B981' }]} />
             </View>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
                <Text style={{color: styles.placeholder.color, fontSize: 10, fontWeight: '700'}}>{t.fear}</Text>
                <Text style={{color: '#10B981', fontSize: 11, fontWeight: '900'}}>{t.greed} (79)</Text>
             </View>
          </View>
          
          <TouchableOpacity style={styles.tipCard} onPress={() => setIsTipModalVisible(true)} activeOpacity={0.9}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <View>
                   <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
                     <Text style={{fontSize: 16}}>🐋</Text>
                     <Text style={{color: 'white', fontWeight: '900', fontSize: 14}}>{t.tipTitle}</Text>
                   </View>
                   <Text style={{color: '#DBEAFE', fontSize: 11, fontWeight: '500', width: 140}} numberOfLines={2}>{dailyTip}</Text>
                </View>
                <View style={styles.tipIconBg}><Feather name="book-open" size={16} color="#2563EB" /></View>
             </View>
          </TouchableOpacity>
        </View>

        {/* --- KRİPTO / HİSSE LİSTESİ KARTI --- */}
        <View style={styles.contentCard}>
           
           <View style={styles.listHeader}>
              <View style={styles.listTabs}>
                 <TouchableOpacity onPress={() => setActiveTab('Kripto')} style={[activeTab === 'Kripto' ? styles.listTabActive : styles.listTab]}>
                    <Feather name="activity" size={14} color={activeTab === 'Kripto' ? '#3B82F6' : styles.placeholder.color} />
                    <Text style={[activeTab === 'Kripto' ? styles.listTabTextActive : styles.listTabText]}>{t.tabPop}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setActiveTab('Hisse')} style={[activeTab === 'Hisse' ? styles.listTabActive : styles.listTab]}>
                    <Feather name="briefcase" size={14} color={activeTab === 'Hisse' ? '#3B82F6' : styles.placeholder.color} />
                    <Text style={[activeTab === 'Hisse' ? styles.listTabTextActive : styles.listTabText]}>{t.tabStock}</Text>
                 </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => setActiveTab('Takip')} style={[styles.favFilterBtn, activeTab === 'Takip' && { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                 <Feather name="star" size={14} color={activeTab === 'Takip' ? '#F59E0B' : styles.placeholder.color} />
                 <Text style={{color: activeTab === 'Takip' ? '#F59E0B' : styles.placeholder.color, fontSize: 11, fontWeight: 'bold'}}>{t.tabWatch}</Text>
              </TouchableOpacity>
           </View>

           <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { flex: 2, paddingLeft: 30 }]}>{t.colAsset}</Text>
              <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>{t.colPrice}</Text>
              <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>{t.col24h}</Text>
           </View>

           <View style={{ gap: 16, marginTop: 10 }}>
              {displayedData.length > 0 ? displayedData.map((item, idx) => {
                 const isUp = String(item.change).includes('+') || !String(item.change).includes('-');
                 
                 return (
                 <View key={item.id || idx} style={styles.assetRow}>
                    
                    <View style={{flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10}}>
                       {item.isCustom ? (
                          <TouchableOpacity onPress={() => handleDeleteCustomItem(item.id)}>
                            <Feather name="trash-2" size={14} color="#EF4444" />
                          </TouchableOpacity>
                       ) : (
                          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                            <FontAwesome5 name="star" solid={item.isFav} size={14} color={item.isFav ? '#F59E0B' : styles.placeholder.color} />
                          </TouchableOpacity>
                       )}
                       
                       <View style={[styles.assetIconBg, { backgroundColor: `${item.color}15` }]}>
                          {renderIcon(item.symbol, item.color)}
                       </View>
                       <View>
                          <Text style={styles.assetSymbol}>{item.symbol}</Text>
                          <Text style={styles.assetName}>{item.name}</Text>
                       </View>
                    </View>

                    <View style={{flex: 1.5, alignItems: 'flex-end'}}>
                       <Text style={styles.assetPrice}>{item.price}</Text>
                       <Text style={styles.assetCap}>{t.vol}: {item.cap || '--'}</Text>
                    </View>

                    <View style={{flex: 1, alignItems: 'flex-end'}}>
                       <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                          <Feather name={isUp ? "trending-up" : "trending-down"} size={12} color={isUp ? '#10B981' : '#EF4444'} />
                          <Text style={{color: isUp ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 'bold'}}>{item.change}</Text>
                       </View>
                    </View>

                 </View>
                 );
              }) : (
                 <Text style={{color: styles.placeholder.color, textAlign: 'center', marginVertical: 20}}>
                    {activeTab === 'Takip' ? t.emptyWatch : t.emptyGen}
                 </Text>
              )}
           </View>
           
           <TouchableOpacity style={styles.addAssetBtn} onPress={() => setIsAddModalVisible(true)}>
              <Feather name="plus" size={16} color={styles.addAssetTxt.color} />
              <Text style={styles.addAssetTxt}>{t.addWatchBtn}</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- GÜNÜN İPUCU MODALI --- */}
      <Modal animationType="fade" transparent={true} visible={isTipModalVisible} onRequestClose={() => setIsTipModalVisible(false)}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsTipModalVisible(false)}>
            <View style={styles.tipModalContent}>
               <View style={styles.tipModalIconBg}><Text style={{fontSize: 40}}>🐋</Text></View>
               <Text style={styles.tipModalTitle}>{t.tipTitle}</Text>
               <Text style={styles.tipModalText}>{dailyTip}</Text>
               <TouchableOpacity style={styles.tipModalBtn} onPress={() => setIsTipModalVisible(false)}>
                 <Text style={styles.tipModalBtnTxt}>{t.gotIt}</Text>
               </TouchableOpacity>
            </View>
         </TouchableOpacity>
      </Modal>

      {/* --- ÖZEL TAKİP LİSTESİNE VARLIK EKLEME MODALI --- */}
      <Modal animationType="slide" transparent={true} visible={isAddModalVisible} onRequestClose={() => setIsAddModalVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayFlex}>
            <View style={styles.formModalContentDark}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitleDark}>{t.modalTitle}</Text>
                 <TouchableOpacity onPress={() => setIsAddModalVisible(false)}><Feather name="x" size={24} color={styles.placeholder.color} /></TouchableOpacity>
               </View>

               <Text style={{color: styles.placeholder.color, fontSize: 13, marginBottom: 20, lineHeight: 20}}>
                 {t.modalSub}
               </Text>

               <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabelDark}>{t.symLabel}</Text>
                     <TextInput style={styles.textFieldDark} placeholder={t.symPlace} placeholderTextColor={styles.placeholder.color} value={watchSymbol} onChangeText={setWatchSymbol} autoCapitalize="characters" />
                  </View>
                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabelDark}>{t.nameLabel}</Text>
                     <TextInput style={styles.textFieldDark} placeholder={t.namePlace} placeholderTextColor={styles.placeholder.color} value={watchName} onChangeText={setWatchName} />
                  </View>

                  <TouchableOpacity 
                     style={[styles.saveBtn, { backgroundColor: '#F59E0B', marginTop: 10 }]} 
                     onPress={handleAddCustomWatchlist}
                     disabled={isAdding}
                  >
                    {isAdding ? (
                       <ActivityIndicator color="white" />
                    ) : (
                       <>
                          <Feather name="star" size={20} color="white" />
                          <Text style={styles.saveBtnText}>{t.addBtnTxt}</Text>
                       </>
                    )}
                  </TouchableOpacity>
               </ScrollView>
            </View>
         </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// 🟢 DİNAMİK TEMA MOTORU
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
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24, marginBottom: 24 },
    headerLeft: { flex: 1 },
    pageTitle: { color: colors.textMain, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { color: colors.textSub, fontSize: 13, fontWeight: '500', marginTop: 4 },
    updateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, gap: 6 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    updateText: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    sectionTitle: { color: colors.textMain, fontSize: 16, fontWeight: '800', marginBottom: 12 },

    currencyCard: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, width: 150 },
    currencyTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    currencyFlag: { backgroundColor: colors.innerCard, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    currencyName: { color: colors.textMain, fontSize: 13, fontWeight: 'bold' },
    currencyPrice: { color: colors.textMain, fontSize: 20, fontWeight: '900', marginBottom: 4 },
    currencySub: { color: colors.textSub, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

    widgetsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    sentimentCard: { flex: 1, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, justifyContent: 'center' },
    widgetTitle: { color: colors.textMain, fontSize: 14, fontWeight: '800' },
    sentimentBarBg: { height: 8, backgroundColor: '#EF4444', borderRadius: 4, overflow: 'hidden' }, 
    sentimentBarFill: { height: '100%', borderRadius: 4 }, 
    
    tipCard: { flex: 1, backgroundColor: '#2563EB', borderRadius: 20, padding: 16, justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: {width:0, height:6}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    tipIconBg: { backgroundColor: 'white', padding: 8, borderRadius: 12 },

    contentCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16 },
    listTabs: { flexDirection: 'row', gap: 8 },
    listTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    listTabActive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    listTabText: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },
    listTabTextActive: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold' },
    favFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },

    tableHeaderRow: { flexDirection: 'row', paddingBottom: 10 },
    tableColHeader: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    assetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
    assetIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    assetSymbol: { color: colors.textMain, fontSize: 14, fontWeight: '900' },
    assetName: { color: colors.textSub, fontSize: 11, fontWeight: '600', marginTop: 2 },
    assetPrice: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },
    assetCap: { color: colors.textSub, fontSize: 10, fontWeight: '600', marginTop: 2 },
    changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

    addAssetBtn: { backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 24, gap: 8 },
    addAssetTxt: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'center', padding: 16 },
    modalOverlayFlex: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'flex-end' },
    
    tipModalContent: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    tipModalIconBg: { backgroundColor: 'rgba(59, 130, 246, 0.15)', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    tipModalTitle: { color: colors.textMain, fontSize: 22, fontWeight: '900', marginBottom: 12 },
    tipModalText: { color: colors.textSub, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    tipModalBtn: { backgroundColor: '#3B82F6', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    tipModalBtnTxt: { color: 'white', fontSize: 15, fontWeight: 'bold' },

    formModalContentDark: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: colors.border, position: 'absolute', bottom: 0, left: 0, right: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitleDark: { color: colors.textMain, fontSize: 18, fontWeight: '900' },
    inputGroup: { marginBottom: 20 },
    inputLabelDark: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    textFieldDark: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 12, color: colors.textMain, fontSize: 15, fontWeight: '500' },
    saveBtn: { flexDirection: 'row', justifyContent: 'center', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
    saveBtnText: { color: 'white', fontSize: 15, fontWeight: '800' }
  });
};