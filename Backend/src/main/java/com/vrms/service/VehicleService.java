package com.vrms.service;

import com.vrms.model.Vehicle;
import com.vrms.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Optional<Vehicle> getVehicleById(String id) {
        return vehicleRepository.findById(id);
    }

    public List<Vehicle> getVehiclesByOwner(String ownerId) {
        return vehicleRepository.findByOwnerId(ownerId);
    }

    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByStatusAndApproved(Vehicle.VehicleStatus.available, true);
    }

    public List<Vehicle> getVehiclesByLocation(String location) {
        return vehicleRepository.findByLocationIgnoreCase(location);
    }

    // Add Vehicle
    public Vehicle addVehicle(Vehicle vehicle) {
        vehicle.setId(generateId("V"));
        vehicle.setApproved(false);
        vehicle.setStatus(Vehicle.VehicleStatus.available);
        return vehicleRepository.save(vehicle);
    }

    // Update Vehicle
    public Optional<Vehicle> updateVehicle(String id, Vehicle updated) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setName(updated.getName());
            vehicle.setBrand(updated.getBrand());
            vehicle.setModel(updated.getModel());
            vehicle.setType(updated.getType());
            vehicle.setFuel(updated.getFuel());
            vehicle.setTransmission(updated.getTransmission());
            vehicle.setSeats(updated.getSeats());
            vehicle.setRegNumber(updated.getRegNumber());
            vehicle.setPriceDaily(updated.getPriceDaily());
            vehicle.setPriceWeekly(updated.getPriceWeekly());
            vehicle.setPriceMonthly(updated.getPriceMonthly());
            vehicle.setLocation(updated.getLocation());
            vehicle.setImage(updated.getImage());
            vehicle.setColor(updated.getColor());
            vehicle.setDescription(updated.getDescription());
            if (updated.getRcDocument() != null) vehicle.setRcDocument(updated.getRcDocument());
            if (updated.getInsuranceDocument() != null) vehicle.setInsuranceDocument(updated.getInsuranceDocument());
            if (updated.getPucDocument() != null) vehicle.setPucDocument(updated.getPucDocument());
            if (updated.getStatus() != null) vehicle.setStatus(updated.getStatus());
            return vehicleRepository.save(vehicle);
        });
    }

    // Delete Vehicle
    public boolean deleteVehicle(String id) {
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Approve / Reject Vehicle
    public Optional<Vehicle> approveVehicle(String id, boolean approved) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setApproved(approved);
            return vehicleRepository.save(vehicle);
        });
    }

    // Update status
    public Optional<Vehicle> updateStatus(String id, Vehicle.VehicleStatus status) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setStatus(status);
            return vehicleRepository.save(vehicle);
        });
    }

    private String generateId(String prefix) {
        return prefix + System.currentTimeMillis() + new Random().nextInt(999);
    }
}
