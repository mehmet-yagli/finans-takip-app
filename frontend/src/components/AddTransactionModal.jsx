import { useState } from 'react';
import { FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }) => {
  const expenseCategories = [
    "Market", "Fatura", "Ulaşım", "Kira", "Eğlence", 
    "Sağlık", "Eğitim", "Giyim", "Elektronik", "Diğer"
  ];

  const incomeCategories = [
    "Maaş", "Yatırım", "Freelance", "Kira Geliri", 
    "Borsa/Kripto", "Prim", "Hediye", "Satış", "Diğer"
  ];

  const { usdToTry } = useCurrency();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState(expenseCategories[0]);
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory(incomeCategories[0]); 
    } else {
      setCategory(expenseCategories[0]); 
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // DİKKAT: Artık kuru bölmüyoruz! Veri tam olarak girildiği gibi kalıyor.
      let finalAmount = parseFloat(amount);

      const newTransaction = {
        amount: finalAmount, 
        currency: currency, // YENİ: Backend'e artık bu işlemin TRY mi USD mi olduğunu açıkça söylüyoruz!
        type,
        category,
        description,
        date,
        isRecurring
      };

      const response = await api.post('/transactions', newTransaction);
      
      if (response.data.budgetAlert) {
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
          toast.success(isRecurring ? 'Düzenli işlem başarıyla oluşturuldu!' : 'İşlem başarıyla eklendi!');
      }

      onTransactionAdded(); 
      onClose(); 
      
      setAmount('');
      setDescription('');
      setCurrency('TRY'); 
      setIsRecurring(false); 
    } catch (error) {
      console.error(error);
      toast.error('Ekleme başarısız oldu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Yeni İşlem Ekle</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Gider (Harcama)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'income' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Gelir (Para Girişi)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tutar</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-gray-800 dark:text-white"
                placeholder="0.00"
                step="any"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            {/* Önizleme: TRY girilirse yaklaşık Dolar karşılığını bilgi amaçlı gösteriyoruz */}
            {currency === 'TRY' && amount && (
               <p className="text-[10px] text-gray-400 mt-1 ml-1">
                 Yaklaşık: ${(parseFloat(amount || 0) / usdToTry).toFixed(2)} USD (Kur: {usdToTry.toFixed(2)})
               </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm font-medium dark:text-white"
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
                className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              placeholder="Örn: Açıklama giriniz..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <FiRefreshCw size={16} className={isRecurring ? "animate-spin-slow" : ""} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Düzenli İşlem</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Her ay otomatik olarak eklensin.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

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