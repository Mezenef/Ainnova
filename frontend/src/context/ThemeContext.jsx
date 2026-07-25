import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const ThemeContext = createContext();

const satürasyonDegerleri = { dusuk: '0.5', orta: '1', yuksek: '1.6' };

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [accentColor, setAccentColorState] = useState('#4a47a3');
  const [fontFamily, setFontFamilyState] = useState('Inter');
  const [colorSaturation, setColorSaturationState] = useState('orta');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access") || sessionStorage.getItem("access");
    if (!token) {
      setLoaded(true);
      return;
    }
    api.get("notifications/preferences/")
      .then((res) => {
        setIsDarkModeState(!!res.data.dark_mode);
        setAccentColorState(res.data.accent_color || '#4a47a3');
        setFontFamilyState(res.data.font_family || 'Inter');
        setColorSaturationState(res.data.color_saturation || 'orta');
      })
      .catch((err) => console.error("Görünüm tercihleri alınamadı:", err))
      .finally(() => setLoaded(true));
  }, []);

  // CSS değişkenlerini her state değiştiğinde uygula (hangi sayfada olursak olalım)
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-saturation', satürasyonDegerleri[colorSaturation]);
  }, [colorSaturation]);

  const kaydet = async (alanlar) => {
    try {
      await api.put("notifications/preferences/", alanlar);
    } catch (err) {
      console.error("Görünüm tercihi kaydedilemedi:", err);
    }
  };

  const setIsDarkMode = (value) => {
    setIsDarkModeState(value);
    kaydet({ dark_mode: value });
  };

  const setAccentColor = (value) => {
    setAccentColorState(value);
    kaydet({ accent_color: value });
  };

  const setFontFamily = (value) => {
    setFontFamilyState(value);
    kaydet({ font_family: value });
  };

  const setColorSaturation = (value) => {
    setColorSaturationState(value);
    kaydet({ color_saturation: value });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{
      isDarkMode, setIsDarkMode, toggleTheme,
      accentColor, setAccentColor,
      fontFamily, setFontFamily,
      colorSaturation, setColorSaturation,
      loaded,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);