// src/App.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import WeeklyPlan from './WeeklyPlan'
import ExamCountdown from './ExamCountdown'
import PomodoroTimer from './Pomodoro'
import Calendar from './Calendar'
import Dashboard from './Dashboard'
import Home from './Home'
import ThemeToggle from './ThemeToggle'
import { useTheme } from './ThemeContext'

function App() {
  const { currentTheme } = useTheme()
  const [screen, setScreen] = useState('home')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id)
        setScreen('dashboard')
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setScreen('home')
  }

  const getThemeColor = () => {
    switch(screen) {
      case 'dashboard':
        return { main: '#e67e22', light: 'rgba(230, 126, 34, 0.2)', dark: '#2c1810', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }
      case 'pomodoro':
        return { main: '#764ba2', light: 'rgba(118, 75, 162, 0.2)', dark: '#1a1a2e', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }
      case 'exams':
        return { main: '#3498db', light: 'rgba(52, 152, 219, 0.2)', dark: '#0f1a2a', gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }
      case 'weekly':
        return { main: '#2ecc71', light: 'rgba(46, 204, 113, 0.2)', dark: '#0a1f12', gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }
      case 'calendar':
        return { main: '#ffb347', light: 'rgba(255, 179, 71, 0.2)', dark: '#2a1a00', gradient: 'linear-gradient(135deg, #ffb347 0%, #e67e22 100%)' }
      default:
        return { main: '#e67e22', light: 'rgba(230, 126, 34, 0.2)', dark: '#2c1810', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }
    }
  }

  const theme = getThemeColor()

  // HOME SAYFASI
  if (screen === 'home') {
    return <Home onStartGame={() => setScreen('auth')} />
  }

  // AUTH SAYFASI
  if (screen === 'auth') {
    return <Auth onLogin={(id) => { setUserId(id); setScreen('dashboard') }} />
  }

  // DASHBOARD VE DİĞER SAYFALAR
  return (
    <div style={{ 
      background: currentTheme.bg, 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      padding: '10px',
      boxSizing: 'border-box',
      transition: 'background 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        padding: '15px 10px',
        borderBottom: `3px solid ${theme.main}`,
        background: currentTheme.bgCard,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap'
      }}>
        <button onClick={() => setScreen('dashboard')} style={{ fontSize: '0.45rem', padding: '10px 20px', background: screen === 'dashboard' ? theme.main : currentTheme.hover, border: `1px solid ${screen === 'dashboard' ? theme.main : theme.main}`, borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (screen !== 'dashboard') { e.target.style.background = 'rgba(230, 126, 34, 0.4)'; e.target.style.transform = 'translateY(-2px)' } }}
          onMouseLeave={(e) => { if (screen !== 'dashboard') { e.target.style.background = currentTheme.hover; e.target.style.transform = 'translateY(0)' } }}
        >🏠 ANA</button>

        <button onClick={() => setScreen('pomodoro')} style={{ fontSize: '0.45rem', padding: '10px 20px', background: screen === 'pomodoro' ? theme.main : currentTheme.hover, border: `1px solid ${screen === 'pomodoro' ? theme.main : '#764ba2'}`, borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (screen !== 'pomodoro') { e.target.style.background = 'rgba(118, 75, 162, 0.4)'; e.target.style.transform = 'translateY(-2px)' } }}
          onMouseLeave={(e) => { if (screen !== 'pomodoro') { e.target.style.background = currentTheme.hover; e.target.style.transform = 'translateY(0)' } }}
        >🍅 POMODORO</button>

        <button onClick={() => setScreen('exams')} style={{ fontSize: '0.45rem', padding: '10px 20px', background: screen === 'exams' ? theme.main : currentTheme.hover, border: `1px solid ${screen === 'exams' ? theme.main : '#3498db'}`, borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (screen !== 'exams') { e.target.style.background = 'rgba(52, 152, 219, 0.4)'; e.target.style.transform = 'translateY(-2px)' } }}
          onMouseLeave={(e) => { if (screen !== 'exams') { e.target.style.background = currentTheme.hover; e.target.style.transform = 'translateY(0)' } }}
        >📚 SINAV</button>

        <button onClick={() => setScreen('weekly')} style={{ fontSize: '0.45rem', padding: '10px 20px', background: screen === 'weekly' ? theme.main : currentTheme.hover, border: `1px solid ${screen === 'weekly' ? theme.main : '#2ecc71'}`, borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (screen !== 'weekly') { e.target.style.background = 'rgba(46, 204, 113, 0.4)'; e.target.style.transform = 'translateY(-2px)' } }}
          onMouseLeave={(e) => { if (screen !== 'weekly') { e.target.style.background = currentTheme.hover; e.target.style.transform = 'translateY(0)' } }}
        >📓 PLAN</button>

        <button onClick={() => setScreen('calendar')} style={{ fontSize: '0.45rem', padding: '10px 20px', background: screen === 'calendar' ? theme.main : currentTheme.hover, border: `1px solid ${screen === 'calendar' ? theme.main : '#ffb347'}`, borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (screen !== 'calendar') { e.target.style.background = 'rgba(255, 179, 71, 0.4)'; e.target.style.transform = 'translateY(-2px)' } }}
          onMouseLeave={(e) => { if (screen !== 'calendar') { e.target.style.background = currentTheme.hover; e.target.style.transform = 'translateY(0)' } }}
        >📅 TAKVİM</button>
        
        <button onClick={handleLogout} style={{ fontSize: '0.45rem', padding: '10px 20px', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', color: currentTheme.text, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(231, 76, 60, 0.4)'; e.target.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(231, 76, 60, 0.2)'; e.target.style.transform = 'translateY(0)' }}
        >🚪 ÇIKIŞ</button>

        <ThemeToggle />
      </div>

      <div>
        <div style={{ display: screen === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard userId={userId} onLogout={handleLogout} />
        </div>
        <div style={{ display: screen === 'pomodoro' ? 'block' : 'none' }}>
          <PomodoroTimer />
        </div>
        <div style={{ display: screen === 'exams' ? 'block' : 'none' }}>
          <ExamCountdown userId={userId} />
        </div>
        <div style={{ display: screen === 'weekly' ? 'block' : 'none' }}>
          <WeeklyPlan userId={userId} />
        </div>
        <div style={{ display: screen === 'calendar' ? 'block' : 'none' }}>
          <Calendar userId={userId} />
        </div>
      </div>
    </div>
  )
}

export default App