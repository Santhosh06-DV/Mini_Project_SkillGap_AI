import React, { useState } from 'react';
import { AuthProvider, useAuth } from './component/AuthContext';
import LoginPage    from './component/LoginPage';
import SignupPage   from './component/SignupPage';
import Onboarding   from './component/Onboarding';
import Dashboard    from './component/Dashboard';
import SplashScreen from './component/Splashscreen';
import './App.css';

function AppRouter() {
  const { user, loading } = useAuth();
  const [page, setPage]         = useState('login');
  const [result, setResult]     = useState(null);
  const [usedSkills, setUsedSkills] = useState([]);
  // Show splash only once per session
  const [showSplash, setShowSplash] = useState(true);

  // Show splash first — before anything else
  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <span className="spinner" style={{ borderColor:'rgba(26,86,219,0.2)', borderTopColor:'#1a56db', width:28, height:28 }} />
      </div>
    );
  }

  /* ── Not logged in ── */
  if (!user) {
    if (page === 'signup') return <SignupPage onGoLogin={() => setPage('login')} />;
    return <LoginPage onGoSignup={() => setPage('signup')} />;
  }

  /* ── Logged in: fresh analysis result ── */
  if (result) {
    return (
      <Dashboard
        result={result}
        userSkills={usedSkills}
        onReanalyze={() => { setResult(null); setUsedSkills([]); }}
      />
    );
  }

  /* ── Returning user — load last result with skills_with_levels intact ── */
  if (!user.isNew && user.history && user.history.length > 0) {
    const last = user.history[user.history.length - 1];
    const skillsForMap = last.skills_with_levels?.length
      ? last.skills_with_levels
      : (last.user_skills || []);
    const enrichedLast = { ...last, skills_with_levels: skillsForMap };
    return (
      <Dashboard
        result={enrichedLast}
        userSkills={skillsForMap}
        onReanalyze={() => { setResult(null); setUsedSkills([]); }}
      />
    );
  }

  /* ── New user — onboarding ── */
  return (
    <Onboarding
      onResult={(res, skills) => {
        setResult(res);
        setUsedSkills(skills);
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}