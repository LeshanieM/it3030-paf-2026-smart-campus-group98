import React, { useCallback, useEffect, useRef, useState } from "react";
import ResourceCard from "../components/ResourceCard";
import ResourceFilter from "../components/ResourceFilter";
import ResourceDetailModal from "../components/ResourceDetailModal";
import { Building2 } from "lucide-react";
import Layout from "../../../components/Layout";
import { facilityService } from "../../../services/facilityService";
import axios from "axios";

const RESOURCE_CACHE_TTL_MS = 2 * 60 * 1000;
const resourceQueryCache = new Map();

const buildCacheKey = (filters) =>
  JSON.stringify({
    type: filters.type || "",
    location: filters.location || "",
    minCapacity: filters.minCapacity || "",
  });

const FacilityCataloguePage = () => {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    minCapacity: "",
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const hasExistingDataRef = useRef(false);

  const withTimeout = useCallback((promise, ms, label) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => window.clearTimeout(timeoutId));
  }, []);

  const loadResources = useCallback(async () => {
    const cacheKey = buildCacheKey(filters);
    const cached = resourceQueryCache.get(cacheKey);
    const now = Date.now();
    const hasFreshCache = cached && now - cached.cachedAt < RESOURCE_CACHE_TTL_MS;

    if (hasFreshCache) {
      setResources(cached.data);
      setError(null);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    const hasExistingData = hasExistingDataRef.current;
    if (hasExistingData) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      if (filters.minCapacity) params.minCapacity = filters.minCapacity;
      // Keep the initial payload small so the page renders fast.
      params.page = 0;
      params.size = 20;

      // Use same request pipeline as bookings (axiosInstance: /api + auth + timeout + 401 handling)
      const resData = await withTimeout(
        facilityService.getAllResources(params),
        25_000,
        "Facilities",
      );
      const data = Array.isArray(resData) ? resData : [];
      setResources(data);
      resourceQueryCache.set(cacheKey, { data, cachedAt: Date.now() });
    } catch (error) {
      console.error("Failed to load resources", error);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const timedOut = String(error?.message || "").toLowerCase().includes("timed out");
      const statusHint = status ? ` (HTTP ${status})` : "";
      setError(timedOut
        ? `Facilities are taking too long to load${statusHint}. Please try again.`
        : `We encountered an issue communicating with the server${statusHint}. Please check your connection and try again.`
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, withTimeout]);

  useEffect(() => {
    // track current data presence without re-creating loadResources
    hasExistingDataRef.current = resources.length > 0;
  }, [resources.length]);

  useEffect(() => {
    loadResources();
    // Intentionally load once on mount (like bookings page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#4169E1]/10 flex items-center justify-center text-[#4169E1]">
              <Building2 size={24} className="stroke-[2.5]" />
            </div>
            Facilities Catalogue
          </h1>
          <p className="text-slate-500 mt-2 ml-16 font-medium">
            Browse and search available campus facilities and resources.
          </p>
        </div>

        <ResourceFilter
          filters={filters}
          setFilters={setFilters}
          onSearch={loadResources}
        />
        {isRefreshing && resources.length > 0 && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
            Refreshing facilities...
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4169E1]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-rose-700">Offline</h3>
            <p className="text-rose-600/80 mt-2 font-medium">{error}</p>
            <button
              onClick={loadResources}
              className="mt-6 px-6 py-2.5 bg-white text-rose-600 font-bold rounded-xl border border-rose-200 shadow-sm hover:bg-rose-100 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              No facilities found.
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              Try adjusting your search filters to see more results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isAdmin={false}
                onViewDetails={(res) => setSelectedResource(res)}
              />
            ))}
          </div>
        )}
      </div>

      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onReviewAdded={(updatedResource) => {
          setSelectedResource(updatedResource);
          setResources((prev) =>
            prev.map((item) =>
              item.id === updatedResource.id ? updatedResource : item,
            ),
          );
        }}
      />
    </Layout>
  );
};

export default FacilityCataloguePage;
