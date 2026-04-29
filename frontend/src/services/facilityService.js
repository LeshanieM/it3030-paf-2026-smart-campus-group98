import axiosInstance from '../api/axiosInstance';

export const facilityService = {
  getAllResources: async (params, options) => {
    const response = await axiosInstance.get('/resources', {
      params: {
        page: 0,
        size: 50,
        ...(params || {}),
      },
      ...(options || {}),
    });
    return response.data;
  },

  getResourceById: async (id) => {
    const response = await axiosInstance.get(`/resources/${id}`);
    return response.data;
  },
};

export default facilityService;

