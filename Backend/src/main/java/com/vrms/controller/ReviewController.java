package com.vrms.controller;

import com.vrms.model.Review;
import com.vrms.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    @GetMapping("/owner/{ownerId}")
    public List<Review> getByOwner(@PathVariable String ownerId) {
        return reviewRepository.findByOwnerId(ownerId);
    }

    @GetMapping("/customer/{customerId}")
    public List<Review> getByCustomer(@PathVariable String customerId) {
        return reviewRepository.findByCustomerId(customerId);
    }

    @GetMapping("/check/{bookingId}")
    public ResponseEntity<Map<String, Boolean>> checkReviewed(@PathVariable String bookingId) {
        boolean exists = reviewRepository.existsByBookingId(bookingId);
        return ResponseEntity.ok(Map.of("reviewed", exists));
    }

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        if (reviewRepository.existsByBookingId(review.getBookingId())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(reviewRepository.save(review));
    }
}
