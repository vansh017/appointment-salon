import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: string;
    name: string;
    address: string;
    description: string;
    services: ShopService[];
  };
}

const ShopSettingsModal = ({ isOpen, onClose, shop }: ShopSettingsModalProps) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: shop.name,
    address: shop.address,
    description: shop.description,
    services: shop.services
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    setFormData({
      name: shop.name,
      address: shop.address,
      description: shop.description,
      services: shop.services
    });
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:8000/shops/${shop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shop');
      }

      onClose();
      window.location.reload();
    } catch (error) {
      setError(error.message);
      console.error('Error updating shop:', error);
    } finally {
      setIsSubmitting(false);
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
          className={`absolute top-4 right-4 p-2 rounded-full ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Shop Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Shop Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Services
            </h3>
            {availableServices.map((service) => {
              const existingService = formData.services.find(s => s.service_id === service.id);
              return (
                <div key={service.id} className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={!!existingService}
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
                  {existingService && (
                    <>
                      <input
                        type="number"
                        placeholder="Price"
                        value={existingService.price}
                        className={`w-24 px-2 py-1 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        onChange={(e) => {
                          const services = formData.services.map(s => 
                            s.service_id === service.id 
                              ? { ...s, price: parseFloat(e.target.value) }
                              : s
                          );
                          setFormData({ ...formData, services });
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Duration (min)"
                        value={existingService.duration}
                        className={`w-24 px-2 py-1 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        onChange={(e) => {
                          const services = formData.services.map(s => 
                            s.service_id === service.id 
                              ? { ...s, duration: parseInt(e.target.value) }
                              : s
                          );
                          setFormData({ ...formData, services });
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ShopSettingsModal; 