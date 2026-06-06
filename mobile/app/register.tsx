import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Alert // 🟢 YENİ: Uyarı mesajı için eklendi
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext'; // 🟢 GLOBAL BEYNİ ÇAĞIRDIK

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    appDesc: 'Saniyeler içinde hesabını oluştur.',
    nameLabel: 'AD SOYAD', namePlace: 'Adınız Soyadınız',
    emailLabel: 'E-POSTA ADRESİ', emailPlace: 'ornek@mail.com',
    passLabel: 'ŞİFRE', passPlace: '••••••••',
    registerBtn: 'Kayıt Ol',
    hasAccount: 'Zaten hesabın var mı?', loginLink: 'Giriş Yap',
    // 👇 YENİ: Kullanım Koşulları Çevirileri
    termsText: 'Kullanım Koşullarını ve Gizlilik Politikasını kabul ediyorum.',
    termsAlert: 'Kayıt olmak için kullanım koşullarını kabul etmelisiniz.',
    errTitle: 'Uyarı'
  },
  en: {
    appDesc: 'Create your account in seconds.',
    nameLabel: 'FULL NAME', namePlace: 'Your Full Name',
    emailLabel: 'EMAIL ADDRESS', emailPlace: 'example@mail.com',
    passLabel: 'PASSWORD', passPlace: '••••••••',
    registerBtn: 'Sign Up',
    hasAccount: 'Already have an account?', loginLink: 'Log In',
    // 👇 YENİ: Kullanım Koşulları Çevirileri
    termsText: 'I accept the Terms of Use and Privacy Policy.',
    termsAlert: 'You must accept the terms of use to register.',
    errTitle: 'Warning'
  }
};

export default function RegisterScreen() {
  const { theme, language } = useTheme(); // 🟢 GLOBAL BEYİNDEN VERİLERİ ÇEK
  const t = dict[language] || dict['tr'];
  const styles = getStyles(theme);
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 👇 YENİ: Kullanım Koşulları State'i
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleRegister = () => {
    // 👇 YENİ: Sözleşme onaylanmadıysa uyarı ver
    if (!acceptTerms) {
      Alert.alert(t.errTitle, t.termsAlert);
      return;
    }

    console.log("Kayıt olunuyor:", name, email);
    // Kayıt başarılıysa anasayfaya yönlendir
    router.push('/(tabs)/dashboard');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={styles.container.backgroundColor} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dekoratif Arka Plan Görselleri (SaaS Dokunuşu - Login ile uyumlu mor tonlar) */}
        <View style={styles.decorativeCircleTop} />
        <View style={styles.decorativeCircleBottom} />

        <View style={styles.content}>
          
          {/* Logo ve Başlık */}
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.whaleIcon}>🐋</Text>
            </View>
            <Text style={styles.title}>WhaleStreet</Text>
            <Text style={styles.subtitle}>{t.appDesc}</Text>
          </View>

          {/* Form Alanı (Glassmorphism & SaaS) */}
          <View style={styles.formContainer}>
            
            {/* İsim Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.nameLabel}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={20} color={styles.iconColor.color} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={t.namePlace}
                  placeholderTextColor={styles.placeholder.color}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.emailLabel}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color={styles.iconColor.color} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={t.emailPlace}
                  placeholderTextColor={styles.placeholder.color}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.passLabel}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color={styles.iconColor.color} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={t.passPlace}
                  placeholderTextColor={styles.placeholder.color}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={styles.iconColor.color} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 👇 YENİ: Kullanım Koşulları Onay Kutusu */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                  {acceptTerms && <Feather name="check" size={14} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>{t.termsText}</Text>
              </TouchableOpacity>
            </View>

            {/* Kayıt Butonu */}
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.8}>
              <Text style={styles.registerButtonText}>{t.registerBtn}</Text>
              <Feather name="user-plus" size={20} color="white" />
            </TouchableOpacity>

          </View>

          {/* Alt Bağlantı */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>{t.hasAccount} </Text>
            {/* Giriş sayfasına geri dön */}
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>{t.loginLink}</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// 🟢 DİNAMİK TEMA & SAAS TASARIMI
// ==========================================
const getStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  const colors = {
      bg: isDark ? '#0F172A' : '#F8FAFC', 
      cardBg: isDark ? '#1E293B' : '#FFFFFF', 
      inputBg: isDark ? '#0F172A' : '#F1F5F9',
      textMain: isDark ? '#F8FAFC' : '#1E293B', 
      textSub: isDark ? '#94A3B8' : '#64748B', 
      border: isDark ? '#334155' : '#E2E8F0', 
      primary: '#9333EA', // Kayıt ekranına özel Mor (Purple-600)
      primaryHover: '#C084FC',
      iconTint: isDark ? '#64748B' : '#94A3B8',
      blob1: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)',
      blob2: isDark ? 'rgba(217, 70, 239, 0.12)' : 'rgba(217, 70, 239, 0.08)'
  };

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
    
    // SaaS Dekorasyon
    decorativeCircleTop: { position: 'absolute', top: -80, left: -50, width: 300, height: 300, backgroundColor: colors.blob1, borderRadius: 150 },
    decorativeCircleBottom: { position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, backgroundColor: colors.blob2, borderRadius: 150 },
    
    content: { paddingHorizontal: 24, zIndex: 10 },
    
    headerContainer: { alignItems: 'center', marginBottom: 40 },
    iconContainer: { width: 72, height: 72, backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E9D5FF', shadowColor: colors.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    whaleIcon: { fontSize: 36 },
    title: { fontSize: 34, fontWeight: '900', color: colors.textMain, marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.textSub, fontWeight: '500' },
    
    // SaaS Kart Tasarımı
    formContainer: { backgroundColor: colors.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 20, elevation: 8 },
    
    inputGroup: { marginBottom: 18 },
    label: { color: colors.textSub, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, height: 56 },
    inputIcon: { paddingHorizontal: 16 },
    iconColor: { color: colors.iconTint },
    placeholder: { color: colors.textSub },
    input: { flex: 1, color: colors.textMain, fontSize: 15, fontWeight: '500', height: '100%' },
    eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
    
    // 👇 YENİ: Eklenen Stiller (Kullanım Koşulları)
    optionsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: -2, paddingHorizontal: 4 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: colors.inputBg },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxLabel: { color: colors.textSub, fontSize: 12, fontWeight: '600', flexShrink: 1, lineHeight: 18 },

    registerButton: { backgroundColor: colors.primary, flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    registerButtonText: { color: 'white', fontSize: 16, fontWeight: '800', marginRight: 8 },
    
    footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: colors.textSub, fontSize: 14, fontWeight: '500' },
    loginLink: { color: colors.primaryHover, fontSize: 14, fontWeight: 'bold' },
  });
};