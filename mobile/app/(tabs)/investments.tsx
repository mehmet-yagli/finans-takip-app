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
import { useTheme } from '../../context/ThemeContext'; // 🟢 GLOBAL BEYNİ ÇAĞIRDIK

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const EXCHANGE_RATE = 43.96; // Web ile birebir senkronize kur

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    pageTitle: 'Yatırımlarım', pageSub: 'Finansal portföyünün anlık özeti.', refresh: 'Güncelle',
    totInvested: 'TOPLAM PORTFÖY DEĞERİ', totValue: 'TOPLAM DEĞER', totProfit: 'TOPLAM KAR/ZARAR',
    assets: 'Varlıklarım', addInv: 'Yatırım Ekle', emptyList: 'Henüz portföyünüze bir yatırım eklemediniz.',
    cost: 'Maliyet', editInv: 'Yatırımı Düzenle', addTitle: 'Yatırım Ekle',
    crypto: 'Kripto', stock: 'Hisse', commodity: 'Altın/Emtia',
    symLabel: 'SEMBOL (ÖRN: BTC, THYAO)', symPlace: 'Sembol...', nameLabel: 'VARLIK İSMİ', namePlace: 'Örn: Bitcoin',
    amtLabel: 'ADET / MİKTAR', priceLabel: 'ALIŞ FİYATI',
    infoMerge: 'Aynı sembole sahip bir varlık eklerseniz, sistem otomatik olarak miktarı birleştirip ortalama maliyetinizi günceller.',
    addBtn: 'Portföye Ekle', saveBtn: 'Değişiklikleri Kaydet',
    errMissing: 'Eksik Bilgi', errMsg: 'Lütfen tüm alanları doldurun.',
    merged: 'Birleştirildi', mergedMsg: 'varlığınızın miktarı artırıldı ve ortalama maliyeti güncellendi.',
    success: 'Başarılı', successAdd: 'Yeni varlık portföye eklendi.', successUpd: 'Varlık başarıyla güncellendi.', successPrices: 'Tüm varlık fiyatları anlık kurlarla güncellendi!',
    err: 'Hata', errOp: 'İşlem gerçekleştirilemedi.', errPrices: 'Fiyatlar güncellenirken bir sorun oluştu.',
    delTitle: 'Varlığı Sil', delMsg: 'varlığını tamamen silmek istediğinize emin misiniz?', cancel: 'İptal', del: 'Sil', delErr: 'Silinemedi.'
  },
  en: {
    pageTitle: 'My Investments', pageSub: 'Instant overview of your financial portfolio.', refresh: 'Refresh',
    totInvested: 'TOTAL INVESTED', totValue: 'TOTAL VALUE', totProfit: 'TOTAL PROFIT/LOSS',
    assets: 'My Assets', addInv: 'Add Investment', emptyList: 'You have not added any investments to your portfolio yet.',
    cost: 'Cost', editInv: 'Edit Investment', addTitle: 'Add Investment',
    crypto: 'Crypto', stock: 'Stock', commodity: 'Commodity',
    symLabel: 'SYMBOL (EX: BTC, AAPL)', symPlace: 'Symbol...', nameLabel: 'ASSET NAME', namePlace: 'Ex: Bitcoin',
    amtLabel: 'AMOUNT', priceLabel: 'BUY PRICE',
    infoMerge: 'If you add an asset with the same symbol, the system will automatically merge the amount and update your average cost.',
    addBtn: 'Add to Portfolio', saveBtn: 'Save Changes',
    errMissing: 'Missing Info', errMsg: 'Please fill in all fields.',
    merged: 'Merged', mergedMsg: 'asset amount increased and average cost updated.',
    success: 'Success', successAdd: 'New asset added to portfolio.', successUpd: 'Asset updated successfully.', successPrices: 'All asset prices updated with live rates!',
    err: 'Error', errOp: 'Operation failed.', errPrices: 'A problem occurred while updating prices.',
    delTitle: 'Delete Asset', delMsg: 'are you sure you want to permanently delete this asset?', cancel: 'Cancel', del: 'Delete', delErr: 'Could not delete.'
  }
};

export default function InvestmentsScreen() {
  const { theme, language } = useTheme(); // 🟢 GLOBAL BEYİNDEN VERİLERİ ÇEK
  const t = dict[language] || dict['tr'];
  const styles = getStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  
  const [investments, setInvestments] = useState<any[]>([]);
  const [summary, setSummary] = useState({
      totalInvested: 0,
      totalCurrentValue: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0
  });

  // --- MODAL & FORM STATE'LERİ ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [invType, setInvType] = useState('crypto'); // crypto, stock, commodity
  const [invSymbol, setInvSymbol] = useState('');
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invBuyPrice, setInvBuyPrice] = useState('');
  const [invCurrency, setInvCurrency] = useState('TRY');

  // ==========================================
  // 🟢 1. API'DEN YATIRIMLARI ÇEKME VE AKILLI BİRLEŞTİRME
  // ==========================================
  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(`${API_URL}/investments`, config);
      
      if (res.data && Array.isArray(res.data.investments)) {
          let calcTotalInvested = 0;
          let calcTotalValue = 0;
          const groupedMap: any = {};

          // 🔥 USD -> TRY Çevirisi ve Satır Birleştirme
          res.data.investments.forEach((inv: any) => {
              if (!inv) return; 

              const sym = (inv.symbol || 'UNKNOWN').trim().toUpperCase();
              const curr = (inv.currency || 'TRY').toUpperCase();
              const rate = curr === 'USD' ? EXCHANGE_RATE : 1;
              const currentP = inv.currentPrice > 0 ? inv.currentPrice : (inv.buyPrice || 0);
              
              const costTRY = (inv.amount || 0) * (inv.buyPrice || 0) * rate;
              const valTRY = (inv.amount || 0) * currentP * rate;

              calcTotalInvested += costTRY;
              calcTotalValue += valTRY;

              if (!groupedMap[sym]) {
                  groupedMap[sym] = {
                      ...inv,
                      totalAmount: 0,
                      totalCostNative: 0, 
                      ids: [] 
                  };
              }
              
              groupedMap[sym].totalAmount += (inv.amount || 0);
              groupedMap[sym].totalCostNative += ((inv.amount || 0) * (inv.buyPrice || 0));
              if (inv._id) groupedMap[sym].ids.push(inv._id);
              groupedMap[sym].currentPrice = currentP; 
          });

          const finalInvestments = Object.values(groupedMap).map((g: any) => ({
              ...g,
              amount: g.totalAmount,
              buyPrice: g.totalAmount > 0 ? (g.totalCostNative / g.totalAmount) : 0 
          }));

          const profitLoss = calcTotalValue - calcTotalInvested;
          const profitLossPct = calcTotalInvested > 0 ? (profitLoss / calcTotalInvested) * 100 : 0;

          setSummary({
              totalInvested: calcTotalInvested,
              totalCurrentValue: calcTotalValue,
              totalProfitLoss: profitLoss,
              totalProfitLossPercentage: Number(profitLossPct.toFixed(2))
          });

          setInvestments(finalInvestments);
      }
    } catch (error) {
      console.log("Yatırımlar çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // ==========================================
  // 🟢 2. TOPLU FİYAT GÜNCELLEME (API)
  // ==========================================
  const handleUpdateAllPrices = async () => {
      setIsUpdatingPrices(true);
      try {
          const token = await AsyncStorage.getItem('token');
          await axios.put(`${API_URL}/investments/update-prices/all`, {}, { headers: { Authorization: `Bearer ${token}` } });
          await fetchInvestments(); 
          Alert.alert(t.success, t.successPrices);
      } catch (error) {
          Alert.alert(t.err, t.errPrices);
      } finally {
          setIsUpdatingPrices(false);
      }
  };

  // ==========================================
  // 🟢 3. AKILLI YATIRIM EKLEME VE DÜZENLEME
  // ==========================================
  const openModal = (mode: 'add' | 'edit', item?: any) => {
      setFormMode(mode);
      if (mode === 'edit' && item) {
          setSelectedId(item.ids && item.ids.length > 0 ? item.ids[0] : item._id); 
          setInvType(item.type || 'crypto');
          setInvSymbol(item.symbol || '');
          setInvName(item.name || '');
          setInvAmount(item.amount ? item.amount.toString() : '0');
          setInvBuyPrice(item.buyPrice ? item.buyPrice.toString() : '0');
          setInvCurrency(item.currency || 'TRY');
      } else {
          setSelectedId(null);
          setInvType('crypto');
          setInvSymbol('');
          setInvName('');
          setInvAmount('');
          setInvBuyPrice('');
          setInvCurrency('TRY');
      }
      setIsModalVisible(true);
  };

  const handleSaveInvestment = async () => {
      if (!invSymbol || !invName || !invAmount || !invBuyPrice) {
          Alert.alert(t.errMissing, t.errMsg);
          return;
      }

      const numAmount = parseFloat(invAmount.replace(',', '.'));
      const numBuyPrice = parseFloat(invBuyPrice.replace(',', '.'));

      try {
          const token = await AsyncStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          
          const payload = {
              type: invType,
              symbol: invSymbol.trim().toUpperCase(),
              name: invName.trim(),
              amount: numAmount,
              buyPrice: numBuyPrice,
              currency: invCurrency
          };

          if (formMode === 'add') {
              const existingGroup = investments.find(inv => (inv.symbol || '').trim().toUpperCase() === payload.symbol);
              
              if (existingGroup && existingGroup.ids && existingGroup.ids.length > 0) {
                  const newTotalAmount = existingGroup.amount + numAmount;
                  const oldTotalCost = existingGroup.amount * existingGroup.buyPrice;
                  const newCost = numAmount * numBuyPrice;
                  const newAvgPrice = newTotalAmount > 0 ? (oldTotalCost + newCost) / newTotalAmount : 0;

                  await axios.put(`${API_URL}/investments/${existingGroup.ids[0]}`, {
                      ...payload,
                      amount: newTotalAmount,
                      buyPrice: newAvgPrice
                  }, config);

                  if (existingGroup.ids.length > 1) {
                      for (let i = 1; i < existingGroup.ids.length; i++) {
                          if (existingGroup.ids[i]) {
                              await axios.delete(`${API_URL}/investments/${existingGroup.ids[i]}`, config);
                          }
                      }
                  }

                  Alert.alert(t.merged, `${payload.symbol} ${t.mergedMsg}`);
              } else {
                  await axios.post(`${API_URL}/investments`, payload, config);
                  Alert.alert(t.success, t.successAdd);
              }
          } else {
              if (selectedId) {
                  await axios.put(`${API_URL}/investments/${selectedId}`, payload, config);
                  
                  const existingGroup = investments.find(inv => inv.ids && inv.ids.includes(selectedId));
                  if (existingGroup && existingGroup.ids.length > 1) {
                      for (let i = 0; i < existingGroup.ids.length; i++) {
                          if (existingGroup.ids[i] && existingGroup.ids[i] !== selectedId) {
                              await axios.delete(`${API_URL}/investments/${existingGroup.ids[i]}`, config);
                          }
                      }
                  }
                  Alert.alert(t.success, t.successUpd);
              }
          }

          setIsModalVisible(false);
          fetchInvestments(); 
      } catch (error) {
          Alert.alert(t.err, t.errOp);
      }
  };

  const handleDelete = async (item: any) => {
      Alert.alert(t.delTitle, `${item.symbol} ${t.delMsg}`, [
          { text: t.cancel, style: "cancel" },
          { text: t.del, style: "destructive", onPress: async () => {
              try {
                  const token = await AsyncStorage.getItem('token');
                  const config = { headers: { Authorization: `Bearer ${token}` } };
                  
                  if (item.ids && item.ids.length > 0) {
                      for (const id of item.ids) {
                          if (id) await axios.delete(`${API_URL}/investments/${id}`, config);
                      }
                  } else if (item._id) {
                      await axios.delete(`${API_URL}/investments/${item._id}`, config);
                  }
                  
                  fetchInvestments();
              } catch (error) { Alert.alert(t.err, t.delErr); }
          }}
      ]);
  };

  const formatMoney = (val: number, currency: string = 'TRY') => {
      const sym = currency === 'USD' ? '$' : '₺';
      return `${sym}${Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAssetColor = (type: string, symbol: string) => {
      const sym = symbol?.toUpperCase() || '';
      if (sym === 'BTC') return '#F7931A';
      if (sym === 'ETH') return '#627EEA';
      if (['ALTIN', 'GOLD', 'XAU', 'GRAM'].includes(sym)) return '#F59E0B'; 
      if (type === 'crypto') return '#8B5CF6';
      if (type === 'stock') return '#3B82F6';
      return '#CBD5E1';
  };

  const renderIcon = (type: string, symbol: string, color: string) => {
      const sym = symbol?.toUpperCase() || '';
      if(sym === 'BTC') return <FontAwesome5 name="bitcoin" size={20} color={color} />;
      if(sym === 'ETH') return <MaterialCommunityIcons name="ethereum" size={22} color={color} />;
      if(['ALTIN', 'GOLD', 'XAU'].includes(sym)) return <FontAwesome5 name="coins" size={18} color={color} />;
      if(type === 'stock') return <Feather name="briefcase" size={18} color={color} />;
      return <Text style={{color: color, fontWeight: '900', fontSize: 14}}>{sym.substring(0, 2)}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View>
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4}}>
               <Feather name="briefcase" size={24} color="#3B82F6" />
               <Text style={styles.pageTitle}>{t.pageTitle}</Text>
             </View>
             <Text style={styles.pageSubtitle}>{t.pageSub}</Text>
          </View>
          <TouchableOpacity 
             style={styles.refreshBtn} 
             onPress={handleUpdateAllPrices}
             disabled={isUpdatingPrices}
          >
             {isUpdatingPrices ? <ActivityIndicator size="small" color={styles.refreshBtnTxt.color} /> : <Feather name="refresh-cw" size={16} color={styles.refreshBtnTxt.color} />}
             <Text style={styles.refreshBtnTxt}>{t.refresh}</Text>
          </TouchableOpacity>
        </View>

        {/* --- ÖZET KARTLARI --- */}
        <View style={styles.summaryContainer}>
           <View style={styles.topSummaryRow}>
              <View style={styles.topSummaryCard}>
                 <Text style={styles.summaryLabel}>{t.totInvested}</Text>
                 <Text style={styles.summaryValue}>{formatMoney(summary.totalInvested, 'TRY')}</Text>
              </View>
              <View style={styles.topSummaryCard}>
                 <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.summaryLabel}>{t.totValue}</Text>
                    <Feather name="pie-chart" size={14} color="#3B82F6" />
                 </View>
                 <Text style={styles.summaryValue}>{formatMoney(summary.totalCurrentValue, 'TRY')}</Text>
              </View>
           </View>

           <View style={styles.profitLossCard}>
              <Text style={styles.summaryLabelLight}>{t.totProfit}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                 <Text style={[styles.mainSummaryValue, { color: summary.totalProfitLoss >= 0 ? '#10B981' : '#EF4444' }]}>
                    {summary.totalProfitLoss >= 0 ? '+' : ''}{formatMoney(summary.totalProfitLoss, 'TRY')}
                 </Text>
                 <View style={[styles.badgePercent, { backgroundColor: summary.totalProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    <Feather name={summary.totalProfitLoss >= 0 ? "trending-up" : "trending-down"} size={14} color={summary.totalProfitLoss >= 0 ? '#10B981' : '#EF4444'} />
                    <Text style={{color: summary.totalProfitLoss >= 0 ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 'bold'}}>{summary.totalProfitLossPercentage}%</Text>
                 </View>
              </View>
           </View>
        </View>

        {/* --- YATIRIM LİSTESİ --- */}
        <View style={styles.listCard}>
           <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>{t.assets}</Text>
              <TouchableOpacity style={styles.addIconBtn} onPress={() => openModal('add')}>
                 <Feather name="plus" size={16} color="white" />
                 <Text style={styles.addIconBtnTxt}>{t.addInv}</Text>
              </TouchableOpacity>
           </View>

           {isLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 40 }} />
           ) : investments.length === 0 ? (
              <Text style={styles.emptyText}>{t.emptyList}</Text>
           ) : (
              <View style={{ gap: 8 }}>
                 {investments.map((inv) => {
                    const color = getAssetColor(inv.type, inv.symbol);
                    const currentPrice = inv.currentPrice > 0 ? inv.currentPrice : inv.buyPrice;
                    const currentValue = inv.amount * currentPrice;
                    const investedValue = inv.amount * inv.buyPrice;
                    const profitLoss = currentValue - investedValue;
                    const isUp = profitLoss >= 0;

                    const uniqueKey = (inv.ids && inv.ids.length > 0) ? inv.ids[0] : (inv._id || Math.random().toString());

                    return (
                    <View key={uniqueKey} style={styles.invRow}>
                       
                       {/* 🔴 SOL: İKON & İSİM (Genişlik Koruması Eklendi) */}
                       <View style={{flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 5}}>
                          <View style={[styles.invIconBg, { backgroundColor: `${color}15` }]}>
                             {renderIcon(inv.type, inv.symbol, color)}
                          </View>
                          <View style={{flex: 1}}>
                             <Text style={styles.invSymbol}>{inv.symbol}</Text>
                             <Text style={styles.invName} numberOfLines={1}>{inv.name}</Text>
                          </View>
                       </View>

                       {/* 🔴 ORTA: ADET & MALİYET (Hizalama Düzenlendi) */}
                       <View style={{flex: 1.5, alignItems: 'flex-start', justifyContent: 'center'}}>
                          <Text style={styles.invAmount} numberOfLines={1}>{inv.amount}</Text>
                          <Text style={styles.invSubText} numberOfLines={1}>{t.cost}: {formatMoney(inv.buyPrice, inv.currency)}</Text>
                       </View>

                       {/* 🔴 SAĞ: FİYAT & KAR/ZARAR (Esneklik Eklendi) */}
                       <View style={{flex: 1.8, alignItems: 'flex-end', justifyContent: 'center'}}>
                          <Text style={styles.invPrice} numberOfLines={1}>{formatMoney(currentPrice, inv.currency)}</Text>
                          <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                             <Text style={{color: isUp ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: 'bold'}} numberOfLines={1}>
                                {isUp ? '+' : ''}{formatMoney(profitLoss, inv.currency)}
                             </Text>
                          </View>
                       </View>

                       {/* İŞLEMLER (DÜZENLE/SİL) */}
                       <View style={{flex: 0.6, alignItems: 'flex-end', justifyContent: 'center', gap: 12}}>
                           <TouchableOpacity onPress={() => openModal('edit', inv)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                              <Feather name="edit-2" size={16} color="#3B82F6" />
                           </TouchableOpacity>
                           <TouchableOpacity onPress={() => handleDelete(inv)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                              <Feather name="trash-2" size={16} color="#EF4444" />
                           </TouchableOpacity>
                       </View>

                    </View>
                    );
                 })}
              </View>
           )}
        </View>

      </ScrollView>

      {/* --- YATIRIM EKLEME/DÜZENLEME MODALI --- */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.formModalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{formMode === 'add' ? t.addTitle : t.editInv}</Text>
                 <TouchableOpacity onPress={() => setIsModalVisible(false)}><Feather name="x" size={24} color={styles.placeholder.color} /></TouchableOpacity>
               </View>

               <View style={styles.typeTabs}>
                  <TouchableOpacity onPress={() => setInvType('crypto')} style={[styles.typeTab, invType === 'crypto' && styles.typeTabActive]}>
                     <Text style={[styles.typeTabTxt, invType === 'crypto' && styles.typeTabTxtActive]}>{t.crypto}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setInvType('stock')} style={[styles.typeTab, invType === 'stock' && styles.typeTabActive]}>
                     <Text style={[styles.typeTabTxt, invType === 'stock' && styles.typeTabTxtActive]}>{t.stock}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setInvType('commodity')} style={[styles.typeTab, invType === 'commodity' && styles.typeTabActive]}>
                     <Text style={[styles.typeTabTxt, invType === 'commodity' && styles.typeTabTxtActive]}>{t.commodity}</Text>
                  </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>{t.symLabel}</Text>
                        <TextInput style={styles.textField} placeholder={t.symPlace} placeholderTextColor={styles.placeholder.color} value={invSymbol} onChangeText={setInvSymbol} autoCapitalize="characters" editable={formMode === 'add'} />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>{t.nameLabel}</Text>
                        <TextInput style={styles.textField} placeholder={t.namePlace} placeholderTextColor={styles.placeholder.color} value={invName} onChangeText={setInvName} />
                      </View>
                  </View>

                  <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>{t.amtLabel}</Text>
                        <TextInput style={styles.textField} placeholder="0.00" placeholderTextColor={styles.placeholder.color} keyboardType="numeric" value={invAmount} onChangeText={setInvAmount} />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>{t.priceLabel}</Text>
                        <View style={styles.priceInputWrapper}>
                           <TextInput style={[styles.textField, {flex: 1, borderWidth: 0}]} placeholder="0.00" placeholderTextColor={styles.placeholder.color} keyboardType="numeric" value={invBuyPrice} onChangeText={setInvBuyPrice} />
                           <TouchableOpacity onPress={() => setInvCurrency(invCurrency === 'TRY' ? 'USD' : 'TRY')} style={styles.currToggleSmall}>
                              <Text style={{color: 'white', fontSize: 11, fontWeight: 'bold'}}>{invCurrency}</Text>
                           </TouchableOpacity>
                        </View>
                      </View>
                  </View>

                  {formMode === 'add' && (
                      <View style={styles.infoBox}>
                         <Feather name="info" size={16} color="#3B82F6" />
                         <Text style={styles.infoBoxTxt}>{t.infoMerge}</Text>
                      </View>
                  )}

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveInvestment}>
                    <Text style={styles.saveBtnText}>{formMode === 'add' ? t.addBtn : t.saveBtn}</Text>
                  </TouchableOpacity>
               </ScrollView>
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
    safeArea: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, paddingHorizontal: 16 },
    placeholder: { color: colors.textSub },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 24 },
    pageTitle: { color: colors.textMain, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { color: colors.textSub, fontSize: 13, fontWeight: '500', marginTop: 4 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardBg, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    refreshBtnTxt: { color: colors.textMain, fontSize: 12, fontWeight: 'bold' },

    summaryContainer: { marginBottom: 24 },
    topSummaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    topSummaryCard: { flex: 1, backgroundColor: colors.cardBg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    summaryLabel: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    summaryLabelLight: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    summaryValue: { color: colors.textMain, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    
    profitLossCard: { backgroundColor: '#2563EB', padding: 24, borderRadius: 24, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
    mainSummaryValue: { color: '#ffffff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    badgePercent: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

    listCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: colors.textMain, fontSize: 18, fontWeight: '800' },
    addIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    addIconBtnTxt: { color: isDark ? 'white' : '#1E293B', fontSize: 12, fontWeight: 'bold' },
    emptyText: { color: colors.textSub, textAlign: 'center', marginVertical: 30, fontSize: 14 },

    invRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    invIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    invSymbol: { color: colors.textMain, fontSize: 15, fontWeight: '900' },
    invName: { color: colors.textSub, fontSize: 11, fontWeight: '600', marginTop: 2, maxWidth: '95%' }, // 🔴 DÜZELTME: Taşmayı engellemek için MaxWidth eklendi
    invAmount: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },
    invSubText: { color: colors.textSub, fontSize: 10, fontWeight: '600', marginTop: 4 },
    invPrice: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },
    changeBadge: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'flex-end' },
    formModalContent: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: colors.textMain, fontSize: 20, fontWeight: '900' },
    
    typeTabs: { flexDirection: 'row', backgroundColor: colors.innerCard, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    typeTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    typeTabActive: { backgroundColor: colors.border },
    typeTabTxt: { color: colors.textSub, fontWeight: 'bold', fontSize: 13 },
    typeTabTxtActive: { color: colors.textMain },

    rowInputs: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    halfInput: { flex: 1 },
    inputLabel: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    textField: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 12, color: colors.textMain, fontSize: 15, fontWeight: '600' },
    
    priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingRight: 8 },
    currToggleSmall: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },

    infoBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
    infoBoxTxt: { color: colors.textSub, fontSize: 12, flex: 1, lineHeight: 18 },

    saveBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900' }
  });
};