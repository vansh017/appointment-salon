import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import UserSelection from './components/UserSelection';
import CustomerView from './components/CustomerView';
import ShopDetails from './components/ShopDetails';
import ShopDashboard from './components/ShopDashboard';
import Navbar from './components/Navbar';
import { useTheme } from './ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ShopSelector from './components/ShopSelector';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <Routes>
            <Route path="/" element={<UserSelection />} />
            <Route path="/customer" element={<CustomerView />} />
            <Route path="/shop-select" element={<ShopSelector />} />
            <Route path="/shop-dashboard/:shopId" element={<ShopDashboard />} />
            <Route path="/shop/:id" element={<ShopDetails />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;