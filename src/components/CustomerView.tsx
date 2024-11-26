import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  queue_length: number;
  average_price: number;
  rating: number;
  is_available: boolean;
}

interface ShopResponse {
  shops: Shop[];
  total: number;
  page: number;
  total_pages: number;
}

const CustomerView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'queue_length' | 'average_price' | 'rating'>('queue_length');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const { isDarkMode } = useTheme();
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        min_rating: minRating.toString(),
        ...(maxPrice && { max_price: maxPrice.toString() })
      });

      console.log('Fetching shops with params:', queryParams.toString());
      const response = await fetch(`http://localhost:8000/shops/catalog?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch shops');
      }
      
      const data: ShopResponse = await response.json();
      console.log('Received shops data:', data);
      setShops(data.shops);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [page, sortBy, sortOrder, minRating, maxPrice]);

  useEffect(() => {
    const filtered = shops.filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredShops(filtered);
  }, [shops, searchTerm]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search for salons..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className={`rounded-lg border px-4 py-2 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="0">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>

            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
              className={`rounded-lg border px-4 py-2 w-32 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSort('queue_length')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'queue_length' 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Queue {sortBy === 'queue_length' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('average_price')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'average_price' 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Price {sortBy === 'average_price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('rating')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'rating' 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Shop List */}
      <div className="grid gap-6">
        {filteredShops.map((shop) => (
          <div
            key={shop.id}
            className={`rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={() => navigate(`/shop/${shop.id}`)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {shop.name}
                    </h2>
                    {shop.is_available && (
                      <span className="px-2 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                        Available Now
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{shop.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Avg. ${shop.average_price}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ★ {shop.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Queue: {shop.queue_length} people</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredShops.length > 0 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                page === i + 1 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerView;