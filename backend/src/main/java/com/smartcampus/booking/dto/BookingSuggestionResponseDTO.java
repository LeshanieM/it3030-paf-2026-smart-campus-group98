package com.smartcampus.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO returned when a booking conflict occurs, including a list of suggested alternatives.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSuggestionResponseDTO {
    private String conflictMessage;
    private List<SuggestedResourceDTO> suggestions;
}
