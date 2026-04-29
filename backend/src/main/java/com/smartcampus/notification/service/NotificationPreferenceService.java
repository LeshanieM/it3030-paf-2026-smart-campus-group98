package com.smartcampus.notification.service;

import com.smartcampus.notification.model.NotificationPreference;
import com.smartcampus.notification.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;

    public List<NotificationPreference> getPreferences(String userId) {
        return repository.findByUserId(userId);
    }

    public NotificationPreference updatePreference(String userId, String category, boolean emailEnabled, boolean inAppEnabled) {
        NotificationPreference preference = repository.findByUserIdAndCategory(userId, category)
                .orElse(NotificationPreference.builder()
                        .userId(userId)
                        .category(category)
                        .build());
        
        preference.setEmailEnabled(emailEnabled);
        preference.setInAppEnabled(inAppEnabled);
        
        return repository.save(preference);
    }
}
