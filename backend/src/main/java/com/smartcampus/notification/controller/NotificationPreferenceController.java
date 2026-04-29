package com.smartcampus.notification.controller;

import com.smartcampus.entity.User;
import com.smartcampus.notification.model.NotificationPreference;
import com.smartcampus.notification.service.NotificationPreferenceService;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationPreference>> getMyPreferences(Principal principal) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(service.getPreferences(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationPreference>> getPreferences(@PathVariable String userId) {
        return ResponseEntity.ok(service.getPreferences(userId));
    }

    @PutMapping
    public ResponseEntity<NotificationPreference> updateMyPreference(
            Principal principal,
            @RequestParam String category,
            @RequestParam boolean emailEnabled,
            @RequestParam boolean inAppEnabled) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(service.updatePreference(userId, category, emailEnabled, inAppEnabled));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreference> updatePreference(
            @PathVariable String userId,
            @RequestParam String category,
            @RequestParam boolean emailEnabled,
            @RequestParam boolean inAppEnabled) {
        return ResponseEntity.ok(service.updatePreference(userId, category, emailEnabled, inAppEnabled));
    }

    private String getUserId(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized: No principal provided by security context.");

        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User u) {
                return u.getId();
            }
        }

        if (principal instanceof org.springframework.security.core.Authentication auth) {
            if (auth.getPrincipal() instanceof User u) {
                return u.getId();
            }
        }

        String identity = principal.getName();
        if (identity == null || identity.isEmpty()) {
            throw new RuntimeException("Principal name is empty. Cannot resolve identity.");
        }

        return userRepository.findByEmail(identity)
                .map(User::getId)
                .orElseGet(() -> {
                    if (identity.length() == 24 || identity.contains("-")) {
                        return identity;
                    }
                    throw new RuntimeException("Could not resolve user ID for identity: " + identity + ". Ensure user exists in MongoDB.");
                });
    }
}
