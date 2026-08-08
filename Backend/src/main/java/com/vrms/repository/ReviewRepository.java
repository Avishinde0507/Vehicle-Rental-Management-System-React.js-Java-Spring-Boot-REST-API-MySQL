package com.vrms.repository;

import com.vrms.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByOwnerId(String ownerId);

    List<Review> findByVehicleId(String vehicleId);

    List<Review> findByCustomerId(String customerId);

    boolean existsByBookingId(String bookingId);

    Optional<Review> findByBookingId(String bookingId);
}
