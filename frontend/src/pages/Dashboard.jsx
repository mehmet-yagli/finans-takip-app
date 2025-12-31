import { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiPieChart, FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus, FiTrash } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AddTransactionModal from '../components/AddTransactionModal';
import ExpenseChart from '../components/ExpenseChart'; // <-- 1. YENİ EKLENEN IMPORT
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
      
      let income = 0;
      let expense = 0;
      
      res.data.forEach(t => {
        if (t.type === 'income') income += Number(t.amount);
        else expense += Number(t.amount);
      });
      
      setStats({
        totalBalance: income - expense,
        totalIncome: income,
        totalExpense: expense
      });

    } catch (error) {
      console.error("Veri çekilemedi:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("İşlem başarıyla silindi");
      fetchDashboardData();
    } catch (error) {
      console.error("Silme hatası:", error);
      toast.error("İşlem silinemedi");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* SOL MENÜ */}
      <div className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FiPieChart /> FinansTakip
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium transition-colors">
            <FiPieChart /> Genel Bakış
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <FiLogOut /> Çıkış Yap
          </button>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          
          {/* Üst Başlık */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Hoş Geldin, {user?.name} 👋</h2>
              <p className="text-gray-500">Finansal durumunun özeti.</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"
            >
              <FiPlus size={20} />
              Yeni İşlem
            </button>
          </div>

          {/* Kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><FiDollarSign size={24} /></div>
                <span className="text-sm font-medium text-gray-400">Toplam Bakiye</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">₺{stats.totalBalance.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full"><FiTrendingUp size={24} /></div>
                <span className="text-sm font-medium text-gray-400">Toplam Gelir</span>
              </div>
              <h3 className="text-3xl font-bold text-green-600">+₺{stats.totalIncome.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full"><FiTrendingDown size={24} /></div>
                <span className="text-sm font-medium text-gray-400">Toplam Gider</span>
              </div>
              <h3 className="text-3xl font-bold text-red-500">-₺{stats.totalExpense.toLocaleString('tr-TR')}</h3>
            </div>
          </div>

          {/* --- 2. YENİ DÜZEN (GRID YAPISI) --- */}
          {/* Ekran genişse yan yana, darsa alt alta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL TARAFTA GRAFİK (1/3 Genişlik) */}
            <div className="lg:col-span-1">
              <ExpenseChart transactions={transactions} />
            </div>

            {/* SAĞ TARAFTA LİSTE (2/3 Genişlik) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Son İşlemler</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-100">
                      <th className="pb-3 pl-4">Açıklama</th>
                      <th className="pb-3">Kategori</th>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3 text-right">Tutar</th>
                      <th className="pb-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400">Henüz hiç işlem eklemedin.</td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                          <td className="py-4 pl-4 font-medium text-gray-700">{t.description || 'İsimsiz'}</td>
                          <td className="py-4 text-sm text-gray-500">
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                          <td className={`py-4 text-right font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                          </td>
                          <td className="py-4 text-center">
                            <button 
                              onClick={() => handleDelete(t._id)}
                              className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                              title="Sil"
                            >
                              <FiTrash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;