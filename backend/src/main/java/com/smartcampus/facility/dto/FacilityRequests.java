package com.smartcampus.facility.dto;

import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.smartcampus.facility.model.AvailabilityWindow;

public class FacilityRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateResourceRequest {
        @NotBlank private String name;
        @NotNull private ResourceType type;
        @NotNull @Min(1) private Integer capacity;
        @NotBlank private String location;
        private String description;
        private List<AvailabilityWindow> availabilityWindows;
        private List<String> amenities;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateResourceRequest {
        private String name;
        private ResourceType type;
        @Min(1) private Integer capacity;
        private String location;
        private String description;
        private List<AvailabilityWindow> availabilityWindows;
        private List<String> amenities;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateResourceStatusRequest {
        @NotNull private ResourceStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddReviewRequest {
        @NotNull
        @Min(1)
        @Max(5)
        private Integer rating;
    }
}
