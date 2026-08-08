package com.vrms.controller;

import com.vrms.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailPreviewController {

    @Autowired
    private TemplateEngine templateEngine;

    @Autowired
    private EmailService emailService;

    @Value("${app.support.email:support@drivex.com}")
    private String supportEmail;

    /**
     * Preview any HTML email template directly in the browser.
     * Example URL: GET http://localhost:8080/api/email/preview/account/welcome
     * Example URL: GET http://localhost:8080/api/email/preview/booking/booking-confirmed
     */
    @GetMapping(value = "/preview/{category}/{templateName}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> previewEmail(
            @PathVariable String category,
            @PathVariable String templateName,
            @RequestParam(required = false, defaultValue = "Alex Johnson") String customerName,
            @RequestParam(required = false, defaultValue = "alex.johnson@example.com") String customerEmail,
            @RequestParam(required = false, defaultValue = "BK-100293") String bookingId,
            @RequestParam(required = false, defaultValue = "789012") String otp,
            @RequestParam(required = false, defaultValue = "Tesla Model 3 Performance") String vehicleName,
            @RequestParam(required = false, defaultValue = "MH-12-DX-9900") String vehicleNumber,
            @RequestParam(required = false, defaultValue = "14,500.00") String bookingAmount,
            @RequestParam(required = false, defaultValue = "TXN_987123908") String transactionId,
            @RequestParam(required = false, defaultValue = "INV-2026-88192") String invoiceNumber) {

        Context context = new Context();
        context.setVariable("customerName", customerName);
        context.setVariable("customerEmail", customerEmail);
        context.setVariable("userName", customerName);
        context.setVariable("otp", otp);
        context.setVariable("bookingId", bookingId);
        context.setVariable("vehicleName", vehicleName);
        context.setVariable("vehicleNumber", vehicleNumber);
        context.setVariable("pickupDate", "August 05, 2026 at 10:00 AM");
        context.setVariable("returnDate", "August 10, 2026 at 06:00 PM");
        context.setVariable("bookingStatus", "CONFIRMED");
        context.setVariable("bookingAmount", bookingAmount);
        context.setVariable("paymentMethod", "Razorpay / UPI");
        context.setVariable("transactionId", transactionId);
        context.setVariable("refundAmount", "4,500.00");
        context.setVariable("refundStatus", "Initiated");
        context.setVariable("invoiceNumber", invoiceNumber);
        context.setVariable("profileUpdatedDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("companyName", "DriveX VRMS");
        context.setVariable("currentYear", Year.now().getValue());
        context.setVariable("loginUrl", "http://localhost:3000/login");
        context.setVariable("verifyUrl", "http://localhost:3000/verify");
        context.setVariable("resetUrl", "http://localhost:3000/reset-password");
        context.setVariable("bookingUrl", "http://localhost:3000/my-bookings");
        context.setVariable("invoiceUrl", "http://localhost:3000/invoices");

        String templatePath = "email/" + category + "/" + templateName;
        String htmlContent = templateEngine.process(templatePath, context);
        return ResponseEntity.ok(htmlContent);
    }

    /**
     * Test sending live HTML email
     */
    @PostMapping("/send-test")
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @RequestParam String toEmail,
            @RequestParam(defaultValue = "account") String category,
            @RequestParam(defaultValue = "welcome") String templateName) {

        Map<String, Object> vars = new HashMap<>();
        vars.put("customerName", "Valued Customer");
        vars.put("customerEmail", toEmail);
        vars.put("otp", "554433");
        vars.put("bookingId", "BK-TEST-99");
        vars.put("vehicleName", "BMW 3 Series");
        vars.put("vehicleNumber", "MH-14-DX-1122");
        vars.put("pickupDate", "August 01, 2026 10:00 AM");
        vars.put("returnDate", "August 05, 2026 06:00 PM");
        vars.put("bookingAmount", "12,000.00");
        vars.put("transactionId", "TXN_TEST_12345");
        vars.put("paymentMethod", "Razorpay Test Gateway");

        String templatePath = "email/" + category + "/" + templateName;
        emailService.sendHtmlEmail(toEmail, "DriveX VRMS - Test Email Notification (" + templateName + ")", templatePath, vars);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Test email dispatched to " + toEmail + " using template: " + templatePath);
        return ResponseEntity.ok(response);
    }
}
