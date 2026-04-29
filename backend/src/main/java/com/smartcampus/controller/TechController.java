package com.smartcampus.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tech")
@PreAuthorize("hasRole('TECHNICIAN')")
public class TechController {

    @GetMapping("/tasks")
    public ResponseEntity<List<Map<String, String>>> getTechnicianTasks() {
        return ResponseEntity.ok(List.of(
            Map.of("id", "1", "task", "Fix AC in Lab 101", "priority", "HIGH"),
            Map.of("id", "2", "task", "Projector bulb repair Hall A", "priority", "MEDIUM")
        ));
    }
}
