package com.smartcampus.incident.controller;

import com.smartcampus.entity.User;
import com.smartcampus.incident.dto.IncidentRequests.CreateTicketRequest;
import com.smartcampus.incident.dto.IncidentResponses.CommentResponse;
import com.smartcampus.incident.dto.IncidentResponses.TicketResponse;
import com.smartcampus.incident.service.IncidentService;
import com.smartcampus.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class StudentIncidentController {

    private final IncidentService incidentService;
    private final UserRepository userRepository;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<TicketResponse> createIncident(
            @Valid @ModelAttribute CreateTicketRequest request,
            Principal principal) {
        
        User user = getUser(principal);
        TicketResponse response = incidentService.createIncident(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Principal principal) {
        User user = getUser(principal);
        return ResponseEntity.ok(incidentService.getUserTickets(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketDetails(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(incidentService.getTicketById(id, getUser(principal)));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(incidentService.getComments(id, getUser(principal)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelTicket(@PathVariable String id, Principal principal) {
        User user = getUser(principal);
        incidentService.cancelIncident(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody com.smartcampus.incident.dto.IncidentRequests.AddCommentRequest request,
            Principal principal) {
        User user = getUser(principal);
        return ResponseEntity.ok(incidentService.addComment(id, request, user));
    }

    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketResponse> editComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @Valid @RequestBody com.smartcampus.incident.dto.IncidentRequests.EditCommentRequest request,
            Principal principal) {
        User user = getUser(principal);
        return ResponseEntity.ok(incidentService.editComment(id, commentId, request, user));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketResponse> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            Principal principal) {
        User user = getUser(principal);
        return ResponseEntity.ok(incidentService.deleteComment(id, commentId, user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<java.util.List<com.smartcampus.incident.dto.IncidentResponses.ActivityLogResponse>> getHistory(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(incidentService.getActivityLogs(id, getUser(principal)));
    }

    private User getUser(Principal principal) {
        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User) {
                return (User) auth.getPrincipal();
            }
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
