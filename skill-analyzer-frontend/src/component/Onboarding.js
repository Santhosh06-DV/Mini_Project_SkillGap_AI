import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { analyzeSkills, JOB_ROLES, ROLE_SKILLS, LEVELS } from './api';
import Navbar from './Navbar';
import './Onboarding.css';

const ANALYZE_STEPS = [
  { icon: '🔍', text: 'Scanning your skill set...'    },
  { icon: '🎯', text: 'Matching role requirements...' },
  { icon: '📊', text: 'Calculating match score...'    },
  { icon: '✅', text: 'Analysis complete!'            },
];

function AnalyzingOverlay({ role }) {
  const [step, setStep]         = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    // Progress bar fills over ~3s reaching 100%
    let current = 0;
    const progressTimer = setInterval(() => {
      current += 0.5;
      if (current >= 100) { current = 100; clearInterval(progressTimer); }
      setProgress(current);
    }, 15);

    // Steps appear one by one spread across 3s
    const stepTimers = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2200),
      setTimeout(() => { setStep(4); setDone(true); }, 2900),
    ];

    return () => {
      clearInterval(progressTimer);
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="analyzing-overlay">
      <div className="analyzing-card">
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
        <div className="analyzing-progress-track">
          <div className="analyzing-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="analyzing-percent">{Math.min(Math.round(progress), 100)}%</div>
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

const LEVEL_COLORS = {
  'Basic':        { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Intermediate': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Expert':       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

// Job roles sorted A→Z — use actual role names from ROLE_SKILLS
const SORTED_ROLES = Object.keys(ROLE_SKILLS).sort((a, b) => a.localeCompare(b));

// All unique skills — use the full list from api.js (already sorted A→Z)
const ALL_SKILLS = JOB_ROLES;

export default function Onboarding({ onResult }) {
  const { user, saveResult } = useAuth();

  // Role dropdown
  const [roleInput, setRoleInput]       = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roleDropOpen, setRoleDropOpen] = useState(false);
  const roleWrapperRef                  = useRef(null);

  // Skill dropdown
  const [skillInput, setSkillInput]       = useState('');
  const [skillDropOpen, setSkillDropOpen] = useState(false);
  const skillWrapperRef                   = useRef(null);
  const [level, setLevel]                 = useState('Intermediate');
  const [skills, setSkills]               = useState([]);

  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  // Filtered roles A→Z
  const filteredRoles = SORTED_ROLES.filter(r =>
    r.toLowerCase().includes(roleInput.toLowerCase())
  );

  // Filtered skills A→Z — exclude already added
  const addedNames = new Set(skills.map(s => s.name.toLowerCase()));
  const filteredSkills = ALL_SKILLS.filter(s =>
    s.includes(skillInput.toLowerCase()) && !addedNames.has(s)
  );

  // Close role dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (roleWrapperRef.current && !roleWrapperRef.current.contains(e.target))
        setRoleDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close skill dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (skillWrapperRef.current && !skillWrapperRef.current.contains(e.target))
        setSkillDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Role handlers
  const handleRoleInputChange = (e) => {
    setRoleInput(e.target.value);
    setSelectedRole('');
    setRoleDropOpen(true);
  };
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setRoleInput(role);
    setRoleDropOpen(false);
  };

  // Skill handlers
  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
    setSkillDropOpen(true);
  };
  const handleSkillSelect = (skillName) => {
    const trimmed = skillName.trim().toLowerCase();
    if (!trimmed || skills.find(s => s.name === trimmed)) {
      setSkillInput(''); setSkillDropOpen(false); return;
    }
    setSkills(prev => [...prev, { name: trimmed, level }]);
    setSkillInput('');
    setSkillDropOpen(false);
  };
  const addCustomSkill = () => {
    const trimmed = skillInput.trim().toLowerCase();
    if (!trimmed) return;
    if (skills.find(s => s.name === trimmed)) { setSkillInput(''); return; }
    setSkills(prev => [...prev, { name: trimmed, level }]);
    setSkillInput('');
    setSkillDropOpen(false);
  };
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there are matching skills in dropdown, pick the first match
      if (filteredSkills.length > 0) {
        handleSkillSelect(filteredSkills[0]);
      } else {
        // No match found — add as custom skill
        addCustomSkill();
      }
    }
    if (e.key === 'Escape') setSkillDropOpen(false);
  };
  const removeSkill = (name) => setSkills(prev => prev.filter(s => s.name !== name));

  // Analyze
  const handleAnalyze = async () => {
    setError('');
    if (!selectedRole)       { setError('Please select a job role from the dropdown.'); return; }
    if (skills.length === 0) { setError('Please add at least one skill.'); return; }
    setLoading(true);
    setShowAnalyzing(true);

    // Run API + 3-second animation in parallel; wait for both
    const animationDone = new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const [result] = await Promise.all([
        analyzeSkills(skills, selectedRole),
        animationDone,
      ]);
      if (result.error) {
        setError(result.error);
        setShowAnalyzing(false);
        setLoading(false);
        return;
      }
      saveResult({ ...result, user_skills: skills });
      // Small pause to show ✅ complete state before transition
      setTimeout(() => {
        setShowAnalyzing(false);
        onResult(result, skills);
      }, 700);
    } catch (e) {
      setError(e.message || 'Could not reach backend. Is Spring Boot running?');
      setShowAnalyzing(false);
    }
    setLoading(false);
  };

  return (
    <div className="onboarding-root">
      {showAnalyzing && <AnalyzingOverlay role={selectedRole} />}
      <Navbar />
      <div className="onboarding-body">
        <div className="onboarding-card">
          <div className="onboarding-welcome">
            <h2>Welcome, {user?.name?.split(' ')[0]}! 👋</h2>
            <p>Pick your target role and enter the skills you have with your proficiency level.</p>
          </div>

          {/* Step 1 — Role */}
          <div className="onboarding-step-label">Step 1 — Choose your target role</div>
          <div className="role-search-wrapper" ref={roleWrapperRef}>
            <div className={`role-search-input-wrap${roleDropOpen ? ' open' : ''}${selectedRole ? ' selected' : ''}`}>
              <span className="role-search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input type="text" className="role-search-input" placeholder="Search a job role..."
                value={roleInput} onChange={handleRoleInputChange} onFocus={() => setRoleDropOpen(true)} autoComplete="off"
              />
              {selectedRole && (
                <span className="role-selected-check">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
              <span className={`role-chevron${roleDropOpen ? ' flipped' : ''}`} onClick={() => setRoleDropOpen(v => !v)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
            {roleDropOpen && (
              <div className="role-dropdown">
                {filteredRoles.length === 0 ? (
                  <div className="role-dropdown-empty">No roles found</div>
                ) : filteredRoles.map(role => (
                  <div key={role} className={`role-dropdown-item${selectedRole === role ? ' active' : ''}`} onMouseDown={() => handleRoleSelect(role)}>
                    <span className="role-dropdown-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      </svg>
                    </span>
                    <span>{role}</span>
                    {selectedRole === role && (
                      <span className="role-dropdown-tick">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Skills */}
          <div className="onboarding-step-label">Step 2 — Enter your current skills</div>
          <div className="skill-input-area">
            <label>Select your proficiency level, then search and add skills</label>

            {/* Level buttons */}
            <div className="level-select-wrap" style={{ marginBottom: 10 }}>
              {LEVELS.map(l => (
                <button key={l} type="button"
                  className={`level-btn${level === l ? ' active-' + l.toLowerCase() : ''}`}
                  onClick={() => setLevel(l)}
                >{l}</button>
              ))}
            </div>

            {/* Skill search dropdown */}
            <div className="skill-search-wrapper" ref={skillWrapperRef}>
              <div className={`skill-search-input-wrap${skillDropOpen ? ' open' : ''}`}>
                <span className="skill-search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input type="text" className="skill-search-input"
                  placeholder="Search or type a skill (e.g. python, react...)"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onFocus={() => setSkillDropOpen(true)}
                  onKeyDown={handleSkillKeyDown}
                  autoComplete="off"
                />
                {skillInput && (
                  <button className="skill-add-inline-btn" onMouseDown={addCustomSkill} type="button">+ Add</button>
                )}
                <span className={`skill-chevron${skillDropOpen ? ' flipped' : ''}`} onClick={() => setSkillDropOpen(v => !v)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>

              {skillDropOpen && (
                <div className="skill-dropdown">
                  {filteredSkills.length === 0 && !skillInput ? (
                    <div className="skill-dropdown-empty">All skills already added!</div>
                  ) : filteredSkills.length === 0 && skillInput ? (
                    <div className="skill-dropdown-custom" onMouseDown={addCustomSkill}>
                      <span className="skill-dropdown-custom-icon">✦</span>
                      <span>Add "<strong>{skillInput}</strong>" as custom skill</span>
                    </div>
                  ) : (
                    <>
                      {filteredSkills.map(skill => (
                        <div key={skill} className="skill-dropdown-item" onMouseDown={() => handleSkillSelect(skill)}>
                          <span className="skill-dropdown-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                          </span>
                          <span>{skill}</span>
                        </div>
                      ))}
                      {skillInput && !ALL_SKILLS.includes(skillInput.toLowerCase()) && (
                        <div className="skill-dropdown-custom" onMouseDown={addCustomSkill}>
                          <span className="skill-dropdown-custom-icon">✦</span>
                          <span>Add "<strong>{skillInput}</strong>" as custom skill</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Skill chips */}
            <div className="skill-chips">
              {skills.length === 0
                ? <span className="skills-empty">No skills added yet</span>
                : skills.map(s => {
                    const c = LEVEL_COLORS[s.level];
                    return (
                      <div key={s.name} className="skill-chip" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <span style={{ color: '#374151', fontWeight: 500 }}>{s.name}</span>
                        <span className="skill-chip-level" style={{ color: c.color, background: 'rgba(0,0,0,0.05)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>{s.level}</span>
                        <button onClick={() => removeSkill(s.name)} style={{ color: '#9ca3af' }}>×</button>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button className="btn-analyze" onClick={handleAnalyze} disabled={loading}>
            {loading ? <><span className="spinner" /> Analyzing...</> : 'Analyze My Skills →'}
          </button>
        </div>
      </div>
    </div>
  );
}