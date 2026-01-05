import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('TRY'); // Varsayılan para birimi
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exchangeRate, setExchangeRate] = useState(36.50); // Yedek kur

  // KATEGORİ LİSTELERİ
  const expenseCategories = [
    "Market", "Fatura", "Ulaşım", "Kira", "Eğlence", 
    "Sağlık", "Eğitim", "Giyim", "Elektronik", "Diğer"
  ];

  const incomeCategories = [
    "Maaş", "Yatırım", "Freelance", "Kira Geliri", 
    "Borsa/Kripto", "Prim", "Hediye", "Satış", "Diğer"
  ];

  // Modal açıldığında güncel kuru çek
  useEffect(() => {
    if (isOpen) {
      const fetchRate = async () => {
        try {
          const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
          const data = await response.json();
          if (data?.rates?.TRY) {
            setExchangeRate(data.rates.TRY);
          }
        } catch (error) {
          console.error("Kur çekilemedi, varsayılan kullanılıyor.");
        }
      };
      fetchRate();
    }
  }, [isOpen]);

  useEffect(() => {
    if (type === 'income') {
      setCategory(incomeCategories[0]); 
    } else {
      setCategory(expenseCategories[0]); 
    }
    // eslint-disable-next-line
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalAmount = parseFloat(amount);

      // EĞER KULLANICI TRY GİRDİYSE -> USD'YE ÇEVİRİP KAYDET
      // Çünkü sistemin ana para birimi USD. Dashboard'da tekrar TRY'ye çevrilince doğru görünür.
      if (currency === 'TRY') {
        finalAmount = finalAmount / exchangeRate;
      }

      const newTransaction = {
        amount: finalAmount, // Veritabanına USD olarak gider
        type,
        category,
        description,
        date,
      };

      // --- GÜNCELLEME: Response'u yakalıyoruz ---
      const response = await api.post('/transactions', newTransaction);
      
      // Bütçe Uyarısı Var mı? (Backend'den 'budgetAlert' objesi dönerse)
      if (response.data.budgetAlert) {
          // Özel uyarı mesajı (Sarı ikonlu ve daha uzun süreli)
          toast(response.data.budgetAlert.message, {
              icon: '⚠️',
              duration: 5000,
              style: {
                  border: '1px solid #FCD34D',
                  padding: '16px',
                  color: '#92400E',
                  background: '#FEF3C7',
              },
          });
      } else {
          // Standart başarı mesajı
          toast.success('İşlem başarıyla eklendi!');
      }

      onTransactionAdded(); 
      onClose(); 
      
      // Formu temizle
      setAmount('');
      setDescription('');
      setCurrency('TRY'); // Varsayılana dön
    } catch (error) {
      console.error(error);
      toast.error('Ekleme başarısız oldu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Yeni İşlem Ekle</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FiX className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Gelir / Gider Seçimi */}
          <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gider (Harcama)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gelir (Para Girişi)
            </button>
          </div>

          {/* Tutar ve Para Birimi */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tutar</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-gray-800"
                placeholder="0.00"
                step="any"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 p-3 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 cursor-pointer"
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            {currency === 'TRY' && (
               <p className="text-[10px] text-gray-400 mt-1 ml-1">
                 Yaklaşık: ${(parseFloat(amount || 0) / exchangeRate).toFixed(2)} (Kur: {exchangeRate.toFixed(2)})
               </p>
            )}
          </div>

          {/* Kategori ve Tarih */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm font-medium"
              >
                {type === 'expense' 
                  ? expenseCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                  : incomeCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                }
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tarih</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Örn: Açıklama giriniz..."
            />
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 ${
              type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <FiCheck size={20} />
            {type === 'income' ? 'Geliri Kaydet' : 'Harcamayı Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;