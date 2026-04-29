package com.smartcampus.booking.repository;

import com.smartcampus.booking.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByCreatedBy(String createdBy);

    /**
     * Finds bookings that conflict with the requested time slot for a specific resource.
     * Conflict condition: booking.startTime < requestedEnd AND booking.endTime > requestedStart
     * Only considers bookings with status PENDING or APPROVED.
     */
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $in: ['APPROVED','PENDING'] }, 'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } }")
    List<Booking> findConflictingBookings(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime);
}
