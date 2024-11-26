import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserPreference } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    // First check user preference from auth
    if (user?.dark_mode !== undefined) {
      return user.dark_mode;
    }
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    // Default to light mode
    return false;
  });

  useEffect(() => {
    if (user?.dark_mode !== undefined) {
      setIsDarkMode(user.dark_mode);
    }
  }, [user]);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (user) {
      await updateUserPreference(newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 