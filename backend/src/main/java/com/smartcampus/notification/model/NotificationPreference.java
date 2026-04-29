package com.smartcampus.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_preferences")
public class NotificationPreference {
    @Id
    private String id;
    private String userId;
    private boolean emailEnabled;
    private boolean inAppEnabled;
    private String category; // e.g., "BOOKING", "TICKET", "SYSTEM"
}
