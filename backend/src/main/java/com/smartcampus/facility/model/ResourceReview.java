package com.smartcampus.facility.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resource_reviews")
public class ResourceReview {

    @Id
    private String id;

    private String resourceId;

    private String userId;

    private String userName;

    private Integer rating;

    @CreatedDate
    private Instant createdAt;
}
