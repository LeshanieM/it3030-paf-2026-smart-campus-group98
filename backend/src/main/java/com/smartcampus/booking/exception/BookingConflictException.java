package com.smartcampus.booking.exception;

import com.smartcampus.booking.dto.BookingSuggestionResponseDTO;
import lombok.Getter;

/**
 * Exception thrown when a booking conflict occurs. 
 * Optionally carries suggestion data for alternative resources.
 */
@Getter
public class BookingConflictException extends RuntimeException {
    private final BookingSuggestionResponseDTO suggestions;

    public BookingConflictException(String message) {
        super(message);
        this.suggestions = null;
    }

    public BookingConflictException(String message, BookingSuggestionResponseDTO suggestions) {
        super(message);
        this.suggestions = suggestions;
    }
}
