import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const UserSelection = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleShopOwnerClick = () => {
    if (isAuthenticated) {
      navigate('/shop-select');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className={`text-3xl font-bold text-center mb-12 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Welcome to StyleQueue
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        <button
          onClick={() => navigate('/customer')}
          className={`flex flex-col items-center p-8 rounded-xl shadow-lg hover:shadow-xl transition-all ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <Users className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            I'm a Customer
          </h2>
          <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Book appointments and view waiting times at nearby salons
          </p>
        </button>

        <button
          onClick={handleShopOwnerClick}
          className={`flex flex-col items-center p-8 rounded-xl shadow-lg hover:shadow-xl transition-all ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <Store className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            I'm a Shop Owner
          </h2>
          <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your salon's queue and appointments
          </p>
        </button>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default UserSelection;