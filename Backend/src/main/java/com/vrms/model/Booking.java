package com.vrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "bookings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {
    @Id
    private String id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "vehicle_id", nullable = false)
    private String vehicleId;

    @Column(name = "owner_id", nullable = false)
    private String ownerId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_type", nullable = false)
    private DurationType durationType;

    @Column(name = "total_price", nullable = false)
    private double totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;

    // ── Payment Reference ──
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "payment_id")
    private String paymentId; // Links to Payment.id

    @Column(name = "paid_at")
    private LocalDate paidAt;

    public enum DurationType    { daily, weekly, monthly }
    public enum BookingStatus   { pending, active, completed, cancelled, rejected }
    public enum PaymentStatus   { unpaid, paid, refunded }
}
