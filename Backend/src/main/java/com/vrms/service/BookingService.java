package com.vrms.service;

import com.vrms.model.Booking;
import com.vrms.model.Vehicle;
import com.vrms.repository.BookingRepository;
import com.vrms.repository.VehicleRepository;
import com.vrms.repository.PaymentRepository;
import com.vrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public List<Booking> getBookingsByCustomer(String customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    public List<Booking> getBookingsByOwner(String ownerId) {
        return bookingRepository.findByOwnerId(ownerId);
    }

    public List<Booking> getBookingsByVehicle(String vehicleId) {
        return bookingRepository.findByVehicleId(vehicleId);
    }

    /**
     * Create a Booking.
     * Expects booking.paymentStatus, booking.paymentMethod, booking.transactionId
     * to already be populated by the controller (passed from the frontend after
     * the payment step). If paymentStatus is missing we default to unpaid.
     */
    public Map<String, Object> createBooking(Booking booking) {
        Map<String, Object> result = new HashMap<>();

        booking.setId(generateId("B"));
        booking.setCreatedAt(LocalDate.now());
        booking.setStatus(Booking.BookingStatus.pending);

        // Ensure payment defaults
        if (booking.getPaymentStatus() == null) {
            booking.setPaymentStatus(Booking.PaymentStatus.unpaid);
        }
        if (booking.getPaymentStatus() == Booking.PaymentStatus.paid && booking.getPaidAt() == null) {
            booking.setPaidAt(LocalDate.now());
        }

        bookingRepository.save(booking);

        // Link payment record to this booking
        if (booking.getPaymentId() != null) {
            paymentRepository.findByRazorpayPaymentId(booking.getPaymentId()).ifPresent(p -> {
                p.setBookingId(booking.getId());
                paymentRepository.save(p);
            });
        }

        // Send Email Notifications
        userRepository.findById(booking.getCustomerId()).ifPresent(customer -> {
            String vehicleName = "DriveX Vehicle";
            String vehicleNumber = "";
            Optional<Vehicle> vOpt = vehicleRepository.findById(booking.getVehicleId());
            if (vOpt.isPresent()) {
                vehicleName = vOpt.get().getName();
                vehicleNumber = vOpt.get().getRegNumber() != null ? vOpt.get().getRegNumber() : "";
            }
            String amountStr = String.format("%.2f", booking.getTotalPrice());
            String pDate = booking.getStartDate() != null ? booking.getStartDate().toString() : "TBD";
            String rDate = booking.getEndDate() != null ? booking.getEndDate().toString() : "TBD";
            final String finalVehicleName = vehicleName;
            final String finalVehicleNumber = vehicleNumber;

            // 1. Send Booking Request Received
            try {
                emailService.sendBookingRequestReceivedEmail(
                        customer.getEmail(), customer.getName(), booking.getId(),
                        finalVehicleName, finalVehicleNumber, pDate, rDate, amountStr
                );
            } catch (Exception e) {
                System.err.println("Failed to send booking request received email: " + e.getMessage());
            }

            // 2. If paid at time of booking creation — send confirmed + payment + invoice
            if (booking.getPaymentStatus() == Booking.PaymentStatus.paid) {
                // Look up the actual Payment record for transaction details
                String transactionId = "TXN_" + booking.getId();
                String paymentMethod = "Online Payment";
                if (booking.getPaymentId() != null) {
                    Optional<com.vrms.model.Payment> pOpt = paymentRepository.findByRazorpayPaymentId(booking.getPaymentId());
                    if (pOpt.isPresent()) {
                        String rpId = pOpt.get().getRazorpayPaymentId();
                        if (rpId != null && !rpId.isEmpty()) transactionId = rpId;
                        String pm = pOpt.get().getPaymentMethod();
                        if (pm != null && !pm.isEmpty()) paymentMethod = pm;
                    }
                }
                final String finalTxnId = transactionId;
                final String finalPaymentMethod = paymentMethod;

                try {
                    emailService.sendBookingConfirmedEmail(
                            customer.getEmail(), customer.getName(), booking.getId(),
                            finalVehicleName, finalVehicleNumber, pDate, rDate, amountStr
                    );
                    emailService.sendPaymentSuccessEmail(
                            customer.getEmail(), customer.getName(), booking.getId(),
                            finalTxnId, amountStr, finalPaymentMethod
                    );
                    emailService.sendInvoiceGeneratedEmail(
                            customer.getEmail(), customer.getName(),
                            "INV-" + booking.getId(), booking.getId(), finalVehicleName, amountStr
                    );
                } catch (Exception e) {
                    System.err.println("Failed to send booking payment emails: " + e.getMessage());
                }
            }
        });

        result.put("success", true);
        result.put("booking", booking);
        return result;
    }

    /** Update booking status (approve/reject/cancel/complete) */
    public Optional<Booking> updateStatus(String id, Booking.BookingStatus status) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(status);

            // Handle payment refund on cancellation / rejection
            if ((status == Booking.BookingStatus.cancelled || status == Booking.BookingStatus.rejected)
                    && booking.getPaymentStatus() == Booking.PaymentStatus.paid) {
                booking.setPaymentStatus(Booking.PaymentStatus.refunded);
            }

            bookingRepository.save(booking);

            // Fetch customer details and dispatch HTML email
            userRepository.findById(booking.getCustomerId()).ifPresent(customer -> {
                String email = customer.getEmail();
                String customerName = customer.getName();
                String vehicleName = "DriveX Vehicle";
                String vehicleNumber = "";
                Optional<Vehicle> vOpt = vehicleRepository.findById(booking.getVehicleId());
                if (vOpt.isPresent()) {
                    vehicleName = vOpt.get().getName();
                    vehicleNumber = vOpt.get().getRegNumber() != null ? vOpt.get().getRegNumber() : "";
                }
                String amountStr = String.format("%.2f", booking.getTotalPrice());
                String pDate = booking.getStartDate() != null ? booking.getStartDate().toString() : "TBD";
                String rDate = booking.getEndDate() != null ? booking.getEndDate().toString() : "TBD";

                try {
                    if (status == Booking.BookingStatus.active) {
                        emailService.sendBookingApprovedEmail(email, customerName, booking.getId(), vehicleName, vehicleNumber, pDate, "DriveX Rental Station / Main Depot");
                    } else if (status == Booking.BookingStatus.rejected) {
                        emailService.sendBookingRejectedEmail(email, customerName, booking.getId(), vehicleName, "Vehicle unavailable or unserviceable for selected dates.");
                        if (booking.getPaymentStatus() == Booking.PaymentStatus.refunded) {
                            emailService.sendRefundInitiatedEmail(email, customerName, booking.getId(), "RFND_" + booking.getId(), amountStr);
                        }
                    } else if (status == Booking.BookingStatus.cancelled) {
                        emailService.sendBookingCancelledEmail(email, customerName, booking.getId(), vehicleName, amountStr);
                        if (booking.getPaymentStatus() == Booking.PaymentStatus.refunded) {
                            emailService.sendRefundInitiatedEmail(email, customerName, booking.getId(), "RFND_" + booking.getId(), amountStr);
                        }
                    } else if (status == Booking.BookingStatus.completed) {
                        emailService.sendBookingCompletedEmail(email, customerName, booking.getId(), vehicleName, rDate, amountStr);
                    }
                } catch (Exception e) {
                    System.err.println("Error dispatching status email for booking " + id + ": " + e.getMessage());
                }
            });

            // Sync vehicle status
            if (status == Booking.BookingStatus.active) {
                vehicleRepository.findById(booking.getVehicleId()).ifPresent(v -> {
                    v.setStatus(Vehicle.VehicleStatus.rented);
                    vehicleRepository.save(v);
                });
            } else if (status == Booking.BookingStatus.completed
                    || status == Booking.BookingStatus.cancelled
                    || status == Booking.BookingStatus.rejected) {
                vehicleRepository.findById(booking.getVehicleId()).ifPresent(v -> {
                    v.setStatus(Vehicle.VehicleStatus.available);
                    vehicleRepository.save(v);
                });
            }
            return booking;
        });
    }

    /** Check vehicle availability for a date range */
    public boolean isVehicleAvailable(String vehicleId, LocalDate start, LocalDate end) {
        List<Booking> bookings = bookingRepository.findByVehicleId(vehicleId);
        return bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.active
                        || b.getStatus() == Booking.BookingStatus.pending)
                .noneMatch(b -> !(end.isBefore(b.getStartDate()) || start.isAfter(b.getEndDate())));
    }

    private String generateId(String prefix) {
        return prefix + System.currentTimeMillis() + new Random().nextInt(999);
    }

    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(9999));
    }
}
