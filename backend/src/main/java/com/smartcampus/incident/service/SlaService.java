package com.smartcampus.incident.service;

import com.smartcampus.incident.enums.IncidentEnums.PriorityLevel;
import com.smartcampus.incident.enums.IncidentEnums.SlaStatus;
import com.smartcampus.incident.model.Incident;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class SlaService {

    public void calculateDeadlines(Incident incident) {
        Instant now = Instant.now();
        PriorityLevel priority = incident.getPriority();
        
        long responseMinutes;
        long resolutionHours;
        
        switch (priority) {
            case EMERGENCY:
                responseMinutes = 15; 
                resolutionHours = 4;
                break;
            case HIGH:
                responseMinutes = 60; 
                resolutionHours = 8;
                break;
            case LOW:
                responseMinutes = 480; 
                resolutionHours = 72;
                break;
            case MEDIUM:
            default:
                responseMinutes = 240; 
                resolutionHours = 24;
                break;
        }

        incident.setSlaResponseDeadline(now.plus(responseMinutes, ChronoUnit.MINUTES));
        incident.setSlaResolutionDeadline(now.plus(resolutionHours, ChronoUnit.HOURS));
        incident.setSlaStatus(SlaStatus.ON_TRACK);
    }

    public void evaluateSlaBreach(Incident incident) {
        Instant now = Instant.now();
        SlaStatus currentStatus = SlaStatus.ON_TRACK;

        boolean responseBreached = false;
        boolean resolutionBreached = false;

        if (incident.getSlaResponseDeadline() != null) {
            Instant responseTime = incident.getFirstResponseAt() != null ? incident.getFirstResponseAt() : now;
            if (responseTime.isAfter(incident.getSlaResponseDeadline())) {
                responseBreached = true;
            }
        }

        if (incident.getSlaResolutionDeadline() != null) {
            Instant resolutionTime = incident.getResolvedAt() != null ? incident.getResolvedAt() : now;
            if (resolutionTime.isAfter(incident.getSlaResolutionDeadline())) {
                resolutionBreached = true;
            }
        }

        if (incident.getResolvedAt() != null) {
            if (resolutionBreached || responseBreached) {
                currentStatus = SlaStatus.COMPLETED_OVERDUE;
            } else {
                currentStatus = SlaStatus.COMPLETED_WITHIN_SLA;
            }
        } else {
            if (resolutionBreached && responseBreached) {
                currentStatus = SlaStatus.BREACHED;
            } else if (resolutionBreached) {
                currentStatus = SlaStatus.RESOLUTION_OVERDUE;
            } else if (responseBreached) {
                currentStatus = SlaStatus.RESPONSE_OVERDUE;
            } else {
                currentStatus = SlaStatus.ON_TRACK;
            }
        }

        incident.setSlaStatus(currentStatus);
    }
}
