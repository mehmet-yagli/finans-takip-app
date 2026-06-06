import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ExpenseChart = ({ transactions }) => {
  // RECHARTS HATA ÇÖZÜMÜ: Grafik render edilmeden önce DOM'un yüklenmesini bekle
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Sadece Giderleri (Expense) Filtrele
  const expenses = transactions.filter(t => t.type === 'expense');

  // 2. Kategorilere Göre Grupla ve Topla
  const dataMap = {};
  expenses.forEach(t => {
    if (dataMap[t.category]) {
      dataMap[t.category] += Number(t.amount);
    } else {
      dataMap[t.category] = Number(t.amount);
    }
  });

  // 3. Recharts formatına çevir
  const data = Object.keys(dataMap).map(key => ({
    name: key,
    value: dataMap[key]
  }));

  // Grafikte kullanılacak renkler (Premium Pastel tonlar)
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#8B5CF6', '#EF4444'];

  // Mount edilmeden önce boş div döndürerek -1 px hatasını önle
  if (!isMounted) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 animate-pulse h-80 w-full"></div>
    );
  }

  // Eğer hiç harcama yoksa boş gösterme
  if (data.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg shadow-gray-200/40 dark:shadow-none border border-gray-100/50 dark:border-gray-700/50 flex flex-col items-center justify-center h-80 text-center transition-all">
        <div className="p-5 bg-blue-50 dark:bg-gray-700/50 rounded-full mb-4 shadow-inner">
          <span className="text-4xl">📉</span>
        </div>
        <h3 className="text-gray-800 dark:text-white font-bold text-xl">Harcama Analizi Yok</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Grafiği görmek için sisteme bir harcama ekle.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg shadow-gray-200/40 dark:shadow-none border border-gray-100/50 dark:border-gray-700/50 transition-all">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Harcama Dağılımı</h3>
      <div className="h-64 w-full relative min-h-[250px]">
        {/* minWidth={1} ve minHeight={1} Recharts konsol uyarılarına karşı ekstra bir kalkandır */}
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={85}
              innerRadius={55} // Donut grafik tarzı Premium görünüm için eklendi
              paddingAngle={4} // Dilimler arası estetik boşluk
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-sm" />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;