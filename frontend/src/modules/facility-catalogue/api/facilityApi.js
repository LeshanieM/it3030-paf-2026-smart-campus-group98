import api from "../../../services/api";

export const facilityApi = {
  // USER endpoints
  getAllResources: (params) => {
    return api.get("/resources", {
      params: {
        page: 0,
        size: 50,
        ...(params || {}),
      },
    });
  },
  getResourceById: (id) => {
    return api.get(`/resources/${id}`);
  },

  // ADMIN endpoints
  getAdminResources: (params) => {
    return api.get("/admin/resources", {
      params: {
        page: 0,
        size: 50,
        ...(params || {}),
      },
    });
  },
  createResource: (data, imageFile) => {
    const formData = new FormData();
    formData.append(
      "resource",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return api.post("/admin/resources", formData);
  },
  updateResource: (id, data, imageFile) => {
    const formData = new FormData();
    formData.append(
      "resource",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return api.put(`/admin/resources/${id}`, formData);
  },
  updateResourceStatus: (id, status) => {
    return api.patch(`/admin/resources/${id}/status`, null, {
      params: { status },
    });
  },
  deleteResource: (id) => {
    return api.delete(`/admin/resources/${id}`);
  },
  addReview: (resourceId, data) => {
    return api.post(`/resources/${resourceId}/reviews`, data);
  },
};
