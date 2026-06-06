import React, { useState, useEffect } from 'react'; // 🟢 YENİ: useEffect eklendi
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext'; // 🟢 GLOBAL BEYNİ ÇAĞIRDIK

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    appDesc: 'Finansal özgürlüğünüze adım atın.',
    emailLabel: 'E-POSTA ADRESİ', emailPlace: 'ornek@mail.com',
    passLabel: 'ŞİFRE', passPlace: '••••••••',
    loginBtn: 'Giriş Yap', loggingIn: 'Giriş Yapılıyor...',
    noAccount: 'Hesabınız yok mu?', register: 'Kayıt Ol',
    errTitle: 'Uyarı', errMsg1: 'Lütfen e-posta ve şifrenizi girin.', errMsg2: 'Sunucudan token alınamadı.', errMsg3: 'E-posta veya şifre hatalı. Veya sunucuya ulaşılamıyor.',
    errLogin: 'Giriş Başarısız',
    // 👇 YENİ: Çeviriler Eklendi
    rememberMe: 'Beni Hatırla', forgotPass: 'Şifremi Unuttum?', forgotAlert: 'Şifre sıfırlama özelliği çok yakında eklenecektir!'
  },
  en: {
    appDesc: 'Step into your financial freedom.',
    emailLabel: 'EMAIL ADDRESS', emailPlace: 'example@mail.com',
    passLabel: 'PASSWORD', passPlace: '••••••••',
    loginBtn: 'Log In', loggingIn: 'Logging In...',
    noAccount: 'Don\'t have an account?', register: 'Sign Up',
    errTitle: 'Warning', errMsg1: 'Please enter your email and password.', errMsg2: 'Could not get token from server.', errMsg3: 'Incorrect email or password. Or server unreachable.',
    errLogin: 'Login Failed',
    // 👇 YENİ: Çeviriler Eklendi
    rememberMe: 'Remember Me', forgotPass: 'Forgot Password?', forgotAlert: 'Password reset feature will be added very soon!'
  }
};

export default function LoginScreen() {
  const { theme, language } = useTheme(); // 🟢 GLOBAL BEYİNDEN VERİLERİ ÇEK
  const t = dict[language] || dict['tr'];
  const styles = getStyles(theme);
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 👇 YENİ: Beni Hatırla State'i
  const [rememberMe, setRememberMe] = useState(false);

  // 👇 YENİ: Sayfa açıldığında kayıtlı e-posta varsa getir
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.log("Kayıtlı e-posta okunamadı:", error);
      }
    };
    loadRememberedEmail();
  }, []);

  // ==========================================
  // 🟢 GERÇEK GİRİŞ (LOGIN) FONKSİYONU
  // ==========================================
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.errTitle, t.errMsg1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email.toLowerCase().trim(),
        password: password
      });

      const token = response.data.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        
        // 👇 YENİ: Beni hatırla seçiliyse kaydet, değilse sil
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', email.toLowerCase().trim());
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
        }

        console.log("Giriş başarılı, Token kaydedildi!");
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert(t.errTitle, t.errMsg2);
      }

    } catch (error) {
      console.error("Giriş Hatası:", error);
      Alert.alert(t.errLogin, t.errMsg3);
    } finally {
      setIsLoading(false);
    }
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
        {/* Dekoratif Arka Plan Görselleri (SaaS Dokunuşu) */}
        <View style={styles.decorativeCircleTop} />
        <View style={styles.decorativeCircleBottom} />

        <View style={styles.content}>
          
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.whaleIcon}>🐋</Text>
            </View>
            <Text style={styles.title}>WhaleStreet</Text>
            <Text style={styles.subtitle}>{t.appDesc}</Text>
          </View>

          <View style={styles.formContainer}>
            
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

            {/* 👇 YENİ: Beni Hatırla ve Şifremi Unuttum Satırı */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Feather name="check" size={14} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>{t.rememberMe}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert('Bilgi', t.forgotAlert)}>
                <Text style={styles.forgotPassText}>{t.forgotPass}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
               style={styles.loginButton} 
               onPress={handleLogin} 
               activeOpacity={0.8}
               disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>{t.loginBtn}</Text>
                  <Feather name="arrow-right" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>{t.noAccount} </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>{t.register}</Text>
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
      primary: '#2563EB',
      iconTint: isDark ? '#64748B' : '#94A3B8',
      blob1: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
      blob2: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)'
  };

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
    
    // SaaS Dekorasyon
    decorativeCircleTop: { position: 'absolute', top: -80, left: -50, width: 300, height: 300, backgroundColor: colors.blob1, borderRadius: 150 },
    decorativeCircleBottom: { position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, backgroundColor: colors.blob2, borderRadius: 150 },
    
    content: { paddingHorizontal: 24, zIndex: 10 },
    
    headerContainer: { alignItems: 'center', marginBottom: 40 },
    iconContainer: { width: 72, height: 72, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#BFDBFE', shadowColor: colors.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    whaleIcon: { fontSize: 36 },
    title: { fontSize: 34, fontWeight: '900', color: colors.textMain, marginBottom: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.textSub, fontWeight: '500' },
    
    // SaaS Kart Tasarımı
    formContainer: { backgroundColor: colors.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 20, elevation: 8 },
    
    inputGroup: { marginBottom: 20 },
    label: { color: colors.textSub, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, height: 56 },
    inputIcon: { paddingHorizontal: 16 },
    iconColor: { color: colors.iconTint },
    placeholder: { color: colors.textSub },
    input: { flex: 1, color: colors.textMain, fontSize: 15, fontWeight: '500', height: '100%' },
    eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
    
    // 👇 YENİ: Eklenen Stiller (Beni Hatırla)
    optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: -4, paddingHorizontal: 4 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: colors.inputBg },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxLabel: { color: colors.textSub, fontSize: 13, fontWeight: '600' },
    forgotPassText: { color: colors.primary, fontSize: 13, fontWeight: '700' },

    loginButton: { backgroundColor: colors.primary, flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    loginButtonText: { color: 'white', fontSize: 16, fontWeight: '800', marginRight: 8 },
    
    footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: colors.textSub, fontSize: 14, fontWeight: '500' },
    registerLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  });
};