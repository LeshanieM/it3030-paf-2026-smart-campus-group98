package com.smartcampus.incident.model;

import com.smartcampus.entity.User;
import com.smartcampus.incident.enums.IncidentEnums.ActivityAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "incident_activity_logs")
public class IncidentActivityLog {

    @Id
    private String id;

    private String incidentId;
    
    private ActivityAction actionType;
    
    private String message;

    @DocumentReference(lazy = true)
    private User performedBy;

    // e.g. STUDENT, ADMIN, TECHNICIAN
    private String performedByRole;

    private Instant timestamp;
}
