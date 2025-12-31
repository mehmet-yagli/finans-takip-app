import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiPieChart, FiLogOut, FiTrendingUp } from 'react-icons/fi';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // Hangi sayfada olduğumuzu anlamak için

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Aktif sayfayı mavi yapmak için yardımcı fonksiyon
  const getLinkClass = (path) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors";
    return location.pathname === path 
      ? `${baseClass} bg-blue-50 text-blue-600` // Aktifse Mavi
      : `${baseClass} text-gray-600 hover:bg-gray-50`; // Değilse Gri
  };

  return (
    <div className="w-64 bg-white shadow-lg hidden md:flex flex-col h-full">
      {/* LOGO ALANI */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <FiPieChart /> FinansTakip
        </h1>
      </div>
      
      {/* MENÜ LİNKLERİ */}
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          <FiPieChart /> Genel Bakış
        </Link>

        <Link to="/investments" className={getLinkClass('/investments')}>
          <FiTrendingUp /> Yatırımlarım
        </Link>
      </nav>

      {/* ÇIKIŞ BUTONU */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
        >
          <FiLogOut /> Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default Sidebar;