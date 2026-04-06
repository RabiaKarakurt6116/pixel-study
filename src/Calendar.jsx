// src/Calendar.jsx (TEMALI VERSİYON)
if (typeof window !== 'undefined' && !('Notification' in window)) {
  window.Notification = { permission: 'denied', requestPermission: async () => 'denied' }
}
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'

function Calendar({ userId }) {
  const { currentTheme } = useTheme()
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('exam')
  const [eventNote, setEventNote] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderSent, setReminderSent] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(false)

  useEffect(() => {
    fetchEvents()
    checkNotificationPermission()
    const interval = setInterval(checkReminders, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (events.length > 0) {
      checkReminders()
    }
  }, [events])

  const checkNotificationPermission = () => {
  try {
    if (typeof Notification !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission === 'granted')
    }
  } catch(e) {
    console.log('Bildirimler desteklenmiyor')
  }
}

 const requestNotificationPermission = async () => {
  try {
    if (typeof Notification !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission === 'granted')
    }
  } catch(e) {
    console.log('Bildirimler desteklenmiyor')
  }
}

  const showNotification = (title, body) => {
  try {
    if (notificationPermission && typeof Notification !== 'undefined') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  } catch(e) {
    console.log('Bildirim gönderilemedi')
  }
}

  const checkReminders = () => {
    const now = new Date()
    
    events.forEach(event => {
      const eventDateTime = new Date(event.event_date)
      const diffHours = (eventDateTime - now) / (1000 * 60 * 60)
      
      if (!reminderSent[event.id] && event.reminder_enabled && diffHours <= 24 && diffHours > 0) {
        sendReminder(event)
        setReminderSent(prev => ({ ...prev, [event.id]: true }))
        
        supabase
          .from('events')
          .update({ reminder_sent: true })
          .eq('id', event.id)
          .then()
      }
    })
  }

  const sendReminder = (event) => {
    const typeText = {
      exam: '📚 Sınav',
      homework: '📝 Ödev',
      other: '⭐ Diğer'
    }
    
    showNotification(
      `${typeText[event.type]} Hatırlatıcısı!`,
      `${event.title} - ${new Date(event.event_date).toLocaleDateString('tr-TR')}`
    )
    
    console.log(`🔔 HATIRLATICI: ${event.title} (${event.event_date})`)
  }

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  const addEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return
    
    const { data } = await supabase
      .from('events')
      .insert([{ 
        user_id: userId, 
        title: eventTitle,
        event_date: eventDate,
        type: eventType,
        note: eventNote,
        reminder_enabled: reminderEnabled,
        reminder_sent: false
      }])
      .select()
    
    if (data) {
      setEvents(prev => [...prev, data[0]].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
      resetForm()
      setShowForm(false)
    }
  }

  const resetForm = () => {
    setEventTitle('')
    setEventDate('')
    setEventType('exam')
    setEventNote('')
    setReminderEnabled(false)
  }

  const deleteEvent = async (id) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const getEventsByDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const today = new Date()
    
    const days = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-empty-day"></div>)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayEvents = getEventsByDate(date)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      
      days.push(
        <div 
          key={day} 
          className={`cal-day ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="cal-day-number">{day}</div>
          <div className="cal-day-events">
            {dayEvents.slice(0, 2).map(event => (
              <div key={event.id} className={`cal-event-dot cal-event-${event.type}`} title={event.title} />
            ))}
            {dayEvents.length > 2 && <div className="cal-event-more">+{dayEvents.length - 2}</div>}
          </div>
        </div>
      )
    }
    
    return days
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'exam': return '📚'
      case 'homework': return '📝'
      default: return '⭐'
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'exam': return '#e74c3c'
      case 'homework': return '#f39c12'
      default: return currentTheme.border
    }
  }

  return (
    <>
      <style>{`
        .cal-container {
          background: ${currentTheme.bg};
          min-height: 90vh;
          padding: 20px;
          font-family: 'Courier New', monospace;
        }
        
        .cal-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .cal-title {
          font-size: 0.7rem;
          color: ${currentTheme.accent};
          background: ${currentTheme.bgCard};
          border: 2px solid ${currentTheme.accent};
          padding: 8px 20px;
          display: inline-block;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        
        .cal-month-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${currentTheme.bgCard};
          border: 1px solid ${currentTheme.accent};
          padding: 10px 20px;
          margin-bottom: 20px;
        }
        
        .cal-month-nav button {
          background: ${currentTheme.accent};
          border: none;
          color: ${currentTheme.bg};
          font-size: 0.5rem;
          padding: 5px 15px;
          cursor: pointer;
          font-family: monospace;
          font-weight: bold;
        }
        
        .cal-month-year {
          color: ${currentTheme.accent};
          font-size: 0.55rem;
          letter-spacing: 2px;
        }
        
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background: ${currentTheme.bgCard};
          padding: 2px;
          margin-bottom: 20px;
        }
        
        .cal-weekday {
          background: ${currentTheme.bg};
          color: ${currentTheme.accent};
          font-size: 0.4rem;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .cal-day {
          background: ${currentTheme.bg};
          min-height: 80px;
          padding: 5px;
          cursor: pointer;
          transition: 0.1s;
          border: 1px solid ${currentTheme.bgCard};
        }
        
        .cal-day:hover {
          background: ${currentTheme.hover};
          border-color: ${currentTheme.accent};
        }
        
        .cal-today {
          background: ${currentTheme.bgCard};
          border: 2px solid ${currentTheme.accent};
        }
        
        .cal-selected {
          background: ${currentTheme.hover};
          border-color: ${currentTheme.accent};
        }
        
        .cal-day-number {
          color: ${currentTheme.accent};
          font-size: 0.45rem;
          margin-bottom: 4px;
        }
        
        .cal-today .cal-day-number {
          color: ${currentTheme.accent};
          font-weight: bold;
        }
        
        .cal-day-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .cal-event-dot {
          width: 100%;
          height: 3px;
          margin: 1px 0;
        }
        
        .cal-event-exam { background: #e74c3c; }
        .cal-event-homework { background: #f39c12; }
        .cal-event-other { background: ${currentTheme.border}; }
        
        .cal-event-more {
          font-size: 0.3rem;
          color: ${currentTheme.accent};
          text-align: center;
        }
        
        .cal-sidebar {
          background: ${currentTheme.bgCard};
          border: 1px solid ${currentTheme.accent};
          padding: 15px;
          margin-top: 20px;
        }
        
        .cal-sidebar-title {
          color: ${currentTheme.accent};
          font-size: 0.5rem;
          letter-spacing: 2px;
          margin-bottom: 10px;
          border-left: 3px solid ${currentTheme.accent};
          padding-left: 10px;
        }
        
        .cal-event-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .cal-event-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: ${currentTheme.bg};
          padding: 8px;
          border-left: 3px solid;
        }
        
        .cal-event-icon {
          font-size: 0.5rem;
        }
        
        .cal-event-info {
          flex: 1;
        }
        
        .cal-event-title {
          color: ${currentTheme.accent};
          font-size: 0.45rem;
          font-weight: bold;
        }
        
        .cal-event-date {
          color: ${currentTheme.accent};
          font-size: 0.35rem;
        }
        
        .cal-event-note {
          color: ${currentTheme.accent};
          font-size: 0.35rem;
          font-style: italic;
        }
        
        .cal-delete-btn {
          color: ${currentTheme.accent2};
          cursor: pointer;
          font-size: 0.5rem;
          padding: 0 5px;
        }
        
        .cal-add-btn {
          font-family: 'Courier New', monospace;
          font-size: 0.55rem;
          font-weight: bold;
          background: ${currentTheme.accent};
          color: ${currentTheme.bg};
          border: 2px solid ${currentTheme.accent};
          padding: 10px 24px;
          cursor: pointer;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 15px;
          width: 100%;
        }
        
        .cal-form {
          background: ${currentTheme.bgCard};
          border: 2px solid ${currentTheme.accent};
          padding: 20px;
          margin-top: 15px;
        }
        
        .cal-input, .cal-select, .cal-textarea {
          background: ${currentTheme.bg};
          border: 1px solid ${currentTheme.accent};
          color: ${currentTheme.accent};
          font-family: monospace;
          font-size: 0.45rem;
          padding: 8px;
          margin-bottom: 10px;
          width: 100%;
        }
        
        .cal-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 10px 0;
          color: ${currentTheme.accent};
          font-size: 0.4rem;
        }
        
        .cal-notif-btn {
          background: ${currentTheme.bgCard};
          color: ${currentTheme.accent};
          border: 1px solid ${currentTheme.accent};
          padding: 5px 10px;
          font-size: 0.35rem;
          cursor: pointer;
          margin-bottom: 10px;
        }
        
        .cal-empty {
          text-align: center;
          color: ${currentTheme.accent};
          font-size: 0.4rem;
          padding: 20px;
          font-style: italic;
        }
        
        .cal-empty-day {
          background: ${currentTheme.bg};
          min-height: 80px;
          border: 1px solid ${currentTheme.bgCard};
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

      <div className="cal-container">
        <div className="cal-header">
          <div className="cal-title">╔══[ TAKVİM ]══╗</div>
        </div>

        {!notificationPermission && (
          <button className="cal-notif-btn" onClick={requestNotificationPermission}>
            🔔 BİLDİRİMLERİ AKTİF ET
          </button>
        )}

        <div className="cal-month-nav">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            ◀
          </button>
          <div className="cal-month-year">
            {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            ▶
          </button>
        </div>

        <div className="cal-grid">
          {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map(day => (
            <div key={day} className="cal-weekday">{day}</div>
          ))}
          {renderCalendar()}
        </div>

        {selectedDate && (
          <div className="cal-sidebar">
            <div className="cal-sidebar-title">
              {selectedDate.toLocaleDateString('tr-TR')} - ETKİNLİKLER
            </div>
            <div className="cal-event-list">
              {getEventsByDate(selectedDate).length > 0 ? (
                getEventsByDate(selectedDate).map(event => (
                  <div key={event.id} className="cal-event-item" style={{ borderLeftColor: getTypeColor(event.type) }}>
                    <div className="cal-event-icon">{getTypeIcon(event.type)}</div>
                    <div className="cal-event-info">
                      <div className="cal-event-title">{event.title}</div>
                      <div className="cal-event-date">
                        {new Date(event.event_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.note && <div className="cal-event-note">{event.note}</div>}
                    </div>
                    <div className="cal-delete-btn" onClick={() => deleteEvent(event.id)}>✕</div>
                  </div>
                ))
              ) : (
                <div className="cal-empty">ETKİNLİK YOK</div>
              )}
            </div>
          </div>
        )}

        <button className="cal-add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "[ X ] İPTAL" : "[ + ] ETKİNLİK EKLE"}
        </button>

        {showForm && (
          <div className="cal-form">
            <input
              className="cal-input"
              placeholder="BAŞLIK..."
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
            />
            <input
              className="cal-input"
              type="datetime-local"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
            />
            <select className="cal-select" value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="exam">📚 SINAV</option>
              <option value="homework">📝 ÖDEV</option>
              <option value="other">⭐ DİĞER</option>
            </select>
            <textarea
              className="cal-textarea"
              placeholder="NOT (OPSİYONEL)..."
              rows="2"
              value={eventNote}
              onChange={e => setEventNote(e.target.value)}
            />
            <div className="cal-checkbox">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={e => setReminderEnabled(e.target.checked)}
              />
              <span>🔔 24 SAAT ÖNCE HATIRLATICI GÖNDER</span>
            </div>
            <button className="cal-add-btn" style={{ marginTop: 0 }} onClick={addEvent}>
              [ ✓ ] KAYDET
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Calendar