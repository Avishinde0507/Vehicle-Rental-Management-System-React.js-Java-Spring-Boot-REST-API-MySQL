package com.vrms.controller;

import com.vrms.model.Vehicle;
import com.vrms.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    // GET all vehicles
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    // GET vehicle by ID
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable String id) {
        return vehicleService.getVehicleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET vehicles by owner
    @GetMapping("/owner/{ownerId}")
    public List<Vehicle> getVehiclesByOwner(@PathVariable String ownerId) {
        return vehicleService.getVehiclesByOwner(ownerId);
    }

    // GET available vehicles (approved + available)
    @GetMapping("/available")
    public List<Vehicle> getAvailableVehicles() {
        return vehicleService.getAvailableVehicles();
    }

    // GET vehicles by location
    @GetMapping("/location/{location}")
    public List<Vehicle> getVehiclesByLocation(@PathVariable String location) {
        return vehicleService.getVehiclesByLocation(location);
    }

    // POST add vehicle
    @PostMapping
    public ResponseEntity<Vehicle> addVehicle(@RequestBody Vehicle vehicle) {
        Vehicle saved = vehicleService.addVehicle(vehicle);
        return ResponseEntity.ok(saved);
    }

    // PUT update vehicle
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable String id, @RequestBody Vehicle vehicle) {
        return vehicleService.updateVehicle(id, vehicle)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE vehicle
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteVehicle(@PathVariable String id) {
        if (vehicleService.deleteVehicle(id)) {
            return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    // PUT approve/reject vehicle
    @PutMapping("/{id}/approve")
    public ResponseEntity<Vehicle> approveVehicle(@PathVariable String id, @RequestParam boolean approved) {
        return vehicleService.approveVehicle(id, approved)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT update vehicle status
    @PutMapping("/{id}/status")
    public ResponseEntity<Vehicle> updateStatus(@PathVariable String id, @RequestParam Vehicle.VehicleStatus status) {
        return vehicleService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
