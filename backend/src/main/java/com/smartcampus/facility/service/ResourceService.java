package com.smartcampus.facility.service;

import com.smartcampus.entity.User;
import com.smartcampus.facility.dto.FacilityRequests.CreateResourceRequest;
import com.smartcampus.facility.dto.FacilityRequests.UpdateResourceRequest;
import com.smartcampus.facility.dto.FacilityResponses.ResourceListItemResponse;
import com.smartcampus.facility.dto.FacilityResponses.ResourceResponse;
import com.smartcampus.facility.enums.FacilityEnums.ResourceStatus;
import com.smartcampus.facility.enums.FacilityEnums.ResourceType;
import com.smartcampus.facility.exception.FacilityExceptions.ResourceNotFoundException;
import com.smartcampus.facility.model.Resource;
import com.smartcampus.facility.model.ResourceReview;
import com.smartcampus.facility.repository.ResourceListProjection;
import com.smartcampus.facility.repository.ResourceRepository;
import com.smartcampus.facility.repository.ResourceReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.smartcampus.service.CloudinaryService;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final ResourceRepository resourceRepository;
    private final ResourceReviewRepository resourceReviewRepository;
    private final CloudinaryService cloudinaryService;

    public ResourceResponse createResource(CreateResourceRequest request, MultipartFile image, User admin) {
        String imageUrl = request.getImageUrl();
        if (image != null && !image.isEmpty()) {
            try {
                imageUrl = cloudinaryService.uploadImage(image);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload image", e);
            }
        }

        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .description(request.getDescription())
                .availabilityWindows(request.getAvailabilityWindows() != null ? request.getAvailabilityWindows() : List.of())
                .amenities(request.getAmenities() != null ? request.getAmenities() : List.of())
                .imageUrl(imageUrl)
                .status(ResourceStatus.ACTIVE)
                .createdBy(admin)
                .build();

        return toResponse(resourceRepository.save(resource), false);
    }

    public List<ResourceListItemResponse> getAllResources(Integer page, Integer size) {
        PageRequest pageable = PageRequest.of(
                sanitizePage(page),
                sanitizeSize(size)
        );
        return resourceRepository.findAllListItems(pageable).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceListItemResponse> getResourcesByType(ResourceType type) {
        return resourceRepository.findByType(type).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceListItemResponse> searchResources(ResourceType type, String location, Integer capacity, Integer page, Integer size) {
        PageRequest pageable = PageRequest.of(
                sanitizePage(page),
                sanitizeSize(size)
        );
        return resourceRepository.searchResourceListItems(type, location, capacity, pageable).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceListItemResponse> getResourcesByStatus(ResourceStatus status, Integer page, Integer size) {
        PageRequest pageable = PageRequest.of(
                sanitizePage(page),
                sanitizeSize(size)
        );
        return resourceRepository.findListItemsByStatus(status, pageable).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse getResourceById(String id) {
        return toResponse(findById(id), true);
    }

    public ResourceResponse updateResource(String id, UpdateResourceRequest request, MultipartFile image) {
        Resource resource = findById(id);
        
        if (request.getName() != null) {
            resource.setName(request.getName());
        }
        if (request.getType() != null) {
            resource.setType(request.getType());
        }
        if (request.getCapacity() != null) {
            resource.setCapacity(request.getCapacity());
        }
        if (request.getLocation() != null) {
            resource.setLocation(request.getLocation());
        }
        if (request.getDescription() != null) {
            resource.setDescription(request.getDescription());
        }
        if (request.getAvailabilityWindows() != null) {
            resource.setAvailabilityWindows(request.getAvailabilityWindows());
        }
        if (request.getAmenities() != null) {
            resource.setAmenities(request.getAmenities());
        }

        if (image != null && !image.isEmpty()) {
            try {
                resource.setImageUrl(cloudinaryService.uploadImage(image));
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload image", e);
            }
        } else if (request.getImageUrl() != null) {
            resource.setImageUrl(request.getImageUrl());
        }

        return toResponse(resourceRepository.save(resource), false);
    }

    public ResourceResponse updateStatus(String id, ResourceStatus newStatus) {
        Resource resource = findById(id);
        resource.setStatus(newStatus);
        return toResponse(resourceRepository.save(resource), false);
    }

    public ResourceResponse addReview(String resourceId, Integer rating, User user) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Resource resource = findById(resourceId);
        double currentRating = resource.getRating() != null ? resource.getRating() : 0.0;
        int currentCount = resource.getNumReviews() != null ? resource.getNumReviews() : 0;

        ResourceReview existingReview = resourceReviewRepository
                .findByResourceIdAndUserId(resourceId, user.getId())
                .orElse(null);

        if (existingReview != null) {
            int previousRating = existingReview.getRating();
            existingReview.setRating(rating);
            resourceReviewRepository.save(existingReview);

            double totalRating = currentRating * currentCount - previousRating + rating;
            resource.setRating(currentCount > 0 ? totalRating / currentCount : rating);
        } else {
            ResourceReview review = ResourceReview.builder()
                    .resourceId(resourceId)
                    .userId(user.getId())
                    .userName(user.getName())
                    .rating(rating)
                    .build();
            resourceReviewRepository.save(review);

            int newCount = currentCount + 1;
            double totalRating = currentRating * currentCount + rating;
            resource.setNumReviews(newCount);
            resource.setRating(totalRating / newCount);
        }

        return toResponse(resourceRepository.save(resource), false);
    }

    public void deleteResource(String id) {
        Resource resource = findById(id);
        resourceRepository.delete(resource);
    }

    private Resource findById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
    }

    private ResourceResponse toResponse(Resource resource, boolean includeCreatorName) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getDescription(),
                resource.getAvailabilityWindows(),
                resource.getAmenities(),
                resource.getImageUrl(),
                resource.getRating() != null ? resource.getRating() : 0.0,
                resource.getNumReviews() != null ? resource.getNumReviews() : 0,
                resource.getStatus(),
                includeCreatorName && resource.getCreatedBy() != null ? resource.getCreatedBy().getName() : null,
                resource.getCreatedAt() != null ? resource.getCreatedAt().toString() : null,
                resource.getUpdatedAt() != null ? resource.getUpdatedAt().toString() : null
        );
    }

    private ResourceListItemResponse toListResponse(ResourceListProjection resource) {
        return new ResourceListItemResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getImageUrl(),
                resource.getRating() != null ? resource.getRating() : 0.0,
                resource.getNumReviews() != null ? resource.getNumReviews() : 0,
                resource.getStatus()
        );
    }

    private ResourceListItemResponse toListResponse(Resource resource) {
        return new ResourceListItemResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getImageUrl(),
                resource.getRating() != null ? resource.getRating() : 0.0,
                resource.getNumReviews() != null ? resource.getNumReviews() : 0,
                resource.getStatus()
        );
    }

    private int sanitizePage(Integer page) {
        if (page == null || page < 0) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    private int sanitizeSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
