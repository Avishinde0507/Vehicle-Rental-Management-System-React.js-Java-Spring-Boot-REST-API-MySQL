/* ── Format Date ── */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Format Price ── */
export function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/* ── Status Badge classes ── */
export function getStatusBadgeClass(status) {
  const map = {
    available: 'bg-success',
    rented: 'bg-info text-dark',
    maintenance: 'bg-warning text-dark',
    pending: 'bg-warning text-dark',
    approved: 'bg-success',
    active: 'bg-info text-dark',
    completed: 'bg-primary',
    rejected: 'bg-danger',
    cancelled: 'bg-danger',
    true: 'bg-success',
    false: 'bg-warning text-dark',
  };
  return map[String(status)] || 'bg-primary';
}

/* ── Today / Tomorrow helpers ── */
export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
export function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
export function getDayAfterStr(days = 3) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/* ── Price Calculator (moved from db.js) ── */
export function calculatePrice(priceDaily, priceWeekly, priceMonthly, durationType, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  switch (durationType) {
    case 'daily':   return days * priceDaily;
    case 'weekly':  return Math.ceil(days / 7) * priceWeekly;
    case 'monthly': return Math.ceil(days / 30) * priceMonthly;
    default:        return days * priceDaily;
  }
}
