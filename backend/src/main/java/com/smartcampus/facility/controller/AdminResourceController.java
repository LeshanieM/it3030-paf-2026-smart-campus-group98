package com.smartcampus.facility.controller;

import com.smartcampus.entity.User;
import com.smartcampus.facility.dto.FacilityRequests.CreateResourceRequest;
import com.smartcampus.facility.dto.FacilityRequests.UpdateResourceRequest;
import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.dto.FacilityResponses.ResourceListItemResponse;
import com.smartcampus.facility.dto.FacilityResponses.ResourceResponse;
import com.smartcampus.facility.service.ResourceService;
import com.smartcampus.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/resources")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminResourceController {

    private final ResourceService resourceService;
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> createResource(
            @Valid @RequestPart("resource") CreateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Principal principal) {
        User admin = getUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request, image, admin));
    }

    @GetMapping
    public ResponseEntity<List<ResourceListItemResponse>> getAllResources(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(resourceService.getAllResources(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable String id,
            @Valid @RequestPart("resource") UpdateResourceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(resourceService.updateResource(id, request, image));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponse> updateStatus(
            @PathVariable String id,
            @RequestParam ResourceStatus status) {
        return ResponseEntity.ok(resourceService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
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
