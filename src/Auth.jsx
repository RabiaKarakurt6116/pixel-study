// src/Auth.jsx
import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useTheme } from './ThemeContext'

function Auth({ onLogin }) {
  const { currentTheme } = useTheme()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    
    if (isLogin) {
      // GİRİŞ YAP
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) {
        setMessage(error.message)
        setLoading(false)
      } else {
        setMessage('Giriş başarılı! Yönlendiriliyorsunuz...')
        setTimeout(() => {
          onLogin(data.user.id)
        }, 500)
      }
    } else {
      // KAYIT OL
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username
          }
        }
      })
      
      if (error) {
        setMessage(error.message)
        setLoading(false)
      } else {
        setMessage('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
        setTimeout(() => {
          setIsLogin(true)
          setUsername('')
          setPassword('')
          setEmail('')
          setMessage('')
        }, 2000)
        setLoading(false)
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: currentTheme.bg,
      fontFamily: 'monospace'
    }}>
      
      <div style={{
        backgroundColor: currentTheme.bgCard,
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '40px',
        width: '400px',
        border: `2px solid ${currentTheme.border}`,
        boxShadow: `0 0 30px ${currentTheme.borderLight}`
      }}>
        
        <h2 style={{
          textAlign: 'center',
          color: currentTheme.accent,
          fontSize: '20px',
          marginBottom: '30px',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          PLAYER LOGIN
        </h2>
        
        {/* Giriş/Kayıt butonları */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px',
          gap: '20px'
        }}>
          <button
            onClick={() => {
              setIsLogin(true)
              setMessage('')
            }}
            style={{
              padding: '8px 24px',
              backgroundColor: isLogin ? currentTheme.border : 'transparent',
              color: currentTheme.text,
              border: `1px solid ${isLogin ? currentTheme.border : currentTheme.textDim}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          >
            GİRİŞ YAP
          </button>
          
          <button
            onClick={() => {
              setIsLogin(false)
              setMessage('')
            }}
            style={{
              padding: '8px 24px',
              backgroundColor: !isLogin ? currentTheme.border : 'transparent',
              color: currentTheme.text,
              border: `1px solid ${!isLogin ? currentTheme.border : currentTheme.textDim}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          >
            KAYIT OL
          </button>
        </div>
        
        {/* Kayıt olunduysa kullanıcı adı alanı */}
        {!isLogin && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="KULLANICI ADI..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: currentTheme.inputBg,
                border: `1px solid ${currentTheme.border}`,
                color: currentTheme.text,
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
          </div>
        )}
        
        {/* E-POSTA inputu */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="E-POSTA..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
        </div>
        
        {/* ŞİFRE inputu */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="ŞİFRE..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: currentTheme.inputBg,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Ana buton */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? currentTheme.textDim : currentTheme.border,
            color: currentTheme.bgCard,
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace',
            marginTop: '10px',
            marginBottom: '20px',
            transition: '0.1s linear'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = currentTheme.borderLight
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = currentTheme.border
          }}
        >
          {loading ? 'İŞLEM YAPILIYOR...' : (isLogin ? 'GİRİŞ YAP' : 'KAYIT OL')}
        </button>
        
        {/* Alt yazı */}
        <div style={{
          textAlign: 'center',
          color: currentTheme.textDim,
          fontSize: '10px',
          fontFamily: 'monospace',
          borderTop: `1px solid ${currentTheme.textDim}`,
          paddingTop: '15px'
        }}>
          Hazırlayan yön: m2 / Kayıt: 0
        </div>
        
        {/* Mesaj */}
        {message && (
          <p style={{
            textAlign: 'center',
            color: message.includes('başarılı') || message.includes('Giriş başarılı') ? currentTheme.success : currentTheme.accent2,
            fontSize: '11px',
            marginTop: '15px',
            fontFamily: 'monospace',
            backgroundColor: currentTheme.inputBg,
            padding: '8px',
            borderRadius: '8px'
          }}>
            {message}
          </p>
        )}
        
      </div>
    </div>
  )
}

export default Auth