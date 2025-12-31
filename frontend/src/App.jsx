import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InvestmentsPage from './pages/InvestmentsPage'; // 👈 YENİ: Sayfayı içeri aldık

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Rotası */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Yatırımlar Rotası - 👈 YENİ: Adresi belirledik */}
        <Route path="/investments" element={<InvestmentsPage />} />
      </Routes>
    </div>
  );
}

export default App;