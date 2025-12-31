import { useState, useEffect } from 'react';
import { getInvestments, addInvestment, deleteInvestment, updatePrice } from '../services/investmentService';
import Sidebar from '../components/Sidebar'; // 👈 1. Sidebar'ı çağırdık

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Form Verileri
  const [formData, setFormData] = useState({
    type: 'crypto',
    symbol: '',
    name: '',
    amount: '',
    buyPrice: '',
    buyDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const data = await getInvestments();
      setInvestments(data.investments || []); 
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Yatırımlar çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addInvestment(formData);
      alert('Yatırım Portföye Eklendi! 🚀');
      fetchInvestments();
      setFormData({ ...formData, symbol: '', name: '', amount: '', buyPrice: '' });
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.message || 'Ekleme başarısız'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu yatırımı silmek istiyor musun?')) {
      try {
        await deleteInvestment(id);
        fetchInvestments();
      } catch (error) {
        alert('Silinemedi');
      }
    }
  };
  
  const handleUpdatePrice = async (id) => {
      try {
          await updatePrice(id);
          alert('Fiyat güncellendi! 💸');
          fetchInvestments();
      } catch (error) {
          alert('Fiyat güncellenemedi.');
      }
  };

  return (
    // 👇 2. Sayfa yapısını Dashboard ile aynı yaptık (Flex Layout)
    <div className="flex h-screen bg-gray-100">
      
      {/* SOL MENÜ */}
      <Sidebar />

      {/* SAĞ İÇERİK (Kaydırılabilir Alan) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8"> {/* <-- Padding artırdık, ferah olsun */}
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">💰 Yatırım Portföyüm</h1>
          </div>

          {/* --- ÖZET KARTLARI (DASHBOARD) --- */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm font-medium uppercase">Toplam Yatırılan</p>
                <h3 className="text-2xl font-bold text-gray-800">${summary.totalInvested.toFixed(2)}</h3>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <p className="text-gray-500 text-sm font-medium uppercase">Güncel Değer</p>
                <h3 className="text-2xl font-bold text-indigo-700">${summary.totalCurrentValue.toFixed(2)}</h3>
              </div>

              <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${summary.totalProfitLoss >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <p className="text-gray-500 text-sm font-medium uppercase">Toplam Kâr/Zarar</p>
                <div className="flex items-end">
                    <h3 className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.totalProfitLoss >= 0 ? '+' : ''}{summary.totalProfitLoss.toFixed(2)} $ 
                    </h3>
                    <span className={`ml-2 mb-1 text-sm font-semibold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({summary.totalProfitLossPercentage}%)
                    </span>
                </div>
              </div>
            </div>
          )}

          {/* --- YENİ YATIRIM EKLEME FORMU --- */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-2">➕</span> 
                Yeni Varlık Ekle
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <select 
                className="p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="crypto">🪙 Kripto</option>
                <option value="stock">📈 Hisse</option>
                <option value="commodity">🥇 Altın/Emtia</option>
              </select>

              <input type="text" placeholder="Sembol (BTC, THYAO)" 
                className="p-3 border border-gray-300 rounded-lg uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
              
              <input type="text" placeholder="Ad (Bitcoin)" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              
              <input type="number" placeholder="Miktar" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              
              <input type="number" placeholder="Alış Fiyatı ($)" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} required />
              
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg lg:col-span-1 transform hover:scale-105">
                Ekle
              </button>
            </form>
          </div>

          {/* --- YATIRIM LİSTESİ TABLOSU --- */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-left">Varlık</th>
                  <th className="py-4 px-6 text-left">Miktar</th>
                  <th className="py-4 px-6 text-left">Alış (Ort)</th>
                  <th className="py-4 px-6 text-left">Güncel Fiyat</th>
                  <th className="py-4 px-6 text-left">Kâr/Zarar</th>
                  <th className="py-4 px-6 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? 
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500 animate-pulse">Veriler yükleniyor...</td></tr> : 
                investments.length === 0 ? 
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Henüz portföyünüzde bir yatırım yok.</td></tr> :
                investments.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50 transition duration-150">
                    <td className="py-4 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="bg-gray-200 text-gray-700 font-bold text-xs px-2 py-1 rounded mr-3">{inv.symbol}</span>
                        <span className="font-medium text-gray-900">{inv.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-left font-medium text-gray-700">{inv.amount}</td>
                    <td className="py-4 px-6 text-left text-gray-500">${inv.buyPrice}</td>
                    <td className="py-4 px-6 text-left">
                        <div className="flex items-center">
                            <span className="font-bold text-gray-800 mr-2">
                                {inv.currentPrice ? `$${inv.currentPrice}` : '---'}
                            </span>
                            <button onClick={() => handleUpdatePrice(inv._id)} title="Fiyatı Güncelle" className="text-gray-400 hover:text-blue-500">
                                🔄
                            </button>
                        </div>
                    </td>
                    <td className="py-4 px-6 text-left">
                      {inv.buyPrice > 0 ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              inv.currentPrice > inv.buyPrice ? 'bg-green-100 text-green-800' : 
                              inv.currentPrice < inv.buyPrice ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                              {inv.currentPrice ? `%${(((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100).toFixed(2)}` : '-'}
                          </span>
                      ) : (
                          <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => handleDelete(inv._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;