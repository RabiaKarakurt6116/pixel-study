// src/ThemeToggle.jsx
import { useTheme } from './ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme, currentTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: currentTheme.bgCard,
        border: `2px solid ${currentTheme.border}`,
        color: currentTheme.text,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '0.45rem',
        padding: '8px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: '0.1s linear',
        borderRadius: '8px'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.05)'
        e.target.style.background = currentTheme.hover
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)'
        e.target.style.background = currentTheme.bgCard
      }}
    >
      <span style={{ fontSize: '0.8rem' }}>{currentTheme.icon}</span>
      <span>{currentTheme.name} MOD</span>
    </button>
  )
}