package com.smartcampus.notification.controller;

import com.smartcampus.entity.User;
import com.smartcampus.notification.dto.NotificationDTO;
import com.smartcampus.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final com.smartcampus.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(Principal principal) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/test")
    public ResponseEntity<?> createTestNotification(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Error: Principal is null. User might not be authenticated.");
            }
            String userId = getUserId(principal);
            System.out.println("Creating test notification for user ID: " + userId);
            
            notificationService.createNotification(
                userId,
                "Test Notification",
                "This is a test notification generated at " + java.time.Instant.now(),
                com.smartcampus.notification.enums.NotificationType.TICKET
            );
            
            List<NotificationDTO> notifications = notificationService.getUserNotifications(userId);
            if (notifications.isEmpty()) {
                return ResponseEntity.ok("Notification created but list still empty. Database might be lagging or ID mismatch.");
            }
            return ResponseEntity.ok(notifications.get(0));
        } catch (Exception e) {
            e.printStackTrace(); // Log to console
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " (Check backend logs for stacktrace)");
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        String userId = getUserId(principal);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    private String getUserId(Principal principal) {
        if (principal == null) throw new RuntimeException("Unauthorized: No principal provided by security context.");
        
        // 1. Direct check for UsernamePasswordAuthenticationToken (standard JWT flow)
        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User u) {
                return u.getId();
            }
        }
        
        // 2. Direct check for Authentication object (most standard Spring Security flow)
        if (principal instanceof org.springframework.security.core.Authentication auth) {
            if (auth.getPrincipal() instanceof User u) {
                return u.getId();
            }
        }

        // 3. Fallback: Lookup by principal name (usually email in this project)
        String identity = principal.getName();
        if (identity == null || identity.isEmpty()) {
            throw new RuntimeException("Principal name is empty. Cannot resolve identity.");
        }

        return userRepository.findByEmail(identity)
            .map(User::getId)
            .orElseGet(() -> {
                // If it looks like a MongoDB ID, return it directly
                if (identity.length() == 24 || identity.contains("-")) {
                    return identity;
                }
                throw new RuntimeException("Could not resolve user ID for identity: " + identity + ". Ensure user exists in MongoDB.");
            });
    }
}
