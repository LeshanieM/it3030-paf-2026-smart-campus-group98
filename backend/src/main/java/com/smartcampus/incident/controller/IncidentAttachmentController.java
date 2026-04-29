package com.smartcampus.incident.controller;

import com.smartcampus.entity.User;
import com.smartcampus.incident.service.IncidentService;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.Principal;

@RestController
@RequestMapping("/api/incidents")
@PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN','USER')")
@RequiredArgsConstructor
public class IncidentAttachmentController {

    private final IncidentService incidentService;
    private final UserRepository userRepository;

    @GetMapping("/{incidentId}/attachments/{attachmentId}")
    public ResponseEntity<Resource> getAttachment(
            @PathVariable String incidentId,
            @PathVariable String attachmentId,
            @RequestParam(defaultValue = "false") boolean download,
            Principal principal) {

        IncidentService.AttachmentDownload attachment = incidentService.getAttachment(incidentId, attachmentId, getUser(principal));
        ContentDisposition disposition = (download ? ContentDisposition.attachment() : ContentDisposition.inline())
                .filename(attachment.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new FileSystemResource(attachment.path()));
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
