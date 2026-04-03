// src/UserStats.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function UserStats({ userId }) {
  const [stats, setStats] = useState({
    xp: 0,
    level: 1,
    totalStudyTime: 0,
    streakDays: 0,
    tasksCompleted: 0
  })

  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId])

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (data) {
      setStats(data)
    }
  }

  const xpForNextLevel = stats.level * 100

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>⭐ KARAKTER İSTATİSTİKLERİ</h3>
      
      {/* Level ve XP Bar */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Seviye {stats.level}</span>
          <span>{stats.xp} / {xpForNextLevel} XP</span>
        </div>
        <div style={{
          background: '#333',
          height: '20px',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(stats.xp / xpForNextLevel) * 100}%`,
            background: 'linear-gradient(90deg, #9b59b6, #e74c3c)',
            height: '100%',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Diğer istatistikler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>📚 Toplam Çalışma</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>{Math.floor(stats.totalStudyTime / 60)}s</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>🔥 Seri Gün</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>{stats.streakDays}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>✅ Tamamlanan</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>{stats.tasksCompleted}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>🎯 Hedef</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>Level {stats.level + 1}</div>
        </div>
      </div>
    </div>
  )
}