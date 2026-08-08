package com.vrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phone;
    private String city;
    private String company;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;

    @Column(nullable = false)
    private boolean active = true;

    private String otp;
    
    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePhoto;

    private String address;

    @Column(nullable = false)
    private boolean emailVerified = false;

    public enum Role {
        customer, owner, admin
    }
}
