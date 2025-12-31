import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ExpenseChart = ({ transactions }) => {
  // 1. Sadece Giderleri (Expense) Filtrele
  const expenses = transactions.filter(t => t.type === 'expense');

  // 2. Kategorilere Göre Grupla ve Topla
  // Örn: { Market: 500, Fatura: 200 } haline getirir
  const dataMap = {};
  expenses.forEach(t => {
    if (dataMap[t.category]) {
      dataMap[t.category] += Number(t.amount);
    } else {
      dataMap[t.category] = Number(t.amount);
    }
  });

  // 3. Recharts formatına çevir
  // Örn: [ { name: 'Market', value: 500 }, ... ]
  const data = Object.keys(dataMap).map(key => ({
    name: key,
    value: dataMap[key]
  }));

  // Grafikte kullanılacak renkler (Pastel tonlar)
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

  // Eğer hiç harcama yoksa boş gösterme
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-80 text-center">
        <div className="p-4 bg-gray-50 rounded-full mb-3">
          <span className="text-4xl">📉</span>
        </div>
        <h3 className="text-gray-800 font-bold text-lg">Harcama Analizi Yok</h3>
        <p className="text-gray-500 text-sm mt-1">Grafiği görmek için sisteme bir harcama ekle.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Harcama Dağılımı</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;