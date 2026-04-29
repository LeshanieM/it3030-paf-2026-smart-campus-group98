package com.smartcampus.notification.repository;

import com.smartcampus.notification.model.NotificationPreference;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {
    List<NotificationPreference> findByUserId(String userId);
    Optional<NotificationPreference> findByUserIdAndCategory(String userId, String category);
}
