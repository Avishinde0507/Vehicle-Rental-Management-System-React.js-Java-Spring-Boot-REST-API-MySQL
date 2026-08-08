import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { vehicleAPI } from '../services/api';
import Sidebar from '../components/Sidebar';

const NAV_ITEMS = [
  { key: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { key: 'fleet', icon: 'fa-car', label: 'My Vehicles' },
  { key: 'bookings', icon: 'fa-clipboard-list', label: 'Booking Requests' },
  { key: 'active', icon: 'fa-road', label: 'Active Rentals' },
];

export default function UpdateVehicle() {
  const { id } = useParams();
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const [vehicleForm, setVehicleForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleForm({ ...vehicleForm, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Document file size should be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleForm(prev => ({ ...prev, [field]: reader.result }));
        const label = field === 'rcDocument' ? 'RC Book' : field === 'insuranceDocument' ? 'Insurance' : 'PUC';
        showToast(`${label} document uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'owner') { navigate('/login'); return; }

    async function load() {
      try {
        const v = await vehicleAPI.getById(id);
        if (v.ownerId !== currentUser.id) {
          showToast('Unauthorized access.', 'error');
          navigate('/owner');
          return;
        }
        setVehicleForm(v);
        if (v.image) setImagePreview(v.image);
      } catch {
        showToast('Vehicle not found.', 'error');
        navigate('/owner');
      }
    }
    load();
  }, [currentUser, navigate, id, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vehicleAPI.update(id, {
        ...vehicleForm,
        priceDaily: Number(vehicleForm.priceDaily),
        priceWeekly: Number(vehicleForm.priceWeekly),
        priceMonthly: Number(vehicleForm.priceMonthly),
        seats: Number(vehicleForm.seats),
      });
      showToast('Vehicle updated successfully!');
      navigate('/owner');
    } catch (err) {
      showToast(err.message || 'Failed to update vehicle.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !vehicleForm) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar navItems={NAV_ITEMS} activeSection="fleet" onSectionChange={() => navigate('/owner')} />
      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/owner')} style={{ padding: '8px' }}>
              <i className="fas fa-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
            <div>
              <h1>Update Vehicle</h1>
              <p>Edit details for {vehicleForm.name} ({vehicleForm.regNumber})</p>
            </div>
          </div>
        </div>

        <div className="panel animate-visible">
          <div className="panel-header"><h2>Vehicle Information</h2></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Image</label>
                <div className="image-upload-area" style={{
                  border: '2px dashed var(--glass-border)',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }} 
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                  
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain', boxShadow: 'var(--shadow-md)' }} />
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setVehicleForm({...vehicleForm, image: ''}); }}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '10px',
                          background: 'var(--danger)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                          zIndex: 10
                        }}
                        title="Remove Image"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        background: 'rgba(0, 206, 201, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '15px',
                        border: '1px solid rgba(0, 206, 201, 0.2)'
                      }}>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}></i>
                      </div>
                      <h4 style={{ margin: '0', fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Upload New Photo</h4>
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>High quality photos help you earn more. PNG, JPG or WEBP (Max 5MB)</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Name</label>
                  <input type="text" required value={vehicleForm.name}
                    onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input type="text" required value={vehicleForm.brand}
                    onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Model Year</label>
                  <input type="text" required value={vehicleForm.model}
                    onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select required value={vehicleForm.type}
                    onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value })}>
                    <option value="2W">2-Wheeler</option>
                    <option value="4W">4-Wheeler</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Seats</label>
                  <input type="number" required value={vehicleForm.seats}
                    onChange={e => setVehicleForm({ ...vehicleForm, seats: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fuel Type</label>
                  <select value={vehicleForm.fuel}
                    onChange={e => setVehicleForm({ ...vehicleForm, fuel: e.target.value })}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Transmission</label>
                  <select value={vehicleForm.transmission}
                    onChange={e => setVehicleForm({ ...vehicleForm, transmission: e.target.value })}>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Registration Number</label>
                  <input type="text" readOnly disabled
                    style={{ background: 'var(--bg-card)', cursor: 'not-allowed' }}
                    value={vehicleForm.regNumber} />
                  <small className="text-muted">Registration number cannot be changed.</small>
                </div>
              </div>

              <div className="form-divider" style={{ margin: '20px 0', height: '1px', background: 'var(--glass-border)' }}></div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Pricing Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Daily Price (₹)</label>
                  <input type="number" required value={vehicleForm.priceDaily}
                    onChange={e => setVehicleForm({ ...vehicleForm, priceDaily: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Weekly Price (₹)</label>
                  <input type="number" required value={vehicleForm.priceWeekly}
                    onChange={e => setVehicleForm({ ...vehicleForm, priceWeekly: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Monthly Price (₹)</label>
                  <input type="number" required value={vehicleForm.priceMonthly}
                    onChange={e => setVehicleForm({ ...vehicleForm, priceMonthly: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Location</label>
                  <input type="text" required value={vehicleForm.location}
                    onChange={e => setVehicleForm({ ...vehicleForm, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={vehicleForm.status}
                    onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="rented">Rented (Automatic)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={vehicleForm.description}
                  onChange={e => setVehicleForm({ ...vehicleForm, description: e.target.value })}></textarea>
              </div>

              <div className="form-divider" style={{ margin: '24px 0', height: '1px', background: 'var(--glass-border)' }}></div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-file-contract" style={{ color: 'var(--accent)' }}></i> Vehicle Verification Documents
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '20px' }}>Manage & update legal registration & compliance documents for vehicle verification.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {/* RC Book */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: vehicleForm.rcDocument ? '1px solid var(--success)' : '1px dashed var(--glass-border)',
                  background: vehicleForm.rcDocument ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-primary)' }}>RC Book / Registration</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Required for verification</div>
                    </div>
                  </div>
                  {vehicleForm.rcDocument ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '.8rem', color: 'var(--success)', fontWeight: 600 }}><i className="fas fa-check-circle me-1"></i> Document Uploaded</span>
                      <button type="button" onClick={() => setVehicleForm({ ...vehicleForm, rcDocument: '' })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.85rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleDocumentChange(e, 'rcDocument')} style={{ display: 'none' }} />
                      <i className="fas fa-upload me-1"></i> Upload RC Book
                    </label>
                  )}
                </div>

                {/* Insurance */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: vehicleForm.insuranceDocument ? '1px solid var(--success)' : '1px dashed var(--glass-border)',
                  background: vehicleForm.insuranceDocument ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-primary)' }}>Insurance Policy</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Valid vehicle insurance</div>
                    </div>
                  </div>
                  {vehicleForm.insuranceDocument ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '.8rem', color: 'var(--success)', fontWeight: 600 }}><i className="fas fa-check-circle me-1"></i> Document Uploaded</span>
                      <button type="button" onClick={() => setVehicleForm({ ...vehicleForm, insuranceDocument: '' })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.85rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleDocumentChange(e, 'insuranceDocument')} style={{ display: 'none' }} />
                      <i className="fas fa-upload me-1"></i> Upload Insurance
                    </label>
                  )}
                </div>

                {/* PUC Certificate */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: vehicleForm.pucDocument ? '1px solid var(--success)' : '1px dashed var(--glass-border)',
                  background: vehicleForm.pucDocument ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                      <i className="fas fa-smog"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-primary)' }}>Pollution (PUC)</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Pollution under control</div>
                    </div>
                  </div>
                  {vehicleForm.pucDocument ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '.8rem', color: 'var(--success)', fontWeight: 600 }}><i className="fas fa-check-circle me-1"></i> Document Uploaded</span>
                      <button type="button" onClick={() => setVehicleForm({ ...vehicleForm, pucDocument: '' })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.85rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <input type="file" accept="image/*,application/pdf" onChange={e => handleDocumentChange(e, 'pucDocument')} style={{ display: 'none' }} />
                      <i className="fas fa-upload me-1"></i> Upload PUC
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} Update Vehicle
                </button>
                <button type="button" className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => navigate('/owner')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
