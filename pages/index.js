import { useEffect, useState } from 'react'

export default function Home() {
  const [windowWidth, setWindowWidth] = useState(1000)
  const [country, setCountry] = useState('')
  const [watchers, setWatchers] = useState(null)
  const [vpnActive, setVpnActive] = useState(false)
  const [vpnExpiresAt, setVpnExpiresAt] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [mapCoords, setMapCoords] = useState(null)
  const [lastPingTime, setLastPingTime] = useState(null)
  const [zoom, setZoom] = useState(15)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
   const getHeaderFontSize = () => (windowWidth < 500 ? '1.5rem' : '2.5rem')
  const getGhostFontSize = () => (windowWidth < 500 ? '1.2rem' : '2rem')
  const getSubtextFontSize = () => (windowWidth < 500 ? '0.9rem' : '1.2rem')

  const messages = [
    '⚠️ Someone tried to access your phone!',
    '🚨 Unsecured network detected!',
    '🛑 Camera access attempt blocked.',
    '🔍 Unknown device scanning your location.',
    '🔓 Face recognition failed!',
  ]

  const sounds = ['blip', 'siren', 'ping']

  const playSound = (name) => {
    const sound = new Audio(`/sounds/${name}.mp3`)
    sound.play()
  }

  const triggerRandomModal = () => {
    const message = messages[Math.floor(Math.random() * messages.length)]
    const sound = sounds[Math.floor(Math.random() * sounds.length)]
    setModalMessage(message)
    setShowModal(true)
    playSound(sound)
    setTimeout(() => {
      setShowModal(false)
    }, 5000)
  }
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    // Matrix effect
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `
      body {
        margin: 0;
        overflow: hidden;
      }
      canvas#matrixCanvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
        pointer-events: none;
      }
      .glitch {
        animation: glitch 1s linear infinite;
      }
      @keyframes glitch {
        2%, 64% {
          transform: translate(2px, 0) skew(0deg);
        }
        4%, 60% {
          transform: translate(-2px, 0) skew(0deg);
        }
        62% {
          transform: translate(0, 0) skew(5deg);
        }
      }
      .vignette-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at center, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.9) 50%);
        z-index: 1;
        pointer-events: none;
      }
    `
    document.head.appendChild(styleEl)

    const canvas = document.createElement('canvas')
    canvas.id = 'matrixCanvas'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*アァカサタナハマヤラワン'
    const fontSize = 20
    let columns = Math.floor(canvas.width / fontSize)
    let drops = Array(columns).fill(1)

    const draw = () => {
      // Fully clear the canvas each frame to prevent green buildup
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Add subtle trail effect with higher opacity
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.shadowColor = 'rgba(0, 255, 0, 0.5)' // Reduced green opacity
      ctx.shadowBlur = 4 // Reduced blur for less green spread
      ctx.fillStyle = 'rgba(0, 255, 0, 0.7)' // Reduced green opacity
      ctx.font = `${fontSize}px monospace`
      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      resizeCanvas()
      columns = Math.floor(canvas.width / fontSize)
      drops = Array(columns).fill(1)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', resizeCanvas)
      document.body.removeChild(canvas)
      document.head.removeChild(styleEl)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('%cUnsecured connection detected', 'color: red; font-weight: bold; font-size: 16px;')
    console.log('Location pinged from Riyadh, 2 mins ago')

    fetch('https://ipapi.co/json')
      .then(res => res.json())
      .then(data => setCountry(data.country_name))

    const storedVpn = localStorage.getItem('vpnActive')
    const storedExpiry = localStorage.getItem('vpnExpiresAt')

    const baseLat = 24.7136
    const baseLng = 46.6753
    const latOffset = (Math.random() - 0.5) * 0.1
    const lngOffset = (Math.random() - 0.5) * 0.1
    const initialCoords = {
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset
    }
    setMapCoords(initialCoords)
    setLastPingTime(new Date())

    if (storedVpn === 'true' && storedExpiry && new Date() < new Date(storedExpiry)) {
      setVpnActive(true)
      setVpnExpiresAt(storedExpiry)
      setWatchers(0)
    } else {
      generateWatchers()
    }

    let moveInterval = setInterval(() => {
      setMapCoords(prev => {
        if (!prev) return prev
        const newCoords = {
          lat: prev.lat + (Math.random() - 0.5) * 0.01,
          lng: prev.lng + (Math.random() - 0.5) * 0.01
        }
        setLastPingTime(new Date())
        return newCoords
      })
    }, 10000)

    let zoomInterval = setInterval(() => {
      setZoom(prev => (prev === 15 ? 16 : 15))
    }, 6000)

    const modalInterval = setInterval(() => {
      triggerRandomModal()
    }, Math.random() * (45000 - 15000) + 15000)

    return () => {
      clearInterval(moveInterval)
      clearInterval(zoomInterval)
      clearInterval(modalInterval)
    }
  }, [])

  useEffect(() => {
    if (!vpnActive || !vpnExpiresAt) return

    const interval = setInterval(() => {
      const diff = new Date(vpnExpiresAt) - new Date()
      if (diff <= 0) {
        setVpnActive(false)
        localStorage.removeItem('vpnActive')
        localStorage.removeItem('vpnExpiresAt')
        generateWatchers()
        setCountdown('')
        clearInterval(interval)
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const secs = Math.floor((diff % (1000 * 60)) / 1000)
        setCountdown(`${hours}h ${mins}m ${secs}s`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [vpnActive, vpnExpiresAt])

  const generateWatchers = () => {
    const num = Math.floor(Math.random() * 5) + 1
    setWatchers(num)
  }

  const toggleVPN = () => {
    if (!vpnActive) {
      const hours = Math.floor(Math.random() * 2) + 3
      const expiry = new Date(Date.now() + hours * 60 * 60 * 1000)
      setVpnActive(true)
      setVpnExpiresAt(expiry)
      setCountdown(`${hours}h 0m 0s`)
      setWatchers(0)
      localStorage.setItem('vpnActive', 'true')
      localStorage.setItem('vpnExpiresAt', expiry.toISOString())
      alert('🛡️ VPN Geomapping Protection ACTIVATED')
    } else {
      setVpnActive(false)
      setVpnExpiresAt(null)
      setCountdown('')
      localStorage.removeItem('vpnActive')
      localStorage.removeItem('vpnExpiresAt')
      generateWatchers()
    }
  }

  const getLastPingText = () => {
    if (!lastPingTime) return ''
    const seconds = Math.floor((new Date() - new Date(lastPingTime)) / 5000)
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      padding: '2rem',
      color: vpnActive ? '#00ff00' : '#ff4444',
      fontFamily: 'monospace',
    }}>
      <div className="vignette-overlay"></div>
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 10,
        color: vpnActive ? '#00ff00' : '#ff4444',
      }}>
        <h1 style={{
          fontSize: getHeaderFontSize(),
          marginBottom: '1rem',
          textShadow: vpnActive ? '0 0 10px #00ff00' : '0 0 5px #ff4444',
          transition: 'font-size 0.2s',
        }}>⚠️ Secure Tracking Portal</h1>
        <p style={{
          fontSize: getSubtextFontSize(),
          opacity: 0.8,
          transition: 'font-size 0.2s',
        }}>Monitoring real-time activity...</p>
      </div>

      <div style={{
        backgroundColor: 'transparent',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid currentColor',
        maxWidth: '500px',
        margin: '6rem auto 0 auto',
        zIndex: 10,
        position: 'relative',
      }}>
        <h1 style={{
          fontSize: getGhostFontSize(),
          textAlign: 'center',
          marginBottom: '2rem',
          textShadow: '0 0 5px currentColor',
          transition: 'font-size 0.2s',
        }}>🔒 GHOST TRACKER</h1>
        <p><strong>Name:</strong> Christian Ong Nuguid</p>
        <p><strong>Country:</strong> {country || 'Detecting...'}</p>
        <p><strong>Mobile:</strong> +966 507971956</p>
        <p>
          <strong>Watchers:</strong>{' '}
          {watchers !== null ? <span className={!vpnActive ? 'glitch' : ''}>{watchers}</span> : '...'}
        </p>
        {vpnActive && <p><strong>VPN Countdown:</strong> {countdown}</p>}
        <button
          onClick={toggleVPN}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid currentColor',
            color: 'currentColor',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          {vpnActive ? 'Deactivate VPN' : 'Activate VPN'}
        </button>

        {mapCoords && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>📡 Live GPS Tracker</h3>
            <iframe
              title="fake-map"
              width="100%"
              height="300"
              style={{ border: '2px solid currentColor' }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=${zoom}&output=embed`}
            ></iframe>
            <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
              Last ping: {getLastPingText()}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#110000',
            padding: '2rem',
            borderRadius: '8px',
            border: '2px solid #ff4444',
            textAlign: 'center',
            color: '#ff4444',
            fontFamily: 'monospace',
            maxWidth: '80%',
          }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{modalMessage}</h2>
          </div>
        </div>
      )}
    </div>
  )
}