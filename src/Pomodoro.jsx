import { useState, useEffect, useRef } from 'react'
import { useTheme } from './ThemeContext'
import { supabase } from './supabaseClient'

const PomodoroTimer = ({ userId }) => {  // userId prop olarak alıyor
  const { currentTheme } = useTheme()
  const MODES = {
    pomodoro: { workMin: 25, breakMin: 5, label: ">_ 25/5", modeName: "25/5" },
    medium: { workMin: 50, breakMin: 10, label: ">_ 50/10", modeName: "50/10" },
    long: { workMin: 90, breakMin:20, label: ">_ 90/20", modeName: "90/20" }
  }
  
  const [currentModeKey, setCurrentModeKey] = useState("pomodoro")
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsHistory, setSessionsHistory] = useState([])
  const [notificationPermission, setNotificationPermission] = useState(false)
  
  const timerIntervalRef = useRef(null)

  // ============ XP ve ROZET FONKSİYONLARI ============
  const XP_LEVELS = [0, 100, 250, 500, 900, 1500]

  const addXP = async (amount) => {
    if (!userId) return
    
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
  }

  const earnBadge = async (badgeId) => {
    if (!userId) return
    
    const { data } = await supabase
      .from('badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_name', badgeId)
    if (data && data.length > 0) return
    
    await supabase.from('badges').insert([{ user_id: userId, badge_name: badgeId }])
  }

  const checkFirstPomodoroBadge = async () => {
    if (!userId) return
    
    const { count } = await supabase
      .from('pomodoro_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (count === 1) {
      await earnBadge('first_pomodoro')
    }
  }

  const savePomodoroLog = async () => {
    if (!userId) return
    
    const { error } = await supabase
      .from('pomodoro_logs')
      .insert([{ user_id: userId, started_at: new Date().toISOString() }])
    
    if (!error) {
      // Pomodoro başına 10 XP ekle
      await addXP(10)
      // İlk pomodoro rozeti kontrolü
      await checkFirstPomodoroBadge()
    }
  }
  // ================================================
  
  // Bildirim izni iste
  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotificationPermission(true)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationPermission(true)
        }
      })
    }
  }, [])
  
  // Ses çalma fonksiyonu
  const playBell = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 880
      gainNode.gain.value = 0.3
      
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1)
      oscillator.stop(audioContext.currentTime + 1)
    } catch(e) {
      console.log("Ses çalınamadı")
    }
  }
  
  // Bildirim gönder
  const sendNotification = (title, body) => {
    if (notificationPermission) {
      new Notification(title, { body, icon: '/favicon.svg' })
    }
    playBell()
  }
  
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getCurrentMaxSeconds = () => {
    const mode = MODES[currentModeKey]
    if (isWorkSession) {
      return mode.workMin * 60
    } else {
      return mode.breakMin * 60
    }
  }
  
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setIsRunning(false)
  }
  
  const handleSessionComplete = () => {
    const mode = MODES[currentModeKey]
    const sessionType = isWorkSession ? "ÇALIŞMA" : "MOLA"
    const durationMinutes = isWorkSession ? mode.workMin : mode.breakMin
    
    // *** ÇALIŞMA SEANSI BİTİNCE POMODORO LOG'U KAYDET VE XP EKLE ***
    if (isWorkSession) {
      savePomodoroLog()  // <--- BURASI ÇOK ÖNEMLİ! Pomodoro log'u kaydeder ve XP ekler
      
      sendNotification(
        "🍅 ÇALIŞMA TAMAMLANDI! 🎉",
        `${durationMinutes} dakika çalıştın! +10 XP kazandın! Şimdi ${mode.breakMin} dakika mola ver.`
      )
    } else {
      sendNotification(
        "🌿 MOLA BİTTİ! ⚡",
        `Mola tamamlandı! ${mode.workMin} dakikalık yeni çalışma seansına başlayabilirsin.`
      )
    }
    
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    setSessionsHistory(prev => {
      const newHistory = [...prev, {
        id: Date.now(),
        type: sessionType,
        durationMinutes: durationMinutes,
        endTimeStr: timeStr,
        modeInfo: mode.modeName
      }]
      return newHistory.slice(-50)
    })
    
    setIsWorkSession(prev => !prev)
    const newMaxSec = !isWorkSession ? mode.workMin * 60 : mode.breakMin * 60
    setTimerSeconds(newMaxSec)
    setIsRunning(false)
  }
  
  const startTimer = () => {
    if (timerIntervalRef.current) return
    if (timerSeconds <= 0) {
      handleSessionComplete()
      return
    }
    setIsRunning(true)
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          stopTimer()
          handleSessionComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const resetTimer = () => {
    stopTimer()
    const maxSec = getCurrentMaxSeconds()
    setTimerSeconds(maxSec)
    setIsRunning(false)
  }
  
  const skipSession = () => {
    stopTimer()
    const mode = MODES[currentModeKey]
    const sessionType = isWorkSession ? "ÇALIŞMA" : "MOLA"
    const durationMinutes = isWorkSession ? mode.workMin : mode.breakMin
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    setSessionsHistory(prev => [...prev, {
      id: Date.now(),
      type: sessionType + " (ATLANDI)",
      durationMinutes: durationMinutes,
      endTimeStr: timeStr,
      modeInfo: mode.modeName
    }].slice(-50))
    
    setIsWorkSession(prev => !prev)
    const newMaxSec = !isWorkSession ? mode.workMin * 60 : mode.breakMin * 60
    setTimerSeconds(newMaxSec)
    setIsRunning(false)
  }
  
  const deleteSession = (id) => {
    setSessionsHistory(prev => prev.filter(session => session.id !== id))
  }
  
  const clearAllSessions = () => {
    if (window.confirm(">_ TÜM SEANS KAYITLARI SİLİNSİN Mİ?")) {
      setSessionsHistory([])
    }
  }
  
  const changeMode = (modeKey) => {
    stopTimer()
    setCurrentModeKey(modeKey)
    setIsWorkSession(true)
    setTimerSeconds(MODES[modeKey].workMin * 60)
    setIsRunning(false)
  }
  
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])
  
  return (
    <div style={{
      background: currentTheme.bg,
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Courier New', 'VT323', monospace",
      imageRendering: 'pixelated',
      backgroundImage: `repeating-linear-gradient(0deg, ${currentTheme.border}0D 0px, ${currentTheme.border}0D 2px, transparent 2px, transparent 6px)`
    }}>
      <div style={{
        maxWidth: '750px',
        width: '100%',
        background: currentTheme.bgCard,
        border: `4px solid ${currentTheme.border}`,
        boxShadow: `0 0 0 2px ${currentTheme.bg}, 0 0 0 6px ${currentTheme.borderLight}, inset 0 0 20px ${currentTheme.border}30`,
        padding: '24px',
        imageRendering: 'pixelated'
      }}>
        
        {/* BAŞLIK */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          borderBottom: `2px solid ${currentTheme.border}`,
          paddingBottom: '12px'
        }}>
          <span style={{
            color: currentTheme.borderLight,
            fontSize: '0.7rem',
            letterSpacing: '4px',
            background: currentTheme.inputBg,
            padding: '4px 12px',
            display: 'inline-block'
          }}>
            █ P O M O D O R O   V 1.1 █
          </span>
          {notificationPermission && (
            <div style={{
              fontSize: '0.4rem',
              color: currentTheme.success,
              marginTop: '6px'
            }}>
              🔔 BİLDİRİMLER AÇIK
            </div>
          )}
        </div>
        
        {/* MOD SEÇİMİ */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          {Object.keys(MODES).map((key) => (
            <button
              key={key}
              onClick={() => changeMode(key)}
              style={{
                background: currentModeKey === key ? currentTheme.border : currentTheme.inputBg,
                border: `2px solid ${currentModeKey === key ? currentTheme.borderLight : currentTheme.textDim}`,
                color: currentModeKey === key ? currentTheme.bgCard : currentTheme.text,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                padding: '10px 20px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                boxShadow: currentModeKey === key ? `inset 0 0 5px ${currentTheme.border}30` : 'none'
              }}
            >
              {MODES[key].label}
            </button>
          ))}
        </div>
        
        {/* SAYAÇ */}
        <div style={{
          background: currentTheme.bg,
          border: `3px solid ${currentTheme.border}`,
          padding: '30px 20px',
          marginBottom: '24px',
          boxShadow: `inset 0 0 15px ${currentTheme.border}30, 0 5px 0 ${currentTheme.borderDark || currentTheme.border}`
        }}>
          <div style={{
            fontSize: '4.5rem',
            fontWeight: '900',
            textAlign: 'center',
            fontFamily: "'Courier New', 'VT323', monospace",
            letterSpacing: '8px',
            color: currentTheme.borderLight,
            textShadow: `0 0 5px ${currentTheme.border}, 0 0 10px ${currentTheme.border}`,
            background: '#010101',
            padding: '25px 10px',
            border: `1px solid ${currentTheme.border}`
          }}>
            {formatTime(timerSeconds)}
          </div>
          
          <div style={{
            marginTop: '16px',
            textAlign: 'center'
          }}>
            <span style={{
              background: currentTheme.inputBg,
              color: currentTheme.borderLight,
              padding: '6px 16px',
              fontSize: '0.7rem',
              letterSpacing: '3px',
              border: `1px solid ${currentTheme.border}`,
              display: 'inline-block'
            }}>
              {isWorkSession ? "⚔️ SAVAŞ MODU ⚔️" : "🍃 DİNLENME 🍃"}
            </span>
          </div>
          
          <div style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'center',
            gap: '4px'
          }}>
            {[...Array(isRunning ? 8 : 4)].map((_, i) => (
              <div key={i} style={{
                width: '6px',
                height: '6px',
                background: isRunning ? currentTheme.borderLight : currentTheme.textDim,
                opacity: isRunning ? 0.5 + Math.random() * 0.5 : 0.3,
                animation: isRunning ? 'pixelBlink 0.5s infinite' : 'none'
              }} />
            ))}
          </div>
        </div>
        
        {/* BUTONLAR */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { onClick: resetTimer, text: "⟳ SIFIRLA", color: '#8b5e3c', border: '#b87a4a' },
            { onClick: stopTimer, text: "⏸ DUR", color: '#8b3c3c', border: '#b84a4a' },
            { onClick: startTimer, text: "▶ BAŞLAT", color: currentTheme.border, border: currentTheme.borderLight },
            { onClick: skipSession, text: "⏩ ATLA", color: '#5e3c8b', border: '#8a4ab8' }
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              style={{
                background: btn.color,
                border: `2px solid ${btn.border}`,
                color: '#0a0c12',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                padding: '10px 24px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                boxShadow: `0 4px 0 ${currentTheme.border}`,
                transform: 'translateY(-2px)',
                transition: '0.05s linear'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            >
              {btn.text}
            </button>
          ))}
        </div>
        
        {/* SEANS GEÇMİŞİ */}
        <div style={{
          background: currentTheme.bg,
          border: `2px solid ${currentTheme.border}`,
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: `1px dashed ${currentTheme.border}`,
            paddingBottom: '8px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{
              color: currentTheme.borderLight,
              fontSize: '0.7rem',
              letterSpacing: '3px'
            }}>
              ╔═══════════[ SEANS KAYITLARI ]═══════════╗
            </div>
            
            {sessionsHistory.length > 0 && (
              <button
                onClick={clearAllSessions}
                style={{
                  background: '#3a1a1a',
                  border: '2px solid #8b3c3c',
                  color: '#ff6a6a',
                  fontFamily: 'monospace',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  letterSpacing: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>🗑</span> TÜMÜNÜ SİL
              </button>
            )}
          </div>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.7rem'
          }}>
            {sessionsHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: currentTheme.textDim,
                padding: '20px',
                fontStyle: 'italic'
              }}>
                _ SEANS BULUNMUYOR...
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: currentTheme.text
              }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${currentTheme.border}`, color: currentTheme.borderLight }}>
                    <th style={{ padding: '6px', textAlign: 'left', width: '40px' }}>#</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>TÜR</th>
                    <th style={{ padding: '6px', textAlign: 'left', width: '60px' }}>SÜRE</th>
                    <th style={{ padding: '6px', textAlign: 'left', width: '70px' }}>BİTİŞ</th>
                    <th style={{ padding: '6px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsHistory.slice().reverse().map((session, idx) => (
                    <tr key={session.id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                      <td style={{ padding: '6px' }}>{sessionsHistory.length - idx}</td>
                      <td style={{ padding: '6px' }}>{session.type}</td>
                      <td style={{ padding: '6px' }}>{session.durationMinutes}dk</td>
                      <td style={{ padding: '6px' }}>{session.endTimeStr}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteSession(session.id)}
                          style={{
                            background: '#2a1a1a',
                            border: '1px solid #8b3c3c',
                            color: '#ff6a6a',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#4a2a2a'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#2a1a1a'}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            borderTop: `1px dashed ${currentTheme.border}`,
            paddingTop: '8px'
          }}>
            <div style={{
              color: currentTheme.textDim,
              fontSize: '0.6rem'
            }}>
              TOPLAM SEANS: {sessionsHistory.length}
            </div>
            <div style={{
              color: currentTheme.textDim,
              fontSize: '0.5rem',
              letterSpacing: '1px'
            }}>
              [ ✕ = SEANS SIL ]
            </div>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: currentTheme.textDim,
          fontSize: '0.5rem',
          letterSpacing: '2px'
        }}>
          [ PIXEL STUDY v1.1 ] | [ PRESS START TO BEGIN ] | [ ✕ DELETE SESSION ]
        </div>
      </div>
      
      <style>{`
        @keyframes pixelBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        button {
          transition: 0.05s linear !important;
        }
        button:active {
          transform: translateY(2px) !important;
          box-shadow: 0 1px 0 ${currentTheme.border} !important;
        }
        ::-webkit-scrollbar {
          width: 8px;
          background: ${currentTheme.bg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${currentTheme.border};
          border: 1px solid ${currentTheme.borderLight};
        }
      `}</style>
    </div>
  )
}

export default PomodoroTimer