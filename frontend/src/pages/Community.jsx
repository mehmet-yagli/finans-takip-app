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

// Arama metnini vurgulayan yardımcı bileşen
const HighlightText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-blue-100 text-blue-600 font-bold px-0.5 rounded">{part}</span>
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
              background: '#3B82F6',
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
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto"> 
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                    <FiMessageSquare />
                </span>
                {t('community')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 ml-14">{t('community_desc')}</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-none flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                    <FiSearch className="text-gray-400 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Ara (Konu, etiket, kişi)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 w-full md:w-64" 
                    />
                </div>
                <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200/50 dark:shadow-none flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
                >
                <FiPlus size={20} /> <span className="hidden md:inline">{t('create_post')}</span>
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* SOL KOLON (POST AKIŞI) */}
              <div className="lg:col-span-2 space-y-6">
                {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>
                ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    <FiMessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? `"${searchQuery}" ile ilgili sonuç bulunamadı.` : t('no_posts')}
                    </p>
                </div>
                ) : (
                    filteredPosts.map(post => {
                        const currentUserId = user?._id || user?.id;
                        const postOwnerId = post.user?._id || post.user; 
                        const isOwner = currentUserId && postOwnerId && (postOwnerId.toString() === currentUserId.toString());

                        return (
                        <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white dark:ring-gray-700">
                                        {post.user?.name?.charAt(0).toUpperCase() || <FiUser />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                            <HighlightText text={post.user?.name || "Anonim"} highlight={searchQuery} />
                                        </h4>
                                        <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-[10px] rounded-lg font-medium border border-gray-100 dark:border-gray-600">
                                                #<HighlightText text={tag} highlight={searchQuery} />
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="relative ml-2">
                                        {isOwner ? (
                                            <button 
                                                onClick={() => handleDeletePost(post._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                title="Gönderiyi Sil"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleReport(post._id)}
                                                className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-all"
                                                title="Rapor Et"
                                            >
                                                <FiFlag size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 leading-tight">
                                    <HighlightText text={post.title} highlight={searchQuery} />
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                                    <HighlightText text={post.content} highlight={searchQuery} />
                                </p>
                            </div>

                            <div className="flex items-center gap-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <button 
                                    onClick={() => handleLike(post._id)}
                                    className={`flex items-center gap-2 transition-colors group ${isLikedByUser(post) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                                >
                                    <div className={`p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors ${isLikedByUser(post) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                        <FiHeart className={isLikedByUser(post) ? "fill-current text-red-500" : ""} size={18} />
                                    </div>
                                    <span className="text-sm font-medium">{post.likes.length} {t('likes')}</span>
                                </button>

                                <button 
                                    onClick={() => setActiveCommentBox(activeCommentBox === post._id ? null : post._id)}
                                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group"
                                >
                                    <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                        <FiMessageSquare size={18} />
                                    </div>
                                    <span className="text-sm font-medium">{post.comments.length} {t('comments')}</span>
                                </button>
                                
                                <button 
                                    className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    onClick={handleShare}
                                    title="Linki Kopyala"
                                >
                                    <FiShare2 size={18} />
                                </button>
                            </div>

                            {activeCommentBox === post._id && (
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 animate-fadeIn">
                                    <div className="flex gap-3 mb-6">
                                        <input 
                                            type="text" 
                                            value={commentText[post._id] || ''}
                                            onChange={(e) => setCommentText({...commentText, [post._id]: e.target.value})}
                                            placeholder={t('write_comment')}
                                            className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white transition-all"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                                        />
                                        <button 
                                            onClick={() => handleCommentSubmit(post._id)}
                                            className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors"
                                        >
                                            <FiSend size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
                                        {post.comments.map((comment, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 shrink-0 border border-white dark:border-gray-600 shadow-sm">
                                                    {comment.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-r-2xl rounded-bl-2xl w-full border border-gray-100 dark:border-gray-700">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-gray-900 dark:text-white text-xs">{comment.user?.name}</span>
                                                        <span className="text-[10px] text-gray-400">{formatDate(comment.date)}</span>
                                                    </div>
                                                    <p className="text-gray-600 dark:text-gray-300 leading-snug">{comment.text}</p>
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

              {/* SAĞ KOLON (SIDEBAR) - ARTIK DİNAMİK ÇEVİRİLİ */}
              <div className="lg:col-span-1 space-y-6">
                  
                  {/* Trendler Kartı */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sticky top-6">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <FiTrendingUp className="text-orange-500" /> {t('trend_topics')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                          {trendingTags.map((tag, idx) => (
                              <span key={idx} 
                                onClick={() => setSearchQuery(tag)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-medium border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors flex items-center gap-1">
                                  <FiHash size={12} className="text-gray-400" /> {tag}
                              </span>
                          ))}
                      </div>
                  </div>

                  {/* Lider Tablosu */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sticky top-64">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <FiAward className="text-yellow-500" /> {t('weekly_leaders')}
                      </h3>
                      <div className="space-y-4">
                          {leaderboard.length > 0 ? (
                              leaderboard.map((u, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                                              ${idx === 0 ? 'bg-yellow-400 ring-2 ring-yellow-200' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}>
                                              {idx + 1}
                                          </div>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[100px]">{u.name}</span>
                                      </div>
                                      <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">{u.points} {t('points_suffix')}</span>
                                  </div>
                              ))
                          ) : (
                              <p className="text-xs text-gray-400 text-center py-4">Henüz veri yok.</p>
                          )}
                      </div>
                  </div>

                  {/* Bilgi Kartı */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <FiInfo size={16} /> {t('community_rules')}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
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