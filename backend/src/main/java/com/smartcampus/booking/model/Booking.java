package com.smartcampus.booking.model;

import com.smartcampus.booking.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;
    
    private String resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceLocation;
    
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String purpose;
    private Integer expectedAttendees;
    
    private BookingStatus status;
    private String rejectionReason;
    
    private String createdBy;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
