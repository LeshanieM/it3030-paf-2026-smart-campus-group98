package com.smartcampus.notification.service;

import com.smartcampus.notification.dto.NotificationDTO;
import com.smartcampus.notification.enums.NotificationType;
import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationPreference;
import com.smartcampus.notification.repository.NotificationPreferenceRepository;
import com.smartcampus.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void createNotification(String userId, String title, String message, NotificationType type) {
        // Check preferences
        String category = type.toString();
        NotificationPreference pref = preferenceRepository.findByUserIdAndCategory(userId, category)
                .orElse(NotificationPreference.builder().inAppEnabled(true).emailEnabled(true).build());

        if (!pref.isInAppEnabled()) return;

        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notification);
        
        // Broadcast via WebSocket
        messagingTemplate.convertAndSendToUser(
            userId,
            "/topic/notifications",
            convertToDTO(notification)
        );
    }

    public List<NotificationDTO> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .peek(n -> n.setRead(true))
                .collect(Collectors.toList());
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
