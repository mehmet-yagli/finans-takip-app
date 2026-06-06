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
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext'; 

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// ==========================================
// 🟢 ÇOKLU DİL (SÖZLÜK) YAPISI
// ==========================================
const dict: any = {
  tr: {
    pageTitle: 'Topluluk', pageSub: 'Diğer kullanıcılarla fikir alışverişi yapın.',
    searchPlace: 'Ara (Konu, etiket, kişi)...',
    trends: 'Trend Başlıklar',
    leaders: 'Haftanın Liderleri', points: 'Puan',
    emptyFeed: 'Aramanıza veya seçilen etikete uygun gönderi bulunamadı.',
    likes: 'Beğeni', comments: 'Yorum',
    rulesTitle: 'Topluluk Kuralları', rulesText: 'Saygılı olun. Kesinlikle yatırım tavsiyesi (YTD) vermeyin ve spam yapmayın.',
    createPost: 'Gönderi Oluştur', tagLabel: 'ETİKET (ÖRN: #BORSA)', tagPlace: '#Konu...', shareIdea: 'FİKRİNİZİ PAYLAŞIN', ideaPlace: 'Neler düşünüyorsunuz? Diğer yatırımcılarla paylaşın...', shareBtn: 'Paylaş',
    commentsTitle: 'Yorumlar', firstComment: 'İlk yorumu sen yap!', writeComment: 'Yorumunuzu yazın...',
    errMissing: 'Uyarı', errMsg: 'Gönderi içeriği boş olamaz.',
    success: 'Başarılı', successMsg: 'Gönderiniz toplulukta paylaşıldı!',
    err: 'Hata', errShare: 'Gönderi paylaşılamadı.',
    delTitle: 'Gönderiyi Sil', delMsg: 'Bu gönderiyi silmek istediğinize emin misiniz?', cancel: 'İptal', del: 'Sil',
    justNow: 'Şimdi', minutesAgo: 'dk önce', hoursAgo: 'saat önce', daysAgo: 'gün önce'
  },
  en: {
    pageTitle: 'Community', pageSub: 'Exchange ideas with other users.',
    searchPlace: 'Search (Topic, tag, person)...',
    trends: 'Trending Topics',
    leaders: 'Leaders of the Week', points: 'Points',
    emptyFeed: 'No posts found matching your search or selected tag.',
    likes: 'Likes', comments: 'Comments',
    rulesTitle: 'Community Rules', rulesText: 'Be respectful. Do not give financial advice (NFA) and avoid spamming.',
    createPost: 'Create Post', tagLabel: 'TAG (EX: #STOCK)', tagPlace: '#Topic...', shareIdea: 'SHARE YOUR THOUGHTS', ideaPlace: 'What are you thinking? Share with other investors...', shareBtn: 'Share',
    commentsTitle: 'Comments', firstComment: 'Be the first to comment!', writeComment: 'Write a comment...',
    errMissing: 'Warning', errMsg: 'Post content cannot be empty.',
    success: 'Success', successMsg: 'Your post has been shared in the community!',
    err: 'Error', errShare: 'Failed to share the post.',
    delTitle: 'Delete Post', delMsg: 'Are you sure you want to delete this post?', cancel: 'Cancel', del: 'Delete',
    justNow: 'Just now', minutesAgo: 'm ago', hoursAgo: 'h ago', daysAgo: 'd ago'
  }
};

export default function CommunityScreen() {
  const { theme, language } = useTheme(); 
  const t = dict[language] || dict['tr']; 
  const styles = getStyles(theme); 

  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');

  const trendTags = ['#BORSA', '#KRİPTO', '#ALTIN', '#DOLAR', '#YATIRIM', '#TASARRUF', '#HİSSE', '#TEMETTÜ', '#GÜMÜŞ'];

  // 🟢 YENİ: Gerçek Zamanlı Tarih Formatlayıcı
  const formatTimeAgo = (dateInput: any) => {
    if (!dateInput) return t.justNow;
    const now = new Date();
    const past = new Date(dateInput);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return t.justNow;
    if (diffInMins < 60) return `${diffInMins} ${t.minutesAgo}`;
    if (diffInHours < 24) return `${diffInHours} ${t.hoursAgo}`;
    return `${diffInDays} ${t.daysAgo}`;
  };

  const fetchCommunityData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [postsRes, leadersRes] = await Promise.all([
        axios.get(`${API_URL}/community/posts`, config).catch(() => null),
        axios.get(`${API_URL}/community/leaders`, config).catch(() => null)
      ]);

      if (postsRes && postsRes.data && Array.isArray(postsRes.data)) {
          const formattedPosts = postsRes.data.map((p:any) => ({
              ...p,
              timeAgo: formatTimeAgo(p.createdAt), // 🚀 Dinamik tarih
              commentsList: p.commentsList || []
          }));
          setPosts(formattedPosts);
      } else {
          // Fallback - Eğer DB boşsa bile Mehmet'in postunu "Şimdi" yapalım
          setPosts([
              {
                  id: '1',
                  user: { name: 'Mehmet Yağlı', initials: 'M', color: '#8B5CF6' },
                  timeAgo: t.justNow,
                  tag: '#GÜMÜŞ',
                  content: 'Gümüşte hareketlilik dikkat çekiyor 👀\nSon dönemde ons gümüş hem teknik hem de temel tarafta güçlü sinyaller veriyor. Endüstriyel talebin artması ve enflasyon beklentileri gümüşü destekliyor. Altına göre hâlâ görece ucuz kalması da ayrı bir avantaj. Kısa vadede dalgalanma olsa da orta-uzun vadede yükseliş potansiyeli yüksek görünüyor.\n\nYTD, yatırım tavsiyesi değildir.',
                  likes: 12,
                  isLiked: false,
                  comments: 1,
                  commentsList: [
                      { id: 'c1', user: 'Ahmet Y.', text: 'Kesinlikle katılıyorum, portföye ekledim.', timeAgo: '1 saat önce' }
                  ],
                  isMyPost: true
              }
          ]);
      }

      if (leadersRes && leadersRes.data && Array.isArray(leadersRes.data)) {
          setLeaders(leadersRes.data);
      } else {
          setLeaders([{ id: '1', rank: 1, name: 'Mehmet Yağlı', points: 150 }]);
      }

    } catch (error) {
      console.log("Topluluk verisi çekilemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [t.justNow, t.minutesAgo, t.hoursAgo, t.daysAgo]);

  useEffect(() => {
    fetchCommunityData();
    
    // 🚀 YENİ: Topluluk akışını her 30 saniyede bir otomatik tazele
    const refreshInterval = setInterval(() => {
      fetchCommunityData(false); 
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [fetchCommunityData]);

  const toggleLike = async (postId: string) => {
      setPosts(currentPosts => currentPosts.map(post => {
          if (post.id === postId) {
              return {
                  ...post,
                  isLiked: !post.isLiked,
                  likes: post.isLiked ? post.likes - 1 : post.likes + 1
              };
          }
          return post;
      }));

      try {
          const token = await AsyncStorage.getItem('token');
          await axios.post(`${API_URL}/community/posts/${postId}/like`, {}, {
              headers: { Authorization: `Bearer ${token}` }
          });
      } catch (error) {}
  };

  const handleCreatePost = async () => {
      if (!newPostContent.trim()) {
          Alert.alert(t.errMissing, t.errMsg);
          return;
      }

      setIsSubmitting(true);
      try {
          const token = await AsyncStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          
          const postData = {
              tag: newPostTag ? (newPostTag.startsWith('#') ? newPostTag.toUpperCase() : `#${newPostTag.toUpperCase()}`) : '#GENEL',
              content: newPostContent
          };

          const response = await axios.post(`${API_URL}/community/posts`, postData, config);

          if (response.data) {
              fetchCommunityData(); // 🚀 Paylaşınca listeyi hemen tazele
              setIsPostModalVisible(false);
              setNewPostContent('');
              setNewPostTag('');
              Alert.alert(t.success, t.successMsg);
          }
      } catch (error) {
          Alert.alert(t.err, t.errShare);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeletePost = (postId: string) => {
      Alert.alert(t.delTitle, t.delMsg, [
          { text: t.cancel, style: "cancel" },
          { text: t.del, style: "destructive", onPress: async () => {
              try {
                  const token = await AsyncStorage.getItem('token');
                  await axios.delete(`${API_URL}/community/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
                  setPosts(current => current.filter(p => p.id !== postId));
              } catch(e) {
                  Alert.alert(t.err, "Silinemedi.");
              }
          }}
      ]);
  };

  const openComments = (postId: string) => {
      setActivePostId(postId);
      setIsCommentModalVisible(true);
  };

  const handleAddComment = async () => {
      if (!newCommentContent.trim() || !activePostId) return;

      try {
          const token = await AsyncStorage.getItem('token');
          await axios.post(`${API_URL}/community/posts/${activePostId}/comments`, {
              text: newCommentContent
          }, { headers: { Authorization: `Bearer ${token}` } });

          setNewCommentContent('');
          fetchCommunityData(false); // Arka planda yorumu çek
      } catch (e) {
          Alert.alert(t.err, "Yorum eklenemedi.");
      }
  };

  const activePostData = posts.find(p => p.id === activePostId);
  const currentComments = activePostData?.commentsList || [];

  const filteredPosts = posts.filter(post => {
      if (activeTag && post.tag !== activeTag) return false;
      if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchContent = post.content.toLowerCase().includes(query);
          const matchUser = post.user.name.toLowerCase().includes(query);
          const matchTag = post.tag.toLowerCase().includes(query);
          return matchContent || matchUser || matchTag;
      }
      return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={styles.safeArea.backgroundColor} />
      
      <View style={styles.header}>
         <View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4}}>
              <Feather name="message-square" size={24} color="#8B5CF6" />
              <Text style={styles.pageTitle}>{t.pageTitle}</Text>
            </View>
            <Text style={styles.pageSubtitle}>{t.pageSub}</Text>
         </View>
      </View>

      <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={styles.placeholder.color} style={styles.searchIcon} />
          <TextInput 
             style={styles.searchInput}
             placeholder={t.searchPlace}
             placeholderTextColor={styles.placeholder.color}
             value={searchQuery}
             onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Feather name="x" size={16} color={styles.placeholder.color} />
             </TouchableOpacity>
          )}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        <View style={styles.trendsWrapper}>
           <Text style={styles.sectionTitle}>{t.trends}</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
              {trendTags.map(tag => (
                 <TouchableOpacity 
                    key={tag} 
                    onPress={() => setActiveTag(activeTag === tag ? null : tag)}
                    style={[styles.trendTagBtn, activeTag === tag && styles.trendTagBtnActive]}
                 >
                    <Text style={[styles.trendTagTxt, activeTag === tag && styles.trendTagTxtActive]}>{tag}</Text>
                 </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        <View style={styles.leadersWrapper}>
           <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
              <View style={styles.yellowPill} />
              <Text style={styles.sectionTitle}>{t.leaders}</Text>
           </View>
           
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {leaders.map(leader => (
                 <View key={leader.id} style={styles.leaderCard}>
                    <View style={styles.leaderRankBadge}>
                       <Text style={styles.leaderRankTxt}>{leader.rank}</Text>
                    </View>
                    <View>
                       <Text style={styles.leaderName} numberOfLines={1}>{leader.name}</Text>
                       <Text style={styles.leaderPoints}>{leader.points} {t.points}</Text>
                    </View>
                 </View>
              ))}
           </ScrollView>
        </View>

        <View style={styles.feedWrapper}>
           {isLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
           ) : filteredPosts.length === 0 ? (
              <Text style={styles.emptyFeedTxt}>{t.emptyFeed}</Text>
           ) : (
              filteredPosts.map(post => (
                 <View key={post.id} style={styles.postCard}>
                    
                    <View style={styles.postHeader}>
                       <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                          <View style={[styles.avatarBg, { backgroundColor: post.user.color || '#8B5CF6' }]}>
                             <Text style={styles.avatarTxt}>{post.user.initials || 'U'}</Text>
                          </View>
                          <View>
                             <Text style={styles.postUserName}>{post.user.name}</Text>
                             <Text style={styles.postTime}>{post.timeAgo}</Text>
                          </View>
                       </View>
                       <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                          <View style={styles.postTagBadge}>
                             <Text style={styles.postTagTxt}>{post.tag}</Text>
                          </View>
                          {post.isMyPost && ( 
                             <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                                <Feather name="trash-2" size={16} color="#EF4444" />
                             </TouchableOpacity>
                          )}
                       </View>
                    </View>

                    <Text style={styles.postContent}>{post.content}</Text>

                    <View style={styles.postFooter}>
                       <View style={{flexDirection: 'row', gap: 20}}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
                             <FontAwesome5 name="heart" solid={post.isLiked} size={16} color={post.isLiked ? '#EF4444' : styles.placeholder.color} />
                             <Text style={[styles.actionTxt, post.isLiked && {color: '#EF4444'}]}>{post.likes} {t.likes}</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post.id)}>
                             <Feather name="message-square" size={16} color={styles.placeholder.color} />
                             <Text style={styles.actionTxt}>{post.comments || 0} {t.comments}</Text>
                          </TouchableOpacity>
                       </View>
                       <TouchableOpacity>
                          <Feather name="share-2" size={16} color={styles.placeholder.color} />
                       </TouchableOpacity>
                    </View>

                 </View>
              ))
           )}
        </View>

        <View style={styles.rulesCard}>
           <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
              <Feather name="info" size={18} color="#8B5CF6" />
              <Text style={styles.rulesTitle}>{t.rulesTitle}</Text>
           </View>
           <Text style={styles.rulesText}>{t.rulesText}</Text>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fabBtn} onPress={() => setIsPostModalVisible(true)} activeOpacity={0.8}>
         <Feather name="edit-3" size={24} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={isPostModalVisible} onRequestClose={() => setIsPostModalVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{t.createPost}</Text>
                 <TouchableOpacity onPress={() => setIsPostModalVisible(false)}>
                    <Feather name="x" size={24} color={styles.placeholder.color} />
                 </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>{t.tagLabel}</Text>
                     <TextInput 
                        style={styles.textField} 
                        placeholder={t.tagPlace} 
                        placeholderTextColor={styles.placeholder.color} 
                        value={newPostTag} 
                        onChangeText={setNewPostTag} 
                        autoCapitalize="characters" 
                     />
                  </View>

                  <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>{t.shareIdea}</Text>
                     <TextInput 
                        style={[styles.textField, { height: 120, textAlignVertical: 'top' }]} 
                        placeholder={t.ideaPlace} 
                        placeholderTextColor={styles.placeholder.color} 
                        multiline={true}
                        value={newPostContent} 
                        onChangeText={setNewPostContent} 
                     />
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleCreatePost} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnTxt}>{t.shareBtn}</Text>}
                  </TouchableOpacity>
               </ScrollView>
            </View>
         </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isCommentModalVisible} onRequestClose={() => setIsCommentModalVisible(false)}>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.commentModalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{t.commentsTitle} ({currentComments.length})</Text>
                 <TouchableOpacity onPress={() => setIsCommentModalVisible(false)}>
                    <Feather name="x" size={24} color={styles.placeholder.color} />
                 </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1, marginBottom: 10}}>
                   {currentComments.length === 0 ? (
                       <Text style={{color: styles.placeholder.color, textAlign: 'center', marginTop: 30}}>{t.firstComment}</Text>
                   ) : (
                       currentComments.map((comment: any) => (
                           <View key={comment.id} style={styles.commentItem}>
                               <View style={styles.commentAvatar}><Text style={{color:'white', fontWeight:'bold'}}>{comment.user.charAt(0)}</Text></View>
                               <View style={styles.commentBody}>
                                   <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                                       <Text style={styles.commentUser}>{comment.user}</Text>
                                       <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                                   </View>
                                   <Text style={styles.commentText}>{comment.text}</Text>
                               </View>
                           </View>
                       ))
                   )}
               </ScrollView>

               <View style={styles.commentInputRow}>
                   <TextInput 
                      style={styles.commentInput}
                      placeholder={t.writeComment}
                      placeholderTextColor={styles.placeholder.color}
                      value={newCommentContent}
                      onChangeText={setNewCommentContent}
                      multiline={true}
                   />
                   <TouchableOpacity style={styles.commentSendBtn} onPress={handleAddComment}>
                      <Feather name="send" size={18} color="white" />
                   </TouchableOpacity>
               </View>
            </View>
         </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

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
    container: { flex: 1 },
    placeholder: { color: colors.textSub },
    
    header: { paddingHorizontal: 16, marginTop: 24, marginBottom: 16 },
    pageTitle: { color: colors.textMain, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { color: colors.textSub, fontSize: 13, fontWeight: '500', marginTop: 4 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, marginHorizontal: 16, marginBottom: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 50 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: colors.textMain, fontSize: 15 },
    clearSearchBtn: { padding: 4 },

    sectionTitle: { color: colors.textMain, fontSize: 16, fontWeight: '800' },

    trendsWrapper: { paddingLeft: 16, marginBottom: 24 },
    trendTagBtn: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
    trendTagBtnActive: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: '#8B5CF6' },
    trendTagTxt: { color: colors.textSub, fontSize: 12, fontWeight: '700' },
    trendTagTxtActive: { color: '#8B5CF6' },

    leadersWrapper: { paddingLeft: 16, marginBottom: 24 },
    yellowPill: { width: 4, height: 16, backgroundColor: '#F59E0B', borderRadius: 2 },
    leaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 16, width: 180 },
    leaderRankBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    leaderRankTxt: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
    leaderName: { color: colors.textMain, fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
    leaderPoints: { color: '#8B5CF6', fontSize: 11, fontWeight: '800' },

    feedWrapper: { paddingHorizontal: 16 },
    emptyFeedTxt: { color: colors.textSub, textAlign: 'center', marginTop: 20, fontSize: 14 },
    
    postCard: { backgroundColor: colors.cardBg, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    avatarBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: 'white', fontSize: 16, fontWeight: '900' },
    postUserName: { color: colors.textMain, fontSize: 14, fontWeight: 'bold' },
    postTime: { color: colors.textSub, fontSize: 11, marginTop: 2 },
    postTagBadge: { backgroundColor: colors.innerCard, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    postTagTxt: { color: colors.textSub, fontSize: 10, fontWeight: 'bold' },
    
    postContent: { color: isDark ? '#CBD5E1' : '#334155', fontSize: 14, lineHeight: 22, marginBottom: 16 },
    
    postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionTxt: { color: colors.textSub, fontSize: 12, fontWeight: '600' },

    rulesCard: { marginHorizontal: 16, backgroundColor: 'rgba(139, 92, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', padding: 16, borderRadius: 16, marginTop: 10, marginBottom: 40 },
    rulesTitle: { color: '#8B5CF6', fontSize: 14, fontWeight: 'bold' },
    rulesText: { color: colors.textSub, fontSize: 12, lineHeight: 18 },

    fabBtn: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, width: 60, height: 60, backgroundColor: '#8B5CF6', borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 999 },

    modalOverlay: { flex: 1, backgroundColor: colors.modalBg, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: colors.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: colors.textMain, fontSize: 20, fontWeight: '900' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { color: colors.textSub, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
    textField: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 12, color: colors.textMain, fontSize: 15 },
    submitBtn: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    submitBtnTxt: { color: 'white', fontSize: 16, fontWeight: '900' },

    commentModalContent: { backgroundColor: colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '80%', borderWidth: 1, borderColor: colors.border },
    commentItem: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
    commentBody: { flex: 1, backgroundColor: colors.innerCard, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    commentUser: { color: colors.textMain, fontSize: 13, fontWeight: 'bold' },
    commentTime: { color: colors.textSub, fontSize: 10 },
    commentText: { color: isDark ? '#CBD5E1' : '#334155', fontSize: 13, lineHeight: 18 },
    
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    commentInput: { flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: colors.textMain, fontSize: 14, maxHeight: 100 },
    commentSendBtn: { backgroundColor: '#8B5CF6', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
  });
};