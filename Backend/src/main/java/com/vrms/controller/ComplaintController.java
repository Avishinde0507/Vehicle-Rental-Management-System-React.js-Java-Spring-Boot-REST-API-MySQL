package com.vrms.controller;

import com.vrms.model.Complaint;
import com.vrms.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable String id) {
        return complaintService.getComplaintById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Complaint>> getComplaintsByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(complaintService.getComplaintsByCustomer(customerId));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Complaint>> getComplaintsByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(complaintService.getComplaintsByOwner(ownerId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createComplaint(@RequestBody Complaint complaint) {
        Map<String, Object> result = complaintService.createComplaint(complaint);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {

        String statusStr = payload.get("status");
        String resolutionNote = payload.get("resolutionNote");
        String resolvedBy = payload.get("resolvedBy");

        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Complaint.ComplaintStatus status = Complaint.ComplaintStatus.valueOf(statusStr.toUpperCase());
            return complaintService.updateComplaintStatus(id, status, resolutionNote, resolvedBy)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteComplaint(@PathVariable String id) {
        boolean deleted = complaintService.deleteComplaint(id);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }
}
