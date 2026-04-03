// src/Home.jsx
import { useEffect, useRef, useState } from 'react'
import { useTheme } from './ThemeContext'

export default function Home({ onStartGame }) {
  const { currentTheme } = useTheme()
  const canvasRef = useRef(null)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(prev => !prev)
    }, 500)
    return () => clearInterval(blinkInterval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    let animationId
    let legMove = 0
    let time = 0
    let eyeBlink = 0
    
    // Koşan ahtapot
    let octopusX = 80
    let direction = 1
    
    // Pixel bulutlar
    const clouds = [
      { x: 100, y: 50, w: 50, h: 25, speed: 0.15 },
      { x: 350, y: 30, w: 60, h: 30, speed: 0.1 },
      { x: 600, y: 60, w: 45, h: 22, speed: 0.12 },
      { x: 750, y: 40, w: 55, h: 28, speed: 0.18 }
    ]
    
    // Hareketli bloklar
    const blocks = [
      { x: 200, y: 320, w: 32, h: 32, originalY: 320, speed: 0.4, range: 15 },
      { x: 380, y: 300, w: 32, h: 32, originalY: 300, speed: 0.35, range: 20 },
      { x: 560, y: 320, w: 32, h: 32, originalY: 320, speed: 0.45, range: 12 },
      { x: 700, y: 290, w: 32, h: 32, originalY: 290, speed: 0.38, range: 22 }
    ]
    
    // Kare yıldızlar
    const stars = []
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 350,
        baseSize: Math.random() * 4 + 2,
        twinkleSpeed: Math.random() * 0.015 + 0.008,
        phase: Math.random() * Math.PI * 2
      })
    }
    
    function drawPixelCloud(x, y, w, h) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.fillRect(x, y, w, h)
      ctx.fillRect(x - 15, y + 8, 20, 12)
      ctx.fillRect(x + w - 5, y + 8, 20, 12)
      ctx.fillRect(x + 10, y - 10, 25, 12)
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
    }
    
    function drawCuteOctopus(x, y, legAnimation, eyeBlinkFrame) {
      // Göz kırpma (zaman zaman)
      const isBlinking = Math.sin(eyeBlinkFrame * 0.05) > 0.95
      
      // Gövde (yumuşak mor)
      ctx.fillStyle = '#9b59b6'
      ctx.fillRect(x + 3, y + 10, 26, 20)
      
      // Kafa (DAHA BÜYÜK)
      ctx.fillStyle = '#af7ac5'
      ctx.fillRect(x, y, 32, 18)
      
      // Kafanın üstü yuvarlak (sevimli)
      ctx.fillStyle = '#c39bd3'
      ctx.fillRect(x + 2, y - 3, 28, 6)
      
      // Yanaklar (pembe)
      ctx.fillStyle = '#ffb6c1'
      ctx.fillRect(x + 3, y + 10, 5, 3)
      ctx.fillRect(x + 24, y + 10, 5, 3)
      
      // BÜYÜK PARLAK GÖZLER
      // Göz beyazları (büyük)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 5, y + 5, 9, 9)
      ctx.fillRect(x + 18, y + 5, 9, 9)
      
      // Göz bebekleri (büyük, parlak)
      ctx.fillStyle = '#2c3e50'
      ctx.fillRect(x + 7, y + 7, 5, 5)
      ctx.fillRect(x + 20, y + 7, 5, 5)
      
      // Işık parlaması (pırıltı)
      ctx.fillStyle = '#ffffff'
      if (!isBlinking) {
        ctx.fillRect(x + 6, y + 6, 2, 2)
        ctx.fillRect(x + 19, y + 6, 2, 2)
      }
      
      // Göz altı ışıltısı
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillRect(x + 5, y + 11, 9, 1)
      ctx.fillRect(x + 18, y + 11, 9, 1)
      
      // AĞIZ YOK (sadece sevimli yanaklar)
      
      // Bacaklar (kısa ve sevimli)
      ctx.fillStyle = '#8e44ad'
      const offset = Math.sin(legAnimation) * 2
      
      ctx.fillRect(x + 2, y + 24 + offset * 0.3, 5, 8)
      ctx.fillRect(x + 8, y + 26 + offset, 4, 7)
      ctx.fillRect(x + 14, y + 25 + offset * 0.7, 4, 7)
      ctx.fillRect(x + 20, y + 26 + offset, 4, 7)
      ctx.fillRect(x + 26, y + 24 + offset * 0.3, 5, 8)
      
      // Küçük şapka (şirin)
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(x + 10, y - 5, 12, 4)
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(x + 13, y - 7, 6, 3)
    }
    
    function draw() {
      time++
      eyeBlink = time
      
      // Arkaplan (tema rengine göre değil, canvas kendi siyahını kullanıyor - oyun hissi için)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 800, 400)
      
      // Kare yıldızlar
      stars.forEach(star => {
        const sizeFactor = 0.5 + Math.sin(time * star.twinkleSpeed * 8 + star.phase) * 0.3
        const currentSize = Math.max(1, star.baseSize * sizeFactor)
        const brightness = 0.4 + Math.sin(time * star.twinkleSpeed * 10 + star.phase) * 0.4
        ctx.fillStyle = `rgba(255, 240, 150, ${brightness})`
        ctx.fillRect(star.x, star.y, currentSize, currentSize)
      })
      
      // Pixel bulutlar
      clouds.forEach(cloud => {
        drawPixelCloud(cloud.x, cloud.y, cloud.w, cloud.h)
        cloud.x += cloud.speed
        if (cloud.x > 850) cloud.x = -100
      })
      
      // Zemin
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 350, 800, 50)
      
      ctx.fillStyle = '#2a2a3e'
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 40, 358, 20, 4)
      }
      
      // Hareketli bloklar
      blocks.forEach(block => {
        block.y = block.originalY + Math.sin(time * 0.03 * block.speed) * block.range
        
        ctx.fillStyle = '#b87c4f'
        ctx.fillRect(block.x, block.y, block.w, block.h)
        ctx.fillStyle = '#8b5a2b'
        ctx.fillRect(block.x + 6, block.y + 6, 6, 6)
        ctx.fillRect(block.x + 20, block.y + 6, 6, 6)
        ctx.fillRect(block.x + 6, block.y + 20, 6, 6)
        ctx.fillRect(block.x + 20, block.y + 20, 6, 6)
        
        ctx.fillStyle = '#d4af37'
        ctx.fillRect(block.x + 2, block.y + 2, 28, 3)
      })
      
      // Koşan sevimli ahtapot
      octopusX += direction * 0.8
      if (octopusX > 700) direction = -1
      if (octopusX < 60) direction = 1
      
      legMove += 0.08
      drawCuteOctopus(octopusX, 325, legMove, eyeBlink)
      
      // Yerdeki yıldız
      const starGlow = 0.5 + Math.sin(time * 0.03) * 0.3
      ctx.fillStyle = `rgba(255, 215, 0, ${starGlow})`
      ctx.fillRect(500, 345, 8, 8)
      ctx.fillStyle = `rgba(255, 200, 50, ${starGlow + 0.2})`
      ctx.fillRect(502, 347, 4, 4)
    }
    
    function animate() {
      draw()
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: currentTheme.bg  // DEĞİŞTİ - tema arkaplanı
    }}>
      
      <canvas 
        ref={canvasRef} 
        width="800" 
        height="400" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center'
      }}>
        
        <h1 style={{
          fontSize: '64px',
          fontWeight: 'bold',
          color: currentTheme.text,  // DEĞİŞTİ - tema yazı rengi
          fontFamily: 'monospace',
          marginBottom: '20px',
          textShadow: `0 0 20px ${currentTheme.border}`  // DEĞİŞTİ
        }}>
          PIXEL<br />STUDY
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: blink ? currentTheme.accent : currentTheme.textDim,  // DEĞİŞTİ
          fontFamily: 'monospace',
          marginBottom: '40px',
          textShadow: `0 0 10px ${blink ? currentTheme.accent : 'transparent'}`
        }}>
          PRESS START
        </p>
        
        <button
          onClick={onStartGame}
          style={{
            backgroundColor: currentTheme.border,  // DEĞİŞTİ
            color: currentTheme.bgCard,  // DEĞİŞTİ
            border: `2px solid ${currentTheme.accent}`,  // DEĞİŞTİ
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: '0.1s linear'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = currentTheme.borderLight  // DEĞİŞTİ
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = currentTheme.border  // DEĞİŞTİ
            e.target.style.transform = 'scale(1)'
          }}
        >
          START GAME
        </button>
        
      </div>
    </div>
  )
}