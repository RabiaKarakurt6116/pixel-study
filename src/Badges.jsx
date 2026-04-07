// src/Badges.jsx - DÜZELTİLMİŞ VERSİYON
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const BADGES = [
  { id: 'first_login', label: '🎮 İLK GİRİŞ', desc: 'İlk kez giriş yaptın', icon: '🎮' },
  { id: 'first_pomodoro', label: '🍅 İLK POMODORO', desc: 'İlk seansı tamamla', icon: '🍅' },
  { id: 'streak_7', label: '🔥 7 GÜNLÜK SERİ', desc: '7 gün üst üste giriş', icon: '🔥' },
  { id: 'tasks_10', label: '✅ GÖREV USTASI', desc: '10 görev tamamla', icon: '✅' },
  { id: 'exams_5', label: '📚 SINAV SAVAŞÇISI', desc: '5 sınav ekle', icon: '📚' },
  { id: 'level_5', label: '🏆 MAKSİMUM', desc: 'Seviye 5e ulaş', icon: '🏆' },
]

export default function Badges({ userId }) {
  const [userBadges, setUserBadges] = useState([])

  useEffect(() => {
    if (userId) {
      loadBadges()
    }
  }, [userId])

  const loadBadges = async () => {
    const { data } = await supabase
      .from('badges')
      .select('badge_name')
      .eq('user_id', userId)
    
    if (data) {
      setUserBadges(data.map(b => b.badge_name))
    }
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>🏆 KAZANILAN ROZETLER</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {BADGES.map(badge => {
          const hasBadge = userBadges.includes(badge.id)
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
              <div style={{ fontSize: '10px', marginTop: '5px' }}>{badge.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}