package com.smartcampus.incident.service;

import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.incident.dto.IncidentRequests.AddCommentRequest;
import com.smartcampus.incident.dto.IncidentRequests.CreateTicketRequest;
import com.smartcampus.incident.dto.IncidentRequests.EditCommentRequest;
import com.smartcampus.incident.dto.IncidentResponses.AttachmentResponse;
import com.smartcampus.incident.dto.IncidentResponses.CommentResponse;
import com.smartcampus.incident.dto.IncidentResponses.TicketResponse;
import com.smartcampus.incident.enums.IncidentEnums.IncidentStatus;
import com.smartcampus.incident.exception.IncidentExceptions.InvalidRequestException;
import com.smartcampus.incident.exception.IncidentExceptions.UnauthorizedIncidentAccessException;
import com.smartcampus.incident.model.Incident;
import com.smartcampus.incident.model.IncidentComment;
import com.smartcampus.incident.repository.IncidentActivityLogRepository;
import com.smartcampus.incident.repository.IncidentRepository;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentActivityLogRepository activityLogRepository;

    @Mock
    private NotificationService notificationService;
    @Mock
    private SlaService slaService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private IncidentAttachmentService incidentAttachmentService;

    @InjectMocks
    private IncidentService incidentService;

    private User admin;
    private User requester;
    private User assignedTechnician;
    private User otherTechnician;
    private Incident incident;

    @BeforeEach
    void setUp() {
        admin = user("admin-1", "Admin User", "admin@example.com", Role.ADMIN);
        requester = user("user-1", "Requester User", "requester@example.com", Role.USER);
        assignedTechnician = user("tech-1", "Assigned Tech", "tech1@example.com", Role.TECHNICIAN);
        otherTechnician = user("tech-2", "Other Tech", "tech2@example.com", Role.TECHNICIAN);

        incident = Incident.builder()
                .id("incident-1")
                .ticketId("INC-12345678")
                .title("Broken projector")
                .description("Projector in Lab 2 is not working")
                .category("ELECTRICAL")
                .location("Engineering Block")
                .status(IncidentStatus.IN_PROGRESS)
                .submittedBy(requester)
                .assignedTechnician(assignedTechnician)
                .comments(new ArrayList<>())
                .createdAt(Instant.parse("2026-04-20T04:00:00Z"))
                .updatedAt(Instant.parse("2026-04-20T04:30:00Z"))
                .build();

        lenient().when(incidentRepository.findById("incident-1")).thenReturn(Optional.of(incident));
        lenient().when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(activityLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().doNothing().when(slaService).evaluateSlaBreach(any(Incident.class));
    }

    @Test
    void technicianAddsRequesterVisibleComment() {
        TicketResponse response = incidentService.addComment(
                "incident-1",
                new AddCommentRequest("Technician update for the requester", true),
                assignedTechnician
        );

        CommentResponse savedComment = response.getComments().get(0);
        assertThat(savedComment.isVisibleToRequester()).isTrue();
        assertThat(savedComment.getAuthorId()).isEqualTo(assignedTechnician.getId());
        assertThat(savedComment.getContent()).isEqualTo("Technician update for the requester");
        assertThat(savedComment.getCreatedAt()).isNotBlank();
        assertThat(savedComment.getUpdatedAt()).isNotBlank();
    }

    @Test
    void technicianAddsInternalOnlyComment() {
        TicketResponse response = incidentService.addComment(
                "incident-1",
                new AddCommentRequest("Internal note for facilities team", false),
                assignedTechnician
        );

        CommentResponse savedComment = response.getComments().get(0);
        assertThat(savedComment.isVisibleToRequester()).isFalse();
        assertThat(savedComment.getContent()).isEqualTo("Internal note for facilities team");
    }

    @Test
    void requesterCanSeeOnlyVisibleComments() {
        incident.setComments(new ArrayList<>(List.of(
                comment("comment-visible", assignedTechnician, true, "Shared progress update"),
                comment("comment-internal", assignedTechnician, false, "Internal diagnostics")
        )));

        List<CommentResponse> comments = incidentService.getComments("incident-1", requester);

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getContent()).isEqualTo("Shared progress update");
        assertThat(comments.get(0).isVisibleToRequester()).isTrue();
    }

    @Test
    void adminCanSeeAllComments() {
        incident.setComments(new ArrayList<>(List.of(
                comment("comment-visible", assignedTechnician, true, "Shared progress update"),
                comment("comment-internal", assignedTechnician, false, "Internal diagnostics")
        )));

        List<CommentResponse> comments = incidentService.getComments("incident-1", admin);

        assertThat(comments).hasSize(2);
        assertThat(comments).extracting(CommentResponse::getContent)
                .containsExactly("Shared progress update", "Internal diagnostics");
    }

    @Test
    void technicianCanEditOwnComment() {
        IncidentComment existing = comment("comment-1", assignedTechnician, false, "Old content");
        incident.setComments(new ArrayList<>(List.of(existing)));

        TicketResponse response = incidentService.editComment(
                "incident-1",
                "comment-1",
                new EditCommentRequest("Updated content", true),
                assignedTechnician
        );

        CommentResponse updated = response.getComments().get(0);
        assertThat(updated.getContent()).isEqualTo("Updated content");
        assertThat(updated.isVisibleToRequester()).isTrue();
        assertThat(updated.isCanEdit()).isTrue();
    }

    @Test
    void technicianCannotEditAnotherTechniciansComment() {
        IncidentComment existing = comment("comment-1", otherTechnician, false, "Old content");
        incident.setComments(new ArrayList<>(List.of(existing)));

        assertThatThrownBy(() -> incidentService.editComment(
                "incident-1",
                "comment-1",
                new EditCommentRequest("Malicious edit", true),
                assignedTechnician
        )).isInstanceOf(UnauthorizedIncidentAccessException.class)
                .hasMessageContaining("own comments");
    }

    @Test
    void technicianCanDeleteOwnComment() {
        IncidentComment existing = comment("comment-1", assignedTechnician, true, "Delete me");
        incident.setComments(new ArrayList<>(List.of(existing)));

        TicketResponse response = incidentService.deleteComment("incident-1", "comment-1", assignedTechnician);

        assertThat(response.getComments()).isEmpty();
        assertThat(incident.getComments().get(0).isSoftDeleted()).isTrue();
    }

    @Test
    void editedCommentShowsUpdatedContentToRequesterAndAdmin() {
        IncidentComment existing = IncidentComment.builder()
                .id("comment-edit")
                .ticketId(incident.getTicketId())
                .authorId(assignedTechnician.getId())
                .authorName(assignedTechnician.getName())
                .authorRole(Role.TECHNICIAN.name())
                .content("Old technician update")
                .legacyContent("Old technician update")
                .visibleToRequester(true)
                .createdAt(Instant.parse("2026-04-20T05:00:00Z"))
                .legacyCreatedAt(Instant.parse("2026-04-20T05:00:00Z"))
                .updatedAt(Instant.parse("2026-04-20T05:00:00Z"))
                .legacyUpdatedAt(Instant.parse("2026-04-20T05:00:00Z"))
                .softDeleted(false)
                .build();
        incident.setComments(new ArrayList<>(List.of(existing)));

        incidentService.editComment(
                "incident-1",
                "comment-edit",
                new EditCommentRequest("Updated technician message", true),
                assignedTechnician
        );

        List<CommentResponse> requesterComments = incidentService.getComments("incident-1", requester);
        List<CommentResponse> adminComments = incidentService.getComments("incident-1", admin);

        assertThat(requesterComments).hasSize(1);
        assertThat(adminComments).hasSize(1);
        assertThat(requesterComments.get(0).getContent()).isEqualTo("Updated technician message");
        assertThat(adminComments.get(0).getContent()).isEqualTo("Updated technician message");
        assertThat(requesterComments.get(0).getContent()).isNotEqualTo("Old technician update");
        assertThat(adminComments.get(0).getContent()).isNotEqualTo("Old technician update");
    }

    @Test
    void technicianOwnsLegacyCommentWhenAuthorNameMatchesEmailLocalPart() {
        IncidentComment existing = IncidentComment.builder()
                .id("comment-legacy")
                .ticketId(incident.getTicketId())
                .authorName("tech1")
                .authorRole(Role.TECHNICIAN.name())
                .legacyContent("Legacy ownership comment")
                .visibleToRequester(true)
                .legacyCreatedAt(Instant.parse("2026-04-20T05:00:00Z"))
                .legacyUpdatedAt(Instant.parse("2026-04-20T05:00:00Z"))
                .softDeleted(false)
                .build();
        incident.setComments(new ArrayList<>(List.of(existing)));

        TicketResponse response = incidentService.getTicketById("incident-1", assignedTechnician);

        assertThat(response.getComments()).hasSize(1);
        assertThat(response.getComments().get(0).isCanEdit()).isTrue();
        assertThat(response.getComments().get(0).isCanDelete()).isTrue();
    }

    @Test
    void onlyAssignedTechnicianCanAccessAssignedTicket() {
        assertThatThrownBy(() -> incidentService.getTicketById("incident-1", otherTechnician))
                .isInstanceOf(UnauthorizedIncidentAccessException.class)
                .hasMessageContaining("access");
    }

    @Test
    void checkboxVisibilityStatePersistsAcrossReload() {
        incidentService.addComment(
                "incident-1",
                new AddCommentRequest("Persisted visibility", true),
                assignedTechnician
        );

        when(incidentRepository.findById("incident-1")).thenReturn(Optional.of(incident));

        TicketResponse reloaded = incidentService.getTicketById("incident-1", assignedTechnician);

        assertThat(reloaded.getComments()).hasSize(1);
        assertThat(reloaded.getComments().get(0).isVisibleToRequester()).isTrue();
    }

    @Test
    void commentTimestampsAreIncludedInTicketResponse() {
        TicketResponse response = incidentService.addComment(
                "incident-1",
                new AddCommentRequest("Timestamped note", true),
                assignedTechnician
        );

        CommentResponse comment = response.getComments().get(0);
        assertThat(comment.getCreatedAt()).startsWith("202");
        assertThat(comment.getUpdatedAt()).startsWith("202");
    }

    @Test
    void attachmentResponsesIncludeViewAndDownloadUrls() {
        incident.setAttachments(List.of("attachment-1::photo.jpg::image%2Fjpeg::incident-1-attachment-1.jpg"));
        when(incidentAttachmentService.toResponse("incident-1", "attachment-1::photo.jpg::image%2Fjpeg::incident-1-attachment-1.jpg"))
                .thenReturn(new AttachmentResponse(
                        "attachment-1",
                        "photo.jpg",
                        "image/jpeg",
                        "/incidents/incident-1/attachments/attachment-1",
                        "/incidents/incident-1/attachments/attachment-1?download=true"
                ));

        TicketResponse response = incidentService.getTicketById("incident-1", admin);

        assertThat(response.getAttachments()).hasSize(1);
        assertThat(response.getAttachments().get(0).getViewUrl()).isEqualTo("/incidents/incident-1/attachments/attachment-1");
        assertThat(response.getAttachments().get(0).getDownloadUrl()).isEqualTo("/incidents/incident-1/attachments/attachment-1?download=true");
    }

    @Test
    void createIncidentWithTooManyAttachmentsFails() {
        List<MultipartFile> attachments = List.of(
                mock(MultipartFile.class),
                mock(MultipartFile.class),
                mock(MultipartFile.class),
                mock(MultipartFile.class)
        );

        CreateTicketRequest request = new CreateTicketRequest();
        request.setTitle("Too many files");
        request.setAttachments(attachments);

        assertThatThrownBy(() -> incidentService.createIncident(request, requester))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Maximum of 3 attachments allowed.");
    }

    private IncidentComment comment(String id, User author, boolean visibleToRequester, String content) {
        Instant createdAt = Instant.parse("2026-04-20T05:00:00Z");
        return IncidentComment.builder()
                .id(id)
                .ticketId(incident.getTicketId())
                .authorId(author.getId())
                .authorName(author.getName())
                .authorRole(author.getRole().name())
                .content(content)
                .visibleToRequester(visibleToRequester)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .softDeleted(false)
                .build();
    }

    private User user(String id, String name, String email, Role role) {
        return User.builder()
                .id(id)
                .name(name)
                .email(email)
                .role(role)
                .build();
    }
}
