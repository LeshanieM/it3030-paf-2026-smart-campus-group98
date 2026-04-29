package com.smartcampus.controller;

import com.smartcampus.entity.User;
import com.smartcampus.incident.service.IncidentService;
import com.smartcampus.incident.dto.IncidentResponses.DashboardSummaryResponse;
import com.smartcampus.service.UserService;
import com.smartcampus.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.MediaTypes;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.notification.dto.NotificationDTO;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping(value = "/api/user", produces = { MediaTypes.HAL_JSON_VALUE, MediaType.APPLICATION_JSON_VALUE })
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class UserController {

    private final IncidentService incidentService;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;
    private final com.smartcampus.repository.UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping("/me")
    public ResponseEntity<EntityModel<User>> getCurrentUser(Principal principal) {
        User user = resolveUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        EntityModel<User> model = EntityModel.of(user)
                .add(linkTo(methodOn(UserController.class).getCurrentUser(principal)).withSelfRel())
                .add(linkTo(methodOn(UserController.class).updateProfile(null, null, principal)).withRel("updateProfile"))
                .add(linkTo(methodOn(UserController.class).getDashboardSummary(principal)).withRel("dashboardSummary"))
                .add(linkTo(methodOn(UserController.class).getNotifications(principal)).withRel("notifications"))
                .add(linkTo(methodOn(UserController.class).logout()).withRel("logout"));

        return ResponseEntity.ok(model);
    }

    /**
     * Login endpoint to verify token and return user details.
     * In this OAuth2/JWT setup, the actual auth happens via OAuth2, 
     * but this endpoint serves as the "Post-Login" verification for the frontend.
     */
    @PostMapping("/login")
    public ResponseEntity<EntityModel<User>> login(Principal principal) {
        return getCurrentUser(principal);
    }

    /**
     * Logout endpoint.
     * In a stateless JWT setup, the server just confirms the logout.
     * The frontend is responsible for clearing the token.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PutMapping("/profile")
    public ResponseEntity<EntityModel<User>> updateProfile(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "picture", required = false) MultipartFile picture,
            Principal principal) {

        User resolved = resolveUser(principal);
        if (resolved == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String userId = resolved.getId();

        String pictureUrl = null;
        if (picture != null && !picture.isEmpty()) {
            try {
                pictureUrl = cloudinaryService.uploadImage(picture);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
            }
        }

        User updated = userService.updateProfile(userId, name, pictureUrl);
        EntityModel<User> model = EntityModel.of(updated)
                .add(linkTo(methodOn(UserController.class).getCurrentUser(principal)).withRel("me"))
                .add(linkTo(methodOn(UserController.class).updateProfile(null, null, principal)).withSelfRel());

        return ResponseEntity.ok(model);
    }

    @PostMapping("/bookings")
    public ResponseEntity<EntityModel<Map<String, String>>> createBooking(@RequestBody Map<String, Object> bookingDetails) {
        // Implementation for university facility booking
        String bookingId = UUID.randomUUID().toString();

        Map<String, String> payload = Map.of(
                "message", "Booking created successfully",
                "status", "CONFIRMED",
                "bookingId", bookingId
        );

        String location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(bookingId)
                .toUriString();

        EntityModel<Map<String, String>> model = EntityModel.of(payload)
                .add(Link.of(location).withSelfRel())
                .add(linkTo(methodOn(UserController.class).createBooking(null)).withRel("collection"))
                .add(linkTo(methodOn(UserController.class).getCurrentUser(null)).withRel("me"));

        return ResponseEntity.created(java.net.URI.create(location)).body(model);
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<EntityModel<DashboardSummaryResponse>> getDashboardSummary(Principal principal) {
        User resolved = resolveUser(principal);
        if (resolved == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String userId = resolved.getId();

        DashboardSummaryResponse summary = incidentService.getStudentDashboardSummary(userId);
        EntityModel<DashboardSummaryResponse> model = EntityModel.of(summary)
                .add(linkTo(methodOn(UserController.class).getDashboardSummary(principal)).withSelfRel())
                .add(linkTo(methodOn(UserController.class).getCurrentUser(principal)).withRel("me"));

        return ResponseEntity.ok(model);
    }

    @GetMapping("/notifications")
    public ResponseEntity<CollectionModel<NotificationDTO>> getNotifications(Principal principal) {
        User user = resolveUser(principal);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<NotificationDTO> notifications = notificationService.getUserNotifications(user.getId());
        CollectionModel<NotificationDTO> model = CollectionModel.of(notifications)
                .add(linkTo(methodOn(UserController.class).getNotifications(principal)).withSelfRel())
                .add(linkTo(methodOn(UserController.class).getCurrentUser(principal)).withRel("me"));
        
        return ResponseEntity.ok(model);
    }

    /**
     * Helper to extract user from security context
     */
    private User resolveUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User u) {
                return userRepository.findById(u.getId()).orElse(null);
            }
        }
        return null;
    }
}
