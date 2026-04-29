package com.smartcampus.incident.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentComment {
    private String id;
    private String ticketId;
    private String authorId;
    private String authorName;
    private String authorRole;

    @Field("message")
    private String content;

    @JsonIgnore
    @Field("content")
    private String legacyContent;

    private boolean visibleToRequester;

    @Field("timestamp")
    private Instant createdAt;

    @JsonIgnore
    @Field("createdAt")
    private Instant legacyCreatedAt;

    @Field("editedAt")
    private Instant updatedAt;

    @JsonIgnore
    @Field("updatedAt")
    private Instant legacyUpdatedAt;

    private boolean softDeleted;
}
