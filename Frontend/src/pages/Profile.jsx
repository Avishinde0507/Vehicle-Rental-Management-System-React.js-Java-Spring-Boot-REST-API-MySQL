import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { profileAPI, userAPI } from '../services/api';

export default function Profile() {
  const { currentUser, updateUser, showToast } = useApp();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    profilePhoto: '',
    emailVerified: false
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileAPI.getProfile();
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        address: data.address || '',
        profilePhoto: data.profilePhoto || '',
        emailVerified: data.emailVerified || false
      });
      updateUser(data);
    } catch (error) {
      // Fallback to local currentUser state if API fails or backend is not yet restarted
      if (currentUser) {
        setProfileData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          city: currentUser.city || '',
          address: currentUser.address || '',
          profilePhoto: currentUser.profilePhoto || '',
          emailVerified: currentUser.emailVerified || false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      return showToast('Name is required.', 'error');
    }
    if (!profileData.email || !profileData.email.trim()) {
      return showToast('Email address is required.', 'error');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      return showToast('Please enter a valid email address.', 'error');
    }

    setSaving(true);
    try {
      let result;
      try {
        result = await profileAPI.updateProfile(profileData);
      } catch (err) {
        // Fallback to legacy user update if backend endpoint not loaded yet
        result = await userAPI.update(currentUser.id, {
          ...currentUser,
          ...profileData
        });
      }
      if (result) {
        setProfileData(prev => ({ ...prev, ...result }));
        updateUser(result);
        setIsEditingEmail(false);
        showToast('Profile updated successfully.', 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      showToast('Image size should be less than 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, profilePhoto: reader.result }));
      showToast('New photo selected! Click "Save Changes" to save it.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const initiateEmailVerification = async () => {
    setSendingOtp(true);
    try {
      const result = await profileAPI.sendVerifyEmailOTP();
      if (result.success) {
        showToast(result.message, 'success');
        setShowOtpModal(true);
      } else {
        showToast(result.message || 'Failed to send OTP.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error sending OTP.', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return showToast('Please enter a valid 6-digit OTP.', 'warning');
    }
    setVerifyingOtp(true);
    try {
      const result = await profileAPI.verifyEmailOTP(otp);
      if (result.success) {
        showToast(result.message, 'success');
        setProfileData(prev => ({ ...prev, emailVerified: true }));
        updateUser({ ...currentUser, emailVerified: true });
        setShowOtpModal(false);
        setOtp('');
      } else {
        showToast(result.message || 'Invalid OTP.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error verifying OTP.', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword) return showToast('Old password is required.', 'error');
    if (!passwordData.newPassword) return showToast('New password is required.', 'error');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast('New passwords do not match.', 'error');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      return showToast('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character.', 'error');
    }

    setSaving(true);
    try {
      const result = await profileAPI.changePassword(passwordData.oldPassword, passwordData.newPassword);
      if (result.success) {
        showToast(result.message, 'success');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(result.message || 'Failed to change password.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'An error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-section active">
      <div className="page-header">
        <h1><i className="fas fa-user-cog" style={{ color: 'var(--accent)' }}></i> Manage Profile</h1>
        <p>View and update your personal information and security settings.</p>
      </div>

      {/* Horizontal Nav Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button 
          type="button"
          className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('overview')}
          style={{ padding: '10px 24px', fontWeight: 500, borderRadius: '8px' }}
        >
          <i className="fas fa-user me-2"></i> Overview
        </button>
        <button 
          type="button"
          className={`btn ${tab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('security')}
          style={{ padding: '10px 24px', fontWeight: 500, borderRadius: '8px' }}
        >
          <i className="fas fa-shield-alt me-2"></i> Security
        </button>
      </div>

      {/* Main Content Area */}
      {tab === 'overview' && (
        <div className="glass-card p-4">
          <h4 className="mb-4 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>Profile Overview</h4>
          <form onSubmit={handleProfileUpdate}>

            {/* Horizontal Layout: Avatar left | Fields right */}
            <div className="row g-4 align-items-start">

              {/* Left: Avatar */}
              <div className="col-md-3 text-center">
                <div
                  style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'var(--bg-body)', overflow: 'hidden', border: '3px solid var(--glass-border)', margin: '0 auto 12px' }}
                >
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: '3rem', color: 'var(--text-muted)', lineHeight: '110px' }}></i>
                  )}
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <i className="fas fa-camera me-1"></i> Change Photo
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>Max size: 2MB</div>
              </div>

              {/* Right: Fields in 2-column grid */}
              <div className="col-md-9">
                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">Full Name</label>
                    <input type="text" className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} required />
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label text-muted small fw-bold mb-0">Email Address</label>
                      <button 
                        type="button" 
                        className="btn btn-link p-0 text-decoration-none small" 
                        style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }} 
                        onClick={() => {
                          if (isEditingEmail) {
                            setProfileData(prev => ({ ...prev, email: currentUser?.email || '' }));
                          }
                          setIsEditingEmail(!isEditingEmail);
                        }}
                      >
                        <i className={`fas ${isEditingEmail ? 'fa-times me-1' : 'fa-pencil-alt me-1'}`}></i>
                        {isEditingEmail ? 'Cancel' : 'Edit Email'}
                      </button>
                    </div>
                    <div className="input-group">
                      <input 
                        type="email" 
                        className="form-control" 
                        disabled={!isEditingEmail} 
                        style={{ 
                          background: 'var(--bg-body)', 
                          color: 'var(--text-primary)', 
                          borderColor: isEditingEmail ? 'var(--accent)' : 'var(--glass-border)',
                          boxShadow: isEditingEmail ? '0 0 0 2px rgba(99, 102, 241, 0.25)' : 'none'
                        }}
                        value={profileData.email} 
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })} 
                        placeholder="Enter new email address"
                        required 
                      />
                      {isEditingEmail ? (
                        <span className="input-group-text bg-primary text-white border-primary fw-bold" style={{ fontSize: '0.8rem' }} title="Editing Mode">
                          <i className="fas fa-edit me-1"></i> Editing
                        </span>
                      ) : profileData.emailVerified ? (
                        <span className="input-group-text bg-success text-white border-success" title="Verified">
                          <i className="fas fa-check-circle me-1"></i> Verified
                        </span>
                      ) : (
                        <button type="button" className="btn btn-warning" onClick={initiateEmailVerification} disabled={sendingOtp}>
                          {sendingOtp ? <i className="fas fa-spinner fa-spin"></i> : 'Verify'}
                        </button>
                      )}
                    </div>
                    {isEditingEmail && (
                      <div className="form-text text-warning mt-1" style={{ fontSize: '0.75rem' }}>
                        <i className="fas fa-exclamation-circle me-1"></i>
                        Changing your email will require re-verifying your new email address.
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">Phone Number</label>
                    <input type="tel" className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">City</label>
                    <input type="text" className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-bold">Full Address</label>
                    <textarea className="form-control" rows="3" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)', resize: 'none' }}
                      value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} placeholder="Enter complete address"></textarea>
                  </div>

                  <div className="col-12">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
                      Save Changes
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* SECURITY TAB: 3 SEPARATE GLASS CARDS */}
      {tab === 'security' && (
        <div className="row g-4 align-items-start">
          {/* Card 1: Security Settings Form */}
          <div className="col-md-7">
            <div className="glass-card p-4">
              <h4 className="mb-4 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>Security Settings</h4>
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Current Password</label>
                  <div className="input-group">
                    <input type={showOldPass ? 'text' : 'password'} className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} required />
                    <button type="button" className="btn btn-outline" onClick={() => setShowOldPass(!showOldPass)}>
                      <i className={`fas ${showOldPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">New Password</label>
                  <div className="input-group">
                    <input type={showNewPass ? 'text' : 'password'} className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                    <button type="button" className="btn btn-outline" onClick={() => setShowNewPass(!showNewPass)}>
                      <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    Minimum 8 characters, must include uppercase, lowercase, number, and special character.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Confirm New Password</label>
                  <div className="input-group">
                    <input type={showConfirmPass ? 'text' : 'password'} className="form-control" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                      value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} required />
                    <button type="button" className="btn btn-outline" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                      <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-lock me-2"></i>}
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Separate Cards 2 & 3 */}
          <div className="col-md-5">
            {/* Card 2: Password Requirements */}
            <div className="glass-card p-4 mb-4">
              <h4 className="mb-3 pb-2 fw-bold" style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--accent)', fontSize: '1.05rem' }}>
                <i className="fas fa-shield-alt me-2"></i> Password Requirements
              </h4>
              <ul className="list-unstyled mb-0 text-muted small" style={{ fontSize: '0.85rem', lineHeight: '2' }}>
                <li><i className="fas fa-check text-success me-2"></i> At least 8 characters long</li>
                <li><i className="fas fa-check text-success me-2"></i> Upper & lowercase letters</li>
                <li><i className="fas fa-check text-success me-2"></i> At least 1 number (0-9)</li>
                <li><i className="fas fa-check text-success me-2"></i> At least 1 special character (@, $, !, %, _, etc.)</li>
              </ul>
            </div>

            {/* Card 3: Security Tips */}
            <div className="glass-card p-4">
              <h4 className="mb-3 pb-2 fw-bold text-warning" style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '1.05rem' }}>
                <i className="fas fa-lightbulb me-2"></i> Security Tips
              </h4>
              <ul className="list-unstyled mb-0 text-muted small" style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
                <li className="mb-2">• Never share your password or OTP code with anyone.</li>
                <li className="mb-2">• Use a unique password not shared with other sites.</li>
                <li className="mb-2">• Ensure your email address is verified for OTP account recovery.</li>
                <li>• Always log out after ending your session on shared devices.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Verify Email</h5>
                <button type="button" className="btn-close" style={{ filter: 'var(--invert-icon)' }} onClick={() => setShowOtpModal(false)}></button>
              </div>
              <div className="modal-body text-center pt-2">
                <p className="text-muted small mb-4">We've sent a 6-digit verification code to <strong>{profileData.email}</strong>.</p>
                <div className="mb-3 mx-auto" style={{ maxWidth: '200px' }}>
                  <input 
                    type="text" 
                    className="form-control text-center fs-4 fw-bold" 
                    maxLength="6"
                    placeholder="------"
                    style={{ letterSpacing: '8px', background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary w-100 mb-2" 
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                >
                  {verifyingOtp ? <i className="fas fa-spinner fa-spin me-2"></i> : 'Verify Code'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost w-100" 
                  onClick={initiateEmailVerification}
                  disabled={sendingOtp}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
