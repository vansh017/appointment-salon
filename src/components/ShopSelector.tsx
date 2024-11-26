import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Plus } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AddShopModal from './AddShopModal';

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
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch(`http://localhost:8000/shops/owner/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch shops');
        
        const data = await response.json();
        setShops(data.shops);
        
        if (data.shops.length === 0) {
          setIsAddShopModalOpen(true);
        }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your Shops
        </h1>
        <button
          onClick={() => setIsAddShopModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus className="h-5 w-5" />
          Add New Shop
        </button>
      </div>
      
      {shops.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-medium mb-2">No Shops Yet</h2>
          <p>Get started by creating your first shop</p>
        </div>
      ) : (
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
            </button>
          ))}
        </div>
      )}

      <AddShopModal
        isOpen={isAddShopModalOpen}
        onClose={() => setIsAddShopModalOpen(false)}
      />
    </div>
  );
};

export default ShopSelector; 