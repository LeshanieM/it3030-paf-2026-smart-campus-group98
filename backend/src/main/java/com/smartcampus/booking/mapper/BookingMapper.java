package com.smartcampus.booking.mapper;

import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.model.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponseDTO toDto(Booking booking) {
        if (booking == null) {
            return null;
        }
        return BookingResponseDTO.builder()
                .id(booking.getId())
                .resourceId(booking.getResourceId())
                .resourceName(booking.getResourceName())
                .resourceType(booking.getResourceType())
                .resourceLocation(booking.getResourceLocation())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .rejectionReason(booking.getRejectionReason())
                .createdBy(booking.getCreatedBy())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
