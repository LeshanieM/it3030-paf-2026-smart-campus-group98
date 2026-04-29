import axiosInstance from '../api/axiosInstance';

export const resourceService = {
  // Get all available resources for dropdown
  getAllResources: async () => {
    const response = await axiosInstance.get('/resources');
    return response.data;
  },
};

export default resourceService;
