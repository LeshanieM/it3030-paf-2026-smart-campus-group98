import axiosInstance from '../../../api/axiosInstance';

const studentMaintenanceApi = axiosInstance;


export const getDashboardSummary = async () => {
  const response = await studentMaintenanceApi.get('/user/dashboard-summary');
  return response.data;
};

export const getMyRequests = async () => {
  const response = await studentMaintenanceApi.get('/requests/my');
  return response.data;
};

export const getResources = async () => {
  const response = await studentMaintenanceApi.get('/resources');
  return response.data;
};

export const getRequestDetails = async (requestId) => {
  const response = await studentMaintenanceApi.get(`/requests/${requestId}`);
  return response.data;
};

export const getNotifications = async () => {
  const response = await studentMaintenanceApi.get('/user/notifications');
  return response.data;
};

export const createMaintenanceRequest = async (payload) => {
  const formData = new FormData();
  formData.append('title', payload.title.trim());
  formData.append('description', payload.description.trim());
  formData.append('location', payload.location.trim());
  if (payload.room) {
    formData.append('room', payload.room.trim());
  }
  formData.append('category', payload.category);
  formData.append('priority', payload.priority);
  if (payload.preferredContact) {
    formData.append('preferredContact', payload.preferredContact.trim());
  }
  if (payload.email) {
    formData.append('email', payload.email.trim());
  }

  if (payload.attachments && payload.attachments.length > 0) {
    payload.attachments.forEach(file => {
      formData.append('attachments', file);
    });
  }

  const response = await studentMaintenanceApi.post('/requests', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const cancelMaintenanceRequest = async (requestId) => {
  const response = await studentMaintenanceApi.patch(`/requests/${requestId}/cancel`);
  return response.data;
};

export const addComment = async (requestId, payload) => {
  const response = await studentMaintenanceApi.post(`/requests/${requestId}/comments`, payload);
  return response.data;
};

export const editComment = async (requestId, commentId, payload) => {
  const response = await studentMaintenanceApi.put(`/requests/${requestId}/comments/${commentId}`, payload);
  return response.data;
};

export const deleteComment = async (requestId, commentId) => {
  const response = await studentMaintenanceApi.delete(`/requests/${requestId}/comments/${commentId}`);
  return response.data;
};

export default studentMaintenanceApi;
