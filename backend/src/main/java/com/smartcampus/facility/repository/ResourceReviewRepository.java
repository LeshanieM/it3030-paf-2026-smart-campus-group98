package com.smartcampus.facility.repository;

import com.smartcampus.facility.model.ResourceReview;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceReviewRepository extends MongoRepository<ResourceReview, String> {
    Optional<ResourceReview> findByResourceIdAndUserId(String resourceId, String userId);
    List<ResourceReview> findByResourceId(String resourceId);
}
