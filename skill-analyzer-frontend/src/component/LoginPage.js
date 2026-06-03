import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './LoginPage.css';

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const mouse = { x: -999, y: -999 };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

    // Create particles
    const particles = Array.from({ length: 70 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 2 + 1,
      alpha: Math.random() * 0.25 + 0.1,
    }));

    const REPEL_RADIUS   = 100;
    const REPEL_STRENGTH = 0.12;
    const SLOW_RADIUS    = 180;  // radius within which particles slow down

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 90) * 0.12})`;
            ctx.lineWidth   = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw mouse connection lines
      particles.forEach(p => {
        const dx   = p.x - mouse.x;
        const dy   = p.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 120) * 0.35})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      });

      // Draw mouse glow                                                          
      if (mouse.x > 0) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        glow.addColorStop(0,   'rgba(255,255,255,0.08)');
        glow.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Update & draw particles
      particles.forEach(p => {
        const dx   = p.x - mouse.x;
        const dy   = p.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx += (dx / dist) * force * REPEL_STRENGTH * 1;
          p.vy += (dy / dist) * force * REPEL_STRENGTH * 1;
        }

        // Slow down particles near cursor — closer = slower
        let dampen = 0.998; // slower idle friction (was 0.992)
        if (mouse.x > 0 && dist < SLOW_RADIUS) {
          const proximity = 1 - (dist / SLOW_RADIUS); // 0 (far) → 1 (very close)
          dampen = 0.998 - proximity * 0.088; // ranges from 0.992 down to ~0.904
        }

        // Keep minimum speed so particles never fully stop
        p.vx *= dampen;
        p.vy *= dampen;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const minSpeed = mouse.x > 0 && dist < SLOW_RADIUS ? 0 : 0.12; // slower idle min speed
        if (speed < minSpeed && speed > 0) {
          p.vx = (p.vx / speed) * minSpeed;
          p.vy = (p.vy / speed) * minSpeed;
        }
        p.x  += p.vx;
        p.y  += p.vy;

        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-particle-canvas" />;
}

const SLIDES = [
  {
    heading: <>Know your gaps.<br />Land your dream role.</>,
    sub: 'Analyze your current skills against any job role and get a clear roadmap to close the gap.',
  },
  {
    heading: <>Analyze your skills.<br />Get your match score.</>,
    sub: 'See exactly how well your skills match a role — with a weighted score based on your proficiency level.',
  },
  {
    heading: <>Track your progress.<br />Grow every day.</>,
    sub: 'Every time you add a skill your score improves. Watch yourself get closer to your dream job.',
  },
];

export default function LoginPage({ onGoSignup }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [slide, setSlide]       = useState(0);
  const [animState, setAnimState] = useState('visible'); // 'visible' | 'exit' | 'enter'

  // Auto-advance every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((prev) => (prev + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (getNext) => {
    setAnimState('exit');
    setTimeout(() => {
      setSlide(prev => {
        const next = typeof getNext === 'function' ? getNext(prev) : getNext;
        return next;
      });
      setAnimState('enter');
      setTimeout(() => setAnimState('visible'), 400);
    }, 350);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <ParticleCanvas />
        <div className="login-brand">
          <div className="login-brand-icon"><span /></div>
          <h2>SkillGap<em>AI</em></h2>
        </div>
        <div className={`login-tagline login-slide-${animState}`}>
          <h1>{SLIDES[slide].heading}</h1>
          <p>{SLIDES[slide].sub}</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card fade-in">
          <h2>Welcome back</h2>
          <p>Don't have an account? <button type="button" className="link-btn" onClick={onGoSignup}>Create one</button></p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={error ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={error ? 'error' : ''}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}