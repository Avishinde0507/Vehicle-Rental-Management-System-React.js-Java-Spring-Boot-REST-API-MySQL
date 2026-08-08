/* ========================================
   DriveX VRMS — Data Layer (localStorage)
   ======================================== */

const DB = {
  USERS: 'vrms_users',
  VEHICLES: 'vrms_vehicles',
  BOOKINGS: 'vrms_bookings',
  CURRENT_USER: 'vrms_current_user',
  INITIALIZED: 'vrms_initialized',
};

/* ── Seed Data ── */
export const SEED_USERS = [
  { id: 'U001', name: 'Rahul Sharma', email: 'rahul@demo.com', password: 'demo123', role: 'customer', phone: '9876543210', city: 'Mumbai', createdAt: '2026-01-15', active: true },
  { id: 'U002', name: 'Priya Patel', email: 'priya@demo.com', password: 'demo123', role: 'customer', phone: '9876543211', city: 'Bangalore', createdAt: '2026-01-20', active: true },
  { id: 'U003', name: 'Arjun Mehta', email: 'arjun@demo.com', password: 'demo123', role: 'customer', phone: '9876543212', city: 'Delhi', createdAt: '2026-02-05', active: true },
  { id: 'U004', name: 'QuickRide Rentals', email: 'owner@demo.com', password: 'demo123', role: 'owner', phone: '9876500001', city: 'Mumbai', company: 'QuickRide Rentals', createdAt: '2026-01-10', active: true },
  { id: 'U005', name: 'CityDrive Agency', email: 'owner2@demo.com', password: 'demo123', role: 'owner', phone: '9876500002', city: 'Delhi', company: 'CityDrive Agency', createdAt: '2026-01-12', active: true },
  { id: 'U006', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin', phone: '9876500000', city: 'Mumbai', createdAt: '2026-01-01', active: true },
];

export const SEED_VEHICLES = [
  { id: 'V001', ownerId: 'U004', name: 'Honda Activa 6G', brand: 'Honda', model: '2025', type: '2W', fuel: 'Petrol', transmission: 'Automatic', seats: 2, regNumber: 'MH01AB1234', priceDaily: 400, priceWeekly: 2200, priceMonthly: 7500, status: 'available', approved: true, location: 'Mumbai', image: 'fa-motorcycle', color: '#00b894', description: 'Reliable and fuel-efficient scooter, perfect for city commutes.' },
  { id: 'V002', ownerId: 'U004', name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', model: '2025', type: '2W', fuel: 'Petrol', transmission: 'Manual', seats: 2, regNumber: 'MH01CD5678', priceDaily: 900, priceWeekly: 5000, priceMonthly: 17000, status: 'available', approved: true, location: 'Mumbai', image: '/vehicles/v002.png', color: '#6c5ce7', description: 'Iconic cruiser bike with a thumping engine for weekend rides.' },
  { id: 'V003', ownerId: 'U004', name: 'TVS Jupiter', brand: 'TVS', model: '2024', type: '2W', fuel: 'Petrol', transmission: 'Automatic', seats: 2, regNumber: 'MH01EF9012', priceDaily: 350, priceWeekly: 1900, priceMonthly: 6500, status: 'available', approved: true, location: 'Mumbai', image: 'fa-motorcycle', color: '#fdcb6e', description: 'Lightweight scooter with great mileage and comfortable ride.' },
  { id: 'V004', ownerId: 'U004', name: 'Maruti Swift', brand: 'Maruti Suzuki', model: '2025', type: '4W', fuel: 'Petrol', transmission: 'Manual', seats: 5, regNumber: 'MH01GH3456', priceDaily: 1800, priceWeekly: 10000, priceMonthly: 35000, status: 'available', approved: true, location: 'Mumbai', image: 'fa-car', color: '#e17055', description: "India's favorite hatchback — sporty, reliable, and fuel efficient." },
  { id: 'V005', ownerId: 'U004', name: 'Hyundai Creta', brand: 'Hyundai', model: '2025', type: '4W', fuel: 'Diesel', transmission: 'Automatic', seats: 5, regNumber: 'MH01IJ7890', priceDaily: 3200, priceWeekly: 18000, priceMonthly: 60000, status: 'available', approved: true, location: 'Mumbai', image: 'fa-car-side', color: '#0984e3', description: 'Premium SUV with advanced features and a powerful diesel engine.' },
  { id: 'V006', ownerId: 'U004', name: 'Toyota Innova Crysta', brand: 'Toyota', model: '2024', type: '4W', fuel: 'Diesel', transmission: 'Automatic', seats: 7, regNumber: 'MH01KL1234', priceDaily: 4000, priceWeekly: 22000, priceMonthly: 75000, status: 'rented', approved: true, location: 'Mumbai', image: 'fa-shuttle-van', color: '#00cec9', description: 'Spacious MPV perfect for family trips and outstation travel.' },
  { id: 'V007', ownerId: 'U005', name: 'Ola S1 Pro', brand: 'Ola Electric', model: '2025', type: '2W', fuel: 'Electric', transmission: 'Automatic', seats: 2, regNumber: 'DL01MN5678', priceDaily: 500, priceWeekly: 2800, priceMonthly: 9000, status: 'available', approved: true, location: 'Delhi', image: '/vehicles/v007.png', color: '#00b894', description: 'Zippy electric scooter with impressive range and fast charging.' },
  { id: 'V008', ownerId: 'U005', name: 'KTM Duke 200', brand: 'KTM', model: '2025', type: '2W', fuel: 'Petrol', transmission: 'Manual', seats: 2, regNumber: 'DL01OP9012', priceDaily: 1100, priceWeekly: 6000, priceMonthly: 20000, status: 'available', approved: true, location: 'Delhi', image: 'fa-motorcycle', color: '#fd79a8', description: 'Aggressive sport bike with excellent handling and power.' },
  { id: 'V009', ownerId: 'U005', name: 'Tata Nexon EV', brand: 'Tata', model: '2025', type: '4W', fuel: 'Electric', transmission: 'Automatic', seats: 5, regNumber: 'DL01QR3456', priceDaily: 2800, priceWeekly: 15000, priceMonthly: 50000, status: 'available', approved: true, location: 'Delhi', image: '/vehicles/v009.png', color: '#00b894', description: "India's best-selling electric SUV — eco-friendly and feature-packed." },
  { id: 'V010', ownerId: 'U005', name: 'Honda City', brand: 'Honda', model: '2025', type: '4W', fuel: 'Petrol', transmission: 'Automatic', seats: 5, regNumber: 'DL01ST7890', priceDaily: 2500, priceWeekly: 14000, priceMonthly: 45000, status: 'available', approved: true, location: 'Delhi', image: 'fa-car', color: '#636e72', description: 'Elegant sedan with refined driving experience and premium interiors.' },
  { id: 'V011', ownerId: 'U005', name: 'Mahindra Thar', brand: 'Mahindra', model: '2025', type: '4W', fuel: 'Diesel', transmission: 'Manual', seats: 4, regNumber: 'DL01UV1234', priceDaily: 3500, priceWeekly: 19000, priceMonthly: 65000, status: 'available', approved: true, location: 'Delhi', image: 'fa-truck-monster', color: '#d63031', description: 'Rugged off-road SUV built for adventure and tough terrains.' },
  { id: 'V012', ownerId: 'U005', name: 'MG ZS EV', brand: 'MG Motor', model: '2025', type: '4W', fuel: 'Electric', transmission: 'Automatic', seats: 5, regNumber: 'DL01WX5678', priceDaily: 3000, priceWeekly: 16000, priceMonthly: 55000, status: 'available', approved: true, location: 'Delhi', image: 'fa-car-side', color: '#0984e3', description: 'Premium electric SUV with long range and connected car features.' },
  { id: 'V013', ownerId: 'U004', name: 'Mahindra XUV700', brand: 'Mahindra', model: '2025', type: '4W', fuel: 'Diesel', transmission: 'Automatic', seats: 7, regNumber: 'MH01XY7890', priceDaily: 4500, priceWeekly: 25000, priceMonthly: 85000, status: 'available', approved: true, location: 'Mumbai', image: 'fa-car-side', color: '#1a237e', description: 'Luxury SUV with advanced ADAS features and supreme comfort.' },
  { id: 'V014', ownerId: 'U004', name: 'Yamaha R15 V4', brand: 'Yamaha', model: '2025', type: '2W', fuel: 'Petrol', transmission: 'Manual', seats: 2, regNumber: 'MH01YZ1234', priceDaily: 1200, priceWeekly: 7000, priceMonthly: 25000, status: 'available', approved: true, location: 'Mumbai', image: 'fa-motorcycle', color: '#2980b9', description: 'The racing DNA of Yamaha, perfect for performance enthusiasts.' },
];

export const SEED_BOOKINGS = [
  { id: 'B001', customerId: 'U001', vehicleId: 'V006', ownerId: 'U004', startDate: '2026-03-10', endDate: '2026-03-17', durationType: 'weekly', totalPrice: 22000, status: 'active', createdAt: '2026-03-08', paymentStatus: 'paid', paymentMethod: 'upi', transactionId: 'TXN17096001001', paidAt: '2026-03-08' },
  { id: 'B002', customerId: 'U002', vehicleId: 'V002', ownerId: 'U004', startDate: '2026-03-01', endDate: '2026-03-03', durationType: 'daily', totalPrice: 1800, status: 'completed', createdAt: '2026-02-28', paymentStatus: 'paid', paymentMethod: 'card', transactionId: 'TXN17090001002', paidAt: '2026-02-28' },
  { id: 'B003', customerId: 'U003', vehicleId: 'V009', ownerId: 'U005', startDate: '2026-03-20', endDate: '2026-03-25', durationType: 'daily', totalPrice: 14000, status: 'pending', createdAt: '2026-03-16', paymentStatus: 'paid', paymentMethod: 'netbanking', transactionId: 'TXN17092001003', paidAt: '2026-03-16' },
  { id: 'B004', customerId: 'U001', vehicleId: 'V004', ownerId: 'U004', startDate: '2026-02-01', endDate: '2026-02-28', durationType: 'monthly', totalPrice: 35000, status: 'completed', createdAt: '2026-01-28', paymentStatus: 'paid', paymentMethod: 'card', transactionId: 'TXN17085001004', paidAt: '2026-01-28' },
  { id: 'B005', customerId: 'U002', vehicleId: 'V008', ownerId: 'U005', startDate: '2026-03-22', endDate: '2026-03-24', durationType: 'daily', totalPrice: 2200, status: 'pending', createdAt: '2026-03-17', paymentStatus: 'paid', paymentMethod: 'upi', transactionId: 'TXN17093001005', paidAt: '2026-03-17' },
];

/* ── Initialize Database ── */
export function initDB() {
  if (!localStorage.getItem(DB.INITIALIZED)) {
    localStorage.setItem(DB.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(DB.VEHICLES, JSON.stringify(SEED_VEHICLES));
    localStorage.setItem(DB.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    localStorage.setItem(DB.INITIALIZED, 'true');
  }
}

/* ── Generic CRUD Helpers ── */
function getAll(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function saveAll(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getById(key, id) { return getAll(key).find(item => item.id === id); }
export function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

/* ── User CRUD ── */
export function getUsers() { return getAll(DB.USERS); }
export function getUserById(id) { return getById(DB.USERS, id); }
export function saveUsers(users) { saveAll(DB.USERS, users); }

export function register(name, email, password, role, phone, city, company) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already registered.' };
  }
  const user = {
    id: generateId('U'), name, email, password, role,
    phone: phone || '', city: city || '', company: company || '',
    createdAt: new Date().toISOString().split('T')[0], active: true,
  };
  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { success: false, message: 'Invalid email or password.' };
  if (!user.active) return { success: false, message: 'Account is deactivated. Contact admin.' };
  localStorage.setItem(DB.CURRENT_USER, JSON.stringify(user));
  return { success: true, user };
}

export function getCurrentUser() {
  const data = localStorage.getItem(DB.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function logoutUser() {
  localStorage.removeItem(DB.CURRENT_USER);
}

/* ── Vehicle CRUD ── */
export function getVehicles() { return getAll(DB.VEHICLES); }
export function getVehicleById(id) { return getById(DB.VEHICLES, id); }
export function saveVehicles(vehicles) { saveAll(DB.VEHICLES, vehicles); }

export function addVehicle(vehicleData) {
  const vehicles = getVehicles();
  const vehicle = { id: generateId('V'), approved: false, ...vehicleData };
  vehicles.push(vehicle);
  saveVehicles(vehicles);
  return vehicle;
}

export function updateVehicle(id, updates) {
  const vehicles = getVehicles();
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx === -1) return null;
  vehicles[idx] = { ...vehicles[idx], ...updates };
  saveVehicles(vehicles);
  return vehicles[idx];
}

export function deleteVehicle(id) {
  saveVehicles(getVehicles().filter(v => v.id !== id));
}

export function getAvailableVehicles(filters = {}) {
  let vehicles = getVehicles().filter(v => v.approved && v.status === 'available');
  if (filters.type) vehicles = vehicles.filter(v => v.type === filters.type);
  if (filters.fuel) vehicles = vehicles.filter(v => v.fuel === filters.fuel);
  if (filters.location) vehicles = vehicles.filter(v => v.location.toLowerCase().includes(filters.location.toLowerCase()));
  if (filters.minPrice) vehicles = vehicles.filter(v => v.priceDaily >= parseInt(filters.minPrice));
  if (filters.maxPrice) vehicles = vehicles.filter(v => v.priceDaily <= parseInt(filters.maxPrice));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    vehicles = vehicles.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.location.toLowerCase().includes(q)
    );
  }
  return vehicles;
}

export function getVehiclesByOwner(ownerId) {
  return getVehicles().filter(v => v.ownerId === ownerId);
}

/* ── Booking CRUD ── */
export function getBookings() { return getAll(DB.BOOKINGS); }
export function getBookingById(id) { return getById(DB.BOOKINGS, id); }
export function saveBookings(bookings) { saveAll(DB.BOOKINGS, bookings); }

export function addBooking(bookingData) {
  const bookings = getBookings();
  const today = new Date().toISOString().split('T')[0];
  const booking = {
    id: generateId('B'),
    status: 'pending',
    createdAt: today,
    paymentStatus: bookingData.paymentStatus || 'unpaid',
    paymentMethod: bookingData.paymentMethod || null,
    transactionId: bookingData.transactionId || null,
    paidAt: bookingData.paymentStatus === 'paid' ? today : null,
    ...bookingData,
  };
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
}

export function updateBooking(id, updates) {
  const bookings = getBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...updates };
  saveBookings(bookings);

  // Keep vehicle status in sync with booking status
  if (updates.status) {
    const vehicleId = bookings[idx].vehicleId;
    if (updates.status === 'active') {
      updateVehicle(vehicleId, { status: 'rented' });
    } else if (['completed', 'cancelled', 'rejected'].includes(updates.status)) {
      updateVehicle(vehicleId, { status: 'available' });
      // Auto-refund payment on cancellation / rejection
      if (['cancelled', 'rejected'].includes(updates.status) && bookings[idx].paymentStatus === 'paid') {
        bookings[idx].paymentStatus = 'refunded';
        saveBookings(bookings);
      }
    }
  }

  return bookings[idx];
}

export function getBookingsByCustomer(customerId) {
  return getBookings().filter(b => b.customerId === customerId);
}

export function getBookingsByOwner(ownerId) {
  return getBookings().filter(b => b.ownerId === ownerId);
}

export function calculatePrice(priceDaily, priceWeekly, priceMonthly, durationType, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  switch (durationType) {
    case 'daily': return days * priceDaily;
    case 'weekly': return Math.ceil(days / 7) * priceWeekly;
    case 'monthly': return Math.ceil(days / 30) * priceMonthly;
    default: return days * priceDaily;
  }
}
