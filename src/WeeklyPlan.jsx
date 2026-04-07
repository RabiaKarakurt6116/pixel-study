import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'

const DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS', 'PAZ']
const FULL_DAYS = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR']
const COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e91e63']

const QUEST_MESSAGES = [
  "⚔️ YENİ GÖREVLER SENİ BEKLİYOR!",
  "🎯 HEDEFİNE ODAKLAN! +10 XP",
  "📜 BUGÜNKÜ GÖREVLERİ TAMAMLA!",
  "🏆 BAŞARILAR SENİNLE OLSUN!",
  "⭐ GÖREV TAMAMLAMA = +10 XP",
  "🔥 GÜNLÜK SERİNİ KORU!",
  "💪 HADİ BAŞLA, KAHRAMAN!"
]

const XP_LEVELS = [0, 100, 250, 500, 900, 1500]

function WeeklyPlan({ userId }) {
  const { currentTheme } = useTheme()
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState({})
  const [activeDay, setActiveDay] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [tempNote, setTempNote] = useState('')
  const [dailyXP, setDailyXP] = useState({})
  const [showXPAnim, setShowXPAnim] = useState(false)
  const [lastXPGain, setLastXPGain] = useState(0)

  useEffect(() => { 
    fetchTasks()
    fetchNotes()
    fetchDailyXP()
    checkAndArchive()
    addSampleTasksIfEmpty()
  }, [])

  // Örnek görev ekleme
  const addSampleTasksIfEmpty = async () => {
    const { data: existing } = await supabase
      .from('weekly_plan')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (existing && existing.length > 0) return
    
    const sampleTasks = [
      { day: 'PAZARTESİ', content: 'Sabah rutini tamamla' },
      { day: 'PAZARTESİ', content: 'En önemli görevi bitir' },
      { day: 'SALI', content: 'Proje planını güncelle' },
      { day: 'SALI', content: 'Takım toplantısına katıl' },
      { day: 'ÇARŞAMBA', content: 'Dökümantasyon yaz' },
      { day: 'ÇARŞAMBA', content: 'Kod review yap' },
      { day: 'PERŞEMBE', content: 'Testleri çalıştır' },
      { day: 'PERŞEMBE', content: 'Bug fix' },
      { day: 'CUMA', content: 'Haftalık rapor hazırla' },
      { day: 'CUMA', content: 'Hedefleri gözden geçir' },
      { day: 'CUMARTESİ', content: 'Öğrenme görevi' }
    ]
    
    for (const task of sampleTasks) {
      await supabase.from('weekly_plan').insert([{
        user_id: userId,
        day: task.day,
        content: task.content,
        is_done: false
      }])
    }
    
    await fetchTasks()
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('weekly_plan')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('fetchTasks hatası:', error)
      return
    }
    setTasks(data || [])
  }

  const checkAndArchive = async () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const isMonday = dayOfWeek === 1
    if (!isMonday) return
    
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const mondayStr = monday.toISOString().split('T')[0]
    
    const { data: currentTasks } = await supabase
      .from('weekly_plan')
      .select('*')
      .eq('user_id', userId)
    
    if (currentTasks && currentTasks.length > 0) {
      await supabase
        .from('weekly_archive')
        .delete()
        .eq('user_id', userId)
        .eq('week_start', mondayStr)
      
      const archiveData = currentTasks.map(task => ({
        user_id: userId,
        week_start: mondayStr,
        day: task.day,
        content: task.content,
        is_done: task.is_done
      }))
      
      await supabase.from('weekly_archive').insert(archiveData)
      await supabase.from('weekly_plan').delete().eq('user_id', userId)
      await fetchTasks()
    }
  }

  const fetchNotes = async () => {
    const { data } = await supabase.from('weekly_notes').select('*').eq('user_id', userId)
    if (data) {
      const notesMap = {}
      data.forEach(note => { notesMap[note.day] = note.content })
      setNotes(notesMap)
    }
  }

  const fetchDailyXP = async () => {
    const { data } = await supabase.from('daily_xp_log').select('*').eq('user_id', userId)
    if (data) {
      const xpMap = {}
      data.forEach(log => { xpMap[log.day] = log.xp_earned })
      setDailyXP(xpMap)
    }
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

  const checkFirstTaskBadge = async () => {
    if (!userId) return
    
    const { data: allTasks } = await supabase
      .from('weekly_plan')
      .select('is_done')
      .eq('user_id', userId)
    
    const completedCount = allTasks?.filter(t => t.is_done === true).length || 0
    
    if (completedCount >= 10) {
      await earnBadge('tasks_10')
    }
  }

  const addXP = async (amount, day) => {
    const { data: userData } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single()
    
    const newXP = (userData?.xp || 0) + amount
    const newLevel = XP_LEVELS.findIndex((threshold, i) => 
      newXP < (XP_LEVELS[i + 1] || 99999)
    ) + 1

    await supabase.from('users').update({ xp: newXP, level: newLevel }).eq('id', userId)
    
    if (newLevel >= 5) {
      await earnBadge('level_5')
    }

    const { data: existing } = await supabase
      .from('daily_xp_log')
      .select('*')
      .eq('user_id', userId)
      .eq('day', day)
      .single()

    if (existing) {
      await supabase
        .from('daily_xp_log')
        .update({ xp_earned: (existing.xp_earned || 0) + amount })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('daily_xp_log')
        .insert([{ user_id: userId, day, xp_earned: amount }])
    }
    
    await fetchDailyXP()
    
    setLastXPGain(amount)
    setShowXPAnim(true)
    setTimeout(() => setShowXPAnim(false), 1000)
  }

  const addTask = async () => {
    const day = FULL_DAYS[activeDay]
    const { data } = await supabase
      .from('weekly_plan')
      .insert([{ user_id: userId, day, content: '', is_done: false }])
      .select()
    if (data) {
      setTasks(prev => [...prev, data[0]])
      setEditingId(data[0].id)
      setEditingText('')
    }
  }

  const saveEdit = async (task) => {
    if (!editingText.trim()) {
      await supabase.from('weekly_plan').delete().eq('id', task.id)
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } else {
      const { data } = await supabase
        .from('weekly_plan')
        .update({ content: editingText })
        .eq('id', task.id)
        .select()
      if (data) setTasks(prev => prev.map(t => t.id === task.id ? data[0] : t))
    }
    setEditingId(null)
    setEditingText('')
  }

  const toggleTask = async (task) => {
    if (editingId === task.id) return
    
    const newDoneState = !task.is_done
    const { data } = await supabase
      .from('weekly_plan')
      .update({ is_done: newDoneState })
      .eq('id', task.id)
      .select()
    
    if (data) {
      setTasks(prev => prev.map(t => t.id === task.id ? data[0] : t))
      
      if (newDoneState && !task.is_done) {
        await addXP(10, FULL_DAYS[activeDay])
        await checkFirstTaskBadge()
      }
    }
  }

  const deleteTask = async (id) => {
    await supabase.from('weekly_plan').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const saveNote = async () => {
    if (!tempNote.trim()) return
    
    const day = FULL_DAYS[activeDay]
    const { data } = await supabase
      .from('weekly_notes')
      .upsert([{ user_id: userId, day, content: tempNote }])
      .select()
    
    if (data) {
      setNotes(prev => ({ ...prev, [day]: tempNote }))
      setShowNoteInput(false)
      setTempNote('')
    }
  }

  const deleteNote = async () => {
    const day = FULL_DAYS[activeDay]
    await supabase.from('weekly_notes').delete().eq('user_id', userId).eq('day', day)
    setNotes(prev => ({ ...prev, [day]: '' }))
    setShowNoteInput(false)
    setTempNote('')
  }

  const dayTasks = tasks.filter(t => t.day === FULL_DAYS[activeDay])
  const completedTasks = dayTasks.filter(t => t.is_done).length
  const totalTasks = dayTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const dayXP = dailyXP[FULL_DAYS[activeDay]] || 0
  const currentNote = notes[FULL_DAYS[activeDay]] || ''

  return (
    <>
      <style>{`
        @keyframes pixelBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes xpFloat {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
        }
        .wp-outer {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 90vh;
          padding: 20px;
          background: ${currentTheme.bg};
          background-image: repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 2px, transparent 2px, transparent 6px);
          position: relative;
        }
        .wp-outer::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px);
          pointer-events: none;
          z-index: 1;
        }
        .wp-book {
          display: flex;
          width: 100%;
          max-width: 720px;
          background: #7B4A1E;
          border: 4px solid #3d1f00;
          box-shadow: 8px 8px 0px #0a0a12, 0 0 0 2px ${currentTheme.accent};
          position: relative;
          image-rendering: crisp-edges;
          z-index: 2;
        }
        .wp-top-line { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: #A0652A; }
        .wp-left-line { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: #A0652A; }
        .wp-spiral {
          width: 32px;
          background: #5A3210;
          border-right: 3px solid #3d1f00;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-evenly;
          padding: 40px 0 10px;
          z-index: 1;
        }
        .wp-ring {
          width: 18px;
          height: 18px;
          background: #C0C0C0;
          border: 2px solid #888;
          image-rendering: crisp-edges;
          box-shadow: inset -1px -1px 0 #666, 2px 2px 0 #2a2a2a;
        }
        .wp-page-area { flex: 1; display: flex; flex-direction: column; }
        .wp-tabs {
          display: flex;
          background: #5A3210;
          border-bottom: 3px solid #3d1f00;
          padding-top: 8px;
        }
        .wp-tab {
          flex: 1;
          padding: 8px 2px;
          font-size: 0.35rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-align: center;
          cursor: pointer;
          color: #c49a6c;
          border-right: 2px solid #3d1f00;
          letter-spacing: 2px;
          transition: 0.05s linear;
        }
        .wp-tab:last-child { border-right: none; }
        .wp-tab.active {
          background: #fdfcf3;
          color: #3d1f00;
          border-bottom: 3px solid #fdfcf3;
          margin-bottom: -3px;
          box-shadow: inset 0 2px 0 ${COLORS[0]};
        }
        .wp-page {
          background: #fdfcf3;
          flex: 1;
          min-height: 520px;
          position: relative;
          padding: 10px 16px 10px 48px;
          background-image: repeating-linear-gradient(transparent, transparent 27px, #aad4f5 27px, #aad4f5 28px);
          image-rendering: crisp-edges;
        }
        .wp-day-header {
          font-size: 0.55rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          letter-spacing: 2px;
        }
        .wp-day-header span { display: inline-block; width: 8px; height: 8px; background: currentColor; margin-left: 8px; animation: pixelBlink 1s step-end infinite; }
        .wp-stats-panel {
          background: #e8e0c8;
          border: 2px solid #7B4A1E;
          padding: 8px 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          image-rendering: crisp-edges;
        }
        .wp-xp-box { background: #3d1f00; padding: 4px 12px; display: flex; align-items: center; gap: 6px; }
        .wp-xp-label { font-size: 0.3rem; color: ${currentTheme.accent}; font-family: 'Courier New', monospace; font-weight: bold; }
        .wp-xp-value { font-size: 0.55rem; color: ${currentTheme.accent}; font-family: 'Courier New', monospace; font-weight: bold; }
        .wp-progress-box { flex: 1; background: #c8b898; height: 12px; border: 1px solid #7B4A1E; }
        .wp-progress-fill { height: 100%; background: ${currentTheme.success}; width: 0%; transition: width 0.3s; box-shadow: inset 0 1px 0 #6effa0; }
        .wp-stats-text { font-size: 0.3rem; font-family: 'Courier New', monospace; font-weight: bold; color: #5A3210; }
        .wp-task-list { max-height: 280px; overflow-y: auto; }
        .wp-task-list::-webkit-scrollbar { width: 8px; background: #e8e6d8; }
        .wp-task-list::-webkit-scrollbar-thumb { background: #7B4A1E; border: 1px solid #3d1f00; }
        .wp-task-row { display: flex; align-items: center; gap: 10px; height: 28px; }
        .wp-check {
          width: 16px;
          height: 16px;
          border: 2px solid #3d1f00;
          flex-shrink: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: bold;
          background: #fdfcf3;
          image-rendering: crisp-edges;
          box-shadow: inset -1px -1px 0 #d0c8b0;
        }
        .wp-check.checked { background: ${currentTheme.success}; border-color: ${currentTheme.success}; color: #3d1f00; }
        .wp-task-text {
          font-size: 0.4rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          flex: 1;
          color: #2a1a0a;
          cursor: pointer;
          letter-spacing: 1px;
        }
        .wp-task-text.done { text-decoration: line-through; color: #aa9a7a; }
        .wp-xp-badge-small {
          font-size: 0.28rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: ${currentTheme.accent};
          background: #3d1f00;
          padding: 2px 6px;
          border-radius: 2px;
        }
        .wp-del {
          width: 22px;
          height: 22px;
          background: #3d1f00;
          border: 1px solid #7B4A1E;
          color: #ff8888;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
          opacity: 0;
          transition: 0.1s;
          flex-shrink: 0;
          image-rendering: crisp-edges;
        }
        .wp-task-row:hover .wp-del { opacity: 1; }
        .wp-del:hover { background: #5a2a0a; color: #ff4444; }
        .wp-input {
          font-family: 'Courier New', monospace;
          font-size: 0.4rem;
          font-weight: bold;
          background: #fff8e8;
          border: none;
          border-bottom: 2px solid #7B4A1E;
          color: #2a1a0a;
          outline: none;
          flex: 1;
          padding: 4px;
        }
        .wp-add-row { display: flex; align-items: center; gap: 10px; height: 28px; cursor: pointer; opacity: 0.6; transition: 0.1s; margin-top: 8px; }
        .wp-add-row:hover { opacity: 1; }
        .wp-add-icon { width: 16px; height: 16px; border: 2px dashed #aa9a7a; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #aa9a7a; flex-shrink: 0; }
        .wp-add-text { font-size: 0.35rem; color: #aa9a7a; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 2px; }
        .wp-note-area { margin-top: 20px; border-top: 2px dashed #7B4A1E; padding-top: 12px; }
        .wp-note-label { font-size: 0.35rem; font-family: 'Courier New', monospace; font-weight: bold; color: #5A3210; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .wp-note-content { background: #fff8e8; border: 1px solid #7B4A1E; padding: 8px; font-size: 0.35rem; font-family: 'Courier New', monospace; color: #2a1a0a; cursor: pointer; min-height: 50px; }
        .wp-note-empty { color: #aa9a7a; font-style: italic; }
        .wp-note-input { width: 100%; background: #fff8e8; border: 1px solid #7B4A1E; padding: 8px; font-size: 0.35rem; font-family: 'Courier New', monospace; resize: vertical; outline: none; }
        .wp-note-buttons { display: flex; gap: 8px; margin-top: 6px; }
        .wp-note-btn { background: #7B4A1E; border: 1px solid #3d1f00; color: #fdfcf3; padding: 4px 12px; font-size: 0.3rem; font-family: 'Courier New', monospace; font-weight: bold; cursor: pointer; }
        .wp-note-btn:hover { background: #5A3210; }
        .wp-quote { font-size: 0.28rem; color: #8a6a3a; text-align: center; margin-top: 12px; font-style: italic; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 1px; }
        .wp-bottom { height: 14px; background: #e8e6d8; border-top: 2px solid #d5d3c5; }
        .wp-bottom-dark { height: 6px; background: #5A3210; border-top: 2px solid #3d1f00; }
        .wp-xp-animation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Courier New', monospace;
          font-size: 1rem;
          font-weight: bold;
          color: ${currentTheme.accent};
          text-shadow: 2px 2px 0 #3d1f00;
          background: #3d1f00;
          padding: 12px 24px;
          border: 2px solid ${currentTheme.accent};
          z-index: 1000;
          animation: xpFloat 1s ease-out forwards;
          pointer-events: none;
          white-space: nowrap;
          image-rendering: crisp-edges;
        }
      `}</style>

      <div className="wp-outer">
        <div className="wp-book">
          <div className="wp-top-line" />
          <div className="wp-left-line" />

          <div className="wp-spiral">
            {Array(13).fill(0).map((_, i) => (
              <div key={i} className="wp-ring" />
            ))}
          </div>

          <div className="wp-page-area">
            <div className="wp-tabs">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={`wp-tab ${activeDay === i ? 'active' : ''}`}
                  onClick={() => setActiveDay(i)}
                  style={activeDay === i ? { boxShadow: `inset 0 2px 0 ${COLORS[i]}` } : {}}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="wp-page">
              <div className="wp-day-header" style={{ color: COLORS[activeDay] }}>
                {FULL_DAYS[activeDay]}
                <span />
              </div>

              <div className="wp-stats-panel">
                <div className="wp-xp-box">
                  <span className="wp-xp-label">⭐ GÜNLÜK XP</span>
                  <span className="wp-xp-value">{dayXP}</span>
                </div>
                <div className="wp-progress-box">
                  <div className="wp-progress-fill" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="wp-stats-text">
                  {completedTasks}/{totalTasks} GÖREV
                </div>
              </div>

              <div className="wp-task-list">
                {dayTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#aa9a7a', fontFamily: 'monospace', fontSize: '0.35rem' }}>
                    _ görev yok
                  </div>
                ) : (
                  dayTasks.map(task => (
                    <div key={task.id} className="wp-task-row">
                      <div
                        className={`wp-check ${task.is_done ? 'checked' : ''}`}
                        onClick={() => toggleTask(task)}
                      >
                        {task.is_done && '✓'}
                      </div>

                      {editingId === task.id ? (
                        <input
                          autoFocus
                          className="wp-input"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(task)}
                          onBlur={() => saveEdit(task)}
                        />
                      ) : (
                        <span
                          className={`wp-task-text ${task.is_done ? 'done' : ''}`}
                          onClick={() => { setEditingId(task.id); setEditingText(task.content) }}
                        >
                          {task.content || '_______'}
                        </span>
                      )}

                      <div className="wp-xp-badge-small">+10XP</div>
                      <div className="wp-del" onClick={() => deleteTask(task.id)}>✕</div>
                    </div>
                  ))
                )}
              </div>

              <div className="wp-add-row" onClick={addTask}>
                <div className="wp-add-icon">+</div>
                <div className="wp-add-text">GÖREV EKLE</div>
              </div>

              <div className="wp-note-area">
                <div className="wp-note-label">📝 GÜNLÜK NOTLAR</div>
                
                {showNoteInput ? (
                  <>
                    <textarea
                      className="wp-note-input"
                      rows="3"
                      placeholder="Bugün için notlarını buraya yaz..."
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      autoFocus
                    />
                    <div className="wp-note-buttons">
                      <button className="wp-note-btn" onClick={saveNote}>💾 KAYDET</button>
                      <button className="wp-note-btn" onClick={() => setShowNoteInput(false)}>✕ İPTAL</button>
                      {currentNote && (
                        <button className="wp-note-btn" onClick={deleteNote}>🗑 SİL</button>
                      )}
                    </div>
                  </>
                ) : (
                  <div 
                    className={`wp-note-content ${!currentNote ? 'wp-note-empty' : ''}`}
                    onClick={() => { setTempNote(currentNote); setShowNoteInput(true) }}
                  >
                    {currentNote || "_ Not eklemek için tıkla..."}
                  </div>
                )}
              </div>

              <div className="wp-quote">
                {QUEST_MESSAGES[activeDay % QUEST_MESSAGES.length]}
              </div>
            </div>

            <div className="wp-bottom" />
            <div className="wp-bottom-dark" />
          </div>
        </div>
      </div>

      {showXPAnim && (
        <div className="wp-xp-animation">
          +{lastXPGain} XP! ⭐
        </div>
      )}
    </>
  )
}

export default WeeklyPlan