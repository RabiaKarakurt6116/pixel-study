// src/StudyChart.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function StudyChart({ userId }) {
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0])
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('duration, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
      
      if (data) {
        const daily = [0, 0, 0, 0, 0, 0, 0]
        data.forEach(session => {
          const day = new Date(session.created_at).getDay()
          daily[day] += session.duration / 60 // dakikaya çevir
        })
        setWeeklyData(daily)
      }
    }
    loadData()
  }, [userId])

  const maxValue = Math.max(...weeklyData, 1)

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>📊 SON 7 GÜN ÇALIŞMA</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '150px' }}>
        {weeklyData.map((value, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: `${(value / maxValue) * 120}px`,
              background: 'linear-gradient(180deg, #9b59b6, #e74c3c)',
              borderRadius: '4px',
              transition: 'height 0.3s',
              marginBottom: '5px'
            }} />
            <div style={{ fontSize: '10px' }}>{days[i]}</div>
            <div style={{ fontSize: '9px', color: '#ffd700' }}>{Math.floor(value)}dk</div>
          </div>
        ))}
      </div>
    </div>
  )
}