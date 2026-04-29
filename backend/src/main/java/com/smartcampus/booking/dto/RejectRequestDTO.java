package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectRequestDTO {
    @NotBlank(message = "Rejection reason is required")
    @Size(min = 3, max = 300, message = "Rejection reason must be between 3 and 300 characters")
    private String reason;
}
