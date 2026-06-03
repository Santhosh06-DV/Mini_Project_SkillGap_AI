import React, { useState, useRef, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from './AuthContext';
import { analyzeSkills, JOB_ROLES, LEVELS, ROLE_SKILLS } from './api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Dashboard.css';

const COLORS = { matched: '#1a56db', missing: '#f97316' };

const LEVEL_COLORS = {
  'Basic':        { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Intermediate': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Expert':       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

const ANALYZE_STEPS = [
  { icon: '🔍', text: 'Scanning your skill set...'       },
  { icon: '🎯', text: 'Matching role requirements...'    },
  { icon: '📊', text: 'Calculating match score...'       },
  { icon: '✅', text: 'Analysis complete!'               },
];

function AnalyzingOverlay({ role }) {
  const [step, setStep]         = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    // Progress bar fills smoothly over 3.6s reaching exactly 100%
    let current = 0;
    const progressTimer = setInterval(() => {
      current += 0.5;
      if (current >= 100) {
        current = 100;
        clearInterval(progressTimer);
      }
      setProgress(current);
    }, 18);

    // Steps appear one by one — spread across 3.6s
    const stepTimers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => { setStep(4); setDone(true); }, 3600),
    ];

    return () => {
      clearInterval(progressTimer);
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="analyzing-overlay">
      <div className="analyzing-card">
        {/* Animated brain icon */}
        <div className="analyzing-icon-wrap">
          <div className={`analyzing-pulse${done ? ' done' : ''}`} />
          <div className="analyzing-icon">{done ? '✅' : '🧠'}</div>
        </div>

        <h3 className="analyzing-title">
          {done ? 'Analysis Complete!' : 'AI Analyzing Skills'}
        </h3>
        <p className="analyzing-role">
          {done ? 'Your results are ready' : `Matching against — ${role}`}
        </p>

        {/* Progress bar */}
        <div className="analyzing-progress-track">
          <div
            className="analyzing-progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="analyzing-percent">{Math.min(Math.round(progress), 100)}%</div>

        {/* Steps */}
        <div className="analyzing-steps">
          {ANALYZE_STEPS.map((s, i) => (
            <div
              key={i}
              className={`analyzing-step${step > i ? ' visible' : ''}${step === i + 1 ? ' active' : ''}`}
            >
              <span className="analyzing-step-icon">{step > i ? '✓' : s.icon}</span>
              <span className="analyzing-step-text">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Build levelMap from skills_with_levels array.
 * Handles both [{name, level}] and plain string arrays safely.
 */
function buildLevelMap(skillsWithLevels) {
  const map = {};
  if (!Array.isArray(skillsWithLevels)) return map;
  skillsWithLevels.forEach(s => {
    if (!s) return;
    // object form {name, level}
    if (typeof s === 'object' && s.name) {
      map[s.name.trim().toLowerCase()] = s.level || 'Intermediate';
    }
    // plain string — no level info
    if (typeof s === 'string') {
      map[s.trim().toLowerCase()] = 'Intermediate';
    }
  });
  return map;
}

export default function Dashboard({ result: initialResult, userSkills: initialSkills, onReanalyze }) {
  const { user, saveResult } = useAuth();

  const [result, setResult] = useState(() => {
    if (!initialResult) return null;
    // Normalize initialSkills to always be [{name, level}] objects
    const normalized = (initialSkills || []).map(s =>
      typeof s === 'string' ? { name: s, level: 'Intermediate' } : s
    );
    // Prefer result.skills_with_levels if already present, else use normalised initialSkills
    const swl = (initialResult.skills_with_levels?.length)
      ? initialResult.skills_with_levels
      : normalized;
    return { ...initialResult, skills_with_levels: swl };
  });
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputCardRef    = useRef(null); // for auto-scroll
  const [bonusSkills, setBonusSkills] = useState([]); // other skills not in role
  const [addedSuggestions, setAddedSuggestions] = useState(new Set()); // track clicked suggestions

  // Extra skills beyond job roles
  const OTHER_SKILLS = [
    'docker', 'git', 'kubernetes', 'aws', 'linux',
    'mongodb', 'postgresql', 'redis', 'graphql', 'typescript',
    'ci/cd', 'agile', 'system design', 'problem solving',
  ].filter(s => {
    // Only hide if currently in bonusSkills list (removed ones reappear)
    const inBonus = bonusSkills.map(b => b.name.toLowerCase());
    return !inBonus.includes(s);
  });

  // Close skill dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (skillInputRef.current && !skillInputRef.current.contains(e.target))
        setSkillDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close suggestion panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Add suggested skill and re-analyze
  const handleAddSuggestion = (skillName, isBonus = false) => {
    if (!result?.role) return;

    // Bug fix 4: Bonus skills — just add to bonusSkills list, NO re-analyze, NO score change
    if (isBonus) {
      const already = bonusSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      if (already) return;
      setBonusSkills(prev => [...prev, { name: skillName.toLowerCase(), level }]);
      return;
    }

    // Missing role skills — add to skill INPUT area with current selected level
    const trimmed = skillName.trim().toLowerCase();
    const alreadyInInput = skills.find(s => s.name === trimmed);
    if (alreadyInInput) return;
    setSkills(prev => [...prev, { name: trimmed, level }]);
    // Remove from suggestion list immediately
    setAddedSuggestions(prev => new Set([...prev, trimmed]));
    setShowSuggestions(false);
    if (!role && result?.role) setRole(result.role);
    // Auto-scroll to input card so user sees the added chip
    setTimeout(() => {
      if (inputCardRef.current) {
        inputCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Remove bonus skill
  const handleRemoveBonus = (skillName) => {
    setBonusSkills(prev => prev.filter(s => s.name !== skillName.toLowerCase()));
  };

  // Re-analyze form state
  const [role, setRole]             = useState(result?.role || '');
  const [skillInput, setSkillInput] = useState('');
  const [skillDropOpen, setSkillDropOpen] = useState(false);
  const skillInputRef = useRef(null);
  const [level, setLevel]           = useState('Intermediate');
  const [skills, setSkills]         = useState([]); // [{name, level}] — input buffer only
  const [formError, setFormError]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(false);


  // FIX 2: Always build levelMap from result.skills_with_levels (authoritative source)
  const levelMap = buildLevelMap(result?.skills_with_levels);

  /* ── Radar data: correct level → radar value mapping ── */
  const allSkills = result
    ? [...(result.matched_skills || []), ...(result.missing_skills || [])]
    : [];

  // Direct level → radar value map (avoids any import issues)
  const RADAR_VAL = { 'Basic': 40, 'Intermediate': 70, 'Expert': 100 };

  const radarData = allSkills.map(skillName => {
    const key       = skillName.trim().toLowerCase();
    const isMatched = (result.matched_skills || []).map(s => s.trim().toLowerCase()).includes(key);
    const lvl       = levelMap[key];
    const val       = isMatched ? (RADAR_VAL[lvl] ?? 70) : 15;
    return { skill: skillName, value: val, level: lvl, isMatched };
  });

  const pieData = result ? [
    { name: `Matched (${(result.matched_skills || []).length})`, value: (result.matched_skills || []).length },
    { name: `Missing (${(result.missing_skills  || []).length})`, value: (result.missing_skills  || []).length },
  ] : [];

  /* ── Input chip helpers ── */
  // Use the full skill list from api.js (140+ skills, already sorted A→Z)
  const ALL_SKILLS_LIST = JOB_ROLES;

  const addedSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
  const filteredDashSkills = ALL_SKILLS_LIST.filter(s =>
    s.includes(skillInput.toLowerCase()) && !addedSkillNames.has(s)
  );
  const addSkill = (nameOverride) => {
    const t = (nameOverride || skillInput).trim().toLowerCase();
    if (!t || skills.find(s => s.name === t)) { setSkillInput(''); setSkillDropOpen(false); return; }
    setSkills(prev => [...prev, { name: t, level }]);
    setSkillInput('');
    setSkillDropOpen(false);
  };
  const removeSkill = name => setSkills(p => p.filter(s => s.name !== name));
  const handleKeyDown = e => {
    if (e.key === 'Enter')  { e.preventDefault(); addSkill(); }
    if (e.key === 'Escape') setSkillDropOpen(false);
  };

  const handleRun = async () => {
    setFormError('');
    const activeRole = role || result?.role || '';
    if (!activeRole) { setFormError('Select a role.'); return; }

    if (skills.length === 0 && !(result?.skills_with_levels?.length > 0)) {
      setFormError('Add at least one skill.'); return;
    }

    setLoading(true);
    setShowAnalyzing(true);

    // Run API call and animation in parallel
    // Animation always takes minimum 4s regardless of API speed
    const animationDone = new Promise(resolve => setTimeout(resolve, 4000));

    try {
      const activeRole2 = role || result?.role || '';
      const roleSkillSet = new Set((ROLE_SKILLS[activeRole2] || []).map(s => s.toLowerCase()));
      const roleInputSkills  = skills.filter(s => roleSkillSet.has(s.name.toLowerCase()));
      const bonusInputSkills = skills.filter(s => !roleSkillSet.has(s.name.toLowerCase()));

      if (bonusInputSkills.length > 0) {
        setBonusSkills(prev => {
          const existing = new Set(prev.map(b => b.name.toLowerCase()));
          const newBonus = bonusInputSkills.filter(s => !existing.has(s.name.toLowerCase()));
          return [...prev, ...newBonus];
        });
      }

      const prevSkills = result?.skills_with_levels || [];
      const newNames   = new Set(roleInputSkills.map(s => s.name.toLowerCase()));
      const retained   = prevSkills.filter(s => {
        const n = typeof s === 'object' ? s.name.toLowerCase() : s.toLowerCase();
        return !newNames.has(n);
      });
      const mergedSkills = [...retained, ...roleInputSkills];

      // Wait for BOTH api response AND animation to finish
      const [res] = await Promise.all([
        analyzeSkills(mergedSkills, activeRole2),
        animationDone,
      ]);

      if (res.error) {
        setFormError(res.error);
        setShowAnalyzing(false);
        setLoading(false);
        return;
      }

      const enrichedRes = { ...res, skills_with_levels: mergedSkills };
      saveResult({ ...enrichedRes, user_skills: mergedSkills });
      setResult(enrichedRes);
      setActiveNav('dashboard');
      setSkills([]);
      setSkillInput('');
      // Small delay to show ✅ complete state
      setTimeout(() => setShowAnalyzing(false), 800);
    } catch (e) {
      setFormError(e.message || 'Backend unreachable.');
      setShowAnalyzing(false);
    }
    setLoading(false);
  };

  /* ── DELETE SKILL: remove from tags and re-analyze ── */
  const handleDeleteSkill = async (skillToRemove) => {
    if (!role) { setFormError('Select a role to re-analyze after deleting.'); return; }
    setLoading(true);
    setFormError('');
    try {
      // Current skills minus the deleted one
      const prevSkills = result?.skills_with_levels || [];
      const updatedSkills = prevSkills.filter(s => {
        const name = typeof s === 'object' ? s.name : s;
        return name.toLowerCase() !== skillToRemove.toLowerCase();
      });

      const res = await analyzeSkills(updatedSkills, role);
      if (res.error) { setFormError(res.error); setLoading(false); return; }

      const enrichedRes = { ...res, skills_with_levels: updatedSkills };
      saveResult({ ...enrichedRes, user_skills: updatedSkills });
      setResult(enrichedRes);
    } catch (e) {
      setFormError(e.message || 'Backend unreachable.');
    }
    setLoading(false);
  };

  /* ── Full-screen Radar ── */
  const strongestSkill = result ? [...(result.matched_skills || [])].sort((a, b) => {
    const levels = { 'Expert': 3, 'Intermediate': 2, 'Basic': 1 };
    return (levels[levelMap[b?.toLowerCase()]] || 0) - (levels[levelMap[a?.toLowerCase()]] || 0);
  })[0] : null;

  const missingCount = (result?.missing_skills || []).length;

  // Color each skill label based on level
  const SKILL_LEVEL_COLORS = {
    'Expert':       '#16a34a',
    'Intermediate': '#1a56db',
    'Basic':        '#f97316',
  };

  const renderCustomTick = ({ payload, x, y, textAnchor }) => {
    const skillName = payload?.value;
    const lvl = levelMap[skillName?.toLowerCase()];
    const isMatched = (result?.matched_skills || []).map(s => s.toLowerCase()).includes(skillName?.toLowerCase());
    const color = isMatched ? (SKILL_LEVEL_COLORS[lvl] || '#374151') : '#ef4444';
    const fontWeight = isMatched ? 600 : 400;
    return (
      <text x={x} y={y} textAnchor={textAnchor} fill={color} fontSize={13} fontWeight={fontWeight}>
        {skillName}
      </text>
    );
  };

  // Level → dot color map
  const LEVEL_DOT_COLORS = {
    'Expert':       '#16a34a',
    'Intermediate': '#1a56db',
    'Basic':        '#f97316',
  };

  // Custom colored dot — reads level directly from radarData payload
  const renderCustomDot = (props) => {
    const { cx, cy, index } = props;
    if (!cx || !cy || index === undefined) return null;
    const dataPoint = radarData[index];
    if (!dataPoint) return null;
    const color = dataPoint.isMatched
      ? (LEVEL_DOT_COLORS[dataPoint.level] || '#1a56db')
      : '#ef4444';
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2.5} />;
  };

  const renderRadarFull = () => (
    <div className="chart-fullscreen fade-in">
      {/* Insight Banner */}
      <div className="chart-insight-banner">
        <span className="chart-insight-icon">💡</span>
        {missingCount === 0
          ? '🎉 Perfect match! You have all required skills!'
          : `You're just ${missingCount} skill${missingCount > 1 ? 's' : ''} away from a 100% match!`}
        {strongestSkill && (
          <span className="chart-insight-strong">⭐ Strongest: <b>{strongestSkill}</b> ({levelMap[strongestSkill?.toLowerCase()]})</span>
        )}
        <span className="chart-insight-strong" style={{ background: '#eef2ff', color: '#1a56db' }}>🎯 {result?.match_score}% Match</span>
      </div>

      <div className="chart-fullscreen-header">
        <h3>Skill Radar</h3>
        <button className="btn-back" onClick={() => setActiveNav('dashboard')}>← Back to Dashboard</button>
      </div>

      <div className="chart-fullscreen-body" style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <defs>
              <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a56db" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.08}/>
              </linearGradient>
            </defs>
            <PolarGrid stroke="#eaedf2" />
            <PolarAngleAxis dataKey="skill" tick={renderCustomTick} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Proficiency"
              dataKey="value"
              stroke="#1a56db"
              fill="url(#radarGrad)"
              fillOpacity={1}
              strokeWidth={2.5}
              dot={renderCustomDot}
              activeDot={false}
              animationBegin={0}
              animationDuration={800}
            />
            <Tooltip
              formatter={(value, name, props) => {
                const { skill, level: lvl, isMatched } = props?.payload || {};
                return [isMatched ? `${lvl} — score: ${value}` : `Missing — score: ${value}`, skill];
              }}
              contentStyle={{ borderRadius: 10, border: '1px solid #eaedf2', fontSize: 13 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Clean legend — no scores */}
      <div className="chart-fullscreen-legend">
        <div className="radar-level-legend">
          <span className="radar-level-dot" style={{ background: '#16a34a' }} /><span style={{ color: '#16a34a', fontWeight: 600 }}>Expert</span>
          <span className="radar-level-dot" style={{ background: '#1a56db' }} /><span style={{ color: '#1a56db', fontWeight: 600 }}>Intermediate</span>
          <span className="radar-level-dot" style={{ background: '#f97316' }} /><span style={{ color: '#f97316', fontWeight: 600 }}>Basic</span>
          <span className="radar-level-dot" style={{ background: '#ef4444' }} /><span style={{ color: '#ef4444', fontWeight: 600 }}>Missing</span>
        </div>
      </div>
    </div>
  );

  /* ── Full-screen Pie ── */
  const matchedCount  = (result?.matched_skills || []).length;
  const totalCount    = matchedCount + missingCount;
  const matchPct      = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  // Build level-based pie data
  const expertSkills       = (result?.matched_skills || []).filter(s => levelMap[s.toLowerCase()] === 'Expert');
  const intermediateSkills = (result?.matched_skills || []).filter(s => levelMap[s.toLowerCase()] === 'Intermediate');
  const basicSkills        = (result?.matched_skills || []).filter(s => levelMap[s.toLowerCase()] === 'Basic' || !levelMap[s.toLowerCase()]);
  const missingSkills      = result?.missing_skills || [];

  const levelPieData = [
    { name: 'Expert',       value: expertSkills.length,       color: '#16a34a', light: '#f0fdf4', label: 'Expert Skills',       skills: expertSkills },
    { name: 'Intermediate', value: intermediateSkills.length, color: '#1a56db', light: '#eef2ff', label: 'Intermediate Skills', skills: intermediateSkills },
    { name: 'Basic',        value: basicSkills.length,        color: '#f97316', light: '#fff7ed', label: 'Basic Skills',        skills: basicSkills },
    { name: 'Missing',      value: missingSkills.length,      color: '#ef4444', light: '#fee2e2', label: 'Missing Skills',      skills: missingSkills },
  ].filter(d => d.value > 0);

  const renderPieFull = () => (
    <div className="chart-fullscreen fade-in">
      {/* Insight Banner */}
      <div className="chart-insight-banner">
        <span className="chart-insight-icon">📊</span>
        {missingCount === 0
          ? '🎉 You have ALL required skills for this role!'
          : `You have ${matchedCount} of ${totalCount} required skills — add ${missingCount} more to complete!`}
      </div>

      <div className="chart-fullscreen-header">
        <h3>Skill Distribution by Level</h3>
        <button className="btn-back" onClick={() => setActiveNav('dashboard')}>← Back to Dashboard</button>
      </div>

      <div className="chart-fullscreen-body">
        <div className="pie-fullscreen-wrap">
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width={380} height={380}>
              <PieChart>
                <Pie
                  data={levelPieData}
                  cx="50%" cy="50%"
                  innerRadius={100} outerRadius={160}
                  dataKey="value"
                  paddingAngle={3}
                  animationBegin={0}
                  animationDuration={900}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {levelPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n, props) => {
                    const entry = levelPieData.find(d => d.name === props?.payload?.name);
                    const skillList = entry?.skills?.join(', ') || '';
                    return [`${v} skill${v !== 1 ? 's' : ''}: ${skillList}`, n];
                  }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #eaedf2', fontSize: 12, maxWidth: 220 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center text */}
            <div className="pie-center-text">
              <span className="pie-center-score">{matchPct}%</span>
              <span className="pie-center-label">Match Rate</span>
            </div>
          </div>

          {/* Level-based legend */}
          <div className="pie-legend-full">
            {levelPieData.map((entry, i) => (
              <div key={i} className="pie-legend-item-full">
                <div className="pie-legend-color" style={{ background: entry.color, borderRadius: 6 }} />
                <div className="pie-legend-text">
                  <strong style={{ fontSize: 20, color: entry.color }}>{entry.value}</strong>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{entry.label}</span>
                  <div className="pie-skill-chips">
                    {entry.skills.map(s => (
                      <span key={s} className="pie-skill-chip" style={{ background: entry.light, color: entry.color, border: `1px solid ${entry.color}30` }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Progress note */}
            <div className="pie-progress-note">
              {missingCount === 0
                ? <span style={{ color: '#16a34a', fontWeight: 600 }}>🎉 Complete!</span>
                : <span>📈 Add <b style={{ color: '#1a56db' }}>{missingCount} more skill{missingCount > 1 ? 's' : ''}</b> to reach 100%</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Route to chart full-screen views ── */
  if (activeNav === 'radar') return (
    <div className="dashboard-root">
      <Navbar activeRole={result?.role} />
      <div className="dashboard-body">
        <Sidebar active={activeNav} onNavigate={setActiveNav} hasResult={!!result} />
        <div className="dashboard-main" style={{ display:'flex', flexDirection:'column', overflow:'hidden', padding:'10px 18px' }}>{renderRadarFull()}</div>
      </div>
    </div>
  );

  if (activeNav === 'pie') return (
    <div className="dashboard-root">
      <Navbar activeRole={result?.role} />
      <div className="dashboard-body">
        <Sidebar active={activeNav} onNavigate={setActiveNav} hasResult={!!result} />
        <div className="dashboard-main" style={{ display:'flex', flexDirection:'column', overflow:'hidden', padding:'10px 18px' }}>{renderPieFull()}</div>
      </div>
    </div>
  );

  /* ── Main dashboard view ── */
  return (
    <div className="dashboard-root">
      {/* AI Analyzing Overlay */}
      {showAnalyzing && <AnalyzingOverlay role={result?.role || role} />}

      <Navbar activeRole={result?.role} />
      <div className="dashboard-body">
        <Sidebar active={activeNav} onNavigate={setActiveNav} hasResult={!!result} />

        <div className="dashboard-main">

          {/* Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-text">
              <h2>Skill Match Dashboard</h2>
              <p>Hello, {user?.name?.split(' ')[0]} — here's your skill gap analysis</p>
            </div>
            {result && (
              <div className="suggestions-wrapper" ref={suggestionsRef}>
                <button
                  className="btn-suggestions"
                  onClick={() => setShowSuggestions(v => !v)}
                >
                  💡 Skill Suggestions {showSuggestions ? '▲' : '▼'}
                </button>

                {showSuggestions && (
                  <div className="suggestions-panel fade-in">
                    {/* Missing Skills Section */}
                    <div className="suggestions-section">
                      <div className="suggestions-section-title">
                        <span className="suggestions-section-icon">🎯</span>
                        Missing Skills
                        <span className="suggestions-badge orange">{(result.missing_skills || []).length}</span>
                      </div>
                      {(result.missing_skills || []).length === 0 ? (
                        <div className="suggestions-empty">🎉 All role skills matched!</div>
                      ) : (
                        <div className="suggestions-chips">
                          {(result.missing_skills || [])
                            .filter(s => !addedSuggestions.has(s.trim().toLowerCase()) && !skills.find(sk => sk.name === s.trim().toLowerCase()))
                            .map(s => (
                            <button
                              key={s}
                              className="suggestion-chip chip-missing"
                              onClick={() => handleAddSuggestion(s, false)}
                              disabled={loading}
                            >
                              <span>+ {s}</span>
                              <em>adds to input → analyze to score</em>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="suggestions-divider" />

                    {/* Other Skills Section */}
                    <div className="suggestions-section">
                      <div className="suggestions-section-title">
                        <span className="suggestions-section-icon">➕</span>
                        Other Skills to Explore
                      </div>
                      <div className="suggestions-chips">
                        {OTHER_SKILLS.filter(s => !bonusSkills.find(b => b.name === s)).map(s => (
                          <button
                            key={s}
                            className="suggestion-chip chip-other"
                            onClick={() => handleAddSuggestion(s, true)}
                            disabled={loading}
                          >
                            <span>+ {s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Score Cards */}
          {result && (
            <div className="score-cards fade-in">
              <div className="score-card blue">
                <div className="score-card-label">Match Score</div>
                <div className="score-card-value" style={{ color: result.match_score < 50 ? '#d97706' : '#16a34a' }}>
                  {result.match_score}<span style={{ color: '#d1d5db' }}>%</span>
                </div>
                <div className="score-card-sub">
                  {result.match_score >= 75 ? 'Strong match' : result.match_score >= 50 ? 'Moderate match' : 'Needs work'}
                </div>
              </div>
              <div className="score-card green">
                <div className="score-card-label">Matched Skills</div>
                <div className="score-card-value">
                  {(result.matched_skills || []).length}
                  <span> / {(result.matched_skills || []).length + (result.missing_skills || []).length}</span>
                </div>
                <div className="score-card-sub">
                  {(result.matched_skills || []).slice(0, 2).join(', ')}{(result.matched_skills || []).length > 2 ? ' +more' : ''}
                </div>
              </div>
              <div className="score-card orange">
                <div className="score-card-label">Missing Skills</div>
                <div className="score-card-value">
                  {(result.missing_skills || []).length}
                  <span> gap{(result.missing_skills || []).length !== 1 ? 's' : ''}</span>
                </div>
                <div className="score-card-sub">
                  {(result.missing_skills || []).slice(0, 2).join(', ') || 'None — perfect!'}
                </div>
              </div>
            </div>
          )}

          {/* Middle section: Charts + Skills in one grid row */}
          {result && allSkills.length > 0 && (
            <div className="charts-row fade-in">
              <div className="chart-card chart-card-clickable" onClick={() => setActiveNav('radar')}>
                <div className="chart-card-title">Skill Radar <span className="chart-expand-hint">click to expand →</span></div>
                <div className="radar-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#eaedf2" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Proficiency" dataKey="value" stroke="#1a56db" fill="#1a56db" fillOpacity={0.12} strokeWidth={2} dot={{ fill: '#1a56db', r: 3 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card chart-card-clickable" onClick={() => setActiveNav('pie')}>
                <div className="chart-card-title">Skill Distribution <span className="chart-expand-hint">click to expand →</span></div>
                <div className="pie-container">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        <Cell fill={COLORS.matched} />
                        <Cell fill={COLORS.missing} />
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {pieData.map((entry, i) => (
                      <div key={i} className="pie-legend-item">
                        <div className="pie-dot" style={{ background: i === 0 ? COLORS.matched : COLORS.missing }} />
                        <div className="pie-legend-text">
                          <strong>{entry.value}</strong>
                          <span>{i === 0 ? 'Matched' : 'Missing'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills breakdown */}
          {result && (
            <div className="skills-row fade-in">
              <div className="skills-card">
                <div className="skills-card-title">
                  Matched Skills <span className="badge badge-green">{(result.matched_skills || []).length}</span>
                </div>
                <div className="skill-tags">
                  {(result.matched_skills || []).length === 0
                    ? <span style={{ fontSize: 13, color: '#9ca3af' }}>No skills matched</span>
                    : (result.matched_skills || []).map(s => {
                        const lvl = levelMap[s.trim().toLowerCase()];
                        const c   = LEVEL_COLORS[lvl] || LEVEL_COLORS['Intermediate'];
                        return (
                          <span key={s} className="skill-tag skill-tag-matched skill-tag-with-level">
                            {s}
                            {lvl && (
                              <em style={{ fontStyle: 'normal', fontSize: 10, fontWeight: 600, marginLeft: 5, background: c.bg, color: c.color, padding: '1px 6px', borderRadius: 4, border: `1px solid ${c.border}` }}>
                                {lvl}
                              </em>
                            )}
                            <button className="btn-skill-delete" onClick={() => handleDeleteSkill(s)} title="Remove this skill">×</button>
                          </span>
                        );
                      })
                  }
                </div>
              </div>
              <div className="skills-card">
                <div className="skills-card-title">
                  Missing Skills <span className="badge badge-orange">{(result.missing_skills || []).length}</span>
                </div>
                <div className="skill-tags">
                  {(result.missing_skills || []).length === 0
                    ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>All skills matched! 🎉</span>
                    : (result.missing_skills || []).map(s => (
                        <span key={s} className="skill-tag skill-tag-missing">
                          {s}
                        </span>
                      ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Bonus Skills Card */}
          {bonusSkills.length > 0 && (
            <div className="bonus-skills-card fade-in">
              <div className="skills-card-title">
                ⭐ Bonus Skills
                <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginLeft: 8 }}>{bonusSkills.length}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>Extra skills you've added (outside role requirements)</span>
              </div>
              <div className="skill-tags" style={{ marginTop: 10 }}>
                {bonusSkills.map(s => {
                  const c = LEVEL_COLORS[s.level] || LEVEL_COLORS['Intermediate'];
                  return (
                    <span key={s.name} className="skill-tag skill-tag-with-level" style={{ background: c.bg, border: `1px solid ${c.border}`, color: '#374151' }}>
                      {s.name}
                      <em style={{ fontStyle: 'normal', fontSize: 10, fontWeight: 600, marginLeft: 5, background: 'rgba(0,0,0,0.06)', color: c.color, padding: '1px 6px', borderRadius: 4 }}>
                        {s.level}
                      </em>
                      <button className="btn-skill-delete" onClick={() => handleRemoveBonus(s.name)} title="Remove">×</button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="input-card fade-in" ref={inputCardRef}>
            <div className="input-card-title">Skill Input — Select Role, Level & Enter Skills</div>
            <div className="input-form-row">
              <select className="input-role-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="">Select a role...</option>
                {Object.keys(ROLE_SKILLS).sort((a, b) => a.localeCompare(b)).map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Skill search dropdown */}
              <div className="dash-skill-search-wrapper" ref={skillInputRef}>
                <div className={`dash-skill-input-wrap${skillDropOpen ? ' open' : ''}`}>
                  <span className="dash-skill-search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    className="input-skill-field dash-skill-input"
                    type="text"
                    placeholder="Search or type a skill..."
                    value={skillInput}
                    onChange={e => { setSkillInput(e.target.value); setSkillDropOpen(true); }}
                    onFocus={() => setSkillDropOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  {skillInput && (
                    <button className="dash-skill-clear" onClick={() => { setSkillInput(''); setSkillDropOpen(false); }}>×</button>
                  )}
                </div>

                {skillDropOpen && (
                  <div className="dash-skill-dropdown">
                    {filteredDashSkills.length === 0 && !skillInput ? (
                      <div className="dash-skill-empty">Type to search skills...</div>
                    ) : filteredDashSkills.length === 0 ? (
                      <div
                        className="dash-skill-custom"
                        onMouseDown={() => addSkill(skillInput)}
                      >
                        <span>✦</span>
                        <span>Add "<strong>{skillInput}</strong>" as custom skill</span>
                      </div>
                    ) : (
                      <>
                        {filteredDashSkills.map(s => (
                          <div
                            key={s}
                            className="dash-skill-item"
                            onMouseDown={() => addSkill(s)}
                          >
                            <span className="dash-skill-item-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                              </svg>
                            </span>
                            <span>{s}</span>
                          </div>
                        ))}
                        {skillInput && !ALL_SKILLS_LIST.includes(skillInput.toLowerCase()) && (
                          <div className="dash-skill-custom" onMouseDown={() => addSkill(skillInput)}>
                            <span>✦</span>
                            <span>Add "<strong>{skillInput}</strong>" as custom skill</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="input-level-group">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    type="button"
                    className={`level-btn-sm${level === l ? ' active-' + l.toLowerCase() : ''}`}
                    onClick={() => setLevel(l)}
                  >{l}</button>
                ))}
              </div>
              <button className="btn-run" onClick={handleRun} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Analyze'}
              </button>
            </div>
            {skills.length > 0 && (
              <div className="input-chips">
                {skills.map(s => {
                  const c = LEVEL_COLORS[s.level] || LEVEL_COLORS['Intermediate'];
                  return (
                    <div key={s.name} className="input-chip" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: c.color, background: 'rgba(0,0,0,0.05)', borderRadius: 4, padding: '1px 5px' }}>{s.level}</span>
                      <button onClick={() => removeSkill(s.name)}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
            {formError && <div className="alert-error">{formError}</div>}
          </div>



        </div>
      </div>
    </div>
  );
} 