import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Users,
  Clock,
  Building2,
  Calendar,
  Star,
  Check,
  Wifi,
  Coffee,
  Monitor,
  Car,
  Shield,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { facilityApi } from "../api/facilityApi";

const ResourceDetailModal = ({ resource, onClose, onReviewAdded }) => {
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [localResource, setLocalResource] = useState(resource);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalResource(resource);
    setSelectedRating(0);
    setReviewMessage(null);
    setReviewError(null);
    setShowSuccess(false);
  }, [resource]);

  useEffect(() => {
    if (!resource?.id) return;

    let isMounted = true;
    setIsLoadingDetails(true);

    facilityApi
      .getResourceById(resource.id)
      .then((response) => {
        if (!isMounted) return;
        setLocalResource(response.data);
      })
      .catch((error) => {
        console.error("Failed to load resource details", error);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resource?.id]);

  if (!localResource) return null;

  const isOutOfService = localResource.status === "OUT_OF_SERVICE";
  const isMaintenance = localResource.status === "MAINTENANCE";

  const format12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHour = h % 12 || 12;
    return `${String(formattedHour).padStart(2, "0")}:${minute} ${ampm}`;
  };

  const getAmenityIcon = (amenity) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes("wifi") || lowerAmenity.includes("internet"))
      return <Wifi size={14} />;
    if (lowerAmenity.includes("coffee") || lowerAmenity.includes("tea"))
      return <Coffee size={14} />;
    if (lowerAmenity.includes("projector") || lowerAmenity.includes("screen"))
      return <Monitor size={14} />;
    if (lowerAmenity.includes("parking")) return <Car size={14} />;
    if (lowerAmenity.includes("security")) return <Shield size={14} />;
    if (lowerAmenity.includes("power") || lowerAmenity.includes("electric"))
      return <Zap size={14} />;
    return <Building2 size={14} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[520px] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Hero Image Section */}
        <div className="relative w-full h-[200px] flex-shrink-0">
          {localResource.imageUrl && localResource.imageUrl !== "" ? (
            <img
              src={localResource.imageUrl}
              alt={localResource.name}
              className="w-full h-full object-cover rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-t-2xl flex items-center justify-center">
              <Building2
                size={48}
                className="text-slate-400 dark:text-slate-500"
                strokeWidth={1.5}
              />
            </div>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <X size={20} className="text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {isLoadingDetails && (
            <div className="px-6 pt-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                Loading facility details...
              </div>
            </div>
          )}
          <div className="px-6 py-6 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight">
                  {localResource.name}
                </h1>
                {/* Rating Row */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={
                          (localResource.rating ?? 0) > index
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {(localResource.numReviews ?? 0) > 0
                      ? (localResource.rating ?? 0).toFixed(1)
                      : "No reviews"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {(localResource.numReviews ?? 0) > 0
                      ? `(${localResource.numReviews} reviews)`
                      : ""}
                  </span>
                </div>
              </div>
              {/* Badge */}
              <div className="ml-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">
                {localResource.type?.replace("_", " ")}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <MapPin
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {localResource.location}
                  </p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3 border-l border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Users
                    size={18}
                    className="text-green-600 dark:text-green-400"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Capacity
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {localResource.capacity} seats
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Description
              </h3>
              <p
                className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${
                  !isDescriptionExpanded &&
                  localResource.description?.length > 150
                    ? "line-clamp-3"
                    : ""
                }`}
              >
                {localResource.description || "No description provided."}
              </p>
              {localResource.description?.length > 150 && (
                <button
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 hover:underline transition-colors"
                >
                  {isDescriptionExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Amenities Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Amenities
              </h3>
              {localResource.amenities && localResource.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {localResource.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  None listed.
                </p>
              )}
            </div>

            {/* Availability Windows Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Availability Windows
              </h3>
              {localResource.availabilityWindows &&
              localResource.availabilityWindows.length > 0 ? (
                <div className="space-y-2">
                  {localResource.availabilityWindows.map((window, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {window.dayOfWeek}
                        </span>
                        <span className="text-sm font-mono text-slate-900 dark:text-white">
                          {format12Hour(window.startTime)} -{" "}
                          {format12Hour(window.endTime)}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No regular windows specified.
                </p>
              )}
            </div>

            {/* Share a Rating Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Share a Rating
              </h3>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedRating(index + 1)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Star
                      size={24}
                      className={
                        index < selectedRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={async () => {
                  setReviewError(null);
                  setReviewMessage(null);
                  if (selectedRating < 1) {
                    setReviewError("Please select a rating between 1 and 5.");
                    return;
                  }

                  setIsSubmittingReview(true);
                  try {
                    const response = await facilityApi.addReview(
                      localResource.id,
                      {
                        rating: selectedRating,
                      },
                    );
                    setLocalResource(response.data);
                    setShowSuccess(true);
                    setSelectedRating(0);
                    if (onReviewAdded) {
                      onReviewAdded(response.data);
                    }
                    setTimeout(() => setShowSuccess(false), 2500);
                  } catch (error) {
                    console.error("Error submitting review", error);
                    setReviewError(
                      "Unable to submit your rating right now. Please try again later.",
                    );
                  } finally {
                    setIsSubmittingReview(false);
                  }
                }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                  showSuccess
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white"
                } disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {showSuccess ? (
                  <>
                    <Check size={18} />
                    Rating Submitted!
                  </>
                ) : isSubmittingReview ? (
                  "Submitting..."
                ) : (
                  "Submit Rating"
                )}
              </button>
              {reviewError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-3">
                  {reviewError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Book Button */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <button
            onClick={() => {
              onClose();
              navigate(
                `/bookings/new?facilityId=${localResource.id}&facilityName=${encodeURIComponent(localResource.name)}`,
              );
            }}
            disabled={isOutOfService || isMaintenance}
            className={`w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-200 ${
              isOutOfService || isMaintenance
                ? ""
                : "shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
            }`}
          >
            <Calendar size={20} strokeWidth={2} />
            {isOutOfService || isMaintenance
              ? "Facility Unavailable"
              : "Book This Venue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailModal;
