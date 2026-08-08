-- ============================================
-- DriveX VRMS — Seed Data
-- ============================================

USE vrms0507_db;

-- ── Users ──
INSERT IGNORE INTO users (id, name, email, password, role, phone, city, company, created_at, active) VALUES
('U001', 'Rahul Sharma',     'rahul@demo.com',  'demo123', 'customer', '9876543210', 'Mumbai',    NULL,               '2026-01-15', TRUE),
('U002', 'Priya Patel',      'priya@demo.com',  'demo123', 'customer', '9876543211', 'Bangalore', NULL,               '2026-01-20', TRUE),
('U003', 'Arjun Mehta',      'arjun@demo.com',  'demo123', 'customer', '9876543212', 'Delhi',     NULL,               '2026-02-05', TRUE),
('U004', 'QuickRide Rentals','owner@demo.com',  'demo123', 'owner',    '9876500001', 'Mumbai',    'QuickRide Rentals','2026-01-10', TRUE),
('U005', 'CityDrive Agency', 'owner2@demo.com', 'demo123', 'owner',    '9876500002', 'Delhi',     'CityDrive Agency', '2026-01-12', TRUE),
('U006', 'Admin User',       'admin@demo.com',  'admin123','admin',    '9876500000', 'Mumbai',    NULL,               '2026-01-01', TRUE);

-- ── Vehicles ──
INSERT IGNORE INTO vehicles (id, owner_id, name, brand, model, type, fuel, transmission, seats, reg_number, price_daily, price_weekly, price_monthly, status, approved, location, image, color, description) VALUES
('V001','U004','Honda Activa 6G',       'Honda',        '2025','2W','Petrol', 'Automatic',2,'MH01AB1234', 400,  2200,  7500, 'available',TRUE, 'Mumbai','fa-motorcycle','#00b894','Reliable city scooter.'),
('V002','U004','Royal Enfield Classic', 'Royal Enfield','2025','2W','Petrol', 'Manual',   2,'MH01CD5678', 900,  5000, 17000, 'available',TRUE, 'Mumbai','fa-motorcycle','#6c5ce7','Iconic cruiser bike.'),
('V004','U004','Maruti Swift',          'Maruti Suzuki','2025','4W','Petrol', 'Manual',   5,'MH01GH3456',1800, 10000, 35000,'available',TRUE, 'Mumbai','fa-car',        '#e17055','India favourite hatchback.'),
('V005','U004','Hyundai Creta',         'Hyundai',      '2025','4W','Diesel', 'Automatic',5,'MH01IJ7890',3200, 18000, 60000,'available',TRUE, 'Mumbai','fa-car-side',   '#0984e3','Premium SUV.'),
('V006','U004','Toyota Innova Crysta',  'Toyota',       '2024','4W','Diesel', 'Automatic',7,'MH01KL1234',4000, 22000, 75000,'rented',   TRUE, 'Mumbai','fa-shuttle-van','#00cec9','Family MPV.'),
('V007','U005','Ola S1 Pro',            'Ola Electric', '2025','2W','Electric','Automatic',2,'DL01MN5678', 500,  2800,  9000,'available',TRUE, 'Delhi', 'fa-motorcycle','#00b894','Electric scooter.'),
('V009','U005','Tata Nexon EV',         'Tata',         '2025','4W','Electric','Automatic',5,'DL01QR3456',2800, 15000, 50000,'available',TRUE, 'Delhi', 'fa-car',        '#00b894','Best-selling EV.'),
('V010','U005','Honda City',            'Honda',        '2025','4W','Petrol', 'Automatic',5,'DL01ST7890',2500, 14000, 45000,'available',TRUE, 'Delhi', 'fa-car',        '#636e72','Elegant sedan.');

-- ── Bookings (with payment fields) ──
INSERT IGNORE INTO bookings
  (id, customer_id, vehicle_id, owner_id, start_date, end_date, duration_type, total_price, status, created_at,
   payment_status, payment_method, transaction_id, paid_at)
VALUES
('B001','U001','V006','U004','2026-03-10','2026-03-17','weekly', 22000,'active',    '2026-03-08','paid',   'upi',        'TXN17096001001','2026-03-08'),
('B002','U002','V002','U004','2026-03-01','2026-03-03','daily',   1800,'completed', '2026-02-28','paid',   'card',       'TXN17090001002','2026-02-28'),
('B003','U003','V009','U005','2026-03-20','2026-03-25','daily',  14000,'pending',   '2026-03-16','paid',   'netbanking', 'TXN17092001003','2026-03-16'),
('B004','U001','V004','U004','2026-02-01','2026-02-28','monthly',35000,'completed', '2026-01-28','paid',   'card',       'TXN17085001004','2026-01-28'),
('B005','U002','V009','U005','2026-03-22','2026-03-24','daily',   2200,'pending',   '2026-03-17','paid',   'upi',        'TXN17093001005','2026-03-17');
