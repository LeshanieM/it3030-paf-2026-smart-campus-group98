package com.smartcampus.incident.model;

import com.smartcampus.entity.User;
import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import com.smartcampus.incident.enums.IncidentEnums.PriorityLevel;
import com.smartcampus.incident.enums.IncidentEnums.SlaStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "incidents")
public class Incident {

    @Id
    private String id;
    private String ticketId;

    private String title;
    private String description;
    private String category;
    private String location;
    private String room;
    
    @Builder.Default
    private PriorityLevel priority = PriorityLevel.MEDIUM;
    
    @Builder.Default
    private IncidentStatus status = IncidentStatus.OPEN;

    @DocumentReference(lazy = true)
    private User submittedBy;

    @DocumentReference(lazy = true)
    private User assignedTechnician;

    @DocumentReference(lazy = true)
    private User assignedBy;

    private String assignedByAdminName;
    private String requesterEmail;

    private List<String> attachments; // e.g. Array of S3 URLs

    @Builder.Default
    private List<IncidentComment> comments = new java.util.ArrayList<>();

    private String rejectionReason;
    private String adminNotes;
    private String technicianNotes;
    private String resolutionSummary;
    private String preferredContact;

    // SLA tracking
    private Instant firstResponseAt;
    private Instant resolvedAt;
    private Instant closedAt;

    private Long responseDurationMinutes;
    private Long resolutionDurationMinutes;

    private Instant slaResponseDeadline;
    private Instant slaResolutionDeadline;
    private SlaStatus slaStatus;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
