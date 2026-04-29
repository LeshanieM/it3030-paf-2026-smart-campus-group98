package com.smartcampus.incident.dto;

import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import com.smartcampus.incident.enums.IncidentEnums.PriorityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public class IncidentRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTicketRequest {
        @NotBlank private String title;
        private String description;
        @NotBlank private String category;
        @NotBlank private String location;
        private String room;
        @NotBlank private String priority;
        @NotBlank(message = "Contact number is required.")
        @Pattern(regexp = "^\\+?[0-9\\s-]{7,20}$", message = "Enter a valid contact number.")
        private String preferredContact;
        private String email;
        private List<MultipartFile> attachments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        @NotNull private IncidentStatus status;
        private String rejectionReason;
        private String resolutionNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignTechnicianRequest {
        @NotBlank private String technicianId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePriorityRequest {
        @NotNull private PriorityLevel priority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectTicketRequest {
        @NotBlank private String rejectionReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolutionRequest {
        @NotBlank private String resolutionSummary;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddNoteRequest {
        @NotBlank private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddCommentRequest {
        @NotBlank private String message;
        private boolean visibleToRequester;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EditCommentRequest {
        @NotBlank private String message;
        private boolean visibleToRequester;
    }
}
