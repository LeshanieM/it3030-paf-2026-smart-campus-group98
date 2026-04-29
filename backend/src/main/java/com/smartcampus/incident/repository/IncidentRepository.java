package com.smartcampus.incident.repository;

import com.smartcampus.incident.model.Incident;
import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {
    List<Incident> findBySubmittedById(String submittedById);
    List<Incident> findByAssignedTechnicianId(String assignedTechnicianId);
    
    long countByStatus(IncidentStatus status);
}
