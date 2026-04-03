// src/ThemeContext.jsx
import { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  // localStorage'dan tema tercihini al, yoksa 'dark' (oyun temasına uygun)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pixel_theme')
    return saved || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('pixel_theme', theme)
    // HTML'e tema class'ını ekle
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const themes = {
    dark: {
      name: 'Karanlık',
      icon: '🌙',
      bg: '#0a0a1a',
      bgCard: '#1a1a2e',
      text: '#e0e0e0',
      textDim: '#8888aa',
      border: '#9b59b6',
      borderLight: '#bb8fce',
      accent: '#f1c40f',
      accent2: '#e74c3c',
      success: '#2ecc71',
      cardBg: '#16213e',
      inputBg: '#0f0f1a',
      hover: 'rgba(155,89,182,0.2)'
    },
    light: {
      name: 'Aydınlık',
      icon: '☀️',
      bg: '#f5f5f5',
      bgCard: '#ffffff',
      text: '#2c3e50',
      textDim: '#7f8c8d',
      border: '#3498db',
      borderLight: '#85c1e9',
      accent: '#e67e22',
      accent2: '#e74c3c',
      success: '#27ae60',
      cardBg: '#ffffff',
      inputBg: '#f8f9fa',
      hover: 'rgba(52,152,219,0.1)'
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, currentTheme: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}