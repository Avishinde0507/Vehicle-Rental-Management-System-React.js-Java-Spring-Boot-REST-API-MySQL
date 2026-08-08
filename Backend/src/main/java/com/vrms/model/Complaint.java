package com.vrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    private String id;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "owner_id")
    private String ownerId;

    @Column(name = "booking_id")
    private String bookingId;

    @Column(name = "vehicle_id")
    private String vehicleId;

    @Column(name = "vehicle_name")
    private String vehicleName;

    @Column(nullable = false)
    private String subject;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    @Lob
    @Column(name = "resolution_note", columnDefinition = "LONGTEXT")
    private String resolutionNote;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ComplaintPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum ComplaintStatus {
        PENDING, IN_PROGRESS, RESOLVED, REJECTED
    }
}
