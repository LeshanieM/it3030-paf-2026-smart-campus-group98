package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.RejectRequestDTO;

import com.smartcampus.booking.dto.BookingSuggestionResponseDTO;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Service interface for managing campus resource bookings.
 */
public interface BookingService {
    
    /**
     * Creates a new booking request. 
     * Throws BookingConflictException with suggestions if a conflict is detected.
     */
    BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String currentUserEmail);

    /**
     * Retrieves all bookings created by the current user.
     */
    List<BookingResponseDTO> getMyBookings(String currentUserEmail);

    /**
     * Retrieves all bookings with optional filtering for administrators.
     */
    List<BookingResponseDTO> getAllBookings(String status, String resource, String date);

    /**
     * Retrieves a specific booking by its unique identifier.
     */
    BookingResponseDTO getBookingById(String id, String currentUserEmail, boolean isAdmin);

    /**
     * Approves a pending booking request.
     */
    BookingResponseDTO approveBooking(String id);

    /**
     * Rejects a pending booking request with a reason.
     */
    BookingResponseDTO rejectBooking(String id, RejectRequestDTO requestDTO);

    /**
     * Cancels an existing booking (must be the creator).
     */
    BookingResponseDTO cancelBooking(String id, String currentUserEmail);

    /**
     * Deletes a booking entirely (must be the creator and status must be PENDING/REJECTED/CANCELLED).
     */
    void deleteBooking(String id, String currentUserEmail);

    /**
     * Finds up to 3 alternative resources of the same type that are available for the requested slot.
     */
    BookingSuggestionResponseDTO findAlternativeSuggestions(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime, Integer expectedAttendees);
}
