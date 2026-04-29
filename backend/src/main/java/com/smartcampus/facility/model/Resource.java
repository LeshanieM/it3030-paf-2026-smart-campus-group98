package com.smartcampus.facility.model;

import com.smartcampus.entity.User;
import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;

    @Builder.Default
    @Indexed
    private ResourceType type = ResourceType.LECTURE_HALL;

    @Indexed
    private Integer capacity;
    
    @Indexed
    private String location;
    
    private String description;

    @Builder.Default
    private List<AvailabilityWindow> availabilityWindows = new ArrayList<>();

    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    private String imageUrl;

    @Builder.Default
    @Indexed
    private ResourceStatus status = ResourceStatus.ACTIVE;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer numReviews = 0;

    @DocumentReference(lazy = true)
    private User createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    @Indexed
    private Instant updatedAt;
}
