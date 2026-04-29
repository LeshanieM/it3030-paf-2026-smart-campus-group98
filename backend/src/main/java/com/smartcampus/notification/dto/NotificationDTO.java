package com.smartcampus.notification.dto;

import com.smartcampus.notification.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean read;
    private Instant createdAt;
}
