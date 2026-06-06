import React, { useState, useEffect, useContext, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import CreatePostModal from '../components/CreatePostModal';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiHeart, FiShare2, FiPlus, FiSearch, FiUser, FiSend, FiTrendingUp, FiHash, FiAward, FiInfo, FiTrash2, FiFlag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext'; 

// Arama metnini vurgulayan yardımcı bileşen (Premium Renklerle Güncellendi)
const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-extrabold px-1 rounded-md transition-colors">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
};

const Community = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Veri State'leri
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Arama State'i
  const [searchQuery, setSearchQuery] = useState('');

  const [commentText, setCommentText] = useState({}); 
  const [activeCommentBox, setActiveCommentBox] = useState(null); 

  const trendingTags = ['Borsa', 'Kripto', 'Altın', 'Dolar', 'Yatırım', 'Tasarruf', 'Hisse', 'Temettü'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, leaderRes] = await Promise.all([
          api.get('/posts'),
          api.get('/posts/leaderboard')
      ]);

      setPosts(postsRes.data);
      setLeaderboard(leaderRes.data); 
    } catch (error) {
      console.error("Veri çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 Arama Filtreleme
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(post => {
        const userName = post.user?.name || "Anonim";
        return (
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.tags.some(tag => tag.toLowerCase().includes(query)) ||
            userName.toLowerCase().includes(query)
        );
    });
  }, [posts, searchQuery]);

  const handleLike = async (postId) => {
    try {
      const res = await api.put(`/posts/like/${postId}`);
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likes: res.data } : post
      ));
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  // 🗑️ Silme Fonksiyonu
  const handleDeletePost = async (postId) => {
      if (!window.confirm(t('delete_confirm'))) return;
      
      try {
          await api.delete(`/posts/${postId}`); 
          setPosts(prev => prev.filter(p => p._id !== postId));
          toast.success(t('deleted'));
      } catch (error) {
          console.error(error);
          toast.error("Silme işlemi başarısız. Yetkiniz olmayabilir.");
      }
  };

  // 🚩 Raporlama Fonksiyonu
  const handleReport = (postId) => {
      toast.success("Gönderi incelenmek üzere yöneticilere iletildi.", {
          icon: '🛡️',
          style: {
              background: '#4F46E5',
              color: '#fff',
          },
      });
  };

  // 🔗 Paylaşma Fonksiyonu
  const handleShare = () => {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Bağlantı kopyalandı!", { icon: '🔗' });
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/posts/comment/${postId}`, { text });
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, comments: res.data } : post
      ));
      setCommentText({ ...commentText, [postId]: '' }); 
      toast.success("Yorum eklendi");
    } catch (error) {
      toast.error("Yorum yapılamadı");
    }
  };

  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: i18n.language === 'tr' ? tr : enUS 
    });
  };

  // Beğeni Kontrolü
  const isLikedByUser = (post) => {
      if (!user) return false;
      const currentUserId = user._id || user.id; 
      if (!currentUserId) return false;

      return post.likes.some(like => {
          const likeUserId = like.user?._id || like.user;
          return likeUserId?.toString() === currentUserId.toString();
      });
  };

  return (
    // Premium SaaS Background
    <div className="flex h-screen bg-[#F3F6F9] dark:bg-[#0B1120] transition-colors duration-300 selection:bg-purple-500/30 font-sans">
      <Sidebar />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-6 md:p-10 max-w-[1920px] mx-auto w-full relative"> 
          
          {/* HEADER ALANI */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-500/30">
                    <FiMessageSquare size={24} strokeWidth={2.5}/>
                </div>
                {t('community')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('community_desc')}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="flex-1 sm:flex-none flex items-center bg-white dark:bg-[#151E2D] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                    <FiSearch className="text-gray-400 mr-3" size={18} />
                    <input 
                        type="text" 
                        placeholder="Ara (Konu, etiket, kişi)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm font-medium text-gray-900 dark:text-white w-full sm:w-64 placeholder:text-gray-400" 
                    />
                </div>
                <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 shrink-0 border-none"
                >
                <FiPlus size={20} strokeWidth={3} /> <span className="hidden sm:inline">{t('create_post')}</span>
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* SOL KOLON (POST AKIŞI) */}
              <div className="xl:col-span-8 space-y-6">
                {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>
                ) : filteredPosts.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-[#151E2D] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <FiMessageSquare size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-5" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {searchQuery ? `"${searchQuery}" ile ilgili sonuç bulunamadı.` : t('no_posts')}
                    </p>
                </div>
                ) : (
                    filteredPosts.map(post => {
                        const currentUserId = user?._id || user?.id;
                        const postOwnerId = post.user?._id || post.user; 
                        const isOwner = currentUserId && postOwnerId && (postOwnerId.toString() === currentUserId.toString());

                        return (
                        <div key={post._id} className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-all hover:-translate-y-1 group">
                            
                            {/* Gönderi Sahibi & Ayarlar */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md">
                                        {post.user?.name?.charAt(0).toUpperCase() || <FiUser size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-gray-900 dark:text-white text-base tracking-tight">
                                            <HighlightText text={post.user?.name || "Anonim"} highlight={searchQuery} />
                                        </h4>
                                        <span className="text-xs font-medium text-gray-400">{formatDate(post.createdAt)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-wrap gap-2 justify-end hidden sm:flex">
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] rounded-lg font-bold border border-gray-200 dark:border-gray-700 tracking-wider uppercase">
                                                #<HighlightText text={tag} highlight={searchQuery} />
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="relative ml-2">
                                        {isOwner ? (
                                            <button 
                                                onClick={() => handleDeletePost(post._id)}
                                                className="p-2.5 text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                                title="Gönderiyi Sil"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleReport(post._id)}
                                                className="p-2.5 text-gray-400 hover:text-orange-500 bg-gray-50 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-orange-900/30 rounded-xl transition-all"
                                                title="Rapor Et"
                                            >
                                                <FiFlag size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Gönderi İçeriği */}
                            <div className="mb-6">
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
                                    <HighlightText text={post.title} highlight={searchQuery} />
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-[15px]">
                                    <HighlightText text={post.content} highlight={searchQuery} />
                                </p>
                                
                                {/* Mobilde etiketleri altta göster */}
                                <div className="flex flex-wrap gap-2 mt-4 sm:hidden">
                                    {post.tags.map((tag, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] rounded-md font-bold border border-gray-200 dark:border-gray-700 tracking-wider uppercase">
                                            #<HighlightText text={tag} highlight={searchQuery} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Etkileşim Butonları */}
                            <div className="flex items-center gap-6 border-t border-gray-100 dark:border-gray-800/80 pt-5">
                                <button 
                                    onClick={() => handleLike(post._id)}
                                    className={`flex items-center gap-2 transition-colors group ${isLikedByUser(post) ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400 hover:text-rose-500'}`}
                                >
                                    <div className={`p-2 rounded-xl transition-colors ${isLikedByUser(post) ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20'}`}>
                                        <FiHeart className={isLikedByUser(post) ? "fill-current text-rose-500" : ""} size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-sm font-extrabold">{post.likes.length} <span className="hidden sm:inline">{t('likes')}</span></span>
                                </button>

                                <button 
                                    onClick={() => setActiveCommentBox(activeCommentBox === post._id ? null : post._id)}
                                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                                >
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                                        <FiMessageSquare size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-sm font-extrabold">{post.comments.length} <span className="hidden sm:inline">{t('comments')}</span></span>
                                </button>
                                
                                <button 
                                    className="ml-auto text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-bold text-sm"
                                    onClick={handleShare}
                                    title="Linki Kopyala"
                                >
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <FiShare2 size={18} strokeWidth={2.5} />
                                    </div>
                                </button>
                            </div>

                            {/* Yorumlar Bölümü */}
                            {activeCommentBox === post._id && (
                                <div className="mt-5 pt-5 border-t border-gray-50 dark:border-gray-800/50 animate-fade-in">
                                    <div className="flex gap-3 mb-6">
                                        <input 
                                            type="text" 
                                            value={commentText[post._id] || ''}
                                            onChange={(e) => setCommentText({...commentText, [post._id]: e.target.value})}
                                            placeholder={t('write_comment')}
                                            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none dark:text-white transition-all placeholder:text-gray-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                                        />
                                        <button 
                                            onClick={() => handleCommentSubmit(post._id)}
                                            className="px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center border-none"
                                        >
                                            <FiSend size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-hide">
                                        {post.comments.map((comment, idx) => (
                                            <div key={idx} className="flex gap-4 text-sm">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-sm font-extrabold text-gray-500 dark:text-gray-300 shrink-0 border border-white dark:border-gray-800 shadow-sm">
                                                    {comment.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/80 p-4 rounded-2xl rounded-tl-sm w-full border border-gray-100 dark:border-gray-700/50">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="font-extrabold text-gray-900 dark:text-white tracking-tight">{comment.user?.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatDate(comment.date)}</span>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        )})
                )}
              </div>

              {/* SAĞ KOLON (SIDEBAR) */}
              <div className="xl:col-span-4 space-y-6">
                  
                  {/* Trendler Kartı */}
                  <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 p-8 sticky top-8">
                      <h3 className="font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight text-lg">
                          <div className="w-2.5 h-6 bg-orange-500 rounded-full"></div> {t('trend_topics')}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                          {trendingTags.map((tag, idx) => (
                              <span key={idx} 
                                onClick={() => setSearchQuery(tag)}
                                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-xl font-bold border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                                  <FiHash size={14} className="text-orange-500" /> {tag}
                              </span>
                          ))}
                      </div>
                  </div>

                  {/* Lider Tablosu */}
                  <div className="bg-white dark:bg-[#151E2D] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 p-8 sticky top-64">
                      <h3 className="font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight text-lg">
                          <div className="w-2.5 h-6 bg-yellow-500 rounded-full"></div> {t('weekly_leaders')}
                      </h3>
                      <div className="space-y-5">
                          {leaderboard.length > 0 ? (
                              leaderboard.map((u, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shadow-md
                                              ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-2 ring-yellow-200 dark:ring-yellow-900' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                                              {idx + 1}
                                          </div>
                                          <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{u.name}</span>
                                      </div>
                                      <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50">{u.points} {t('points_suffix')}</span>
                                  </div>
                              ))
                          ) : (
                              <p className="text-sm font-medium text-gray-400 text-center py-6">Henüz veri yok.</p>
                          )}
                      </div>
                  </div>

                  {/* Bilgi Kartı */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl p-8 border border-blue-100 dark:border-blue-800/30">
                      <h4 className="font-extrabold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-lg">
                          <FiInfo size={20} strokeWidth={3} /> {t('community_rules')}
                      </h4>
                      <p className="text-sm text-blue-700/80 dark:text-blue-200/80 font-medium leading-relaxed">
                          {t('community_rules_desc')}
                      </p>
                  </div>

              </div>

          </div>

        </div>
      </div>
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPostCreated={fetchData} />
    </div>
  );
};

export default Community;