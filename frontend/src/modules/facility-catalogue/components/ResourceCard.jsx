import React, { useMemo } from "react";
import {
  MapPin,
  Users,
  Settings,
  Trash2,
  Building2,
  Eye,
  Star,
} from "lucide-react";

const ResourceCard = ({
  resource,
  isAdmin,
  onEdit,
  onDelete,
  onStatusToggle,
  statusUpdating = false,
  onViewDetails,
}) => {
  const isOutOfService = resource.status === "OUT_OF_SERVICE";
  const isMaintenance = resource.status === "MAINTENANCE";

  // Build stars once per rating to reduce repeated work per render.
  const stars = useMemo(() => {
    const rating = resource.rating ?? 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      let fillPercentage = 0;

      if (i < fullStars) {
        fillPercentage = 100; // Full star
      } else if (i === fullStars && hasHalfStar) {
        fillPercentage = 50; // Half star
      }

      stars.push(
        <div key={i} className="relative">
          {/* Background star (empty) */}
          <Star
            size={16}
            className="text-slate-300 dark:text-slate-600"
            fill="none"
            strokeWidth={1.5}
          />
          {/* Foreground star (filled) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            <Star
              size={16}
              className="text-[#f5a623]"
              fill="#f5a623"
              strokeWidth={1.5}
            />
          </div>
        </div>,
      );
    }

    return stars;
  }, [resource.rating]);

  return (
    <div
      className={`max-w-[380px] mx-auto bg-card dark:bg-slate-800 rounded-[22px] border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-[5px] animate-fade-in ${
        isOutOfService || isMaintenance ? "opacity-80" : ""
      }`}
    >
      {/* Image Section */}
      <div className="relative w-full h-[195px] overflow-hidden">
        {resource.imageUrl && resource.imageUrl !== "" ? (
          <img
            src={resource.imageUrl}
            alt={resource.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Building2
              size={48}
              className="text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Card Body */}
      <div className="p-[17px_18px_18px] flex flex-col">
        {/* Name + Type Row */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-[19px] font-semibold text-foreground leading-tight flex-1 min-w-0">
            {resource.name}
          </h3>
          <div className="ml-3 px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono uppercase rounded-full border border-primary/20">
            {resource.type?.replaceAll("_", " ")}
          </div>
        </div>

        {/* Star Rating Row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {stars}
          </div>
          <span className="text-sm font-bold text-foreground">
            {(resource.rating ?? 0).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({resource.numReviews ?? 0})
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-[0.5px] bg-border mb-4" />

        {/* Bottom Meta Row */}
        <div className="flex items-center justify-between">
          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="w-[30px] h-[30px] bg-muted rounded-lg flex items-center justify-center">
              <MapPin
                size={16}
                className="text-muted-foreground"
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-primary tracking-wider">
                Location
              </p>
              <p className="text-[13px] font-medium text-foreground truncate max-w-[100px]">
                {resource.location}
              </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[0.5px] h-8 bg-border" />

          {/* Capacity */}
          <div className="flex items-center gap-3">
            <div className="w-[30px] h-[30px] bg-muted rounded-lg flex items-center justify-center">
              <Users
                size={16}
                className="text-muted-foreground"
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-primary tracking-wider">
                Capacity
              </p>
              <p className="text-[13px] font-medium text-foreground">
                {resource.capacity} seats
              </p>
            </div>
          </div>

          {/* View Button */}
          <button
            onClick={() => onViewDetails && onViewDetails(resource)}
            className="ml-4 px-3 py-2 bg-primary text-white text-[13px] font-medium rounded-[10px] flex items-center gap-2 hover:bg-primary/90 transition-all duration-250 ease-out hover:scale-95"
          >
            <Eye size={14} strokeWidth={2} />
            View
          </button>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <button
              onClick={() => onStatusToggle(resource)}
              disabled={statusUpdating}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 ease-out border-none ${
                isOutOfService
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
              } ${statusUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {statusUpdating
                ? "UPDATING..."
                : isOutOfService
                  ? "SET ACTIVE"
                  : "SET OFFLINE"}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(resource)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-250 ease-out"
                title="Edit"
              >
                <Settings size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(resource.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-all duration-250 ease-out"
                title="Delete"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ResourceCard);
