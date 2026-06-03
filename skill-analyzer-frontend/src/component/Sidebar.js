import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
];

const CHART_ITEMS = [
  { key: 'radar',  label: 'Radar Chart' },
  { key: 'pie',    label: 'Pie Chart' },
];

export default function Sidebar({ active, onNavigate, hasResult }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section-label">Main</div>
      {NAV_ITEMS.map(item => (
        <div
          key={item.key}
          className={`sidebar-item${active === item.key ? ' active' : ''}`}
          onClick={() => onNavigate(item.key)}
        >
          <div className="sidebar-dot" />
          <span className="sidebar-label">{item.label}</span>
        </div>
      ))}

      {hasResult && (
        <>
          <div className="sidebar-section-label">Charts</div>
          {CHART_ITEMS.map(item => (
            <div
              key={item.key}
              className={`sidebar-item${active === item.key ? ' active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <div className="sidebar-dot" />
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
        </>
      )}

      <div className="sidebar-cta">
        <strong>Skill Input</strong>
        <span>Add skills and re-analyze to improve your score</span>
      </div>
    </div>
  );
}