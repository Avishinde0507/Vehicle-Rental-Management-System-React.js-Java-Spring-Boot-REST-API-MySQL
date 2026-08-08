import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Sidebar({ navItems, activeSection, onSectionChange }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('vrms_sidebar_collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('vrms_sidebar_collapsed', collapsed);
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [collapsed]);

  const toggleFold = () => setCollapsed(prev => !prev);

  const avatarIcon = {
    customer: 'fa-user',
    owner: 'fa-building',
    admin: 'fa-user-shield',
  }[currentUser?.role] || 'fa-user';

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-toggle d-md-none" onClick={() => setOpen(!open)}>
        <i className="fas fa-bars"></i>
      </button>

      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center gap-2">
            <i className="fas fa-car-side" style={{ color: 'var(--accent)' }}></i>
            <span>Drive<span className="accent">X</span></span>
          </Link>
          <button 
            type="button" 
            className="sidebar-fold-btn d-none d-md-flex" 
            onClick={toggleFold} 
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ overflow: 'hidden' }} title={currentUser?.name || 'User'}>
            {currentUser?.profilePhoto ? (
               <img src={currentUser.profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               <i className={`fas ${avatarIcon}`}></i>
            )}
          </div>
          <div className="sidebar-user-info">
            <strong>{currentUser?.name || 'User'}</strong>
            <span style={{ textTransform: 'capitalize' }}>{currentUser?.role || ''}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <a
              key={item.key}
              href={`#${item.key}`}
              className={activeSection === item.key ? 'active' : ''}
              title={item.label}
              onClick={(e) => { e.preventDefault(); onSectionChange(item.key); setOpen(false); }}
            >
              <i className={`fas ${item.icon}`}></i> <span>{item.label}</span>
            </a>
          ))}
          <div className="nav-divider"></div>
          <Link to="/" title="Home"><i className="fas fa-home"></i> <span>Home</span></Link>
        </nav>

        <div className="sidebar-footer">
          <a href="#logout" title="Logout" onClick={(e) => { e.preventDefault(); logout(); navigate('/login'); }}>
            <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
          </a>
        </div>
      </aside>
    </>
  );
}
