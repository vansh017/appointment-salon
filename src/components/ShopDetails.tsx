import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Calendar, Scissors } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const MOCK_SERVICES = [
  { id: 1, name: "Haircut", price: 30, duration: "30 min" },
  { id: 2, name: "Styling", price: 45, duration: "45 min" },
  { id: 3, name: "Color", price: 85, duration: "90 min" },
  { id: 4, name: "Shave", price: 25, duration: "20 min" },
];

const MOCK_QUEUE = [
  { id: 1, name: "John D.", time: "10:30 AM", status: "in-progress" },
  { id: 2, name: "Sarah M.", time: "11:00 AM", status: "waiting" },
  { id: 3, name: "Mike R.", time: "11:30 AM", status: "waiting" },
];

const ShopDetails = () => {
  const { id } = useParams();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const { isDarkMode } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className={`rounded-lg shadow-md p-6 mb-8 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Elite Cuts
            </h2>
            <div className={`flex items-center mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Clock className="h-5 w-5 mr-2" />
              <span>Current Queue: {MOCK_QUEUE.length} people</span>
            </div>
            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Calendar className="h-5 w-5 mr-2" />
              <span>Est. Wait Time: 45 minutes</span>
            </div>
          </div>

          <div className={`rounded-lg shadow-md p-6 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Services
            </h3>
            <div className="space-y-4">
              {MOCK_SERVICES.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedService === service.id
                      ? isDarkMode 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-gray-700 hover:border-blue-500'
                        : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.name}
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {service.duration}
                      </p>
                    </div>
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${service.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Queue</h3>
          <div className="space-y-4">
            {MOCK_QUEUE.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Scissors className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.name}</h4>
                      <p className="text-sm text-gray-600">{appointment.time}</p>
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
              className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Join Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopDetails;