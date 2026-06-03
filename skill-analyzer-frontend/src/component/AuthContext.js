import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BASE_URL = 'http://localhost:8080/api/users';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem('skillgap_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  // Signup
  const signup = async (name, email, password) => {
    try {
      const res  = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.message };

      const sessionUser = {
        id: data.id, name: data.name,
        email: data.email, history: [], isNew: true,
      };
      localStorage.setItem('skillgap_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Cannot connect to server.' };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const res  = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.message };

      const sessionUser = {
        id: data.id, name: data.name, email: data.email,
        history: data.history || [], isNew: data.isNew,
      };
      localStorage.setItem('skillgap_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Cannot connect to server.' };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('skillgap_user');
    setUser(null);
  };

  // Save Result
  const saveResult = async (result) => {
    if (!user?.id) return;
    try {
      await fetch(`${BASE_URL}/save-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:        user.id,
          role:          result.role,
          matchScore:    result.match_score,
          matchedSkills: (result.matched_skills || []).join(','),
          missingSkills: (result.missing_skills || []).join(','),
        }),
      });
      const updated = { ...user, history: [...(user.history || []), result], isNew: false };
      localStorage.setItem('skillgap_user', JSON.stringify(updated));
      setUser(updated);
    } catch (e) {
      console.error('Failed to save result:', e);
    }
  };

  // Delete Account
  const deleteAccount = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${BASE_URL}/${user.id}`, { method: 'DELETE' });
      localStorage.removeItem('skillgap_user');
      setUser(null);
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, saveResult, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}