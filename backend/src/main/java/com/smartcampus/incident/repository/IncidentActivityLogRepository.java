package com.smartcampus.incident.repository;

import com.smartcampus.incident.model.IncidentActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentActivityLogRepository extends MongoRepository<IncidentActivityLog, String> {
    List<IncidentActivityLog> findByIncidentIdOrderByTimestampDesc(String incidentId);
}
