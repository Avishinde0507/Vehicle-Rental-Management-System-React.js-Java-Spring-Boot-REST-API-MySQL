package com.vrms.service;

import com.vrms.model.User;
import com.vrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> getProfileByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    public Optional<User> updateProfile(String currentEmail, Map<String, String> payload) {
        return userRepository.findByEmailIgnoreCase(currentEmail).map(user -> {
            if (payload.containsKey("name") && payload.get("name") != null) {
                user.setName(payload.get("name"));
            }
            String newEmail = payload.get("email");
            if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.trim().equalsIgnoreCase(user.getEmail())) {
                String trimmedEmail = newEmail.trim();
                userRepository.findByEmailIgnoreCase(trimmedEmail).ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                        throw new IllegalArgumentException("Email is already registered by another user.");
                    }
                });
                user.setEmail(trimmedEmail);
                user.setEmailVerified(false);
            }
            if (payload.containsKey("phone")) user.setPhone(payload.get("phone"));
            if (payload.containsKey("city")) user.setCity(payload.get("city"));
            if (payload.containsKey("address")) user.setAddress(payload.get("address"));
            if (payload.containsKey("profilePhoto")) user.setProfilePhoto(payload.get("profilePhoto"));
            User saved = userRepository.save(user);

            try {
                emailService.sendProfileUpdatedEmail(saved.getEmail(), saved.getName());
            } catch (Exception e) {
                System.err.println("Failed to send profile updated email: " + e.getMessage());
            }
            return saved;
        });
    }

    public Map<String, Object> sendVerificationOtp(String email) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }
        
        User user = opt.get();
        if (user.isEmailVerified()) {
            result.put("success", false);
            result.put("message", "Email is already verified.");
            return result;
        }

        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setOtp(otp);
        userRepository.save(user);

        emailService.sendEmailVerificationOtp(email, user.getName(), otp);

        result.put("success", true);
        result.put("message", "Verification OTP sent successfully.");
        return result;
    }

    public Map<String, Object> verifyEmail(String email, String otp) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }

        User user = opt.get();
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            result.put("success", false);
            result.put("message", "Invalid OTP.");
            return result;
        }

        user.setEmailVerified(true);
        user.setOtp(null);
        userRepository.save(user);

        result.put("success", true);
        result.put("message", "Email verified successfully.");
        return result;
    }

    public Map<String, Object> changePassword(String email, String oldPassword, String newPassword) {
        Map<String, Object> result = new HashMap<>();
        Optional<User> opt = userRepository.findByEmailIgnoreCase(email);
        
        if (opt.isEmpty()) {
            result.put("success", false);
            result.put("message", "User not found.");
            return result;
        }

        User user = opt.get();
        
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            result.put("success", false);
            result.put("message", "Incorrect old password.");
            return result;
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        result.put("success", true);
        result.put("message", "Password updated successfully.");
        return result;
    }
}
