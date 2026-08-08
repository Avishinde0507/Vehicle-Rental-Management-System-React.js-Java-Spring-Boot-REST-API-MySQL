package com.vrms.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vrms.model.Payment;
import com.vrms.model.User;
import com.vrms.repository.BookingRepository;
import com.vrms.repository.PaymentRepository;
import com.vrms.repository.UserRepository;
import com.vrms.service.EmailService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> data) {
        System.out.println("Payment Request Received: " + data);
        try {
            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);
            System.out.println("Using Key ID: " + keyId);

            double amount = Double.parseDouble(data.get("amount").toString());
            String currency = "INR";
            String receipt = "txn_" + System.currentTimeMillis();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int) (amount * 100)); // amount in paise
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receipt);

            Order order = razorpay.orders.create(orderRequest);

            // Save pending payment record
            Payment payment = Payment.builder()
                    .razorpayOrderId(order.get("id"))
                    .amount(amount)
                    .currency(currency)
                    .status(Payment.PaymentStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", keyId);

            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, String> data) {
        try {
            String orderId    = data.get("razorpay_order_id");
            String paymentId  = data.get("razorpay_payment_id");
            String signature  = data.get("razorpay_signature");
            String customerId = data.get("customerId"); // Optional: sent from frontend

            JSONObject options = new JSONObject();
            options.put("razorpay_order_id",  orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature",  signature);

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (isValid) {
                // Update payment record to SUCCESS
                paymentRepository.findByRazorpayOrderId(orderId).ifPresent(p -> {
                    p.setRazorpayPaymentId(paymentId);
                    p.setRazorpaySignature(signature);
                    p.setStatus(Payment.PaymentStatus.SUCCESS);
                    paymentRepository.save(p);

                    // Send payment success HTML email
                    if (customerId != null && !customerId.isBlank()) {
                        try {
                            Optional<User> userOpt = userRepository.findById(customerId);
                            if (userOpt.isPresent()) {
                                User user = userOpt.get();
                                String bookingId  = p.getBookingId() != null ? p.getBookingId() : "N/A";
                                String amountStr  = String.format("%.2f", p.getAmount());
                                String txnId      = paymentId;
                                String method     = p.getPaymentMethod() != null ? p.getPaymentMethod() : "Razorpay";

                                emailService.sendPaymentSuccessEmail(
                                        user.getEmail(), user.getName(),
                                        bookingId, txnId, amountStr, method
                                );

                                // Also generate invoice if booking is linked
                                if (p.getBookingId() != null) {
                                    bookingRepository.findById(p.getBookingId()).ifPresent(booking -> {
                                        try {
                                            emailService.sendInvoiceGeneratedEmail(
                                                    user.getEmail(), user.getName(),
                                                    "INV-" + booking.getId(),
                                                    booking.getId(), "DriveX Vehicle",
                                                    amountStr
                                            );
                                        } catch (Exception ex) {
                                            System.err.println("Failed to send invoice email: " + ex.getMessage());
                                        }
                                    });
                                }
                            }
                        } catch (Exception ex) {
                            System.err.println("Failed to send payment success email: " + ex.getMessage());
                        }
                    }
                });
            } else {
                // Send payment failed email if we can identify the customer
                if (customerId != null && !customerId.isBlank()) {
                    try {
                        Optional<User> userOpt = userRepository.findById(customerId);
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();
                            String bookingId = data.getOrDefault("bookingId", "N/A");
                            emailService.sendPaymentFailedEmail(
                                    user.getEmail(), user.getName(),
                                    bookingId, "Payment signature verification failed. Please try again."
                            );
                        }
                    } catch (Exception ex) {
                        System.err.println("Failed to send payment failed email: " + ex.getMessage());
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
