package com.vrms.repository;

import com.vrms.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    List<Complaint> findByCustomerId(String customerId);

    List<Complaint> findByOwnerId(String ownerId);

    List<Complaint> findByStatus(Complaint.ComplaintStatus status);

    List<Complaint> findByBookingId(String bookingId);
}
