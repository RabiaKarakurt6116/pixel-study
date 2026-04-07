import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'
import UserStats from './UserStats'
import Badges from './Badges'
import StudyChart from './StudyChart'

const BADGES = [
  { id: 'first_login', label: '🎮 İLK GİRİŞ', desc: 'İlk kez giriş yaptın', color: '#3498db' },
  { id: 'first_pomodoro', label: '🍅 İLK POMODORO', desc: 'İlk seansı tamamla', color: '#9b59b6' },
  { id: 'streak_7', label: '🔥 7 GÜNLÜK SERİ', desc: '7 gün üst üste giriş', color: '#ff6b35' },
  { id: 'tasks_10', label: '✅ GÖREV USTASI', desc: '10 görev tamamla', color: '#2ecc71' },
  { id: 'exams_5', label: '📚 SINAV SAVAŞÇISI', desc: '5 sınav ekle', color: '#e74c3c' },
  { id: 'level_5', label: '🏆 MAKSİMUM', desc: 'Seviye 5e ulaş', color: '#f1c40f' },
]

const XP_LEVELS = [0, 100, 250, 500, 900, 1500]

function Dashboard({ userId, onLogout }) {
  const { currentTheme } = useTheme()
  const [userData, setUserData] = useState(null)
  const [nearestExam, setNearestExam] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState({})
  const [userBadges, setUserBadges] = useState([])

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (nearestExam) setTimeLeft(calcTimeLeft(nearestExam.exam_date))
    }, 1000)
    return () => clearInterval(timer)
  }, [nearestExam])

  const fetchAll = async () => {
    await fetchUserData()
    await fetchNearestExam()
    await fetchTodayTasks()
    await fetchPomodoroCount()
    await fetchBadges()
    await updateStreak()
  }

const fetchUserData = async () => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (data) {
    setUserData(data)
    // 🔥 BURASI EKLENDİ - Mevcut kullanıcıya da ilk giriş rozetini dene
    await earnBadge('first_login')
  } else {
    const { data: authData } = await supabase.auth.getUser()
    const { data: newUser } = await supabase
      .from('users')
      .insert([{ id: userId, username: authData.user.email.split('@')[0], email: authData.user.email, xp: 0, level: 1, streak: 0 }])
      .select()
      .single()
    if (newUser) {
      setUserData(newUser)
      await addXP(5)
      await earnBadge('first_login')
    }
  }
}

  const fetchNearestExam = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .gt('exam_date', new Date().toISOString())
      .order('exam_date', { ascending: true })
      .limit(1)
    if (data && data.length > 0) setNearestExam(data[0])
  }

  const fetchTodayTasks = async () => {
    const today = new Date()
    const days = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ']
    const todayName = days[today.getDay()]
    const { data } = await supabase
      .from('weekly_plan')
      .select('*')
      .eq('user_id', userId)
      .eq('day', todayName)
    if (data) setTodayTasks(data)
  }

  const fetchPomodoroCount = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('pomodoro_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', today.toISOString())
    if (data) setPomodoroCount(data.length)
  }

  const fetchBadges = async () => {
    const { data } = await supabase
      .from('badges')
      .select('badge_name')
      .eq('user_id', userId)
    if (data) setUserBadges(data.map(b => b.badge_name))
  }

  const updateStreak = async () => {
    const { data } = await supabase
      .from('users')
      .select('streak, last_login')
      .eq('id', userId)
      .single()
    if (!data) return

    const today = new Date().toDateString()
    const lastLogin = data.last_login ? new Date(data.last_login).toDateString() : null

    if (lastLogin === today) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const newStreak = lastLogin === yesterday.toDateString() ? data.streak + 1 : 1

    await supabase.from('users').update({
      streak: newStreak,
      last_login: new Date().toISOString(),
      xp: (data.xp || 0) + 5
    }).eq('id', userId)

    if (newStreak >= 7) await earnBadge('streak_7')
    await fetchUserData()
  }

  const addXP = async (amount) => {
    const { data } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single()
    if (!data) return

    const newXP = (data.xp || 0) + amount
    const newLevel = XP_LEVELS.findIndex((threshold, i) => 
      newXP < (XP_LEVELS[i + 1] || 99999)
    ) + 1

    await supabase.from('users').update({ xp: newXP, level: newLevel }).eq('id', userId)
    if (newLevel >= 5) await earnBadge('level_5')
    await fetchUserData()
  }

  const earnBadge = async (badgeId) => {
    const { data } = await supabase
      .from('badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_name', badgeId)
    if (data && data.length > 0) return
    await supabase.from('badges').insert([{ user_id: userId, badge_name: badgeId }])
    await fetchBadges()
  }

  const calcTimeLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    }
  }

  const getLevel = (xp) => {
    return XP_LEVELS.findIndex((t, i) => xp < (XP_LEVELS[i + 1] || 99999)) + 1
  }

  const getLevelProgress = (xp) => {
    const level = getLevel(xp)
    const current = XP_LEVELS[level - 1]
    const next = XP_LEVELS[level] || xp
    return Math.round(((xp - current) / (next - current)) * 100)
  }

  const completedTasks = todayTasks.filter(t => t.is_done).length
  const pad = (n) => String(n).padStart(2, '0')

  if (!userData) return (
    <div style={{ textAlign: 'center', marginTop: '100px', color: currentTheme.accent, fontFamily: "'Press Start 2P', cursive", fontSize: '0.5rem' }}>
      YÜKLENİYOR...
    </div>
  )

  return (
    <>
      <style>{`
        .db-wrap { background: ${currentTheme.bg}; min-height: 90vh; padding: 20px; }
        .db-title { text-align: center; font-size: 0.6rem; color: ${currentTheme.accent}; margin-bottom: 16px; font-family: 'Press Start 2P', cursive; }
        .db-card { background: ${currentTheme.bgCard}; border: 2px solid; margin-bottom: 12px; }
        .db-card-bar { height: 5px; }
        .db-card-inner { padding: 12px 16px; }
        .db-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .db-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 600px) { .db-grid2, .db-grid3 { grid-template-columns: 1fr; } }
        .db-label { font-size: 0.3rem; color: ${currentTheme.textDim}; font-family: 'Press Start 2P', cursive; margin-bottom: 8px; }
        .db-big { font-size: 2rem; font-family: 'Press Start 2P', cursive; line-height: 1; }
        .db-sub { font-size: 0.3rem; font-family: 'Press Start 2P', cursive; margin-top: 4px; }
        .db-profile { display: flex; align-items: center; gap: 16px; }
        .db-avatar { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-family: 'Press Start 2P', cursive; background: ${currentTheme.accent}; border: 3px solid ${currentTheme.bgCard}; flex-shrink: 0; }
        .db-username { font-size: 0.5rem; color: ${currentTheme.text}; font-family: 'Press Start 2P', cursive; }
        .db-email { font-size: 0.3rem; color: ${currentTheme.textDim}; font-family: 'Press Start 2P', cursive; margin-top: 4px; }
        .db-logout { margin-left: auto; font-family: 'Press Start 2P', cursive; font-size: 0.3rem; background: transparent; border: 2px solid #ff4444; color: #ff4444; padding: 8px 12px; cursor: pointer; }
        .db-logout:hover { background: #ff4444; color: #fff; }
        .db-xp-bar-wrap { background: ${currentTheme.bg}; border: 2px solid ${currentTheme.border}; height: 12px; margin-top: 8px; }
        .db-xp-bar { height: 100%; background: ${currentTheme.border}; transition: width 0.3s; }
        .db-task-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid ${currentTheme.textDim}; }
        .db-task-check { width: 12px; height: 12px; border: 2px solid ${currentTheme.success}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.4rem; }
        .db-task-text { font-size: 0.3rem; font-family: 'Press Start 2P', cursive; color: ${currentTheme.text}; }
        .db-task-text.done { text-decoration: line-through; color: ${currentTheme.textDim}; }
        .db-progress-wrap { background: ${currentTheme.bg}; border: 2px solid ${currentTheme.success}; height: 10px; margin-top: 10px; }
        .db-progress { height: 100%; background: ${currentTheme.success}; }
        .db-badges { display: flex; flex-wrap: wrap; gap: 8px; }
        .db-badge { padding: 6px 10px; font-size: 0.28rem; font-family: 'Press Start 2P', cursive; border: 2px solid; }
        .db-badge.locked { opacity: 0.25; filter: grayscale(1); }
        .db-exam-time { display: flex; gap: 16px; justify-content: center; margin-top: 8px; }
        .db-time-block { text-align: center; }
        .db-time-num { font-size: 1.2rem; font-family: 'Press Start 2P', cursive; }
        .db-time-label { font-size: 0.25rem; font-family: 'Press Start 2P', cursive; color: ${currentTheme.textDim}; }
      `}</style>

      <div className="db-wrap">
        <div className="db-title">Ana Sayfa</div>

        <UserStats userId={userId} />

        <div className="db-card" style={{ borderColor: currentTheme.accent }}>
          <div className="db-card-bar" style={{ background: currentTheme.accent }} />
          <div className="db-card-inner">
            <div className="db-profile">
              <div className="db-avatar">{userData.username?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <div className="db-username">{userData.username}</div>
                <div className="db-email">{userData.email}</div>
              </div>
              <button className="db-logout" onClick={onLogout}>ÇIKIŞ YAP</button>
            </div>
          </div>
        </div>

        <div className="db-grid3">
          <div className="db-card" style={{ borderColor: '#ff6b35' }}>
            <div className="db-card-bar" style={{ background: '#ff6b35' }} />
            <div className="db-card-inner">
              <div className="db-label">GÜNLÜK SERİ</div>
              <div className="db-big" style={{ color: '#ff6b35' }}>{userData.streak || 0}</div>
              <div className="db-sub" style={{ color: '#ff6b35' }}>🔥 GÜN</div>
            </div>
          </div>

          <div className="db-card" style={{ borderColor: currentTheme.accent }}>
            <div className="db-card-bar" style={{ background: currentTheme.accent }} />
            <div className="db-card-inner">
              <div className="db-label">TOPLAM XP</div>
              <div className="db-big" style={{ color: currentTheme.accent }}>{userData.xp || 0}</div>
              <div className="db-sub" style={{ color: currentTheme.accent }}>⭐ XP</div>
            </div>
          </div>

          <div className="db-card" style={{ borderColor: currentTheme.border }}>
            <div className="db-card-bar" style={{ background: currentTheme.border }} />
            <div className="db-card-inner">
              <div className="db-label">SEVİYE</div>
              <div className="db-big" style={{ color: currentTheme.border }}>{userData.level || 1}</div>
              <div className="db-xp-bar-wrap">
                <div className="db-xp-bar" style={{ width: `${getLevelProgress(userData.xp || 0)}%` }} />
              </div>
              <div className="db-sub" style={{ color: currentTheme.textDim }}>{userData.xp || 0} / {XP_LEVELS[userData.level] || 1500} XP</div>
            </div>
          </div>
        </div>

        <div className="db-grid2">
          <div className="db-card" style={{ borderColor: '#3498db' }}>
            <div className="db-card-bar" style={{ background: '#3498db' }} />
            <div className="db-card-inner">
              <div className="db-label">EN YAKIN SINAV</div>
              {nearestExam ? (
                <>
                  <div style={{ fontSize: '0.4rem', color: currentTheme.text, fontFamily: "'Press Start 2P', cursive", marginBottom: '8px' }}>{nearestExam.name}</div>
                  <div className="db-exam-time">
                    <div className="db-time-block">
                      <div className="db-time-num" style={{ color: '#3498db' }}>{pad(timeLeft.days ?? 0)}</div>
                      <div className="db-time-label">GÜN</div>
                    </div>
                    <div className="db-time-block">
                      <div className="db-time-num" style={{ color: '#3498db' }}>{pad(timeLeft.hours ?? 0)}</div>
                      <div className="db-time-label">SAAT</div>
                    </div>
                    <div className="db-time-block">
                      <div className="db-time-num" style={{ color: '#3498db' }}>{pad(timeLeft.minutes ?? 0)}</div>
                      <div className="db-time-label">DAK</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.3rem', color: currentTheme.textDim, fontFamily: "'Press Start 2P', cursive" }}>Sınav eklenmedi</div>
              )}
            </div>
          </div>

          <div className="db-card" style={{ borderColor: currentTheme.border }}>
            <div className="db-card-bar" style={{ background: currentTheme.border }} />
            <div className="db-card-inner">
              <div className="db-label">BUGÜNÜN POMODOROLARI</div>
              <div className="db-big" style={{ color: currentTheme.border }}>{pomodoroCount}</div>
              <div className="db-sub" style={{ color: currentTheme.border }}>{pomodoroCount * 25} DAKİKA ÇALIŞILDI</div>
            </div>
          </div>
        </div>

        <div className="db-card" style={{ borderColor: currentTheme.success }}>
          <div className="db-card-bar" style={{ background: currentTheme.success }} />
          <div className="db-card-inner">
            <div className="db-label">BUGÜNÜN GÖREVLERİ</div>
            {todayTasks.length > 0 ? (
              <>
                {todayTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="db-task-row">
                    <div className="db-task-check" style={{ background: task.is_done ? currentTheme.success : 'transparent' }}>
                      {task.is_done && '✓'}
                    </div>
                    <span className={`db-task-text ${task.is_done ? 'done' : ''}`}>{task.content}</span>
                  </div>
                ))}
                <div className="db-progress-wrap">
                  <div className="db-progress" style={{ width: `${todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 100 : 0}%` }} />
                </div>
                <div style={{ fontSize: '0.28rem', color: currentTheme.textDim, fontFamily: "'Press Start 2P', cursive", marginTop: '6px' }}>
                  {completedTasks}/{todayTasks.length} TAMAMLANDI
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.3rem', color: currentTheme.textDim, fontFamily: "'Press Start 2P', cursive" }}>Bugün için görev yok</div>
            )}
          </div>
        </div>

        <StudyChart userId={userId} />

        <Badges userId={userId} />

        <div className="db-card" style={{ borderColor: currentTheme.accent }}>
          <div className="db-card-bar" style={{ background: currentTheme.accent }} />
          <div className="db-card-inner">
            <div className="db-label">ROZETLER</div>
            <div className="db-badges">
              {BADGES.map(badge => (
                <div
                  key={badge.id}
                  className={`db-badge ${userBadges.includes(badge.id) ? '' : 'locked'}`}
                  style={{ borderColor: badge.color, color: badge.color }}
                  title={badge.desc}
                >
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard