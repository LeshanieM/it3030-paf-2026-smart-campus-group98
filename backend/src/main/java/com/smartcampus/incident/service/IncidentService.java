package com.smartcampus.incident.service;

import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.incident.dto.IncidentRequests.AddCommentRequest;
import com.smartcampus.incident.dto.IncidentRequests.CreateTicketRequest;
import com.smartcampus.incident.dto.IncidentRequests.EditCommentRequest;
import com.smartcampus.incident.dto.IncidentRequests.UpdateStatusRequest;
import com.smartcampus.incident.dto.IncidentResponses.ActivityLogResponse;
import com.smartcampus.incident.dto.IncidentResponses.AttachmentResponse;
import com.smartcampus.incident.dto.IncidentResponses.CommentResponse;
import com.smartcampus.incident.dto.IncidentResponses.DashboardSummaryResponse;
import com.smartcampus.incident.dto.IncidentResponses.TicketResponse;
import com.smartcampus.incident.enums.IncidentEnums.ActivityAction;
import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import com.smartcampus.incident.enums.IncidentEnums.PriorityLevel;
import com.smartcampus.incident.enums.IncidentEnums.SlaStatus;
import com.smartcampus.incident.exception.IncidentExceptions.IllegalIncidentStateException;
import com.smartcampus.incident.exception.IncidentExceptions.InvalidRequestException;
import com.smartcampus.incident.exception.IncidentExceptions.ResourceNotFoundException;
import com.smartcampus.incident.exception.IncidentExceptions.UnauthorizedIncidentAccessException;
import com.smartcampus.incident.model.Incident;
import com.smartcampus.incident.model.IncidentActivityLog;
import com.smartcampus.incident.model.IncidentComment;
import com.smartcampus.incident.repository.IncidentActivityLogRepository;
import com.smartcampus.incident.repository.IncidentRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.notification.enums.NotificationType;
import com.smartcampus.notification.service.NotificationService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private static final Set<IncidentStatus> SUPPORTED_WORKFLOW_STATUSES = Set.of(
            IncidentStatus.OPEN,
            IncidentStatus.IN_PROGRESS,
            IncidentStatus.RESOLVED,
            IncidentStatus.CLOSED,
            IncidentStatus.REJECTED
    );

    private static final java.util.Map<IncidentStatus, Set<IncidentStatus>> VALID_TRANSITIONS = java.util.Map.of(
            IncidentStatus.OPEN, Set.of(IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS, IncidentStatus.REJECTED, IncidentStatus.CLOSED),
            IncidentStatus.ASSIGNED, Set.of(IncidentStatus.IN_PROGRESS, IncidentStatus.REJECTED, IncidentStatus.CLOSED),
            IncidentStatus.IN_PROGRESS, Set.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED, IncidentStatus.REJECTED),
            IncidentStatus.RESOLVED, Set.of(IncidentStatus.CLOSED),
            IncidentStatus.CLOSED, Set.of(),
            IncidentStatus.REJECTED, Set.of()
    );

    private final IncidentRepository incidentRepository;
    private final IncidentActivityLogRepository activityLogRepository;
    private final SlaService slaService;
    private final UserRepository userRepository;
    private final IncidentAttachmentService incidentAttachmentService;
    private final NotificationService notificationService;

    @PostConstruct
    @Transactional
    public void migrateLegacyIncidentPriorities() {
        List<Incident> incidents = incidentRepository.findAll();
        List<Incident> migrated = incidents.stream()
                .filter(incident -> incident.getPriority() == PriorityLevel.HIGH)
                .peek(incident -> {
                    incident.setPriority(PriorityLevel.EMERGENCY);
                    incident.setUpdatedAt(Instant.now());
                })
                .collect(Collectors.toList());

        if (!migrated.isEmpty()) {
            incidentRepository.saveAll(migrated);
        }
    }

    @Transactional
    public TicketResponse createIncident(CreateTicketRequest request, User user) {
        if (request.getAttachments() != null && request.getAttachments().size() > 3) {
            throw new InvalidRequestException("Maximum of 3 attachments allowed.");
        }
        PriorityLevel mappedPriority = mapPriority(request.getPriority());

        Instant now = Instant.now();
        Incident incident = Incident.builder()
                .ticketId("INC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .location(request.getLocation())
                .room(request.getRoom())
                .priority(mappedPriority)
                .status(IncidentStatus.OPEN)
                .submittedBy(user)
                .requesterEmail(user.getEmail())
                .preferredContact(request.getPreferredContact())
                .attachments(new ArrayList<>())
                .createdAt(now)
                .updatedAt(now)
                .build();

        slaService.calculateDeadlines(incident);
        Incident initialSaved = incidentRepository.save(incident);
        List<String> uploadedFiles = incidentAttachmentService.storeAttachments(initialSaved.getId(), request.getAttachments());
        initialSaved.setAttachments(uploadedFiles);
        final Incident saved = incidentRepository.save(initialSaved);

        logActivity(saved.getId(), user, ActivityAction.CREATED, "Incident created.");

        // Notify user of creation
        notificationService.createNotification(
            user.getId(),
            "Ticket Submitted",
            "Your ticket " + saved.getTicketId() + " has been successfully submitted.",
            NotificationType.TICKET
        );

        // Notify all admins of new ticket
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(
                admin.getId(),
                "New Maintenance Ticket",
                "Ticket " + saved.getTicketId() + " has been submitted and needs review.",
                NotificationType.TICKET
            );
        });

        // Notify all technicians of new ticket
        userRepository.findByRole(Role.TECHNICIAN).forEach(tech -> {
            notificationService.createNotification(
                tech.getId(),
                "New Ticket Available",
                "A new maintenance ticket (" + saved.getTicketId() + ") has been submitted.",
                NotificationType.TICKET
            );
        });

        return toResponse(saved, user);
    }

    public List<TicketResponse> getUserTickets(User user) {
        return incidentRepository.findBySubmittedById(user.getId()).stream()
                .map(incident -> toResponse(incident, user))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets(User admin) {
        requireRole(admin, Role.ADMIN);
        return incidentRepository.findAll().stream()
                .map(incident -> toResponse(incident, admin))
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTechnicianTickets(User technician) {
        requireTechnicianRole(technician);
        return incidentRepository.findByAssignedTechnicianId(technician.getId()).stream()
                .map(incident -> toResponse(incident, technician))
                .collect(Collectors.toList());
    }

    public TicketResponse getTicketById(String id, User user) {
        Incident incident = findAccessibleIncident(id, user);
        return toResponse(incident, user);
    }

    public List<CommentResponse> getComments(String incidentId, User user) {
        Incident incident = findAccessibleIncident(incidentId, user);
        return buildVisibleComments(incident, user);
    }

    public DashboardSummaryResponse getStudentDashboardSummary(String userId) {
        List<Incident> incidents = incidentRepository.findBySubmittedById(userId);
        long totalSubmitted = incidents.size();
        long pending = incidents.stream()
                .filter(i -> normalizeStatus(i) == IncidentStatus.OPEN)
                .count();
        long approved = incidents.stream()
                .filter(i -> normalizeStatus(i) == IncidentStatus.IN_PROGRESS)
                .count();
        long completed = incidents.stream()
                .filter(i -> {
                    IncidentStatus status = normalizeStatus(i);
                    return status == IncidentStatus.RESOLVED || status == IncidentStatus.CLOSED;
                })
                .count();
        long rejected = incidents.stream().filter(i -> normalizeStatus(i) == IncidentStatus.REJECTED).count();
        long overdue = incidents.stream().filter(i -> i.getSlaStatus() == SlaStatus.BREACHED).count();

        return new DashboardSummaryResponse(totalSubmitted, pending, approved, completed, rejected, overdue);
    }

    @Transactional
    public void cancelIncident(String id, User user) {
        Incident incident = findById(id);
        normalizePersistedStatus(incident);
        if (!isRequester(incident, user)) {
            throw new UnauthorizedIncidentAccessException("Cannot cancel another user's incident.");
        }
        if (incident.getStatus() != IncidentStatus.OPEN) {
            throw new IllegalIncidentStateException("Incident cannot be cancelled in current status.");
        }
        incident.setStatus(IncidentStatus.CLOSED);
        incident.setUpdatedAt(Instant.now());
        incidentRepository.save(incident);
        logActivity(id, user, ActivityAction.CLOSED, "User cancelled the incident.");

        // Notify all admins of cancellation
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(
                admin.getId(),
                "Ticket Cancelled",
                "User " + user.getName() + " has cancelled ticket " + incident.getTicketId(),
                NotificationType.TICKET
            );
        });
    }

    @Transactional
    public TicketResponse updateStatus(String id, UpdateStatusRequest request, User user) {
        Incident incident = findById(id);
        normalizePersistedStatus(incident);
        ensureCanManageTicket(incident, user);

        IncidentStatus newStatus = normalizeRequestedStatus(request.getStatus());
        validateStatusTransitionRequest(incident.getStatus(), newStatus, user, request.getRejectionReason());

        Instant now = Instant.now();
        incident.setStatus(newStatus);

        if (newStatus == IncidentStatus.IN_PROGRESS && incident.getFirstResponseAt() == null) {
            applyFirstResponseIfMissing(incident, now);
        }
        if (newStatus == IncidentStatus.RESOLVED || newStatus == IncidentStatus.CLOSED) {
            incident.setResolvedAt(now);
            Instant startForResolution = incident.getCreatedAt() != null ? incident.getCreatedAt() : now;
            incident.setResolutionDurationMinutes(ChronoUnit.MINUTES.between(startForResolution, now));
        }
        if (newStatus == IncidentStatus.CLOSED) {
            incident.setClosedAt(now);
        }
        if (newStatus == IncidentStatus.REJECTED) {
            incident.setRejectionReason(request.getRejectionReason().trim());
        }
        if (newStatus == IncidentStatus.RESOLVED && request.getResolutionNotes() != null
                && !request.getResolutionNotes().trim().isEmpty()) {
            incident.setResolutionSummary(request.getResolutionNotes().trim());
        }

        slaService.evaluateSlaBreach(incident);
        incident.setUpdatedAt(now);
        Incident saved = incidentRepository.save(incident);
        logActivity(id, user, ActivityAction.STATUS_CHANGED, "Status changed to " + newStatus);

        // Notify requester
        if (incident.getSubmittedBy() != null) {
            notificationService.createNotification(
                incident.getSubmittedBy().getId(),
                "Ticket Status Updated",
                "Your ticket " + incident.getTicketId() + " status has been changed to " + newStatus,
                NotificationType.TICKET
            );
        }

        // Notify all admins of status change if updated by technician
        if (user.getRole() == Role.TECHNICIAN) {
            userRepository.findByRole(Role.ADMIN).forEach(admin -> {
                notificationService.createNotification(
                    admin.getId(),
                    "Technician Status Update",
                    "Technician " + user.getName() + " changed ticket " + incident.getTicketId() + " to " + newStatus,
                    NotificationType.TICKET
                );
            });
        }

        return toResponse(saved, user);
    }

    @Transactional
    public TicketResponse assignTechnician(String id, String technicianId, User admin) {
        requireRole(admin, Role.ADMIN);

        Incident incident = findById(id);
        normalizePersistedStatus(incident);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician user not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new InvalidRequestException("Assigned user must have the TECHNICIAN role.");
        }

        ActivityAction assignmentAction =
                incident.getAssignedTechnician() == null ? ActivityAction.ASSIGNED : ActivityAction.REASSIGNED;
        incident.setAssignedTechnician(technician);
        incident.setAssignedBy(admin);
        incident.setAssignedByAdminName(admin.getName());

        Instant now = Instant.now();

        if (incident.getStatus() == IncidentStatus.OPEN) {
            incident.setStatus(IncidentStatus.ASSIGNED);
            applyFirstResponseIfMissing(incident, now);
        }

        incident.setUpdatedAt(now);

        Incident saved = incidentRepository.save(incident);
        logActivity(id, admin, assignmentAction, "Assigned technician: " + technician.getName());

        // Notify technician
        notificationService.createNotification(
            technician.getId(),
            "New Ticket Assigned",
            "You have been assigned to ticket " + saved.getTicketId(),
            NotificationType.TICKET
        );

        // Notify requester
        if (saved.getSubmittedBy() != null) {
            notificationService.createNotification(
                saved.getSubmittedBy().getId(),
                "Technician Assigned",
                "A technician (" + technician.getName() + ") has been assigned to your ticket " + saved.getTicketId(),
                NotificationType.TICKET
            );
        }

        return toResponse(saved, admin);
    }

    @Transactional
    public TicketResponse addComment(String incidentId, AddCommentRequest request, User user) {
        Incident incident = findById(incidentId);
        validateCommentMessage(request.getMessage());
        ensureCanComment(incident, user);

        Instant now = Instant.now();
        IncidentComment comment = IncidentComment.builder()
                .id(UUID.randomUUID().toString())
                .ticketId(incident.getTicketId() != null ? incident.getTicketId() : incident.getId())
                .authorId(user.getId())
                .authorName(resolveDisplayName(user))
                .authorRole(user.getRole() != null ? user.getRole().name() : Role.USER.name())
                .content(request.getMessage().trim())
                .visibleToRequester(resolveRequesterVisibility(user, request.isVisibleToRequester()))
                .createdAt(now)
                .updatedAt(now)
                .softDeleted(false)
                .build();
        synchronizeCommentFields(comment);

        if (incident.getComments() == null) {
            incident.setComments(new ArrayList<>());
        }
        incident.getComments().add(comment);
        incident.setUpdatedAt(now);

        Incident saved = incidentRepository.save(incident);
        logActivity(incidentId, user, ActivityAction.COMMENT_ADDED, "Added comment.");

        // Notify relevant parties
        if (isRequester(incident, user)) {
            // Requester commented — notify assigned technician
            if (incident.getAssignedTechnician() != null) {
                notificationService.createNotification(
                    incident.getAssignedTechnician().getId(),
                    "New Comment on Ticket",
                    user.getName() + " commented on ticket " + incident.getTicketId(),
                    NotificationType.COMMENT
                );
            }
            // Requester commented — also notify all admins
            userRepository.findByRole(Role.ADMIN).forEach(admin -> {
                notificationService.createNotification(
                    admin.getId(),
                    "New Comment on Ticket",
                    user.getName() + " commented on ticket " + incident.getTicketId(),
                    NotificationType.COMMENT
                );
            });
        } else if (incident.getSubmittedBy() != null && comment.isVisibleToRequester()) {
            // Staff/admin commented with requester-visible flag — notify requester
            notificationService.createNotification(
                incident.getSubmittedBy().getId(),
                "New Comment on Ticket",
                user.getName() + " commented on your ticket " + incident.getTicketId(),
                NotificationType.COMMENT
            );
        }

        return toResponse(saved, user);
    }

    @Transactional
    public TicketResponse editComment(String incidentId, String commentId, EditCommentRequest request, User user) {
        Incident incident = findById(incidentId);
        validateCommentMessage(request.getMessage());
        ensureCanComment(incident, user);

        IncidentComment comment = findComment(incident, commentId);
        ensureCommentOwner(comment, user);

        if (comment.isSoftDeleted()) {
            throw new IllegalIncidentStateException("Cannot edit a deleted comment.");
        }

        comment.setContent(request.getMessage().trim());
        comment.setVisibleToRequester(resolveRequesterVisibility(user, request.isVisibleToRequester()));
        comment.setUpdatedAt(Instant.now());
        synchronizeCommentFields(comment);

        incident.setUpdatedAt(Instant.now());
        Incident saved = incidentRepository.save(incident);
        logActivity(incidentId, user, ActivityAction.COMMENT_EDITED, "Edited a comment.");
        return toResponse(saved, user);
    }

    @Transactional
    public TicketResponse deleteComment(String incidentId, String commentId, User user) {
        Incident incident = findById(incidentId);
        ensureCanComment(incident, user);

        IncidentComment comment = findComment(incident, commentId);
        // Admin can delete any comment (moderation); others can only delete their own
        if (user.getRole() != Role.ADMIN) {
            ensureCommentOwner(comment, user);
        }

        comment.setSoftDeleted(true);
        comment.setUpdatedAt(Instant.now());
        synchronizeCommentFields(comment);

        incident.setUpdatedAt(Instant.now());
        Incident saved = incidentRepository.save(incident);
        logActivity(incidentId, user, ActivityAction.COMMENT_DELETED, "Deleted a comment.");
        return toResponse(saved, user);
    }

    public List<ActivityLogResponse> getActivityLogs(String incidentId, User user) {
        Incident incident = findAccessibleIncident(incidentId, user);
        return activityLogRepository.findByIncidentIdOrderByTimestampDesc(incident.getId()).stream()
                .map(log -> new ActivityLogResponse(
                        log.getId(),
                        log.getIncidentId(),
                        log.getActionType() != null ? log.getActionType().name() : null,
                        log.getMessage(),
                        log.getPerformedBy() != null ? log.getPerformedBy().getName() : null,
                        log.getPerformedByRole(),
                        log.getTimestamp() != null ? log.getTimestamp().toString() : null
                ))
                .collect(Collectors.toList());
    }

    public AttachmentDownload getAttachment(String incidentId, String attachmentId, User user) {
        Incident incident = findAccessibleIncident(incidentId, user);
        IncidentAttachmentService.StoredAttachment attachment =
                incidentAttachmentService.resolveStoredAttachment(incident.getAttachments(), attachmentId);
        return new AttachmentDownload(attachment.path(), attachment.fileName(), attachment.contentType());
    }

    public void logActivity(String incidentId, User user, ActivityAction action, String message) {
        IncidentActivityLog log = IncidentActivityLog.builder()
                .incidentId(incidentId)
                .actionType(action)
                .message(message)
                .performedBy(user)
                .performedByRole(user.getRole() != null ? user.getRole().name() : Role.USER.name())
                .timestamp(Instant.now())
                .build();
        activityLogRepository.save(log);
    }

    private PriorityLevel mapPriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return PriorityLevel.MEDIUM;
        }
        String normalizedPriority = priority.trim().toUpperCase(Locale.ROOT);
        if ("URGENT".equals(normalizedPriority)) {
            normalizedPriority = PriorityLevel.EMERGENCY.name();
        }
        try {
            return PriorityLevel.valueOf(normalizedPriority);
        } catch (IllegalArgumentException ex) {
            return PriorityLevel.MEDIUM;
        }
    }

    private Incident findById(String id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
    }

    private Incident findAccessibleIncident(String id, User user) {
        Incident incident = findById(id);
        normalizePersistedStatus(incident);
        ensureCanAccessTicket(incident, user);
        return incident;
    }

    private void ensureCanAccessTicket(Incident incident, User user) {
        Role role = user.getRole();
        if (role == Role.ADMIN) {
            return;
        }
        if (role == Role.USER && isRequester(incident, user)) {
            return;
        }
        if (role == Role.TECHNICIAN && isAssignedTechnician(incident, user)) {
            return;
        }
        throw new UnauthorizedIncidentAccessException("You do not have access to this ticket.");
    }

    private void ensureCanManageTicket(Incident incident, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() == Role.TECHNICIAN && isAssignedTechnician(incident, user)) {
            return;
        }
        throw new UnauthorizedIncidentAccessException("Only the admin or assigned technician can update this ticket.");
    }

    private void ensureCanComment(Incident incident, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() == Role.TECHNICIAN && isAssignedTechnician(incident, user)) {
            return;
        }
        if (user.getRole() == Role.USER && isRequester(incident, user)) {
            return;
        }
        throw new UnauthorizedIncidentAccessException("You cannot comment on this ticket.");
    }

    private void ensureCommentOwner(IncidentComment comment, User user) {
        if (isCommentOwner(comment, user)) {
            return;
        }
        throw new UnauthorizedIncidentAccessException("You can only edit or delete your own comments.");
    }

    private boolean isCommentOwner(IncidentComment comment, User user) {
        if (comment.getAuthorId() != null) {
            return Objects.equals(comment.getAuthorId(), user.getId());
        }
        String authorName = comment.getAuthorName();
        if (authorName == null || authorName.isBlank()) {
            return false;
        }

        for (String candidate : resolveOwnerCandidates(user)) {
            if (equalsIgnoreCase(authorName, candidate)) {
                return true;
            }
        }
        return false;
    }

    private IncidentComment findComment(Incident incident, String commentId) {
        if (incident.getComments() == null || incident.getComments().isEmpty()) {
            throw new ResourceNotFoundException("No comments found");
        }

        return incident.getComments().stream()
                .filter(comment -> commentId.equals(comment.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    private List<CommentResponse> buildVisibleComments(Incident incident, User user) {
        if (incident.getComments() == null) {
            return List.of();
        }

        return incident.getComments().stream()
                .peek(this::synchronizeCommentFields)
                .filter(comment -> !comment.isSoftDeleted())
                .filter(comment -> canSeeComment(comment, user))
                .sorted(Comparator.comparing(this::resolveCommentCreatedAt))
                .map(comment -> toCommentResponse(comment, user))
                .collect(Collectors.toList());
    }

    private boolean canSeeComment(IncidentComment comment, User user) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        if (user.getRole() == Role.TECHNICIAN) {
            return true;
        }
        return comment.isVisibleToRequester();
    }

    private CommentResponse toCommentResponse(IncidentComment comment, User user) {
        Instant createdAt = resolveCommentCreatedAt(comment);
        Instant updatedAt = resolveCommentUpdatedAt(comment, createdAt);
        boolean isOwner = isCommentOwner(comment, user);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        // All roles can edit their own comments
        boolean canEdit = isOwner;
        // Owner can delete own; Admin can delete any comment (moderation)
        boolean canDelete = isOwner || isAdmin;

        return new CommentResponse(
                comment.getId(),
                comment.getTicketId(),
                comment.getAuthorId(),
                comment.getAuthorName(),
                comment.getAuthorRole(),
                resolveCommentContent(comment),
                comment.isVisibleToRequester(),
                createdAt != null ? createdAt.toString() : null,
                updatedAt != null ? updatedAt.toString() : null,
                canEdit,
                canDelete
        );
    }

    private Instant resolveCommentCreatedAt(IncidentComment comment) {
        if (comment.getCreatedAt() != null) {
            return comment.getCreatedAt();
        }
        if (comment.getLegacyCreatedAt() != null) {
            return comment.getLegacyCreatedAt();
        }
        return resolveCommentUpdatedAt(comment, null);
    }

    private Instant resolveCommentUpdatedAt(IncidentComment comment, Instant fallback) {
        if (comment.getUpdatedAt() != null) {
            return comment.getUpdatedAt();
        }
        if (comment.getLegacyUpdatedAt() != null) {
            return comment.getLegacyUpdatedAt();
        }
        return fallback;
    }

    private String resolveCommentContent(IncidentComment comment) {
        if (comment.getContent() != null && !comment.getContent().isBlank()) {
            return comment.getContent();
        }
        if (comment.getLegacyContent() != null && !comment.getLegacyContent().isBlank()) {
            return comment.getLegacyContent();
        }
        return null;
    }

    private void synchronizeCommentFields(IncidentComment comment) {
        String resolvedContent = resolveCommentContent(comment);
        if (resolvedContent != null && !resolvedContent.isBlank()) {
            comment.setContent(resolvedContent);
            comment.setLegacyContent(resolvedContent);
        }

        Instant resolvedCreatedAt = resolveCommentCreatedAt(comment);
        if (resolvedCreatedAt != null) {
            comment.setCreatedAt(resolvedCreatedAt);
            comment.setLegacyCreatedAt(resolvedCreatedAt);
        }

        Instant resolvedUpdatedAt = resolveCommentUpdatedAt(comment, resolvedCreatedAt);
        if (resolvedUpdatedAt != null) {
            comment.setUpdatedAt(resolvedUpdatedAt);
            comment.setLegacyUpdatedAt(resolvedUpdatedAt);
        }
    }

    private Instant getCreatedAtCorrected(Incident incident) {
        if (incident.getCreatedAt() != null) {
            return incident.getCreatedAt();
        }
        if (incident.getId() != null && org.bson.types.ObjectId.isValid(incident.getId())) {
            return new org.bson.types.ObjectId(incident.getId()).getDate().toInstant();
        }
        return null;
    }

    private TicketResponse toResponse(Incident incident, User user) {
        normalizePersistedStatus(incident);
        slaService.evaluateSlaBreach(incident);
        Instant actualCreatedAt = getCreatedAtCorrected(incident);
        Long responseDurationMinutes = resolveResponseDurationMinutes(incident, actualCreatedAt);
        Long resolutionDurationMinutes = resolveResolutionDurationMinutes(incident, actualCreatedAt);

        String requesterName = incident.getSubmittedBy() != null ? incident.getSubmittedBy().getName() : "Student";
        String requesterEmail = incident.getRequesterEmail();
        if (requesterEmail == null && incident.getSubmittedBy() != null) {
            requesterEmail = incident.getSubmittedBy().getEmail();
        }
        String requesterPhone = incident.getPreferredContact();
        String assignedByName = incident.getAssignedByAdminName();
        if (assignedByName == null && incident.getAssignedBy() != null) {
            assignedByName = incident.getAssignedBy().getName();
        }
        
        // Final fallback: check activity logs if we still don't know who assigned it
        if (assignedByName == null && incident.getId() != null) {
            assignedByName = activityLogRepository.findByIncidentIdOrderByTimestampDesc(incident.getId()).stream()
                    .filter(log -> log.getActionType() == ActivityAction.ASSIGNED || log.getActionType() == ActivityAction.REASSIGNED)
                    .findFirst() // Already ordered by timestamp desc
                    .map(log -> log.getPerformedBy() != null ? log.getPerformedBy().getName() : null)
                    .orElse(null);
        }

        boolean isRequester = isRequester(incident, user);
        boolean isAdmin = user.getRole() != null && user.getRole().name().equals("ADMIN");
        boolean isTechnician = user.getRole() != null && user.getRole().name().equals("TECHNICIAN");

        // If we are a Technician (and not an admin or the requester), we hide requester details
        if (isTechnician && !isAdmin && !isRequester) {
            requesterName = null;
            requesterEmail = null;
            requesterPhone = null;
        }

        return new TicketResponse(
                incident.getId(),
                incident.getTicketId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getCategory(),
                incident.getLocation(),
                incident.getRoom(),
                incident.getPriority(),
                incident.getStatus(),
                incident.getSubmittedBy() != null ? incident.getSubmittedBy().getId() : null,
                requesterName,
                requesterEmail,
                incident.getAssignedTechnician() != null ? incident.getAssignedTechnician().getId() : null,
                incident.getAssignedTechnician() != null ? incident.getAssignedTechnician().getName() : null,
                assignedByName,
                buildAttachmentResponses(incident),
                incident.getRejectionReason(),
                incident.getAdminNotes(),
                incident.getTechnicianNotes(),
                incident.getResolutionSummary(),
                incident.getResolutionSummary(),
                requesterPhone,
                incident.getSlaResponseDeadline() != null ? incident.getSlaResponseDeadline().toString() : null,
                incident.getSlaResolutionDeadline() != null ? incident.getSlaResolutionDeadline().toString() : null,
                incident.getFirstResponseAt() != null ? incident.getFirstResponseAt().toString() : null,
                incident.getResolvedAt() != null ? incident.getResolvedAt().toString() : null,
                responseDurationMinutes,
                resolutionDurationMinutes,
                incident.getSlaStatus(),
                actualCreatedAt != null ? actualCreatedAt.toString() : null,
                incident.getUpdatedAt() != null ? incident.getUpdatedAt().toString() : null,
                buildVisibleComments(incident, user)
        );
    }

    private List<AttachmentResponse> buildAttachmentResponses(Incident incident) {
        if (incident.getAttachments() == null || incident.getAttachments().isEmpty()) {
            return List.of();
        }

        return incident.getAttachments().stream()
                .map(attachment -> incidentAttachmentService.toResponse(incident.getId(), attachment))
                .collect(Collectors.toList());
    }

    private boolean isRequester(Incident incident, User user) {
        return incident.getSubmittedBy() != null && Objects.equals(incident.getSubmittedBy().getId(), user.getId());
    }

    private boolean isAssignedTechnician(Incident incident, User user) {
        return incident.getAssignedTechnician() != null
                && Objects.equals(incident.getAssignedTechnician().getId(), user.getId());
    }

    private boolean resolveRequesterVisibility(User user, boolean requestedVisibility) {
        if (user.getRole() == Role.USER) {
            return true;
        }
        return requestedVisibility;
    }

    private String resolveDisplayName(User user) {
        if (user.getName() != null && !user.getName().trim().isEmpty()) {
            return user.getName().trim();
        }
        return user.getEmail();
    }

    private List<String> resolveOwnerCandidates(User user) {
        List<String> candidates = new ArrayList<>();
        candidates.add(resolveDisplayName(user));
        candidates.add(user.getName());
        candidates.add(user.getEmail());

        if (user.getEmail() != null && user.getEmail().contains("@")) {
            candidates.add(user.getEmail().substring(0, user.getEmail().indexOf('@')));
        }

        return candidates.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    private void validateCommentMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new InvalidRequestException("Comment content cannot be empty.");
        }
    }

    private void requireRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new UnauthorizedIncidentAccessException("You do not have access to perform this action.");
        }
    }

    private void requireTechnicianRole(User user) {
        if (user.getRole() != Role.TECHNICIAN) {
            throw new UnauthorizedIncidentAccessException("Only technicians can access assigned tickets.");
        }
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null
                && right != null
                && left.trim().toLowerCase(Locale.ROOT).equals(right.trim().toLowerCase(Locale.ROOT));
    }

    private IncidentStatus normalizeStatus(Incident incident) {
        IncidentStatus normalized = com.smartcampus.incident.enums.IncidentEnums.normalizeStatus(incident.getStatus());
        if (incident.getStatus() != normalized) {
            incident.setStatus(normalized);
        }
        return normalized;
    }

    private void normalizePersistedStatus(Incident incident) {
        IncidentStatus currentStatus = incident.getStatus();
        IncidentStatus normalizedStatus = normalizeStatus(incident);
        if (currentStatus != normalizedStatus) {
            incident.setUpdatedAt(Instant.now());
            incidentRepository.save(incident);
        }
    }

    private IncidentStatus normalizeRequestedStatus(IncidentStatus requestedStatus) {
        IncidentStatus normalized = com.smartcampus.incident.enums.IncidentEnums.normalizeStatus(requestedStatus);
        if (!SUPPORTED_WORKFLOW_STATUSES.contains(normalized)) {
            throw new InvalidRequestException("Unsupported ticket status.");
        }
        return normalized;
    }

    private void validateStatusTransitionRequest(IncidentStatus currentStatus, IncidentStatus newStatus, User user, String rejectionReason) {
        // Enforce valid status transitions
        Set<IncidentStatus> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(newStatus)) {
            throw new InvalidRequestException(
                    "Cannot transition from " + currentStatus + " to " + newStatus + ".");
        }

        if (newStatus == IncidentStatus.REJECTED) {
            requireRole(user, Role.ADMIN);
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new InvalidRequestException("Rejection reason is required when rejecting a ticket.");
            }
        }
        if (newStatus == IncidentStatus.RESOLVED) {
            if (user.getRole() != Role.ADMIN && user.getRole() != Role.TECHNICIAN) {
                throw new UnauthorizedIncidentAccessException("Only Admin or assigned Technician can resolve a ticket.");
            }
        }
    }

    private void applyFirstResponseIfMissing(Incident incident, Instant responseAt) {
        if (incident.getFirstResponseAt() != null) {
            return;
        }

        Instant createdAt = getCreatedAtCorrected(incident);
        Instant effectiveResponseAt = responseAt != null ? responseAt : Instant.now();
        incident.setFirstResponseAt(effectiveResponseAt);

        if (createdAt != null) {
            incident.setResponseDurationMinutes(ChronoUnit.MINUTES.between(createdAt, effectiveResponseAt));
        }
    }

    private Long resolveResponseDurationMinutes(Incident incident, Instant createdAt) {
        if (incident.getResponseDurationMinutes() != null) {
            return incident.getResponseDurationMinutes();
        }
        if (createdAt == null || incident.getFirstResponseAt() == null) {
            return null;
        }
        return ChronoUnit.MINUTES.between(createdAt, incident.getFirstResponseAt());
    }

    private Long resolveResolutionDurationMinutes(Incident incident, Instant createdAt) {
        if (incident.getResolutionDurationMinutes() != null) {
            return incident.getResolutionDurationMinutes();
        }
        if (createdAt == null || incident.getResolvedAt() == null) {
            return null;
        }
        return ChronoUnit.MINUTES.between(createdAt, incident.getResolvedAt());
    }

    public record AttachmentDownload(java.nio.file.Path path, String fileName, String contentType) {
    }
}