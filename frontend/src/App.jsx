import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InvestmentsPage from './pages/InvestmentsPage';
import Settings from './pages/Settings'; 
import MarketPage from './pages/MarketPage'; 
import Community from './pages/Community'; 
import { CurrencyProvider } from './context/CurrencyContext';
import AIChatbot from './components/AIChatbot';
import Contact from './pages/Contact';

function App() {
  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard Rotası */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Piyasa Rotası */}
          <Route path="/market" element={<MarketPage />} />

          {/* Yatırımlar Rotası */}
          <Route path="/investments" element={<InvestmentsPage />} />

          {/* Topluluk/Forum Rotası */}
          <Route path="/community" element={<Community />} />

          {/* Ayarlar Rotası */}
          <Route path="/settings" element={<Settings />} />

          {/* İletişim Rotası */}
          <Route path="/contact" element={<Contact />} />
        </Routes>

        {/* 👇 GÜNCELLEME: Chatbot'u buraya, Routes dışına ekledik */}
        {/* Böylece hangi sayfada olursan ol sağ altta görünecek */}
        <AIChatbot />

      </div>
    </CurrencyProvider>
  );
}

export default App;