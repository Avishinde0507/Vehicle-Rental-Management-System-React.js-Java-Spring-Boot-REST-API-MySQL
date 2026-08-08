package com.vrms.repository;

import com.vrms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(User.Role role);
    boolean existsByEmailIgnoreCase(String email);
}
