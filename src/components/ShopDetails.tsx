import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Scissors } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface QueueItem {
  id: string;
  name: string;
  time: string;
  status: string;
}

interface ShopData {
  shop: {
    id: string;
    name: string;
    address: string;
    description: string;
  };
  services: Service[];
  queue: QueueItem[];
}

const ShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/shops/${id}/details`);
      if (!response.ok) throw new Error('Failed to fetch shop details');
      const data = await response.json();
      setShopData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shop details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShopDetails();
    // Set up auto-refresh interval
    const intervalId = setInterval(fetchShopDetails, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchShopDetails]);

  const handleJoinQueue = async () => {
    if (!selectedService || !user) {
      if (!user) {
        navigate('/login');
        return;
      }
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/shops/${id}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          service_id: selectedService
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to join queue');
      }

      await fetchShopDetails();
      setSelectedService(null);
    } catch (err) {
      console.error('Queue error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join queue');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!shopData) return <div>No data available</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            {shopData.services.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedService === service.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.duration} min</p>
                  </div>
                  <p className="font-medium text-gray-900">${service.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Queue</h3>
          <div className="space-y-4">
            {shopData.queue.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Scissors className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {appointment.status === 'in-progress' ? 'In Progress' : 'Waiting'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedService && (
            <button
              onClick={handleJoinQueue}
              className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Join Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;