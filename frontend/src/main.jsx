import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Sayfa yönlendirmesi için
import { Toaster } from 'react-hot-toast' // Bildirimler için
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext' // Oturum yönetimi için
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Uygulamayı sarmaladık: Artık herkes auth verisine erişebilir */}
        <App />
        {/* Bildirim kutusu (Sağ üstte çıkacak) */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)