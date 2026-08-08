-- ============================================
-- DriveX VRMS — MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS vrms0507_db;
USE vrms0507_db;

-- ── Users Table ──
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'owner', 'admin') NOT NULL DEFAULT 'customer',
    phone VARCHAR(15),
    city VARCHAR(50),
    company VARCHAR(100),
    created_at DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Vehicles Table ──
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(10) NOT NULL,
    type ENUM('2W', '4W') NOT NULL,
    fuel ENUM('Petrol', 'Diesel', 'Electric', 'CNG') NOT NULL,
    transmission ENUM('Manual', 'Automatic') NOT NULL,
    seats INT NOT NULL,
    reg_number VARCHAR(20) NOT NULL UNIQUE,
    price_daily DECIMAL(10,2) NOT NULL,
    price_weekly DECIMAL(10,2) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'rented', 'maintenance') NOT NULL DEFAULT 'available',
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    location VARCHAR(50),
    image VARCHAR(50),
    color VARCHAR(10),
    description TEXT,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(255),
    razorpay_order_id VARCHAR(255) NOT NULL,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount DOUBLE NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL,
    payment_method VARCHAR(50),
    created_at DATETIME NOT NULL
);

-- ── Bookings ──
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    vehicle_id VARCHAR(50) NOT NULL,
    owner_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    total_price DOUBLE NOT NULL,
    status ENUM('pending', 'active', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATE NOT NULL,

    -- Payment Reference
    payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    payment_id VARCHAR(255),
    paid_at DATE,

    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- ── Indexes ──
CREATE INDEX idx_vehicles_owner    ON vehicles(owner_id);
CREATE INDEX idx_vehicles_status   ON vehicles(status);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle  ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_payment  ON bookings(payment_status);
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);




CREATE TABLE reviews (
    id VARCHAR(255) PRIMARY KEY,
    booking_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    feedback TEXT NOT NULL,
    created_at DATETIME NOT NULL
);
