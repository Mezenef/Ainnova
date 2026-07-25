import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Kayit from './pages/Kayit';
import Dogrulama from './pages/Dogrulama';

import Dashboard from './pages/Dashboard';
import IcerikUret from './pages/IcerikUret';
import Sonuclar from './pages/Sonuclar';
import Takvim from './pages/Takvim';
import Gecmis from './pages/Gecmis';
import Ayarlar from './pages/Ayarlar';
import Yardim from './pages/Yardim';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route path="/dogrulama" element={<Dogrulama />} />
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/uret" element={<MainLayout><IcerikUret /></MainLayout>} />
          <Route path="/sonuclar/:id" element={<MainLayout><Sonuclar /></MainLayout>} />
          <Route path="/takvim" element={<MainLayout><Takvim /></MainLayout>} />
          <Route path="/gecmis" element={<MainLayout><Gecmis /></MainLayout>} />
          <Route path="/ayarlar" element={<MainLayout><Ayarlar /></MainLayout>} />
          <Route path="/yardim" element={<MainLayout><Yardim /></MainLayout>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;