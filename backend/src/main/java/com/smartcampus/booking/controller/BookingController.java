package com.smartcampus.booking.controller;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingSuggestionResponseDTO;
import com.smartcampus.booking.dto.RejectRequestDTO;
import com.smartcampus.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        // Log principal for debugging
        System.out.println("Principal type: " + principal.getClass().getName() + ", Name: " + authentication.getName());
        
        if (principal instanceof com.smartcampus.entity.User user) {
            return user.getEmail();
        }
        return authentication.getName();
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(requestDTO, getCurrentUserEmail()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings(getCurrentUserEmail()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, resource, date));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.getBookingById(id, getCurrentUserEmail(), isAdmin()));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> approveBooking(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable String id,
            @Valid @RequestBody RejectRequestDTO requestDTO) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, requestDTO));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, getCurrentUserEmail()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id, getCurrentUserEmail());
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint to get alternative resource suggestions when a conflict is expected.
     * Query params: resourceId, startTime (ISO), endTime (ISO), expectedAttendees.
     * Accessible by USER role and above.
     */
    @GetMapping("/suggest")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<BookingSuggestionResponseDTO> getSuggestions(
            @RequestParam String resourceId,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Integer expectedAttendees) {
        
        // Parse ISO format strings (e.g., 2023-10-27T10:00:00)
        java.time.LocalDateTime start = java.time.LocalDateTime.parse(startTime);
        java.time.LocalDateTime end = java.time.LocalDateTime.parse(endTime);

        return ResponseEntity.ok(bookingService.findAlternativeSuggestions(
                resourceId, 
                start.toLocalDate(), 
                start.toLocalTime(), 
                end.toLocalTime(), 
                expectedAttendees));
    }
}
