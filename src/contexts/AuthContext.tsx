import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'customer' | 'owner';
  token: string;
  dark_mode?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserPreference: (darkMode: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem('userSession');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('userSession', JSON.stringify(user));
    } else {
      localStorage.removeItem('userSession');
    }
  }, [user]);

  const updateUserPreference = async (darkMode: boolean) => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ dark_mode: darkMode })
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setUser(prev => prev ? { ...prev, dark_mode: darkMode } : null);
    } catch (error) {
      console.error('Failed to update theme preference:', error);
    }
  };

  const login = (userData: User) => {
    const sessionData = {
      ...userData,
      loginTime: new Date().toISOString()
    };
    setUser(sessionData);
    localStorage.setItem('userSession', JSON.stringify(sessionData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, updateUserPreference }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 