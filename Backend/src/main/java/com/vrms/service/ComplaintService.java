package com.vrms.service;

import com.vrms.model.Complaint;
import com.vrms.repository.ComplaintRepository;
import com.vrms.repository.UserRepository;
import com.vrms.repository.BookingRepository;
import com.vrms.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private EmailService emailService;

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Optional<Complaint> getComplaintById(String id) {
        return complaintRepository.findById(id);
    }

    public List<Complaint> getComplaintsByCustomer(String customerId) {
        return complaintRepository.findByCustomerId(customerId);
    }

    public List<Complaint> getComplaintsByOwner(String ownerId) {
        return complaintRepository.findByOwnerId(ownerId);
    }

    public Map<String, Object> createComplaint(Complaint complaint) {
        Map<String, Object> result = new HashMap<>();

        complaint.setId("CMP" + System.currentTimeMillis() + new Random().nextInt(999));
        complaint.setCreatedAt(LocalDateTime.now());
        complaint.setUpdatedAt(LocalDateTime.now());

        if (complaint.getPriority() == null) {
            complaint.setPriority(Complaint.ComplaintPriority.MEDIUM);
        }
        complaint.setStatus(Complaint.ComplaintStatus.PENDING);

        // Populate customer info if missing
        if (complaint.getCustomerId() != null) {
            userRepository.findById(complaint.getCustomerId()).ifPresent(user -> {
                if (complaint.getCustomerName() == null) complaint.setCustomerName(user.getName());
                if (complaint.getCustomerEmail() == null) complaint.setCustomerEmail(user.getEmail());
            });
        }

        // Link vehicle name / ownerId from booking or vehicle name lookup
        if (complaint.getBookingId() != null) {
            bookingRepository.findById(complaint.getBookingId()).ifPresent(booking -> {
                if (complaint.getOwnerId() == null) complaint.setOwnerId(booking.getOwnerId());
                if (complaint.getVehicleId() == null) complaint.setVehicleId(booking.getVehicleId());
                vehicleRepository.findById(booking.getVehicleId()).ifPresent(v -> {
                    if (complaint.getVehicleName() == null) complaint.setVehicleName(v.getName());
                });
            });
        } else if (complaint.getVehicleId() != null) {
            vehicleRepository.findById(complaint.getVehicleId()).ifPresent(v -> {
                if (complaint.getVehicleName() == null) complaint.setVehicleName(v.getName());
                if (complaint.getOwnerId() == null) complaint.setOwnerId(v.getOwnerId());
            });
        } else if (complaint.getVehicleName() != null && !complaint.getVehicleName().trim().isEmpty()) {
            String vName = complaint.getVehicleName().trim().toLowerCase();
            vehicleRepository.findAll().stream()
                .filter(v -> v.getName() != null && v.getName().toLowerCase().contains(vName))
                .findFirst()
                .ifPresent(v -> {
                    complaint.setVehicleId(v.getId());
                    if (complaint.getOwnerId() == null) complaint.setOwnerId(v.getOwnerId());
                });
        }

        Complaint saved = complaintRepository.save(complaint);

        result.put("success", true);
        result.put("complaint", saved);
        return result;
    }

    public Optional<Complaint> updateComplaintStatus(String id, Complaint.ComplaintStatus status, String resolutionNote, String resolvedBy) {
        return complaintRepository.findById(id).map(complaint -> {
            complaint.setStatus(status);
            complaint.setUpdatedAt(LocalDateTime.now());
            if (resolutionNote != null && !resolutionNote.isBlank()) {
                complaint.setResolutionNote(resolutionNote);
            }
            if (resolvedBy != null && !resolvedBy.isBlank()) {
                complaint.setResolvedBy(resolvedBy);
            }
            return complaintRepository.save(complaint);
        });
    }

    public boolean deleteComplaint(String id) {
        if (complaintRepository.existsById(id)) {
            complaintRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
