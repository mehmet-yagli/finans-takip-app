import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // <-- YENİ EKLENDİ

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Rotası */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* <-- YENİ EKLENDİ */}
      </Routes>
    </div>
  );
}

export default App;