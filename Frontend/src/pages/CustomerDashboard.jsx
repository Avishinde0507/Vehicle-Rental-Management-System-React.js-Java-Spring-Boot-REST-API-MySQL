import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { vehicleAPI, bookingAPI, reviewAPI, complaintAPI } from '../services/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Profile from './Profile';

const NAV_ITEMS = [
  { key: 'browse', icon: 'fa-search', label: 'Browse Vehicles' },
  { key: 'bookings', icon: 'fa-calendar-alt', label: 'My Bookings' },
  { key: 'reviews', icon: 'fa-star', label: 'My Reviews' },
  { key: 'complaints', icon: 'fa-exclamation-triangle', label: 'My Complaints' },
  { key: 'profile', icon: 'fa-user-cog', label: 'Manage Profile' },
];

function VehicleCard({ v, onBook }) {
  const fuelIcon = v.fuel === 'Electric' ? 'fa-charging-station' : 'fa-gas-pump';
  const tagClass = v.type === '2W' ? 'eco' : (v.priceDaily >= 3000 ? 'premium' : '');
  return (
    <div className="vehicle-card-sm">
      <div className="card-img" style={{ background: v.image && v.image.startsWith('data:image') ? '#fff' : 'transparent' }}>
        {v.image && v.image.startsWith('data:image') ? (
          <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${v.color || 'var(--accent)'}, #0a0a0a)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`fas ${v.image || 'fa-car'}`} style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.1)' }}></i>
          </div>
        )}
        <span className={`vehicle-badge-tag ${tagClass}`} title={v.type === '2W' ? 'Bike' : 'Car'}>
          <i className={`fas ${v.type === '2W' ? 'fa-motorcycle' : 'fa-car'}`}></i>
        </span>
      </div>
      <div className="card-body">
        <h3>{v.name}</h3>
        <div className="specs">
          <span><i className={`fas ${fuelIcon}`}></i> {v.fuel}</span>
          <span><i className="fas fa-cog"></i> {v.transmission}</span>
          <span><i className="fas fa-user-friends"></i> {v.seats}</span>
          <span><i className="fas fa-map-marker-alt"></i> {v.location}</span>
        </div>
        <div className="pricing-tiers mb-2">
          <div className="pricing-tier"><div className="tier-label">Daily</div><div className="tier-price">{formatPrice(v.priceDaily)}</div></div>
          <div className="pricing-tier"><div className="tier-label">Weekly</div><div className="tier-price">{formatPrice(v.priceWeekly)}</div></div>
          <div className="pricing-tier"><div className="tier-label">Monthly</div><div className="tier-price">{formatPrice(v.priceMonthly)}</div></div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary btn-block" onClick={() => onBook(v)}>
            <i className="fas fa-calendar-plus"></i> View Details & Book
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { currentUser, showToast, theme, toggleTheme, updateUser } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('browse');
  const [allVehicles, setAllVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicleMap, setVehicleMap] = useState({});
  const [filters, setFilters] = useState({ search: '', type: '', fuel: '', priceRange: '' });
  const [myReviews, setMyReviews] = useState([]);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Complaints state
  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintModal, setComplaintModal] = useState({ open: false });
  const [complaintForm, setComplaintForm] = useState({ vehicleName: '', subject: '', description: '', priority: 'MEDIUM' });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [resolveViewModal, setResolveViewModal] = useState({ open: false, complaint: null });
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') { navigate('/login'); return; }
  }, [currentUser, navigate]);

  // Load available vehicles once
  useEffect(() => {
    async function load() {
      try {
        const list = await vehicleAPI.getAvailable();
        setAllVehicles(list);
      } catch {
        showToast('Failed to load vehicles.', 'error');
      }
    }
    load();
  }, [showToast]);

  // Load bookings when switching to that section
  useEffect(() => {
    if (section !== 'bookings' || !currentUser) return;
    async function load() {
      try {
        const [bList, vList] = await Promise.all([
          bookingAPI.getByCustomer(currentUser.id),
          vehicleAPI.getAll(),
        ]);
        const map = {};
        if (Array.isArray(vList)) {
          vList.forEach(v => { if (v && (v.id || v._id)) map[v.id || v._id] = v; });
        }
        setVehicleMap(map);
        setBookings(Array.isArray(bList) ? bList : []);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        showToast('Failed to load bookings. ' + (err.message || ''), 'error');
      }
    }
    load();
  }, [section, currentUser, showToast]);

  // Client-side filtering
  const vehicles = allVehicles.filter(v => {
    const q = filters.search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) || v.location.toLowerCase().includes(q);
    const matchType = !filters.type || v.type === filters.type;
    const matchFuel = !filters.fuel || v.fuel === filters.fuel;
    let matchPrice = true;
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      matchPrice = v.priceDaily >= min && v.priceDaily <= max;
    }
    return matchSearch && matchType && matchFuel && matchPrice;
  });



  // Load my reviews when section is reviews
  useEffect(() => {
    if (section !== 'reviews' || !currentUser) return;
    Promise.all([
      reviewAPI.getByCustomer(currentUser.id),
      vehicleAPI.getAll()
    ])
      .then(([list, vList]) => {
        setMyReviews(Array.isArray(list) ? list : []);
        const map = {};
        if (Array.isArray(vList)) {
          vList.forEach(v => { if (v && (v.id || v._id)) map[v.id || v._id] = v; });
        }
        setVehicleMap(map);
      })
      .catch(() => {});
  }, [section, currentUser]);

  // Track which completed bookings are already reviewed
  useEffect(() => {
    if (!currentUser || bookings.length === 0) return;
    const completedIds = bookings.filter(b => b.status === 'completed').map(b => b.id);
    Promise.all(completedIds.map(id => reviewAPI.checkReviewed(id).then(r => ({ id, reviewed: r.reviewed })).catch(() => ({ id, reviewed: false }))))
      .then(results => {
        const reviewed = new Set(results.filter(r => r.reviewed).map(r => r.id));
        setReviewedBookings(reviewed);
      });
  }, [bookings, currentUser]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.updateStatus(id, 'cancelled');
      showToast('Booking cancelled successfully.');
      const bList = await bookingAPI.getByCustomer(currentUser.id);
      setBookings(bList);
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking.', 'error');
    }
  };

  const openReviewModal = (booking) => {
    setReviewModal({ open: true, booking });
    setReviewForm({ rating: 5, feedback: '' });
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.feedback.trim()) return showToast('Please write your feedback.', 'error');
    const booking = reviewModal.booking;
    const vehicle = vehicleMap[booking.vehicleId] || {};
    setReviewSubmitting(true);
    try {
      await reviewAPI.create({
        bookingId: booking.id,
        customerId: currentUser.id,
        customerName: currentUser.name,
        ownerId: vehicle.ownerId || booking.ownerId || '',
        vehicleId: booking.vehicleId || '',
        rating: reviewForm.rating,
        feedback: reviewForm.feedback.trim(),
      });
      showToast('Review submitted successfully! Thank you.', 'success');
      setReviewModal({ open: false, booking: null });
      setReviewedBookings(prev => new Set([...prev, booking.id]));
      // Refresh my reviews
      const list = await reviewAPI.getByCustomer(currentUser.id);
      setMyReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Load complaints when section changes
  useEffect(() => {
    if (section !== 'complaints' || !currentUser) return;
    complaintAPI.getByCustomer(currentUser.id)
      .then(data => setMyComplaints(Array.isArray(data) ? data : []))
      .catch(() => showToast('Failed to load complaints.', 'error'));
  }, [section, currentUser, showToast]);

  const handleSubmitComplaint = async () => {
    if (!complaintForm.subject.trim()) return showToast('Please select a subject category.', 'error');
    if (!complaintForm.description.trim()) return showToast('Please describe your complaint.', 'error');
    setComplaintSubmitting(true);
    try {
      await complaintAPI.create({
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        vehicleName: complaintForm.vehicleName ? complaintForm.vehicleName.trim() : null,
        subject: complaintForm.subject.trim(),
        description: complaintForm.description.trim(),
        priority: complaintForm.priority,
      });
      showToast('Complaint filed successfully!', 'success');
      setComplaintModal({ open: false });
      setComplaintForm({ vehicleName: '', subject: '', description: '', priority: 'MEDIUM' });
      const data = await complaintAPI.getByCustomer(currentUser.id);
      setMyComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to file complaint.', 'error');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-layout" data-theme={theme}>
      <Sidebar navItems={NAV_ITEMS} activeSection={section} onSectionChange={setSection} />
      <main className="main-content" style={{ position: 'relative' }}>
        <div className="dashboard-header-actions" style={{ position: 'absolute', top: '24px', right: '36px', zIndex: 10 }}>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              color: 'var(--accent)',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>

        {section === 'browse' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-search" style={{ color: 'var(--accent)' }}></i> Browse Vehicles</h1>
              <p>Search and filter from our fleet of 2-wheelers and 4-wheelers.</p>
            </div>
            {/* Search Filter 4 Separate Glass Cards Row */}
            <div className="row g-3 mb-4">
              {/* Card 1: Search Input */}
              <div className="col-lg-5 col-md-12">
                <div className="glass-card p-2 h-100 d-flex align-items-center">
                  <div className="position-relative w-100">
                    <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input 
                      type="text" 
                      className="form-control ps-5 border-0" 
                      style={{ background: 'transparent', color: 'var(--text-primary)', shadow: 'none' }}
                      placeholder="Search by name, brand, or location..."
                      value={filters.search} 
                      onChange={e => setFilters({ ...filters, search: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: All Types Dropdown */}
              <div className="col-lg-2 col-md-4">
                <div className="glass-card p-2 h-100 d-flex align-items-center">
                  <select 
                    className="form-select border-0" 
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                    value={filters.type} 
                    onChange={e => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>All Types</option>
                    <option value="2W" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Bike / Scooter</option>
                    <option value="4W" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Car / SUV</option>
                  </select>
                </div>
              </div>

              {/* Card 3: All Fuels Dropdown */}
              <div className="col-lg-2 col-md-4">
                <div className="glass-card p-2 h-100 d-flex align-items-center">
                  <select 
                    className="form-select border-0" 
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                    value={filters.fuel} 
                    onChange={e => setFilters({ ...filters, fuel: e.target.value })}
                  >
                    <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>All Fuels</option>
                    <option value="Petrol" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Petrol</option>
                    <option value="Diesel" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Diesel</option>
                    <option value="Electric" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Electric</option>
                    <option value="CNG" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>CNG</option>
                  </select>
                </div>
              </div>

              {/* Card 4: Any Price Dropdown */}
              <div className="col-lg-3 col-md-4">
                <div className="glass-card p-2 h-100 d-flex align-items-center">
                  <select 
                    className="form-select border-0" 
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                    value={filters.priceRange} 
                    onChange={e => setFilters({ ...filters, priceRange: e.target.value })}
                  >
                    <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Any Price</option>
                    <option value="0-500" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Under ₹500/day</option>
                    <option value="500-1000" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>₹500 – ₹1,000</option>
                    <option value="1000-3000" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>₹1,000 – ₹3,000</option>
                    <option value="3000-99999" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>₹3,000+</option>
                  </select>
                </div>
              </div>
            </div>
            {vehicles.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-search"></i>
                <h3>No vehicles found</h3>
                <p>Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="vehicles-grid">
                {vehicles.map(v => (
                  <VehicleCard key={v.id} v={v} onBook={(v) => navigate(`/customer/book/${v.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'bookings' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-calendar-alt" style={{ color: 'var(--accent)' }}></i> My Bookings</h1>
              <p>View and track all your vehicle bookings.</p>
            </div>
            {bookings.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <h3>No bookings yet</h3>
                <p>Browse our vehicles and make your first booking!</p>
              </div>
            ) : (
              <div className="panel">
                <div className="panel-body no-pad">
                  <div className="table-wrapper">
                    <table className="table table-hover mb-0">
                      <thead><tr><th>Booking ID</th><th>Vehicle</th><th>Duration</th><th>Dates</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td>
                              {typeof b.vehicleId === 'object' 
                                ? b.vehicleId?.name 
                                : (vehicleMap[b.vehicleId]?.name || b.vehicleId)}
                            </td>
                            <td><span className="badge bg-primary text-capitalize">{b.durationType}</span></td>
                            <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                            <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                            <td>
                              <span style={{
                                padding: '3px 10px', borderRadius: '12px', fontSize: '.78rem', fontWeight: 600,
                                background: b.paymentStatus === 'paid' ? 'rgba(0,184,148,0.15)' : b.paymentStatus === 'refunded' ? 'rgba(253,203,110,0.15)' : 'rgba(255,255,255,0.08)',
                                color: b.paymentStatus === 'paid' ? '#00b894' : b.paymentStatus === 'refunded' ? '#fdcb6e' : 'var(--text-muted)',
                                border: `1px solid ${b.paymentStatus === 'paid' ? '#00b894' : b.paymentStatus === 'refunded' ? '#fdcb6e' : 'var(--glass-border)'}`,
                                textTransform: 'uppercase', letterSpacing: '.5px',
                              }}>
                                {b.paymentStatus === 'paid' ? '✓ Paid' : b.paymentStatus === 'refunded' ? '↩ Refunded' : '— Unpaid'}
                              </span>
                              {b.paymentMethod && (
                                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '3px', textTransform: 'capitalize' }}>
                                  <i className={`fas ${b.paymentMethod === 'upi' ? 'fa-mobile-alt' : b.paymentMethod === 'card' ? 'fa-credit-card' : 'fa-university'}`} style={{ marginRight: 4 }}></i>
                                  {b.paymentMethod === 'upi' ? 'UPI' : b.paymentMethod === 'card' ? 'Card' : 'Net Banking'}
                                </div>
                              )}
                            </td>
                            <td><StatusBadge status={b.status} /></td>
                            <td>
                              {b.status === 'pending' && (
                                <button className="btn btn-danger btn-xs" onClick={() => handleCancelBooking(b.id)}>
                                  <i className="fas fa-times me-1"></i> Cancel
                                </button>
                              )}
                              {b.status === 'completed' && !reviewedBookings.has(b.id) && (
                                <button className="btn btn-warning btn-xs" style={{ color: '#020617', fontWeight: 700 }} onClick={() => openReviewModal(b)}>
                                  <i className="fas fa-star me-1"></i> Review
                                </button>
                              )}
                              {b.status === 'completed' && reviewedBookings.has(b.id) && (
                                <span style={{ color: 'var(--accent)', fontSize: '.8rem' }}><i className="fas fa-check-circle me-1"></i>Reviewed</span>
                              )}
                              {b.status !== 'pending' && b.status !== 'completed' && <span className="text-muted">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* My Reviews Section */}
        {section === 'reviews' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-star" style={{ color: 'var(--accent)' }}></i> My Reviews</h1>
              <p>Reviews you have submitted for completed rides.</p>
            </div>
            {myReviews.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-comment-slash"></i>
                <h3>No reviews yet</h3>
                <p>Complete a booking and leave a review from the <strong>My Bookings</strong> section!</p>
              </div>
            ) : (
              <div className="row g-3">
                {myReviews.map(r => {
                  const v = vehicleMap[r.vehicleId];
                  const customerName = r.customerName || currentUser?.name || 'Customer';
                  return (
                    <div className="col-md-6" key={r.id}>
                      <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between" style={{ gap: '16px' }}>
                        <div>
                          {/* Header: Customer Name & Date */}
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent), #00b894)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#020617', fontWeight: 700, fontSize: '.85rem'
                              }}>
                                {customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {customerName}
                                </div>
                                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Customer</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              <i className="far fa-calendar-alt me-1"></i>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Vehicle Info: Image & Name */}
                          <div className="d-flex align-items-center gap-3 mb-3 p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                            <div style={{
                              width: '60px', height: '60px', borderRadius: '8px',
                              background: 'var(--bg-card)', overflow: 'hidden', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid var(--glass-border)'
                            }}>
                              {v?.image && v.image.startsWith('data:image') ? (
                                <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <i className={`fas ${v?.type === '2W' ? 'fa-motorcycle' : 'fa-car'}`} style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ margin: 0, fontSize: '.98rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {v?.name || r.vehicleId || 'Unknown Vehicle'}
                              </h4>
                              {v?.brand && (
                                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                                  {v.brand} {v.fuel ? `• ${v.fuel}` : ''}
                                </div>
                              )}
                              <div style={{ color: 'var(--warning)', fontSize: '.85rem', display: 'flex', gap: '3px', marginTop: '3px' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                  <i key={s} className={`${r.rating >= s ? 'fas' : 'far'} fa-star`}></i>
                                ))}
                                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({r.rating}/5)</span>
                              </div>
                            </div>
                          </div>

                          {/* Feedback Content */}
                          <div style={{
                            fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '.9rem',
                            padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                            borderLeft: '3px solid var(--accent)'
                          }}>
                            "{r.feedback}"
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {section === 'profile' && <Profile />}

        {/* Review Modal */}
        {reviewModal.open && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="glass-card p-4" style={{ width: '100%', maxWidth: '480px', border: '1px solid var(--accent)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ margin: 0 }}><i className="fas fa-star me-2" style={{ color: 'var(--warning)' }}></i>Leave a Review</h5>
                <button className="btn-close btn-close-white" onClick={() => setReviewModal({ open: false, booking: null })}></button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '20px' }}>
                Vehicle: <strong style={{ color: 'var(--text-primary)' }}>{vehicleMap[reviewModal.booking?.vehicleId]?.name || reviewModal.booking?.vehicleId}</strong>
              </p>

              {/* Star Rating */}
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 600 }}>Your Rating</label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '1.8rem', cursor: 'pointer' }}>
                  {[1,2,3,4,5].map(s => (
                    <i
                      key={s}
                      className={`${reviewForm.rating >= s ? 'fas' : 'far'} fa-star`}
                      style={{ color: 'var(--warning)', transition: 'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                    ></i>
                  ))}
                  <span style={{ fontSize: '.9rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '8px' }}>
                    {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][reviewForm.rating]}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 600 }}>Your Feedback</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Share your experience with this vehicle and service..."
                  style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)', resize: 'none' }}
                  value={reviewForm.feedback}
                  onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                  maxLength={500}
                />
                <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {reviewForm.feedback.length}/500
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" disabled={reviewSubmitting} onClick={handleSubmitReview}>
                  {reviewSubmitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</> : <><i className="fas fa-paper-plane me-2"></i>Submit Review</>}
                </button>
                <button className="btn btn-secondary" onClick={() => setReviewModal({ open: false, booking: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MY COMPLAINTS SECTION ── */}
        {section === 'complaints' && (
          <div className="dashboard-section active">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingRight: '60px' }}>
              <div>
                <h1><i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)' }}></i> My Complaints</h1>
                <p>Track and manage complaints filed against your rentals.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { setComplaintModal({ open: true }); setComplaintForm({ vehicleName: '', subject: '', description: '', priority: 'MEDIUM' }); }}
                style={{ flexShrink: 0 }}
              >
                <i className="fas fa-plus me-2"></i>File New Complaint
              </button>
            </div>

            {myComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '3.5rem', color: 'var(--success)', marginBottom: '16px', display: 'block' }}></i>
                <h3 style={{ color: 'var(--text-primary)' }}>No Complaints Filed</h3>
                <p style={{ marginBottom: '24px' }}>You haven't filed any complaints yet. If you faced any issue, let us know.</p>
                <button className="btn btn-primary" onClick={() => setComplaintModal({ open: true })}>
                  <i className="fas fa-plus me-2"></i>File a Complaint
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myComplaints.map(c => {
                  const priorityColors = { LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#EF4444', URGENT: '#9333ea' };
                  const statusColors = { PENDING: '#F59E0B', IN_PROGRESS: '#06B6D4', RESOLVED: '#22C55E', REJECTED: '#EF4444' };
                  const statusIcons = { PENDING: 'fa-clock', IN_PROGRESS: 'fa-sync-alt', RESOLVED: 'fa-check-circle', REJECTED: 'fa-times-circle' };
                  return (
                    <div key={c.id} className="panel" style={{ borderLeft: `4px solid ${priorityColors[c.priority] || 'var(--accent)'}` }}>
                      <div className="panel-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.subject}</span>
                              <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '.72rem', fontWeight: 700,
                                background: `${priorityColors[c.priority]}22`, color: priorityColors[c.priority], border: `1px solid ${priorityColors[c.priority]}44`
                              }}>{c.priority}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: '8px', lineHeight: 1.6 }}>{c.description}</p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--text-muted)' }}>
                              <span><i className="fas fa-hashtag me-1"></i>{c.id}</span>
                              {c.bookingId && <span><i className="fas fa-bookmark me-1"></i>Booking: {c.bookingId}</span>}
                              {c.vehicleName && <span><i className="fas fa-car me-1"></i>{c.vehicleName}</span>}
                              <span><i className="fas fa-calendar me-1"></i>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '5px 14px', borderRadius: '20px', fontSize: '.78rem', fontWeight: 700,
                              background: `${statusColors[c.status]}22`, color: statusColors[c.status], border: `1px solid ${statusColors[c.status]}44`
                            }}>
                              <i className={`fas ${statusIcons[c.status]}`}></i>
                              {c.status?.replace('_', ' ')}
                            </span>
                            {(c.status === 'RESOLVED' || c.status === 'REJECTED') && c.resolutionNote && (
                              <button
                                className="btn btn-xs"
                                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '.75rem' }}
                                onClick={() => setResolveViewModal({ open: true, complaint: c })}
                              >
                                <i className="fas fa-eye me-1"></i>View Resolution
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FILE COMPLAINT MODAL ── */}
        {complaintModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-card p-4" style={{ width: '100%', maxWidth: '540px', border: '1px solid var(--danger)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-exclamation-circle" style={{ color: 'var(--danger)' }}></i>
                  </span>
                  File a Complaint
                </h5>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setComplaintModal({ open: false })}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Vehicle Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Toyota Fortuner, Honda City, Royal Enfield, etc."
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                  value={complaintForm.vehicleName}
                  onChange={e => setComplaintForm(f => ({ ...f, vehicleName: e.target.value }))}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '.77rem' }}>Enter the vehicle name associated with your rental issue</small>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Subject <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-select"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
                  value={complaintForm.subject}
                  onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                >
                  <option value="">-- Select a category --</option>
                  <option value="Vehicle Condition Issue">Vehicle Condition Issue</option>
                  <option value="Billing / Overcharge">Billing / Overcharge</option>
                  <option value="Poor Customer Service">Poor Customer Service</option>
                  <option value="Booking Cancellation Issue">Booking Cancellation Issue</option>
                  <option value="Refund Delay">Refund Delay</option>
                  <option value="Vehicle Not Delivered">Vehicle Not Delivered</option>
                  <option value="Unsafe Vehicle">Unsafe Vehicle</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Priority Level</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'LOW', label: 'Low', color: '#22C55E' },
                    { value: 'MEDIUM', label: 'Medium', color: '#F59E0B' },
                    { value: 'HIGH', label: 'High', color: '#EF4444' },
                    { value: 'URGENT', label: 'Urgent', color: '#9333ea' },
                  ].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setComplaintForm(f => ({ ...f, priority: p.value }))}
                      style={{
                        padding: '5px 16px', borderRadius: '20px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${p.color}`,
                        background: complaintForm.priority === p.value ? p.color : 'transparent',
                        color: complaintForm.priority === p.value ? '#fff' : p.color,
                        transition: 'all 0.2s'
                      }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Describe Your Issue <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Please provide a detailed description of your complaint..."
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)', resize: 'none' }}
                  value={complaintForm.description}
                  onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={1000}
                />
                <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{complaintForm.description.length}/1000</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary flex-fill" disabled={complaintSubmitting} onClick={handleSubmitComplaint}>
                  {complaintSubmitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</> : <><i className="fas fa-paper-plane me-2"></i>Submit Complaint</>}
                </button>
                <button className="btn btn-secondary" onClick={() => setComplaintModal({ open: false })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── RESOLUTION VIEW MODAL ── */}
        {resolveViewModal.open && resolveViewModal.complaint && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1070, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-card p-4" style={{ width: '100%', maxWidth: '480px', border: '1px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h5 style={{ margin: 0 }}><i className="fas fa-check-circle me-2" style={{ color: 'var(--success)' }}></i>Resolution Details</h5>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setResolveViewModal({ open: false, complaint: null })}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Complaint</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{resolveViewModal.complaint.subject}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                <span style={{ padding: '3px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '.8rem', background: resolveViewModal.complaint.status === 'RESOLVED' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: resolveViewModal.complaint.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)' }}>
                  {resolveViewModal.complaint.status}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Resolution Note</div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--success)', color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>
                  {resolveViewModal.complaint.resolutionNote || 'No resolution note provided.'}
                </div>
              </div>
              {resolveViewModal.complaint.resolvedBy && (
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                  <i className="fas fa-user-shield me-1"></i> Resolved by: <strong style={{ color: 'var(--text-primary)' }}>{resolveViewModal.complaint.resolvedBy}</strong>
                </div>
              )}
              <button className="btn btn-secondary w-100 mt-3" onClick={() => setResolveViewModal({ open: false, complaint: null })}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
