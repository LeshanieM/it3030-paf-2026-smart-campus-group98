package com.smartcampus.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a resource suggestion when a booking conflict occurs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedResourceDTO {
    private String resourceId;
    private String resourceName;
    private String type;
    private Integer capacity;
    private String location;
}
