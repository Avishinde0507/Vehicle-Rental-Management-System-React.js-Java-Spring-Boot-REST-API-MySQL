package com.vrms.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Vehicle {
    @Id
    private String id;

    @Column(name = "owner_id", nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    // Use a converter so JPA stores "2W"/"4W" instead of "_2W"/"_4W"
    @Convert(converter = VehicleTypeConverter.class)
    @Column(nullable = false)
    private VehicleType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FuelType fuel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransmissionType transmission;

    @Column(nullable = false)
    private int seats;

    @Column(name = "reg_number", nullable = false, unique = true)
    private String regNumber;

    @Column(name = "price_daily", nullable = false)
    private double priceDaily;

    @Column(name = "price_weekly", nullable = false)
    private double priceWeekly;

    @Column(name = "price_monthly", nullable = false)
    private double priceMonthly;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status;

    @Column(nullable = false)
    private boolean approved;

    private String location;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String image;
    private String color;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Lob
    @Column(name = "rc_document", columnDefinition = "LONGTEXT")
    private String rcDocument;

    @Lob
    @Column(name = "insurance_document", columnDefinition = "LONGTEXT")
    private String insuranceDocument;

    @Lob
    @Column(name = "puc_document", columnDefinition = "LONGTEXT")
    private String pucDocument;

    /**
     * Vehicle type enum.
     * Java identifiers cannot start with a digit, so we prefix with underscore,
     * but use @JsonValue / @JsonCreator so the REST API sends/receives "2W" / "4W",
     * and a JPA AttributeConverter so the database stores "2W" / "4W" as well.
     */
    public enum VehicleType {
        _2W("2W"),
        _4W("4W");

        private final String value;

        VehicleType(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static VehicleType fromValue(String value) {
            for (VehicleType t : VehicleType.values()) {
                if (t.value.equals(value)) return t;
            }
            throw new IllegalArgumentException("Unknown VehicleType: " + value);
        }
    }

    /** JPA converter: stores/reads "2W" / "4W" in the database column. */
    @Converter(autoApply = true)
    public static class VehicleTypeConverter implements AttributeConverter<VehicleType, String> {
        @Override
        public String convertToDatabaseColumn(VehicleType attribute) {
            return attribute != null ? attribute.getValue() : null;
        }

        @Override
        public VehicleType convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            return VehicleType.fromValue(dbData);
        }
    }

    public enum FuelType { Petrol, Diesel, Electric, CNG }
    public enum TransmissionType { Manual, Automatic }
    public enum VehicleStatus { available, rented, maintenance }
}
