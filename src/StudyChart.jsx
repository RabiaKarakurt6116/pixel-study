// src/StudyChart.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'

export default function StudyChart({ userId }) {
  const { currentTheme } = useTheme()
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(true)
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    
    // Son 7 günü al (bugün dahil)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6) // Son 7 gün
    
    // Önce pomodoro_logs tablosundan almayı dene
    let { data: pomodoroData } = await supabase
      .from('pomodoro_logs')
      .select('started_at')
      .eq('user_id', userId)
      .gte('started_at', sevenDaysAgo.toISOString())
    
    // Eğer pomodoro_logs boşsa, study_sessions'dan al
    if (!pomodoroData || pomodoroData.length === 0) {
      const { data: sessionData } = await supabase
        .from('study_sessions')
        .select('duration, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
      
      if (sessionData && sessionData.length > 0) {
        // study_sessions'dan gelen veriyi işle
        const daily = [0, 0, 0, 0, 0, 0, 0]
        sessionData.forEach(session => {
          const date = new Date(session.created_at)
          let dayIndex = date.getDay() // 0=Pazar, 1=Pzt, ...
          // Pazar'ı (0) dizinin sonuna (6) taşı
          if (dayIndex === 0) dayIndex = 6
          else dayIndex = dayIndex - 1 // Pzt=1->0, Sal=2->1, ...
          
          const durationInMinutes = session.duration / 60
          daily[dayIndex] += durationInMinutes
        })
        setWeeklyData(daily)
        setLoading(false)
        return
      }
    }
    
    // Pomodoro loglarından hesapla
    if (pomodoroData && pomodoroData.length > 0) {
      const daily = [0, 0, 0, 0, 0, 0, 0]
      pomodoroData.forEach(log => {
        const date = new Date(log.started_at)
        let dayIndex = date.getDay()
        // Pazar'ı (0) dizinin sonuna (6) taşı
        if (dayIndex === 0) dayIndex = 6
        else dayIndex = dayIndex - 1
        
        daily[dayIndex] += 25 // Her pomodoro 25 dakika
      })
      setWeeklyData(daily)
    }
    
    setLoading(false)
  }

  const maxValue = Math.max(...weeklyData, 1)
  const totalMinutes = weeklyData.reduce((sum, val) => sum + val, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (loading) {
    return (
      <div style={{
        background: currentTheme.bgCard,
        border: `2px solid ${currentTheme.border}`,
        borderRadius: '0px',
        padding: '20px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '0.3rem', color: currentTheme.textDim, fontFamily: "'Courier New', monospace" }}>
          [ YUKLENIYOR... ]
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: currentTheme.bgCard,
      border: `2px solid ${currentTheme.border}`,
      borderRadius: '0px',
      padding: '16px',
      marginBottom: '12px'
    }}>
      <div style={{ 
        fontSize: '0.3rem', 
        color: currentTheme.textDim, 
        fontFamily: "'Courier New', monospace", 
        fontWeight: 'bold',
        marginBottom: '12px',
        letterSpacing: '1px'
      }}>
        [ SON 7 GUN CALISMA ]
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
        {weeklyData.map((value, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: `${(value / maxValue) * 100}px`,
              minHeight: value > 0 ? '4px' : '2px',
              background: `linear-gradient(180deg, ${currentTheme.accent}, ${currentTheme.border})`,
              borderRadius: '2px',
              transition: 'height 0.3s',
              marginBottom: '6px',
              width: '100%'
            }} />
            <div style={{ 
              fontSize: '0.25rem', 
              color: currentTheme.textDim,
              fontFamily: "'Courier New', monospace",
              marginTop: '4px'
            }}>
              {days[i]}
            </div>
            <div style={{ 
              fontSize: '0.22rem', 
              color: currentTheme.accent,
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold'
            }}>
              {Math.floor(value)}dk
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        fontSize: '0.25rem', 
        color: currentTheme.textDim,
        fontFamily: "'Courier New', monospace",
        textAlign: 'center',
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: `1px solid ${currentTheme.border}`
      }}>
        TOPLAM: {totalHours > 0 ? `${totalHours} SAAT ` : ''}{remainingMinutes} DAKIKA
      </div>
    </div>
  )
}