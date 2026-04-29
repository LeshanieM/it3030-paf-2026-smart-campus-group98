package com.smartcampus.facility.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityWindow {
    private String dayOfWeek;
    private String startTime;
    private String endTime;
}
