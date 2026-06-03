import React, { useEffect, useRef, useState } from 'react';
import './Splashscreen.css';

const SKILL_NODES = [
  'Data Scientist', 'AI Engineer', 'Full Stack Dev', 'Backend Dev',
  'ML Engineer', 'Cloud Architect', 'DevOps Engineer',
  'Data Analyst', 'Frontend Dev', 'Product Manager',
  'Cybersecurity', 'Database Admin',
];

export default function SplashScreen({ onDone }) {
  const canvasRef    = useRef(null);
  const animFrameRef = useRef(null);
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandUp, setBrandUp]           = useState(false);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [fadeOut, setFadeOut]           = useState(false);
  const [fillRunning, setFillRunning]   = useState(false);

  useEffect(() => {
    // Show brand text shortly after mount
    const brandTimer = setTimeout(() => setBrandVisible(true), 1500);
    // Start progress bar
    const fillTimer   = setTimeout(() => setFillRunning(true), 200);
    // Slide brand up and show quote at halfway
    const upTimer     = setTimeout(() => setBrandUp(true), 3200);
    const quoteTimer  = setTimeout(() => setQuoteVisible(true), 4200);
    // Start fade-out at 6s
    const fadeTimer   = setTimeout(() => setFadeOut(true), 7500);
    // Unmount after fade completes
    const doneTimer   = setTimeout(() => onDone(), 8300);

    return () => {
      clearTimeout(brandTimer);
      clearTimeout(fillTimer);
      clearTimeout(upTimer);
      clearTimeout(quoteTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Mouse tracking
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const onMouseMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    const nodes = SKILL_NODES.map((label, i) => {
      const angle  = (i / SKILL_NODES.length) * Math.PI * 2;
      const radius = Math.min(W(), H()) * 0.28;
      return {
        label,
        x:  W() / 2 + Math.cos(angle) * radius * (0.6 + Math.random() * 0.8),
        y:  H() / 2 + Math.sin(angle) * radius * (0.6 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r:  Math.random() * 2 + 3,
        pulse: Math.random() * Math.PI * 2,
      };
    });

    const particles = Array.from({ length: 180 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      ox:    0, oy: 0,
      vx:    (Math.random() - 0.5) * 0.12,
      vy:    (Math.random() - 0.5) * 0.12,
      r:     Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }));
    particles.forEach(p => { p.ox = p.x; p.oy = p.y; });

    let t = 0;
    const MOUSE_RADIUS = 140;
    const REPEL_STRENGTH = 0.09;
    const NODE_REPEL_RADIUS = 180;
    const NODE_REPEL_STRENGTH = 0.03;

    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)*0.7);
      grad.addColorStop(0,   'rgba(8,20,45,1)');
      grad.addColorStop(0.5, 'rgba(5,10,20,1)');
      grad.addColorStop(1,   'rgba(2,5,12,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      t += 0.004;

      // Ambient particles — repel from mouse
      particles.forEach(p => {
        const dx   = p.x - mouse.x;
        const dy   = p.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * REPEL_STRENGTH * 3;
          p.vy += (dy / dist) * force * REPEL_STRENGTH * 3;
        }
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x  += p.vx;
        p.y  += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,160,255,${p.alpha})`;
        ctx.fill();
      });

      // Nodes — attracted slightly toward mouse, repelled when very close
      nodes.forEach(n => {
        const dx   = mouse.x - n.x;
        const dy   = mouse.y - n.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < NODE_REPEL_RADIUS && dist > 0) {
          // Repel when mouse is very close
          const force = (NODE_REPEL_RADIUS - dist) / NODE_REPEL_RADIUS;
          n.vx -= (dx / dist) * force * NODE_REPEL_STRENGTH * 4;
          n.vy -= (dy / dist) * force * NODE_REPEL_STRENGTH * 4;
        } else if (dist < 350 && dist > 0) {
          // Gentle attraction from further away
          n.vx += (dx / dist) * 0.008;
          n.vy += (dy / dist) * 0.008;
        }

        n.vx += Math.sin(t + n.pulse) * 0.05;
        n.vy += Math.cos(t + n.pulse) * 0.05;
        n.vx *= 0.97;
        n.vy *= 0.97;
        n.x  += n.vx;
        n.y  += n.vy;
        n.pulse += 0.005;
        if (n.x < 60 || n.x > w - 60) n.vx *= -0.8;
        if (n.y < 60 || n.y > h - 60) n.vy *= -0.8;
      });

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const maxD = Math.min(w, h) * 0.32;
          if (dist < maxD) {
            const alpha = (1 - dist / maxD) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const lineGrad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            lineGrad.addColorStop(0, `rgba(26,86,219,${alpha})`);
            lineGrad.addColorStop(1, `rgba(96,165,250,${alpha})`);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw mouse connection lines to nearby nodes
      nodes.forEach(n => {
        const dx   = n.x - mouse.x;
        const dy   = n.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) {
          const alpha = (1 - dist / 200) * 0.5;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(n.x, n.y);
          ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      });

      // Draw mouse cursor glow
      const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60);
      mouseGlow.addColorStop(0,   'rgba(96,165,250,0.12)');
      mouseGlow.addColorStop(1,   'rgba(96,165,250,0)');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = mouseGlow;
      ctx.fill();

      // Draw nodes
      nodes.forEach(n => {
        const pulse = Math.sin(t * 2 + n.pulse) * 0.5 + 0.5;
        const glow  = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22 + pulse * 8);
        glow.addColorStop(0, `rgba(26,86,219,${0.25 + pulse * 0.15})`);
        glow.addColorStop(1, 'rgba(26,86,219,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, 22 + pulse * 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26,86,219,${0.7 + pulse * 0.3})`;
        ctx.shadowColor = '#1a56db';
        ctx.shadowBlur  = 12;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.font        = `500 11px 'DM Sans', sans-serif`;
        ctx.fillStyle   = `rgba(255,255,255,${0.55 + pulse * 0.3})`;
        ctx.textAlign   = 'center';
        ctx.fillText(n.label, n.x, n.y - 12);
      });

      // Central glow
      const centerGlow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 120);
      centerGlow.addColorStop(0, 'rgba(26,86,219,0.08)');
      centerGlow.addColorStop(1, 'rgba(26,86,219,0)');
      ctx.beginPath();
      ctx.arc(w/2, h/2, 120, 0, Math.PI * 2);
      ctx.fillStyle = centerGlow;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className={`splash-root${fadeOut ? ' fade-out' : ''}`}>
      <canvas ref={canvasRef} className="splash-canvas" />

      <div className={`splash-brand${brandVisible ? ' visible' : ''}${brandUp ? ' slide-up' : ''}`}>
        <div className="splash-brand-icon"><span /></div>
        <h1>SkillGap<em>AI</em></h1>
        <p>Know your gaps. Land your dream role.</p>
      </div>

      <div className={`splash-quote${quoteVisible ? ' visible' : ''}`}>
        <p>"Your dream role is</p>
        <p>one skill away."</p>
      </div>

      <div className="splash-progress">
        <div className="splash-progress-bar">
          <div className={`splash-progress-fill${fillRunning ? ' running' : ''}`} />
        </div>
        <div className="splash-progress-text">Loading</div>
      </div>
    </div>
  );
}