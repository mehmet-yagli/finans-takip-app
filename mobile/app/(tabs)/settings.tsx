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
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext'; // 🟢 GLOBAL BEYNİ ÇAĞIRDIK

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const DEFAULT_RATE = 43.88; // API Çökerse diye yedek kur

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YASASI
// ==========================================
const dict: any = {
  tr: {
    pageTitle: 'Ayarlar', pageSub: 'Hesap ayarlarınızı ve tercihlerinizi buradan yönetin.',
    tabProfile: 'Profil', tabBudget: 'Bütçe Limitleri', tabRecurring: 'Düzenli İşlemler', tabSec: 'Güvenlik', tabPref: 'Tercihler', tabNotif: 'Bildirimler',
    profTitle: 'Profil', profSub: 'Kişisel bilgilerinizi güncelleyin ve profilinizi yönetin.', name: 'Ad Soyad', email: 'E-posta Adresi', save: 'Değişiklikleri Kaydet', saving: 'Kaydediliyor...',
    budgTitle: 'Kategori Bütçeleri', budgSub: 'Harcama kategorileriniz için aylık limit belirleyin. Hedeflerinize sadık kalın.', noLimit: 'Limit Yok',
    recTitle: 'Düzenli İşlemler', recSub: 'Her ay otomatik işlenen finansal hareketlerinizi buradan kontrol edin.', emptyRec: 'Henüz düzenli işleminiz bulunmuyor.', emptyRecSub: "Ana sayfadan işlem eklerken 'Düzenli İşlem' seçeneğini kullanabilirsiniz.",
    secTitle: 'Güvenlik', secSub: 'Şifre işlemleri ve hesap güvenliği.', curPass: 'Mevcut Şifre', newPass: 'Yeni Şifre', dangerZone: 'Tehlikeli Bölge', dangerDesc: 'Hesabınızı silmek geri alınamaz bir işlemdir. Lütfen dikkatli olun.', delAcc: 'Hesabımı Kalıcı Olarak Sil',
    prefTitle: 'Tercihler', prefSub: 'Görünüm ve yerel ayarlar.', theme: 'Tema', themeDesc: 'Karanlık / Aydınlık Mod', light: 'Açık', dark: 'Koyu', lang: 'Dil', langDesc: 'Türkçe / English', curr: 'Varsayılan Para Birimi', currDesc: 'Tüm portföy için varsayılan para birimi.',
    notifTitle: 'Bildirim Tercihleri', notifSub: 'Hangi konularda bildirim almak istediğinizi yönetin.', n1: 'Aylık Bütçe Özeti', n2: 'Fiyat Alarmları', n3: 'Yeni Özellik Duyuruları', n4: 'Güvenlik Uyarıları',
    success: 'Başarılı', err: 'Hata', profOk: 'Profil bilgileriniz güncellendi.', profErr: 'Profil güncellenemedi.', secOk: 'Şifreniz başarıyla güncellendi.', secErr1: 'Lütfen mevcut ve yeni şifre alanlarını doldurun.', secErr2: 'Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.',
    delAlert: 'Hesabı Sil', delMsg: 'Hesabınızı silmek geri alınamaz bir işlemdir. Emin misiniz?', cancel: 'İptal', info: 'Bilgi', delReq: 'Hesap silme talebiniz alındı.',
    everyMonth: 'Her ayın', day: 'günü', stop: 'Durdur', stopMsg: 'Bu düzenli işlemi durdurmak istediğinize emin misiniz?' // 🟢 YENİ EKLENDİ
  },
  en: {
    pageTitle: 'Settings', pageSub: 'Manage your account settings and preferences here.',
    tabProfile: 'Profile', tabBudget: 'Budget Limits', tabRecurring: 'Recurring', tabSec: 'Security', tabPref: 'Preferences', tabNotif: 'Notifications',
    profTitle: 'Profile', profSub: 'Update your personal info and manage your profile.', name: 'Full Name', email: 'Email Address', save: 'Save Changes', saving: 'Saving...',
    budgTitle: 'Category Budgets', budgSub: 'Set monthly limits for your spending categories. Stick to your goals.', noLimit: 'No Limit',
    recTitle: 'Recurring Transactions', recSub: 'Monitor your automated monthly financial movements here.', emptyRec: 'No recurring transactions yet.', emptyRecSub: "You can use the 'Recurring' option when adding a transaction from the dashboard.",
    secTitle: 'Security', secSub: 'Password operations and account security.', curPass: 'Current Password', newPass: 'New Password', dangerZone: 'Danger Zone', dangerDesc: 'Deleting your account is irreversible. Please be careful.', delAcc: 'Delete Account Permanently',
    prefTitle: 'Preferences', prefSub: 'Appearance and local settings.', theme: 'Theme', themeDesc: 'Dark / Light Mode', light: 'Light', dark: 'Dark', lang: 'Language', langDesc: 'Türkçe / English', curr: 'Default Currency', currDesc: 'Default currency for the entire portfolio.',
    notifTitle: 'Notification Preferences', notifSub: 'Manage which topics you want to be notified about.', n1: 'Monthly Budget Summary', n2: 'Price Alerts', n3: 'New Feature Announcements', n4: 'Security Alerts',
    success: 'Success', err: 'Error', profOk: 'Your profile has been updated.', profErr: 'Failed to update profile.', secOk: 'Your password has been successfully updated.', secErr1: 'Please fill in current and new password fields.', secErr2: 'Password update failed. Check your current password.',
    delAlert: 'Delete Account', delMsg: 'Deleting your account is an irreversible action. Are you sure?', cancel: 'Cancel', info: 'Info', delReq: 'Account deletion request received.',
    everyMonth: 'Every month on day', day: '', stop: 'Stop', stopMsg: 'Are you sure you want to stop this recurring transaction?' // 🟢 YENİ EKLENDİ
  }
};

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('Profil');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🔴 Context'ten Global Verileri Çek
  const { theme, language, currency, setTheme, setLanguage, setCurrency } = useTheme();

  const t = dict[language] || dict['tr']; 
  const styles = getStyles(theme); 
  const isDark = theme === 'dark';

  const tabs = [
    { id: 'Profil', title: t.tabProfile, icon: 'user' },
    { id: 'Bütçe Limitleri', title: t.tabBudget, icon: 'pie-chart' },
    { id: 'Düzenli İşlemler', title: t.tabRecurring, icon: 'refresh-cw' },
    { id: 'Güvenlik', title: t.tabSec, icon: 'lock' },
    { id: 'Tercihler', title: t.tabPref, icon: 'settings' },
    { id: 'Bildirimler', title: t.tabNotif, icon: 'bell' }
  ];

  // --- PROFIL STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // --- GÜVENLİK STATE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- BİLDİRİMLER STATE ---
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifFeatures, setNotifFeatures] = useState(false);
  const [notifSecurity, setNotifSecurity] = useState(false);

  // 🟢 YENİ: DÜZENLİ İŞLEMLER VE CANLI KUR STATE'LERİ
  const [recurringTxs, setRecurringTxs] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE);

  const budgetCategories = [
    { name: 'Market', limit: '5.000 ₺', icon: 'shopping-cart', color: '#F59E0B' },
    { name: 'Fatura', limit: t.noLimit, icon: 'file-text', color: '#64748B' },
    { name: 'Ulaşım', limit: t.noLimit, icon: 'truck', color: '#64748B' },
    { name: 'Kira', limit: t.noLimit, icon: 'home', color: '#64748B' },
    { name: 'Eğlence', limit: '2.500 ₺', icon: 'smile', color: '#8B5CF6' },
    { name: 'Sağlık', limit: t.noLimit, icon: 'activity', color: '#64748B' },
    { name: 'Eğitim', limit: t.noLimit, icon: 'book', color: '#64748B' },
    { name: 'Giyim', limit: '1.500 ₺', icon: 'shopping-bag', color: '#10B981' },
  ];

  // 🟢 YENİ: Canlı Kur Çekme (Web ile aynı)
  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await axios.get('https://api.frankfurter.app/latest?from=USD&to=TRY');
      if (response.data && response.data.rates && response.data.rates.TRY) {
        setExchangeRate(response.data.rates.TRY);
      }
    } catch { }
  }, []);

  const fetchUserData = useCallback(async () => {
      setIsLoading(true);
      try {
          const token = await AsyncStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const res = await axios.get(`${API_URL}/auth/me`, config).catch(() => null);
          if (res && res.data) {
              setName(res.data.name || 'Mehmet Yağlı');
              setEmail(res.data.email || 'admin@gmail.com');
          }
      } catch (error) { } finally { setIsLoading(false); }
  }, []);

  // 🟢 YENİ: Düzenli İşlemleri Çekme (Web'den kopyalandı)
  const fetchRecurringTxs = useCallback(async () => {
      try {
          const token = await AsyncStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const res = await axios.get(`${API_URL}/transactions`, config);
          const onlyRecurring = res.data.filter((tx: any) => tx.isRecurring === true);
          setRecurringTxs(onlyRecurring);
      } catch (err) {
          console.log("Düzenli işlemler yüklenemedi", err);
      }
  }, []);

  useEffect(() => { 
    fetchUserData(); 
    fetchExchangeRate();
    fetchRecurringTxs(); 
  }, [fetchUserData, fetchExchangeRate, fetchRecurringTxs]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`${API_URL}/auth/updatedetails`, { name, email }, config);
        Alert.alert(t.success, t.profOk);
    } catch (error) { Alert.alert(t.err, t.profErr); } finally { setIsSaving(false); }
  };

  const handleSaveSecurity = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t.err, t.secErr1);
      return;
    }
    setIsSaving(true);
    try {
        const token = await AsyncStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`${API_URL}/auth/updatepassword`, { currentPassword, newPassword }, config);
        Alert.alert(t.success, t.secOk);
        setCurrentPassword(''); setNewPassword('');
    } catch (error) { Alert.alert(t.err, t.secErr2); } finally { setIsSaving(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t.delAlert, t.dangerDesc, [ { text: t.cancel, style: "cancel" }, { text: t.delAcc, style: "destructive", onPress: async () => { Alert.alert(t.info, t.delReq); }} ]);
  };

  // 🟢 YENİ: Düzenli İşlemi Durdurma Fonksiyonu
  const handleStopRecurring = (tx: any) => {
    Alert.alert(t.stop, t.stopMsg, [
        { text: t.cancel, style: "cancel" },
        { text: t.stop, style: "destructive", onPress: async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.put(`${API_URL}/transactions/${tx._id}`, { isRecurring: false }, config);
                fetchRecurringTxs(); // Listeyi yenile
            } catch(e) {
                Alert.alert(t.err, "İşlem durdurulamadı.");
            }
        }}
    ]);
  };

  const formatMoney = (val: number) => {
      return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderContent = () => {
    if (isLoading && activeTab === 'Profil') return <ActivityIndicator size="large" color="#3B82F6" style={{marginTop: 50}} />;

    switch (activeTab) {
      case 'Profil':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.profSub}</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.name}</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={styles.placeholder.color} /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.email}</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={styles.placeholder.color} /></View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="white" /> : <Feather name="check" size={18} color="white" />}
              <Text style={styles.primaryBtnTxt}>{isSaving ? t.saving : t.save}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'Bütçe Limitleri':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.budgTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.budgSub}</Text>
            <View style={styles.budgetGrid}>
              {budgetCategories.map((cat, idx) => (
                <View key={idx} style={styles.budgetCard}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
                    <View style={[styles.budgetIconBg, { backgroundColor: `${cat.color}15` }]}><Feather name={cat.icon as any} size={16} color={cat.color} /></View>
                    <Text style={styles.budgetName}>{cat.name}</Text>
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={[styles.budgetLimit, cat.limit === t.noLimit && {color: styles.placeholder.color}]}>{cat.limit}</Text>
                    <TouchableOpacity style={styles.editIconBtn}><Feather name="edit-2" size={14} color="#3B82F6" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'Düzenli İşlemler':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.recTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.recSub}</Text>
            
            {/* 🟢 YENİ: DÜZENLİ İŞLEMLER LİSTESİ VE EĞER BOŞSA ESKİ BOŞ EKRAN */}
            {recurringTxs.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIconBg}><Feather name="refresh-cw" size={32} color={styles.placeholder.color} /></View>
                  <Text style={styles.emptyStateTitle}>{t.emptyRec}</Text>
                  <Text style={styles.emptyStateDesc}>{t.emptyRecSub}</Text>
                </View>
            ) : (
                <View style={{gap: 12}}>
                   {recurringTxs.map((tx) => {
                       // Canlı Kur hesaplaması (Web ile aynı)
                       const displayAmount = currency === 'TRY' ? (tx.amount * exchangeRate) : tx.amount;
                       const isIncome = tx.type === 'income';

                       return (
                           <View key={tx._id} style={styles.recurringItemCard}>
                               <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                                   <View style={[styles.recurringItemIcon, {backgroundColor: isIncome ? (isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5') : (isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2')}]}>
                                       <Feather name={isIncome ? 'arrow-up-right' : 'arrow-down-left'} size={20} color={isIncome ? '#10B981' : '#EF4444'} />
                                   </View>
                                   <View style={{flexShrink: 1}}>
                                       <Text style={styles.recurringItemTitle} numberOfLines={1}>{tx.category}</Text>
                                       <View style={styles.recurringItemSubBadge}>
                                          <Text style={styles.recurringItemSubTxt} numberOfLines={1}>
                                              {tx.description || 'İsimsiz'} • {t.everyMonth} <Text style={{fontWeight:'bold'}}>{tx.recurringDay || 15}.</Text> {t.day}
                                          </Text>
                                       </View>
                                   </View>
                               </View>

                               <View style={{alignItems: 'flex-end', gap: 8}}>
                                   <Text style={[styles.recurringItemAmount, {color: isIncome ? '#10B981' : '#EF4444'}]}>
                                       {isIncome ? '+' : '-'}{currency === 'TRY' ? '₺' : '$'}{formatMoney(displayAmount)}
                                   </Text>
                                   <TouchableOpacity style={styles.recurringItemStopBtn} onPress={() => handleStopRecurring(tx)}>
                                       <Feather name="x" size={14} color="#EF4444" />
                                   </TouchableOpacity>
                               </View>
                           </View>
                       );
                   })}
                </View>
            )}
          </View>
        );

      case 'Güvenlik':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.secTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.secSub}</Text>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.curPass}</Text><TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" placeholderTextColor={styles.placeholder.color} /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.newPass}</Text><TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" placeholderTextColor={styles.placeholder.color} /></View>
            <TouchableOpacity style={[styles.primaryBtn, {alignSelf: 'flex-end', width: 'auto', paddingHorizontal: 24}]} onPress={handleSaveSecurity} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="white" /> : <Feather name="lock" size={16} color="white" />}
              <Text style={styles.primaryBtnTxt}>{isSaving ? t.saving : t.save}</Text>
            </TouchableOpacity>

            <View style={styles.dangerZone}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}><Feather name="alert-triangle" size={18} color="#EF4444" /><Text style={styles.dangerTitle}>{t.dangerZone}</Text></View>
              <Text style={styles.dangerDesc}>{t.dangerDesc}</Text>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}><Text style={styles.dangerBtnTxt}>{t.delAcc}</Text></TouchableOpacity>
            </View>
          </View>
        );

      case 'Tercihler':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.prefTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.prefSub}</Text>
            <View style={styles.prefsColumn}>
              <View style={styles.prefCard}>
                <View style={styles.prefHeader}>
                  <View style={styles.prefIconBg}><Feather name="sun" size={20} color="#F59E0B" /></View>
                  <View style={styles.toggleGroup}>
                    <TouchableOpacity onPress={() => setTheme('light')} style={[styles.toggleBtn, theme === 'light' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, theme === 'light' && styles.toggleTxtActive]}>{t.light}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.toggleBtn, theme === 'dark' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, theme === 'dark' && styles.toggleTxtActive]}>{t.dark}</Text></TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.prefTitle}>{t.theme}</Text>
                <Text style={styles.prefDesc}>{t.themeDesc}</Text>
              </View>

              <View style={styles.prefCard}>
                <View style={styles.prefHeader}>
                  <View style={[styles.prefIconBg, {backgroundColor: 'rgba(59, 130, 246, 0.15)'}]}><Feather name="globe" size={20} color="#3B82F6" /></View>
                  <View style={styles.toggleGroup}>
                    <TouchableOpacity onPress={() => setLanguage('tr')} style={[styles.toggleBtn, language === 'tr' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, language === 'tr' && styles.toggleTxtActive]}>TR</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.toggleBtn, language === 'en' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, language === 'en' && styles.toggleTxtActive]}>EN</Text></TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.prefTitle}>{t.lang}</Text>
                <Text style={styles.prefDesc}>{t.langDesc}</Text>
              </View>

              <View style={styles.prefCard}>
                 <View style={styles.prefHeader}>
                    <View style={[styles.prefIconBg, {backgroundColor: 'rgba(16, 185, 129, 0.15)'}]}><Feather name="dollar-sign" size={20} color="#10B981" /></View>
                    <View style={styles.toggleGroup}>
                      <TouchableOpacity onPress={() => setCurrency('TRY')} style={[styles.toggleBtn, currency === 'TRY' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, currency === 'TRY' && styles.toggleTxtActive]}>TRY (₺)</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setCurrency('USD')} style={[styles.toggleBtn, currency === 'USD' && styles.toggleBtnActive]}><Text style={[styles.toggleTxt, currency === 'USD' && styles.toggleTxtActive]}>USD ($)</Text></TouchableOpacity>
                    </View>
                 </View>
                 <Text style={styles.prefTitle}>{t.curr}</Text>
                 <Text style={styles.prefDesc}>{t.currDesc}</Text>
              </View>
            </View>
          </View>
        );

      case 'Bildirimler':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.notifTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.notifSub}</Text>
            <View style={styles.notifList}>
              <View style={styles.notifRow}><Text style={styles.notifTxt}>{t.n1}</Text><Switch trackColor={{ false: styles.placeholder.color, true: "#3B82F6" }} thumbColor={"#ffffff"} onValueChange={() => setNotifBudget(!notifBudget)} value={notifBudget} /></View>
              <View style={styles.notifRow}><Text style={styles.notifTxt}>{t.n2}</Text><Switch trackColor={{ false: styles.placeholder.color, true: "#3B82F6" }} thumbColor={"#ffffff"} onValueChange={() => setNotifAlerts(!notifAlerts)} value={notifAlerts} /></View>
              <View style={styles.notifRow}><Text style={styles.notifTxt}>{t.n3}</Text><Switch trackColor={{ false: styles.placeholder.color, true: "#3B82F6" }} thumbColor={"#ffffff"} onValueChange={() => setNotifFeatures(!notifFeatures)} value={notifFeatures} /></View>
              <View style={[styles.notifRow, {borderBottomWidth: 0}]}><Text style={styles.notifTxt}>{t.n4}</Text><Switch trackColor={{ false: styles.placeholder.color, true: "#3B82F6" }} thumbColor={"#ffffff"} onValueChange={() => setNotifSecurity(!notifSecurity)} value={notifSecurity} /></View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={styles.safeArea.backgroundColor} />
      
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4}}>
          <Feather name="settings" size={24} color="#3B82F6" />
          <Text style={styles.pageTitle}>{t.pageTitle}</Text>
        </View>
        <Text style={styles.pageSubtitle}>{t.pageSub}</Text>
      </View>

      <View style={{ paddingLeft: 16, marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}>
              <Feather name={tab.icon as any} size={16} color={activeTab === tab.id ? '#ffffff' : styles.placeholder.color} />
              <Text style={[styles.tabTxt, activeTab === tab.id && styles.tabTxtActive]}>{tab.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150 }}>
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>

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
    placeholder: { color: colors.textSub }, 
    
    header: { paddingHorizontal: 16, marginTop: 24, marginBottom: 16 },
    pageTitle: { color: colors.textMain, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { color: colors.textSub, fontSize: 13, fontWeight: '500', marginTop: 4 },

    tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    tabBtnActive: { backgroundColor: '#2563EB', borderColor: '#3B82F6' },
    tabTxt: { color: colors.textSub, fontSize: 13, fontWeight: '700' },
    tabTxtActive: { color: '#ffffff' },

    card: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
    cardTitle: { color: colors.textMain, fontSize: 20, fontWeight: '900', marginBottom: 8 },
    cardSubtitle: { color: colors.textSub, fontSize: 13, marginBottom: 24, lineHeight: 18 },

    inputGroup: { marginBottom: 20 },
    inputLabel: { color: colors.textSub, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, color: colors.textMain, fontSize: 15, fontWeight: '500' },

    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', padding: 16, borderRadius: 14, marginTop: 10 },
    primaryBtnTxt: { color: 'white', fontSize: 15, fontWeight: 'bold' },

    budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    budgetCard: { backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, width: '48%', marginBottom: 4 },
    budgetIconBg: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    budgetName: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },
    budgetLimit: { color: colors.textMain, fontSize: 13, fontWeight: '800' },
    editIconBtn: { padding: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 6 },

    emptyStateContainer: { alignItems: 'center', paddingVertical: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border, borderRadius: 20 },
    emptyStateIconBg: { backgroundColor: colors.innerCard, padding: 20, borderRadius: 30, marginBottom: 16 },
    emptyStateTitle: { color: colors.textMain, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    emptyStateDesc: { color: colors.textSub, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },

    // 🟢 YENİ: DÜZENLİ İŞLEMLER KART TASARIMI
    recurringItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.innerCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    recurringItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    recurringItemTitle: { color: colors.textMain, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    recurringItemSubBadge: { backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    recurringItemSubTxt: { color: colors.textSub, fontSize: 10, fontWeight: '600' },
    recurringItemAmount: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
    recurringItemStopBtn: { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA' },

    dangerZone: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: 20, marginTop: 40 },
    dangerTitle: { color: '#EF4444', fontSize: 16, fontWeight: '900' },
    dangerDesc: { color: '#EF4444', fontSize: 13, opacity: 0.8, marginBottom: 16, lineHeight: 18 },
    dangerBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, padding: 14, alignItems: 'center' },
    dangerBtnTxt: { color: '#EF4444', fontSize: 14, fontWeight: 'bold' },

    prefsColumn: { flexDirection: 'column', gap: 16 },
    prefCard: { backgroundColor: colors.innerCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
    prefHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    prefIconBg: { backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: 10 },
    
    toggleGroup: { flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: 8, padding: 4, flexShrink: 1, borderWidth: 1, borderColor: colors.border },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, flex: 1, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
    toggleTxt: { color: colors.textSub, fontSize: 12, fontWeight: 'bold' },
    toggleTxtActive: { color: colors.textMain },
    
    prefTitle: { color: colors.textMain, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    prefDesc: { color: colors.textSub, fontSize: 12 },

    notifList: { backgroundColor: colors.innerCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBg },
    notifTxt: { color: colors.textMain, fontSize: 14, fontWeight: '600' }
  });
};