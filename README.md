# 🚗 DriveX — Vehicle Rental Management System (VRMS)

A full-stack Vehicle Rental Management System with React.js frontend, Java Spring Boot backend, and MySQL database.

---

## 📁 Project Structure

```
VRMS-FullStack/
├── frontend/          → React.js Frontend (with Bootstrap)
├── backend/           → Java Spring Boot Backend
├── database/          → MySQL Schema & Seed Data
├── docs/              → Postman API Collection
└── README.md          → This file
```

---

## 🛠️ Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React.js, Bootstrap, CSS3     |
| Backend    | Java 17, Spring Boot 3.2      |
| Database   | MySQL 8.0                     |
| APIs       | RESTful APIs                  |
| Tools      | Postman, Maven                |

---

## ⚡ Quick Start

### 1. Database Setup (MySQL)

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_data.sql
```

### 2. Backend Setup (Spring Boot)

```bash
cd backend
# Update database credentials in src/main/resources/application.properties
mvn clean install
mvn spring-boot:run
```
Backend runs at: **http://localhost:8080**

### 3. Frontend Setup (React)

```bash
cd frontend
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

---

## 🔌 REST API Endpoints

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | `/api/users/login`    | User login        |
| POST   | `/api/users/register` | User registration |

### Users
| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| GET    | `/api/users`                    | Get all users       |
| GET    | `/api/users/{id}`               | Get user by ID      |
| GET    | `/api/users/role/{role}`        | Get users by role   |
| PUT    | `/api/users/{id}/toggle-active` | Toggle user status  |
| DELETE | `/api/users/{id}`               | Delete user         |

### Vehicles
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | `/api/vehicles`                       | Get all vehicles         |
| GET    | `/api/vehicles/{id}`                  | Get vehicle by ID        |
| GET    | `/api/vehicles/owner/{ownerId}`       | Get vehicles by owner    |
| GET    | `/api/vehicles/available`             | Get available vehicles   |
| GET    | `/api/vehicles/location/{location}`   | Get vehicles by location |
| POST   | `/api/vehicles`                       | Add new vehicle          |
| PUT    | `/api/vehicles/{id}`                  | Update vehicle           |
| DELETE | `/api/vehicles/{id}`                  | Delete vehicle           |
| PUT    | `/api/vehicles/{id}/approve?approved=true` | Approve/reject vehicle |
| PUT    | `/api/vehicles/{id}/status?status=available` | Update vehicle status |

### Bookings
| Method | Endpoint                                    | Description            |
|--------|---------------------------------------------|------------------------|
| GET    | `/api/bookings`                             | Get all bookings       |
| GET    | `/api/bookings/{id}`                        | Get booking by ID      |
| GET    | `/api/bookings/customer/{customerId}`       | Get customer bookings  |
| GET    | `/api/bookings/owner/{ownerId}`             | Get owner bookings     |
| POST   | `/api/bookings`                             | Create booking         |
| PUT    | `/api/bookings/{id}/status?status=active`   | Update booking status  |
| GET    | `/api/bookings/availability?vehicleId=...&startDate=...&endDate=...` | Check availability |

---

## 👥 Demo Credentials

| Role     | Email            | Password  |
|----------|------------------|-----------|
| Admin    | admin@demo.com   | admin123  |
| Owner    | owner@demo.com   | demo123   |
| Owner 2  | owner2@demo.com  | demo123   |
| Customer | rahul@demo.com   | demo123   |
| Customer | priya@demo.com   | demo123   |

---

## 📮 Postman Collection

Import `docs/VRMS_Postman_Collection.json` into Postman to test all APIs.

**Steps:**
1. Open Postman → Import → Upload File
2. Select `docs/VRMS_Postman_Collection.json`
3. Set variable `baseUrl` to `http://localhost:8080/api`
4. Start testing!

---

## 📝 License

This project is for educational purposes — DriveX VRMS.
