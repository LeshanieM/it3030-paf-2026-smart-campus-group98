package com.smartcampus.incident.dto;

import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import com.smartcampus.incident.enums.IncidentEnums.PriorityLevel;
import com.smartcampus.incident.enums.IncidentEnums.SlaStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class IncidentResponses {

    @Data
    @AllArgsConstructor
    public static class AttachmentResponse {
        private String id;
        private String fileName;
        private String contentType;
        private String viewUrl;
        private String downloadUrl;
    }

    @Data
    @AllArgsConstructor
    public static class TicketResponse {
        private String id;
        private String ticketId;
        private String title;
        private String description;
        private String category;
        private String location;
        private String room;
        private PriorityLevel priority;
        private IncidentStatus status;
        private String submittedById;
        private String submittedByName;
        private String submittedByEmail;
        private String assignedTechnicianId;
        private String assignedTechnicianName;
        private String assignedByName;
        private List<AttachmentResponse> attachments;
        private String rejectionReason;
        private String adminNotes;
        private String technicianNotes;
        private String resolutionSummary;
        private String resolutionNotes;
        private String preferredContact;
        private String slaResponseDeadline;
        private String slaResolutionDeadline;
        private String actualFirstResponseAt;
        private String actualResolutionAt;
        private Long responseDurationMinutes;
        private Long resolutionDurationMinutes;
        private SlaStatus slaStatus;
        private String createdAt;
        private String updatedAt;
        private List<CommentResponse> comments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentResponse {
        private String id;
        private String ticketId;
        private String authorId;
        private String authorName;
        private String authorRole;
        private String content;
        private boolean visibleToRequester;
        private String createdAt;
        private String updatedAt;
        private boolean canEdit;
        private boolean canDelete;
    }

    @Data
    @AllArgsConstructor
    public static class DashboardSummaryResponse {
        private long totalSubmitted;
        private long pending;
        private long approved;
        private long completed;
        private long rejected;
        private long overdue;
    }

    @Data
    @AllArgsConstructor
    public static class ActivityLogResponse {
        private String id;
        private String incidentId;
        private String actionType;
        private String message;
        private String performedByName;
        private String performedByRole;
        private String timestamp;
    }
}
