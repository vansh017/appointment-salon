import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Plus } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Shop {
  id: string;
  name: string;
  address: string;
  queueLength: number;
}

const ShopSelector = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch(`http://localhost:8000/shops/owner/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.id}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch shops');
        
        const data = await response.json();
        setShops(data.shops);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [user]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Select a Shop to Manage
      </h1>
      
      <div className="grid gap-6">
        {shops.map((shop) => (
          <button
            key={shop.id}
            onClick={() => navigate(`/shop-dashboard/${shop.id}`)}
            className={`flex items-center justify-between p-6 rounded-lg shadow-md transition-all ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <Store className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="text-left">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {shop.name}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {shop.address}
                </p>
              </div>
            </div>
            <ArrowRight className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShopSelector; 