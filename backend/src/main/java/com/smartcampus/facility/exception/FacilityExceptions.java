package com.smartcampus.facility.exception;

public class FacilityExceptions {

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
    
    public static class InvalidResourceOperationException extends RuntimeException {
        public InvalidResourceOperationException(String message) {
            super(message);
        }
    }
}
