package com.smartcampus.facility.repository;

import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;
import com.smartcampus.facility.model.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findByType(ResourceType type);
    List<Resource> findByStatus(ResourceStatus status);
    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);
    
    @Query(value = "{}", fields = "{ '_id': 1, 'name': 1, 'type': 1, 'capacity': 1, 'location': 1, 'imageUrl': 1, 'rating': 1, 'numReviews': 1, 'status': 1 }")
    Page<ResourceListProjection> findAllListItems(Pageable pageable);

    @Query(value = "{ 'status': ?0 }", fields = "{ '_id': 1, 'name': 1, 'type': 1, 'capacity': 1, 'location': 1, 'imageUrl': 1, 'rating': 1, 'numReviews': 1, 'status': 1 }")
    Page<ResourceListProjection> findListItemsByStatus(ResourceStatus status, Pageable pageable);

    List<Resource> findByLocation(String location);
    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    @Query("{ " +
           "  $and: [ " +
           "    { 'type': ?#{ [0] == null ? { $exists: true } : [0] } }, " +
           "    { 'location': ?#{ [1] == null ? { $exists: true } : [1] } }, " +
           "    { 'capacity': ?#{ [2] == null ? { $exists: true } : { $gte: [2] } } } " +
           "  ] " +
           "}")
    List<Resource> searchResources(ResourceType type, String location, Integer capacity);

    @Query("{ " +
           "  $and: [ " +
           "    { 'type': ?#{ [0] == null ? { $exists: true } : [0] } }, " +
           "    { 'location': ?#{ [1] == null ? { $exists: true } : [1] } }, " +
           "    { 'capacity': ?#{ [2] == null ? { $exists: true } : { $gte: [2] } } } " +
           "  ] " +
           "}")
    Page<Resource> searchResources(ResourceType type, String location, Integer capacity, Pageable pageable);

    @Query(value = "{ " +
           "  $and: [ " +
           "    { 'type': ?#{ [0] == null ? { $exists: true } : [0] } }, " +
           "    { 'location': ?#{ [1] == null ? { $exists: true } : [1] } }, " +
           "    { 'capacity': ?#{ [2] == null ? { $exists: true } : { $gte: [2] } } } " +
           "  ] " +
           "}", fields = "{ '_id': 1, 'name': 1, 'type': 1, 'capacity': 1, 'location': 1, 'imageUrl': 1, 'rating': 1, 'numReviews': 1, 'status': 1 }")
    Page<ResourceListProjection> searchResourceListItems(ResourceType type, String location, Integer capacity, Pageable pageable);
}
