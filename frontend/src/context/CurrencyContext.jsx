import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api'; 

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Varsayılan para birimi TRY, kullanıcı seçimini burada tutuyoruz
  const [currency, setCurrency] = useState('TRY'); 
  
  // Canlı kur değerlerini tutan state (Başlangıç değeri olarak 36.50'yi güvenli fallback yapıyoruz)
  const [usdToTry, setUsdToTry] = useState(36.50); 
  const [loading, setLoading] = useState(false);

  // Exchange rates artık dinamik hesaplanıyor
  const [exchangeRates, setExchangeRates] = useState({
    TRY: 1,
    USD: 1 / 36.50 
  });

  // Backend'den canlı kur verilerini çeken fonksiyon
  const refreshRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/market');
      
      if (res.data && res.data.rates && res.data.rates.TRY) {
        const liveRate = res.data.rates.TRY;
        setUsdToTry(liveRate);
        
        // Kur tablosunu güncelle
        setExchangeRates({
          TRY: 1,
          USD: 1 / liveRate
        });
        
        console.log(`✅ Kur başarıyla güncellendi: 1 USD = ${liveRate} TRY`);
      }
    } catch (error) {
      console.error("❌ Kur verisi backend'den çekilemedi, fallback kullanılıyor:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🛠️ YENİ: Akıllı Dönüşüm Motoru (Dashboard'dan buraya taşıdık, tüm app kullanabilir)
  const convertCurrency = useCallback((amount, sourceCurrency = 'TRY') => {
    const val = parseFloat(amount) || 0;
    const source = sourceCurrency?.toUpperCase() || 'TRY';

    // 1. Hedef: Girilen verinin kendi birimi ile ekranın seçili birimi aynıysa HİÇBİR İŞLEM YAPMA
    if (source === currency) {
      return val;
    }

    // 2. Sadece çapraz birimlerde canlı kura göre dönüştür
    if (currency === 'USD' && source === 'TRY') {
      return val / usdToTry;
    }
    if (currency === 'TRY' && source === 'USD') {
      return val * usdToTry;
    }

    return val; // Farklı birimler (EUR vb.) gelirse şimdilik ham değeri döndür
  }, [currency, usdToTry]);

  // Uygulama ilk açıldığında kurları bir kez çek
  useEffect(() => {
    refreshRates();
    
    // Opsiyonel: Her 10 dakikada bir kurları arka planda tazele
    const interval = setInterval(refreshRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRates]);

  return (
    // usdToTry, refreshRates ve YENİ convertCurrency fonksiyonunu context'e ekledik
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      exchangeRates, 
      usdToTry, 
      refreshRates,
      convertCurrency,
      loading 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);