import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const MOCK_SHOPS = [
  {
    id: 1,
    name: "Elite Cuts",
    address: "123 Main St",
    rating: 4.8,
    queueLength: 3,
    estimatedWait: "30 min",
    services: [
      { name: "Haircut", price: 30, duration: "30 min" },
      { name: "Styling", price: 45, duration: "45 min" },
    ]
  },
  {
    id: 2,
    name: "Modern Salon",
    address: "456 Oak Ave",
    rating: 4.6,
    queueLength: 2,
    estimatedWait: "20 min",
    services: [
      { name: "Haircut", price: 35, duration: "30 min" },
      { name: "Color", price: 85, duration: "90 min" },
    ]
  }
];

const CustomerView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { isDarkMode } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search for salons..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {MOCK_SHOPS.map((shop) => (
          <div
            key={shop.id}
            className={`rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={() => navigate(`/shop/${shop.id}`)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {shop.name}
                  </h2>
                  <div className={`flex items-center mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{shop.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    ⭐️ {shop.rating}
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Queue: {shop.queueLength} people</span>
                </div>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  Est. wait: {shop.estimatedWait}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerView;