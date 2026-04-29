package com.smartcampus.incident.enums;

import java.util.EnumSet;
import java.util.Set;

public class IncidentEnums {
    
    public enum PriorityLevel {
        LOW,
        MEDIUM,
        HIGH,
        EMERGENCY
    }

    public enum IncidentStatus {
        OPEN,
        SUBMITTED,
        UNDER_REVIEW,
        ASSIGNED,
        IN_PROGRESS,
        ON_HOLD,
        RESOLVED,
        CLOSED,
        REJECTED
    }

    private static final Set<IncidentStatus> ACTIVE_WORKFLOW_STATUSES = EnumSet.of(
            IncidentStatus.OPEN,
            IncidentStatus.ASSIGNED,
            IncidentStatus.IN_PROGRESS,
            IncidentStatus.RESOLVED,
            IncidentStatus.CLOSED,
            IncidentStatus.REJECTED
    );

    public static IncidentStatus normalizeStatus(IncidentStatus status) {
        if (status == null) {
            return IncidentStatus.OPEN;
        }

        return switch (status) {
            case SUBMITTED, UNDER_REVIEW -> IncidentStatus.OPEN;
            case ON_HOLD -> IncidentStatus.IN_PROGRESS;
            default -> status;
        };
    }

    public static boolean isWorkflowStatus(IncidentStatus status) {
        return ACTIVE_WORKFLOW_STATUSES.contains(normalizeStatus(status));
    }

    public enum SlaStatus {
        ON_TRACK,
        ON_TIME,
        RESPONSE_OVERDUE,
        RESOLUTION_OVERDUE,
        BREACHED,
        COMPLETED_WITHIN_SLA,
        COMPLETED_OVERDUE
    }

    public enum ActivityAction {
        CREATED,
        STATUS_CHANGED,
        PRIORITY_CHANGED,
        ASSIGNED,
        REASSIGNED,
        NOTE_ADDED,
        COMMENT_ADDED,
        COMMENT_EDITED,
        COMMENT_DELETED,
        RESOLVED,
        CLOSED,
        REJECTED
    }
}
