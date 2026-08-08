import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { vehicleAPI, bookingAPI, userAPI, reviewAPI, complaintAPI } from '../services/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Profile from './Profile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const downloadCSV = (headers, rows, filename) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(val => {
        const strVal = String(val === null || val === undefined ? '' : val);
        if (strVal.startsWith('="') && strVal.endsWith('"')) {
          return strVal;
        }
        const escaped = strVal.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatPricePDF = (amount) => {
  return 'Rs. ' + Number(amount).toLocaleString('en-IN');
};

const NAV_ITEMS = [
  { key: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { key: 'fleet', icon: 'fa-car', label: 'My Vehicles' },
  { key: 'bookings', icon: 'fa-clipboard-list', label: 'Booking Requests' },
  { key: 'active', icon: 'fa-road', label: 'Active Rentals' },
  { key: 'reports', icon: 'fa-file-invoice-dollar', label: 'Reports' },
  { key: 'reviews', icon: 'fa-star', label: 'Customer Reviews' },
  { key: 'complaints', icon: 'fa-exclamation-triangle', label: 'Complaints' },
  { key: 'profile', icon: 'fa-user-cog', label: 'Manage Profile' },
];

export default function OwnerDashboard() {
  const { currentUser, showToast, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('dashboard');
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userMap, setUserMap] = useState({});   // customerId → user
  const [agencyComplaints, setAgencyComplaints] = useState([]);
  const [resolveModal, setResolveModal] = useState({ open: false, complaint: null });
  const [resolveForm, setResolveForm] = useState({ status: 'IN_PROGRESS', note: '' });
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'owner') { navigate('/login'); return; }
  }, [currentUser, navigate]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [fleetData, bookingData, reviewData, allUsers] = await Promise.all([
        vehicleAPI.getByOwner(currentUser.id),
        bookingAPI.getByOwner(currentUser.id),
        reviewAPI.getByOwner(currentUser.id),
        userAPI.getAll(),
      ]);
      const map = {};
      allUsers.forEach(u => { map[u.id] = u; });
      setFleet(fleetData);
      setBookings(bookingData);
      setReviews(reviewData);
      setUserMap(map);
    } catch {
      showToast('Failed to load dashboard data.', 'error');
    }
  }, [currentUser, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (section !== 'complaints' || !currentUser) return;
    complaintAPI.getByOwner(currentUser.id)
      .then(data => setAgencyComplaints(Array.isArray(data) ? data : []))
      .catch(() => showToast('Failed to load complaints.', 'error'));
  }, [section, currentUser, showToast]);

  const handleResolveComplaint = async () => {
    if (!resolveModal.complaint) return;
    setResolveSubmitting(true);
    try {
      await complaintAPI.updateStatus(
        resolveModal.complaint.id,
        resolveForm.status,
        resolveForm.note,
        currentUser.name
      );
      showToast('Complaint updated successfully!', 'success');
      setResolveModal({ open: false, complaint: null });
      const data = await complaintAPI.getByOwner(currentUser.id);
      setAgencyComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to update complaint.', 'error');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await vehicleAPI.delete(id);
      showToast('Vehicle removed.', 'error');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete vehicle.', 'error');
    }
  };

  const handleBookingAction = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, status);
      showToast(status === 'active' ? 'Booking approved!' : status === 'completed' ? 'Marked as completed.' : 'Booking rejected.');
      loadData();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const setVehicleStatus = async (id, status) => {
    try {
      await vehicleAPI.updateStatus(id, status);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };
  const generateReport = (type, format = 'pdf') => {
    const today = new Date();
    let filterDate = new Date();
    let title = "";

    if (type === 'daily') {
      filterDate.setHours(0, 0, 0, 0);
      title = "Daily Business Report";
    } else if (type === 'weekly') {
      filterDate.setDate(today.getDate() - 7);
      title = "Weekly Business Report";
    } else if (type === 'monthly') {
      filterDate.setMonth(today.getMonth() - 1);
      title = "Monthly Business Report";
    }

    // Filter bookings based on startDate (or createdAt if available)
    const filteredBookings = bookings.filter(b => new Date(b.startDate) >= filterDate);

    if (format === 'csv') {
      const headers = ["Booking ID", "Customer Name", "Phone No", "Vehicle Rented", "Start Date", "End Date", "Total Price", "Payment Status", "Status"];
      const rows = [];

      filteredBookings.forEach(b => {
        const cust = userMap[b.customerId];
        const v = fleet.find(vv => vv.id === b.vehicleId);
        rows.push([
          b.id,
          cust ? cust.name : b.customerId,
          cust ? (cust.phone ? `="${cust.phone}"` : 'N/A') : 'N/A',
          v ? v.name : b.vehicleId,
          b.startDate ? `="${b.startDate.split('T')[0]}"` : '—',
          b.endDate ? `="${b.endDate.split('T')[0]}"` : '—',
          b.totalPrice,
          b.paymentStatus ? b.paymentStatus.toUpperCase() : 'UNPAID',
          b.status.toUpperCase()
        ]);
      });

      const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      rows.push([]);
      rows.push(["Financial Summary"]);
      rows.push(["Total Bookings", filteredBookings.length]);
      rows.push(["Estimated Revenue", totalRevenue]);

      downloadCSV(headers, rows, `RentEase_Owner_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} CSV report generated successfully!`);
      return;
    }

    // PDF generation
    const doc = new jsPDF();

    // Header styling
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("RentEase VRMS", 14, 25);
    doc.setFontSize(12);
    doc.text("Premium Vehicle Rental Management System", 14, 33);

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(18);
    doc.text(title, 14, 55);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 63);
    doc.text(`Owner ID: ${currentUser.id}`, 14, 68);
    doc.text(`Owner Name: ${currentUser.name}`, 14, 73);

    const tableColumn = ["ID", "Customer Name", "Phone No", "Vehicle Rented", "Dates", "Total Price", "Payment", "Status"];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const cust = userMap[b.customerId];
      const v = fleet.find(vv => vv.id === b.vehicleId);
      const bookingData = [
        b.id,
        cust ? cust.name : b.customerId,
        cust ? (cust.phone || 'N/A') : 'N/A',
        v ? v.name : b.vehicleId,
        `${formatDate(b.startDate)} - ${formatDate(b.endDate)}`,
        formatPricePDF(b.totalPrice),
        b.paymentStatus ? b.paymentStatus.toUpperCase() : 'UNPAID',
        b.status.toUpperCase()
      ];
      tableRows.push(bookingData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid', // upgraded to beautiful proper grid layout with clean lines
      headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 25 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25 },
        4: { cellWidth: 32 },
        5: { cellWidth: 16 },
        6: { cellWidth: 16 },
        7: { cellWidth: 16 }
      }
    });

    const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const finalY = doc.lastAutoTable.finalY + 15;

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, finalY, 182, 30, 'F');
    doc.setDrawColor(200);
    doc.rect(14, finalY, 182, 30, 'S');

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Report Summary", 20, finalY + 10);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Total Bookings: ${filteredBookings.length}`, 20, finalY + 18);
    doc.text(`Total Generated Revenue: ${formatPricePDF(totalRevenue)}`, 20, finalY + 25);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for using RentEase VRMS Services.", 105, 285, { align: 'center' });

    doc.save(`RentEase_${type}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} PDF report downloaded successfully!`);
  };

  if (!currentUser) return null;

  const active = bookings.filter(b => b.status === 'active').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);
  const available = fleet.filter(v => v.status === 'available').length;

  return (
    <div className="dashboard-layout" data-theme={theme}>
      <Sidebar navItems={NAV_ITEMS} activeSection={section} onSectionChange={setSection} />
      <main className="main-content" style={{ position: 'relative' }}>
        <div className="dashboard-header-actions" style={{ position: 'absolute', top: '24px', right: '36px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
          {section === 'fleet' && (
            <button className="btn btn-primary" onClick={() => navigate('/owner/add-vehicle')}>
              <i className="fas fa-plus"></i> Add Vehicle
            </button>
          )}
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

        {/* ── DASHBOARD ── */}
        {section === 'dashboard' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-tachometer-alt" style={{ color: 'var(--accent)' }}></i> Agency Dashboard</h1>
              <p>Overview of your vehicles and bookings.</p>
            </div>
            <div className="kpi-grid">
              {[
                { icon: 'fa-car', cls: 'purple', val: fleet.length, label: 'Total Vehicles' },
                { icon: 'fa-check-circle', cls: 'green', val: available, label: 'Available' },
                { icon: 'fa-clock', cls: 'orange', val: pending, label: 'Pending Requests' },
                { icon: 'fa-road', cls: 'blue', val: active, label: 'Active Rentals' },
                { icon: 'fa-rupee-sign', cls: 'green', val: formatPrice(totalRevenue), label: 'Total Revenue' },
              ].map((k, i) => (
                <div key={i} className="kpi-card">
                  <div className={`kpi-icon ${k.cls}`}><i className={`fas ${k.icon}`}></i></div>
                  <div className="kpi-value">{k.val}</div>
                  <div className="kpi-label">{k.label}</div>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="panel-header"><h2>Recent Booking Requests</h2></div>
              <div className="panel-body no-pad">
                <div className="table-wrapper">
                  <table className="table table-hover mb-0">
                    <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {bookings.slice(0, 5).map(b => {
                        const cust = userMap[b.customerId];
                        const v = fleet.find(vv => vv.id === b.vehicleId);
                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td>{cust ? cust.name : b.customerId}</td>
                            <td>{v ? v.name : b.vehicleId}</td>
                            <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                            <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                            <td>
                              {b.paymentStatus === 'paid' ? (
                                <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--success)' }}>✓ Paid</span>
                              ) : b.paymentStatus === 'refunded' ? (
                                <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--warning)' }}>↩ Refund</span>
                              ) : (
                                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>— Unpaid</span>
                              )}
                            </td>
                            <td><StatusBadge status={b.status} /></td>
                            <td>
                              {b.status === 'pending' && (
                                <>
                                  <button className="btn btn-success btn-xs me-1" onClick={() => handleBookingAction(b.id, 'active')}><i className="fas fa-check"></i></button>
                                  <button className="btn btn-danger btn-xs" onClick={() => handleBookingAction(b.id, 'rejected')}><i className="fas fa-times"></i></button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {bookings.length === 0 && <tr><td colSpan="7" className="text-center text-muted">No bookings yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FLEET ── */}
        {section === 'fleet' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-car" style={{ color: 'var(--accent)' }}></i> My Vehicles</h1>
              <p>Manage your vehicles — add, edit, or set maintenance status.</p>
            </div>
            {fleet.length === 0 ? (
              <div className="empty-state"><i className="fas fa-car"></i><h3>No vehicles yet</h3><p>Add your first vehicle to get started.</p></div>
            ) : (
              <div className="table-wrapper">
                <table className="table table-hover mb-0">
                  <thead><tr><th>Vehicle</th><th>Type</th><th>Reg No.</th><th>Fuel</th><th>Daily Price</th><th>Status</th><th>Approved</th><th>Actions</th></tr></thead>
                  <tbody>
                    {fleet.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                              {v.image && v.image.startsWith('data:image') ? (
                                <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className={`fas ${v.image || 'fa-car'}`} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}></i>
                                </div>
                              )}
                            </div>
                            <div>
                              <strong>{v.name}</strong><br />
                              <small className="text-muted">{v.brand} {v.model}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${v.type === '2W' ? 'bg-success' : 'bg-info text-dark'}`}>{v.type}</span></td>
                        <td>{v.regNumber}</td>
                        <td>{v.fuel}</td>
                        <td>{formatPrice(v.priceDaily)}</td>
                        <td><StatusBadge status={v.status} /></td>
                        <td><StatusBadge status={v.approved ? 'approved' : 'pending'} /></td>
                        <td>
                          <button className="btn btn-ghost btn-xs me-1" onClick={() => navigate(`/owner/update-vehicle/${v.id}`)}><i className="fas fa-edit"></i></button>
                          {v.status === 'available' && <button className="btn btn-ghost btn-xs me-1" title="Set Maintenance" onClick={() => setVehicleStatus(v.id, 'maintenance')}><i className="fas fa-tools"></i></button>}
                          {v.status === 'maintenance' && <button className="btn btn-ghost btn-xs me-1" title="Set Available" onClick={() => setVehicleStatus(v.id, 'available')}><i className="fas fa-check"></i></button>}
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteVehicle(v.id)}><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BOOKING REQUESTS ── */}
        {section === 'bookings' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-clipboard-list" style={{ color: 'var(--accent)' }}></i> Booking Requests</h1><p>Approve or reject incoming booking requests.</p></div>
            {bookings.length === 0 ? (
              <div className="empty-state"><i className="fas fa-inbox"></i><h3>No booking requests</h3></div>
            ) : (
              <div className="panel">
                <div className="panel-body no-pad">
                  <div className="table-wrapper">
                    <table className="table table-hover mb-0">
                      <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Duration</th><th>Dates</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {bookings.map(b => {
                          const cust = userMap[b.customerId];
                          const v = fleet.find(vv => vv.id === b.vehicleId);
                          return (
                            <tr key={b.id}>
                              <td><strong>{b.id}</strong></td>
                              <td>{cust ? cust.name : b.customerId}</td>
                              <td>{v ? v.name : b.vehicleId}</td>
                              <td><span className="badge bg-primary text-capitalize">{b.durationType}</span></td>
                              <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                              <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                              <td><StatusBadge status={b.status} /></td>
                              <td>
                                {b.status === 'pending' && (
                                  <>
                                    <button className="btn btn-success btn-xs me-1" onClick={() => handleBookingAction(b.id, 'active')}>Approve</button>
                                    <button className="btn btn-danger btn-xs" onClick={() => handleBookingAction(b.id, 'rejected')}>Reject</button>
                                  </>
                                )}
                                {b.status === 'active' && (
                                  <button className="btn btn-primary btn-xs" onClick={() => handleBookingAction(b.id, 'completed')}>Complete</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVE RENTALS ── */}
        {section === 'active' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-road" style={{ color: 'var(--accent)' }}></i> Active Rentals</h1><p>Track vehicles currently rented out.</p></div>
            {bookings.filter(b => b.status === 'active').length === 0 ? (
              <div className="empty-state"><i className="fas fa-road"></i><h3>No active rentals</h3></div>
            ) : (
              <div className="table-wrapper">
                <table className="table table-hover mb-0">
                  <thead><tr><th>Vehicle</th><th>Customer</th><th>Dates</th><th>Duration</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {bookings.filter(b => b.status === 'active').map(b => {
                      const cust = userMap[b.customerId];
                      const v = fleet.find(vv => vv.id === b.vehicleId);
                      return (
                        <tr key={b.id}>
                          <td>{v ? v.name : b.vehicleId}</td>
                          <td>{cust ? cust.name : b.customerId}</td>
                          <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                          <td><span className="badge bg-primary text-capitalize">{b.durationType}</span></td>
                          <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                          <td><StatusBadge status={b.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* ── REPORTS ── */}
        {section === 'reports' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-file-invoice-dollar" style={{ color: 'var(--accent)' }}></i> Business Reports</h1>
              <p>Generate and download analytical reports for your rental business.</p>
            </div>

            <div className="grid-3">
              {[
                { title: 'Daily Report', type: 'daily', icon: 'fa-calendar-day', desc: 'Summary of all bookings and revenue generated today.', color: 'var(--accent)' },
                { title: 'Weekly Report', type: 'weekly', icon: 'fa-calendar-week', desc: 'Detailed analysis of business performance over the last 7 days.', color: 'var(--primary)' },
                { title: 'Monthly Report', type: 'monthly', icon: 'fa-calendar-alt', desc: 'Comprehensive monthly breakdown of rentals and earnings.', color: 'var(--text-secondary)' }
              ].map((rpt, i) => (
                <div key={i} className="panel report-card" style={{ padding: '24px', textAlign: 'center', transition: 'var(--transition)' }}>
                  <div className="report-icon" style={{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: `${rpt.color}20`,
                    color: rpt.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', margin: '0 auto 16px'
                  }}>
                    <i className={`fas ${rpt.icon}`}></i>
                  </div>
                  <h3>{rpt.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px', minHeight: '40px' }}>{rpt.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="btn btn-primary btn-sm w-100"
                      style={{ justifyContent: 'center' }}
                      onClick={(e) => { e.stopPropagation(); generateReport(rpt.type, 'pdf'); }}
                    >
                      <i className="fas fa-file-pdf"></i> Download PDF
                    </button>
                    <button
                      className="btn btn-outline btn-sm w-100"
                      style={{
                        justifyContent: 'center',
                        border: '1px solid rgba(137, 233, 0, 0.4)',
                        color: 'var(--success)',
                        background: 'rgba(137, 233, 0, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--success)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(137, 233, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(137, 233, 0, 0.05)';
                        e.currentTarget.style.color = 'var(--success)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={(e) => { e.stopPropagation(); generateReport(rpt.type, 'csv'); }}
                    >
                      <i className="fas fa-file-csv"></i> Download CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel mt-4">
              <div className="panel-header"><h2>All-Time Performance</h2></div>
              <div className="panel-body">
                <div className="kpi-grid" style={{ marginTop: 0 }}>
                  <div className="kpi-card">
                    <div className="kpi-icon blue"><i className="fas fa-history"></i></div>
                    <div className="kpi-value">{bookings.length}</div>
                    <div className="kpi-label">Lifetime Bookings</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon green"><i className="fas fa-wallet"></i></div>
                    <div className="kpi-value">{formatPrice(totalRevenue)}</div>
                    <div className="kpi-label">Lifetime Revenue</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon purple"><i className="fas fa-star"></i></div>
                    <div className="kpi-value">4.8</div>
                    <div className="kpi-label">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {section === 'reviews' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-star" style={{ color: 'var(--accent)' }}></i> Customer Reviews</h1>
              <p>See what your customers are saying about your vehicles and service.</p>
            </div>
            {reviews.length === 0 ? (
              <div className="empty-state"><i className="fas fa-comment-slash"></i><h3>No reviews yet</h3></div>
            ) : (
              <div className="panel">
                <div className="panel-body no-pad">
                  <div className="table-wrapper">
                    <table className="table table-hover mb-0">
                      <thead><tr><th>Customer Name</th><th>Vehicle Image</th><th>Vehicle Name</th><th>Rating</th><th>Feedback</th><th>Date</th></tr></thead>
                      <tbody>
                        {reviews.map(r => {
                          const cust = userMap[r.customerId];
                          const v = fleet.find(vv => vv.id === r.vehicleId);
                          const customerName = r.customerName || cust?.name || 'Customer';
                          return (
                            <tr key={r.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #00b894)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020617', fontSize: '.8rem', fontWeight: 700 }}>
                                    {customerName.charAt(0).toUpperCase()}
                                  </div>
                                  <strong>{customerName}</strong>
                                </div>
                              </td>
                              <td>
                                <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {v?.image && v.image.startsWith('data:image') ? (
                                    <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : <i className={`fas ${v?.type === '2W' ? 'fa-motorcycle' : 'fa-car'}`} style={{ fontSize: '1.2rem', color: 'var(--accent)' }}></i>}
                                </div>
                              </td>
                              <td>
                                <strong>{v ? v.name : (r.vehicleId || 'Unknown Vehicle')}</strong>
                                {v?.brand && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{v.brand}</div>}
                              </td>
                              <td>
                                <div style={{ color: 'var(--warning)', display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <i key={s} className={`${r.rating >= s ? 'fas' : 'far'} fa-star`} style={{ fontSize: '.8rem' }}></i>
                                  ))}
                                </div>
                              </td>
                              <td style={{ maxWidth: '300px' }}>
                                <p style={{ fontSize: '.88rem', margin: 0, fontStyle: 'italic' }}>"{r.feedback}"</p>
                              </td>
                              <td style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLAINTS SECTION ── */}
        {section === 'complaints' && (
          <div className="dashboard-section active">
            <div className="page-header" style={{ paddingRight: '60px' }}>
              <h1><i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)' }}></i> Customer Complaints</h1>
              <p>Review and resolve complaints raised by customers for your vehicles.</p>
            </div>

            {agencyComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                <i className="fas fa-smile" style={{ fontSize: '3.5rem', color: 'var(--success)', marginBottom: '16px', display: 'block' }}></i>
                <h3 style={{ color: 'var(--text-primary)' }}>No Complaints Yet</h3>
                <p>No complaints have been raised for your vehicles. Keep up the great service!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {agencyComplaints.map(c => {
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
                              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '.72rem', fontWeight: 700, background: `${priorityColors[c.priority]}22`, color: priorityColors[c.priority], border: `1px solid ${priorityColors[c.priority]}44` }}>{c.priority}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: '8px', lineHeight: 1.6 }}>{c.description}</p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--text-muted)' }}>
                              <span><i className="fas fa-user me-1"></i>{c.customerName || c.customerId}</span>
                              {c.vehicleName && <span><i className="fas fa-car me-1"></i>{c.vehicleName}</span>}
                              {c.bookingId && <span><i className="fas fa-bookmark me-1"></i>{c.bookingId}</span>}
                              <span><i className="fas fa-calendar me-1"></i>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', fontSize: '.78rem', fontWeight: 700, background: `${statusColors[c.status]}22`, color: statusColors[c.status], border: `1px solid ${statusColors[c.status]}44` }}>
                              <i className={`fas ${statusIcons[c.status]}`}></i>
                              {c.status?.replace('_', ' ')}
                            </span>
                            {c.status !== 'RESOLVED' && c.status !== 'REJECTED' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setResolveModal({ open: true, complaint: c }); setResolveForm({ status: 'IN_PROGRESS', note: '' }); }}
                              >
                                <i className="fas fa-reply me-1"></i>Respond
                              </button>
                            )}
                            {(c.status === 'RESOLVED' || c.status === 'REJECTED') && (
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '.75rem' }}
                                onClick={() => { setResolveModal({ open: true, complaint: c }); setResolveForm({ status: c.status, note: c.resolutionNote || '' }); }}
                              >
                                <i className="fas fa-edit me-1"></i>Update
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

        {/* ── RESOLVE COMPLAINT MODAL ── */}
        {resolveModal.open && resolveModal.complaint && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-card p-4" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--accent)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ margin: 0 }}><i className="fas fa-reply me-2" style={{ color: 'var(--accent)' }}></i>Respond to Complaint</h5>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setResolveModal({ open: false, complaint: null })}><i className="fas fa-times"></i></button>
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{resolveModal.complaint.subject}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{resolveModal.complaint.description}</div>
                <div style={{ marginTop: '8px', fontSize: '.78rem', color: 'var(--text-muted)' }}>By: {resolveModal.complaint.customerName || resolveModal.complaint.customerId}</div>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block', fontSize: '.9rem' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[{ v: 'IN_PROGRESS', l: 'In Progress', c: '#06B6D4' }, { v: 'RESOLVED', l: 'Resolved', c: '#22C55E' }, { v: 'REJECTED', l: 'Rejected', c: '#EF4444' }].map(s => (
                    <button key={s.v} type="button" onClick={() => setResolveForm(f => ({ ...f, status: s.v }))}
                      style={{ padding: '5px 16px', borderRadius: '20px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', border: `2px solid ${s.c}`, background: resolveForm.status === s.v ? s.c : 'transparent', color: resolveForm.status === s.v ? '#fff' : s.c, transition: 'all 0.2s' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Resolution Note</label>
                <textarea className="form-control" rows={4} placeholder="Explain how the issue was resolved or why it was rejected..." style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)', resize: 'none' }} value={resolveForm.note} onChange={e => setResolveForm(f => ({ ...f, note: e.target.value }))} maxLength={800} />
                <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{resolveForm.note.length}/800</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary flex-fill" disabled={resolveSubmitting} onClick={handleResolveComplaint}>
                  {resolveSubmitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</> : <><i className="fas fa-check me-2"></i>Save Response</>}
                </button>
                <button className="btn btn-secondary" onClick={() => setResolveModal({ open: false, complaint: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {section === 'profile' && <Profile />}
      </main>
    </div>
  );
}
