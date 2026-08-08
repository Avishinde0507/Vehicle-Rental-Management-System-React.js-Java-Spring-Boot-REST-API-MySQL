package com.vrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id
    private String id;

    @Column(name = "booking_id", nullable = false)
    private String bookingId;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "owner_id", nullable = false)
    private String ownerId;

    @Column(name = "vehicle_id", nullable = false)
    private String vehicleId;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 500)
    private String feedback;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.id == null) {
            this.id = "R" + System.currentTimeMillis() + new java.util.Random().nextInt(999);
        }
    }
}
