import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Navbar.css';

export default function Navbar({ activeRole }) {
  const { user, logout, deleteAccount } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
    } else {
      deleteAccount();
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon"><span /></div>
        <h2>SkillGap<em>AI</em></h2>
      </div>
      <div className="navbar-right">
        {activeRole && (
          <div className="navbar-role-badge">{activeRole}</div>
        )}

        <div className="navbar-profile-wrap" ref={menuRef}>
          <button
            className={"navbar-avatar-btn" + (menuOpen ? ' open' : '')}
            onClick={() => { setMenuOpen(v => !v); setConfirmDelete(false); }}
            title={user?.name}
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="navbar-profile-menu">
              <div className="navbar-menu-user">
                <div className="navbar-menu-avatar">{initials}</div>
                <div className="navbar-menu-info">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>

              <div className="navbar-menu-divider" />

              <button className="navbar-menu-btn logout-btn" onClick={logout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>

              <button
                className={"navbar-menu-btn delete-btn" + (confirmDelete ? ' confirming' : '')}
                onClick={handleDeleteClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                {confirmDelete ? '⚠️ Confirm Delete?' : 'Delete Account'}
              </button>
              {confirmDelete && (
                <p className="navbar-delete-warn">⚠️ This will permanently delete your account and all data!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}