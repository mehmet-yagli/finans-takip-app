import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTimes, FaChevronDown } from 'react-icons/fa';
import aiService from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true); // 👇 YENİ: Baloncuk state'i
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Merhaba! 👋 Ben Finans Asistanın. Portföyünü yorumlamamı ister misin?", 
      sender: 'ai',
      action: null 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 👇 YENİ: Baloncuk 10 saniye sonra otomatik kapansın
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Sohbet açıldığında balonu kapat
  useEffect(() => {
    if (isOpen) setShowTooltip(false);
    scrollToBottom();
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
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
        text: "Bağlantı hatası oluştu.", 
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* --- 👇 YENİ: Konuşma Baloncuğu (Tooltip) --- */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4 mr-2 bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-br-none shadow-xl border border-gray-100 dark:border-gray-700 relative max-w-[200px]"
          >
            <button 
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                className="absolute -top-2 -left-2 bg-gray-200 dark:bg-gray-600 rounded-full p-1 text-gray-500 hover:text-red-500"
            >
                <FaTimes size={10} />
            </button>
            <p className="text-sm text-gray-700 dark:text-gray-200">
                👋 Merhaba! <br/> 
                <span className="font-semibold text-blue-600">Portföyünü analiz edelim mi?</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Chat Penceresi --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
             {/* Header */}
             <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <FaRobot className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Finans Asistanı</h3>
                  <span className="text-xs text-blue-100 flex items-center gap-1 opacity-80">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition">
                <FaChevronDown size={14} />
              </button>
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                    }`}>
                    {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                    
                    {msg.action && (
                      <button 
                        onClick={() => handleNavigate(msg.action)}
                        className="mt-3 w-full py-2 px-3 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 border border-blue-100 dark:border-gray-600"
                      >
                        İlgili Sayfaya Git ➜
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                 <div className="flex justify-start">
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1.5">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Alanı */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                placeholder="Bir soru sor..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition border border-transparent focus:border-blue-500"
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center"
              >
                <FaPaperPlane size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Floating Button (FAB) --- */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-xl transition-all flex items-center justify-center relative group ${
            isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOpen ? <FaTimes size={20} /> : <FaRobot size={24} />}
        
        {/* Ping Efekti (Online Hissi) */}
        {!isOpen && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
        )}
      </motion.button>

    </div>
  );
};

export default AIChatbot;