import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { currentUser, login, showToast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', password: '', phone: '', city: '', company: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const dashMap = { customer: '/customer', owner: '/owner', admin: '/admin' };
      navigate(dashMap[currentUser.role] || '/customer');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
    if (!loginData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!loginData.password) {
      showToast('Password is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.login(loginData.email, loginData.password);
      if (result.success) {
        login(result.user);
        showToast('Welcome back, ' + result.user.name + '!', 'success');
        const dashMap = { customer: '/customer', owner: '/owner', admin: '/admin' };
        setTimeout(() => navigate(dashMap[result.user.role] || '/customer'), 800);
      } else {
        showToast(result.message || 'Login failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Detailed Validation
    if (!regData.name.trim()) {
      showToast('Full Name is required.', 'error');
      return;
    }

    if (!regData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regData.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (regData.phone && !/^[6-9]\d{9}$/.test(regData.phone)) {
      showToast('Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    // Password Strength: Min 8 chars, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(regData.password)) {
      showToast('Password must be at least 8 characters long and contain both letters and numbers.', 'error');
      return;
    }

    if (selectedRole === 'owner' && !regData.company.trim()) {
      showToast('Agency/Fleet name is required for owners.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register({
        name: regData.name,
        email: regData.email,
        password: regData.password,
        role: selectedRole,
        phone: regData.phone || '',
        city: regData.city || '',
        company: regData.company || '',
      });
      if (result.success) {
        showToast('Account created successfully!', 'success');
        // Auto-login after register
        const loginResult = await authAPI.login(regData.email, regData.password);
        if (loginResult.success) {
          login(loginResult.user);
          const dashMap = { customer: '/customer', owner: '/owner', admin: '/admin' };
          setTimeout(() => navigate(dashMap[selectedRole] || '/customer'), 800);
        }
      } else {
        showToast(result.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="hero-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className={`auth-card animate-visible ${tab === 'register' ? 'register-mode' : 'glass-card'}`}>
        <Link to="/" className="logo">
          <i className="fas fa-car-side"></i>
          <span>Drive<span className="accent">X</span></span>
        </Link>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form className="auth-form active" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
                <input type="email" placeholder="name@example.com" required
                  value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Password <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input type={showLoginPass ? "text" : "password"} placeholder="••••••••" required
                  value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                <span className="pass-toggle" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLoginPass(prev => !prev); }}>
                  <i className={`fas ${showLoginPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '500' }}>
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>} Login
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form className="auth-form active" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Select Role</label>
              <div className="role-selector">
                {[
                  { role: 'customer', icon: 'fa-user', label: 'Customer' },
                  { role: 'owner', icon: 'fa-building', label: 'Renter Agency' },
                ].map(opt => (
                  <div key={opt.role}
                    className={`role-option ${selectedRole === opt.role ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(opt.role)}>
                    <i className={`fas ${opt.icon}`}></i>
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Full Name <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-user-circle"></i>
                <input type="text" placeholder="Enter your name" required
                  value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} />
              </div>
            </div>
            {selectedRole === 'owner' && (
              <div className="form-group">
                <label>Agency / Fleet Name <span className="required-asterisk">*</span></label>
                <div className="input-icon">
                  <i className="fas fa-id-card"></i>
                  <input type="text" placeholder="e.g. Mumbai Rentals" required
                    value={regData.company} onChange={e => setRegData({ ...regData, company: e.target.value })} />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Email Address <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-at"></i>
                <input type="email" placeholder="email@example.com" required
                  value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number <span className="required-asterisk">*</span></label>
                <div className="input-icon">
                  <i className="fas fa-phone-alt"></i>
                  <input type="tel" placeholder="Contact no." required
                    value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Location / City <span className="required-asterisk">*</span></label>
                <div className="input-icon">
                  <i className="fas fa-map-marked-alt"></i>
                  <input type="text" placeholder="e.g. Pune" required
                    value={regData.city} onChange={e => setRegData({ ...regData, city: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Secure Password <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-shield-alt"></i>
                <input type={showRegPass ? "text" : "password"} placeholder="Min 8 chars (Letter + Number)" required minLength="8"
                  value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} />
                <span className="pass-toggle" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRegPass(prev => !prev); }}>
                  <i className={`fas ${showRegPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg mt-3" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-plus"></i>} Create Account
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/"><i className="fas fa-arrow-left"></i><span>Home Page</span></Link>
        </div>
      </div>
    </div>
  );
}
