// src/UserStats.jsx - DÜZELTİLMİŞ VERSİYON
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function UserStats({ userId }) {
  const [stats, setStats] = useState({
    xp: 0,
    level: 1,
    streak: 0
  })

  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId])

  const loadStats = async () => {
    const { data } = await supabase
      .from('users')
      .select('xp, level, streak')
      .eq('id', userId)
      .single()
    
    if (data) {
      setStats({
        xp: data.xp || 0,
        level: data.level || 1,
        streak: data.streak || 0
      })
    }
  }

  const xpForNextLevel = [100, 250, 500, 900, 1500][stats.level - 1] || 1500

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>⭐ KARAKTER İSTATİSTİKLERİ</h3>
      
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>🔥 Seri Gün</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>{stats.streak}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: '#1a1a2e', borderRadius: '8px' }}>
          <div>🎯 Hedef</div>
          <div style={{ fontSize: '24px', color: '#ffd700' }}>Level {stats.level + 1}</div>
        </div>
      </div>
    </div>
  )
}