import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface AddShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddShopModal = ({ isOpen, onClose }: AddShopModalProps) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    address: '',
    description: '',
    services: []
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8000/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create shop');
      }

      const data = await response.json();
      onClose();
      navigate(`/shop-dashboard/${data.shop_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create shop');
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
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Create New Shop
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Shop Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              rows={3}
            />
          </div>

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
                    className={`w-24 px-2 py-1 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
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
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

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
              {isSubmitting ? 'Creating...' : 'Create Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShopModal; 