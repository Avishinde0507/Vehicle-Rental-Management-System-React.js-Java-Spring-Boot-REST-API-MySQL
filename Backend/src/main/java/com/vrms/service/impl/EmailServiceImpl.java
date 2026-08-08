package com.vrms.service.impl;

import com.vrms.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.support.email:support@drivex.com}")
    private String supportEmail;

    @Override
    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(fromEmail, "DriveX VRMS"));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(mimeMessage);
            System.out.println("Plain text email sent to: " + to);
        } catch (Exception e) {
            System.err.println("Error sending plain text email to (" + to + "): " + e.getMessage());
        }
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String templatePath, Map<String, Object> variables) {
        if (to == null || to.isBlank()) {
            System.err.println("Cannot send email: recipient address 'to' is null or empty.");
            return;
        }
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(fromEmail, "DriveX VRMS"));
            helper.setTo(to);
            helper.setSubject(subject);

            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }

            // Standard Defaults
            if (!context.containsVariable("supportEmail")) {
                context.setVariable("supportEmail", supportEmail);
            }
            if (!context.containsVariable("companyName")) {
                context.setVariable("companyName", "DriveX VRMS");
            }
            if (!context.containsVariable("currentYear")) {
                context.setVariable("currentYear", Year.now().getValue());
            }

            String htmlContent = templateEngine.process(templatePath, context);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            System.out.println("HTML Email successfully dispatched to: " + to + " [Template: " + templatePath + "]");
        } catch (Exception e) {
            System.err.println("Error rendering/sending HTML email (" + templatePath + ") to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ============================================
    // Account Management Email Helpers
    // ============================================

    @Override
    public void sendWelcomeEmail(String to, String customerName) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        sendHtmlEmail(to, "Welcome to DriveX – Vehicle Rental Management System", "email/account/welcome", vars);
    }

    @Override
    public void sendEmailVerificationOtp(String to, String customerName, String otp) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        vars.put("otp", otp);
        sendHtmlEmail(to, "DriveX VRMS - Email Verification Code (" + otp + ")", "email/account/email-verification-otp", vars);
    }

    @Override
    public void sendOtpHtmlEmail(String to, String userName, String otp) {
        sendForgotPasswordOtp(to, userName, otp);
    }

    @Override
    public void sendForgotPasswordOtp(String to, String customerName, String otp) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("userName", customerName);
        vars.put("customerEmail", to);
        vars.put("otp", otp);
        sendHtmlEmail(to, "DriveX VRMS - Password Reset Verification Code (" + otp + ")", "email/account/forgot-password-otp", vars);
    }

    @Override
    public void sendPasswordResetSuccessEmail(String to, String customerName) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        vars.put("profileUpdatedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        sendHtmlEmail(to, "DriveX VRMS - Password Changed Successfully", "email/account/password-reset-success", vars);
    }

    @Override
    public void sendProfileUpdatedEmail(String to, String customerName) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        vars.put("profileUpdatedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        sendHtmlEmail(to, "DriveX VRMS - Profile Details Updated", "email/account/profile-updated", vars);
    }

    @Override
    public void sendAccountDeactivatedEmail(String to, String customerName, String reason) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        vars.put("deactivationReason", reason != null ? reason : "Account deactivated by user request or administrative policy.");
        sendHtmlEmail(to, "DriveX VRMS - Account Deactivation Notice", "email/account/account-deactivated", vars);
    }

    @Override
    public void sendAccountReactivatedEmail(String to, String customerName) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", (customerName != null && !customerName.isBlank()) ? customerName : "Valued Customer");
        vars.put("customerEmail", to);
        sendHtmlEmail(to, "Welcome Back to DriveX! Account Restored", "email/account/account-reactivated", vars);
    }

    // ============================================
    // Booking Management Email Helpers
    // ============================================

    @Override
    public void sendBookingRequestReceivedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String returnDate, String amount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("vehicleNumber", vehicleNumber);
        vars.put("pickupDate", pickupDate);
        vars.put("returnDate", returnDate);
        vars.put("bookingAmount", amount);
        sendHtmlEmail(to, "DriveX - Booking Request Received (" + bookingId + ")", "email/booking/booking-request-received", vars);
    }

    @Override
    public void sendBookingConfirmedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String returnDate, String amount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("vehicleNumber", vehicleNumber);
        vars.put("pickupDate", pickupDate);
        vars.put("returnDate", returnDate);
        vars.put("bookingAmount", amount);
        sendHtmlEmail(to, "DriveX - Booking Confirmed! (" + bookingId + ")", "email/booking/booking-confirmed", vars);
    }

    @Override
    public void sendBookingApprovedEmail(String to, String customerName, String bookingId, String vehicleName, String vehicleNumber, String pickupDate, String pickupAddress) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("vehicleNumber", vehicleNumber);
        vars.put("pickupDate", pickupDate);
        vars.put("pickupAddress", pickupAddress);
        sendHtmlEmail(to, "DriveX - Booking Approved! Ready for Pickup (" + bookingId + ")", "email/booking/booking-approved", vars);
    }

    @Override
    public void sendBookingRejectedEmail(String to, String customerName, String bookingId, String vehicleName, String reason) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("rejectionReason", reason != null ? reason : "Vehicle unserviceable during requested timeframe.");
        sendHtmlEmail(to, "DriveX - Booking Request Update (" + bookingId + ")", "email/booking/booking-rejected", vars);
    }

    @Override
    public void sendBookingCancelledEmail(String to, String customerName, String bookingId, String vehicleName, String refundAmount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("refundAmount", refundAmount);
        vars.put("refundStatus", refundAmount != null ? "Initiated" : "N/A");
        sendHtmlEmail(to, "DriveX - Booking Cancellation Notice (" + bookingId + ")", "email/booking/booking-cancelled", vars);
    }

    @Override
    public void sendBookingCompletedEmail(String to, String customerName, String bookingId, String vehicleName, String returnDate, String amount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("returnDate", returnDate);
        vars.put("bookingAmount", amount);
        sendHtmlEmail(to, "DriveX - Thank You! Rental Trip Completed (" + bookingId + ")", "email/booking/booking-completed", vars);
    }

    // ============================================
    // Payment Management Email Helpers
    // ============================================

    @Override
    public void sendPaymentSuccessEmail(String to, String customerName, String bookingId, String transactionId, String amount, String paymentMethod) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("transactionId", transactionId);
        vars.put("bookingAmount", amount);
        vars.put("paymentMethod", paymentMethod != null ? paymentMethod : "Online Payment");
        sendHtmlEmail(to, "DriveX - Payment Successful Receipt (" + transactionId + ")", "email/payment/payment-successful", vars);
    }

    @Override
    public void sendPaymentFailedEmail(String to, String customerName, String bookingId, String failureReason) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("failureReason", failureReason != null ? failureReason : "Bank authorization declined or transaction timed out.");
        sendHtmlEmail(to, "DriveX - Payment Attempt Unsuccessful (" + bookingId + ")", "email/payment/payment-failed", vars);
    }

    @Override
    public void sendRefundInitiatedEmail(String to, String customerName, String bookingId, String transactionId, String refundAmount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("transactionId", transactionId);
        vars.put("refundAmount", refundAmount);
        sendHtmlEmail(to, "DriveX - Refund Process Initiated (" + bookingId + ")", "email/payment/refund-initiated", vars);
    }

    @Override
    public void sendRefundCompletedEmail(String to, String customerName, String bookingId, String transactionId, String refundAmount, String paymentMethod) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("bookingId", bookingId);
        vars.put("transactionId", transactionId);
        vars.put("refundAmount", refundAmount);
        vars.put("paymentMethod", paymentMethod != null ? paymentMethod : "Original Payment Method");
        sendHtmlEmail(to, "DriveX - Refund Credit Completed (" + transactionId + ")", "email/payment/refund-completed", vars);
    }

    @Override
    public void sendInvoiceGeneratedEmail(String to, String customerName, String invoiceNumber, String bookingId, String vehicleName, String amount) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", customerName);
        vars.put("invoiceNumber", invoiceNumber);
        vars.put("bookingId", bookingId);
        vars.put("vehicleName", vehicleName);
        vars.put("bookingAmount", amount);
        sendHtmlEmail(to, "DriveX - Tax Invoice Generated (" + invoiceNumber + ")", "email/payment/invoice-generated", vars);
    }
}
