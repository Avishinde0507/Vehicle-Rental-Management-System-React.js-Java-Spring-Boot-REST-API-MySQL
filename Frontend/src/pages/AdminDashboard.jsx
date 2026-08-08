import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { userAPI, vehicleAPI, bookingAPI, reviewAPI, complaintAPI } from '../services/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Profile from './Profile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NAV_ITEMS = [
  { key: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' },
  { key: 'users', icon: 'fa-users', label: 'Manage Users' },
  { key: 'agencies', icon: 'fa-building', label: 'Rental Agencies' },
  { key: 'vehicles', icon: 'fa-car', label: 'Vehicle Listings' },
  { key: 'allbookings', icon: 'fa-clipboard-list', label: 'All Bookings' },
  { key: 'reports', icon: 'fa-file-medical-alt', label: 'Reports' },
  { key: 'reviews', icon: 'fa-star', label: 'Global Reviews' },
  { key: 'complaints', icon: 'fa-exclamation-triangle', label: 'All Complaints' },
  { key: 'profile', icon: 'fa-user-cog', label: 'Manage Profile' },
];

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

export default function AdminDashboard() {
  const { currentUser, showToast, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleApprovalFilter, setVehicleApprovalFilter] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [allComplaints, setAllComplaints] = useState([]);
  const [adminResolveModal, setAdminResolveModal] = useState({ open: false, complaint: null });
  const [adminResolveForm, setAdminResolveForm] = useState({ status: 'IN_PROGRESS', note: '' });
  const [adminResolveSubmitting, setAdminResolveSubmitting] = useState(false);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') { navigate('/login'); return; }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (section !== 'complaints' || !currentUser) return;
    complaintAPI.getAll()
      .then(data => setAllComplaints(Array.isArray(data) ? data : []))
      .catch(() => showToast('Failed to load complaints.', 'error'));
  }, [section, currentUser, showToast]);

  const handleAdminResolveComplaint = async () => {
    if (!adminResolveModal.complaint) return;
    setAdminResolveSubmitting(true);
    try {
      await complaintAPI.updateStatus(
        adminResolveModal.complaint.id,
        adminResolveForm.status,
        adminResolveForm.note,
        'Admin'
      );
      showToast('Complaint updated!', 'success');
      setAdminResolveModal({ open: false, complaint: null });
      const data = await complaintAPI.getAll();
      setAllComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to update complaint.', 'error');
    } finally {
      setAdminResolveSubmitting(false);
    }
  };

  const loadAll = useCallback(async () => {
    try {
      const [u, v, b, r] = await Promise.all([
        userAPI.getAll(),
        vehicleAPI.getAll(),
        bookingAPI.getAll(),
        reviewAPI.getAll()
      ]);
      setUsers(u);
      setVehicles(v);
      setBookings(b);
      setReviews(r);
    } catch {
      showToast('Failed to load data.', 'error');
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggleUser = async (id) => {
    try {
      const updated = await userAPI.toggleActive(id);
      showToast(updated.active ? 'User activated.' : 'User deactivated.', updated.active ? 'success' : 'error');
      loadAll();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const approveVehicle = async (id) => {
    try {
      await vehicleAPI.approve(id, true);
      showToast('Vehicle listing approved!');
      loadAll();
    } catch (err) {
      showToast(err.message || 'Failed to approve.', 'error');
    }
  };

  const generateOverallReport = (type, format = 'pdf') => {
    const today = new Date();
    let filterDate = new Date();
    let title = "";

    if (type === 'daily') {
      filterDate.setHours(0, 0, 0, 0);
      title = "System Daily Performance Report";
    } else if (type === 'weekly') {
      filterDate.setDate(today.getDate() - 7);
      title = "System Weekly Performance Report";
    } else if (type === 'monthly') {
      filterDate.setMonth(today.getMonth() - 1);
      title = "System Monthly Performance Report";
    }

    const filteredBookings = bookings.filter(b => new Date(b.startDate) >= filterDate);

    if (format === 'csv') {
      const headers = ["Booking ID", "Customer Name", "Agency Name", "Vehicle Name", "Price", "Status", "Start Date"];
      const rows = [];

      filteredBookings.forEach(b => {
        const c = users.find(u => u.id === b.customerId);
        const o = users.find(u => u.id === b.ownerId);
        const v = vehicles.find(vv => vv.id === b.vehicleId);
        rows.push([
          b.id,
          c ? c.name : 'N/A',
          o ? (o.company || o.name) : 'N/A',
          v ? v.name : 'N/A',
          b.totalPrice,
          b.status.toUpperCase(),
          b.startDate ? `="${b.startDate.split('T')[0]}"` : '—'
        ]);
      });

      const totalRev = filteredBookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);

      rows.push([]);
      rows.push(["Financial Summary"]);
      rows.push(["Total Transactions", filteredBookings.length]);
      rows.push(["Estimated Revenue", totalRev]);

      downloadCSV(headers, rows, `DriveX_Admin_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} overall CSV report generated!`);
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 206, 201);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DriveX VRMS Admin", 14, 25);
    doc.setFontSize(12);
    doc.text("Overall System Business Analytics", 14, 33);

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(18);
    doc.text(title, 14, 55);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Period: ${type.toUpperCase()}`, 14, 63);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 68);

    const tableColumn = ["ID", "Customer", "Agency", "Vehicle", "Price", "Status", "Date"];
    const tableRows = [];

    filteredBookings.forEach(b => {
      const c = users.find(u => u.id === b.customerId);
      const o = users.find(u => u.id === b.ownerId);
      const v = vehicles.find(vv => vv.id === b.vehicleId);
      tableRows.push([
        b.id,
        c ? c.name : 'N/A',
        o ? (o.company || o.name) : 'N/A',
        v ? v.name : 'N/A',
        formatPricePDF(b.totalPrice),
        b.status.toUpperCase(),
        formatDate(b.startDate)
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [0, 206, 201] },
      styles: { fontSize: 8 }
    });

    const totalRev = filteredBookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Financial Summary", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Transactions: ${filteredBookings.length}`, 14, finalY + 8);
    doc.text(`Estimated Revenue: ${formatPricePDF(totalRev)}`, 14, finalY + 16);

    doc.save(`DriveX_Admin_${type}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} overall PDF report generated!`);
  };

  const generateAgencyReport = (format = 'pdf') => {
    const agencies = users.filter(u => u.role === 'owner');

    if (format === 'csv') {
      const headers = ["Agency Name", "City", "Total Vehicles", "Pending", "Active", "Completed", "Rejected", "Cancelled", "Total Revenue", "Status"];
      const rows = [];

      agencies.forEach(a => {
        const agencyBookings = bookings.filter(b => b.ownerId === a.id);
        const agencyVehicles = vehicles.filter(v => v.ownerId === a.id);
        const rev = agencyBookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);

        rows.push([
          a.company || a.name,
          a.city || 'N/A',
          agencyVehicles.length,
          agencyBookings.filter(b => b.status === 'pending').length,
          agencyBookings.filter(b => b.status === 'active').length,
          agencyBookings.filter(b => b.status === 'completed').length,
          agencyBookings.filter(b => b.status === 'rejected').length,
          agencyBookings.filter(b => b.status === 'cancelled').length,
          rev,
          a.active ? 'ACTIVE' : 'INACTIVE'
        ]);
      });

      downloadCSV(headers, rows, `DriveX_Agency_Report_${new Date().toISOString().split('T')[0]}.csv`);
      showToast("Agency performance CSV report generated!");
      return;
    }

    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(255, 159, 67);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DriveX VRMS Admin", 14, 25);
    doc.setFontSize(12);
    doc.text("Agency Performance Audit", 14, 33);

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(18);
    doc.text("Rental Agency Performance & Payment Summary", 14, 55);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 63);

    const tableColumn = ["Agency Name", "City", "Vehicles", "Pending", "Active", "Completed", "Rejected", "Cancelled", "Revenue", "Status"];
    const tableRows = [];

    agencies.forEach(a => {
      const agencyBookings = bookings.filter(b => b.ownerId === a.id);
      const agencyVehicles = vehicles.filter(v => v.ownerId === a.id);
      const rev = agencyBookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);

      tableRows.push([
        a.company || a.name,
        a.city || 'N/A',
        agencyVehicles.length,
        agencyBookings.filter(b => b.status === 'pending').length,
        agencyBookings.filter(b => b.status === 'active').length,
        agencyBookings.filter(b => b.status === 'completed').length,
        agencyBookings.filter(b => b.status === 'rejected').length,
        agencyBookings.filter(b => b.status === 'cancelled').length,
        formatPricePDF(rev),
        a.active ? 'ACTIVE' : 'INACTIVE'
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [255, 159, 67] },
      styles: { fontSize: 6.5, cellPadding: 1.5 }
    });

    doc.save(`DriveX_Agency_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Agency performance PDF report generated!");
  };

  const generateCustomerReport = (format = 'pdf') => {
    const customers = users.filter(u => u.role === 'customer');

    if (format === 'csv') {
      const headers = ["Customer Name", "Customer Email", "Customer Phone", "Booking ID", "Vehicle Name", "Start Date", "End Date", "Total Price", "Payment Status", "Booking Status"];
      const rows = [];

      customers.forEach(c => {
        const customerBookings = bookings.filter(b => b.customerId === c.id);
        customerBookings.forEach(b => {
          const v = vehicles.find(vv => vv.id === b.vehicleId);
          rows.push([
            c.name,
            c.email,
            c.phone ? `="${c.phone}"` : 'N/A',
            b.id,
            v ? v.name : 'N/A',
            b.startDate ? `="${b.startDate.split('T')[0]}"` : '—',
            b.endDate ? `="${b.endDate.split('T')[0]}"` : '—',
            b.totalPrice,
            b.paymentStatus ? b.paymentStatus.toUpperCase() : 'UNPAID',
            b.status.toUpperCase()
          ]);
        });
      });

      downloadCSV(headers, rows, `DriveX_Customer_Report_${new Date().toISOString().split('T')[0]}.csv`);
      showToast("Customer booking CSV reports generated!");
      return;
    }

    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(84, 160, 255);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DriveX VRMS Admin", 14, 25);
    doc.setFontSize(12);
    doc.text("Customer Bookings & Rental History", 14, 33);

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(18);
    doc.text("Customer Bookings Performance Report", 14, 55);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 63);

    const tableColumn = ["ID", "Customer", "Vehicle", "Date", "Price", "Payment", "Status"];
    const tableRows = [];

    // Sort bookings by customer name to keep them beautifully grouped
    const sortedBookings = [...bookings].sort((x, y) => {
      const cx = users.find(u => u.id === x.customerId) || {};
      const cy = users.find(u => u.id === y.customerId) || {};
      return (cx.name || '').localeCompare(cy.name || '');
    });

    sortedBookings.forEach(b => {
      const c = users.find(u => u.id === b.customerId);
      if (!c) return;
      const v = vehicles.find(vv => vv.id === b.vehicleId);
      tableRows.push([
        b.id,
        c.name,
        v ? v.name : 'N/A',
        formatDate(b.startDate),
        formatPricePDF(b.totalPrice),
        b.paymentStatus ? b.paymentStatus.toUpperCase() : 'UNPAID',
        b.status.toUpperCase()
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [84, 160, 255] },
      styles: { fontSize: 7, cellPadding: 2 }
    });

    doc.save(`DriveX_Customer_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Customer booking PDF reports generated!");
  };

  if (!currentUser) return null;

  // Computed stats
  const customers = users.filter(u => u.role === 'customer').length;
  const owners = users.filter(u => u.role === 'owner').length;
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => b.status === 'active').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings.filter(b => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.totalPrice, 0);
  const avgDuration = bookings.length > 0
    ? (bookings.reduce((s, b) => s + Math.ceil((new Date(b.endDate) - new Date(b.startDate)) / (1000 * 60 * 60 * 24)), 0) / bookings.length).toFixed(1)
    : 0;
  const conflicts = bookings.filter(b => b.status === 'rejected').length;
  const utilization = vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'rented').length / vehicles.length) * 100) : 0;
  const twoW = vehicles.filter(v => v.type === '2W').length;
  const fourW = vehicles.filter(v => v.type === '4W').length;
  const twoPct = vehicles.length > 0 ? Math.round((twoW / vehicles.length) * 100) : 0;

  // Lookup maps
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });
  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[v.id] = v; });
  const getUserById = (id) => userMap[id];
  const getVehicleById = (id) => vehicleMap[id];
  const getVehiclesByOwner = (ownerId) => vehicles.filter(v => v.ownerId === ownerId);

  // Filtered
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!userRoleFilter || u.role === userRoleFilter);
  });
  const filteredVehicles = vehicles.filter(v => {
    const q = vehicleSearch.toLowerCase();
    return (!q || v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q)) &&
      (!vehicleApprovalFilter || (vehicleApprovalFilter === 'approved' ? v.approved : !v.approved));
  });
  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase();
    const c = userMap[b.customerId];
    const v = vehicleMap[b.vehicleId];
    const matchQuery = !q ||
      b.id.toLowerCase().includes(q) ||
      (c && c.name.toLowerCase().includes(q)) ||
      (v && v.name.toLowerCase().includes(q));
    const matchStatus = !bookingStatusFilter || b.status === bookingStatusFilter;
    return matchQuery && matchStatus;
  });
  const agencies = users.filter(u => u.role === 'owner');

  const statusBar = ['pending', 'active', 'completed', 'rejected', 'cancelled'];
  const barColors = { pending: 'var(--warning)', active: 'var(--info)', completed: 'var(--success)', rejected: 'var(--danger)', cancelled: 'var(--text-muted)' };

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

        {/* ── ANALYTICS ── */}
        {section === 'analytics' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-chart-pie" style={{ color: 'var(--accent)' }}></i> System Analytics</h1>
              <p>Key Performance Indicators across the platform.</p>
            </div>
            <div className="kpi-grid">
              {[
                { icon: 'fa-user-tag', cls: 'purple', val: customers, label: 'Verified Customers' },
                { icon: 'fa-building', cls: 'orange', val: owners, label: 'Rental Agencies' },
                { icon: 'fa-car', cls: 'blue', val: vehicles.length, label: 'Total Vehicles' },
                { icon: 'fa-clipboard-check', cls: 'green', val: totalBookings, label: 'Total Bookings' },
                { icon: 'fa-running', cls: 'blue', val: activeBookings, label: 'Active Rentals' },
                { icon: 'fa-clock', cls: 'orange', val: pendingBookings, label: 'Pending Requests' },
                { icon: 'fa-rupee-sign', cls: 'green', val: formatPrice(totalRevenue), label: 'Total Revenue' },
                { icon: 'fa-percentage', cls: 'purple', val: `${utilization}%`, label: 'Utilization Rate' },
                { icon: 'fa-calendar-day', cls: 'blue', val: `${avgDuration} days`, label: 'Avg Duration' },
                { icon: 'fa-exclamation-triangle', cls: 'red', val: conflicts, label: 'Conflicts' },
              ].map((k, i) => (
                <div key={i} className="kpi-card">
                  <div className={`kpi-icon ${k.cls}`}><i className={`fas ${k.icon}`}></i></div>
                  <div className="kpi-value">{k.val}</div>
                  <div className="kpi-label">{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
              <div className="panel">
                <div className="panel-header"><h2>Bookings by Status</h2></div>
                <div className="panel-body">
                  {statusBar.map(s => {
                    const count = bookings.filter(b => b.status === s).length;
                    const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
                    return (
                      <div key={s} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize' }}>{s}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColors[s], borderRadius: 4, transition: '.5s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><h2>Vehicles by Type</h2></div>
                <div className="panel-body">
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{twoW}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>2-Wheelers</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--info)' }}>{fourW}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>4-Wheelers</div>
                    </div>
                  </div>
                  <div style={{ height: 10, background: 'var(--bg-card)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${twoPct}%`, background: 'var(--success)', transition: '.5s' }}></div>
                    <div style={{ width: `${100 - twoPct}%`, background: 'var(--info)', transition: '.5s' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginTop: 6, color: 'var(--text-muted)' }}>
                    <span>2W: {twoPct}%</span><span>4W: {100 - twoPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel mt-3">
              <div className="panel-header"><h2>Recent Bookings</h2></div>
              <div className="panel-body no-pad">
                <div className="table-wrapper">
                  <table className="table table-hover mb-0">
                    <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Owner</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {[...bookings].reverse().slice(0, 5).map(b => {
                        const v = getVehicleById(b.vehicleId);
                        const c = getUserById(b.customerId);
                        const o = getUserById(b.ownerId);
                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td>{c ? c.name : '—'}</td>
                            <td>{v ? v.name : '—'}</td>
                            <td>{o ? o.name : '—'}</td>
                            <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                            <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                            <td><StatusBadge status={b.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {section === 'users' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-users" style={{ color: 'var(--accent)' }}></i> Manage Users</h1><p>View and manage all registered users.</p></div>
            <div className="search-filter-row mb-3">
              <div className="search-input-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <select
                className="filter-select-box"
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong>{u.company && <><br /><small className="text-muted">{u.company}</small></>}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'owner' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>{u.role}</span></td>
                      <td>{u.city || '—'}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td><StatusBadge status={u.active ? 'available' : 'maintenance'} /></td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button className={`btn btn-xs ${u.active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleUser(u.id)}>
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AGENCIES ── */}
        {section === 'agencies' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-building" style={{ color: 'var(--accent)' }}></i> Rental Agencies</h1><p>Manage registered rental agencies.</p></div>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead><tr><th>Agency Name</th><th>Contact</th><th>Email</th><th>City</th><th>Vehicles</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {agencies.map(a => {
                    const vCount = getVehiclesByOwner(a.id).length;
                    return (
                      <tr key={a.id}>
                        <td><strong>{a.company || a.name}</strong></td>
                        <td>{a.phone || '—'}</td>
                        <td>{a.email}</td>
                        <td>{a.city || '—'}</td>
                        <td><strong>{vCount}</strong></td>
                        <td><StatusBadge status={a.active ? 'available' : 'maintenance'} /></td>
                        <td><button className={`btn btn-xs ${a.active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleUser(a.id)}>{a.active ? 'Deactivate' : 'Activate'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VEHICLES ── */}
        {section === 'vehicles' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-car" style={{ color: 'var(--accent)' }}></i> Vehicle Listings</h1><p>Approve or reject vehicle listings submitted by agencies.</p></div>
            <div className="search-filter-row mb-3">
              <div className="search-input-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                />
              </div>
              <select
                className="filter-select-box"
                value={vehicleApprovalFilter}
                onChange={e => setVehicleApprovalFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead><tr><th>Vehicle</th><th>Type</th><th>Owner</th><th>Location</th><th>Daily Price</th><th>Docs</th><th>Status</th><th>Approved</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredVehicles.map(v => {
                    const o = getUserById(v.ownerId);
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {v.image && (
                              <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                                <img
                                  src={v.image}
                                  alt={v.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <strong>{v.name}</strong><br />
                              <small className="text-muted">{v.brand} {v.model}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${v.type === '2W' ? 'bg-success' : 'bg-info text-dark'}`}>{v.type}</span></td>
                        <td>{o ? (o.company || o.name) : '—'}</td>
                        <td>{v.location}</td>
                        <td>{formatPrice(v.priceDaily)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {v.rcDocument ? (
                              <a href={v.rcDocument} target="_blank" rel="noopener noreferrer" className="badge bg-primary text-white" style={{ textDecoration: 'none' }} title="View RC Book">
                                <i className="fas fa-file-alt me-1"></i>RC
                              </a>
                            ) : <span className="badge bg-secondary text-muted" style={{ opacity: 0.5 }}>RC</span>}
                            {v.insuranceDocument ? (
                              <a href={v.insuranceDocument} target="_blank" rel="noopener noreferrer" className="badge bg-info text-dark" style={{ textDecoration: 'none' }} title="View Insurance">
                                <i className="fas fa-shield-alt me-1"></i>INS
                              </a>
                            ) : <span className="badge bg-secondary text-muted" style={{ opacity: 0.5 }}>INS</span>}
                            {v.pucDocument ? (
                              <a href={v.pucDocument} target="_blank" rel="noopener noreferrer" className="badge bg-warning text-dark" style={{ textDecoration: 'none' }} title="View PUC">
                                <i className="fas fa-smog me-1"></i>PUC
                              </a>
                            ) : <span className="badge bg-secondary text-muted" style={{ opacity: 0.5 }}>PUC</span>}
                          </div>
                        </td>
                        <td><StatusBadge status={v.status} /></td>
                        <td><StatusBadge status={v.approved ? 'approved' : 'pending'} /></td>
                        <td>
                          {!v.approved
                            ? <button className="btn btn-success btn-xs" onClick={() => approveVehicle(v.id)}><i className="fas fa-check"></i> Approve</button>
                            : <span className="text-muted">✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ALL BOOKINGS ── */}
        {section === 'allbookings' && (
          <div className="dashboard-section active">
            <div className="page-header"><h1><i className="fas fa-clipboard-list" style={{ color: 'var(--accent)' }}></i> All Bookings</h1><p>Monitor all bookings across the platform.</p></div>
            <div className="search-filter-row mb-3">
              <div className="search-input-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search bookings by ID, customer, or vehicle..."
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                />
              </div>
              <select
                className="filter-select-box"
                value={bookingStatusFilter}
                onChange={e => setBookingStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table className="table table-hover mb-0">
                <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Owner</th><th>Duration</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredBookings.map(b => {
                    const v = getVehicleById(b.vehicleId);
                    const c = getUserById(b.customerId);
                    const o = getUserById(b.ownerId);
                    return (
                      <tr key={b.id}>
                        <td><strong>{b.id}</strong></td>
                        <td>{c ? c.name : '—'}</td>
                        <td>{v ? v.name : '—'}</td>
                        <td>{o ? o.name : '—'}</td>
                        <td><span className="badge bg-primary text-capitalize">{b.durationType}</span></td>
                        <td>{formatDate(b.startDate)} → {formatDate(b.endDate)}</td>
                        <td><strong>{formatPrice(b.totalPrice)}</strong></td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── REPORTS ── */}
        {section === 'reports' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-file-medical-alt" style={{ color: 'var(--accent)' }}></i> Global Reports</h1>
              <p>System-wide analytical reports and audit logs.</p>
            </div>

            <div className="panel mb-4">
              <div className="panel-header"><h2>Overall Performance Reports</h2></div>
              <div className="panel-body">
                <div className="grid-3" style={{ marginBottom: 32 }}>
                  {[
                    { title: 'Daily System Report', type: 'daily', icon: 'fa-calendar-day', color: 'var(--accent)' },
                    { title: 'Weekly System Report', type: 'weekly', icon: 'fa-calendar-week', color: 'var(--primary)' },
                    { title: 'Monthly System Report', type: 'monthly', icon: 'fa-calendar-alt', color: 'var(--text-secondary)' },
                  ].map((r, i) => (
                    <div key={i} className="report-card panel p-4 text-center">
                      <div className="mb-3" style={{ fontSize: '2rem', color: r.color }}><i className={`fas ${r.icon}`}></i></div>
                      <h4 className="mb-2">{r.title}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        <button
                          className="btn btn-primary btn-sm w-100"
                          style={{ justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); generateOverallReport(r.type, 'pdf'); }}
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
                          onClick={(e) => { e.stopPropagation(); generateOverallReport(r.type, 'csv'); }}
                        >
                          <i className="fas fa-file-csv"></i> Download CSV
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="panel report-card p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <h3 className="mb-0">Agency Audit Report</h3>
                    <p className="text-muted mb-0 small">Performance metrics for all rental agencies.</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <button
                    className="btn btn-outline btn-sm w-100"
                    style={{ justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); generateAgencyReport('pdf'); }}
                  >
                    <i className="fas fa-file-pdf"></i> Generate PDF
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
                    onClick={(e) => { e.stopPropagation(); generateAgencyReport('csv'); }}
                  >
                    <i className="fas fa-file-csv"></i> Generate CSV
                  </button>
                </div>
              </div>

              <div className="panel report-card p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    <i className="fas fa-user-friends"></i>
                  </div>
                  <div>
                    <h3 className="mb-0">Customer Insight Report</h3>
                    <p className="text-muted mb-0 small">Detailed booking history and payment logs per user.</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <button
                    className="btn btn-outline btn-sm w-100"
                    style={{ justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); generateCustomerReport('pdf'); }}
                  >
                    <i className="fas fa-file-pdf"></i> Generate PDF
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
                    onClick={(e) => { e.stopPropagation(); generateCustomerReport('csv'); }}
                  >
                    <i className="fas fa-file-csv"></i> Generate CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {section === 'reviews' && (
          <div className="dashboard-section active">
            <div className="page-header">
              <h1><i className="fas fa-star" style={{ color: 'var(--accent)' }}></i> Global Customer Reviews</h1>
              <p>Monitor all customer feedback and ratings across the system.</p>
            </div>
            {reviews.length === 0 ? (
              <div className="empty-state"><i className="fas fa-comment-slash"></i><h3>No reviews found</h3></div>
            ) : (
              <div className="panel">
                <div className="panel-body no-pad">
                  <div className="table-wrapper">
                    <table className="table table-hover mb-0">
                      <thead><tr><th>Customer Name</th><th>Vehicle Image</th><th>Vehicle Name</th><th>Agency</th><th>Rating</th><th>Feedback</th><th>Date</th></tr></thead>
                      <tbody>
                        {reviews.map(r => {
                          const cust = users.find(u => u.id === r.customerId);
                          const owner = users.find(u => u.id === r.ownerId);
                          const v = vehicles.find(vv => vv.id === r.vehicleId);
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
                              <td>{owner ? (owner.company || owner.name) : 'Unknown Agency'}</td>
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

        {/* ── ALL COMPLAINTS SECTION (ADMIN) ── */}
        {section === 'complaints' && (() => {
          const priorityColors = { LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#EF4444', URGENT: '#9333ea' };
          const statusColors = { PENDING: '#F59E0B', IN_PROGRESS: '#06B6D4', RESOLVED: '#22C55E', REJECTED: '#EF4444' };
          const statusIcons = { PENDING: 'fa-clock', IN_PROGRESS: 'fa-sync-alt', RESOLVED: 'fa-check-circle', REJECTED: 'fa-times-circle' };
          const filtered = allComplaints.filter(c =>
            (!complaintStatusFilter || c.status === complaintStatusFilter) &&
            (!complaintPriorityFilter || c.priority === complaintPriorityFilter)
          );
          const pendingCount = allComplaints.filter(c => c.status === 'PENDING').length;
          const inProgressCount = allComplaints.filter(c => c.status === 'IN_PROGRESS').length;
          const resolvedCount = allComplaints.filter(c => c.status === 'RESOLVED').length;
          return (
            <div className="dashboard-section active">
              <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingRight: '60px' }}>
                <div>
                  <h1><i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)' }}></i> All Complaints</h1>
                  <p>Monitor and manage all customer complaints across the platform.</p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[{ label: 'Total', val: allComplaints.length, color: 'var(--text-primary)', icon: 'fa-list' }, { label: 'Pending', val: pendingCount, color: '#F59E0B', icon: 'fa-clock' }, { label: 'In Progress', val: inProgressCount, color: '#06B6D4', icon: 'fa-sync-alt' }, { label: 'Resolved', val: resolvedCount, color: '#22C55E', icon: 'fa-check-circle' }].map(s => (
                  <div key={s.label} className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                    <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: '1.4rem', marginBottom: '8px', display: 'block' }}></i>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <select className="form-select" style={{ maxWidth: '180px', background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }} value={complaintStatusFilter} onChange={e => setComplaintStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select className="form-select" style={{ maxWidth: '180px', background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }} value={complaintPriorityFilter} onChange={e => setComplaintPriorityFilter(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '.85rem', color: 'var(--text-muted)' }}>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} shown</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--success)', display: 'block', marginBottom: '16px' }}></i>
                  <h3 style={{ color: 'var(--text-primary)' }}>No Complaints Found</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filtered.map(c => (
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
                              <span><i className="fas fa-envelope me-1"></i>{c.customerEmail || '-'}</span>
                              {c.vehicleName && <span><i className="fas fa-car me-1"></i>{c.vehicleName}</span>}
                              {c.bookingId && <span><i className="fas fa-bookmark me-1"></i>{c.bookingId}</span>}
                              <span><i className="fas fa-calendar me-1"></i>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                            {c.resolutionNote && (
                              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '3px solid var(--success)', fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--success)' }}>Resolution:</strong> {c.resolutionNote}
                                {c.resolvedBy && <span style={{ color: 'var(--text-muted)' }}> — {c.resolvedBy}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', fontSize: '.78rem', fontWeight: 700, background: `${statusColors[c.status]}22`, color: statusColors[c.status], border: `1px solid ${statusColors[c.status]}44` }}>
                              <i className={`fas ${statusIcons[c.status]}`}></i>
                              {c.status?.replace('_', ' ')}
                            </span>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { setAdminResolveModal({ open: true, complaint: c }); setAdminResolveForm({ status: c.status !== 'PENDING' ? c.status : 'IN_PROGRESS', note: c.resolutionNote || '' }); }}
                            >
                              <i className="fas fa-edit me-1"></i>Manage
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── ADMIN RESOLVE COMPLAINT MODAL ── */}
        {adminResolveModal.open && adminResolveModal.complaint && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-card p-4" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--accent)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ margin: 0 }}><i className="fas fa-shield-alt me-2" style={{ color: 'var(--accent)' }}></i>Admin: Manage Complaint</h5>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => setAdminResolveModal({ open: false, complaint: null })}><i className="fas fa-times"></i></button>
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{adminResolveModal.complaint.subject}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{adminResolveModal.complaint.description}</div>
                <div style={{ marginTop: '8px', fontSize: '.78rem', color: 'var(--text-muted)' }}>By: {adminResolveModal.complaint.customerName} ({adminResolveModal.complaint.customerEmail})</div>
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block', fontSize: '.9rem' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[{ v: 'IN_PROGRESS', l: 'In Progress', c: '#06B6D4' }, { v: 'RESOLVED', l: 'Resolved', c: '#22C55E' }, { v: 'REJECTED', l: 'Rejected', c: '#EF4444' }].map(s => (
                    <button key={s.v} type="button" onClick={() => setAdminResolveForm(f => ({ ...f, status: s.v }))}
                      style={{ padding: '5px 16px', borderRadius: '20px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', border: `2px solid ${s.c}`, background: adminResolveForm.status === s.v ? s.c : 'transparent', color: adminResolveForm.status === s.v ? '#fff' : s.c, transition: 'all 0.2s' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '.9rem' }}>Admin Note / Resolution</label>
                <textarea className="form-control" rows={4} placeholder="Add admin resolution note..." style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--glass-border)', resize: 'none' }} value={adminResolveForm.note} onChange={e => setAdminResolveForm(f => ({ ...f, note: e.target.value }))} maxLength={800} />
                <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{adminResolveForm.note.length}/800</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary flex-fill" disabled={adminResolveSubmitting} onClick={handleAdminResolveComplaint}>
                  {adminResolveSubmitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</> : <><i className="fas fa-check me-2"></i>Save & Update</>}
                </button>
                <button className="btn btn-secondary" onClick={() => setAdminResolveModal({ open: false, complaint: null })}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {section === 'profile' && <Profile />}
      </main>
    </div>
  );
}
