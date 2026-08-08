import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ForgotPassword() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.sendOTP(email);
      if (result.success) {
        setStep(2);
        showToast('OTP sent successfully to your email!', 'success');
      } else {
        showToast(result.message || 'Failed to send OTP.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      showToast('Please enter a valid OTP.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.verifyOTP(email, otp);
      if (result.success) {
        setStep(3);
        showToast('OTP verified successfully! Set your new password.', 'success');
      } else {
        showToast(result.message || 'Invalid OTP. Please try again.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to verify OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.resetPassword(email, otp, newPassword);
      if (result.success) {
        showToast('Password reset successful! Please login with your new password.', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showToast(result.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to reset password. Please try again.', 'error');
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

      <div className="auth-card animate-visible glass-card">
        <Link to="/" className="logo">
          <i className="fas fa-car-side"></i>
          <span>Drive<span className="accent">X</span></span>
        </Link>

        <div className="auth-header text-center mb-4">
          <h2 className="fw-bold mb-2">Forgot Password</h2>
          <p className="text-muted small">
            {step === 1 && "Enter your email address to receive a one-time password (OTP)."}
            {step === 2 && "Enter the OTP sent to your email address."}
            {step === 3 && "Set your new password and confirm it below."}
          </p>
        </div>

        {/* STEP 1: SEND OTP */}
        {step === 1 && (
          <form className="auth-form active" onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Email Address <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg mt-3" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>} Send OTP
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 2 && (
          <form className="auth-form active" onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-key"></i>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg mt-3" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>} Verify OTP
            </button>
            <button type="button" className="btn btn-link btn-block mt-2 text-muted small" onClick={handleSendOTP} disabled={loading}>
              Resend OTP
            </button>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
          <form className="auth-form active" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <span className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password <span className="required-asterisk">*</span></label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <span className="pass-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg mt-3" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-key"></i>} Reset Password
            </button>
          </form>
        )}

        <div className="auth-footer mt-4">
          <Link to="/login"><i className="fas fa-arrow-left"></i><span>Back to Login</span></Link>
        </div>
      </div>
    </div>
  );
}
