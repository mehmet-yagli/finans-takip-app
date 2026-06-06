import React, { useState, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { 
  Platform, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  View, 
  Modal, 
  KeyboardAvoidingView, 
  ScrollView, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext'; 
// 🚀 YENİ: Merkezi AI Servisi dahil edildi
import aiService from '../../services/aiService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    tabDashboard: 'Özet',
    tabMarket: 'Piyasa',
    tabInvestments: 'Yatırım',
    tabCommunity: 'Topluluk',
    tabSettings: 'Ayarlar',
    online: 'Çevrimiçi',
    aiWelcome: 'Merhaba Mehmet! 🐋 Ben **Whale-E**, finansal yapay zeka asistanın. Portföyün veya piyasalar hakkında ne öğrenmek istersin?',
    aiPlaceholder: 'Asistana soru sorun (Örn: Enflasyon nedir?)',
    aiErrorConnect: 'Şu an sunucuya bağlanamıyorum ancak arayüzüm harika çalışıyor! 🐋 Backend rotasını ayarladığında sana gerçek cevaplar vereceğim.',
    aiErrorNetwork: 'Bağlantı hatası oluştu. Lütfen okyanusun derinliklerinde sinyali kontrol et! 🌊'
  },
  en: {
    tabDashboard: 'Dashboard',
    tabMarket: 'Market',
    tabInvestments: 'Portfolio',
    tabCommunity: 'Community',
    tabSettings: 'Settings',
    online: 'Online',
    aiWelcome: "Hello Mehmet! I'm **Whale-E**, your financial AI assistant. What would you like to know?",
    aiPlaceholder: 'Ask the assistant (Ex: What is inflation?)',
    aiErrorConnect: "I can't connect to the server right now, but my interface is working perfectly! 🐋",
    aiErrorNetwork: "Connection error. Please check your signal in the deep ocean! 🌊"
  }
};

export default function TabLayout() {
  const { theme, language } = useTheme(); 
  const isDark = theme === 'dark'; 
  const t = dict[language] || dict['tr']; 
  
  const tabBarBg = isDark ? '#0F172A' : '#FFFFFF';
  const tabBarBorder = isDark ? '#1E293B' : '#E2E8F0';
  const activeTabColor = '#3B82F6';
  const inactiveTabColor = isDark ? '#64748B' : '#94A3B8';

  // --- GLOBAL AI CHAT STATE'LERİ ---
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isChatVisible && chatMessages.length === 0) {
      setChatMessages([{ role: 'ai', text: t.aiWelcome }]);
    }
  }, [isChatVisible, language]);

  // 🚀 YENİ: Zengin Metin (Kalın Yazı) Render Mantığı
  const renderMessageText = (text: string, isUser: boolean) => {
    return text.split('**').map((part, i) => (
      i % 2 === 1 
        ? <Text key={i} style={{ fontWeight: '900', color: isUser ? '#FFFFFF' : '#3B82F6' }}>{part}</Text> 
        : <Text key={i}>{part}</Text>
    ));
  };

  const handleSendChatMessage = async () => {
    if(!chatInput.trim()) return;
    
    const userMsg = { role: 'user', text: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
        // 🚀 GÜNCELLEME: Doğrudan aiService üzerinden Gemini 2.5 Flash'a gider
        const response = await aiService.chatWithAI(userMsg.text);
        
        if (response && response.answer) {
            setChatMessages(prev => [...prev, { role: 'ai', text: response.answer }]);
        } else {
            setChatMessages(prev => [...prev, { role: 'ai', text: t.aiErrorConnect }]);
        }
    } catch (error) {
        setChatMessages(prev => [...prev, { role: 'ai', text: t.aiErrorNetwork }]);
    } finally {
        setIsChatting(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopWidth: 1,
            borderTopColor: tabBarBorder,
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 8,
            paddingTop: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
          },
          tabBarActiveTintColor: activeTabColor,
          tabBarInactiveTintColor: inactiveTabColor,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 4 },
          tabBarItemStyle: { paddingVertical: Platform.OS === 'ios' ? 0 : 4 },
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: t.tabDashboard, tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} /> }} />
        <Tabs.Screen name="market" options={{ title: t.tabMarket, tabBarIcon: ({ color }) => <Feather name="activity" size={24} color={color} /> }} />
        <Tabs.Screen name="investments" options={{ title: t.tabInvestments, tabBarIcon: ({ color }) => <Feather name="briefcase" size={24} color={color} /> }} />
        <Tabs.Screen name="community" options={{ title: t.tabCommunity, tabBarIcon: ({ color }) => <Feather name="users" size={24} color={color} /> }} />
        <Tabs.Screen name="settings" options={{ title: t.tabSettings, tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} /> }} />
        
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      {/* 🟢 GLOBAL YÜZEN BUTON (FAB) */}
      <TouchableOpacity style={styles.fabAiBtn} onPress={() => setIsChatVisible(true)} activeOpacity={0.9}>
         <View style={styles.fabIconBadge} />
         <Text style={{fontSize: 26}}>🐋</Text>
      </TouchableOpacity>

      {/* 🟢 GLOBAL AI CHAT MODALI */}
      <Modal animationType="slide" transparent={true} visible={isChatVisible} onRequestClose={() => setIsChatVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.chatModalContent, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: tabBarBorder }]}>
                
               <View style={[styles.chatHeader, { borderBottomColor: tabBarBorder }]}>
                 <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={styles.chatHeaderIcon}><FontAwesome5 name="robot" size={18} color="#3B82F6" /></View>
                    <View>
                        <Text style={[styles.chatTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Whale-E Asistan</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
                           <View style={styles.onlineDot} />
                           <Text style={styles.chatSubtitle}>{t.online}</Text>
                        </View>
                    </View>
                 </View>
                 <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} onPress={() => setIsChatVisible(false)}>
                    <Feather name="chevron-down" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                 </TouchableOpacity>
               </View>

               <ScrollView ref={scrollViewRef} style={styles.chatMessagesArea} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                  {chatMessages.map((msg, index) => (
                      <View key={index} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : [styles.chatBubbleAI, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: tabBarBorder }]]}>
                         {msg.role === 'ai' && <Text style={{fontSize: 16, marginRight: 8, alignSelf: 'flex-start'}}>🐋</Text>}
                         <Text style={[styles.chatBubbleText, msg.role === 'user' ? {color: 'white'} : { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                            {renderMessageText(msg.text, msg.role === 'user')}
                         </Text>
                      </View>
                  ))}
                  {isChatting && (
                      <View style={[styles.chatBubble, styles.chatBubbleAI, {width: 70, justifyContent: 'center', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: tabBarBorder}]}>
                         <ActivityIndicator size="small" color="#3B82F6" />
                      </View>
                  )}
               </ScrollView>

               <View style={[styles.chatInputRow, { borderTopColor: tabBarBorder }]}>
                   <TextInput 
                      style={[styles.chatInput, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: tabBarBorder, color: isDark ? '#F8FAFC' : '#1E293B' }]}
                      placeholder={t.aiPlaceholder}
                      placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                      value={chatInput}
                      onChangeText={setChatInput}
                      multiline={true}
                   />
                   <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChatMessage} disabled={isChatting}>
                      <Feather name="send" size={18} color="white" style={isChatting ? {opacity: 0.5} : {}} />
                   </TouchableOpacity>
               </View>

            </View>
         </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabAiBtn: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 105 : 85, 
    right: 16, 
    width: 60, 
    height: 60, 
    backgroundColor: '#3B82F6', 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#3B82F6', 
    shadowOffset: {width: 0, height: 6}, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    elevation: 10, 
    zIndex: 9999 
  },
  fabIconBadge: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, backgroundColor: '#10B981', borderRadius: 7, borderWidth: 2, borderColor: 'white' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  chatModalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, borderWidth: 1, height: '88%' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, marginBottom: 16 },
  chatHeaderIcon: { width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chatTitle: { fontSize: 18, fontWeight: '900' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  chatSubtitle: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
  closeBtn: { padding: 8, borderRadius: 20 },
  chatMessagesArea: { flex: 1 },
  chatBubble: { maxWidth: '85%', padding: 16, borderRadius: 20, marginBottom: 16, flexDirection: 'row' },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#2563EB', borderBottomRightRadius: 4, shadowColor: '#2563EB', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  chatBubbleAI: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 4 },
  chatBubbleText: { fontSize: 14, lineHeight: 22, flexShrink: 1 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1 },
  chatInput: { flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 14, maxHeight: 120 },
  chatSendBtn: { backgroundColor: '#3B82F6', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }
});