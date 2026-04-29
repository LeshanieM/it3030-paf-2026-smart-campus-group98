package com.smartcampus.facility.repository;

import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;

public interface ResourceListProjection {
    String getId();
    String getName();
    ResourceType getType();
    Integer getCapacity();
    String getLocation();
    String getImageUrl();
    Double getRating();
    Integer getNumReviews();
    ResourceStatus getStatus();
}
