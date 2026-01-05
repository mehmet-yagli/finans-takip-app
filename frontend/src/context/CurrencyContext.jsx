// src/context/CurrencyContext.jsx
import { createContext, useState, useContext } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Varsayılan para birimi TRY, ama kullanıcı değiştirebilecek
  const [currency, setCurrency] = useState('TRY'); 

  // Basit bir kur mantığı (İleride API'den çekebiliriz)
  // Şimdilik sabit: 1 USD = 35 TRY varsayalım (Örnek)
  const exchangeRates = {
    TRY: 1,
    USD: 0.028 // Yaklaşık 1/35
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRates }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);