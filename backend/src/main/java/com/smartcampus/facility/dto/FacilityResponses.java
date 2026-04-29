package com.smartcampus.facility.dto;

import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import com.smartcampus.facility.model.AvailabilityWindow;

public class FacilityResponses {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceListItemResponse {
        private String id;
        private String name;
        private ResourceType type;
        private Integer capacity;
        private String location;
        private String imageUrl;
        private Double rating;
        private Integer numReviews;
        private ResourceStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceResponse {
        private String id;
        private String name;
        private ResourceType type;
        private Integer capacity;
        private String location;
        private String description;
        private List<AvailabilityWindow> availabilityWindows;
        private List<String> amenities;
        private String imageUrl;
        private Double rating;
        private Integer numReviews;
        private ResourceStatus status;
        private String createdByName;
        private String createdAt;
        private String updatedAt;
    }
}
