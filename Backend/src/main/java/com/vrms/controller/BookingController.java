package com.vrms.controller;

import com.vrms.model.Booking;
import com.vrms.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // GET all bookings
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // GET booking by ID
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET bookings by customer
    @GetMapping("/customer/{customerId}")
    public List<Booking> getBookingsByCustomer(@PathVariable String customerId) {
        return bookingService.getBookingsByCustomer(customerId);
    }

    // GET bookings by owner
    @GetMapping("/owner/{ownerId}")
    public List<Booking> getBookingsByOwner(@PathVariable String ownerId) {
        return bookingService.getBookingsByOwner(ownerId);
    }

    // GET bookings by vehicle
    @GetMapping("/vehicle/{vehicleId}")
    public List<Booking> getBookingsByVehicle(@PathVariable String vehicleId) {
        return bookingService.getBookingsByVehicle(vehicleId);
    }

    // POST create booking
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(@RequestBody Booking booking) {
        Map<String, Object> result = bookingService.createBooking(booking);
        return ResponseEntity.ok(result);
    }

    // PUT update booking status
    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(@PathVariable String id, @RequestParam Booking.BookingStatus status) {
        return bookingService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET check availability
    @GetMapping("/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @RequestParam String vehicleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        boolean available = bookingService.isVehicleAvailable(vehicleId, startDate, endDate);
        return ResponseEntity.ok(Map.of("available", available));
    }
}
