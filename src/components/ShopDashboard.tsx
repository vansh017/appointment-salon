import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Scissors, Settings, Plus, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  description: string;
  default_duration: number;
}

interface ShopService {
  service_id: string;
  price: number;
  duration: number;
}

interface ShopFormData {
  name: string;
  address: string;
  description: string;
  services: ShopService[];
}

interface QueueItem {
  id: string;
  name: string;
  service: string;
  time: string;
  status: string;
  duration: number;
}

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
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
        
        // If there are shops, fetch queue for the first shop
        if (data.shops.length > 0) {
          const queueResponse = await fetch(`http://localhost:8000/shops/${data.shops[0].id}/queue`, {
            headers: {
              'Authorization': `Bearer ${user.id}`
            }
          });
          
          if (!queueResponse.ok) throw new Error('Failed to fetch queue');
          
          const queueData = await queueResponse.json();
          setQueueData(queueData.queue);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [user]);

  const calculateAverageWaitTime = (queue: QueueItem[]): number => {
    if (queue.length === 0) return 0;
    
    let totalDuration = 0;
    queue.forEach((item, index) => {
      if (item.status !== 'completed') {
        // For in-progress items, count half their duration
        const duration = item.status === 'in-progress' ? item.duration / 2 : item.duration;
        totalDuration += duration;
      }
    });
    
    return Math.ceil(totalDuration / queue.length);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Shop Dashboard
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Settings className="h-6 w-6" />
          </button>
          {isSettingsOpen && shops.length > 0 && (
            <ShopSettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              shop={shops[0]}
            />
          )}
          <button
            onClick={() => setIsAddShopModalOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center mb-2">
            <Users className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Current Queue
            </h3>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {queueData.length}
          </p>
        </div>

        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center mb-2">
            <Clock className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Average Wait Time
            </h3>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {calculateAverageWaitTime(queueData)} min
          </p>
        </div>

        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center mb-2">
            <Scissors className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Services Today
            </h3>
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            12
          </p>
        </div>
      </div>

      <div className={`rounded-lg shadow-md p-6 transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Current Queue
        </h2>
        <div className="space-y-4">
          {queueData.map((appointment) => (
            <div
              key={appointment.id}
              className={`p-4 rounded-lg border transition-colors ${
                isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {appointment.name}
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {appointment.service} - {appointment.time}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800'
                    : isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status === 'in-progress' ? 'In Progress' : 'Waiting'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddShopModal
        isOpen={isAddShopModalOpen}
        onClose={() => setIsAddShopModalOpen(false)}
      />
    </div>
  );
};

const AddShopModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    address: '',
    description: '',
    services: []
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:8000/services/catalog');
        const data = await response.json();
        setAvailableServices(data.services);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create shop');
      }

      onClose();
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-2xl p-8 rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Add New Shop
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields for shop details */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Shop Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              rows={3}
            />
          </div>

          {/* Services selection */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Services
            </h3>
            {availableServices.map((service) => (
              <div key={service.id} className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const services = e.target.checked
                      ? [...formData.services, { 
                          service_id: service.id, 
                          price: 0, 
                          duration: service.default_duration 
                        }]
                      : formData.services.filter(s => s.service_id !== service.id);
                    setFormData({ ...formData, services });
                  }}
                />
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {service.name}
                </span>
                {formData.services.find(s => s.service_id === service.id) && (
                  <input
                    type="number"
                    placeholder="Price"
                    className="w-24 px-2 py-1 rounded border"
                    onChange={(e) => {
                      const services = formData.services.map(s => 
                        s.service_id === service.id 
                          ? { ...s, price: parseFloat(e.target.value) }
                          : s
                      );
                      setFormData({ ...formData, services });
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Shop
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopDashboard; 