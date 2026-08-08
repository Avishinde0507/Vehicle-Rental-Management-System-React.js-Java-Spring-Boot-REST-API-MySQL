package com.vrms.service;

import java.util.Map;

public interface EmailService {

    /** Send plain text fallback email */
    void sendEmail(String to, String subject, String body);

    /**
     * Send HTML email using Thymeleaf template
     */
    void sendHtmlEmail(String to, String subject, String templatePath, Map<String, Object> variables);

    // ============================================
    // 1. Account Management Emails (7 Templates)
    // ============================================
    void sendWelcomeEmail(String to, String customerName);
    void sendEmailVerificationOtp(String to, String customerName, String otp);
    void sendOtpHtmlEmail(String to, String userName, String otp); // Forgot Password OTP
    void sendForgotPasswordOtp(String to, String customerName, String otp);
    void sendPasswordResetSuccessEmail(String to, String customerName);
    void sendProfileUpdatedEmail(String to, String customerName);
    void sendAccountDeactivatedEmail(String to, String customerName, String reason);
    void sendAccountReactivatedEmail(String to, String customerName);

    // ============================================
    // 2. Booking Management Emails (6 Templates)
    // ============================================
    void sendBookingRequestReceivedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String returnDate, String amount);
    void sendBookingConfirmedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String returnDate, String amount);
    void sendBookingApprovedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String pickupAddress);
    void sendBookingRejectedEmail(String to, String customerName, String bookingId, String vehicleName, String reason);
    void sendBookingCancelledEmail(String to, String customerName, String bookingId, String vehicleName, String refundAmount);
    void sendBookingCompletedEmail(String to, String customerName, String bookingId, String vehicleName, String returnDate, String amount);

    // ============================================
    // 3. Payment Management Emails (5 Templates)
    // ============================================
    void sendPaymentSuccessEmail(String to, String customerName, String bookingId, String transactionId, String amount, String paymentMethod);
    void sendPaymentFailedEmail(String to, String customerName, String bookingId, String failureReason);
    void sendRefundInitiatedEmail(String to, String customerName, String bookingId, String transactionId, String refundAmount);
    void sendRefundCompletedEmail(String to, String customerName, String bookingId, String transactionId, String refundAmount, String paymentMethod);
    void sendInvoiceGeneratedEmail(String to, String customerName, String invoiceNumber, String bookingId, String vehicleName, String amount);
}
