// src/Badges.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Badges({ userId }) {
  const [badges, setBadges] = useState([])

  useEffect(() => {
    // Rozetleri yükle
    const loadBadges = async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
      
      if (data) setBadges(data)
    }
    loadBadges()
  }, [userId])

  const allBadges = [
    { id: 1, name: 'Yeni Başlayan', icon: '🌱', condition: 'İlk pomodoro tamamlandı' },
    { id: 2, name: '3 Gün Seri', icon: '🔥', condition: '3 gün üst üste çalış' },
    { id: 3, name: '7 Gün Seri', icon: '⚡', condition: '7 gün üst üste çalış' },
    { id: 4, name: 'Çalışkan', icon: '📚', condition: '10 saat çalışma' },
    { id: 5, name: 'Süper Çalışkan', icon: '🎓', condition: '50 saat çalışma' },
    { id: 6, name: 'Level 5', icon: '⭐', condition: '5. seviyeye ulaş' },
    { id: 7, name: 'Level 10', icon: '👑', condition: '10. seviyeye ulaş' }
  ]

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>🏆 KAZANILAN ROZETLER</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {allBadges.map(badge => {
          const hasBadge = badges.find(b => b.badge_id === badge.id)
          return (
            <div key={badge.id} style={{
              textAlign: 'center',
              opacity: hasBadge ? 1 : 0.3,
              filter: hasBadge ? 'none' : 'grayscale(1)',
              transition: '0.2s'
            }}>
              <div style={{
                fontSize: '40px',
                background: hasBadge ? '#9b59b6' : '#333',
                borderRadius: '50%',
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {badge.icon}
              </div>
              <div style={{ fontSize: '10px', marginTop: '5px' }}>{badge.name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}