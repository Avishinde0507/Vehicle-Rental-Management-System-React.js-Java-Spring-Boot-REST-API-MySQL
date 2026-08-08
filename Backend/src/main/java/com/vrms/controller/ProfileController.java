package com.vrms.controller;

import com.vrms.model.User;
import com.vrms.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    private String resolveEmail(String explicitEmail) {
        if (explicitEmail != null && !explicitEmail.trim().isEmpty() && !"undefined".equalsIgnoreCase(explicitEmail)) {
            return explicitEmail;
        }
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.User) {
                return ((org.springframework.security.core.userdetails.User) principal).getUsername();
            }
            if (principal != null && !"anonymousUser".equalsIgnoreCase(principal.toString())) {
                return principal.toString();
            }
        } catch (Exception e) {}
        return null;
    }

    @GetMapping
    public ResponseEntity<User> getProfile(@RequestParam(required = false) String email) {
        String userEmail = resolveEmail(email);
        if (userEmail == null) return ResponseEntity.badRequest().build();
        return profileService.getProfileByEmail(userEmail)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        String currentEmail = payload.get("currentEmail");
        if (currentEmail == null || currentEmail.trim().isEmpty()) {
            currentEmail = resolveEmail(payload.get("email"));
        }
        if (currentEmail == null) return ResponseEntity.badRequest().body(Map.of("message", "User email is required."));
        try {
            return profileService.updateProfile(currentEmail, payload)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.badRequest().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody(required = false) Map<String, String> payload,
                                                       @RequestParam(required = false) String email) {
        String targetEmail = resolveEmail(payload != null ? payload.get("email") : email);
        if (targetEmail == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required"));
        return ResponseEntity.ok(profileService.sendVerificationOtp(targetEmail));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = resolveEmail(payload.get("email"));
        if (email == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required"));
        return ResponseEntity.ok(profileService.verifyEmail(email, payload.get("otp")));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> payload) {
        String email = resolveEmail(payload.get("email"));
        if (email == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required"));
        return ResponseEntity.ok(profileService.changePassword(
                email,
                payload.get("oldPassword"),
                payload.get("newPassword")
        ));
    }
}
