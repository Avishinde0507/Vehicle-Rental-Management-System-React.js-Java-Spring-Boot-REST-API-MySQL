package com.vrms.repository;

import com.vrms.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    List<Vehicle> findByOwnerId(String ownerId);
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);
    List<Vehicle> findByApproved(boolean approved);
    List<Vehicle> findByLocationIgnoreCase(String location);
    List<Vehicle> findByStatusAndApproved(Vehicle.VehicleStatus status, boolean approved);
}
