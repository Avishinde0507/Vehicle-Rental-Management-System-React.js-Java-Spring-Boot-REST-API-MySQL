package com.vrms.controller;

import com.vrms.model.User;
import com.vrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import com.vrms.dto.SendOtpRequest;
import com.vrms.dto.VerifyOtpRequest;
import com.vrms.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // GET all users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // GET user by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET users by role
    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable User.Role role) {
        return userService.getUsersByRole(role);
    }

    // POST register
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody User user) {
        Map<String, Object> result = userService.register(user);
        if ((boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    // POST login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        Map<String, Object> result = userService.login(
                credentials.get("email"), credentials.get("password"));
        if ((boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    // PUT toggle active status
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<User> toggleActive(@PathVariable String id) {
        return userService.toggleUserActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE user
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        if (userService.deleteUser(id)) {
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.updateUser(id, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOTP(@Valid @RequestBody SendOtpRequest request) {
        return ResponseEntity.ok(userService.sendOTP(request.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOTP(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(userService.verifyOTP(
                request.getEmail(),
                request.getOtp()
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(userService.resetPassword(
                request.getEmail(),
                request.getOtp(),
                request.getNewPassword()
        ));
    }
}
