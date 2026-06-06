import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTimes, FaChevronDown, FaChartLine, FaWallet, FaGlobeAmericas } from 'react-icons/fa';
import aiService from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true); 
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Merhaba! 🐋 Ben **Whale-E**. WhaleStreet'teki akıllı finans asistanınım. Portföyünü analiz edebilir, piyasaları yorumlayabilir veya finansal terimleri açıklayabilirim. Sana nasıl yardımcı olabilirim?", 
      sender: 'ai',
      action: null 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Hızlı Soru Önerileri
  const quickSuggestions = [
    { label: "Finansal Durumum", icon: <FaWallet />, query: "Finansal durumum nedir?" },
    { label: "Piyasalar", icon: <FaGlobeAmericas />, query: "Dolar ve altın ne kadar?" },
    { label: "Yatırım Tavsiyesi", icon: <FaChartLine />, query: "Bana finansal bir ipucu ver." }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) setShowTooltip(false);
    scrollToBottom();
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    const messageText = forcedInput || input;
    if (!messageText.trim()) return;

    const userMessage = { id: Date.now(), text: messageText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Backend'deki Gemini 2.0 Flash motoruna istek atar
      const response = await aiService.chatWithAI(userMessage.text);
      const aiMessage = {
        id: Date.now() + 1,
        text: response.answer,
        sender: 'ai',
        action: response.action || null
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, { 
        id: Date.now() + 1, 
        text: "Bağlantı hatası oluştu. Okyanus derinliklerinde sinyal zayıf galiba! 🌊 Lütfen internetini kontrol et.", 
        sender: 'ai' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Mesaj İçeriğini Formatlama (Markdown Benzeri)
  const renderMessageContent = (text) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className={i !== 0 ? "mt-2" : ""}>
        {line.split('**').map((part, j) => (
          j % 2 === 1 ? <strong key={j} className="font-black text-blue-700 dark:text-blue-300">{part}</strong> : part
        ))}
      </p>
    ));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* --- Konuşma Baloncuğu (Tooltip) --- */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-4 mr-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-2xl rounded-br-none shadow-xl border border-white/50 dark:border-gray-700/50 relative max-w-[240px] cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <button 
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                className="absolute -top-2 -left-2 bg-white dark:bg-gray-700 rounded-full p-1.5 text-gray-400 hover:text-rose-500 shadow-sm border border-gray-100 dark:border-gray-600 transition-colors"
            >
                <FaTimes size={10} />
            </button>
            <div className="flex gap-3 items-start">
              <span className="text-2xl mt-0.5 animate-bounce">🐋</span>
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-snug">
                  Merhaba Mehmet! <br/> 
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Portföy analizi ister misin?
                  </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Chat Penceresi (Premium Glassmorphism) --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4 w-[22rem] md:w-[24rem] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/60 dark:border-gray-700/50 overflow-hidden flex flex-col relative"
            style={{ height: '600px', maxHeight: '85vh' }}
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

             {/* Header */}
             <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner">
                  <FaRobot className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight leading-none mb-1">Whale-E</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100 opacity-80">WhaleStreet Official AI</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2.5 rounded-full transition-all active:scale-90">
                <FaChevronDown size={18} />
              </button>
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide relative z-10">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm relative ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-800 shadow-md'
                    }`}>
                    
                    {msg.sender === 'ai' && (
                       <span className="absolute -left-2 -top-2 text-xl drop-shadow-md">🐋</span>
                    )}

                    <div className={msg.sender === 'ai' ? 'ml-3' : ''}>
                      {renderMessageContent(msg.text)}
                    </div>
                    
                    {msg.action && (
                      <button 
                        onClick={() => handleNavigate(msg.action)}
                        className="mt-4 w-full py-3 px-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-800 active:scale-95"
                      >
                        Hemen Göz At <span className="text-lg">➜</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start ml-3">
                   <div className="bg-white dark:bg-[#1E293B] px-6 py-4 rounded-2xl shadow-md flex gap-2 items-center relative">
                     <span className="absolute -left-2 -top-2 text-xl">🐋</span>
                     <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                   </div>
                 </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Hızlı Öneriler Paneli */}
            {!loading && messages.length < 4 && (
              <div className="px-5 pb-2 flex flex-wrap gap-2 relative z-10">
                {quickSuggestions.map((sug, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSend(null, sug.query)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 rounded-xl text-[11px] font-bold transition-all border border-transparent hover:border-blue-200"
                  >
                    {sug.icon} {sug.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Alanı */}
            <div className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 relative z-10">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Finansal bir soru sor..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-4 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent placeholder-gray-400"
                />
                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-14 h-14 rounded-2xl transition-all shadow-lg shadow-blue-500/40 flex items-center justify-center active:scale-90 group"
                >
                  <FaPaperPlane size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
              <div className="text-center mt-3">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">WhaleStreet Intelligence • 2026</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FAB Buton --- */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center relative group overflow-hidden ${
            isOpen 
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rotate-180' 
              : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
        }`}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? <FaTimes size={28} /> : <span className="text-3xl">🐋</span>}
        
        {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white dark:border-gray-900"></span>
            </span>
        )}
      </motion.button>

    </div>
  );
};

export default AIChatbot;