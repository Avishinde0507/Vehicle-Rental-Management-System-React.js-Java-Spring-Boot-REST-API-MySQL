package com.vrms.service;

import com.vrms.model.User;
import com.vrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserService {

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private com.vrms.security.JwtUtil jwtUtil;
    
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    // Register
    public Map<String, Object> register(User user) {
        Map<String, Object> result = new HashMap<>();
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            result.put("success", false);
            result.put("message", "Email already registered.");
            return result;
        }
        user.setId(generateId("U"));
        user.setCreatedAt(LocalDate.now());
        user.setActive(true);
        user.setPassword(passwordEncoder.encode(user.getPassword())); // hash password
        userRepository.save(user);
        
        // Dispatch Welcome HTML Email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
        
        String token = jwtUtil.generateToken(user);
        
        result.put("success", true);
        result.put("user", user);
        result.put("token", token);
        return result;
    }

    // Login
    public Map<String, Object> login(String email, String password) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        if (opt.isEmpty() || !passwordEncoder.matches(password, opt.get().getPassword())) {
            result.put("success", false);
            result.put("message", "Invalid email or password.");
            return result;
        }
        User user = opt.get();
        if (!user.isActive()) {
            result.put("success", false);
            result.put("message", "Account is deactivated. Contact admin.");
            return result;
        }
        
        // Upgrade legacy plaintext to BCrypt on successful login
        if (!user.getPassword().startsWith("$2a$") && !user.getPassword().startsWith("$2b$") && !user.getPassword().startsWith("$2y$")) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }
        
        String token = jwtUtil.generateToken(user);

        result.put("success", true);
        result.put("user", user);
        result.put("token", token);
        return result;
    }

    // Toggle active status
    public Optional<User> toggleUserActive(String id) {
        return userRepository.findById(id).map(user -> {
            boolean nextActiveState = !user.isActive();
            user.setActive(nextActiveState);
            User saved = userRepository.save(user);
            
            try {
                if (nextActiveState) {
                    emailService.sendAccountReactivatedEmail(saved.getEmail(), saved.getName());
                } else {
                    emailService.sendAccountDeactivatedEmail(saved.getEmail(), saved.getName(), "Deactivated by administrator.");
                }
            } catch (Exception e) {
                System.err.println("Failed to send account status email: " + e.getMessage());
            }
            return saved;
        });
    }

    // Delete user
    public boolean deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Optional<User> updateUser(String id, User updatedData) {
        return userRepository.findById(id).map(user -> {
            user.setName(updatedData.getName());
            user.setEmail(updatedData.getEmail());
            user.setPhone(updatedData.getPhone());
            user.setCity(updatedData.getCity());
            if (updatedData.getAddress() != null) {
                user.setAddress(updatedData.getAddress());
            }
            if (updatedData.getProfilePhoto() != null) {
                user.setProfilePhoto(updatedData.getProfilePhoto());
            }
            if (updatedData.getPassword() != null && !updatedData.getPassword().isEmpty()) {
                user.setPassword(updatedData.getPassword());
            }
            return userRepository.save(user);
        });
    }

    public Map<String, Object> sendOTP(String email) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Email not registered.");
            return result;
        }

        User user = opt.get();
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendOtpHtmlEmail(user.getEmail(), user.getName(), otp);

        result.put("success", true);
        result.put("message", "OTP sent successfully.");
        return result;
    }

    public Map<String, Object> verifyOTP(String email, String otp) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Email not registered.");
            return result;
        }

        User user = opt.get();
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            result.put("success", false);
            result.put("message", "Invalid OTP.");
            return result;
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            result.put("success", false);
            result.put("message", "OTP has expired. Please request a new OTP.");
            return result;
        }

        result.put("success", true);
        result.put("message", "OTP verified successfully.");
        return result;
    }

    public Map<String, Object> resetPassword(String email, String otp, String newPassword) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Email not registered.");
            return result;
        }

        User user = opt.get();
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            result.put("success", false);
            result.put("message", "Invalid OTP.");
            return result;
        }

        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            result.put("success", false);
            result.put("message", "OTP has expired. Please request a new OTP.");
            return result;
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null); // Clear OTP after use
        user.setOtpExpiry(null); // Clear Expiry after use
        userRepository.save(user);

        try {
            emailService.sendPasswordResetSuccessEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            System.err.println("Failed to send password reset success email: " + e.getMessage());
        }

        result.put("success", true);
        result.put("message", "Password reset successfully.");
        return result;
    }

    private String generateId(String prefix) {
        return prefix + System.currentTimeMillis() + new Random().nextInt(999);
    }
}
