import { useState } from 'react';
import { FiX, FiCheck, FiTag, FiType, FiAlignLeft } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      // Etiketleri virgülle ayırıp temizleyelim
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      await api.post('/posts', {
        title,
        content,
        tags: tagsArray
      });

      toast.success(t('post_created_success') || 'Gönderi paylaşıldı!');
      onPostCreated(); // Listeyi yenilemesi için ana sayfaya haber ver
      onClose();
      
      // Formu temizle
      setTitle('');
      setContent('');
      setTags('');
    } catch (error) {
      console.error(error);
      toast.error(t('failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-up border border-gray-100 dark:border-gray-700">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('create_post')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Başlık Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('post_title_label')}</label>
            <div className="relative">
                <FiType className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white font-semibold placeholder-gray-400"
                  placeholder={t('post_title_placeholder') || "Örn: Borsa hakkında düşüncelerim..."}
                />
            </div>
          </div>

          {/* İçerik Textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('post_content_label')}</label>
            <div className="relative">
                <FiAlignLeft className="absolute left-3 top-3.5 text-gray-400" />
                <textarea
                  required
                  rows="4"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white resize-none placeholder-gray-400"
                  placeholder={t('post_content_placeholder') || "Fikirlerini paylaş..."}
                ></textarea>
            </div>
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('tags_label')}</label>
            <div className="relative">
                <FiTag className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
                  placeholder="Borsa, Altın, Yatırım..."
                />
            </div>
          </div>

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200/50 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <FiCheck size={20} />}
            {t('share_post') || "Paylaş"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;