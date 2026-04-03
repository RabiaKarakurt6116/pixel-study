// src/ExamCountdown.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'

function ExamCountdown({ userId }) {
  const { currentTheme } = useTheme()
  const [exams, setExams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [timeLeft, setTimeLeft] = useState({})

  useEffect(() => { fetchExams() }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (exams.length > 0) {
        const nearest = getNearestExam()
        if (nearest) setTimeLeft(calcTimeLeft(nearest.exam_date))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [exams])

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .order('exam_date', { ascending: true })
    if (data) setExams(data)
  }

  const addExam = async () => {
    if (!examName.trim() || !examDate) return
    const { data } = await supabase
      .from('exams')
      .insert([{ user_id: userId, name: examName, exam_date: examDate }])
      .select()
    if (data) {
      setExams(prev => [...prev, data[0]].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)))
      setExamName('')
      setExamDate('')
      setShowForm(false)
    }
  }

  const deleteExam = async (id) => {
    await supabase.from('exams').delete().eq('id', id)
    setExams(prev => prev.filter(e => e.id !== id))
  }

  const getNearestExam = () => {
    const future = exams.filter(e => new Date(e.exam_date) > new Date())
    return future.length > 0 ? future[0] : null
  }

  const calcTimeLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    }
  }

  const nearest = getNearestExam()
  const pad = (n) => String(n).padStart(2, '0')

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    return Math.max(0, Math.floor(diff / 86400000))
  }

  const COLORS = ['#4a90e2', '#3498db', '#5dade2', '#2ecc71', '#9b59b6', '#e67e22']

  return (
    <>
      <style>{`
        @keyframes pixelBlink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        .ec-outer {
          background: ${currentTheme.bg};
          min-height: 90vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-image: repeating-linear-gradient(0deg, ${currentTheme.border}08 0px, ${currentTheme.border}08 2px, transparent 2px, transparent 6px);
        }
        .ec-title {
          font-size: 0.7rem;
          color: ${currentTheme.accent};
          margin-bottom: 20px;
          font-family: 'Courier New', monospace;
          letter-spacing: 4px;
          background: ${currentTheme.bgCard};
          padding: 8px 20px;
          border: 2px solid ${currentTheme.border};
          text-transform: uppercase;
        }
        .ec-name-box {
          background: ${currentTheme.bg};
          border: 2px solid ${currentTheme.border};
          color: ${currentTheme.accent};
          font-family: 'Courier New', monospace;
          font-size: 0.6rem;
          padding: 10px 20px;
          margin-bottom: 20px;
          text-align: center;
          letter-spacing: 2px;
          text-transform: uppercase;
          box-shadow: inset 0 0 10px ${currentTheme.border}20;
        }
        .ec-counter-wrap {
          position: relative;
          width: 280px;
          height: 280px;
          margin-bottom: 24px;
        }
        .ec-counter-outer {
          position: absolute;
          inset: 0;
          background: ${currentTheme.bg};
          border: 3px solid ${currentTheme.border};
          box-shadow: 0 0 0 2px ${currentTheme.bg}, inset 0 0 20px ${currentTheme.border}20;
        }
        .ec-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          background: ${currentTheme.bg};
          border: 1px solid ${currentTheme.border};
        }
        .ec-counter-inner {
          position: absolute;
          inset: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .ec-days {
          font-size: 4rem;
          color: ${currentTheme.accent};
          font-family: 'Courier New', monospace;
          font-weight: bold;
          line-height: 1;
          text-shadow: 0 0 5px ${currentTheme.border};
        }
        .ec-days-label {
          font-size: 0.4rem;
          color: ${currentTheme.textDim};
          font-family: 'Courier New', monospace;
          letter-spacing: 3px;
        }
        .ec-hms {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .ec-hms-block {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ec-hms-num {
          font-size: 0.8rem;
          color: ${currentTheme.accent};
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        .ec-hms-label {
          font-size: 0.25rem;
          color: ${currentTheme.textDim};
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }
        .ec-colon {
          font-size: 0.8rem;
          color: ${currentTheme.border};
          font-family: 'Courier New', monospace;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .ec-add-btn {
          font-family: 'Courier New', monospace;
          font-size: 0.55rem;
          font-weight: bold;
          background: ${currentTheme.border};
          color: ${currentTheme.bgCard};
          border: 2px solid ${currentTheme.accent};
          padding: 10px 24px;
          cursor: pointer;
          letter-spacing: 3px;
          text-transform: uppercase;
          box-shadow: 0 4px 0 ${currentTheme.borderDark || currentTheme.bg};
          transform: translateY(-2px);
          transition: 0.05s linear;
          margin-bottom: 20px;
        }
        .ec-add-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 ${currentTheme.borderDark || currentTheme.bg};
        }
        .ec-form {
          background: ${currentTheme.bgCard};
          border: 2px solid ${currentTheme.border};
          padding: 20px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 0 0 1px ${currentTheme.border}40;
        }
        .ec-input {
          background: ${currentTheme.bg};
          border: 1px solid ${currentTheme.border};
          color: ${currentTheme.accent};
          font-family: 'Courier New', monospace;
          font-size: 0.5rem;
          padding: 10px;
          outline: none;
          letter-spacing: 1px;
        }
        .ec-input:focus {
          border-color: ${currentTheme.accent};
          box-shadow: 0 0 5px ${currentTheme.accent}50;
        }
        .ec-list {
          width: 100%;
          max-width: 550px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ec-list-title {
          font-size: 0.45rem;
          color: ${currentTheme.textDim};
          font-family: 'Courier New', monospace;
          letter-spacing: 3px;
          margin-bottom: 8px;
          border-left: 3px solid ${currentTheme.border};
          padding-left: 10px;
        }
        .ec-exam-row {
          display: flex;
          align-items: center;
          background: ${currentTheme.bgCard};
          border: 1px solid ${currentTheme.border}80;
          padding: 8px 12px;
          gap: 12px;
          transition: 0.1s;
        }
        .ec-exam-row:hover {
          border-color: ${currentTheme.border};
          background: ${currentTheme.hover};
        }
        .ec-exam-dot {
          width: 8px;
          height: 24px;
          flex-shrink: 0;
        }
        .ec-exam-name {
          font-size: 0.45rem;
          color: ${currentTheme.text};
          font-family: 'Courier New', monospace;
          flex: 1;
          letter-spacing: 1px;
        }
        .ec-exam-days {
          font-size: 0.45rem;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          background: ${currentTheme.bg};
          padding: 4px 8px;
        }
        .ec-del {
          font-size: 0.9rem;
          color: ${currentTheme.accent2};
          cursor: pointer;
          opacity: 0;
          transition: 0.1s;
          font-weight: bold;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${currentTheme.bg};
          border: 1px solid ${currentTheme.accent2}80;
        }
        .ec-exam-row:hover .ec-del { opacity: 1; }
        .ec-del:hover {
          background: ${currentTheme.accent2}40;
          border-color: ${currentTheme.accent2};
        }
        .ec-empty {
          font-size: 0.5rem;
          color: ${currentTheme.textDim};
          font-family: 'Courier New', monospace;
          text-align: center;
          padding: 40px;
          font-style: italic;
        }
        .ec-pixel-blink {
          animation: pixelBlink 1s infinite;
        }
      `}</style>

      <div className="ec-outer">
        <div className="ec-title">
          ╔══[ SINAV SAYACI ]══╗
        </div>

        {nearest ? (
          <>
            <div className="ec-name-box">
              {nearest.name} <span className="ec-pixel-blink">_</span>
            </div>
            
            <div className="ec-counter-wrap">
              <div className="ec-counter-outer" />
              <div className="ec-corner" style={{ top: -2, left: -2 }} />
              <div className="ec-corner" style={{ top: -2, right: -2 }} />
              <div className="ec-corner" style={{ bottom: -2, left: -2 }} />
              <div className="ec-corner" style={{ bottom: -2, right: -2 }} />
              <div className="ec-counter-inner">
                <div className="ec-days">{pad(timeLeft.days ?? 0)}</div>
                <div className="ec-days-label">[ GÜN KALDI ]</div>
                <div className="ec-hms">
                  <div className="ec-hms-block">
                    <div className="ec-hms-num">{pad(timeLeft.hours ?? 0)}</div>
                    <div className="ec-hms-label">SAAT</div>
                  </div>
                  <div className="ec-colon">:</div>
                  <div className="ec-hms-block">
                    <div className="ec-hms-num">{pad(timeLeft.minutes ?? 0)}</div>
                    <div className="ec-hms-label">DAK</div>
                  </div>
                  <div className="ec-colon">:</div>
                  <div className="ec-hms-block">
                    <div className="ec-hms-num">{pad(timeLeft.seconds ?? 0)}</div>
                    <div className="ec-hms-label">SAN</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="ec-empty">
            _ SINAV BULUNMUYOR...
          </div>
        )}

        <button className="ec-add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "[ X ] İPTAL" : "[ + ] SINAV EKLE"}
        </button>

        {showForm && (
          <div className="ec-form">
            <input
              className="ec-input"
              placeholder=">_ SINAV ADI..."
              value={examName}
              onChange={e => setExamName(e.target.value)}
            />
            <input
              className="ec-input"
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            <button className="ec-add-btn" style={{ margin: 0 }} onClick={addExam}>
              [ ✓ ] KAYDET
            </button>
          </div>
        )}

        {exams.length > 0 && (
          <div className="ec-list">
            <div className="ec-list-title">
              ╚════[ YAKLAŞAN SINAVLAR ]════╝
            </div>
            {exams.map((exam, i) => {
              const days = getDaysUntil(exam.exam_date)
              const color = COLORS[i % COLORS.length]
              return (
                <div key={exam.id} className="ec-exam-row">
                  <div className="ec-exam-dot" style={{ background: color }} />
                  <span className="ec-exam-name">{exam.name}</span>
                  <span className="ec-exam-days" style={{ color }}>{days} GÜN</span>
                  <span className="ec-del" onClick={() => deleteExam(exam.id)}>✕</span>
                </div>
              )
            })}
          </div>
        )}
        
        <div style={{
          marginTop: '20px',
          color: currentTheme.textDim,
          fontSize: '0.4rem',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          [ PIXEL STUDY v1.0 ] | [ SINAV SAYACI ]
        </div>
      </div>
    </>
  )
}

export default ExamCountdown