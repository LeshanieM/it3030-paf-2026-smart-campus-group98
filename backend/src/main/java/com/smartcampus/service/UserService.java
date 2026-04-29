package com.smartcampus.service;

import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateRole(String id, Role role) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public User updateProfile(String id, String name, String picture) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (name != null) user.setName(name);
        if (picture != null) user.setPicture(picture);
        return userRepository.save(user);
    }
}
