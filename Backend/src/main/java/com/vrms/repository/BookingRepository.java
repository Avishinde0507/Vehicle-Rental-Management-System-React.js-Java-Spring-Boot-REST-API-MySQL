package com.vrms.repository;

import com.vrms.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByCustomerId(String customerId);
    List<Booking> findByOwnerId(String ownerId);
    List<Booking> findByVehicleId(String vehicleId);
    List<Booking> findByStatus(Booking.BookingStatus status);
}
